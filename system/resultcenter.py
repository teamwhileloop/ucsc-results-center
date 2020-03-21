import requests
import os
import logger
import json

#domain = "https://www.ucscresult.com"
domain = "http://127.0.0.1"
if 'DEV_ENV' in os.environ and os.environ['DEV_ENV'].lower() == 'true':
    logger.info("Developer Testing Environment detected")
    domain = "http://127.0.0.1:3000"


def submitDataSet(datasetJSON):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json',
        'internal': '1'
    }
    # return True # DEBUG SKIP
    resp = requests.post(domain + '/admin/result/dataset', data=datasetJSON, headers=headers)
    if (resp.status_code == 200):
        logger.info("Dataset submitted. " + resp.text)
        return int(resp.headers['datasetId'])
    logger.crit("Dataset submission failed: " + resp.text)
    return False


def publishFacebookPost():
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json',
        'internal': '1'
    }
    resp = requests.post(domain + '/admin/result/facebook/publish', data='', headers=headers)
    if (resp.status_code == 200):
        logger.info("Facebook Post Published")
        return True
    logger.warn("Unbale to publish Facebook Post")
    return False

def recalculate(pattern):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json',
        'internal': '1'
    }
    resp = requests.post(domain + '/admin/calculate/pattern/' + pattern, headers=headers)
    if (resp.status_code == 200):
        logger.info("Recalculation for pattern " + pattern + " complted. " + resp.text)
        return True
    logger.crit("Recalculation for pattern " + pattern + " failed. " + resp.text)
    return False

def ping(status, killLock = '-1'):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json',
        'kill-lock': killLock
    }
    try:
        resp = requests.post(domain + '/admin/monitoring/ping', data=json.dumps({
           'status': status
        }, sort_keys=False, indent=4, separators=(',', ':')), headers=headers)
        if (resp.status_code != 200):
            logger.warn("Ping missed. [Bad Response]")
        return resp.text
    except:
        logger.warn("Ping missed. [Connection Error]")
        return None

def report(type, text):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.post(domain + '/admin/monitoring/ping', data=json.dumps({
            'type': type,
            'text': text
        }, sort_keys=False, indent=4, separators=(',', ':')), headers=headers)
        if (resp.status_code != 200):
            logger.warn("Failed to submit report. [Bad Response]")
        return resp.text
    except:
        logger.warn("Failed to submit report. [Connection Error]")
        return None