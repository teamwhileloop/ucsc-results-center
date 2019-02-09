import logger
import hashlib
import os
import downloader
import converter
import traceback
import requests
import re
from urllib.parse import unquote
import pymysql.cursors
import resultcenter
import sys
import manualParse
import time

def GetHashCheckSum(txt):
    hashInput = str(txt)
    return str(hashlib.sha256(hashInput.encode('utf-8')).hexdigest())

def IsPreviouslyProcessed(subject, checksum):
    with connection.cursor() as cursor:
        sql = "SELECT `subject` from `mc_files` WHERE `checksum`=%s AND `subject` = %s;"
        cursor.execute(sql, (checksum, subject))
        return len(cursor.fetchall()) > 0

def AddAsProcessedFile(subject, checksum, dataset = -1):
    with connection.cursor() as cursor:
        sql = "INSERT INTO `mc_files` (`subject`, `checksum`, `timestamp`, `dataset`) VALUES (%s, %s, %s, %s);"
        cursor.execute(sql, (subject, checksum, str(time.time()), int(dataset)))
        connection.commit()

def getPDFList():
    logger.info("Retrieving results sheets from ugvle.ucsc.cmb.ac.lk")
    vlePage = requests.get("http://ugvle.ucsc.cmb.ac.lk/")
    pdfs = []
    lineRegEx = re.findall(
        r'(http:\/\/ugvle.ucsc.cmb.ac.lk\/pluginfile.php\/8988\/block_html\/content\/)(SCS|IS)(%20)?([1-4][0-9]{3})(\.pdf)',
        vlePage.text)
    for tup in lineRegEx:
        pdfs.append("".join(list(tup)))
    return pdfs

def updateSubjectCheckSumRemort(subject, checksum, reason):
    with connection.cursor() as cursor:
        sql = "UPDATE subject SET checksum = %s where code = %s"
        cursor.execute(sql, (checksum, subject))
        logger.info("Saving checksum for " + subject + ". ["+ reason +"]")
        connection.commit()

def stabilizeDatabase(pdfUrlList):
    global unknownSubjects
    changesCount = 0
    for pdfUrl in pdfUrlList:
        subjectCode = os.path.basename(unquote(pdfUrl)).split(".")[0].replace(" ", "")
        logger.info("Checking subject: " + subjectCode)
        pdfhead = None
        try:
            pdfhead = requests.head(pdfUrl)
        except:
            logger.warn("Unable to fetch results sheet using URL: " + pdfUrl)

        if (pdfhead.status_code != 200):
            report = pdfhead.status_code not in [503, 404]
            logger.warn("Request to fetch " + pdfUrl + " returned: " + str(pdfhead.status_code), report)
            continue

        fileHash = GetHashCheckSum(pdfhead.headers['content-length'] + '_' + subjectCode)
        if not IsPreviouslyProcessed(subjectCode, fileHash):
            AddAsProcessedFile(subjectCode, fileHash)
            logger.info("Added new file checksum for subject: " + subjectCode)

        hash = GetHashCheckSum(pdfhead.headers['Last-Modified'])

        if subjectCode not in subjectCheckSums:
            logger.warn("Unknown subject detected: " + subjectCode)
            continue

        if subjectCheckSums[subjectCode] != hash:
            changesCount += 1
            updateSubjectCheckSumRemort(subjectCode, hash, "Stabilize")
            logger.info("Subject Stabilized: " + subjectCode)
    return changesCount


def detectAndApplyChanges(pdfUrlList):
    global unknownSubjects
    tmpmap = {}
    connection.ping(True)
    for pdfUrl in pdfUrlList:
        subjectCode = os.path.basename(unquote(pdfUrl)).split(".")[0].replace(" ", "")
        logger.info("Checking subject: " + subjectCode)
        resultcenter.ping("Scanning " + subjectCode)
        pdfhead = None
        try:
            pdfhead = requests.head(pdfUrl)
        except:
            logger.warn("Unable to fetch results sheet using URL: " + pdfUrl, True)

        if (pdfhead.status_code != 200):
            report = pdfhead.status_code not in [503, 404]
            logger.warn("Request to fetch " + pdfUrl + " returned: " + str(pdfhead.status_code), report)
            continue

        hash = GetHashCheckSum(pdfhead.headers['Last-Modified'])
        fileHash = GetHashCheckSum(pdfhead.headers['content-length'] + '_' + subjectCode)

        if subjectCode not in subjectCheckSums:
            if subjectCode not in unknownSubjects:
                logger.warn("Unknown subject detected: " + subjectCode, True)
                unknownSubjects.append(subjectCode)
            else:
                logger.info("Skipping unknown subject: " + subjectCode)
            continue

        if subjectCheckSums[subjectCode] == None:
            subjectCheckSums[subjectCode] = hash
            updateSubjectCheckSumRemort(subjectCode, hash, "None")
            subjectCheckSums[subjectCode] = hash

        if subjectCheckSums[subjectCode] != hash:
            if IsPreviouslyProcessed(subjectCode, fileHash):
                updateSubjectCheckSumRemort(subjectCode, hash, "Checksum Update")
                continue

            logger.info("Changes detected for " + subjectCode)
            try:
                xmlData = downloader.getXML(pdfUrl)
                jsonData = converter.jsonGenerator(xmlData, pdfUrl)
                dataSetId = resultcenter.submitDataSet(jsonData)
                if dataSetId:
                    updateSubjectCheckSumRemort(subjectCode, hash, "Update")
                else:
                    logger.crit("Failed to submit dataset: " + subjectCode, True)
                subjectCheckSums[subjectCode] = hash
                AddAsProcessedFile(subjectCode, fileHash, dataSetId)
            except Exception as error:
                logger.crit(subjectCode + ": " + str(error))
                traceback.print_exc()
    return tmpmap


