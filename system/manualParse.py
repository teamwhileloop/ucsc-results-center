import hashlib
import os
import downloader
import converter
import traceback
import requests
from urllib.parse import unquote
import resultcenter
import time

def IsPreviouslyProcessed(connection, subject, checksum):
    with connection.cursor() as cursor:
        sql = "SELECT `subject` from `mc_files` WHERE `checksum`=%s AND `subject` = %s;"
        cursor.execute(sql, (checksum, subject))
        return len(cursor.fetchall()) > 0


def AddAsProcessedFile(connection, subject, checksum, dataset):
    with connection.cursor() as cursor:
        sql = "INSERT INTO `mc_files` (`subject`, `checksum`, `timestamp`, `dataset`) VALUES (%s, %s, %s, %s);"
        cursor.execute(sql, (subject, checksum, str(time.time()), int(dataset)))
        connection.commit()


def manualRun(logger, subjectCheckSums, pdfUrl, connection):
    logger.info("Manually parsing " + pdfUrl)
    subjectCode = os.path.basename(unquote(pdfUrl)).split(".")[0].replace(" ", "")
    logger.info("Checking subject: " + subjectCode)
    pdfhead = None
    try:
        pdfhead = requests.get(pdfUrl)
    except:
        logger.warn("Unable to fetch results sheet using URL: " + pdfUrl)

    if (pdfhead.status_code != 200):
        logger.warn("Request to fetch " + pdfUrl + " returned: " + str(pdfhead.status_code))

    hashInput = str(pdfhead.headers['Last-Modified'])
    hash = (hashlib.sha256(hashInput.encode('utf-8')).hexdigest())

    hashInput = str(pdfhead.headers['content-length'] + '_' + subjectCode)
    fileHash = (hashlib.sha256(hashInput.encode('utf-8')).hexdigest())

    if (IsPreviouslyProcessed(connection, subjectCode, fileHash)):
        logger.crit("Previously processed file.")
        validInp = False
        while not validInp:
            print ('')
            prompt = input(">>> Previously processed file detected. Continue ? [Y\\N]: ")
            prompt = prompt.lower()
            print ('')
            if prompt == 'y':
                validInp = True
            elif prompt == 'n':
                logger.info("Aborted!")
                exit(0)
            else:
                logger.warn("Invalid user input")

    if subjectCode not in subjectCheckSums:
        logger.warn("Unknown subject: " + subjectCode)
        subjectCode = input("\n>>> Please Enter Subject Code: ")
        print('')

    if subjectCheckSums[subjectCode] == hash:
        logger.crit("Already automatically processed.")
        return

    logger.info("Processing: " + subjectCode)
    try:
        xmlData = downloader.getXML(pdfUrl, True)
        jsonData = converter.jsonGenerator(xmlData, pdfUrl, subjectCode)
        logger.info("Ready to commit dataset")
        validInp = False
        while not validInp:
            print ('')
            prompt = input(">>> Commit dataset? [Y\\N]: ")
            prompt = prompt.lower()
            print ('')
            if prompt == 'y':
                logger.info("Commiting dataset")
                validInp = True
            elif prompt == 'n':
                logger.info("Aborted! Dataset was not committed")
                exit(0)
            else:
                logger.warn("Invalid user input")
        dataSetId = resultcenter.submitDataSet(jsonData)
        if dataSetId:
            AddAsProcessedFile(connection, subjectCode, fileHash, dataSetId)
            logger.info("Dataset Committed (@id:{id})".format(id=dataSetId))
        else:
            logger.crit("Failed to commit dataset")
            exit(1)
    except Exception as error:
        print("ERROR" + str(error))
        traceback.print_exc()
        return

    if len(converter.affectedIndexes) > 0:
        converter.affectedIndexes = list(set(converter.affectedIndexes))
        logger.info("Following indexes requires recalculation: " + str(converter.affectedIndexes))
        for pattern in converter.affectedIndexes:
            logger.info("Recalculating for pattern: " + str(pattern))
            resultcenter.recalculate(pattern)
    logger.info("Done")