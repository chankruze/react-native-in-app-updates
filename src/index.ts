export {
  checkForUpdate,
  startUpdate,
  installUpdate,
  openAppStore,
  addUpdateListener,
} from './InAppUpdates';
export { UpdateType, AvailabilityStatus, InstallStatus } from './types';
export type {
  AndroidUpdateInfo,
  IosUpdateInfo,
  UpdateInfo,
  UpdateStatusEvent,
  UpdateResultEvent,
  CheckOptions,
} from './types';
