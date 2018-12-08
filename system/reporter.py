import requests
import os
import json

domain = "http://127.0.0.1"
if 'DEV_MODE' in os.environ:
    domain = "http://127.0.0.1:3000"

def report(type, text):
    headers = {
        'accessToken': os.environ['RESCENT_ACCESS_TOKEN'],
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.post(domain + '/admin/monitoring/report', data=json.dumps({
            'type': type,
            'text': text
        }, sort_keys=False, indent=4, separators=(',', ':')), headers=headers)
        if (resp.status_code != 200):
            print ("Failed to submit report. [Bad Response]")
        return resp.text
    except:
        print ("Failed to submit report. [Connection Error]")
        return None