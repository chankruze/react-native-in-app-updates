import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  checkForUpdate(): Promise<Object>;
  startUpdate(updateType: number): Promise<void>;
  installUpdate(): void;
  // Required by NativeEventEmitter
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeInAppUpdates'
);
