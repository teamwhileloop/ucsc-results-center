import requests
import os
import logger

def submitDataSet(datasetJSON):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    # return True # DEBUG SKIP
    resp = requests.post('https://www.ucscresult.com/admin/result/dataset', data=datasetJSON, headers=headers)
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
    resp = requests.post('https://www.ucscresult.com/admin/calculate/pattern/' + pattern, headers=headers)
    if (resp.status_code == 200):
        logger.info("Recalculation for pattern " + pattern + " complted. " + resp.text)
        return True
    logger.crit("Recalculation for pattern " + pattern + " failed. " + resp.text)
    return False