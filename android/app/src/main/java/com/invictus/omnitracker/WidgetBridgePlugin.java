package com.invictus.omnitracker;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    private static final String PREFS_NAME = "invictus_widget_prefs";
    private static final String KEY_WIDGET_JSON = "widget_json";

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("Missing data payload");
            return;
        }

        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_WIDGET_JSON, data).apply();

            // Notify SafeSpendWidgetProvider to update home screen widgets immediately
            Intent intent = new Intent(context, SafeSpendWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(
                new ComponentName(context, SafeSpendWidgetProvider.class)
            );
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to update widget data: " + e.getMessage(), e);
        }
    }
}
