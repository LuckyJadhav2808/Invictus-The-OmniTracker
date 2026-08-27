package com.invictus.omnitracker;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;
import com.capacitorjs.plugins.haptics.HapticsPlugin;
import com.capacitorjs.plugins.splashscreen.SplashScreenPlugin;
import com.capacitorjs.plugins.statusbar.StatusBarPlugin;
import com.capacitorjs.plugins.app.AppPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppPlugin.class);
        registerPlugin(LocalNotificationsPlugin.class);
        registerPlugin(HapticsPlugin.class);
        registerPlugin(SplashScreenPlugin.class);
        registerPlugin(StatusBarPlugin.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null) {
            final String urlStr = data.toString();
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        bridge.getWebView().loadUrl(urlStr);
                    }
                });
            }
        }
    }
}
