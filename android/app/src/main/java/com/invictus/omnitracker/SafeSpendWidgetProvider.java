package com.invictus.omnitracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * Invictus Daily Overview — Refined Neobrutalist Home Screen Widget
 * Authentic Invictus design system: high-contrast split deck with
 * real-time financial pacing on the left and interactive habits on the right.
 */
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

            // Read stored payload from SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String jsonStr = prefs.getString(KEY_WIDGET_JSON, null);

            // Compute dynamic fallback values from calendar
            Calendar cal = Calendar.getInstance();
            int currentDay = cal.get(Calendar.DAY_OF_MONTH);
            int maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
            int defaultDaysLeft = Math.max(1, maxDays - currentDay + 1);
            String dateFormatted = new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(cal.getTime());
            String dateChip = dateFormatted + " • " + defaultDaysLeft + "d left";

            String currency = "₹";
            String heroLabel = "DAILY LIMIT LEFT";
            String heroAmount = "₹0";
            int heroAmountColor = Color.parseColor("#161514");
            String allowanceBadgeText = "Syncing with Invictus...";
            int allowanceBadgeColor = Color.parseColor("#037A48");
            String upiLeft = "Open App";
            String cashLeft = "Open App";

            int habitsTotal = 0;
            int habitsCompleted = 0;
            JSONArray habitsArray = null;

            if (jsonStr != null) {
                try {
                    JSONObject obj = new JSONObject(jsonStr);
                    currency = obj.optString("currencySymbol", "₹");
                    int days = obj.optInt("daysRemainingInMonth", defaultDaysLeft);
                    dateChip = dateFormatted + " • " + days + "d left";

                    double safeDaily = obj.optDouble("safeToSpendDaily", 0.0);
                    double remUpi = obj.optDouble("remainingUpiBudget", 0.0);
                    double remCash = obj.optDouble("remainingCashBudget", 0.0);
                    boolean hasCashBudget = obj.optBoolean("hasCashBudget", false);

                    double todayExpense = obj.optDouble("todayExpense", 0.0);
                    double dailyBudgetTarget = obj.optDouble("dailyBudgetTarget", safeDaily);
                    double customDailyBudget = obj.optDouble("customDailyBudget", -1.0);
                    boolean hasCustomCap = obj.has("customDailyBudget") && !obj.isNull("customDailyBudget") && customDailyBudget > 0;
                    if (dailyBudgetTarget <= 0 && safeDaily > 0) {
                        dailyBudgetTarget = safeDaily;
                    }

                    double todayRemaining = obj.has("todayRemaining")
                            ? obj.optDouble("todayRemaining", dailyBudgetTarget - todayExpense)
                            : (dailyBudgetTarget - todayExpense);
                    boolean isOverDailyBudget = obj.optBoolean("isOverDailyBudget", todayExpense > dailyBudgetTarget && dailyBudgetTarget > 0);
                    double overDailyAmount = obj.optDouble("overDailyAmount", Math.max(0, todayExpense - dailyBudgetTarget));

                    habitsTotal = obj.optInt("habitsTotalCount", 0);
                    habitsCompleted = obj.optInt("habitsCompletedCount", 0);
                    habitsArray = obj.optJSONArray("habitsList");

                    NumberFormat formatter = NumberFormat.getNumberInstance(Locale.US);

                    // 1. Hero Stat: Amount Left to Spend Today (Daily Limit Left)
                    if (dailyBudgetTarget > 0) {
                        if (isOverDailyBudget && overDailyAmount > 0) {
                            heroLabel = hasCustomCap ? "⚠️ LIMIT EXCEEDED" : "⚠️ PACE EXCEEDED";
                            heroAmount = "-" + currency + formatter.format((long) Math.round(overDailyAmount));
                            heroAmountColor = Color.parseColor("#D92D20"); // High-visibility alert red
                            allowanceBadgeText = "Spent " + currency + formatter.format((long) Math.round(todayExpense)) + " of " + currency + formatter.format((long) Math.round(dailyBudgetTarget)) + (hasCustomCap ? " cap" : " pace");
                            allowanceBadgeColor = Color.parseColor("#B42318");
                        } else {
                            heroLabel = hasCustomCap ? "DAILY LIMIT LEFT" : "SAFE SPEND LEFT";
                            heroAmount = currency + formatter.format((long) Math.round(Math.max(0, todayRemaining)));
                            heroAmountColor = Color.parseColor("#161514"); // Crisp Neobrutalist Black
                            allowanceBadgeText = currency + formatter.format((long) Math.round(todayExpense)) + " spent of " + currency + formatter.format((long) Math.round(dailyBudgetTarget)) + (hasCustomCap ? " limit" : " pace");
                            allowanceBadgeColor = Color.parseColor("#037A48"); // Emerald Green
                        }
                    } else {
                        heroLabel = "DAILY LIMIT LEFT";
                        heroAmount = currency + formatter.format((long) Math.round(todayExpense));
                        heroAmountColor = Color.parseColor("#161514");
                        allowanceBadgeText = "Open app to set daily limit";
                        allowanceBadgeColor = Color.parseColor("#73716D");
                    }

                    // 2. Liquidity Balances (UPI & Cash)
                    if (remUpi >= 0) {
                        upiLeft = currency + formatter.format((long) Math.round(remUpi));
                    } else {
                        upiLeft = "Over-budget";
                    }

                    if (!hasCashBudget && remCash <= 0) {
                        cashLeft = "No cap set";
                    } else if (remCash >= 0) {
                        cashLeft = currency + formatter.format((long) Math.round(remCash));
                    } else {
                        cashLeft = "Over-budget";
                    }

                } catch (Exception e) {
                    Log.w(TAG, "Error parsing widget JSON payload, using defaults", e);
                }
            }

            // Bind Top Header & Finances
            views.setTextViewText(R.id.widget_title, "⚡ INVICTUS DAILY");
            views.setTextViewText(R.id.widget_date_chip, dateChip);
            views.setTextViewText(R.id.widget_hero_label, heroLabel);
            views.setTextViewText(R.id.widget_safe_amount, heroAmount);
            views.setTextColor(R.id.widget_safe_amount, heroAmountColor);
            views.setTextViewText(R.id.widget_today_badge, allowanceBadgeText);
            views.setTextColor(R.id.widget_today_badge, allowanceBadgeColor);
            views.setTextViewText(R.id.widget_upi_left, "📱 UPI: " + upiLeft);
            views.setTextViewText(R.id.widget_cash_left, "💵 Cash: " + cashLeft);

            // Bind Habits Checklist
            if (habitsTotal > 0 && habitsArray != null && habitsArray.length() > 0) {
                views.setViewVisibility(R.id.widget_habits_section, View.VISIBLE);
                views.setViewVisibility(R.id.widget_habits_empty, View.GONE);

                String progressText = habitsCompleted + "/" + habitsTotal + " DONE";
                if (habitsCompleted == habitsTotal) {
                    progressText = "ALL DONE 🎉";
                }
                views.setTextViewText(R.id.widget_habits_progress, progressText);
                views.setTextColor(R.id.widget_habits_progress, habitsCompleted == habitsTotal 
                        ? Color.parseColor("#037A48") 
                        : Color.parseColor("#161514"));

                // Habit Row 1
                if (habitsArray.length() > 0) {
                    JSONObject h1 = habitsArray.optJSONObject(0);
                    if (h1 != null) {
                        views.setViewVisibility(R.id.widget_habit_row_1, View.VISIBLE);
                        boolean done1 = h1.optBoolean("completed", false);
                        String title1 = h1.optString("title", "Habit 1");
                        int s1 = h1.optInt("streak", 0);

                        views.setTextViewText(R.id.widget_habit_1_title, title1);
                        views.setTextViewText(R.id.widget_habit_1_check, done1 ? "✓" : "○");
                        views.setTextColor(R.id.widget_habit_1_check, done1 
                                ? Color.parseColor("#037A48") 
                                : Color.parseColor("#73716D"));

                        if (s1 > 0) {
                            views.setViewVisibility(R.id.widget_habit_1_streak, View.VISIBLE);
                            views.setTextViewText(R.id.widget_habit_1_streak, "🔥 " + s1 + "d");
                        } else {
                            views.setViewVisibility(R.id.widget_habit_1_streak, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_habit_row_1, View.GONE);
                    }
                } else {
                    views.setViewVisibility(R.id.widget_habit_row_1, View.GONE);
                }

                // Habit Row 2
                if (habitsArray.length() > 1) {
                    JSONObject h2 = habitsArray.optJSONObject(1);
                    if (h2 != null) {
                        views.setViewVisibility(R.id.widget_habit_row_2, View.VISIBLE);
                        boolean done2 = h2.optBoolean("completed", false);
                        String title2 = h2.optString("title", "Habit 2");
                        int s2 = h2.optInt("streak", 0);

                        views.setTextViewText(R.id.widget_habit_2_title, title2);
                        views.setTextViewText(R.id.widget_habit_2_check, done2 ? "✓" : "○");
                        views.setTextColor(R.id.widget_habit_2_check, done2 
                                ? Color.parseColor("#037A48") 
                                : Color.parseColor("#73716D"));

                        if (s2 > 0) {
                            views.setViewVisibility(R.id.widget_habit_2_streak, View.VISIBLE);
                            views.setTextViewText(R.id.widget_habit_2_streak, "🔥 " + s2 + "d");
                        } else {
                            views.setViewVisibility(R.id.widget_habit_2_streak, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_habit_row_2, View.GONE);
                    }
                } else {
                    views.setViewVisibility(R.id.widget_habit_row_2, View.GONE);
                }

                // Habit Row 3
                if (habitsArray.length() > 2) {
                    JSONObject h3 = habitsArray.optJSONObject(2);
                    if (h3 != null) {
                        views.setViewVisibility(R.id.widget_habit_row_3, View.VISIBLE);
                        boolean done3 = h3.optBoolean("completed", false);
                        String title3 = h3.optString("title", "Habit 3");
                        int s3 = h3.optInt("streak", 0);

                        views.setTextViewText(R.id.widget_habit_3_title, title3);
                        views.setTextViewText(R.id.widget_habit_3_check, done3 ? "✓" : "○");
                        views.setTextColor(R.id.widget_habit_3_check, done3 
                                ? Color.parseColor("#037A48") 
                                : Color.parseColor("#73716D"));

                        if (s3 > 0) {
                            views.setViewVisibility(R.id.widget_habit_3_streak, View.VISIBLE);
                            views.setTextViewText(R.id.widget_habit_3_streak, "🔥 " + s3 + "d");
                        } else {
                            views.setViewVisibility(R.id.widget_habit_3_streak, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_habit_row_3, View.GONE);
                    }
                } else {
                    views.setViewVisibility(R.id.widget_habit_row_3, View.GONE);
                }

            } else {
                views.setViewVisibility(R.id.widget_habits_section, View.VISIBLE);
                views.setViewVisibility(R.id.widget_habits_empty, View.VISIBLE);
                views.setViewVisibility(R.id.widget_habit_row_1, View.GONE);
                views.setViewVisibility(R.id.widget_habit_row_2, View.GONE);
                views.setViewVisibility(R.id.widget_habit_row_3, View.GONE);
                views.setTextViewText(R.id.widget_habits_progress, "0/0 DONE");
            }

            // Attach PendingIntents & Deep Links
            // 1. Tap Widget Container -> Open Today Page
            Intent openAppIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/today"));
            openAppIntent.setClass(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openAppPending = PendingIntent.getActivity(
                    context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, openAppPending);

            // 2. Tap Finance Section -> Open Money Page
            Intent financeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/money"));
            financeIntent.setClass(context, MainActivity.class);
            financeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent financePending = PendingIntent.getActivity(
                    context, 1, financeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_finance_section, financePending);

            // 3. Tap "+ EXPENSE" -> Open Quick Add Expense Modal
            Intent addExpenseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/money?action=quick-expense"));
            addExpenseIntent.setClass(context, MainActivity.class);
            addExpenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addExpensePending = PendingIntent.getActivity(
                    context, 2, addExpenseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_btn_add_expense, addExpensePending);

            // 4. Tap "✓ HABITS" / Habits Card -> Open Habits Check-in Sheet
            Intent checkHabitsIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/goals?action=quick-habit"));
            checkHabitsIntent.setClass(context, MainActivity.class);
            checkHabitsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent checkHabitsPending = PendingIntent.getActivity(
                    context, 3, checkHabitsIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_btn_check_habits, checkHabitsPending);
            views.setOnClickPendingIntent(R.id.widget_habits_section, checkHabitsPending);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            Log.e(TAG, "Error updating SafeSpend widget ID: " + appWidgetId, t);
        }
    }
}
