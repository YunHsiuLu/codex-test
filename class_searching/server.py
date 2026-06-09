from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PORT = 8765


def main():
    root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(*args, directory=root, **kwargs)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print(f"Open http://127.0.0.1:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
