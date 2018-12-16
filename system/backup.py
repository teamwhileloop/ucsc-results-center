import time
import reporter
import subprocess
import os
import datetime

backupLocation = os.environ['SQL_BACKUP_DIR']

def report(type, msg):
    reporter.report(type, msg, 'Backup Manager')

def runBackup():
    global backupLocation
    filename = time.strftime("backup.%Y%m%d%H%M%S", time.gmtime())
    with open(filename + '.sql', 'w') as out:
        subprocess.call(
            'mysqldump -u {username} -p{passwd} -h {host} --all-databases'.format(
                username=os.environ['AWS_RDB_USERNAME'],
                passwd=os.environ['AWS_RDB_PASSWORD'],
                host=os.environ['AWS_RDB_HOST']
            ).split(' '), stdout=out)
        out.close()
        subprocess.call('openssl enc -aes-256-cbc -salt -in {fn} -out {bkdir}/{of} -k {passwd}'.format(
            fn=filename + '.sql',
            of=filename + '.enc',
            bkdir=backupLocation,
            passwd=os.environ['AWS_RDB_PASSWORD']
        ).split(' '))
    return filename

def secure_delete(path, passes=1):
    with open(path, "ba+") as delfile:
        length = delfile.tell()
        for i in range(passes):
            delfile.seek(0)
            delfile.write(os.urandom(length))
    os.remove(path)


report('info', 'Service started. Exporting to: ' + backupLocation)
day = None
while True:
    filename = None
    now = datetime.datetime.now()
    if day != now.day:
        print('Running daily backup')
        try:
            filename = runBackup()
            report('info', 'Daily backup successful [{fn}]'.format(fn=filename))
            print('Daily backup successful [{fn}]'.format(fn=filename))
            day = now.day
        except:
            report('warn', 'Failed to backup database')
        finally:
            if filename is not None:
                secure_delete(filename + '.sql', 3)
                print('Secure deletion successful [{fn}]'.format(fn=filename))
        print('Done')
    time.sleep(3600)