import http.server, os
SITE = '/home/claude/mbsweets.github.io'
APP = '/home/claude/mb-sweets'


class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        if p.startswith('/mb-sweets/'):
            return os.path.join(APP, p[len('/mb-sweets/'):])
        return os.path.join(SITE, p.lstrip('/'))

    def log_message(self, *a):
        pass

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(open(SITE + '/404.html', 'rb').read())
            return
        super().send_error(code, message, explain)


http.server.ThreadingHTTPServer(('127.0.0.1', 8766), H).serve_forever()
