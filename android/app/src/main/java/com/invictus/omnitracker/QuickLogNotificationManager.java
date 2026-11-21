package com.invictus.omnitracker;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import android.Manifest;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import java.util.Locale;

/**
 * Invictus Ambient Notification Manager
 * Manages the silent, ongoing Quick-Log dock in Android's notification drawer.
 * Tapping the notification launches the translucent QuickLogDialogActivity.
 */
public class QuickLogNotificationManager {

    private static final String TAG = "QuickLogNotification";
    public static final String CHANNEL_ID = "invictus_ambient_channel";
    public static final int NOTIFICATION_ID = 40401;
    public static final String PREFS_NAME = "invictus_quick_log_prefs";
    public static final String KEY_DOCK_ENABLED = "ambient_dock_enabled";
    public static final String KEY_SAFE_TO_SPEND = "safe_to_spend";

    /**
     * Posts or updates the ambient notification with current safe-to-spend balance.
     */
    public static void showAmbientNotification(Context context, double remainingBudget) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(KEY_DOCK_ENABLED, true);
            if (!isEnabled) {
                cancelAmbientNotification(context);
                return;
            }

            // Save latest balance
            prefs.edit().putFloat(KEY_SAFE_TO_SPEND, (float) remainingBudget).apply();

            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // Check runtime permission on Android 13+ (API 33+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "Notification permission not granted (POST_NOTIFICATIONS). Ambient dock awaiting user permission.");
                    return;
                }
            }

            // 1. Create Silent Low-Priority Notification Channel (Android 8.0+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Ambient Quick-Log Dock",
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Silent ambient expense logging dock in notification shade");
                channel.enableVibration(false);
                channel.enableLights(false);
                channel.setShowBadge(false);
                nm.createNotificationChannel(channel);
            }

            // 2. Intent to Launch QuickLogDialogActivity directly
            Intent dialogIntent = new Intent(context, QuickLogDialogActivity.class);
            dialogIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    NOTIFICATION_ID,
                    dialogIntent,
                    pendingFlags
            );

            // 2b. Intent to Launch Reused Web Expense Modal directly
            Intent studioIntent = new Intent(context, MainActivity.class);
            studioIntent.setData(android.net.Uri.parse("https://invictus-the-omni-tracker.vercel.app/quick-log"));
            studioIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent studioPendingIntent = PendingIntent.getActivity(
                    context,
                    NOTIFICATION_ID + 1,
                    studioIntent,
                    pendingFlags
            );

            // 3. Format Telemetry Text
            String formattedBudget = String.format(Locale.getDefault(), "%,.0f", remainingBudget);
            String title = "⚡ Invictus Fast-Log";
            String subtitle = "Remaining Today: ₹" + formattedBudget + " • Tap to log";

            // 4. Build Silent Ongoing Notification
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_stat_icon)
                    .setContentTitle(title)
                    .setContentText(subtitle)
                    .setContentIntent(pendingIntent)
                    .addAction(R.drawable.ic_stat_icon, "Studio Form ↗", studioPendingIntent)
                    .setOngoing(true)
                    .setShowWhen(false)
                    .setAutoCancel(false)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setCategory(NotificationCompat.CATEGORY_STATUS)
                    .setColor(0xFFCEF431) // Invictus Electric Lime
                    .setOnlyAlertOnce(true);

            nm.notify(NOTIFICATION_ID, builder.build());
            Log.d(TAG, "Ambient notification updated with budget: ₹" + formattedBudget);

        } catch (Exception e) {
            Log.e(TAG, "Failed to post ambient notification", e);
        }
    }

    /**
     * Dismisses the ambient notification from the shade.
     */
    public static void cancelAmbientNotification(Context context) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIFICATION_ID);
                Log.d(TAG, "Ambient notification canceled");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel ambient notification", e);
        }
    }

    public static boolean isAmbientEnabled(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_DOCK_ENABLED, true);
    }

    public static void setAmbientEnabled(Context context, boolean enabled) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_DOCK_ENABLED, enabled).apply();
        if (enabled) {
            double currentBudget = (double) prefs.getFloat(KEY_SAFE_TO_SPEND, 1420.0f);
            showAmbientNotification(context, currentBudget);
        } else {
            cancelAmbientNotification(context);
        }
    }
}
