import { Linking } from 'react-native';
import type {
  CheckOptions,
  IosUpdateInfo,
  UpdateEventMap,
  UpdateEventName,
} from './types';

const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function checkForUpdate(
  options: CheckOptions = {}
): Promise<IosUpdateInfo> {
  const { bundleId, country } = options;

  if (!bundleId) {
    throw new Error('bundleId is required on iOS');
  }

  // Timestamp busts any aggressive CDN/proxy cache
  const params = new URLSearchParams({ bundleId, _: String(Date.now()) });
  if (country) params.set('country', country);

  const res = await fetch(`${ITUNES_LOOKUP}?${params}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`iTunes lookup failed with status ${res.status}`);
  }

  const json = await res.json();
  const entry = json?.results?.[0];

  if (!entry) {
    throw new Error('App not found on App Store — check bundleId and country');
  }

  const storeVersion: string = entry.version;
  const releaseDate: string | null = entry.currentVersionReleaseDate ?? null;
  const currentVersion = options.curVersion ?? null;

  const updateAvailable =
    currentVersion != null
      ? compareVersions(storeVersion, currentVersion) > 0
      : false;

  return { updateAvailable, storeVersion, releaseDate };
}

export function openAppStore(appId: string): void {
  Linking.openURL(`https://apps.apple.com/app/id${appId}`);
}

// Android-only stubs — keep API surface symmetric so callers don't need Platform.OS guards
export function installUpdate(): void {}

export function startUpdate(_updateType?: number): Promise<void> {
  return Promise.resolve();
}

export function addUpdateListener<K extends UpdateEventName>(
  _event: K,
  _listener: (payload: UpdateEventMap[K]) => void
): () => void {
  return () => {};
}
