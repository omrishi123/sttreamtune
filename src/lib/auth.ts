import { User } from '@/lib/types';

// This is a temporary auth system.
// In a real application, you would use a proper authentication provider.

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  likedSongs: [],
  playlists: [],
};

const LOGGED_IN_USER: User = {
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  likedSongs: ['1', '5', '9'],
  playlists: ['pl-6', 'pl-7', 'pl-8'],
};

// This function would typically check for a valid session.
// For now, it's controlled by a simple flag in localStorage.
export const getSession = (): { user: User | null; isLoggedIn: boolean } => {
  if (typeof window === 'undefined') {
    return { user: null, isLoggedIn: false };
  }

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn) {
    return { user: LOGGED_IN_USER, isLoggedIn: true };
  }
  return { user: GUEST_USER, isLoggedIn: false };
};

export const login = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isLoggedIn', 'true');
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isLoggedIn');
  }
};
