#!/usr/bin/env node
// Run from creator-portfolio root:
// R2_ACCESS_KEY=xxx R2_SECRET_KEY=yyy node scripts/upload-to-r2.js

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream, statSync, unlinkSync, readFileSync } from "fs";
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

// Keep in sync with app.js
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

const GALLERY_PHOTO_IDS = [
  12757296, 5393845, 8169253, 6130800, 12995318, 12001720, 10670356,
  13400492, 7037652, 12018041, 13441424, 5498471, 289227, 12642189, 8649515,
];
const ABOUT_PHOTO_ID = 11103030;
const HERO_PHOTO_ID  = 3160389;
const ALL_PHOTO_IDS  = [...new Set([...GALLERY_PHOTO_IDS, ABOUT_PHOTO_ID, HERO_PHOTO_ID])];
const UNIQUE_VIDEO_IDS = [...new Set(VIDEO_IDS)];

function fmt(bytes) {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

async function alreadyUploaded(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true; }
  catch { return false; }
}

async function downloadToTemp(url, filename) {
  const tmp = join(tmpdir(), filename);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(tmp));
  return tmp;
}

async function uploadToR2(localPath, key, contentType) {
  const body = readFileSync(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000",
  }));
}

async function processAsset(label, key, contentType, getUrlFn) {
  process.stdout.write(`  ${label} `);
  if (await alreadyUploaded(key)) { console.log(`✓ already in R2`); return true; }

  let url;
  try {
    process.stdout.write(`Fetching... `);
    url = await getUrlFn();
  } catch (e) { console.log(`✗ Pexels: ${e.message}`); return false; }

  let tmp;
  try {
    process.stdout.write(`Downloading... `);
    tmp = await downloadToTemp(url, key.replace("/", "_"));
    process.stdout.write(`${fmt(statSync(tmp).size)} → Uploading... `);
  } catch (e) { console.log(`✗ Download: ${e.message}`); return false; }

  try {
    await uploadToR2(tmp, key, contentType);
    console.log(`✓`);
    return true;
  } catch (e) {
    console.log(`✗ Upload: ${e.message}`); return false;
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

async function pexelsPhoto(id) {
  const res = await fetch(`https://api.pexels.com/v1/photos/${id}`,
    { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const p = await res.json();
  return p.src?.large2x || p.src?.large;
}

const videoMetaCache = new Map();

async function fetchVideoMeta(id) {
  if (videoMetaCache.has(id)) return videoMetaCache.get(id);
  const res = await fetch(`https://api.pexels.com/videos/videos/${id}`,
    { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();
  videoMetaCache.set(id, data);
  return data;
}

async function pexelsVideo(id) {
  const data = await fetchVideoMeta(id);
  const mp4 = (data.video_files || []).filter(f => f.file_type === "video/mp4");
  const portrait = mp4.filter(f => f.height >= f.width);
  const pool = portrait.length ? portrait : mp4;
  const sorted = [...pool].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const hd = sorted.find(f => f.quality === "hd");
  const link = (hd || sorted[0])?.link;
  if (!link) throw new Error("no MP4 found");
  return link;
}

async function pexelsVideoPoster(id) {
  const data = await fetchVideoMeta(id);
  if (!data.image) throw new Error("no poster image found");
  return data.image;
}

(async () => {
  console.log(`\nPowerStudio R2 Uploader`);
  console.log(`========================`);

  let ok = 0, fail = 0;

  // --- Photos ---
  console.log(`\n📸 Photos (${ALL_PHOTO_IDS.length})`);
  for (const id of ALL_PHOTO_IDS) {
    const success = await processAsset(`[photo ${id}]`, `photos/${id}.jpg`, "image/jpeg", () => pexelsPhoto(id));
    success ? ok++ : fail++;
  }

  // --- Videos ---
  console.log(`\n🎬 Videos (${UNIQUE_VIDEO_IDS.length})`);
  for (const id of UNIQUE_VIDEO_IDS) {
    const success = await processAsset(`[video ${id}]`, `videos/${id}.mp4`, "video/mp4", () => pexelsVideo(id));
    success ? ok++ : fail++;
  }

  // --- Video posters ---
  console.log(`\n🖼️  Video posters (${UNIQUE_VIDEO_IDS.length})`);
  for (const id of UNIQUE_VIDEO_IDS) {
    const success = await processAsset(`[poster ${id}]`, `posters/${id}.jpg`, "image/jpeg", () => pexelsVideoPoster(id));
    success ? ok++ : fail++;
  }

  const total = ALL_PHOTO_IDS.length + UNIQUE_VIDEO_IDS.length * 2;
  console.log(`\n✅ Done — ${ok}/${total} assets in R2, ${fail} failed`);
  console.log(`\nPublic base: ${PUBLIC_URL}`);
})();
