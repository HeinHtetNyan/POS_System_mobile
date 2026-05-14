#!/bin/bash
# Serve the NexusPOS frontend on port 3000
# Open http://localhost:3000 in your browser after running this

cd "$(dirname "$0")"

if command -v python3 &>/dev/null; then
  echo "Serving NexusPOS at http://localhost:3000"
  echo "Open NexusPOS.html (self-contained) or index.html (modular)"
  python3 -m http.server 3000
elif command -v python &>/dev/null; then
  echo "Serving NexusPOS at http://localhost:3000"
  python -m SimpleHTTPServer 3000
else
  echo "Python not found. Install Python or open NexusPOS.html directly in your browser."
fi
