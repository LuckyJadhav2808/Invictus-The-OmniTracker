package com.invictus.omnitracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class SafeSpendWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "SafeSpendWidget";
    private static final String PREFS_NAME = "invictus_widget_prefs";
    private static final String KEY_WIDGET_JSON = "widget_json";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, SafeSpendWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            onUpdate(context, appWidgetManager, appWidgetIds);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_safe_spend);

            // Read stored data
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String jsonStr = prefs.getString(KEY_WIDGET_JSON, null);

            // Compute dynamic fallback values from local calendar
            Calendar cal = Calendar.getInstance();
            String defaultMonth = new SimpleDateFormat("MMMM", Locale.getDefault()).format(cal.getTime());
            int currentDay = cal.get(Calendar.DAY_OF_MONTH);
            int maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
            int defaultDaysLeft = Math.max(1, maxDays - currentDay + 1);

            String currency = "₹";
            String month = defaultMonth;
            String daysLeft = defaultDaysLeft + "d left";
            String safeAmount = "~₹0/day";
            String upiLeft = "Open App";
            String cashLeft = "Open App";

            if (jsonStr != null) {
                try {
                    JSONObject obj = new JSONObject(jsonStr);
                    currency = obj.optString("currencySymbol", "₹");
                    month = obj.optString("targetMonthLabel", defaultMonth);
                    int days = obj.optInt("daysRemainingInMonth", defaultDaysLeft);
                    daysLeft = days + "d left";

                    double safeDaily = obj.optDouble("safeToSpendDaily", 0.0);
                    double remUpi = obj.optDouble("remainingUpiBudget", 0.0);
                    double remCash = obj.optDouble("remainingCashBudget", 0.0);
                    boolean hasCashBudget = obj.optBoolean("hasCashBudget", false);

                    NumberFormat formatter = NumberFormat.getNumberInstance(Locale.US);

                    if (safeDaily > 0) {
                        safeAmount = "~" + currency + formatter.format((long) Math.round(safeDaily)) + "/day";
                    } else {
                        safeAmount = "Cap Spending";
                    }

                    if (remUpi >= 0) {
                        upiLeft = currency + formatter.format((long) Math.round(remUpi));
                    } else {
                        upiLeft = "Over-budget";
                    }

                    if (!hasCashBudget && remCash <= 0) {
                        cashLeft = "No limit set";
                    } else if (remCash >= 0) {
                        cashLeft = currency + formatter.format((long) Math.round(remCash));
                    } else {
                        cashLeft = "Over-budget";
                    }

                } catch (Exception e) {
                    Log.w(TAG, "Error parsing widget JSON payload, using defaults", e);
                }
            }

            views.setTextViewText(R.id.widget_month_label, month);
            views.setTextViewText(R.id.widget_days_left, daysLeft);
            views.setTextViewText(R.id.widget_safe_amount, safeAmount);
            views.setTextViewText(R.id.widget_upi_left, upiLeft);
            views.setTextViewText(R.id.widget_cash_left, cashLeft);

            // 1. PendingIntent for opening the Money page on widget background tap
            Intent openAppIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/money"));
            openAppIntent.setClass(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openAppPending = PendingIntent.getActivity(
                    context,
                    0,
                    openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, openAppPending);

            // 2. PendingIntent for "+ Add Expense" action
            Intent addExpenseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/money?action=quick-expense"));
            addExpenseIntent.setClass(context, MainActivity.class);
            addExpenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addExpensePending = PendingIntent.getActivity(
                    context,
                    1,
                    addExpenseIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_btn_add_expense, addExpensePending);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error inflating or updating widget ID: " + appWidgetId, t);
        }
    }
}
