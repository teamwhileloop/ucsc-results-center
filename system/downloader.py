import requests
import re
import random
import string
import json
import time
import logger
import resultcenter


def id_generator(size=12, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size)).lower()


def getXML(url):
    resultcenter.ping("Processing result sheet")
    logger.info("Resolving: " + url)
    session = requests.Session()

    pageLoad = session.get('https://www.freefileconvert.com')
    searchObj = re.search( r'( <meta name="csrf-token" content=")(\w{2,})(">)', str(pageLoad.content))

    accessToken = ""
    if searchObj:
       accessToken = searchObj.group()[34:-2]
    else:
       logger.crit("Unable to fetch the access token.")
       raise Exception('Unable to fetch the access token.')


    logger.info("Using token: " + accessToken)
    headers = {
        "Origin":"https://www.freefileconvert.com",
        "Accept-Encoding":"gzip, deflate, br",
        "X-CSRF-TOKEN":accessToken,
        "Accept":"application/json, text/javascript, */*; q=0.01",
        "Referer":"https://www.freefileconvert.com/",
        "X-Requested-With":"XMLHttpRequest",
        "Connection":"keep-alive"
    }
    progressKey = id_generator()
    logger.info("Using progress key: " + progressKey)
    payload = {
        "_token":accessToken,
        "url":url,
        "output_format":"xml",
        "progress_key":progressKey,
        }
    resultcenter.ping("Processing result sheet")
    xmlRequest = session.post('https://www.freefileconvert.com/file/url', data=payload, headers=headers)
    parsedJSON = json.loads("" + xmlRequest.content.strip().decode('utf-8'))
    if (parsedJSON['status'] == "success"):
        fileURL = 'https://www.freefileconvert.com/file/' + parsedJSON['id'] + '/download'
        logger.info("Reading XML: " + fileURL)
        logger.info("Waiting for the PDF -> XML conversion to finish")
        while True:
            resultcenter.ping("Processing result sheet")
            statusResp = session.get("https://www.freefileconvert.com/file/"+parsedJSON['id']+"/status", headers=headers)
            if "Success" in statusResp.content.strip().decode('utf-8'):
                break
                logger.info(statusResp.content)
            time.sleep(1)
        logger.info("Fetching XML translation")
        xml = session.get(fileURL, headers=headers)
        return xml.content.strip().decode('utf-8')
    else:
        logger.crit("Error occured: " + parsedJSON['error'])
        raise Exception("Error occured: " + parsedJSON['error'])