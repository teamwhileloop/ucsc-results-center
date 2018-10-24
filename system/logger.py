from time import gmtime, strftime


def getTimeStamp():
    return strftime("%Y/%m/%d | %H:%M:%S", gmtime())


def info(message):
    logAndWrite(getTimeStamp(), " | INFO | ", message)


def warn(message):
    logAndWrite(getTimeStamp(), " | WARN | ", message)


def crit(message):
    logAndWrite(getTimeStamp(), " | CRIT | ", message)

def logAndWrite(timestamp, code, message):
    print(timestamp + code + message)
    f = open(logFile, 'a+')
    f.write(timestamp + code + message + '\n')
    f.close()

logFile = "ucscresults.monitor." + strftime("%Y%m%d.%H%M%S", gmtime()) + ".log"
info("Logging to: " + logFile)