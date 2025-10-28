#!/bin/bash

echo "Setting up Liar's Dice game environment..."

# Check if pyenv is installed
if ! command -v pyenv &> /dev/null; then
    echo "pyenv is not installed. Please install pyenv first."
    echo "Visit: https://github.com/pyenv/pyenv#installation"
    exit 1
fi

# Check if Python 3.13.5 is available, if not install it
if ! pyenv versions | grep -q "3.13.5"; then
    echo "Installing Python 3.13.5..."
    pyenv install 3.13.5
fi

# Check if virtual environment exists and is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    print_warning "Virtual environment not activated. Attempting to activate..."
    if [ -d "venv" ]; then
        source venv/bin/activate
        print_success "Virtual environment activated"
    else
        print_error "Virtual environment not found. Please run setup.sh first."
        exit 1
    fi
fi

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    print_warning "TypeScript not found. Installing TypeScript..."
    npm install -g typescript
    print_success "TypeScript installed"
fi

# Set local Python version
pyenv local 3.13.5

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip and install build tools
echo "Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Setup complete! To start the game:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python server.py"
echo "3. Open your browser to: http://localhost:5000"
echo "" 