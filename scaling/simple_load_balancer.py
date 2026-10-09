from http.server import BaseHTTPRequestHandler, HTTPServer
import requests
from urllib.parse import urlparse
import itertools

# List of backend server addresses (Flask instances)
# Use Docker Compose service names and their INTERNAL ports
BACKEND_SERVERS = [
    "http://web1:5000",  # Service name 'web1', internal port 5000
    "http://web2:5000",  # Service name 'web2', internal port 5000
    "http://web3:5000",  # Service name 'web3', internal port 5000
]
server_cycle = itertools.cycle(BACKEND_SERVERS)

class ProxyHTTPRequestHandler(BaseHTTPRequestHandler):
    def _get_next_server(self):
        return next(server_cycle)

    def _forward_request(self, method):
        next_server = self._get_next_server()
        target_url = f"{next_server}{self.path}" # self.path already includes query params
        print(f"Load Balancer: Forwarding {method} {self.path} to {target_url}")

        backend_headers = dict(self.headers)
        parsed_target = urlparse(target_url)
        backend_headers['Host'] = parsed_target.netloc # Set Host to the service name:port

        # Forward X-Forwarded-For and X-Forwarded-Proto for backend to know original client
        # self.client_address[0] is the IP of the client connecting to the load balancer
        if 'X-Forwarded-For' in backend_headers:
            backend_headers['X-Forwarded-For'] += f", {self.client_address[0]}"
        else:
            backend_headers['X-Forwarded-For'] = self.client_address[0]
        
        # Assuming HTTP for now, if you had HTTPS terminate at LB, you'd set X-Forwarded-Proto
        backend_headers['X-Forwarded-Proto'] = 'http'


        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        try:
            resp = requests.request(
                method,
                target_url,
                headers=backend_headers,
                data=body,
                stream=True,
                timeout=10,
                allow_redirects=False
            )

            self.send_response(resp.status_code)
            for key, value in resp.headers.items():
                if key.lower() not in ['transfer-encoding', 'content-encoding', 'connection']:
                    self.send_header(key, value)
            self.end_headers()

            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    self.wfile.write(chunk)

        except requests.exceptions.RequestException as e:
            print(f"Load Balancer: Error connecting to backend {target_url}: {e}")
            self.send_error(503, "Service Unavailable (Backend Error)")
        except ConnectionResetError:
            print(f"Load Balancer: Connection reset by peer for {target_url}. Client might have disconnected.")
        except Exception as e:
            print(f"Load Balancer: Unexpected error forwarding to {target_url}: {e}")
            if not self.wfile.closed:
                self.send_error(500, "Internal Proxy Error")

    def do_GET(self):
        self._forward_request("GET")

    def do_POST(self):
        self._forward_request("POST")

    def do_PUT(self):
        self._forward_request("PUT")

    def do_DELETE(self):
        self._forward_request("DELETE")


def run_load_balancer(server_class=HTTPServer, handler_class=ProxyHTTPRequestHandler, port=8000):
    server_address = ('', port) # Listen on all interfaces within the container
    httpd = server_class(server_address, handler_class)
    print(f"Simple Load Balancer started on http://0.0.0.0:{port} (inside container)")
    print(f"Accessible from host via mapped port (e.g., http://localhost:8000)")
    print(f"Forwarding to: {', '.join(BACKEND_SERVERS)}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nLoad Balancer shutting down...")
    httpd.server_close()

if __name__ == '__main__':
    run_load_balancer()