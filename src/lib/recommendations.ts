
import { generateRecommendations, GenerateRecommendationsOutput } from '@/ai/flows/generate-recommendations-flow';
import type { Track } from './types';

const MAX_SEARCH_HISTORY = 5;
const SEARCH_HISTORY_KEY = 'searchHistory';
const RECOMMENDATIONS_CACHE_KEY = 'recommendedTracksCache';

interface RecommendationCache {
    history: string[];
    tracks: Track[];
    timestamp: number;
}

// Client-side function to get search history
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

// Client-side function to update search history
export const updateSearchHistory = (query: string) => {
    if (typeof window === 'undefined') return;
    try {
        const history = getSearchHistory();
        // Add new query to the front, remove duplicates, and slice to max length
        const updatedHistory = [query, ...history.filter((item: string) => item !== query)].slice(0, MAX_SEARCH_HISTORY);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to update search history:", error);
    }
}

// Client-side function to clear recommendations from cache
export const clearCachedRecommendations = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
}

// This function can be called from client components ('use client')
// It handles fetching and caching logic.
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
            // Check if history matches. JSON.stringify is a simple way to compare arrays of strings.
            if (JSON.stringify(cache.history) === JSON.stringify(currentHistory)) {
                return { tracks: cache.tracks, fromCache: true };
            }
        }
    } catch (error) {
        console.error("Failed to read recommendation cache:", error);
    }
    
    // If no valid cache, fetch new recommendations
    try {
        const results = await generateRecommendations({ history: currentHistory });
        
        // Save new recommendations to cache
        const newCache: RecommendationCache = {
            history: currentHistory,
            tracks: results,
            timestamp: Date.now(),
        };
        localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(newCache));
        
        return { tracks: results, fromCache: false };
    } catch (error) {
         console.error('Failed to fetch recommendations:', error);
         // Don't toast from here as this is a library function, let the caller decide.
         return { tracks: [], fromCache: false };
    }
};
