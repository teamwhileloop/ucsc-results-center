import os
import reporter

from http.server import BaseHTTPRequestHandler, HTTPServer

def report(type, msg):
    reporter.report(type, msg, 'Backup Manager')


class BackupServerWeb(BaseHTTPRequestHandler):
    backupFunction = None
    secureDeleteFunction = None
    challengeCode = os.environ['CHALLENGE_CODE']

    def do_HEAD(self):
        print (4)
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        if not self.PreAuth():
            self.respond({'status': 400})
            return

        if self.path == '/backup':
            self.RunOnDemanBackup()
            self.respond({'status': 200})
        else:
            self.respond({'status': 500})

    def handle_http(self, status_code, path):
        self.send_response(status_code)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        return bytes('', 'UTF-8')

    def respond(self, opts):
        response = self.handle_http(opts['status'], self.path)
        self.wfile.write(response)

    def PreAuth(self):
        if 'challenge' not in self.headers or 'name' not in self.headers:
            return False
        return BackupServerWeb.challengeCode == self.headers['challenge']

    def RunOnDemanBackup(self):
        fileName = BackupServerWeb.backupFunction(self.headers['name'])
        BackupServerWeb.secureDeleteFunction(fileName + '.sql', 3)
        report('info', 'On-demand backup successful [{fn}]'.format(fn=fileName))