def fetchFromDB(map):
    logger.info("Fecthing previous checksums from Database")
    with connection.cursor() as cursor:
        sql = "SELECT code, checksum FROM subject;"
        cursor.execute(sql)
        for result in cursor.fetchall():
            map[result['code']] = result['checksum']


logger.info("Starting Monitoring Client")
manualMode = False
stabilizeMode = False
if (len(sys.argv) == 1):
    logger.announceLogFile(True)
    resultcenter.ping("Starting")
else:
    logger.announceLogFile(False)
    if sys.argv[1] == 'stabilize':
        stabilizeMode = True
    else:
        logger.info('Starting in manual mode')
        manualMode = True

connection = pymysql.connect(host=os.environ['AWS_RDB_HOST'],
                                 user=os.environ['AWS_RDB_USERNAME'],
                                 password=os.environ['AWS_RDB_PASSWORD'],
                                 db=os.environ['AWS_RDB_DATABASE'],
                                 charset='utf8mb4',
                                 cursorclass=pymysql.cursors.DictCursor)
if connection.open == False:
    logger.crit("Failed to connect to the database", True)
    exit(1)
logger.info("Connected to database")
subjectCheckSums = {}
fetchFromDB(subjectCheckSums)
waitTime = os.environ['MONIT_WAIT_TIME']
if (manualMode == False and stabilizeMode == False):
    logger.info("Wait time is: " + waitTime)

unknownSubjects = []
itterationNumber = 1

# Manual Mode
if manualMode:
    manualParse.manualRun(logger, subjectCheckSums, sys.argv[1], connection)
    exit(0)

# Stabilize Mode
if stabilizeMode:
    logger.info('Stabilizing database')
    pdfUrlList = None
    try:
        pdfUrlList = getPDFList()
        if (pdfUrlList != None):
            count = stabilizeDatabase(pdfUrlList)
            logger.info("Stabilization completed. {c} Subjects stabilized.".format(c=count))
            exit(0)
        else:
            logger.crit("PDF list resturned None")
            exit(1)
    except Exception as e:
        print (e)
        logger.crit("Failed to fetch result sheets from UGVLE. Stabilization Failed")
        exit(1)

logger.info("Monitoring client Activated.", True)
while True:
    converter.clearAffectedIndexes()
    resultcenter.ping("Initializing Scan")
    logger.info("Scanning for changes. Itteration number: #" + str(itterationNumber))
    pdfUrlList = None
    nextScan = 0
    try:
        pdfUrlList = getPDFList()
    except:
        logger.warn("Failed to fetch result sheets from UGVLE", True)

    if (pdfUrlList != None):
        detectAndApplyChanges(pdfUrlList)
        logger.info("Scan completed.")
        if len(converter.affectedIndexes) > 0:
            converter.affectedIndexes = list(set(converter.affectedIndexes))
            logger.info("Following indexes requires recalculation: " + str(converter.affectedIndexes))
            for pattern in converter.affectedIndexes:
                logger.info("Recalculating for pattern: " + str(pattern))
                resultcenter.recalculate(pattern)
        nextScan = int(waitTime)
    else:
        nextScan = 60
    itterationNumber += 1
    logger.info("Running next scan in " + str(nextScan) + "s")
    for i in range(nextScan):
        resp = resultcenter.ping("Next scan in " + str(nextScan - i) + "s")
        if (resp == "100"):
            logger.info("Running a force scan")
            break
        time.sleep(1)


exit(0)