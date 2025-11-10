#!/bin/bash

echo "🚀 Building Android APK for Employee Payroll App..."
echo ""

# Check if Android Studio is required
if ! command -v android &> /dev/null; then
    echo "⚠️  Android Studio is required to build the APK"
    echo "   Download from: https://developer.android.com/studio"
    echo ""
fi

# Step 1: Prepare www directory
echo "📁 Step 1: Preparing web assets..."
npm run prepare:www
echo "✅ Web assets prepared"
echo ""

# Step 2: Sync with Android
echo "🔄 Step 2: Syncing with Android platform..."
npx cap sync android
echo "✅ Sync complete"
echo ""

# Step 3: Open in Android Studio
echo "📱 Step 3: Opening in Android Studio..."
echo ""
echo "In Android Studio:"
echo "1. Wait for Gradle sync to complete"
echo "2. Go to Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo "3. Wait for build to complete"
echo "4. Click 'locate' to find your APK"
echo ""
echo "APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""

npx cap open android

echo ""
echo "✨ Done! Android Studio should now be open."
