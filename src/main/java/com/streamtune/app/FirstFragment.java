package com.streamtune.app;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.streamtune.app.databinding.FragmentFirstBinding;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FirstFragment extends Fragment {

    private FragmentFirstBinding binding;
    private WebView webView;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    // Receivers
    private BroadcastReceiver uiUpdateReceiver;
    private BroadcastReceiver googleSignInReceiver;
    private BroadcastReceiver chooseImageReceiver;

    // Google Sign-In
    private GoogleSignInClient mGoogleSignInClient;

    // Activity Result Launchers
    private ActivityResultLauncher<Intent> signInLauncher;
    private ActivityResultLauncher<Intent> pickImageLauncher;
    private ActivityResultLauncher<String> requestPermissionLauncher;

    private static final String TAG = "FirstFragment";

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupActivityLaunchers();
        configureGoogleSignIn();
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentFirstBinding.inflate(inflater, container, false);
        webView = binding.webView;
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        setupWebView();
        setupUIReciever();
        setupGoogleSignInReceiver();
        setupChooseImageReceiver();
        setupBackButtonHandler();
    }

    private void setupActivityLaunchers() {
        // THIS LAUNCHER HANDLES THE RESULT FROM THE GOOGLE SIGN-IN ACTIVITY
        signInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == Activity.RESULT_OK) {
                        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                        try {
                            GoogleSignInAccount account = task.getResult(ApiException.class);
                            if (account != null && account.getIdToken() != null) {
                                // NEW: Send the idToken to the WebView
                                sendIdTokenToWebView(account.getIdToken());
                            } else {
                                Log.w(TAG, "Google sign in failed: No ID Token found.");
                                Toast.makeText(getContext(), "Sign in failed, please try again.", Toast.LENGTH_SHORT).show();
                            }
                        } catch (ApiException e) {
                            Log.w(TAG, "Google sign in failed", e);
                            Toast.makeText(getContext(), "Sign in failed: " + e.getStatusCode(), Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Log.w(TAG, "Sign in cancelled or failed with result code: " + result.getResultCode());
                    }
                });

        pickImageLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null && result.getData().getData() != null) {
                        Uri imageUri = result.getData().getData();
                        Log.d("ProfileImage", "Image selected: " + imageUri.toString());
                        convertImageUriToBase64AndSend(imageUri);
                    }
                });

        requestPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                isGranted -> {
                    if (isGranted) {
                        launchImagePicker();
                    } else {
                        Toast.makeText(getContext(), "Permission denied to read images.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void configureGoogleSignIn() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        if (getActivity() != null) {
            mGoogleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        }
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new WebAppInterface(requireContext().getApplicationContext()), "Android");
        webView.loadUrl("https://sttreamtune.vercel.app/");
    }

    private void startSignInFlow() {
        if (mGoogleSignInClient == null) {
            Log.e(TAG, "GoogleSignInClient not initialized.");
            return;
        }
        // Always sign out first to allow account switching
        mGoogleSignInClient.signOut().addOnCompleteListener(requireActivity(), task -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            signInLauncher.launch(signInIntent);
        });
    }

    // NEW: Function to send the ID token to the WebView
    private void sendIdTokenToWebView(String idToken) {
        if (webView != null) {
            // Important: Escape the token to prevent errors in JavaScript if it contains quotes
            String escapedToken = idToken.replace("'", "\\'");
            String jsCallback = "javascript:handleGoogleSignInFromNative('" + escapedToken + "')";
            webView.post(() -> webView.evaluateJavascript(jsCallback, null));
        }
    }

    private void setupUIReciever() {
        uiUpdateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("UPDATE_UI".equals(intent.getAction())) {
                    String stateJson = intent.getStringExtra("STATE_JSON");
                    if (webView != null && stateJson != null) {
                        webView.post(() -> webView.evaluateJavascript("if(window.updateFromNative) { window.updateFromNative(" + stateJson + "); }", null));
                    }
                }
            }
        };
        LocalBroadcastManager.getInstance(requireContext()).registerReceiver(uiUpdateReceiver, new IntentFilter("UPDATE_UI"));
    }

    private void setupGoogleSignInReceiver() {
        googleSignInReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("SIGN_IN_GOOGLE".equals(intent.getAction())) {
                    startSignInFlow();
                }
            }
        };
        LocalBroadcastManager.getInstance(requireContext()).registerReceiver(googleSignInReceiver, new IntentFilter("SIGN_IN_GOOGLE"));
    }

    private void setupChooseImageReceiver() {
        chooseImageReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("CHOOSE_IMAGE".equals(intent.getAction())) {
                    pickProfileImage();
                }
            }
        };
        LocalBroadcastManager.getInstance(requireContext()).registerReceiver(chooseImageReceiver, new IntentFilter("CHOOSE_IMAGE"));
    }

    private void setupBackButtonHandler() {
        requireActivity().getOnBackPressedDispatcher().addCallback(getViewLifecycleOwner(), new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    if (getActivity() != null) {
                        getActivity().getOnBackPressedDispatcher().onBackPressed();
                    }
                }
            }
        });
    }

    public void pickProfileImage() {
        if (getContext() == null) return;

        String permission = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
                ? Manifest.permission.READ_MEDIA_IMAGES
                : Manifest.permission.READ_EXTERNAL_STORAGE;

        if (ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED) {
            launchImagePicker();
        } else {
            requestPermissionLauncher.launch(permission);
        }
    }

    private void launchImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        pickImageLauncher.launch(intent);
    }

    private void convertImageUriToBase64AndSend(Uri imageUri) {
        if (getContext() == null) return;
        Toast.makeText(getContext(), "Processing image...", Toast.LENGTH_SHORT).show();

        executorService.submit(() -> {
            try (InputStream inputStream = requireActivity().getContentResolver().openInputStream(imageUri)) {
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream);
                byte[] byteArray = byteArrayOutputStream.toByteArray();
                String base64Image = Base64.encodeToString(byteArray, Base64.NO_WRAP);
                String dataUrl = "data:image/jpeg;base64," + base64Image;

                if (getActivity() != null) {
                    getActivity().runOnUiThread(() -> {
                        String javascript = "if(window.updateProfileImage) { window.updateProfileImage('" + dataUrl + "'); }";
                        webView.evaluateJavascript(javascript, null);
                        Toast.makeText(getContext(), "Image sent to web app!", Toast.LENGTH_SHORT).show();
                    });
                }
            } catch (Exception e) {
                Log.e("ProfileImage", "Failed to convert image to Base64", e);
                if (getActivity() != null) {
                    getActivity().runOnUiThread(() -> Toast.makeText(getContext(), "Failed to process image.", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (uiUpdateReceiver != null) LocalBroadcastManager.getInstance(requireContext()).unregisterReceiver(uiUpdateReceiver);
        if (googleSignInReceiver != null) LocalBroadcastManager.getInstance(requireContext()).unregisterReceiver(googleSignInReceiver);
        if (chooseImageReceiver != null) LocalBroadcastManager.getInstance(requireContext()).unregisterReceiver(chooseImageReceiver);
        binding = null;
    }
}
