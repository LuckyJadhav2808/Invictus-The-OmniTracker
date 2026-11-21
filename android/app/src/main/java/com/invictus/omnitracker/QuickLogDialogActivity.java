package com.invictus.omnitracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Invictus Ambient Floating Micro-Dialog
 * High-speed Neobrutalist translucent activity that floats over any open app.
 * Allows entering an expense in under 1.5 seconds with zero heavy app startup.
 */
public class QuickLogDialogActivity extends AppCompatActivity {

    private static final String TAG = "QuickLogDialog";
    private static final String PREFS_NAME = "invictus_quick_log_prefs";
    private static final String SMS_PREFS_NAME = "invictus_sms_prefs";
    private static final String DEFAULT_USER_ID = "user_1kapw9sad_1784744868999";
    private static final String SYNC_ENDPOINT = "https://invictus-the-omni-tracker.vercel.app/api/money/sms-webhook";

    private TextView tvAmountDisplay;
    private TextView tvSafeSpendBadge;
    private EditText etExpenseNote;
    private TextView btnClearNote;
    private LinearLayout llHabitPresetsContainer;
    private Button btnCatFood;
    private Button btnCatTravel;
    private Button btnCatGrocery;
    private Button btnCatBills;

    private String currentAmount = "0";
    private String selectedCategory = "Food";
    private String optionalNote = "";
    private double safeToSpend = 1420.0;
    private boolean isManualCategorySelected = false;
    private boolean isAutoExtractedAmount = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_quick_log_dialog);

        initViews();
        loadStoredTelemetry();
        setupClickListeners();
    }

    private void initViews() {
        tvAmountDisplay = findViewById(R.id.tv_amount_display);
        tvSafeSpendBadge = findViewById(R.id.tv_safe_spend_badge);
        etExpenseNote = findViewById(R.id.et_expense_note);
        btnClearNote = findViewById(R.id.btn_clear_note);
        llHabitPresetsContainer = findViewById(R.id.ll_habit_presets_container);
        btnCatFood = findViewById(R.id.btn_cat_food);
        btnCatTravel = findViewById(R.id.btn_cat_travel);
        btnCatGrocery = findViewById(R.id.btn_cat_grocery);
        btnCatBills = findViewById(R.id.btn_cat_bills);

        // Highlight initial category
        updateCategorySelection(btnCatFood, "Food");
    }

    private void loadStoredTelemetry() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        safeToSpend = (double) prefs.getFloat("safe_to_spend", 1420.0f);

        String badgeText = "Remaining Today: ₹" + String.format(Locale.getDefault(), "%,.0f", safeToSpend);
        tvSafeSpendBadge.setText(badgeText);
    }

    private void setupClickListeners() {
        // Outside tap to dismiss
        FrameLayout rootFrame = findViewById(R.id.dialog_root_frame);
        rootFrame.setOnClickListener(v -> finish());

        LinearLayout cardContainer = findViewById(R.id.dialog_card_container);
        cardContainer.setOnClickListener(v -> {}); // Consume click so card doesn't dismiss

        TextView btnClose = findViewById(R.id.btn_close_dialog);
        btnClose.setOnClickListener(v -> {
            vibrateTactile(15);
            finish();
        });

        // Studio Modal Button: Launches the rich web modal with full NLP, math & transformer rules
        View btnStudio = findViewById(R.id.btn_open_studio_modal);
        if (btnStudio != null) {
            btnStudio.setOnClickListener(v -> {
                vibrateTactile(20);
                try {
                    Intent studioIntent = new Intent(this, MainActivity.class);
                    studioIntent.setData(Uri.parse("https://invictus-the-omni-tracker.vercel.app/quick-log"));
                    studioIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(studioIntent);
                    finish();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to launch studio modal from dialog", e);
                }
            });
        }

        // Note Input Listeners with Real-Time Smart Category Detection & NLP Entity Extraction
        if (etExpenseNote != null) {
            etExpenseNote.addTextChangedListener(new android.text.TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    if (btnClearNote != null) {
                        btnClearNote.setVisibility(s.length() > 0 ? View.VISIBLE : View.GONE);
                    }
                    optionalNote = s.toString().trim();
                    parseNlpIntent(optionalNote);
                }

                @Override
                public void afterTextChanged(android.text.Editable s) {}
            });
        }

        if (btnClearNote != null) {
            btnClearNote.setOnClickListener(v -> {
                vibrateTactile(15);
                if (etExpenseNote != null) {
                    etExpenseNote.setText("");
                }
                optionalNote = "";
                isManualCategorySelected = false;
                if (isAutoExtractedAmount) {
                    currentAmount = "0";
                    isAutoExtractedAmount = false;
                    updateAmountDisplay();
                }
            });
        }

        // Habit Presets (Dynamic from user transaction history with fallback defaults)
        setupHabitPresets();

        // Categories (Manual taps lock the selection and give crisp tactile feedback)
        btnCatFood.setOnClickListener(v -> {
            isManualCategorySelected = true;
            updateCategorySelection(btnCatFood, "Food");
        });
        btnCatTravel.setOnClickListener(v -> {
            isManualCategorySelected = true;
            updateCategorySelection(btnCatTravel, "Travel");
        });
        btnCatGrocery.setOnClickListener(v -> {
            isManualCategorySelected = true;
            updateCategorySelection(btnCatGrocery, "Grocery");
        });
        btnCatBills.setOnClickListener(v -> {
            isManualCategorySelected = true;
            updateCategorySelection(btnCatBills, "Bills");
        });

        // Numpad Keys
        setupNumpadKey(R.id.btn_num_1, "1");
        setupNumpadKey(R.id.btn_num_2, "2");
        setupNumpadKey(R.id.btn_num_3, "3");
        setupNumpadKey(R.id.btn_num_4, "4");
        setupNumpadKey(R.id.btn_num_5, "5");
        setupNumpadKey(R.id.btn_num_6, "6");
        setupNumpadKey(R.id.btn_num_7, "7");
        setupNumpadKey(R.id.btn_num_8, "8");
        setupNumpadKey(R.id.btn_num_9, "9");
        setupNumpadKey(R.id.btn_num_0, "0");

        findViewById(R.id.btn_num_dot).setOnClickListener(v -> {
            vibrateTactile(15);
            isAutoExtractedAmount = false;
            if (!currentAmount.contains(".")) {
                currentAmount += ".";
                updateAmountDisplay();
            }
        });

        findViewById(R.id.btn_num_backspace).setOnClickListener(v -> {
            vibrateTactile(15);
            isAutoExtractedAmount = false;
            if (currentAmount.length() > 1) {
                currentAmount = currentAmount.substring(0, currentAmount.length() - 1);
            } else {
                currentAmount = "0";
            }
            updateAmountDisplay();
        });

        // Submit
        Button btnSubmit = findViewById(R.id.btn_submit_expense);
        btnSubmit.setOnClickListener(v -> submitExpense());
    }

    private void setupNumpadKey(int viewId, String digit) {
        View view = findViewById(viewId);
        if (view != null) {
            view.setOnClickListener(v -> {
                vibrateTactile(15);
                isAutoExtractedAmount = false;
                if ("0".equals(currentAmount)) {
                    currentAmount = digit;
                } else {
                    // Limit to 2 decimal places if dot present
                    if (currentAmount.contains(".")) {
                        int dotIndex = currentAmount.indexOf(".");
                        if (currentAmount.length() - dotIndex <= 2) {
                            currentAmount += digit;
                        }
                    } else if (currentAmount.length() < 7) {
                        currentAmount += digit;
                    }
                }
                updateAmountDisplay();
            });
        }
    }

    private void setupHabitPresets() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String presetsJson = prefs.getString("recent_presets", null);

        boolean hasDynamicPresets = false;
        if (presetsJson != null && !presetsJson.isEmpty()) {
            try {
                org.json.JSONArray presetsArray = new org.json.JSONArray(presetsJson);
                if (presetsArray.length() > 0 && llHabitPresetsContainer != null) {
                    llHabitPresetsContainer.removeAllViews();
                    for (int i = 0; i < presetsArray.length(); i++) {
                        org.json.JSONObject item = presetsArray.getJSONObject(i);
                        final String name = item.optString("name", "Expense");
                        final double amount = item.optDouble("amount", 0.0);
                        final String category = item.optString("category", "Food");
                        final String icon = item.optString("icon", "⚡");
                        final String label = item.has("label") ? item.getString("label") : (icon + " " + name + " ₹" + (int) amount);

                        Button btn = new Button(this, null, android.R.attr.borderlessButtonStyle);
                        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            dpToPx(34)
                        );
                        lp.setMarginEnd(dpToPx(8));
                        btn.setLayoutParams(lp);
                        btn.setText(label);
                        btn.setBackgroundResource(R.drawable.chip_habit_bg);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            btn.setBackgroundTintList(null);
                        }
                        btn.setTextColor(getResources().getColor(R.color.widget_text_primary));
                        btn.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
                        btn.setTypeface(null, android.graphics.Typeface.BOLD);
                        btn.setMinWidth(0);
                        btn.setPadding(dpToPx(12), 0, dpToPx(12), 0);

                        final String amountStr = String.valueOf((int) amount);
                        btn.setOnClickListener(v -> {
                            vibrateTactile(20);
                            isAutoExtractedAmount = false;
                            currentAmount = amountStr;
                            optionalNote = name;
                            updateAmountDisplay();

                            if (etExpenseNote != null) {
                                etExpenseNote.setText(name);
                                etExpenseNote.setSelection(name.length());
                            }

                            applyCategory(category);
                            isManualCategorySelected = false;
                        });

                        llHabitPresetsContainer.addView(btn);
                    }
                    hasDynamicPresets = true;
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to parse dynamic presets JSON, falling back to defaults", e);
            }
        }

        if (!hasDynamicPresets) {
            setupHabitButton(R.id.btn_habit_chai, "30", "Food", "Chai");
            setupHabitButton(R.id.btn_habit_meal, "100", "Food", "Meal");
            setupHabitButton(R.id.btn_habit_metro, "40", "Travel", "Metro");
            setupHabitButton(R.id.btn_habit_snack, "20", "Food", "Snack");
        }
    }

    private void setupHabitButton(int viewId, String amount, String category, String note) {
        Button btn = findViewById(viewId);
        if (btn != null) {
            btn.setOnClickListener(v -> {
                vibrateTactile(20);
                isAutoExtractedAmount = false;
                currentAmount = amount;
                optionalNote = note;
                updateAmountDisplay();

                if (etExpenseNote != null) {
                    etExpenseNote.setText(note);
                    etExpenseNote.setSelection(note.length());
                }

                applyCategory(category);
                isManualCategorySelected = false;
            });
        }
    }

    private void applyCategory(String category) {
        if ("Travel".equalsIgnoreCase(category) || "Transport".equalsIgnoreCase(category)) {
            updateCategorySelection(btnCatTravel, "Travel");
        } else if ("Grocery".equalsIgnoreCase(category) || "Groceries".equalsIgnoreCase(category)) {
            updateCategorySelection(btnCatGrocery, "Grocery");
        } else if ("Bills".equalsIgnoreCase(category) || "Utilities".equalsIgnoreCase(category)) {
            updateCategorySelection(btnCatBills, "Bills");
        } else {
            updateCategorySelection(btnCatFood, "Food");
        }
    }

    /**
     * Real-time NLP intent parser & regex entity extraction
     * Parses amounts (e.g. "Chai 20", "Uber 150.50", "Coffee 45") and merchant categories
     */
    private void parseNlpIntent(String text) {
        if (text == null || text.trim().isEmpty()) {
            if (isAutoExtractedAmount) {
                currentAmount = "0";
                isAutoExtractedAmount = false;
                updateAmountDisplay();
            }
            return;
        }

        String lower = text.toLowerCase(Locale.getDefault());

        // 1. Amount Extraction via Regex Transformer
        // Matches standalone numeric tokens like "20", "150.50", "45", "1200", optionally prefixed with ₹ or Rs
        Pattern amountPattern = Pattern.compile("(?:^|\\s|₹|rs\\.?|inr\\s*)(\\d+(?:\\.\\d{1,2})?)(?:\\s|$)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = amountPattern.matcher(lower);
        if (matcher.find()) {
            String numStr = matcher.group(1);
            if (numStr != null && !numStr.isEmpty()) {
                try {
                    double val = Double.parseDouble(numStr);
                    if (val > 0 && ("0".equals(currentAmount) || isAutoExtractedAmount)) {
                        currentAmount = (val == (long) val) ? String.valueOf((long) val) : numStr;
                        isAutoExtractedAmount = true;
                        updateAmountDisplay();
                    }
                } catch (Exception ignored) {}
            }
        } else if (isAutoExtractedAmount && !text.matches(".*\\d.*")) {
            currentAmount = "0";
            isAutoExtractedAmount = false;
            updateAmountDisplay();
        }

        // 2. Real-time Semantic Category Matching
        if (!isManualCategorySelected) {
            detectCategoryFromNoteText(lower);
        }
    }

    private void detectCategoryFromNoteText(String lowerNote) {
        // 1. Food keywords
        if (lowerNote.matches(".*\\b(chai|tea|coffee|snack|snacks|meal|lunch|dinner|breakfast|swiggy|zomato|burger|pizza|food|canteen|cafe|maggi|samosa|restaurant|biryani|ice cream|dosa|idli|momos|cake|pastry|bake|bakery|eat|drinks|juice|roti|thali|starbucks|kfc|mcdonalds|dominos|subway|haldiram|roll|shawarma)\\b.*")) {
            updateCategorySelectionInternal(btnCatFood, "Food");
            return;
        }
        // 2. Travel keywords
        if (lowerNote.matches(".*\\b(metro|uber|ola|rapido|auto|cab|taxi|petrol|diesel|fuel|cng|bus|train|flight|ticket|toll|parking|commute|ride|travel|indigo|irctc|redbus|makemytrip)\\b.*")) {
            updateCategorySelectionInternal(btnCatTravel, "Travel");
            return;
        }
        // 3. Grocery keywords
        if (lowerNote.matches(".*\\b(zepto|blinkit|instamart|grocery|groceries|supermarket|vegetables|veggies|fruits|milk|bread|curd|paneer|eggs|ration|dmart|d-mart|kirana|market|bigbasket|nature's basket)\\b.*")) {
            updateCategorySelectionInternal(btnCatGrocery, "Grocery");
            return;
        }
        // 4. Bills keywords
        if (lowerNote.matches(".*\\b(bill|bills|electricity|power|wifi|internet|broadband|recharge|rent|water|gas|cylinder|lpg|subscription|netflix|spotify|prime|hotstar|airtel|jio|vi|maintenance|credit card|emi|insurance|fee|tuition)\\b.*")) {
            updateCategorySelectionInternal(btnCatBills, "Bills");
            return;
        }
    }

    private void updateCategorySelection(Button selectedBtn, String categoryName) {
        vibrateTactile(10);
        updateCategorySelectionInternal(selectedBtn, categoryName);
    }

    private void updateCategorySelectionInternal(Button selectedBtn, String categoryName) {
        selectedCategory = categoryName;

        // Reset all category button states
        resetCategoryButton(btnCatFood);
        resetCategoryButton(btnCatTravel);
        resetCategoryButton(btnCatGrocery);
        resetCategoryButton(btnCatBills);

        // Highlight selected
        if (selectedBtn != null) {
            selectedBtn.setSelected(true);
            selectedBtn.setTextColor(getResources().getColor(R.color.widget_accent_lime));
        }
    }

    private void resetCategoryButton(Button btn) {
        if (btn != null) {
            btn.setSelected(false);
            btn.setTextColor(getResources().getColor(R.color.widget_text_primary));
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    private void updateAmountDisplay() {
        tvAmountDisplay.setText("₹ " + currentAmount);
    }

    private void submitExpense() {
        double parsedAmount = 0.0;
        try {
            parsedAmount = Double.parseDouble(currentAmount);
        } catch (Exception ignored) {}

        if (parsedAmount <= 0) {
            vibrateTactile(40);
            Toast.makeText(this, "Please enter an amount > ₹0", Toast.LENGTH_SHORT).show();
            return;
        }

        vibrateTactile(30);

        final double finalAmount = parsedAmount;
        final String finalCategory = selectedCategory;
        String customNote = (etExpenseNote != null) ? etExpenseNote.getText().toString().trim() : optionalNote;
        final String finalNote = (customNote != null && !customNote.isEmpty()) ? customNote : selectedCategory;
        final String todayDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

        // Update local SharedPreferences remaining budget
        double updatedRemaining = Math.max(0, safeToSpend - finalAmount);
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putFloat("safe_to_spend", (float) updatedRemaining).apply();

        // Queue pending quick log for in-app state synchronization
        try {
            org.json.JSONArray pendingArray;
            String pendingRaw = prefs.getString("pending_quick_logs", "[]");
            pendingArray = new org.json.JSONArray(pendingRaw);

            JSONObject txObj = new JSONObject();
            txObj.put("id", "tx_native_" + System.currentTimeMillis());
            txObj.put("amount", finalAmount);
            txObj.put("category", finalCategory);
            txObj.put("note", finalNote);
            txObj.put("date", todayDate);
            txObj.put("timestamp", System.currentTimeMillis());

            pendingArray.put(txObj);
            prefs.edit().putString("pending_quick_logs", pendingArray.toString()).apply();
        } catch (Exception e) {
            Log.w(TAG, "Failed to queue pending quick log locally", e);
        }

        // Update Notification Shade balance
        QuickLogNotificationManager.showAmbientNotification(this, updatedRemaining);

        // Toast feedback
        Toast.makeText(this, "⚡ Logged ₹" + (int) finalAmount + " for " + finalNote + "!", Toast.LENGTH_SHORT).show();

        // Background HTTP POST to Cloud Webhook
        new Thread(() -> dispatchToCloud(finalAmount, finalCategory, finalNote, todayDate)).start();

        // Dismiss immediately
        finish();
    }

    private void dispatchToCloud(double amount, String category, String note, String date) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences smsPrefs = getSharedPreferences(SMS_PREFS_NAME, Context.MODE_PRIVATE);
            String targetUserId = prefs.getString("userId", smsPrefs.getString("userId", DEFAULT_USER_ID));
            String targetEndpoint = smsPrefs.getString("endpoint", SYNC_ENDPOINT);

            JSONObject payload = new JSONObject();
            payload.put("userId", targetUserId);
            payload.put("amount", amount);
            payload.put("type", "expense");
            payload.put("merchant", note);
            payload.put("category", category);
            payload.put("date", date);
            payload.put("bankName", "Cash/QuickLog");
            payload.put("accountLast4", "MANUAL");
            payload.put("rawSender", "AmbientMicroDialog");
            payload.put("dedupSignature", "ambient_dlg_" + System.currentTimeMillis() + "_" + (int) amount);

            URL url = new URL(targetEndpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setDoOutput(true);
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);

            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            Log.d(TAG, "Ambient dialog cloud sync response: HTTP " + code);
            conn.disconnect();
        } catch (Exception e) {
            Log.w(TAG, "Ambient dialog cloud sync failed (will retry on next app open)", e);
        }
    }

    private void vibrateTactile(long ms) {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(ms);
                }
            }
        } catch (Exception ignored) {}
    }
}
