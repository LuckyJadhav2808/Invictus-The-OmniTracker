package com.invictus.omnitracker;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.regex.Pattern;

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

    private static final Pattern BANK_HEADER_PATTERN = Pattern.compile(
            "^(?:[A-Za-z]{2}[-_]?)?(HDFCBK|SBINB|SBIPSG|SBIUPI|ICICIB|AXISBK|KOTAKB|INDUSB|YESBNK|PNBSMS|BOISMS|CANBNK|UBISMS|UNIONB|IDFCFB|FEDBNK|PAYTMB|CREDBK|CENTBK|BOBSMS|MAHBK|IOB|UCOBNK|RBLBNK|AUFINB|BANDHN|IDBIBK|SCISMS|AMEXIN|AIRTEL|JIOBNK)(?:[-_][A-Za-z0-9]+)?$",
            Pattern.CASE_INSENSITIVE
    );

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        boolean hasSms = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
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

    @PluginMethod
    public void fetchInboxSms(PluginCall call) {
        Context context = getContext();
        boolean hasReadSms = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        if (!hasReadSms) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        long startTime = call.getLong("startTime", 0L);
        long endTime = call.getLong("endTime", System.currentTimeMillis());
        int limit = call.getInt("limit", 200);

        JSArray messagesArray = new JSArray();
        ContentResolver cr = context.getContentResolver();
        Uri uri = Uri.parse("content://sms/inbox");

        String selection = "date >= ? AND date <= ?";
        String[] selectionArgs = new String[]{String.valueOf(startTime), String.valueOf(endTime)};
        String sortOrder = "date DESC LIMIT " + limit;

        try (Cursor cursor = cr.query(uri, new String[]{"_id", "address", "body", "date"}, selection, selectionArgs, sortOrder)) {
            if (cursor != null && cursor.moveToFirst()) {
                int idIdx = cursor.getColumnIndex("_id");
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String address = addressIdx != -1 ? cursor.getString(addressIdx) : "";
                    String body = bodyIdx != -1 ? cursor.getString(bodyIdx) : "";
                    long date = dateIdx != -1 ? cursor.getLong(dateIdx) : 0L;
                    String id = idIdx != -1 ? cursor.getString(idIdx) : "";

                    if (address != null && !address.isEmpty() && body != null && !body.isEmpty()) {
                        if (BANK_HEADER_PATTERN.matcher(address.trim()).matches()) {
                            JSObject msgObj = new JSObject();
                            msgObj.put("id", id);
                            msgObj.put("address", address);
                            msgObj.put("body", body);
                            msgObj.put("date", date);
                            messagesArray.put(msgObj);
                        }
                    }
                } while (cursor.moveToNext());
            }

            JSObject ret = new JSObject();
            ret.put("messages", messagesArray);
            ret.put("count", messagesArray.length());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to query SMS inbox: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void setSyncConfig(PluginCall call) {
        String userId = call.getString("userId");
        String endpoint = call.getString("endpoint");

        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("invictus_sms_prefs", Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();
        if (userId != null && !userId.isEmpty()) {
            editor.putString("userId", userId);
        }
        if (endpoint != null && !endpoint.isEmpty()) {
            editor.putString("endpoint", endpoint);
        }
        editor.apply();

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PermissionCallback
    private void allPermCallback(PluginCall call) {
        Context context = getContext();
        boolean hasSms = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
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
