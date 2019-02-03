from time import gmtime, strftime
import os
import reporter

def getTimeStamp():
    return strftime("%Y/%m/%d | %H:%M:%S", gmtime())


def info(message, sendReport=False):
    logAndWrite(getTimeStamp(), " | INFO | ", message)
    if sendReport:
        reporter.report('info', message)

def warn(message, sendReport=False):
    logAndWrite(getTimeStamp(), " | WARN | ", message)
    if sendReport:
        reporter.report('warn', message)


def crit(message, sendReport=False):
    logAndWrite(getTimeStamp(), " | CRIT | ", message)
    if sendReport:
        reporter.report('crit', message)

def logAndWrite(timestamp, code, message):
    print(timestamp + code + message)
    f = open(logFile, 'a+')
    f.write(timestamp + code + message + '\n')
    f.close()

def announceLogFile(sendReport = True):
    info("Logging to: " + logFileName, sendReport)

logDir = "logs"

if not os.path.exists(logDir):
    os.makedirs(logDir)

logFileName = "ucscresults.monitor." + strftime("%Y%m%d.%H%M%S", gmtime()) + ".log"
logFile = logDir + '/' + logFileName