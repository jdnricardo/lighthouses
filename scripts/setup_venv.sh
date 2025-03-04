#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create virtual environment if it doesn't exist
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$PROJECT_ROOT/venv"
fi

# Activate virtual environment
source "$PROJECT_ROOT/venv/bin/activate"

# Install requirements
echo "Installing requirements..."
pip install -r "$PROJECT_ROOT/requirements/python/dev.txt"
pip install -r "$PROJECT_ROOT/requirements/python/web.txt"

echo "Setup complete! Virtual environment is activated."
echo "To activate the virtual environment in the future, run:"
echo "source venv/bin/activate" 