# Android APK build (Capacitor)

The Android wrapper packages the reviewed browser client in `frontend/public` using Capacitor. It does not publish to Google Play and does not use release-signing credentials.

## Reproducible CI build

The GitHub Actions workflow `.github/workflows/android-apk.yml` installs the pinned npm dependency tree, checks API URL selection, synchronizes Capacitor, builds an unsigned debug APK, verifies that the APK is non-empty, and uploads it as the `guerra-infinita-debug-apk` artifact for 14 days.

## Local build

Requirements: Node.js 22+, Java 21, Android SDK platform/build-tools 36.

```sh
npm ci
npm run test:android-config
npx cap sync android
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

The Android WebView uses the local packaged HTML assets with the configured HTTPS API origin. The API configuration test explicitly guards against treating the WebView's `localhost` hostname as a backend running on the phone. No HTTP cleartext API or remote server URL override is enabled.

## Release boundary

A successful CI build proves compilation and packaging only. Physical-device validation is still required for login, tap navigation, back navigation, connectivity recovery, and persistence. This debug APK is unsigned for release and is not a Play Store release.
