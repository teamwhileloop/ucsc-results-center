import hashlib
import os
import downloader
import converter
import traceback
import requests
import re
from urllib.parse import unquote
import logger
import time
import pymysql.cursors
import resultcenter

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

def detectAndApplyChanges(pdfUrlList):
    tmpmap = {}
    connection.ping(True)
    for pdfUrl in pdfUrlList:
        subjectCode = os.path.basename(unquote(pdfUrl)).split(".")[0].replace(" ", "")
        logger.info("Checking subject: " + subjectCode)
        pdfhead = requests.get(pdfUrl)
        hashInput = str(pdfhead.headers['Last-Modified'])
        hash = (hashlib.sha256(hashInput.encode('utf-8')).hexdigest())

        if subjectCode not in subjectCheckSums:
            logger.warn("Unknown subject: " + subjectCode)
            continue

        if subjectCheckSums[subjectCode] == None:
            subjectCheckSums[subjectCode] = hash
            updateSubjectCheckSumRemort(subjectCode, hash, "None")

        if subjectCheckSums[subjectCode] != hash:
            logger.info("Changes detected for " + subjectCode)
            try:
                xmlData = downloader.getXML(pdfUrl)
                jsonData = converter.jsonGenerator(xmlData, pdfUrl)
                if resultcenter.submitDataSet(jsonData):
                    updateSubjectCheckSumRemort(subjectCode, hash, "Update")
                subjectCheckSums[subjectCode] = hash
            except Exception as error:
                print("ERROR" + str(error))
                traceback.print_exc()
    return tmpmap


def fetchFromDB(map):
    logger.info("Fecthing previous checksums from Database")
    with connection.cursor() as cursor:
        sql = "SELECT code, checksum FROM results.subject;"
        cursor.execute(sql)
        for result in cursor.fetchall():
            map[result['code']] = result['checksum']



logger.info("Initializing loadup")
connection = pymysql.connect(host=os.environ['AWS_RDB_HOST'],
                                 user=os.environ['AWS_RDB_USERNAME'],
                                 password=os.environ['AWS_RDB_PASSWORD'],
                                 db=os.environ['AWS_RDB_DATABASE'],
                                 charset='utf8mb4',
                                 cursorclass=pymysql.cursors.DictCursor)
if connection.open == False:
    logger.crit("Failed to connect to the database")
    exit(1)
logger.info("Connected to database")
subjectCheckSums = {}
fetchFromDB(subjectCheckSums)
waitTime = os.environ['MONIT_WAIT_TIME']
logger.info("Wait time is: " + waitTime)
itterationNumber = 1
while True:
    converter.clearAffectedIndexes()
    logger.info("Scanning for changes. Itteration number: #" + str(itterationNumber))
    detectAndApplyChanges(getPDFList())
    logger.info("Scan completed.")
    if len(converter.affectedIndexes) > 0:
        logger.info("Following indexes requires recalculation: " + str(converter.affectedIndexes))
        for pattern in converter.affectedIndexes:
            logger.info("Recalculating for pattern: " + str(pattern))
            resultcenter.recalculate(pattern)
    itterationNumber += 1
    time.sleep(int(waitTime))


exit(0)