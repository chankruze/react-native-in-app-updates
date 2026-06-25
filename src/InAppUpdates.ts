import type {
  CheckOptions,
  UpdateEventMap,
  UpdateEventName,
  UpdateInfo,
} from './types';
import { UpdateType } from './types';

const ERR =
  '@chankruze/react-native-in-app-updates is not supported on this platform';

export async function checkForUpdate(
  _options?: CheckOptions
): Promise<UpdateInfo> {
  throw new Error(ERR);
}

export async function startUpdate(_updateType?: UpdateType): Promise<void> {
  throw new Error(ERR);
}

export function installUpdate(): void {}

export function openAppStore(_appId: string): void {}

export function addUpdateListener<K extends UpdateEventName>(
  _event: K,
  _listener: (payload: UpdateEventMap[K]) => void
): () => void {
  return () => {};
}

export { UpdateType };
