import re
import random
import json
import xml.etree.ElementTree
import os
from urllib.parse import unquote
import logger


def getFontResultIndex(txt):
    lineRegEx = re.search('font="[0-9]"(.*)>[1-9]{1}[0-9]{1}(00|02)[0-9]{4}<', txt)
    lineRegEx = re.search('font="[0-9]"', lineRegEx.group(0))
    return lineRegEx.group(0)[6:7]

def getExaminationYear(txt):
    lineRegEx = re.search('font="[0-9]"(.*)>[0-9]{4}<', txt)
    lineRegEx = re.search('>[0-9]{4}<', lineRegEx.group(0))
    year = lineRegEx.group(0)[1:-1]
    if int(year) > 2015 and int(year) < 2050:
        logger.info("Examination year detected as: " + str(year))
        return year
    logger.crit("Failed to detect examination year")
    return "####"

def brain(txt):
    def tryParse(data):
        try:
            return int(data)
        except ValueError:
            return 0

    txt = txt.strip()
    grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E', 'F']
    if (len(txt) == 8):
        return {'index': txt}
    elif (txt in grades):
        return {'grade': txt}
    elif (tryParse(txt)):
        return {'counter': int(txt)}
    elif (txt.count(' ') > 0):
        comp = {}
        for item in map(brain, txt.split(' ')):
            comp.update(item)
        return comp


def writeToFile(filePath, data):
    logger.info('Exporting to ' + filePath + '.json')
    f = open(filePath + '.json', 'w')
    f.write(data)
    f.close()

def jsonGenerator(xmlData, url):
    indexStack = []
    resultStack = []
    affected = []

    logger.info('XML -> JSON conversion started')

    root = xml.etree.ElementTree.fromstring(xmlData)
    xmlString = xml.etree.ElementTree.tostring(root, encoding='utf8', method='xml').strip().decode('utf-8')
    fontIndex = getFontResultIndex(xmlString)
    for text in root.findall(".//text[@font='" + fontIndex + "']"):
        result = brain(text.text)
        if 'index' in result:
            indexStack.append(result['index'])
        elif 'grade' in result:
            resultStack.append(result['grade'])

    if (len(indexStack) == len(resultStack)):
        output = {}
        logger.info('Stack lengths matched')
        output['data'] = {}
        for i in range(len(indexStack)):
            if int(str(indexStack[i])[:2]) > 13:
                output['data'][indexStack[i]] = resultStack[i]
                if str(indexStack[i])[:4] not in affected:
                    affected.append(str(indexStack[i])[:4])
                    affectedIndexes.append(str(indexStack[i])[:4])
        output['total'] = len(output['data'])
        output['affected'] = affected
        output['year'] = getExaminationYear(xmlString)
        filePath = os.path.basename(unquote(url)).split(".")[0].replace(" ", "")
        output['subject'] = filePath
        jsonOutput = json.dumps(output, sort_keys=False, indent=4, separators=(',', ':'))
        writeToFile(filePath, jsonOutput)
        logger.info('Affected index patterns: ' + str(affected))
        logger.info('XML -> JSON conversion success')
        return jsonOutput
    else:
        logger.crit('Task Failed. Length mismatch')
        raise Exception("Error occured: Task Failed. Length mismatch")


def clearAffectedIndexes():
    affectedIndexes.clear()

affectedIndexes = []