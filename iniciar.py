#!/usr/bin/env python3
"""Servidor local sem dependências para a Aventura Matemática."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import webbrowser
endereco=('127.0.0.1',8000)
print('Aventura Matemática: http://127.0.0.1:8000 (Ctrl+C para encerrar)')
try:webbrowser.open('http://127.0.0.1:8000')
except Exception:pass
ThreadingHTTPServer(endereco,SimpleHTTPRequestHandler).serve_forever()
