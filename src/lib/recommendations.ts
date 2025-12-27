

import { generateRecommendations as generateRecommendationsFlow, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import type { Track, Playlist, UserMusicProfile } from './types';

const MAX_SEARCH_HISTORY = 10;
const SEARCH_HISTORY_KEY = 'searchHistory';
const RECOMMENDATIONS_CACHE_KEY = 'recommendedTracksCache';
const RECOMMENDED_PLAYLISTS_CACHE_PREFIX = 'recommended-playlists-';
const PLAYLIST_TRACKS_CACHE_PREFIX = 'playlist-tracks-';
const SINGLE_PLAYLIST_CACHE_PREFIX = 'single-playlist-';

interface RecommendationCache {
    history: string[];
    tracks: Track[];
    timestamp: number;
}

interface RecommendedPlaylistCache {
    playlists: Playlist[];
    timestamp: number;
}

interface PlaylistTracksCache {
    tracks: Track[];
    timestamp: number;
}

interface SinglePlaylistCache {
    playlist: Playlist;
    timestamp: number;
}


// ====== SEARCH HISTORY ======
export const getSearchHistory = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error("Failed to get search history:", error);
        return [];
    }
}

export const updateSearchHistory = (query: string) => {
    if (typeof window === 'undefined' || !query) return;
    try {
        const history = getSearchHistory();
        const updatedHistory = [query.trim(), ...history.filter((item: string) => item.toLowerCase() !== query.trim().toLowerCase())].slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
        
        // CRITICAL: A new search means the old recommendations are stale.
        clearRecommendationsCache();
    } catch (error) {
        console.error("Failed to update search history:", error);
    }
}

export const clearSearchHistoryCache = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    clearRecommendationsCache();
}

// ====== PERSONALIZED PLAYLIST RECOMMENDATIONS ======
export const getCachedRecommendedPlaylists = (genre: string): Playlist[] | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(`${RECOMMENDED_PLAYLISTS_CACHE_PREFIX}${genre}`);
        if (cached) {
            const data: RecommendedPlaylistCache = JSON.parse(cached);
            return data.playlists;
        }
        return null;
    } catch (error) {
        console.error(`Failed to get cached playlists for ${genre}:`, error);
        return null;
    }
};

export const cacheRecommendedPlaylists = (genre: string, playlists: Playlist[]) => {
    if (typeof window === 'undefined') return;
    try {
        const data: RecommendedPlaylistCache = {
            playlists,
            timestamp: Date.now(),
        };
        localStorage.setItem(`${RECOMMENDED_PLAYLISTS_CACHE_PREFIX}${genre}`, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to cache playlists for ${genre}:`, error);
    }
};


// ====== INDIVIDUAL PLAYLIST TRACKS CACHE ======
export const getCachedPlaylistTracks = (playlistId: string): Track[] | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(`${PLAYLIST_TRACKS_CACHE_PREFIX}${playlistId}`);
        if (cached) {
            const data: PlaylistTracksCache = JSON.parse(cached);
            return data.tracks;
        }
        return null;
    } catch (error) {
        console.error(`Failed to get cached tracks for playlist ${playlistId}:`, error);
        return null;
    }
};

export const cachePlaylistTracks = (playlistId: string, tracks: Track[]) => {
    if (typeof window === 'undefined') return;
    try {
        const data: PlaylistTracksCache = {
            tracks,
            timestamp: Date.now(),
        };
        localStorage.setItem(`${PLAYLIST_TRACKS_CACHE_PREFIX}${playlistId}`, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to cache tracks for playlist ${playlistId}:`, error);
    }
};

// ====== INDIVIDUAL YOUTUBE PLAYLIST METADATA CACHE ======
export const getCachedSinglePlaylist = (playlistId: string): Playlist | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(`${SINGLE_PLAYLIST_CACHE_PREFIX}${playlistId}`);
        if (cached) {
            const data: SinglePlaylistCache = JSON.parse(cached);
            return data.playlist;
        }
        return null;
    } catch (error) {
        console.error(`Failed to get cached playlist metadata for ${playlistId}:`, error);
        return null;
    }
};

export const cacheSinglePlaylist = (playlist: Playlist) => {
    if (typeof window === 'undefined') return;
    try {
        const data: SinglePlaylistCache = {
            playlist,
            timestamp: Date.now(),
        };
        localStorage.setItem(`${SINGLE_PLAYLIST_CACHE_PREFIX}${playlist.id}`, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to cache playlist metadata for ${playlist.id}:`, error);
    }
};


// ====== CACHE MANAGEMENT ======
export const clearRecommendationsCache = () => {
    if (typeof window === 'undefined') return;
    try {
        Object.keys(localStorage).forEach(key => {
            if (
                key.startsWith(RECOMMENDED_PLAYLISTS_CACHE_PREFIX) || 
                key.startsWith(PLAYLIST_TRACKS_CACHE_PREFIX) ||
                key.startsWith(SINGLE_PLAYLIST_CACHE_PREFIX)
            ) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error("Failed to clear recommendation caches:", error);
    }
};

// New function to just clear the AI genre playlists
export const clearAIGenrePlaylistsCache = () => {
     if (typeof window === 'undefined') return;
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(RECOMMENDED_PLAYLISTS_CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error("Failed to clear AI genre playlist caches:", error);
    }
}
