#!/bin/bash

# 🚀 Clementine App - Quick Vercel Deployment Script

echo "🍊 Deploying Clementine App to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Ask user which deployment type
echo ""
echo "🚀 Choose deployment type:"
echo "1) Preview deployment (for testing)"
echo "2) Production deployment"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🧪 Deploying to preview..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test your app at the provided URL"
echo "2. Verify all test buttons work"
echo "3. Check user recognition functionality"
echo "4. Test memory system storage"
echo "5. Validate VoiceFlow integration"
echo ""
echo "🧪 Test checklist:"
echo "- 🧪 Test User Recognition button"
echo "- 🧠 Test Memory System button"  
echo "- 🎯 Test VoiceFlow Context button"
echo "- 🔄 Try full login flow with dot@mail.com"
echo ""
echo "📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed testing instructions"
