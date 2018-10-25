import requests
import os
import logger
import json

#domain = "https://www.ucscresult.com"
domain = "http://127.0.0.1"
if 'DEV_MODE' in os.environ:
    logger.info("Developer Testing Environment detected")
    domain = "http://127.0.0.1:3000"


def submitDataSet(datasetJSON):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    # return True # DEBUG SKIP
    resp = requests.post(domain + '/admin/result/dataset', data=datasetJSON, headers=headers)
    if (resp.status_code == 200):
        logger.info("Dataset submitted. " + resp.text)
        return True
    logger.crit("Dataset submission failed: " + resp.text)
    return False

def recalculate(pattern):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    resp = requests.post(domain + '/admin/calculate/pattern/' + pattern, headers=headers)
    if (resp.status_code == 200):
        logger.info("Recalculation for pattern " + pattern + " complted. " + resp.text)
        return True
    logger.crit("Recalculation for pattern " + pattern + " failed. " + resp.text)
    return False

def ping(status):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.post(domain + '/admin/monitoring/ping', data=json.dumps({
           'status': status
        }, sort_keys=False, indent=4, separators=(',', ':')), headers=headers)
        if (resp.status_code != 200):
            logger.warn("Ping missed. [Bad Response]")
    except:
        logger.warn("Ping missed. [Connection Error]")
