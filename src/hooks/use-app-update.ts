
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

export function useAppUpdate() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateNotes, setUpdateNotes] = useState<string | null>(null);

  useEffect(() => {
    // This function will handle all the logic
    const checkForUpdates = async () => {
      // @ts-ignore - This is a custom interface we expect the Android app to provide
      if (!window.Android || typeof window.Android.getAppVersion !== 'function') {
        // If the native bridge doesn't exist, we're on the web, so do nothing.
        return;
      }
      
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
        const notes = data.updateNotes; // Fetch the new notes

        if (!remoteVersion || !url) {
            console.log("Remote version or update URL is missing from Firestore.");
            return;
        }

        // Since we already confirmed the bridge exists, we can safely call it.
        // @ts-ignore
        const currentApkVersion = window.Android.getAppVersion();
        
        if (isNewerVersion(currentApkVersion, remoteVersion)) {
            setLatestVersion(remoteVersion);
            setUpdateUrl(url);
            setUpdateNotes(notes);
            setShowUpdateDialog(true);
        }

      } catch (error) {
        console.error("Failed to check for app updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  return { showUpdateDialog, updateUrl, latestVersion, updateNotes };
}
