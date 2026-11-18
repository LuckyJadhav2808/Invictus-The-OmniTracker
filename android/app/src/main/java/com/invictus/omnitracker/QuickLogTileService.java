package com.invictus.omnitracker;

import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import android.util.Log;

import androidx.annotation.RequiresApi;

/**
 * Invictus Android Quick Settings TileService
 * Allows tapping "+ Log Expense" directly from Android's pull-down Quick Settings control center
 * to immediately trigger the translucent QuickLogDialogActivity over any screen.
 */
@RequiresApi(api = Build.VERSION_CODES.N)
public class QuickLogTileService extends TileService {

    private static final String TAG = "QuickLogTileService";

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setLabel("+ Log Expense");
            tile.setContentDescription("Open Invictus Quick Expense Logger");
            tile.setState(Tile.STATE_INACTIVE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.setSubtitle("1-Tap Numpad");
            }
            tile.updateTile();
        }
    }

    @Override
    public void onClick() {
        super.onClick();
        try {
            Intent intent = new Intent(this, QuickLogDialogActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            if (Build.VERSION.SDK_INT >= 34) {
                PendingIntent pendingIntent = PendingIntent.getActivity(
                        this,
                        0,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                startActivityAndCollapse(pendingIntent);
            } else {
                startActivityAndCollapse(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch QuickLogDialogActivity from Quick Settings Tile", e);
        }
    }
}
