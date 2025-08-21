package com.streamtune.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.IBinder;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.media.MediaBrowserServiceCompat;
import androidx.media.session.MediaButtonReceiver;

import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants;
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer;
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener;
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions;
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MusicPlayerService extends MediaBrowserServiceCompat implements LifecycleOwner {

    private YouTubePlayer youTubePlayer;
    private MediaSessionCompat mediaSession;
    private final LifecycleRegistry lifecycleRegistry = new LifecycleRegistry(this);
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    private List<Song> playlist = new ArrayList<>();
    private int currentIndex = -1;
    private MediaMetadataCompat currentMetadata;
    private CountDownTimer sleepTimer;

    private static final String TAG = "StreamTuneDebug";
    private static final String CHANNEL_ID = "MusicPlayerChannel";
    private static final int NOTIFICATION_ID = 1;
    private String pendingVideoId = null;

    private final MediaSessionCompat.Callback mediaSessionCallback = new MediaSessionCompat.Callback() {
        @Override
        public void onPlay() {
            if (youTubePlayer != null) youTubePlayer.play();
        }

        @Override
        public void onPause() {
            if (youTubePlayer != null) youTubePlayer.pause();
        }

        @Override
        public void onSeekTo(long pos) {
            if (youTubePlayer != null) {
                youTubePlayer.seekTo(pos / 1000f);
            }
        }

        @Override
        public void onSkipToNext() {
            if (currentIndex < playlist.size() - 1) {
                currentIndex++;
                playSongAtIndex();
            }
        }

        @Override
        public void onSkipToPrevious() {
            if (currentIndex > 0) {
                currentIndex--;
                playSongAtIndex();
            }
        }

        @Override
        public void onStop() {
            stopSelf();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START);
        createNotificationChannel();
        initMediaSession();
        initYouTubePlayer();
    }

    private void initMediaSession() {
        ComponentName mediaButtonReceiver = new ComponentName(getApplicationContext(), MediaButtonReceiver.class);
        mediaSession = new MediaSessionCompat(this, TAG, mediaButtonReceiver, null);
        mediaSession.setCallback(mediaSessionCallback);
        setSessionToken(mediaSession.getSessionToken());
        updatePlaybackState(PlaybackStateCompat.STATE_NONE, 0);
    }

    private void initYouTubePlayer() {
        YouTubePlayerView youTubePlayerView = new YouTubePlayerView(this);
        getLifecycle().addObserver(youTubePlayerView);
        youTubePlayerView.setEnableAutomaticInitialization(false);

        IFramePlayerOptions options = new IFramePlayerOptions.Builder().controls(0).build();

        youTubePlayerView.initialize(new AbstractYouTubePlayerListener() {
            @Override
            public void onReady(@NonNull YouTubePlayer player) {
                youTubePlayer = player;
                if (pendingVideoId != null) {
                    player.loadVideo(pendingVideoId, 0);
                    pendingVideoId = null;
                }
            }

            @Override
            public void onStateChange(@NonNull YouTubePlayer player, @NonNull PlayerConstants.PlayerState state) {
                try {
                    long currentPosition = (mediaSession.getController() != null && mediaSession.getController().getPlaybackState() != null)
                            ? mediaSession.getController().getPlaybackState().getPosition()
                            : 0;

                    switch (state) {
                        case PLAYING:
                            mediaSession.setActive(true);
                            updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, currentPosition);
                            startForeground(NOTIFICATION_ID, buildNotification());
                            broadcastUiUpdate(new JSONObject().put("isPlaying", true));
                            break;
                        case PAUSED:
                            updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, currentPosition);
                            updateNotification();
                            stopForeground(false);
                            broadcastUiUpdate(new JSONObject().put("isPlaying", false));
                            break;
                        case ENDED:
                            mediaSessionCallback.onSkipToNext();
                            break;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in onStateChange", e);
                }
            }

            @Override
            public void onError(@NonNull YouTubePlayer player, @NonNull PlayerConstants.PlayerError error) {
                Log.e(TAG, "YouTube Player Error: " + error);
            }

            @Override
            public void onCurrentSecond(@NonNull YouTubePlayer youTubePlayer, float second) {
                if (mediaSession.getController() != null && mediaSession.getController().getPlaybackState() != null &&
                        mediaSession.getController().getPlaybackState().getState() == PlaybackStateCompat.STATE_PLAYING) {
                    updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, (long) (second * 1000));
                }
                try {
                    broadcastUiUpdate(new JSONObject().put("currentTime", second));
                } catch (Exception e) {
                    Log.e(TAG, "Error broadcasting current time", e);
                }
            }

            @Override
            public void onVideoDuration(@NonNull YouTubePlayer youTubePlayer, float duration) {
                if (mediaSession.getController().getMetadata() == null) return;
                MediaMetadataCompat.Builder builder = new MediaMetadataCompat.Builder(mediaSession.getController().getMetadata());
                builder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, (long) (duration * 1000));
                mediaSession.setMetadata(builder.build());
            }
        }, true, options);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        MediaButtonReceiver.handleIntent(mediaSession, intent);
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            switch (action) {
                case "PLAY_PLAYLIST":
                    String playlistJson = intent.getStringExtra("PLAYLIST_JSON");
                    currentIndex = intent.getIntExtra("CURRENT_INDEX", -1);
                    parsePlaylist(playlistJson);
                    playSongAtIndex();
                    break;
                case "SET_SLEEP_TIMER":
                    long duration = intent.getLongExtra("SLEEP_TIMER_DURATION", 0);
                    handleSleepTimer(duration);
                    break;
                case "ACTION_PLAY":
                    if (mediaSessionCallback != null) mediaSessionCallback.onPlay();
                    break;
                case "ACTION_PAUSE":
                    if (mediaSessionCallback != null) mediaSessionCallback.onPause();
                    break;
                case "ACTION_SEEK_TO":
                    long pos = intent.getLongExtra("SEEK_TO_POSITION", 0);
                    if (mediaSessionCallback != null) mediaSessionCallback.onSeekTo(pos);
                    break;
            }
        }
        return START_NOT_STICKY;
    }

    private void handleSleepTimer(long durationInMillis) {
        if (sleepTimer != null) {
            sleepTimer.cancel();
        }
        if (durationInMillis <= 0) {
            return;
        }
        sleepTimer = new CountDownTimer(durationInMillis, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {}

            @Override
            public void onFinish() {
                if (mediaSessionCallback != null) {
                    mediaSessionCallback.onPause();
                }
            }
        }.start();
    }

    private void parsePlaylist(String json) {
        playlist.clear();
        try {
            JSONArray jsonArray = new JSONArray(json);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                Song song = new Song();
                song.videoId = jsonObject.optString("videoId");
                song.title = jsonObject.optString("title");
                song.artist = jsonObject.optString("artist");
                song.thumbnailUrl = jsonObject.optString("thumbnailUrl");
                playlist.add(song);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse playlist JSON", e);
        }
    }

    private void playSongAtIndex() {
        if (playlist.isEmpty() || currentIndex < 0 || currentIndex >= playlist.size()) {
            stopSelf();
            return;
        }
        Song currentSong = playlist.get(currentIndex);
        updateMetadata(currentSong.title, currentSong.artist, currentSong.thumbnailUrl);

        updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING, 0);
        startForeground(NOTIFICATION_ID, buildNotification());

        if (youTubePlayer != null) {
            youTubePlayer.loadVideo(currentSong.videoId, 0);
        } else {
            pendingVideoId = currentSong.videoId;
        }

        try {
            broadcastUiUpdate(new JSONObject().put("newSongIndex", currentIndex));
        } catch (Exception e) {
            Log.e(TAG, "Error broadcasting new song index", e);
        }
    }

    private void updateMetadata(String title, String artist, String thumbnailUrl) {
        executorService.submit(() -> {
            Bitmap artwork = null;
            if (thumbnailUrl != null && !thumbnailUrl.isEmpty()) {
                try {
                    URL url = new URL(thumbnailUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    artwork = BitmapFactory.decodeStream(input);
                } catch (Exception e) {
                    Log.e(TAG, "Error downloading artwork", e);
                }
            }

            MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist);

            if (artwork != null) {
                metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork);
            }

            mediaSession.setMetadata(metadataBuilder.build());
            updateNotification();
        });
    }

    private void updateNotification() {
        if (mediaSession.getController() == null || mediaSession.getController().getPlaybackState() == null) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        PlaybackStateCompat playbackState = mediaSession.getController().getPlaybackState();
        int state = (playbackState == null) ? PlaybackStateCompat.STATE_NONE : playbackState.getState();

        MediaMetadataCompat metadata = mediaSession.getController().getMetadata();
        String title = "StreamTune";
        String artist = "Loading...";
        Bitmap artwork = null;

        if (metadata != null) {
            title = metadata.getString(MediaMetadataCompat.METADATA_KEY_TITLE);
            artist = metadata.getString(MediaMetadataCompat.METADATA_KEY_ARTIST);
            artwork = metadata.getBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART);
        }

        NotificationCompat.Action playPauseAction = (state == PlaybackStateCompat.STATE_PLAYING || state == PlaybackStateCompat.STATE_BUFFERING)
                ? new NotificationCompat.Action(R.drawable.ic_pause, "Pause", MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_PAUSE))
                : new NotificationCompat.Action(R.drawable.ic_play, "Play", MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_PLAY));

        NotificationCompat.Action prevAction = new NotificationCompat.Action(R.drawable.ic_previous, "Previous", MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS));
        NotificationCompat.Action nextAction = new NotificationCompat.Action(R.drawable.ic_next, "Next", MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_SKIP_TO_NEXT));

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(artist)
                .setLargeIcon(artwork)
                .setSmallIcon(R.drawable.ic_music_note)
                .setDeleteIntent(MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_STOP))
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(prevAction)
                .addAction(playPauseAction)
                .addAction(nextAction)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2))
                .build();
    }

    private void updatePlaybackState(int state, long position) {
        long actions = PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_STOP |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                PlaybackStateCompat.ACTION_SEEK_TO;
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder().setActions(actions);
        stateBuilder.setState(state, position, 1.0f);
        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void broadcastUiUpdate(JSONObject state) {
        Intent intent = new Intent("UPDATE_UI");
        intent.putExtra("STATE_JSON", state.toString());
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    private void createNotificationChannel() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Music Player", NotificationManager.IMPORTANCE_LOW));
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (sleepTimer != null) {
            sleepTimer.cancel();
        }
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP);
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY);
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        executorService.shutdown();
    }

    @NonNull
    @Override
    public Lifecycle getLifecycle() {
        return lifecycleRegistry;
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return super.onBind(intent); }
    @Nullable @Override public BrowserRoot onGetRoot(@NonNull String c, int i, @Nullable Bundle b) { return new BrowserRoot("media_root", null); }
    @Override public void onLoadChildren(@NonNull String p, @NonNull Result<List<MediaBrowserCompat.MediaItem>> r) { r.sendResult(null); }
}

    