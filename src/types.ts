export enum UpdateType {
  FLEXIBLE = 0,
  IMMEDIATE = 1,
}

export enum AvailabilityStatus {
  UNKNOWN = 0,
  UNAVAILABLE = 1,
  AVAILABLE = 2,
  DEVELOPER_TRIGGERED = 3,
}

export enum InstallStatus {
  UNKNOWN = 0,
  PENDING = 1,
  DOWNLOADING = 2,
  INSTALLING = 3,
  INSTALLED = 4,
  FAILED = 5,
  CANCELED = 6,
  DOWNLOADED = 11,
}

export type CheckOptions = {
  /** Current app version to compare against. Defaults to CFBundleShortVersionString / versionName. */
  curVersion?: string;
  /** ISO 3166-1 country code for region-specific App Store lookup (iOS only). */
  country?: string;
  /** App bundle ID. Defaults to the app's own bundle ID. */
  bundleId?: string;
};

export type AndroidUpdateInfo = {
  updateAvailable: boolean;
  availabilityStatus: AvailabilityStatus;
  flexibleAllowed: boolean;
  immediateAllowed: boolean;
  /** Google Play server-set priority (0–5). Use >= 4 as threshold for IMMEDIATE. */
  updatePriority: number;
  /** Days since the update became available on Play Store. */
  daysSinceRelease: number | null;
  /** Available version code on Play Store. */
  versionCode: number;
};

export type IosUpdateInfo = {
  updateAvailable: boolean;
  /** Version string from the App Store (e.g. "2.1.0"). */
  storeVersion: string;
  /** ISO 8601 release date of the latest App Store version. */
  releaseDate: string | null;
};

export type UpdateInfo = AndroidUpdateInfo | IosUpdateInfo;

export type UpdateStatusEvent = {
  status: InstallStatus;
  /** Bytes downloaded so far (FLEXIBLE flow only). */
  bytesDownloaded: number;
  /** Total bytes to download (FLEXIBLE flow only). */
  totalBytesToDownload: number;
};

export type UpdateResultEvent = {
  /** True when the update was installed, false when the user cancelled. */
  installed: boolean;
};

export type UpdateEventMap = {
  onInAppUpdateStatus: UpdateStatusEvent;
  onInAppUpdateResult: UpdateResultEvent;
};

export type UpdateEventName = keyof UpdateEventMap;
