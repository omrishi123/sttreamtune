
'use client';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from './types';
import { nanoid } from 'nanoid';

const DEVICE_ID_KEY = 'streamtune_device_id';

// Gets or creates a unique ID for the device
const getDeviceId = (): string => {
  if (typeof window === 'undefined') return '';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${nanoid(12)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// The main function to call on app load. It now pings every time.
export const pingUserActivity = async (user: User) => {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  const isGuest = user.id === 'guest';
  // Create a more readable guest name
  const guestName = `Guest-${deviceId.substring(7, 13)}`;

  const activityData = {
    deviceId: deviceId,
    userId: user.id,
    userName: isGuest ? guestName : user.name,
    lastSeen: serverTimestamp(),
    isGuest,
  };

  try {
    const activityRef = doc(db, 'user_activity', deviceId);
    // Use setDoc with merge:true, which will create the document or update it if it exists.
    await setDoc(activityRef, activityData, { merge: true });
  } catch (error) {
    console.error('Failed to ping user activity:', error);
  }
};
