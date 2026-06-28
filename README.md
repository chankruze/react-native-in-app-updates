# @chankruze/react-native-in-app-updates

Lightweight in-app updates for Android and iOS.

- **Android** — Google Play [In-App Updates API](https://developer.android.com/guide/playcore/in-app-updates) (FLEXIBLE + IMMEDIATE flows)
- **iOS** — iTunes Search API version check + App Store redirect
- **New Architecture** — TurboModule on Android, pure TypeScript on iOS
- **Zero extra dependencies** beyond `react-native`

## Compatibility

| Environment                   | Supported |
| ----------------------------- | --------- |
| React Native CLI              | ✅        |
| Expo Bare Workflow            | ✅        |
| EAS Build + `expo-dev-client` | ✅        |
| Expo Managed Workflow         | ❌        |
| Expo Go                       | ❌        |

> **Expo Managed / Expo Go users:** This library requires native module support which is not available in the managed sandbox. Use [`expo-in-app-updates`](https://github.com/SohelIslamImran/expo-in-app-updates) instead.

**Why it won't work in Expo Managed Workflow**

Our library uses the standard React Native TurboModule API (`NativeReactNativeInAppUpdatesSpec`, `TurboModuleRegistry`). Expo Go and Expo Managed Workflow sandbox
the native layer — custom `TurboModules` can't be registered because there's no access to the native build pipeline. The app would crash on the `TurboModuleRegistry.getEnforcing` call at startup.

Expo has their own native module system (`expo-modules-core`) and their own in-app updates package (`expo-in-app-updates`) built on it. That's the right tool for managed Expo users.

## Installation

```sh
yarn add @chankruze/react-native-in-app-updates
# or
npm install @chankruze/react-native-in-app-updates
```

### iOS

No native setup needed — iOS is pure TypeScript.

> **No `LSApplicationQueriesSchemes` required.** Unlike libraries that use the `itms-apps://` deep link scheme, this library opens the App Store via a standard `https://apps.apple.com/...` URL. HTTPS URLs do not need to be whitelisted in `Info.plist` or `app.json`.

### Android

No manual linking needed. The library uses `com.google.android.play:app-update-ktx` which is bundled.

> **Important:** In-App Updates only work on **release builds installed from the Play Store**. Debug builds always return `updateAvailable: false`.

## Quick start

```tsx
import { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import {
  checkForUpdate,
  startUpdate,
  installUpdate,
  addUpdateListener,
  UpdateType,
  InstallStatus,
  type IosUpdateInfo,
  type AndroidUpdateInfo,
} from '@chankruze/react-native-in-app-updates';

function useInAppUpdates() {
  useEffect(() => {
    // Android FLEXIBLE: auto-install once download completes
    if (Platform.OS !== 'android') return;
    return addUpdateListener('onInAppUpdateStatus', (event) => {
      if (event.status === InstallStatus.DOWNLOADED) {
        installUpdate();
      }
    });
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        if (Platform.OS === 'ios') {
          const info = (await checkForUpdate({
            bundleId: 'com.example.myapp',
            country: 'us',
          })) as IosUpdateInfo;

          if (info.updateAvailable && info.appStoreUrl) {
            // Show your own modal, then:
            Linking.openURL(info.appStoreUrl);
          }
        } else {
          const info = (await checkForUpdate({})) as AndroidUpdateInfo;
          if (info.updateAvailable) {
            // priority >= 4 → force IMMEDIATE, otherwise FLEXIBLE
            const type =
              info.updatePriority >= 4
                ? UpdateType.IMMEDIATE
                : UpdateType.FLEXIBLE;
            await startUpdate(type);
          }
        }
      } catch {
        // in-app updates are best-effort — never interrupt the user
      }
    };

    run();
  }, []);
}
```

## API

### `checkForUpdate(options?)`

Checks whether an update is available.

| Option       | Type     | Platform       | Description                                   |
| ------------ | -------- | -------------- | --------------------------------------------- |
| `bundleId`   | `string` | iOS (required) | App bundle ID                                 |
| `country`    | `string` | iOS            | ISO 3166-1 country code (e.g. `'us'`, `'in'`) |
| `curVersion` | `string` | iOS            | Current version to compare against            |

**<img src="https://developer.android.com/static/images/brand/android-head_flat.png" height="16" alt="Android" /> Returns `AndroidUpdateInfo` on Android:**

| Field                | Type                 | Description                                        |
| -------------------- | -------------------- | -------------------------------------------------- |
| `updateAvailable`    | `boolean`            | Whether a newer version exists                     |
| `availabilityStatus` | `AvailabilityStatus` | Raw Play Store availability enum                   |
| `flexibleAllowed`    | `boolean`            | FLEXIBLE update is allowed                         |
| `immediateAllowed`   | `boolean`            | IMMEDIATE update is allowed                        |
| `updatePriority`     | `number`             | Server-set priority 0–5 (use `>= 4` for IMMEDIATE) |
| `versionCode`        | `number`             | Available Play Store version code                  |
| `daysSinceRelease`   | `number \| null`     | Days since update was published                    |

**<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/IOS_logo.svg/1280px-IOS_logo.svg.png?_=20160930140049" height="16" alt="iOS" /> Returns `IosUpdateInfo` on iOS:**

| Field             | Type             | Description                                |
| ----------------- | ---------------- | ------------------------------------------ |
| `updateAvailable` | `boolean`        | Whether a newer version exists             |
| `storeVersion`    | `string`         | Latest version string (e.g. `"2.1.0"`)     |
| `releaseDate`     | `string \| null` | ISO 8601 release date                      |
| `appStoreUrl`     | `string \| null` | Direct App Store URL for `Linking.openURL` |

---

### <img src="https://developer.android.com/static/images/brand/android-head_flat.png" height="18" alt="Android" /> `startUpdate(updateType?)`

_Android only._ Triggers the Play Store update flow.

```ts
await startUpdate(UpdateType.FLEXIBLE); // download in background
await startUpdate(UpdateType.IMMEDIATE); // full-screen blocking update
```

---

### <img src="https://developer.android.com/static/images/brand/android-head_flat.png" height="18" alt="Android" /> `installUpdate()`

_Android only._ Completes a finished FLEXIBLE download. Call this when `onInAppUpdateStatus` fires with `status === InstallStatus.DOWNLOADED`.

---

### <img src="https://developer.android.com/static/images/brand/android-head_flat.png" height="18" alt="Android" /> `addUpdateListener(event, listener)`

_Android only._ Subscribes to native update events. Returns an unsubscribe function.

```ts
const unsubscribe = addUpdateListener('onInAppUpdateStatus', (event) => {
  console.log(event.status); // InstallStatus enum value
  console.log(event.bytesDownloaded); // bytes downloaded so far
  console.log(event.totalBytesToDownload);
});

// cleanup
unsubscribe();
```

**Events:**

| Event                 | Payload             | Description                          |
| --------------------- | ------------------- | ------------------------------------ |
| `onInAppUpdateStatus` | `UpdateStatusEvent` | Download progress + install status   |
| `onInAppUpdateResult` | `UpdateResultEvent` | Final result (installed / cancelled) |

---

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/IOS_logo.svg/1280px-IOS_logo.svg.png?_=20160930140049" height="18" alt="iOS" /> `openAppStore(appId)`

_iOS only._ Opens the App Store page for the given numeric App Store ID.

```ts
openAppStore('123456789');
// opens https://apps.apple.com/app/id123456789
```

Alternatively, use `Linking.openURL(info.appStoreUrl)` with the URL from `checkForUpdate`.

## Enums

```ts
enum UpdateType {
  FLEXIBLE = 0, // background download, user continues using app
  IMMEDIATE = 1, // full-screen blocking update
}

enum InstallStatus {
  UNKNOWN = 0,
  PENDING = 1,
  DOWNLOADING = 2,
  INSTALLING = 3,
  INSTALLED = 4,
  FAILED = 5,
  CANCELED = 6,
  DOWNLOADED = 11, // ready to install — call installUpdate()
}

enum AvailabilityStatus {
  UNKNOWN = 0,
  UNAVAILABLE = 1,
  AVAILABLE = 2,
  DEVELOPER_TRIGGERED = 3,
}
```

## <img src="https://developer.android.com/static/images/brand/android-head_flat.png" height="20" alt="Android" /> Android testing

Play Store In-App Updates require a **real device** with a **release build** installed from the **Play Store** (or Internal Testing track).

1. Upload `versionCode = 1` to Play Console → Internal Testing track
2. Install on device via the Internal Testing link
3. Upload `versionCode = 2` to Internal Testing (no need to publish)
4. Open the app — `checkForUpdate()` will now return `updateAvailable: true`

## <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/IOS_logo.svg/1280px-IOS_logo.svg.png?_=20160930140049" height="20" alt="iOS" /> iOS testing

`checkForUpdate()` hits the live iTunes Search API. To test:

1. Ensure your app is published on the App Store
2. Pass your production `bundleId` and the correct `country` code
3. If the App Store version is higher than `curVersion`, `updateAvailable` will be `true`

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
