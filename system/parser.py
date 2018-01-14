import xml.etree.ElementTree
import json
import re
import os
import random

def getFontIndex(txt):
    lineRegEx = re.search('font="[0-9]"(.*)>[1-9]{1}[0-9]{1}(00|02)[0-9]{4}<', txt)
    lineRegEx = re.search('font="[0-9]"', lineRegEx.group(0))
    return lineRegEx.group(0)[6:7]

def brain(txt):
    def tryParse(data):
        try:
            return int(data)
        except ValueError:
            return 0

    def validateIndex(indexNumber):
        return None
    
    txt = txt.strip()
    grades = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E','F']
    if (len(txt) == 8):
        return {'index' : txt }
    elif (txt in grades):
        return {'grade' : txt }
    elif (tryParse(txt)):
        return {'counter' : int(txt)}
    elif (txt.count(' ') > 0):
        comp = {}
        for item in map(brain,txt.split(' ')):
            comp.update(item)
        return comp

def jsonGenerator(filePath, skipValidation):
    indexStack = []
    resultStack = []
    affected = []

    
    print 'Executing on', filePath 
    root = xml.etree.ElementTree.parse(filePath).getroot()
    fontIndex = getFontIndex(xml.etree.ElementTree.tostring(root, encoding='utf8', method='xml'))
    for text in root.findall(".//text[@font='" + fontIndex + "']"):
        result = brain(text.text)
        if 'index' in result:
            indexStack.append(result['index'])
        elif 'grade' in result:
            resultStack.append(result['grade'])

    if (len(indexStack) == len(resultStack)):
        output = {}
        print '\tStack lengths matched'
        output['data'] = {}
        for i in range(len(indexStack)):
            if int(str(indexStack[i])[:2]) > 13:
                output['data'][indexStack[i]] = resultStack[i]  
                if str(indexStack[i])[:4] not in affected:
                    affected.append(str(indexStack[i])[:4])
        output['total'] = len(output['data'])
        output['affected'] = affected
        if (not skipValidation):
            print '\tValidation challenge :\n'
            indexList = output['data'].keys()
            for testcase in range(max(1,len(indexList)//10)):
                testIndex = indexList[random.randint(0,len(indexList) - 1)]
                print '\t\t', testIndex, '\t',output['data'][testIndex]
            if (raw_input('\n\t Valid? [Y\N] ') != 'Y'):
                print('\t\033[;41m\tTask Failed. Validtion failure\t\033[0m')
                return
        print '\tExporting to ' + os.path.basename(filePath) + '.json'
        f = open(os.path.basename(filePath) + '.json','w')
        f.write(json.dumps(output))
        f.close()
        print '\tAffected index patterns :' , affected
        print('\t\033[;42m\tSuccessfully completed.\t\t \033[0m')
    else:
        print('\t\033[;41m\tTask Failed. length mismatch\t\033[0m')
        

curdir = os.getcwd()
for file in os.listdir(curdir):
    if file.endswith(".xml"):
        try:
            jsonGenerator(os.path.join(curdir, file), False)
        except Exception as inst:
            print '\t' , inst
            print('\t\033[;41m\tTask Failed. Internal Error\t\033[0m')
