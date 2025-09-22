# react-native-navigation-provider

A simple, lightweight `NavigationProvider` for React Native apps.  
It is designed to be used **alongside React Navigation** (`@react-navigation/native`, `@react-navigation/stack` and `@react-navigation/bottom-tabs`) and helps provide a clean, centralized navigation context.

---

## ✅ Supported platforms

- [x] iOS  
- [x] Android  
- [x] tvOS  
- [x] visionOS  


---

## 📦 Installation

### Using npm
```bash
npm install react-native-navigation-provider


# Required dependencies (recommended)
npm install react-native-screens react-native-gesture-handler react-native-reanimated


## Platform setup
iOS

Installation is fully handled via autolinking.

After adding dependencies, run:

cd ios
pod install
cd ..


Then build and run:

npx react-native run-ios



Android

Most configuration is handled automatically with autolinking.
A few important steps:

Ensure the following flags are set in android/gradle.properties:

android.useAndroidX=true
android.enableJetifier=true


Add the gesture handler import at the top of your entry file (index.js):

import 'react-native-gesture-handler';


Build and run:

npx react-native run-android