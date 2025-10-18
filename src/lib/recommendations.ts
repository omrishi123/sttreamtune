

import { generateRecommendations, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import type { Track, Playlist } from './types';

const MAX_SEARCH_HISTORY = 5;
const SEARCH_HISTORY_KEY = 'searchHistory';
const RECOMMENDATIONS_CACHE_KEY = 'recommendedTracksCache';
const RECOMMENDED_PLAYLISTS_CACHE_PREFIX = 'recommended-playlists-';
const PLAYLIST_TRACKS_CACHE_PREFIX = 'playlist-tracks-';
const SINGLE_PLAYLIST_CACHE_PREFIX = 'single-playlist-'; // New cache for individual YT playlists

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

// A simple cache for individual playlist objects
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
    if (typeof window === 'undefined') return;
    try {
        const history = getSearchHistory();
        const updatedHistory = [query, ...history.filter((item: string) => item !== query)].slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to update search history:", error);
    }
}

export const clearSearchHistoryCache = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    localStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
}


// ====== SONG RECOMMENDATIONS ======
export const getCachedRecommendations = async (): Promise<{ tracks: GenerateRecommendationsOutput, fromCache: boolean }> => {
    if (typeof window === 'undefined') return { tracks: [], fromCache: false };

    const currentHistory = getSearchHistory();
    if (currentHistory.length === 0) {
        return { tracks: [], fromCache: false };
    }

    try {
        const cachedData = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
        if (cachedData) {
            const cache: RecommendationCache = JSON.parse(cachedData);
            if (JSON.stringify(cache.history) === JSON.stringify(currentHistory)) {
                return { tracks: cache.tracks, fromCache: true };
            }
        }
    } catch (error) {
        console.error("Failed to read recommendation cache:", error);
    }
    
    try {
        const results = await generateRecommendations({ history: currentHistory });
        const newCache: RecommendationCache = {
            history: currentHistory,
            tracks: results,
            timestamp: Date.now(),
        };
        localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(newCache));
        
        return { tracks: results, fromCache: false };
    } catch (error) {
         console.error('Failed to fetch recommendations:', error);
         return { tracks: [], fromCache: false };
    }
};

// ====== PERSONALIZED PLAYLIST RECOMMENDATIONS ======
export const getCachedRecommendedPlaylists = (genre: string): Playlist[] | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(`${RECOMMENDED_PLAYLISTS_CACHE_PREFIX}${genre}`);
        if (cached) {
            const data: RecommendedPlaylistCache = JSON.parse(cached);
            // Optional: Add TTL logic here if needed, e.g., if (Date.now() - data.timestamp < some_ttl)
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
export const clearAllRecommendationCaches = () => {
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
        // Also clear song recommendations if they exist
        localStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
    } catch (error) {
        console.error("Failed to clear recommendation caches:", error);
    }
};
