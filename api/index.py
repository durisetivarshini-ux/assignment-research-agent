import sys
import os
from pathlib import Path

# Add the root directory to sys.path so 'backend' is recognized
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app
