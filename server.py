#!/usr/bin/env python3
"""
Thai Fuel Tracker Pro - Local Web Server
Runs a local HTTP server to serve the application for desktop and mobile testing.
"""

import http.server
import socketserver
import os
import sys
import json
import urllib.request
import urllib.error
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/sync-sheets':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_length)
                req_data = json.loads(post_body.decode('utf-8'))

                webhook_url = req_data.get('webhookUrl')
                payload = req_data.get('payload', {})

                if not webhook_url:
                    self._send_json_response(400, {'success': False, 'error': 'Missing webhookUrl'})
                    return

                # Forward request to Google Apps Script Web App
                encoded_payload = json.dumps(payload).encode('utf-8')
                proxy_req = urllib.request.Request(
                    webhook_url,
                    data=encoded_payload,
                    headers={'Content-Type': 'application/json'}
                )

                # Google Apps Script redirects with 302 to script.googleusercontent.com
                # urllib follows redirects automatically
                with urllib.request.urlopen(proxy_req, timeout=20) as response:
                    resp_content = response.read().decode('utf-8')
                    try:
                        resp_json = json.loads(resp_content)
                    except Exception:
                        resp_json = {'status': 'ok', 'raw': resp_content}
                    self._send_json_response(200, {'success': True, 'result': resp_json})

            except urllib.error.HTTPError as he:
                self._send_json_response(200, {'success': False, 'error': f'Google Apps Script HTTP {he.code}: {he.reason}'})
            except urllib.error.URLError as ue:
                self._send_json_response(200, {'success': False, 'error': f'Network error: {ue.reason}'})
            except Exception as e:
                self._send_json_response(200, {'success': False, 'error': str(e)})
            return

        super().do_POST()

    def _send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def run_server(port=PORT):
    socketserver.TCPServer.allow_reuse_address = True
    for p in [port, 8081, 8000, 3000]:
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                print("=" * 60)
                print(f"🚀 Thai Fuel Tracker Pro Server กำลังทำงาน")
                print(f"🌐 เปิดใช้งานผ่านคอมพิวเตอร์: http://localhost:{p}")
                print(f"📱 เปิดใช้งานผ่านมือถือ (วง Wi-Fi เดียวกัน): http://<IP_เครื่องคอมพิวเตอร์>:{p}")
                print(f"📁 โฟลเดอร์: {DIRECTORY}")
                print("=" * 60)
                print("กด Ctrl+C เพื่อหยุดการทำงานของเซิร์ฟเวอร์")
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\n🛑 หยุดการทำงานของเซิร์ฟเวอร์เรียบร้อย")
                    sys.exit(0)
        except OSError:
            print(f"พอร์ต {p} ไม่ว่าง กำลังลองพอร์ตถัดไป...")
            continue

if __name__ == '__main__':
    run_server()
