package com.invictus.omnitracker;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShortcutIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShortcutIntent(intent);
    }

    private void handleShortcutIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && bridge != null && bridge.getWebView() != null) {
            final String urlStr = data.toString();
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    bridge.getWebView().loadUrl(urlStr);
                }
            });
        }
    }
}
