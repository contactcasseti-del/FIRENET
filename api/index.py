import os
import sys

# Ensure backend directory is in path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, os.path.abspath(backend_dir))

from app.main import app
