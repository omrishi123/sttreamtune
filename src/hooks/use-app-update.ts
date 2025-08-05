
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import pjson from '../../package.json';

const CURRENT_VERSION = pjson.version;

/**
 * A robust version comparison function.
 * Returns true if version2 is strictly greater than version1.
 */
const isNewerVersion = (version1: string, version2: string) => {
    // Ensure inputs are valid strings
    if (typeof version1 !== 'string' || typeof version2 !== 'string') {
        return false;
    }

    const parts1 = version1.split('.').map(v => parseInt(v, 10));
    const parts2 = version2.split('.').map(v => parseInt(v, 10));

    // Ensure all parts are valid numbers
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
    
    // Versions are identical
    return false;
}

export function useAppUpdate() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    // This check ensures the update logic ONLY runs inside the native Android app.
    if (typeof window.Android === 'undefined') {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const configRef = doc(db, 'app-config', 'version');
        const docSnap = await getDoc(configRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteVersion = data.latestVersion;
          const url = data.updateUrl;
          
          if (remoteVersion && url && isNewerVersion(CURRENT_VERSION, remoteVersion)) {
             setLatestVersion(remoteVersion);
             setUpdateUrl(url);
             setShowUpdateDialog(true);
          }
        } else {
            console.log("No update configuration found in Firestore.");
        }
      } catch (error) {
        console.error("Failed to check for app updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  return { showUpdateDialog, updateUrl, latestVersion };
}
