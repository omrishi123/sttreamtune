package com.streamtune.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.webkit.JavascriptInterface;
import androidx.media.session.MediaButtonReceiver;
import android.support.v4.media.session.PlaybackStateCompat;

public class WebAppInterface {
    private final Context context;

    public WebAppInterface(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            return context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    @JavascriptInterface
    public void startPlayback(String playlistJson, int currentIndex) {
        Intent intent = new Intent(context, MusicPlayerService.class);
        intent.setAction("PLAY_PLAYLIST");
        intent.putExtra("PLAYLIST_JSON", playlistJson);
        intent.putExtra("CURRENT_INDEX", currentIndex);
        context.startService(intent);
    }

    @JavascriptInterface
    public void setSleepTimer(long durationInMillis) {
        Intent intent = new Intent(context, MusicPlayerService.class);
        intent.setAction("SET_SLEEP_TIMER");
        intent.putExtra("SLEEP_TIMER_DURATION", durationInMillis);
        context.startService(intent);
    }

    private void sendMediaButtonIntent(long action) {
        try {
            PendingIntent pendingIntent = MediaButtonReceiver.buildMediaButtonPendingIntent(context, action);
            pendingIntent.send();
        } catch (PendingIntent.CanceledException e) {
            // This might happen if the service is killed, so we restart it.
            Intent intent = new Intent(Intent.ACTION_MEDIA_BUTTON);
            intent.setPackage(context.getPackageName());
            MediaButtonReceiver.handleIntent(intent);
        }
    }

    @JavascriptInterface
    public void playNext() {
        sendMediaButtonIntent(PlaybackStateCompat.ACTION_SKIP_TO_NEXT);
    }

    @JavascriptInterface
    public void playPrevious() {
        sendMediaButtonIntent(PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS);
    }

    @JavascriptInterface
    public void play() {
        sendMediaButtonIntent(PlaybackStateCompat.ACTION_PLAY);
    }

    @JavascriptInterface
    public void pause() {
        sendMediaButtonIntent(PlaybackStateCompat.ACTION_PAUSE);
    }

    @JavascriptInterface
    public void seekTo(int positionInSeconds) {
        // Seek is not a standard media button action, so it still needs a custom intent.
        Intent intent = new Intent(context, MusicPlayerService.class);
        intent.setAction("ACTION_SEEK_TO");
        intent.putExtra("SEEK_TO_POSITION", (long) positionInSeconds * 1000);
        context.startService(intent);
    }

    @JavascriptInterface
    public void signInWithGoogle() {
        Intent intent = new Intent("SIGN_IN_GOOGLE");
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }

    @JavascriptInterface
    public void chooseProfileImage() {
        Intent intent = new Intent("CHOOSE_IMAGE");
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }
}
