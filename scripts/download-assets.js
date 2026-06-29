#!/usr/bin/env node
// Run from the creator-portfolio root: node scripts/download-assets.js
// Downloads all photos and videos from Pexels into assets/ for local hosting.

import { createWriteStream, mkdirSync, existsSync, statSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PEXELS_KEY = "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm";

const PHOTO_IDS = [
  12757296, 5393845, 8169253, 6130800, 12995318, 12001720, 10670356,
  13400492, 7037652, 12018041, 13441424, 5498471, 289227, 12642189,
  8649515,
  11103030, // about photo
  3160389,  // hero photo
];

const VIDEO_IDS = [
  27588385, 27588382,
  26889136, 31223573,
  30744225, 16093155,
  28879318, 28879306,
  31223581, 27588390,
  27588431, 27588419,
  27588427, 27588421,
  17147599, 17147597,
  27179500, 27179497,
  36330963, 36330925,
  35687398, 35673132,
  27588426, 27588422,
  8733251,  8746841,
  8746336,  8746847,
  27588384, 27588393,
  35673203, 35454852,
  30744218, 27989385,
  27588411, 27588410,
  27588416, 27588419,
  27588413, 36330924,
  27179741, 27588418,
];

const DIRS = ["assets/photos", "assets/videos", "assets/posters"];
DIRS.forEach(d => mkdirSync(path.join(ROOT, d), { recursive: true }));

function pexelsFetch(url) {
  return fetch(url, { headers: { Authorization: PEXELS_KEY } });
}

async function downloadFile(url, dest) {
  if (existsSync(dest)) {
    const size = statSync(dest).size;
    if (size > 1000) return { skipped: true, size };
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(res.body, createWriteStream(dest));
  const size = statSync(dest).size;
  return { skipped: false, size };
}

function fmt(bytes) {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function getBestVideoUrl(videoFiles) {
  const mp4 = videoFiles.filter(f => f.file_type === "video/mp4");
  const portrait = mp4.filter(f => f.height >= f.width);
  const pool = portrait.length ? portrait : mp4;
  const sorted = [...pool].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const hd = sorted.find(f => f.quality === "hd");
  return (hd || sorted[0])?.link || null;
}

async function downloadPhotos() {
  console.log("\n📸 Downloading photos...");
  let total = 0;
  for (const id of PHOTO_IDS) {
    const dest = path.join(ROOT, "assets/photos", `${id}.jpg`);
    try {
      const data = await (await pexelsFetch(`https://api.pexels.com/v1/photos/${id}`)).json();
      const url = data.src?.large2x || data.src?.large;
      const { skipped, size } = await downloadFile(url, dest);
      total += size;
      console.log(`  ${skipped ? "✓" : "↓"} photo ${id} — ${fmt(size)}`);
    } catch (e) {
      console.error(`  ✗ photo ${id}: ${e.message}`);
    }
  }
  console.log(`  Photos total: ${fmt(total)}`);
  return total;
}

async function downloadVideos() {
  console.log("\n🎬 Downloading videos...");
  let total = 0;
  const overLimit = [];
  for (const id of VIDEO_IDS) {
    const destVid = path.join(ROOT, "assets/videos", `${id}.mp4`);
    const destPoster = path.join(ROOT, "assets/posters", `${id}.jpg`);
    try {
      const data = await (await pexelsFetch(`https://api.pexels.com/videos/videos/${id}`)).json();
      const videoUrl = getBestVideoUrl(data.video_files || []);
      if (!videoUrl) { console.error(`  ✗ video ${id}: no mp4 found`); continue; }

      const { skipped, size } = await downloadFile(videoUrl, destVid);
      total += size;
      const flag = size > 95 * 1e6 ? " ⚠️  >95 MB" : "";
      if (size > 95 * 1e6) overLimit.push({ id, size });
      console.log(`  ${skipped ? "✓" : "↓"} video ${id} — ${fmt(size)}${flag}`);

      if (data.image) {
        await downloadFile(data.image, destPoster).catch(() => {});
      }
    } catch (e) {
      console.error(`  ✗ video ${id}: ${e.message}`);
    }
  }
  console.log(`  Videos total: ${fmt(total)}`);
  if (overLimit.length) {
    console.log(`\n  ⚠️  ${overLimit.length} video(s) exceed 95 MB (GitHub's limit):`);
    overLimit.forEach(({ id, size }) => console.log(`     video ${id} — ${fmt(size)}`));
    console.log("  → These will need Git LFS. Run: git lfs track 'assets/videos/*.mp4'");
  }
  return total;
}

(async () => {
  console.log("Creator Portfolio — Asset Downloader");
  console.log("=====================================");
  const p = await downloadPhotos();
  const v = await downloadVideos();
  console.log(`\n✅ Done — total downloaded: ${fmt(p + v)}`);
  console.log("\nNext: update app.js USE_LOCAL_ASSETS = true, then commit & push.");
})();
