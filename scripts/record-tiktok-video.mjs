// Deterministic 600-frame capture of the creator-portfolio TikTok promo.
// Each output frame is posed exactly (scroll, overlay alpha, video currentTime), then screenshot at 1080x1920.
//
// Usage (from a folder with `npm i playwright`; needs Google Chrome installed):
//   1. Serve this framework:  python3 -m http.server 5590 --directory <creator-portfolio>
//   2. node record-tiktok-video.mjs          → writes capture/f00000.jpg … f00599.jpg
//   3. ffmpeg -framerate 30 -i "capture/f%05d.jpg" -c:v libx264 -preset slow -crf 18 \
//        -vf format=yuv420p -movflags +faststart -an creator-portfolio-founding-offer-20s.mp4
//
// Frames are stepped, not real-time: embedded clips are advanced via currentTime (blob-URL
// sources make them seekable), so the 20s / 30fps output is perfectly smooth regardless of
// capture speed (~7 min). Adjust the `segments` timeline / caption text for other frameworks.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync } from "fs";

const CAP_DIR = new URL("./capture/", import.meta.url).pathname;
rmSync(CAP_DIR, { recursive: true, force: true });
mkdirSync(CAP_DIR, { recursive: true });

const FPS = 30, DURATION = 20.0, FRAMES = FPS * DURATION;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await context.newPage();
await page.goto("http://localhost:5590/", { waitUntil: "load" });

const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 540, height: 960, deviceScaleFactor: 2, mobile: true, scale: 2,
});
await page.waitForTimeout(300);

// Force-load everything (lazy images, videos) with a pre-scroll.
await page.waitForFunction(() => document.querySelectorAll("#galleryGrid img").length > 0, { timeout: 15000 });
await page.evaluate(async () => {
  document.querySelectorAll("img[loading=lazy]").forEach(i => (i.loading = "eager"));
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y <= h; y += 800) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await page.waitForFunction(() => {
  const imgs = [...document.querySelectorAll("#galleryGrid img")];
  const vids = [...document.querySelectorAll("#videoGrid video")];
  if (!imgs.length || !vids.length) return false;
  return imgs.every(i => i.complete && i.naturalWidth > 0) &&
         vids.filter(v => v.readyState >= 3).length >= 2;
}, { timeout: 30000 }).catch(() => console.log("warning: readiness timed out, capturing anyway"));
await page.evaluate(() => Promise.all(
  ["assets/photos/17590615.jpg", "assets/photos/26274786.jpg"].map(src =>
    new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = src; })
  )
));

