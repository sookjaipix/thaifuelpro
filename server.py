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
import threading
import time
import urllib.request
import urllib.error
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SYNC_DB_PATH = os.path.join(DIRECTORY, 'fuel_sync_db.json')
SYNC_LOCK = threading.Lock()


def load_sync_db():
    if not os.path.exists(SYNC_DB_PATH):
        return {
            'logs': [],
            'deletedIds': [],
            'sheetsConfig': {},
            'customPrices': {},
            'updatedAt': 0
        }
    try:
        with open(SYNC_DB_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict):
                data.setdefault('logs', [])
                data.setdefault('deletedIds', [])
                data.setdefault('sheetsConfig', {})
                data.setdefault('customPrices', {})
                data.setdefault('updatedAt', 0)
                return data
    except Exception as e:
        print(f"Warning: failed to read sync DB: {e}")
    return {
        'logs': [],
        'deletedIds': [],
        'sheetsConfig': {},
        'customPrices': {},
        'updatedAt': 0
    }


def save_sync_db(data):
    tmp_path = SYNC_DB_PATH + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, SYNC_DB_PATH)

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

    def do_GET(self):
        if self.path.split('?')[0] == '/api/sync-data':
            with SYNC_LOCK:
                db = load_sync_db()
            self._send_json_response(200, {'success': True, 'data': db})
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync-data':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_length)
                req_data = json.loads(post_body.decode('utf-8'))

                with SYNC_LOCK:
                    db = load_sync_db()

                    if req_data.get('clearAll'):
                        # Explicit clear all logs
                        client_deleted = set(req_data.get('deletedIds', []))
                        server_deleted = set(db.get('deletedIds', []))
                        db['deletedIds'] = list(server_deleted | client_deleted)
                        db['logs'] = []
                    else:
                        server_deleted = set(db.get('deletedIds', []))
                        client_deleted = set(req_data.get('deletedIds', []))
                        all_deleted = server_deleted | client_deleted
                        db['deletedIds'] = list(all_deleted)[-500:]

                        merged_map = {}
                        for item in db.get('logs', []):
                            item_id = item.get('id')
                            if item_id and item_id not in all_deleted:
                                merged_map[item_id] = item

                        for item in req_data.get('logs', []):
                            item_id = item.get('id')
                            if not item_id or item_id in all_deleted:
                                continue
                            existing = merged_map.get(item_id)
                            if not existing:
                                merged_map[item_id] = item
                            else:
                                item_ts = item.get('updatedAt') or item.get('createdAt') or ''
                                exist_ts = existing.get('updatedAt') or existing.get('createdAt') or ''
                                if item_ts >= exist_ts:
                                    merged_map[item_id] = item

                        merged_logs = list(merged_map.values())
                        merged_logs.sort(key=lambda x: x.get('date', ''), reverse=True)
                        db['logs'] = merged_logs

                    # Merge sheetsConfig if provided
                    client_sheets = req_data.get('sheetsConfig')
                    if isinstance(client_sheets, dict) and client_sheets.get('webhookUrl'):
                        db['sheetsConfig'] = {**db.get('sheetsConfig', {}), **client_sheets}

                    # Merge customPrices if provided
                    client_prices = req_data.get('customPrices')
                    if isinstance(client_prices, dict) and client_prices:
                        db['customPrices'] = {**db.get('customPrices', {}), **client_prices}

                    db['updatedAt'] = int(time.time() * 1000)
                    save_sync_db(db)

                self._send_json_response(200, {'success': True, 'data': db})
            except Exception as e:
                self._send_json_response(400, {'success': False, 'error': str(e)})
            return

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
