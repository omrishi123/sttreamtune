
'use client';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from './types';
import { nanoid } from 'nanoid';

// The user activity tracking feature has been disabled as per user request.
// The functions below are now empty and do nothing.

const DEVICE_ID_KEY = 'streamtune_device_id';

const getDeviceId = (): string => {
  if (typeof window === 'undefined') return '';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${nanoid(12)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const pingUserActivity = async (user: User) => {
  // This function has been disabled.
  return;
};
