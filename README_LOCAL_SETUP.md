# Receipts Mobile

This is the patched standalone Expo project exported from Replit.

## Windows setup

Open this folder in Cursor:

`artifacts/mobile`

Then run:

```powershell
npm install
npx expo start
```

For iOS App Store build with Expo EAS:

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

You will need your Apple Developer account and the app's environment variables such as Clerk and RevenueCat keys.
