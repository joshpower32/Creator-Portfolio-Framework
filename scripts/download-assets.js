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
  29940495, 35587808, 30736118, 4355345, 2418518, 30472385, 30736117,
  18651085, 14801125, 31109965, 31530937, 30451277, 9969339, 30831434,
  14041408,
  26274786, // about photo
  17590615, // hero photo
];

const VIDEO_IDS = [
  9512048,  9511841,
  19862866, 9512045,
  7779784,  3917742,
  8177624,  8484890,
  7679416,  15526547,
  5901094,  3894705,
  7719656,  8508647,
  8943618,  3403226,
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
