#!/usr/bin/env node
// Run from creator-portfolio root:
// R2_ACCESS_KEY=xxx R2_SECRET_KEY=yyy node scripts/upload-to-r2.js

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream, existsSync, statSync, unlinkSync, readFileSync } from "fs";
import { pipeline } from "stream/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PEXELS_KEY = "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm";
const ACCOUNT_ID = "73f90c1d6e7edf174ff88b3f117515ce";
const BUCKET     = "powerstudio-creator-portfolio";
const PUBLIC_URL = "https://pub-90343f1a234549689c19246f72b2487c.r2.dev";

const ACCESS_KEY = process.env.R2_ACCESS_KEY;
const SECRET_KEY = process.env.R2_SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("✗ Missing R2 credentials.");
  console.error("  Run: R2_ACCESS_KEY=xxx R2_SECRET_KEY=yyy node scripts/upload-to-r2.js");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// Current video IDs — keep in sync with VIDEO_IDS in app.js
const VIDEO_IDS = [
  27588385, 27588382,
  30744225, 16093155,
  28879318, 28879306,
  8746336,  8746847,
  35673203, 35454852,
  30744218, 27989385,
  27588411, 27588410,
  27588416, 27588419,
];

const UNIQUE_IDS = [...new Set(VIDEO_IDS)];

function fmt(bytes) {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

async function pexelsFetch(url) {
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  return res.json();
}

function getBestVideoUrl(files) {
  const mp4 = files.filter(f => f.file_type === "video/mp4");
  const portrait = mp4.filter(f => f.height >= f.width);
  const pool = portrait.length ? portrait : mp4;
  const sorted = [...pool].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const hd = sorted.find(f => f.quality === "hd");
  return (hd || sorted[0])?.link || null;
}

async function alreadyUploaded(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function downloadToTemp(url, id) {
  const tmp = join(tmpdir(), `pexels_${id}.mp4`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(tmp));
  return tmp;
}

async function uploadToR2(localPath, key) {
  const body = readFileSync(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: "video/mp4",
    CacheControl: "public, max-age=31536000",
  }));
}

(async () => {
  console.log(`\nPowerStudio R2 Uploader (S3 API)`);
  console.log(`==================================`);
  console.log(`Uploading ${UNIQUE_IDS.length} videos → ${BUCKET}\n`);

  let uploaded = 0, skipped = 0, failed = 0;

  for (const id of UNIQUE_IDS) {
    const key = `videos/${id}.mp4`;
    const publicUrl = `${PUBLIC_URL}/${key}`;

    process.stdout.write(`  [${id}] `);

    // Skip if already in R2
    if (await alreadyUploaded(key)) {
      console.log(`✓ already uploaded — ${publicUrl}`);
      skipped++;
      continue;
    }

    // Fetch metadata from Pexels
    process.stdout.write(`Fetching... `);
    let videoUrl;
    try {
      const data = await pexelsFetch(`https://api.pexels.com/videos/videos/${id}`);
      videoUrl = getBestVideoUrl(data.video_files || []);
      if (!videoUrl) throw new Error("no MP4 found");
    } catch (e) {
      console.log(`✗ Pexels: ${e.message}`);
      failed++;
      continue;
    }

    // Download to temp
    process.stdout.write(`Downloading... `);
    let tmp;
    try {
      tmp = await downloadToTemp(videoUrl, id);
      process.stdout.write(`${fmt(statSync(tmp).size)} → Uploading... `);
    } catch (e) {
      console.log(`✗ Download: ${e.message}`);
      failed++;
      continue;
    }

    // Upload to R2
    try {
      await uploadToR2(tmp, key);
      console.log(`✓ ${publicUrl}`);
      uploaded++;
    } catch (e) {
      console.log(`✗ Upload: ${e.message}`);
      failed++;
    } finally {
      try { unlinkSync(tmp); } catch {}
    }
  }

  console.log(`\n✅ Done — ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  if (uploaded + skipped === UNIQUE_IDS.length) {
    console.log(`\nAll videos are in R2. Next steps:`);
    console.log(`  1. Set USE_LOCAL_ASSETS = true in app.js`);
    console.log(`  2. Set CDN_BASE = "${PUBLIC_URL}" in app.js`);
  }
})();
