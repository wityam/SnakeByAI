package com.example.snake;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

public final class MainActivity extends Activity {
    private static final String BASE_URL = "https://snake.local/";
    private static final String GAME_URL = BASE_URL + "index.html";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setBackgroundColor(0xff101a18);

        // Account for system bars, including enforced edge-to-edge on Android 15+.
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        webView.setWebViewClient(new LocalGameClient());
        setContentView(webView);
        webView.loadUrl(GAME_URL);
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            // A visibility change is not guaranteed for a WebView in a backgrounded app.
            webView.evaluateJavascript("if (typeof state !== 'undefined' && state === 'playing') togglePause();", null);
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    /** Serve only the bundled game under a stable HTTPS origin for localStorage. */
    private final class LocalGameClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !GAME_URL.equals(request.getUrl().toString());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            String asset;
            String mime;
            if ((BASE_URL + "index.html").equals(url)) {
                asset = "index.html";
                mime = "text/html";
            } else if ((BASE_URL + "style.css").equals(url)) {
                asset = "style.css";
                mime = "text/css";
            } else if ((BASE_URL + "script.js").equals(url)) {
                asset = "script.js";
                mime = "application/javascript";
            } else {
                return notFound();
            }
            try {
                InputStream stream = getAssets().open(asset);
                return new WebResourceResponse(mime, "UTF-8", stream);
            } catch (IOException e) {
                return notFound();
            }
        }

        private WebResourceResponse notFound() {
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                    Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
        }
    }
}
