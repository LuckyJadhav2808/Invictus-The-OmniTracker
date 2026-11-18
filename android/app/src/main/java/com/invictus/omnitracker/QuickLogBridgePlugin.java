package com.invictus.omnitracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Invictus QuickLogBridge Capacitor Plugin
 * Bridges the React frontend with the native ambient notification dock and floating micro-dialog.
 */
@CapacitorPlugin(name = "QuickLogBridge")
public class QuickLogBridgePlugin extends Plugin {

    private static final String PREFS_NAME = "invictus_quick_log_prefs";

    @PluginMethod
    public void syncBudgetTelemetry(PluginCall call) {
        Double safeToSpend = call.getDouble("safeToSpend");
        if (safeToSpend == null) {
            safeToSpend = 1420.0;
        }

        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putFloat("safe_to_spend", safeToSpend.floatValue()).apply();

            boolean isEnabled = prefs.getBoolean(QuickLogNotificationManager.KEY_DOCK_ENABLED, true);
            if (isEnabled) {
                QuickLogNotificationManager.showAmbientNotification(context, safeToSpend);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("safeToSpend", safeToSpend);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to sync budget telemetry: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void setAmbientDockEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("Missing 'enabled' parameter");
            return;
        }

        try {
            Context context = getContext();
            QuickLogNotificationManager.setAmbientEnabled(context, enabled);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("enabled", enabled);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to set ambient dock state: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void isAmbientDockEnabled(PluginCall call) {
        try {
            Context context = getContext();
            boolean enabled = QuickLogNotificationManager.isAmbientEnabled(context);

            JSObject ret = new JSObject();
            ret.put("enabled", enabled);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to query ambient dock state: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void launchQuickLogDialog(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(context, QuickLogDialogActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to launch quick log dialog: " + e.getMessage(), e);
        }
    }
}
