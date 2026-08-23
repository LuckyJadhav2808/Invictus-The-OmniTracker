package com.invictus.omnitracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;
import com.capacitorjs.plugins.haptics.HapticsPlugin;
import com.capacitorjs.plugins.splashscreen.SplashScreenPlugin;
import com.capacitorjs.plugins.statusbar.StatusBarPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalNotificationsPlugin.class);
        registerPlugin(HapticsPlugin.class);
        registerPlugin(SplashScreenPlugin.class);
        registerPlugin(StatusBarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
