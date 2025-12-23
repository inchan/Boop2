#!/bin/bash

# Boop2 BIR (Build, Install, Run) Script
# This script automates the full development cycle.

# 1. Source Rust/Cargo environment
source $HOME/.cargo/env 2>/dev/null

echo "🚀 Starting Boop2: Build -> Install -> Run..."

# 2. Build & Install (as defined in package.json)
# This builds the production app and moves it to /Applications/Boop2.app
if npm run build:install; then
    echo "✅ Build and Install successful!"
    
    # 3. Run the app
    echo "🏃 Launching Boop2.app..."
    open /Applications/Boop2.app
    echo "✨ Boop2 is now running."
else
    echo "❌ Process failed. Please check the error logs above."
    exit 1
fi
