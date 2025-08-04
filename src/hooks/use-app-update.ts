
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import pjson from '../../package.json';

const CURRENT_VERSION = pjson.version;

// A simple version comparison function.
// Returns true if version2 is greater than version1.
const isNewerVersion = (version1: string, version2: string) => {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);
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

  useEffect(() => {
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
            // You can create this document in your Firestore console
            // Collection: 'app-config', Document ID: 'version'
            // Fields: latestVersion (string), updateUrl (string)
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
