import { NativeEventEmitter, NativeModules } from 'react-native';
import type {
  AndroidUpdateInfo,
  CheckOptions,
  UpdateEventMap,
  UpdateEventName,
} from './types';
import { AvailabilityStatus, UpdateType } from './types';
import NativeInAppUpdates from './NativeReactNativeInAppUpdates';

const emitter = new NativeEventEmitter(NativeModules.ReactNativeInAppUpdates);

export async function checkForUpdate(
  _options: CheckOptions = {}
): Promise<AndroidUpdateInfo> {
  const raw = (await NativeInAppUpdates.checkForUpdate()) as AndroidUpdateInfo;
  return raw;
}

export async function startUpdate(
  updateType: UpdateType = UpdateType.FLEXIBLE
): Promise<void> {
  const info = await checkForUpdate();
  if (!info.updateAvailable) {
    throw new Error('No update available');
  }
  if (info.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
    throw new Error(
      `Update not available (status: ${info.availabilityStatus})`
    );
  }
  return NativeInAppUpdates.startUpdate(updateType);
}

export function installUpdate(): void {
  NativeInAppUpdates.installUpdate();
}

export function addUpdateListener<K extends UpdateEventName>(
  event: K,
  listener: (payload: UpdateEventMap[K]) => void
): () => void {
  const sub = emitter.addListener(event, listener as any);
  return () => sub.remove();
}

// iOS-only stub — Play Store handles the UI on Android
export function openAppStore(_appId: string): void {}

export { UpdateType, AvailabilityStatus };
export type {
  AndroidUpdateInfo,
  CheckOptions,
  UpdateEventMap,
  UpdateEventName,
};
