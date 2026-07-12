from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path


HOST = os.environ.get("CLASS_SEARCH_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8765"))


def main():
    root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(*args, directory=root, **kwargs)
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"Open http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
