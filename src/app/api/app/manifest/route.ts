import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AppRelease } from "@/models/AppRelease";
import { APP_VERSION_CONFIG, compareSemver } from "@/config/version";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientVersion =
      searchParams.get("installedVersion") ||
      searchParams.get("clientVersion") ||
      request.headers.get("x-app-version") ||
      APP_VERSION_CONFIG.version;

    let latestRelease: any = null;

    try {
      await connectToDatabase();
      latestRelease = await AppRelease.findOne({ isActive: true }).sort({ buildNumber: -1 });

      // If no release exists in DB yet, auto-seed with APP_VERSION_CONFIG baseline
      if (!latestRelease) {
        latestRelease = await AppRelease.create({
          version: APP_VERSION_CONFIG.version,
          buildNumber: APP_VERSION_CONFIG.buildNumber,
          releaseDate: APP_VERSION_CONFIG.releaseDate,
          channel: APP_VERSION_CONFIG.channel,
          changelog: APP_VERSION_CONFIG.changelog,
          minSupportedVersion: APP_VERSION_CONFIG.minSupportedVersion,
          isMandatory: false,
          apkDownloadUrl: "/api/download/android",
          apkSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          apkSizeBytes: 48210400,
          otaBundleUrl: "",
          otaSha256: "",
          isActive: true,
        });
      }
    } catch (dbErr) {
      console.warn("MongoDB connection failed in manifest, falling back to static config:", dbErr);
    }

    // Default to static APP_VERSION_CONFIG if DB unavailable
    const activeVersion = latestRelease?.version || APP_VERSION_CONFIG.version;
    const activeBuildNumber = latestRelease?.buildNumber || APP_VERSION_CONFIG.buildNumber;
    const releaseNotes = latestRelease?.changelog?.length ? latestRelease.changelog : APP_VERSION_CONFIG.changelog;
    const minSupported = latestRelease?.minSupportedVersion || APP_VERSION_CONFIG.minSupportedVersion;
    const publishedAt = latestRelease?.releaseDate || APP_VERSION_CONFIG.releaseDate;
    const apkDownloadUrl = latestRelease?.apkDownloadUrl || "/api/download/android";
    const apkSha256 = latestRelease?.apkSha256 || "";
    const apkSizeBytes = latestRelease?.apkSizeBytes || 0;
    const otaBundleUrl = latestRelease?.otaBundleUrl || "";
    const otaSha256 = latestRelease?.otaSha256 || "";

    const hasUpdate = compareSemver(activeVersion, clientVersion) > 0;
    const isMandatory =
      Boolean(latestRelease?.isMandatory) ||
      compareSemver(minSupported, clientVersion) > 0;

    return NextResponse.json({
      success: true,
      currentVersion: clientVersion,
      latestVersion: activeVersion,
      buildNumber: activeBuildNumber,
      hasUpdate,
      isMandatory,
      channel: latestRelease?.channel || "stable",
      title: `Invictus v${activeVersion}`,
      releaseNotes,
      publishedAt,
      downloadUrl: `${APP_VERSION_CONFIG.githubRepoUrl}/releases/tag/v${activeVersion}`,
      apkDownloadUrl,
      apkSha256,
      apkSizeBytes,
      otaBundleUrl,
      otaSha256,
      provider: latestRelease ? "self-hosted-manifest" : "static-fallback",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to resolve release manifest",
        currentVersion: APP_VERSION_CONFIG.version,
        latestVersion: APP_VERSION_CONFIG.version,
        hasUpdate: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.version || !body.buildNumber) {
      return NextResponse.json(
        { error: "Version and buildNumber are required" },
        { status: 400 }
      );
    }

    const release = await AppRelease.findOneAndUpdate(
      { version: body.version },
      {
        $set: {
          version: body.version,
          buildNumber: body.buildNumber,
          releaseDate: body.releaseDate || new Date().toISOString(),
          channel: body.channel || "stable",
          changelog: Array.isArray(body.changelog) ? body.changelog : [],
          minSupportedVersion: body.minSupportedVersion || "1.0.0",
          isMandatory: Boolean(body.isMandatory),
          apkDownloadUrl: body.apkDownloadUrl || "/api/download/android",
          apkSha256: body.apkSha256 || "",
          apkSizeBytes: body.apkSizeBytes || 0,
          otaBundleUrl: body.otaBundleUrl || "",
          otaSha256: body.otaSha256 || "",
          isActive: body.isActive !== undefined ? body.isActive : true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, release });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
