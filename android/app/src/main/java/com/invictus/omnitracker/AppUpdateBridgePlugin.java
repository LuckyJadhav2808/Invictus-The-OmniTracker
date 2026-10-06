package com.invictus.omnitracker;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdateBridge")
public class AppUpdateBridgePlugin extends Plugin {

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("opened", false);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Could not open install settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("Missing APK download URL");
            return;
        }

        // Run background thread for network streaming
        new Thread(() -> {
            try {
                Context context = getContext();
                File cacheDir = context.getExternalCacheDir();
                if (cacheDir == null) {
                    cacheDir = context.getCacheDir();
                }

                File apkFile = new File(cacheDir, "Invictus_Update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                URL url = new URL(downloadUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setRequestProperty("Accept-Encoding", "identity");
                connection.connect();

                int responseCode = connection.getResponseCode();
                // Handle 301 / 302 redirects (e.g. GitHub Releases redirect to AWS S3)
                if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP || 
                    responseCode == HttpURLConnection.HTTP_MOVED_PERM || 
                    responseCode == 307 || responseCode == 308) {
                    String redirectUrl = connection.getHeaderField("Location");
                    connection.disconnect();
                    url = new URL(redirectUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(30000);
                    connection.connect();
                }

                int fileLength = connection.getContentLength();
                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(apkFile);

                byte[] data = new byte[8192];
                long total = 0;
                int count;
                long lastEventTime = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    output.write(data, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastEventTime > 250 || (fileLength > 0 && total == fileLength)) {
                        lastEventTime = now;
                        int progress = fileLength > 0 ? (int) ((total * 100) / fileLength) : 0;
                        JSObject progressObj = new JSObject();
                        progressObj.put("progress", progress);
                        progressObj.put("bytesDownloaded", total);
                        progressObj.put("totalBytes", fileLength);
                        notifyListeners("downloadProgress", progressObj);
                    }
                }

                output.flush();
                output.close();
                input.close();
                connection.disconnect();

                // Launch Android PackageInstaller via FileProvider
                Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(installIntent);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Package installer invoked");
                call.resolve(ret);
            } catch (Exception e) {
                JSObject errorObj = new JSObject();
                errorObj.put("error", e.getMessage());
                notifyListeners("downloadError", errorObj);
                call.reject("APK download failed: " + e.getMessage(), e);
            }
        }).start();
    }
}
