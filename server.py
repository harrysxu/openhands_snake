#!/usr/bin/env python3
"""
简单的HTTP服务器用于运行贪吃蛇游戏
"""

import http.server
import socketserver
import os
import sys

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头部以支持跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=12000):
    """运行HTTP服务器"""
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("0.0.0.0", port), MyHTTPRequestHandler) as httpd:
        print(f"服务器运行在 http://0.0.0.0:{port}")
        print(f"访问 http://localhost:{port} 来玩贪吃蛇游戏")
        print("按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 12000
    run_server(port)