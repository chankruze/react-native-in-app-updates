import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  addUpdateListener,
  checkForUpdate,
  installUpdate,
  startUpdate,
  UpdateType,
  InstallStatus,
  type IosUpdateInfo,
  type AndroidUpdateInfo,
  type UpdateStatusEvent,
} from '@chankruze/react-native-in-app-updates';

const IMMEDIATE_PRIORITY_THRESHOLD = 4;

export default function App() {
  const [isChecking, setIsChecking] = useState(false);
  const [iosInfo, setIosInfo] = useState<IosUpdateInfo | null>(null);
  const [androidInfo, setAndroidInfo] = useState<AndroidUpdateInfo | null>(
    null
  );
  const [downloadStatus, setDownloadStatus] =
    useState<UpdateStatusEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const hasChecked = useRef(false);

  // Android FLEXIBLE: auto-install once download finishes
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    return addUpdateListener('onInAppUpdateStatus', (event) => {
      setDownloadStatus(event);
      if (event.status === InstallStatus.DOWNLOADED) {
        installUpdate();
      }
    });
  }, []);

  const handleCheck = async () => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    setIsChecking(true);
    setError(null);
    try {
      if (Platform.OS === 'ios') {
        const info = await checkForUpdate({
          bundleId: 'YOUR_BUNDLE_ID', // replace with your app's bundle ID
          country: 'us', // replace with your App Store region
        });
        setIosInfo(info as IosUpdateInfo);
        if (info.updateAvailable) setModalVisible(true);
      } else {
        const info = await checkForUpdate({});
        setAndroidInfo(info as AndroidUpdateInfo);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      hasChecked.current = false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleAndroidUpdate = async () => {
    if (!androidInfo?.updateAvailable) return;
    try {
      const type =
        androidInfo.updatePriority >= IMMEDIATE_PRIORITY_THRESHOLD
          ? UpdateType.IMMEDIATE
          : UpdateType.FLEXIBLE;
      await startUpdate(type);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleIosUpdate = () => {
    setModalVisible(false);
    if (iosInfo?.appStoreUrl) {
      Linking.openURL(iosInfo.appStoreUrl);
    }
  };

  const downloadPercent =
    downloadStatus && downloadStatus.totalBytesToDownload > 0
      ? Math.round(
          (downloadStatus.bytesDownloaded /
            downloadStatus.totalBytesToDownload) *
            100
        )
      : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>@chankruze/react-native-in-app-updates</Text>
      <Text style={styles.platform}>Platform: {Platform.OS}</Text>

      <Pressable
        style={[styles.button, isChecking && styles.buttonDisabled]}
        onPress={handleCheck}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Check for Update</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Android result */}
      {androidInfo ? (
        <View style={styles.card}>
          <Row
            label="Update available"
            value={androidInfo.updateAvailable ? 'Yes' : 'No'}
          />
          <Row label="Version code" value={String(androidInfo.versionCode)} />
          <Row label="Priority" value={String(androidInfo.updatePriority)} />
          <Row
            label="Flexible allowed"
            value={androidInfo.flexibleAllowed ? 'Yes' : 'No'}
          />
          <Row
            label="Immediate allowed"
            value={androidInfo.immediateAllowed ? 'Yes' : 'No'}
          />
          {androidInfo.daysSinceRelease != null ? (
            <Row
              label="Days since release"
              value={String(androidInfo.daysSinceRelease)}
            />
          ) : null}
          {downloadPercent != null ? (
            <Row label="Download" value={`${downloadPercent}%`} />
          ) : null}
          {androidInfo.updateAvailable ? (
            <Pressable
              style={[styles.button, styles.updateButton]}
              onPress={handleAndroidUpdate}
            >
              <Text style={styles.buttonText}>
                {androidInfo.updatePriority >= IMMEDIATE_PRIORITY_THRESHOLD
                  ? 'Update Now (Immediate)'
                  : 'Update Now (Flexible)'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* iOS result */}
      {iosInfo ? (
        <View style={styles.card}>
          <Row
            label="Update available"
            value={iosInfo.updateAvailable ? 'Yes' : 'No'}
          />
          <Row label="Store version" value={iosInfo.storeVersion} />
          {iosInfo.releaseDate ? (
            <Row label="Released" value={iosInfo.releaseDate} />
          ) : null}
        </View>
      ) : null}

      {/* iOS update modal */}
      {modalVisible && iosInfo ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Update Available</Text>
            <Text style={styles.modalBody}>
              Version {iosInfo.storeVersion} is available on the App Store.
            </Text>
            <Pressable
              style={[styles.button, styles.updateButton]}
              onPress={handleIosUpdate}
            >
              <Text style={styles.buttonText}>Update Now</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  platform: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  updateButton: {
    backgroundColor: '#2ecc71',
    marginTop: 8,
    marginBottom: 0,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 13,
    color: '#6c757d',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalBody: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  laterText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
    paddingVertical: 4,
  },
});