// Freeze the page: no real playback, no transitions; inject overlays; expose the per-frame poser.
await page.evaluate(async () => {
  HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  document.querySelectorAll("video").forEach(v => v.pause());

  // Visible slide pair -> blob URLs so they are fully seekable frame-by-frame.
  const pair = [...document.querySelectorAll("#videoGrid video")].slice(2, 4);
  await Promise.all(pair.map(async v => {
    const blob = await (await fetch(v.getAttribute("src"))).blob();
    v.src = URL.createObjectURL(blob);
    await new Promise(res => { v.onloadedmetadata = res; v.load(); setTimeout(res, 5000); });
  }));

  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { transition: none !important; animation: none !important; }
    ::-webkit-scrollbar { display: none !important; }
    html { scrollbar-width: none !important; scroll-behavior: auto !important; }
  `;
  document.head.appendChild(style);

  const cap = document.createElement("div");
  cap.id = "__cap";
  cap.style.cssText = `
    position: fixed; top: 36%; left: 34px; right: 34px; z-index: 9998;
    transform: translateY(-50%); opacity: 0;
    background: rgba(8,8,8,.68); border-radius: 18px; padding: 26px 24px;
    color: #fff; font-weight: 800; font-size: 30px; line-height: 1.3;
    text-align: center; pointer-events: none; backdrop-filter: blur(4px);
  `;
  cap.textContent = "Built for creators, models & influencers";
  document.body.appendChild(cap);

  const card = document.createElement("div");
  card.id = "__card";
  card.style.cssText = `
    position: fixed; inset: 0; z-index: 9999; opacity: 0;
    background: radial-gradient(ellipse 90% 45% at 50% 16%, rgba(212,163,80,.14), transparent 60%), #17130f;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; pointer-events: none; padding: 0 44px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  `;
  card.innerHTML = `
    <div style="width:26px;height:26px;background:#d9a04c;transform:rotate(45deg);margin-bottom:66px;"></div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:54px;color:#f5f1ea;margin-bottom:52px;">Power<span style="color:#d9a04c;">Studio</span></div>
    <div style="font-size:27px;color:#cfc9c0;line-height:1.45;margin-bottom:44px;">A website like this,<br>for <span style="font-style:italic;color:#d9a04c;">your</span> brand.</div>
    <div style="border:1px solid rgba(217,160,76,.55);background:rgba(217,160,76,.08);border-radius:14px;padding:20px 26px;font-size:23px;color:#efeae2;line-height:1.55;margin-bottom:48px;">First 5 clients: package fee <b>waived</b><br><span style="color:#d9a04c;font-weight:700;">$99</span> to get started</div>
    <div style="font-size:25px;font-weight:700;color:#d9a04c;margin-bottom:18px;">powerstudiostorefront.com</div>
    <div style="font-size:16px;color:#8f8a82;">Hamilton, Ontario · web design &amp; photography</div>
  `;
  document.body.appendChild(card);
  window.scrollTo(0, 0);

  // Visible video-slide pair: grid children are [clone-of-last, slide0, ...], slide0 videos are flat idx 2,3.
  const allVids = [...document.querySelectorAll("#videoGrid video")];
  const seekVids = allVids.slice(2, 4).filter(v => v.readyState >= 1);

  const headerH = document.querySelector(".site-header").offsetHeight;
  const yOf = sel => Math.max(0, document.querySelector(sel).getBoundingClientRect().top + window.scrollY - headerH - 6);
  const segments = [
    [0.9, 2.9, 0, yOf("#gallery")],
    [4.2, 6.0, yOf("#gallery"), yOf("#videos")],
    [8.2, 10.2, yOf("#videos"), yOf("#links")],
    [10.8, 12.5, yOf("#links"), yOf("#shop")],
    [13.5, 15.2, yOf("#shop"), yOf("#exclusive")],
  ];
  const yVideos = yOf("#videos");
  const CAP_IN = 8.4, CAP_OUT = 12.2, CARD_IN = 15.7, FADE = 0.55;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = x => Math.max(0, Math.min(1, x));

  window.__pose = async (t) => {
    let y = 0;
    for (const [t0, t1, y0, y1] of segments) {
      if (t >= t1) { y = y1; continue; }
      if (t >= t0) y = y0 + (y1 - y0) * ease((t - t0) / (t1 - t0));
      break;
    }
    window.scrollTo(0, y);
    cap.style.opacity = String(Math.min(clamp01((t - CAP_IN) / FADE), clamp01((CAP_OUT - t) / FADE)));
    card.style.opacity = String(clamp01((t - CARD_IN) / 0.7));

    // Advance embedded clips only when their section is near the viewport.
    if (Math.abs(y - yVideos) < 1600) {
      await Promise.all(seekVids.map(v => new Promise(res => {
        const target = t % Math.max(1, (v.duration || 10) - 0.1);
        const on = () => { v.removeEventListener("seeked", on); res(); };
        v.addEventListener("seeked", on);
        setTimeout(() => { v.removeEventListener("seeked", on); res(); }, 400);
        v.currentTime = target;
      })));
      // let the freshly-seeked video frames composite before the screenshot
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    return y;
  };
});

const t0 = Date.now();
for (let i = 0; i < FRAMES; i++) {
  const t = i / FPS;
  await page.evaluate(tt => window.__pose(tt), t);
  const shot = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  writeFileSync(`${CAP_DIR}f${String(i).padStart(5, "0")}.jpg`, Buffer.from(shot.data, "base64"));
  if (i % 60 === 0) console.log(`frame ${i}/${FRAMES} (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
}

await context.close();
await browser.close();
console.log(`DONE ${FRAMES} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
