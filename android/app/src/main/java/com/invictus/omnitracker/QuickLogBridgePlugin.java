package com.invictus.omnitracker;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Invictus QuickLogBridge Capacitor Plugin
 * Bridges the React frontend with the native ambient notification dock and floating micro-dialog.
 */
@CapacitorPlugin(
    name = "QuickLogBridge",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class QuickLogBridgePlugin extends Plugin {

    private static final String PREFS_NAME = "invictus_quick_log_prefs";
    private static final String SMS_PREFS_NAME = "invictus_sms_prefs";

    @PluginMethod
    public void syncBudgetTelemetry(PluginCall call) {
        Double safeToSpend = call.getDouble("safeToSpend");
        if (safeToSpend == null) {
            safeToSpend = 1420.0;
        }
        String userId = call.getString("userId");

        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putFloat("safe_to_spend", safeToSpend.floatValue());
            if (userId != null && !userId.isEmpty()) {
                editor.putString("userId", userId);
                // Also sync to SMS prefs for unified identity
                SharedPreferences smsPrefs = context.getSharedPreferences(SMS_PREFS_NAME, Context.MODE_PRIVATE);
                smsPrefs.edit().putString("userId", userId).apply();
            }
            editor.apply();

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

    @PluginMethod
    public void getPendingExpenses(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String pendingRaw = prefs.getString("pending_quick_logs", "[]");
            org.json.JSONArray jsonArray = new org.json.JSONArray(pendingRaw);

            com.getcapacitor.JSArray jsArray = new com.getcapacitor.JSArray();
            for (int i = 0; i < jsonArray.length(); i++) {
                org.json.JSONObject obj = jsonArray.getJSONObject(i);
                JSObject item = new JSObject();
                item.put("id", obj.optString("id"));
                item.put("amount", obj.optDouble("amount", 0.0));
                item.put("category", obj.optString("category", "Food"));
                item.put("note", obj.optString("note", "Quick Expense"));
                item.put("date", obj.optString("date"));
                item.put("timestamp", obj.optLong("timestamp", System.currentTimeMillis()));
                jsArray.put(item);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("expenses", jsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get pending quick log expenses: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void clearPendingExpenses(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString("pending_quick_logs", "[]").apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to clear pending quick log expenses: " + e.getMessage(), e);
        }
    }
}
