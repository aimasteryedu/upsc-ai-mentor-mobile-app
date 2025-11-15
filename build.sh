#!/bin/bash

# UPSC AI Mentor Mobile App Build Script
# This script sets up the environment and builds APK/AAB files

echo "🚀 Starting UPSC AI Mentor Mobile App Build Process"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Install global CLI tools if not already installed
if ! command -v expo &> /dev/null; then
    echo "🔧 Installing Expo CLI..."
    npm install -g @expo/cli
fi

if ! command -v eas &> /dev/null; then
    echo "🔧 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to EAS (this will prompt for credentials)
echo "🔐 Logging into EAS..."
eas login

# Configure build profiles
echo "⚙️ Building APK for testing..."
eas build --platform android --profile preview

echo "🏪 Building AAB for Play Store..."
eas build --platform android --profile production

echo "✅ Build process completed!"
echo "📁 Check the EAS build dashboard for your build artifacts"