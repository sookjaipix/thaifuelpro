#!/usr/bin/env python3
"""
Thai Fuel Tracker Pro - Local Web Server
Runs a local HTTP server to serve the application for desktop and mobile testing.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run_server(port=PORT):
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
