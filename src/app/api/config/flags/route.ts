import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FeatureFlag } from "@/models/FeatureFlag";

export const dynamic = "force-dynamic";

const DEFAULT_FLAGS: Record<string, { value: any; description: string; category: any }> = {
  enable_in_app_updater: {
    value: true,
    description: "Enables in-app background update detection and APK downloader",
    category: "system",
  },
  enable_offline_mutation_queue: {
    value: true,
    description: "Allows offline mutations to queue in IndexedDB and replay on reconnect",
    category: "core",
  },
  enable_sound_fx: {
    value: true,
    description: "Web Audio API tactical sound synthesis and haptics",
    category: "core",
  },
  enable_vix_companion: {
    value: true,
    description: "Interactive Vix pixel companion state engine",
    category: "core",
  },
  enable_experimental_gym_timer: {
    value: true,
    description: "High-precision background rest timer for workouts",
    category: "experimental",
  },
  maintenance_mode: {
    value: false,
    description: "Emergency circuit breaker for scheduled database maintenance",
    category: "system",
  },
};

export async function GET() {
  try {
    let flagMap: Record<string, any> = {};

    try {
      await connectToDatabase();
      const docs = await FeatureFlag.find({ isEnabled: true });

      if (docs.length === 0) {
        // Seed default flags
        for (const [key, meta] of Object.entries(DEFAULT_FLAGS)) {
          await FeatureFlag.create({
            key,
            value: meta.value,
            description: meta.description,
            category: meta.category,
            isEnabled: true,
          });
          flagMap[key] = meta.value;
        }
      } else {
        docs.forEach((doc) => {
          flagMap[doc.key] = doc.value;
        });
      }
    } catch (dbErr) {
      console.warn("FeatureFlag lookup failed, falling back to static defaults:", dbErr);
      Object.entries(DEFAULT_FLAGS).forEach(([k, v]) => {
        flagMap[k] = v.value;
      });
    }

    return NextResponse.json(
      {
        success: true,
        flags: flagMap,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load flags" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { key, value, description, category, isEnabled } = body;

    if (!key) {
      return NextResponse.json({ error: "Flag key is required" }, { status: 400 });
    }

    const flag = await FeatureFlag.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          value,
          description: description || "",
          category: category || "core",
          isEnabled: isEnabled !== undefined ? isEnabled : true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, flag });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
