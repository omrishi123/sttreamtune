
'use client';

const PREFERENCES_KEY = 'streamtune-user-preferences';

interface UserPreferences {
  genres: string[];
  lastRefreshPrompt?: number;
}

export const saveUserPreferences = (genres: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const currentPrefs = getUserPreferences();
    const newPrefs: UserPreferences = {
      ...currentPrefs,
      genres,
    };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
  } catch (error) {
    console.error("Error saving user preferences to localStorage:", error);
  }
};

export const getUserPreferences = (): UserPreferences | null => {
  if (typeof window === 'undefined') return null;
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    return prefs ? JSON.parse(prefs) : null;
  } catch (error) {
    console.error("Error reading user preferences from localStorage:", error);
    return null;
  }
};

export const hasSelectedPreferences = (): boolean => {
    const prefs = getUserPreferences();
    return !!prefs && Array.isArray(prefs.genres) && prefs.genres.length > 0;
};

export const clearUserPreferences = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PREFERENCES_KEY);
}

export const shouldPromptForRefresh = (): boolean => {
    const prefs = getUserPreferences();
    if (!prefs) return false;

    const lastPrompt = prefs.lastRefreshPrompt || 0;
    const fifteenDaysInMillis = 15 * 24 * 60 * 60 * 1000;
    
    return (Date.now() - lastPrompt) > fifteenDaysInMillis;
}

export const updateUserRefreshPromptTimestamp = (): void => {
    if (typeof window === 'undefined') return;
    try {
        const currentPrefs = getUserPreferences() || { genres: [] };
        const newPrefs: UserPreferences = {
            ...currentPrefs,
            lastRefreshPrompt: Date.now(),
        };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
    } catch (error) {
        console.error("Error updating refresh prompt timestamp:", error);
    }
}
