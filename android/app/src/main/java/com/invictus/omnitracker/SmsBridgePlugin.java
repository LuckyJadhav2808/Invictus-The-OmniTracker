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
            "^(?:[A-Za-z]{2}[-_]?)?(HDFC(?:BK)?|SBI(?:NB|PSG|UPI|INB)?|ICICI(?:B)?|AXIS(?:BK)?|KOTAK(?:B)?|INDUS(?:B)?|YES(?:BNK)?|PNB(?:SMS)?|PUNJAB|BOI(?:SMS)?|CAN(?:BNK|ARA)?|UBI(?:SMS)?|UNION(?:B)?|IDFC(?:FB)?|FED(?:BNK)?|PAYTM(?:B)?|CRED(?:BK)?|CENT(?:BK)?|BOB(?:SMS)?|MAH(?:BK)?|IOB|UCO(?:BNK)?|RBL(?:BNK)?|AUFIN(?:B)?|BANDH(?:N)?|IDBI(?:BK)?|SC(?:ISMS)?|AMEX(?:IN)?|AIRTEL|JIO(?:BNK)?)(?:[-_][A-Za-z0-9]+)?$",
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
        Context context = getContext();
        boolean hasNotif = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotif = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasNotif) {
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
        long now = System.currentTimeMillis();
        // Generous forward buffer prevents carrier telecom clock skew from cutting off today's messages
        if (endTime >= now - 300000) {
            endTime = now + (12 * 60 * 60 * 1000L);
        }
        int limit = call.getInt("limit", 300);

        JSArray messagesArray = new JSArray();
        ContentResolver cr = context.getContentResolver();
        Uri uri = Uri.parse("content://sms/inbox");

        String selection = "date >= ? AND date <= ?";
        String[] selectionArgs = new String[]{String.valueOf(startTime), String.valueOf(endTime)};
        String sortOrder = "date DESC";
        int maxScanRows = 1200;
        int rowsScanned = 0;

        try (Cursor cursor = cr.query(uri, new String[]{"_id", "address", "body", "date"}, selection, selectionArgs, sortOrder)) {
            if (cursor != null && cursor.moveToFirst()) {
                int idIdx = cursor.getColumnIndex("_id");
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    rowsScanned++;
                    if (rowsScanned > maxScanRows || messagesArray.length() >= limit) {
                        break;
                    }

                    String address = addressIdx != -1 ? cursor.getString(addressIdx) : "";
                    String body = bodyIdx != -1 ? cursor.getString(bodyIdx) : "";
                    long date = dateIdx != -1 ? cursor.getLong(dateIdx) : 0L;
                    String id = idIdx != -1 ? cursor.getString(idIdx) : "";

                    if (address != null && !address.isEmpty() && body != null && !body.isEmpty()) {
                        String addressClean = address.trim().replaceFirst("^\\+?91", "");
                        String bodyUpper = body.toUpperCase();

                        // Broad financial candidate filter: pass business/financial SMS to the JS parser
                        boolean isCandidate = BANK_HEADER_PATTERN.matcher(address.trim()).matches()
                                || BANK_HEADER_PATTERN.matcher(addressClean).matches()
                                || addressClean.matches("^[A-Za-z0-9+_-]{3,15}$")
                                || bodyUpper.contains("DEBIT") || bodyUpper.contains("DEBITED") || bodyUpper.contains("SPENT")
                                || bodyUpper.contains("PAID") || bodyUpper.contains("SENT") || bodyUpper.contains("WITHDRAWN")
                                || bodyUpper.contains("TRANSFERRED") || bodyUpper.contains("TRANSFER TO")
                                || bodyUpper.contains("A/C") || bodyUpper.contains("ACCOUNT") || bodyUpper.contains("UPI")
                                || bodyUpper.contains("INR") || bodyUpper.contains("RS.") || bodyUpper.contains("RS ");

                        if (isCandidate) {
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
