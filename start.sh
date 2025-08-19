#!/bin/bash

echo "🚀 Starting Realtime Chat Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if MySQL is running (optional check)
echo "📦 Installing dependencies..."

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Install server dependencies
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Install web dependencies
if [ ! -d "web/node_modules" ]; then
    echo "Installing web dependencies..."
    cd web && npm install && cd ..
fi

echo "✅ Dependencies installed successfully!"

# Sync database
echo "🗄️ Syncing database..."
cd server && npm run sync && cd ..

echo "🎉 Setup complete! Starting development servers..."
echo ""
echo "Backend will be available at: http://localhost:4000"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Start both servers
npm run dev
