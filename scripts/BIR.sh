#!/bin/bash

# Boop2 BIR (Build, Install, Run) All-in-One Script
# This script ensures dependencies are installed, builds the app, and launches it.

# 1. Determine Project Root (even if called from other directories)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# 2. Source Rust/Cargo environment
source $HOME/.cargo/env 2>/dev/null

echo "🚀 Starting Boop2 All-in-One Setup..."

# 3. Automatic Dependency Check
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
fi

# 4. Build & Install (Production)
echo "🔨 Building and Installing Boop2.app..."
if npm run build:install; then
    echo "✅ Build and Install successful!"
    
    # 5. Run the app
    echo "🏃 Launching Boop2.app..."
    open /Applications/Boop2.app
    echo "✨ Boop2 is now running."
else
    echo "❌ Process failed. Please check the error logs."
    exit 1
fi