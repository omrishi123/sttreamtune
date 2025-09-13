
'use client';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from './types';
import { nanoid } from 'nanoid';

const DEVICE_ID_KEY = 'streamtune_device_id';
const LAST_PING_KEY = 'streamtune_last_activity_ping';
const PING_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

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

// Checks if we should ping the server based on the last ping time
const shouldPing = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lastPing = localStorage.getItem(LAST_PING_KEY);
  if (!lastPing) {
    return true; // Never pinged before
  }
  return Date.now() - parseInt(lastPing, 10) > PING_INTERVAL;
};

// Updates the last ping time in local storage
const updateLastPingTimestamp = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_PING_KEY, Date.now().toString());
};

// The main function to call on app load
export const pingUserActivity = async (user: User) => {
  if (!shouldPing()) {
    return; // It's not time to ping yet
  }

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
    await setDoc(activityRef, activityData, { merge: true });
    updateLastPingTimestamp(); // Only update timestamp on successful write
  } catch (error) {
    console.error('Failed to ping user activity:', error);
  }
};
