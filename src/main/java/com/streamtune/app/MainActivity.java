package com.streamtune.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.streamtune.app.databinding.ActivityMainBinding;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;
    private String deepLinkUrl = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Handle the incoming deep link
        Intent intent = getIntent();
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri data = intent.getData();
            if (data != null) {
                deepLinkUrl = data.toString();
            }
        }
        
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
    }
    
    public String getInitialUrl() {
        if (deepLinkUrl != null) {
            String url = deepLinkUrl;
            deepLinkUrl = null; // Consume the link
            return url;
        }
        return "https://sttreamtune.vercel.app/";
    }
}