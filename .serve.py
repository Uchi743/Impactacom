import http.server, socketserver, os, sys
PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))
class SPA(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and "." not in os.path.basename(self.path):
            self.path = "/index.html"
        return super().do_GET()
os.chdir(ROOT)
with socketserver.TCPServer(("", PORT), SPA) as httpd:
    print(f"Serving on http://localhost:{PORT} (SPA fallback enabled)")
    httpd.serve_forever()
