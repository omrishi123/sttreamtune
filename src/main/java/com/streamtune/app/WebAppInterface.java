package com.streamtune.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.webkit.JavascriptInterface;

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

    private void sendMediaCommand(String action) {
        Intent intent = new Intent(context, MusicPlayerService.class);
        intent.setAction(action);
        context.startService(intent);
    }
    
    @JavascriptInterface
    public void play() {
        sendMediaCommand("ACTION_PLAY");
    }
    
    @JavascriptInterface
    public void pause() {
        sendMediaCommand("ACTION_PAUSE");
    }

    @JavascriptInterface
    public void playNext() {
        sendMediaCommand("ACTION_SKIP_TO_NEXT");
    }

    @JavascriptInterface
    public void playPrevious() {
        sendMediaCommand("ACTION_SKIP_TO_PREVIOUS");
    }

    @JavascriptInterface
    public void seekTo(int positionInSeconds) {
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
