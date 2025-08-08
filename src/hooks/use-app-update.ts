
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * A robust version comparison function.
 * Returns true if version2 is strictly greater than version1.
 */
const isNewerVersion = (version1: string, version2: string) => {
    if (typeof version1 !== 'string' || typeof version2 !== 'string' || !version1 || !version2) {
        return false;
    }
    const parts1 = version1.split('.').map(part => parseInt(part, 10));
    const parts2 = version2.split('.').map(part => parseInt(part, 10));

    if (parts1.some(isNaN) || parts2.some(isNaN)) {
        return false;
    }

    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p2 > p1) return true;
        if (p1 > p2) return false;
    }
    return false;
}

// Extend the window type to include our optional AndroidBridge
declare global {
  interface Window {
    Android?: {
      getAppVersion: () => string;
    };
  }
}


export function useAppUpdate() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    // This function will handle all the logic
    const checkForUpdates = async () => {
      try {
        const configRef = doc(db, 'app-config', 'version');
        const docSnap = await getDoc(configRef);

        if (!docSnap.exists()) {
          console.log("No update configuration found in Firestore.");
          return;
        }

        const data = docSnap.data();
        const remoteVersion = data.latestVersion;
        const url = data.updateUrl;

        if (!remoteVersion || !url) {
            console.log("Remote version or update URL is missing from Firestore.");
            return;
        }

        // Check if the native bridge exists
        if (window.Android && typeof window.Android.getAppVersion === 'function') {
            // New App Logic: Native bridge exists, get the real APK version
            const currentApkVersion = window.Android.getAppVersion();
            
            if (isNewerVersion(currentApkVersion, remoteVersion)) {
                setLatestVersion(remoteVersion);
                setUpdateUrl(url);
                setShowUpdateDialog(true);
            }
        } else {
            // This is a PWA or a browser, so we don't show an update dialog.
            // Update logic is only for the native Android app.
            console.log("Not a native app environment. Skipping update check.");
        }

      } catch (error) {
        console.error("Failed to check for app updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  return { showUpdateDialog, updateUrl, latestVersion };
}
