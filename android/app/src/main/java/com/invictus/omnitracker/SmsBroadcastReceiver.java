package com.invictus.omnitracker;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import androidx.core.app.NotificationCompat;

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
 * Invictus Zero-Knowledge Native SMS Broadcast Receiver
 * Operates in the background even when Invictus is completely closed or killed.
 * Enforces strict TRAI bank whitelist, zero-tolerance OTP dropping,
 * account balance protection, and background sync to MongoDB.
 */
public class SmsBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "InvictusSmsReceiver";
    private static final String CHANNEL_ID = "invictus_money_channel";
    private static final String DEFAULT_USER_ID = "user_1kapw9sad_1784744868999";
    private static final String SYNC_ENDPOINT = "https://invictus-the-omni-tracker.vercel.app/api/money/auto-sync";

    // 1. TRAI Approved Bank Headers (Pre-compiled Regex)
    private static final Pattern BANK_HEADER_PATTERN = Pattern.compile(
            "^(?:[A-Za-z]{2}[-_]?)?(HDFCBK|SBINB|SBIPSG|SBIUPI|ICICIB|AXISBK|KOTAKB|INDUSB|YESBNK|PNBSMS|BOISMS|CANBNK|UBISMS|UNIONB|IDFCFB|FEDBNK|PAYTMB|CREDBK|CENTBK|BOBSMS|MAHBK|IOB|UCOBNK|RBLBNK|AUFINB|BANDHN|IDBIBK|SCISMS|AMEXIN|AIRTEL|JIOBNK)(?:[-_][A-Za-z0-9]+)?$",
            Pattern.CASE_INSENSITIVE
    );

    // 2. Strict OTP Dropper Pattern
    private static final Pattern OTP_PATTERN = Pattern.compile(
            "\\b(otp|one time password|verification code|secret code|cvv|atm pin|upi pin|password|passcode)\\b",
            Pattern.CASE_INSENSITIVE
    );

    // 3. Balance Clause Stripper (Ensures balance is never parsed as transaction amount)
    private static final Pattern BALANCE_STRIPPER = Pattern.compile(
            "(?:AvlBal|Avail\\s*Bal|Available\\s*Balance|Bal:|Total\\s*Bal).*$",
            Pattern.CASE_INSENSITIVE
    );

    // 4. Amount Pattern (Supports Rs, Re, INR, ₹, and singular Re. 1.00 amounts)
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:(?:Rs\\.?|Re\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?))|(?:debited\\s*(?:by|with|for)|credited\\s*(?:by|with|for)|paid|sent)\\s*(?:Rs\\.?|Re\\.?|INR|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)",
            Pattern.CASE_INSENSITIVE
    );

    // 5. Account Last 4 Digits
    private static final Pattern ACCOUNT_PATTERN = Pattern.compile(
            "(?:A/C|acct|acc|card|ending|vpa|xx|\\*{2,})\\s*([xX*]*(\\d{4}))",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        try {
            Object[] pdus = (Object[]) bundle.get("pdus");
            String format = bundle.getString("format");
            if (pdus == null || pdus.length == 0) return;

            StringBuilder fullBody = new StringBuilder();
            String sender = "";

            for (Object pdu : pdus) {
                SmsMessage message;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    message = SmsMessage.createFromPdu((byte[]) pdu, format);
                } else {
                    message = SmsMessage.createFromPdu((byte[]) pdu);
                }
                if (message != null) {
                    sender = message.getDisplayOriginatingAddress();
                    fullBody.append(message.getMessageBody());
                }
            }

            if (sender == null || sender.isEmpty() || fullBody.length() == 0) {
                return;
            }

            // Step 1: TRAI Bank Sender Verification
            if (!BANK_HEADER_PATTERN.matcher(sender.trim()).matches()) {
                return; // Not an approved bank -> Drop immediately
            }

            final String bodyText = fullBody.toString().replace("\n", " ").trim();

            // Step 2: Strict Zero-Tolerance OTP Dropper
            if (OTP_PATTERN.matcher(bodyText).find()) {
                Log.d(TAG, "Security Drop: OTP/Sensitive token detected. Aborting.");
                return; // 0 bytes logged or transmitted
            }

            // Step 3: Transaction Intent Check
            boolean isDebit = Pattern.compile("(?i)(debited|spent|paid|sent|withdrawn|purchase)").matcher(bodyText).find();
            boolean isCredit = Pattern.compile("(?i)(credited|received|deposited|refunded)").matcher(bodyText).find();
            if (!isDebit && !isCredit) {
                return; // Non-transactional promo SMS -> Drop
            }

            // Step 4: Protect Balance & Extract Amount
            String textForAmount = BALANCE_STRIPPER.matcher(bodyText).replaceAll("");
            Matcher amountMatcher = AMOUNT_PATTERN.matcher(textForAmount);
            if (!amountMatcher.find()) {
                return;
            }

            String rawAmount = amountMatcher.group(1) != null ? amountMatcher.group(1) : amountMatcher.group(2);
            if (rawAmount == null) return;
            double amount = Double.parseDouble(rawAmount.replace(",", ""));
            if (amount <= 0) return;

            // Step 5: Extract Account Last 4
            String accountLast4 = "";
            Matcher accMatcher = ACCOUNT_PATTERN.matcher(bodyText);
            if (accMatcher.find() && accMatcher.group(2) != null) {
                accountLast4 = accMatcher.group(2);
            }

            // Step 6: Identify Bank
            String bankName = "Bank";
            Matcher bankMatcher = BANK_HEADER_PATTERN.matcher(sender.trim());
            if (bankMatcher.find() && bankMatcher.group(1) != null) {
                String code = bankMatcher.group(1).toUpperCase();
                if (code.contains("HDFC")) bankName = "HDFC";
                else if (code.contains("SBI")) bankName = "SBI";
                else if (code.contains("ICICI")) bankName = "ICICI";
                else if (code.contains("AXIS")) bankName = "Axis";
                else if (code.contains("KOTAK")) bankName = "Kotak";
                else if (code.contains("PNB")) bankName = "PNB";
                else if (code.contains("BOI")) bankName = "BOI";
                else if (code.contains("CAN")) bankName = "Canara";
                else if (code.contains("PAYTM")) bankName = "Paytm";
                else if (code.contains("CRED")) bankName = "CRED";
                else if (code.contains("UBI") || code.contains("UNION")) bankName = "Union Bank";
                else if (code.contains("IDFC")) bankName = "IDFC First";
                else bankName = code.replaceAll("(?i)(BK|SMS|PSG)$", "");
            }

            // Step 7: Extract Merchant Name
            String rawMerchant = isCredit ? "Inflow / Deposit" : "UPI Payment";
            if (isDebit) {
                Pattern debitMerchant = Pattern.compile("(?i)(?:to|at|info:?|vpa|paid to|spent on)\\s+([A-Za-z0-9._\\-* ]{2,35}?)(?:\\s*(?:on|ref|upi|avail|bal|\\.|/|$))");
                Matcher m = debitMerchant.matcher(bodyText);
                if (m.find() && m.group(1) != null) {
                    rawMerchant = m.group(1).trim();
                }
            } else {
                Pattern creditMerchant = Pattern.compile("(?i)(?:from|by)\\s+([A-Za-z0-9._\\-* ]{2,35}?)(?:\\s*(?:on|ref|upi|avail|bal|\\.|/|$))");
                Matcher m = creditMerchant.matcher(bodyText);
                if (m.find() && m.group(1) != null) {
                    rawMerchant = m.group(1).trim();
                }
            }

            // Clean merchant string (strip trailing thru/via UPI)
            String cleanMerchant = rawMerchant
                    .replaceAll("(?i)\\s+(?:thru|through|via)\\b.*$", "")
                    .replaceAll("(?i)(?:\\.|\\s*Ref.*|\\s*UPI.*|\\s*Avail.*|\\s*Bal.*)$", "")
                    .trim();

            String todayDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
            String type = (isCredit && !isDebit) ? "income" : "expense";
            String dedupSig = "sms_dedup_" + Math.abs((amount + "_" + cleanMerchant.toLowerCase() + "_" + todayDate + "_" + accountLast4).hashCode()) + "_" + todayDate.replace("-", "");

            final double finalAmount = amount;
            final String finalMerchant = cleanMerchant;
            final String finalType = type;
            final String finalBank = bankName;
            final String finalAcc = accountLast4;
            final String finalSender = sender;
            final String finalDedup = dedupSig;
            final String finalDate = todayDate;

            // Step 8: Headless Background Sync & Notification
            new Thread(new Runnable() {
                @Override
                public void run() {
                    syncToCloud(context, finalAmount, finalType, finalMerchant, finalDate, finalBank, finalAcc, finalSender, finalDedup);
                    showNotification(context, finalAmount, finalType, finalMerchant, finalBank);
                }
            }).start();

        } catch (Exception e) {
            Log.e(TAG, "Error in SMS parsing", e);
        }
    }

    private void syncToCloud(Context context, double amount, String type, String merchant, String date, String bank, String acc, String sender, String dedupSig) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("userId", DEFAULT_USER_ID);
            payload.put("amount", amount);
            payload.put("type", type);
            payload.put("merchant", merchant);
            payload.put("date", date);
            payload.put("bankName", bank);
            payload.put("accountLast4", acc);
            payload.put("rawSender", sender);
            payload.put("dedupSignature", dedupSig);

            URL url = new URL(SYNC_ENDPOINT);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setDoOutput(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            Log.d(TAG, "Cloud sync completed with HTTP " + code);
            conn.disconnect();
        } catch (Exception e) {
            Log.w(TAG, "Cloud sync failed (will retry on next app open)", e);
        }
    }

    private void showNotification(Context context, double amount, String type, String merchant, String bank) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Money Auto-Tracker Alerts",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Instant transaction alerts from Bank SMS");
                channel.enableVibration(true);
                nm.createNotificationChannel(channel);
            }

            Intent tapIntent = new Intent(context, MainActivity.class);
            tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            tapIntent.putExtra("target_tab", "money");

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    (int) System.currentTimeMillis(),
                    tapIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            boolean isExpense = "expense".equals(type);
            String formattedAmt = (amount % 1 == 0)
                    ? String.format(Locale.getDefault(), "%,.0f", amount)
                    : String.format(Locale.getDefault(), "%,.2f", amount);
            String title = (isExpense ? "⚡ Spent ₹" : "⚡ Received ₹") + formattedAmt;
            String body = (isExpense ? "Paid to " : "From ") + merchant + " (" + bank + ")";

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL);

            nm.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Failed to post notification", e);
        }
    }
}
