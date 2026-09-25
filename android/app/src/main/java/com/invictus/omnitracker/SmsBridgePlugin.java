package com.invictus.omnitracker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsBridge",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS }
        ),
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class SmsBridgePlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        boolean hasSms = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasNotif = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotif = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        JSObject ret = new JSObject();
        ret.put("smsGranted", hasSms);
        ret.put("notificationsGranted", hasNotif);
        ret.put("allGranted", hasSms && hasNotif);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionForAliases(new String[]{"sms", "notifications"}, call, "allPermCallback");
        } else {
            requestPermissionForAlias("sms", call, "allPermCallback");
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            android.net.Uri uri = android.net.Uri.fromParts("package", context.getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open settings", e);
        }
    }

    @PermissionCallback
    private void allPermCallback(PluginCall call) {
        Context context = getContext();
        boolean hasSms = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasNotif = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotif = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        JSObject ret = new JSObject();
        ret.put("smsGranted", hasSms);
        ret.put("notificationsGranted", hasNotif);
        ret.put("allGranted", hasSms && hasNotif);
        call.resolve(ret);
    }
}
