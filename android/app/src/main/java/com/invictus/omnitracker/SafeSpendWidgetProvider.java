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
            // Read stored data from SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String jsonStr = prefs.getString(KEY_WIDGET_JSON, null);

            String widgetTheme = "zen";
            if (jsonStr != null) {
                try {
                    JSONObject rawObj = new JSONObject(jsonStr);
                    widgetTheme = rawObj.optString("widgetTheme", "zen");
                } catch (Exception ignored) {}
            }
            boolean isSpeedway = "speedway".equalsIgnoreCase(widgetTheme);

            // Dynamically inflate either Speedway or Zen Sanctuary layout based on user theme
            RemoteViews views = new RemoteViews(
                    context.getPackageName(),
                    isSpeedway ? R.layout.widget_speedway : R.layout.widget_safe_spend
            );

            // Compute dynamic fallback values from calendar
            Calendar cal = Calendar.getInstance();
            String defaultMonth = new SimpleDateFormat("MMMM", Locale.getDefault()).format(cal.getTime());
            String zenDateChip = new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(cal.getTime()) + " • Zen Bloom";
            String speedwayDateChip = new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(cal.getTime()) + " • Turbo Cruise";
            int currentDay = cal.get(Calendar.DAY_OF_MONTH);
            int maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
            int defaultDaysLeft = Math.max(1, maxDays - currentDay + 1);

            String currency = "₹";
            String month = defaultMonth;
            String daysLeft = defaultDaysLeft + "d left";
            String streamFlowFormatted = "₹0 FLOW LEFT";
            String weatherLabel = "☀️ GOLDEN SUNLIGHT";
            int weatherColor = Color.parseColor("#03D26F");
            String capSubtext = "Syncing sanctuary...";
            int streamProgressPercent = 100;
            String upiLeft = "Open App";
            String cashLeft = "Open App";
            double todayRemainingVal = 0.0;
            double todayExpenseVal = 0.0;
            double dailyBudgetTargetVal = 0.0;
            boolean isOverBudgetVal = false;
            double overAmountVal = 0.0;

            int habitsTotal = 0;
            int habitsCompleted = 0;
            JSONArray habitsArray = null;

            String goalTitle = "Mastery & Focus";
            int goalProgressPct = 65;
            String goalIcon = "🎯";

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

                    double todayExpense = obj.optDouble("todayExpense", 0.0);
                    double dailyBudgetTarget = obj.optDouble("dailyBudgetTarget", safeDaily);
                    double todayRemaining = obj.has("todayRemaining")
                            ? obj.optDouble("todayRemaining", dailyBudgetTarget - todayExpense)
                            : (dailyBudgetTarget - todayExpense);
                    boolean isOverDailyBudget = obj.optBoolean("isOverDailyBudget", todayExpense > dailyBudgetTarget && dailyBudgetTarget > 0);
                    double overDailyAmount = obj.optDouble("overDailyAmount", Math.max(0, todayExpense - dailyBudgetTarget));

                    todayRemainingVal = todayRemaining;
                    todayExpenseVal = todayExpense;
                    dailyBudgetTargetVal = dailyBudgetTarget;
                    isOverBudgetVal = isOverDailyBudget;
                    overAmountVal = overDailyAmount;

                    habitsTotal = obj.optInt("habitsTotalCount", 0);
                    habitsCompleted = obj.optInt("habitsCompletedCount", 0);
                    habitsArray = obj.optJSONArray("habitsList");

                    // Parse active goal if available
                    JSONObject activeGoal = obj.optJSONObject("activeGoal");
                    if (activeGoal != null) {
                        goalTitle = activeGoal.optString("title", "Mastery & Focus");
                        goalProgressPct = activeGoal.optInt("progressPercentage", 65);
                        goalIcon = activeGoal.optString("icon", "🎯");
                    }

                    NumberFormat formatter = NumberFormat.getNumberInstance(Locale.US);

                    // Brook Stream Flow Stat
                    double streamLeft = Math.max(0, todayRemaining);
                    streamFlowFormatted = "💧 " + currency + formatter.format((long) Math.round(streamLeft)) + " FLOW LEFT";

                    // Weather Status Telemetry
                    if (isOverDailyBudget && overDailyAmount > 0) {
                        weatherLabel = "⛈️ DROUGHT / STORM ALERT";
                        weatherColor = Color.parseColor("#B42318");
                        capSubtext = "⚠️ Parched soil: Over by " + currency + formatter.format((long) Math.round(overDailyAmount));
                        streamProgressPercent = 0;
                    } else if (dailyBudgetTarget > 0) {
                        double spentRatio = todayExpense / dailyBudgetTarget;
                        if (spentRatio > 0.75) {
                            weatherLabel = "🌧️ NOURISHING MIST";
                            weatherColor = Color.parseColor("#F59E0B");
                        } else {
                            weatherLabel = "☀️ GOLDEN SUNLIGHT";
                            weatherColor = Color.parseColor("#03D26F");
                        }
                        capSubtext = currency + formatter.format((long) Math.round(todayExpense)) + " spent of " + currency + formatter.format((long) Math.round(dailyBudgetTarget)) + " daily cap";
                        streamProgressPercent = Math.max(5, Math.min(100, (int) Math.round((streamLeft / dailyBudgetTarget) * 100)));
                    } else {
                        weatherLabel = "☀️ TRANQUIL DAWN";
                        weatherColor = Color.parseColor("#03D26F");
                        capSubtext = "No cap set • Brook flows unmetered";
                        streamProgressPercent = 100;
                    }

                    // UPI & Cash balances
                    if (remUpi >= 0) {
                        upiLeft = currency + formatter.format((long) Math.round(remUpi));
                    } else {
                        upiLeft = "Over";
                    }

                    if (!hasCashBudget && remCash <= 0) {
                        cashLeft = "None";
                    } else if (remCash >= 0) {
                        cashLeft = currency + formatter.format((long) Math.round(remCash));
                    } else {
                        cashLeft = "Over";
                    }

                } catch (Exception e) {
                    Log.w(TAG, "Error parsing widget JSON payload, using defaults", e);
                }
            }

            NumberFormat numFmt = NumberFormat.getNumberInstance(Locale.US);

            // ==========================================
            // BIND THEME SPECIFIC VIEWS
            // ==========================================
            if (isSpeedway) {
                // Speedway Header
                views.setTextViewText(R.id.widget_speedway_title, "🏎️ INVICTUS SPEEDWAY");
                views.setTextViewText(R.id.widget_speedway_date_chip, speedwayDateChip);

                // Fuel Gauge & Speedometer Telemetry
                double fuelLeft = Math.max(0, todayRemainingVal);
                String fuelLabel = "⛽ FUEL: " + streamProgressPercent + "% • " + currency + numFmt.format((long) Math.round(fuelLeft)) + " RANGE";
                views.setTextViewText(R.id.widget_speedway_fuel_label, fuelLabel);

                if (isOverBudgetVal && overAmountVal > 0) {
                    views.setTextViewText(R.id.widget_speedway_pace_label, "TRAFFIC JAM ⚠️");
                    views.setTextColor(R.id.widget_speedway_pace_label, Color.parseColor("#EF4444"));
                    views.setTextViewText(R.id.widget_speedway_telemetry_subtext, "⚠️ Fuel Depleted: Over by " + currency + numFmt.format((long) Math.round(overAmountVal)) + " • Redline");
                } else if (dailyBudgetTargetVal > 0) {
                    double spentRatio = todayExpenseVal / dailyBudgetTargetVal;
                    if (spentRatio > 0.75) {
                        views.setTextViewText(R.id.widget_speedway_pace_label, "CAUTION 65 KM/H");
                        views.setTextColor(R.id.widget_speedway_pace_label, Color.parseColor("#F59E0B"));
                    } else {
                        views.setTextViewText(R.id.widget_speedway_pace_label, "CRUISING 98 KM/H");
                        views.setTextColor(R.id.widget_speedway_pace_label, Color.parseColor("#00E5FF"));
                    }
                    views.setTextViewText(R.id.widget_speedway_telemetry_subtext, currency + numFmt.format((long) Math.round(todayExpenseVal)) + " used of " + currency + numFmt.format((long) Math.round(dailyBudgetTargetVal)) + " tank cap • 4,200 RPM");
                } else {
                    views.setTextViewText(R.id.widget_speedway_pace_label, "CRUISING 98 KM/H");
                    views.setTextColor(R.id.widget_speedway_pace_label, Color.parseColor("#00E5FF"));
                    views.setTextViewText(R.id.widget_speedway_telemetry_subtext, "Unmetered Highway • Optimal Throttle");
                }

                views.setProgressBar(R.id.widget_speedway_fuel_bar, 100, streamProgressPercent, false);
                views.setTextViewText(R.id.widget_speedway_upi_left, "📱 Tank: " + upiLeft);
                views.setTextViewText(R.id.widget_speedway_cash_left, "💵 Nitro: " + cashLeft);
                views.setTextViewText(R.id.widget_speedway_days_left, daysLeft + " to Checkpoint");

                // Milestone Sign
                views.setTextViewText(R.id.widget_speedway_goal_icon, goalIcon);
                views.setTextViewText(R.id.widget_speedway_goal_title, goalTitle);
                views.setTextViewText(R.id.widget_speedway_goal_status, "Next Exit • " + goalProgressPct + "% Reached");
                views.setProgressBar(R.id.widget_speedway_goal_progress_bar, 100, Math.max(0, Math.min(100, goalProgressPct)), false);
                views.setTextViewText(R.id.widget_speedway_goal_telemetry, "Speedway Lane 1 • Full Throttle");

                // Pit Crew Diagnostics (Habits)
                if (habitsTotal > 0 && habitsArray != null && habitsArray.length() > 0) {
                    views.setViewVisibility(R.id.widget_speedway_habits_section, View.VISIBLE);
                    views.setViewVisibility(R.id.widget_speedway_habits_empty, View.GONE);

                    views.setTextViewText(R.id.widget_speedway_habits_progress, habitsCompleted + "/" + habitsTotal + " READY");
                    boolean allDone = (habitsCompleted == habitsTotal);
                    views.setViewVisibility(R.id.widget_speedway_all_clear, allDone ? View.VISIBLE : View.GONE);

                    // Habit Row 1
                    if (habitsArray.length() > 0) {
                        JSONObject h1 = habitsArray.optJSONObject(0);
                        if (h1 != null) {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_1, View.VISIBLE);
                            boolean done1 = h1.optBoolean("completed", false);
                            views.setTextViewText(R.id.widget_speedway_habit_1_led, done1 ? "🟢" : "🟠");
                            views.setTextViewText(R.id.widget_speedway_habit_1_title, h1.optString("title", "Habit 1"));
                            int s1 = h1.optInt("streak", 0);
                            views.setTextViewText(R.id.widget_speedway_habit_1_streak, s1 > 0 ? "🔥 " + s1 + "d" : "");
                        } else {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_1, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_speedway_habit_row_1, View.GONE);
                    }

                    // Habit Row 2
                    if (habitsArray.length() > 1) {
                        JSONObject h2 = habitsArray.optJSONObject(1);
                        if (h2 != null) {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_2, View.VISIBLE);
                            boolean done2 = h2.optBoolean("completed", false);
                            views.setTextViewText(R.id.widget_speedway_habit_2_led, done2 ? "🟢" : "🟠");
                            views.setTextViewText(R.id.widget_speedway_habit_2_title, h2.optString("title", "Habit 2"));
                            int s2 = h2.optInt("streak", 0);
                            views.setTextViewText(R.id.widget_speedway_habit_2_streak, s2 > 0 ? "🔥 " + s2 + "d" : "");
                        } else {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_2, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_speedway_habit_row_2, View.GONE);
                    }

                    // Habit Row 3
                    if (habitsArray.length() > 2) {
                        JSONObject h3 = habitsArray.optJSONObject(2);
                        if (h3 != null) {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_3, View.VISIBLE);
                            boolean done3 = h3.optBoolean("completed", false);
                            views.setTextViewText(R.id.widget_speedway_habit_3_led, done3 ? "🟢" : "🟠");
                            views.setTextViewText(R.id.widget_speedway_habit_3_title, h3.optString("title", "Habit 3"));
                            int s3 = h3.optInt("streak", 0);
                            views.setTextViewText(R.id.widget_speedway_habit_3_streak, s3 > 0 ? "🔥 " + s3 + "d" : "");
                        } else {
                            views.setViewVisibility(R.id.widget_speedway_habit_row_3, View.GONE);
                        }
                    } else {
                        views.setViewVisibility(R.id.widget_speedway_habit_row_3, View.GONE);
                    }
                } else {
                    views.setViewVisibility(R.id.widget_speedway_habits_section, View.VISIBLE);
                    views.setViewVisibility(R.id.widget_speedway_habits_empty, View.VISIBLE);
                    views.setViewVisibility(R.id.widget_speedway_all_clear, View.GONE);
                    views.setViewVisibility(R.id.widget_speedway_habit_row_1, View.GONE);
                    views.setViewVisibility(R.id.widget_speedway_habit_row_2, View.GONE);
                    views.setViewVisibility(R.id.widget_speedway_habit_row_3, View.GONE);
                    views.setTextViewText(R.id.widget_speedway_habits_progress, "0/0 READY");
                }

            } else {
                // ==========================================
                // ZEN SANCTUARY THEME BINDINGS
                // ==========================================
                views.setTextViewText(R.id.widget_title, "🌿 INVICTUS SANCTUARY");
                views.setTextViewText(R.id.widget_date_chip, zenDateChip);
                views.setTextViewText(R.id.widget_weather_label, weatherLabel);
                views.setTextColor(R.id.widget_weather_label, weatherColor);
                views.setTextViewText(R.id.widget_safe_amount, streamFlowFormatted);
                views.setTextViewText(R.id.widget_today_badge, capSubtext);
                views.setProgressBar(R.id.widget_stream_bar, 100, streamProgressPercent, false);

                views.setTextViewText(R.id.widget_upi_left, "📱 UPI: " + upiLeft);
                views.setTextViewText(R.id.widget_cash_left, "💵 Cash: " + cashLeft);
                views.setTextViewText(R.id.widget_days_left, daysLeft);

                // Bind Sacred Flora (Habit Checklist)
                if (habitsTotal > 0 && habitsArray != null && habitsArray.length() > 0) {
                    views.setViewVisibility(R.id.widget_habits_section, View.VISIBLE);
                    views.setViewVisibility(R.id.widget_habits_empty, View.GONE);

                    String progressText = habitsCompleted + "/" + habitsTotal + " BLOOMED";
                    boolean allDone = (habitsCompleted == habitsTotal);
                    views.setTextViewText(R.id.widget_habits_progress, progressText);

                    if (allDone) {
                        views.setViewVisibility(R.id.widget_bloom_celebration, View.VISIBLE);
                        views.setTextViewText(R.id.widget_bloom_celebration, "🌸 FULL BLOOM ACHIEVED ✨");
                    } else {
                        views.setViewVisibility(R.id.widget_bloom_celebration, View.GONE);
                    }

                    // Habit Row 1
                    if (habitsArray.length() > 0) {
                        JSONObject h1 = habitsArray.optJSONObject(0);
                        if (h1 != null) {
                            views.setViewVisibility(R.id.widget_habit_row_1, View.VISIBLE);
                            boolean done1 = h1.optBoolean("completed", false);
                            String title1 = h1.optString("title", "Habit 1");
                            int streak1 = h1.optInt("streak", 0);

                            views.setTextViewText(R.id.widget_habit_1_title, title1);
                            views.setTextViewText(R.id.widget_habit_1_check, done1 ? "🌸" : "🌱");

                            if (streak1 > 0) {
                                views.setViewVisibility(R.id.widget_habit_1_streak, View.VISIBLE);
                                views.setTextViewText(R.id.widget_habit_1_streak, "🔥 " + streak1 + "d");
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
                            int streak2 = h2.optInt("streak", 0);

                            views.setTextViewText(R.id.widget_habit_2_title, title2);
                            views.setTextViewText(R.id.widget_habit_2_check, done2 ? "🌸" : "🌱");

                            if (streak2 > 0) {
                                views.setViewVisibility(R.id.widget_habit_2_streak, View.VISIBLE);
                                views.setTextViewText(R.id.widget_habit_2_streak, "🔥 " + streak2 + "d");
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
                            int streak3 = h3.optInt("streak", 0);

                            views.setTextViewText(R.id.widget_habit_3_title, title3);
                            views.setTextViewText(R.id.widget_habit_3_check, done3 ? "🌸" : "🌱");

                            if (streak3 > 0) {
                                views.setViewVisibility(R.id.widget_habit_row_3, View.VISIBLE);
                                views.setTextViewText(R.id.widget_habit_3_streak, "🔥 " + streak3 + "d");
                            } else {
                                views.setViewVisibility(R.id.widget_habit_row_3, View.GONE);
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
                    views.setViewVisibility(R.id.widget_bloom_celebration, View.GONE);
                    views.setViewVisibility(R.id.widget_habit_row_1, View.GONE);
                    views.setViewVisibility(R.id.widget_habit_row_2, View.GONE);
                    views.setViewVisibility(R.id.widget_habit_row_3, View.GONE);
                    views.setTextViewText(R.id.widget_habits_progress, "0/0 BLOOMED");
                }

                // Bind Sacred Torii Pathway (Active Goal)
                views.setTextViewText(R.id.widget_goal_icon, goalIcon);
                views.setTextViewText(R.id.widget_goal_title, goalTitle);
                int gateNumber = Math.max(1, Math.min(5, (int) Math.ceil(goalProgressPct / 20.0)));
                views.setTextViewText(R.id.widget_goal_gate_status, "⛩️ Gate " + gateNumber + " of 5 Passed");
                views.setProgressBar(R.id.widget_goal_progress_bar, 100, Math.max(0, Math.min(100, goalProgressPct)), false);
                views.setTextViewText(R.id.widget_goal_percentage, goalProgressPct + "% • Summit Ascent");
            }

            // ==========================================
            // ATTACH PENDING INTENTS & DEEP LINKS
            // ==========================================
            // 1. PendingIntent for opening the Today page on widget background tap
            Intent openAppIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/today"));
            openAppIntent.setClass(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openAppPending = PendingIntent.getActivity(
                    context,
                    0,
                    openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, openAppPending);

            // 2. PendingIntent for "Log Expense" action (+ Expense modal)
            Intent addExpenseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/money?action=quick-expense"));
            addExpenseIntent.setClass(context, MainActivity.class);
            addExpenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addExpensePending = PendingIntent.getActivity(
                    context,
                    1,
                    addExpenseIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 3. PendingIntent for "Habits" action (Check-in sheet)
            Intent checkHabitsIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/goals?action=quick-habit"));
            checkHabitsIntent.setClass(context, MainActivity.class);
            checkHabitsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent checkHabitsPending = PendingIntent.getActivity(
                    context,
                    2,
                    checkHabitsIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 4. PendingIntent for "Active Goal" action (Goals tab)
            Intent goalIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://invictus-the-omni-tracker.vercel.app/goals?tab=goals"));
            goalIntent.setClass(context, MainActivity.class);
            goalIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent goalPending = PendingIntent.getActivity(
                    context,
                    3,
                    goalIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (isSpeedway) {
                views.setOnClickPendingIntent(R.id.widget_speedway_btn_refuel, addExpensePending);
                views.setOnClickPendingIntent(R.id.widget_speedway_btn_pitcrew, checkHabitsPending);
                views.setOnClickPendingIntent(R.id.widget_speedway_habits_section, checkHabitsPending);
                views.setOnClickPendingIntent(R.id.widget_speedway_btn_routemap, goalPending);
                views.setOnClickPendingIntent(R.id.widget_speedway_milestone_card, goalPending);
            } else {
                views.setOnClickPendingIntent(R.id.widget_btn_add_expense, addExpensePending);
                views.setOnClickPendingIntent(R.id.widget_btn_check_habits, checkHabitsPending);
                views.setOnClickPendingIntent(R.id.widget_habits_section, checkHabitsPending);
                views.setOnClickPendingIntent(R.id.widget_btn_active_goal, goalPending);
                views.setOnClickPendingIntent(R.id.widget_goal_section, goalPending);
            }

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error inflating or updating widget ID: " + appWidgetId, t);
        }
    }
}
