# StreamTune

**StreamTune** is a modern, feature-rich music streaming application that leverages the vast library of YouTube to provide a seamless and powerful listening experience across both web and Android. It combines robust playback features with AI-driven discovery tools, community sharing, and deep personalization.

## Key Features

-   **Unlimited Streaming:** Search and stream any song or music video directly from YouTube's extensive catalog.
-   **Your Supermix (Infinite Radio):** A dedicated, intelligent radio station that analyzes your listening habits, search history, and liked songs to provide an endless, perfectly-tailored stream of music.
-   **AI Playlist Generator:** Describe any mood, genre, or vibe (e.g., "Mellow acoustic tracks for a rainy afternoon"), and our Gemini-powered AI crafts a personalized playlist for you instantly.
-   **Universal Downloads:** High-quality audio downloading available on both Web and Android. Save your favorite tracks directly to your device for offline enjoyment.
-   **Advanced YouTube Integration:**
    *   **Channel Import:** Import an entire YouTube channel to automatically organize their uploads and public playlists into your library.
    *   **Playlist Import:** Bring any public YouTube playlist directly into your StreamTune collection.
-   **Community & Sharing:**
    *   Create and share your own playlists publicly with the StreamTune community.
    *   Discover, explore, and "Like" playlists created by other users.
    *   Share deep links to playlists that open directly inside the native Android app.
-   **Personalized Experience:**
    *   **Listening Stats:** Track your most-played artists, genres, and total listening time.
    *   **Verified Creators:** Special badges for recognized community contributors and artists.
    *   **Genre Preferences:** Tailored home page content based on your selected music taste.
-   **Native Android App:**
    *   **Background Playback:** Keep your music playing even when the app is in the background or your screen is off.
    *   **System Media Controls:** Control playback from your lock screen, notification shade, or connected Bluetooth devices.
    *   **Sleep Timer:** Set a timer (or custom duration) to automatically stop playback when you fall asleep.
-   **Premium UI & Customization:**
    *   Multiple gorgeous themes including **Sunset Groove**, **Zenith**, **Dark**, and **Light**.
    *   Smooth animations and high-fidelity interface built with ShadCN UI and Framer Motion.

## Getting Started

### YouTube API Key

This project uses the YouTube Data API v3 to search for music and playlists. To enable this functionality, you must obtain a YouTube API key.

1.  **Go to the Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a new project** or select an existing one.
3.  **Enable the YouTube Data API v3**:
    *   Navigate to "APIs & Services" > "Library".
    *   Search for "YouTube Data API v3" and click "Enable".
4.  **Create Credentials**:
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" and select "API key".
    *   Copy the generated API key.
5.  **Add the key to your environment**:
    *   Create a file named `.env` in the root of your project if it doesn't exist.
    *   Add the following line to your `.env` file, replacing `YOUR_API_KEY` with the key you just copied:
        ```
        YOUTUBE_API_KEY=YOUR_API_KEY
        GEMINI_API_KEY=YOUR_GEMINI_KEY
        ```
6.  **Restart your development server** for the new environment variable to be loaded.
