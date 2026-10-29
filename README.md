# Snake

A browser Snake game packaged as an offline Android app. The game has no external JavaScript or CSS libraries. Android uses the system WebView and packages the root HTML, CSS, and JavaScript at build time; there is no separately maintained copy.

## Play in a browser

Open `index.html`. Use arrow keys or WASD, and Space to pause. On narrow screens, use the on-screen direction buttons.

## Build an APK with GitHub Actions (no local Android SDK needed)

1. Create an empty GitHub repository, then initialize and push this directory. The following commands stage **only the Snake project files**; the unrelated calendar files already in this directory will not be included:

   ```sh
   git init
   git add .gitignore .github README.md index.html style.css script.js settings.gradle build.gradle gradle.properties app tests
   git commit -m "Add Snake Android app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   Replace the remote URL with your own. Review `git status` before committing. If the remote already has commits, integrate those first instead of force-pushing.
2. On GitHub, open **Actions → Build Android APK** and select the run for your push. The workflow also runs on pull requests and can be started manually with **Run workflow**.
3. When the run succeeds, download the **snake-debug-apk** artifact from the run's summary. Unzip it and install `app-debug.apk` on an Android device (Android 6.0/API 23 or later). You may need to permit installation from your chosen file manager or browser.

The artifact is a **debug-signed APK**, suitable for testing and sideloading, not for publishing to Google Play. GitHub Actions artifacts expire after 30 days. A production release requires your own release signing key and build configuration; do not commit private keys.

## Local Android build (optional)

Install JDK 17, Gradle 8.9, Android SDK Platform 35, and Build Tools 35.0.0. Set `ANDROID_HOME` to the SDK directory or create an untracked `local.properties` containing `sdk.dir`. From the project directory run:

```sh
gradle :app:assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`. This project intentionally does not include a Gradle wrapper; the GitHub workflow installs the specified Gradle version.

## Test game logic

Run `node tests/game.test.cjs` with Node.js. These tests are also run in the GitHub workflow; they do not replace testing the APK on an Android device.

## Notes

- No internet permission is requested. The WebView serves only the three bundled game files under a stable local HTTPS origin so the best score can be stored on the device.
- The game pauses when the Android app is backgrounded. Device rotation keeps the current game in the same activity.
- The application ID is `com.example.snake`; change it before publishing under your own identity. Changing it later makes Android treat the app as a different application.
