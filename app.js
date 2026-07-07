/* =====================================================================
   Creator Portfolio — Gallery, Products, Links, and Contact Integration
   ===================================================================== */

// Hardcoded Pexels photo IDs — gallery, hero, about all pinned to specific shots
const GALLERY_IDS = [
  29940495, // editorial portrait, red dress, London studio
  35587808, // black & white editorial fashion portrait
  30736118, // high fashion model, white dress, studio
  4355345,  // fashion portrait behind mesh veil
  2418518,  // model portrait, studio
  30472385, // fashion editorial, moody studio
  30736117, // fashion model, white dress, studio
  18651085, // model walking, streetwear fashion show
  14801125, // model in sequin dress, fashion show
  31109965, // fashion portrait, London street
  31530937, // urban night portrait
  30451277, // street style, red coat, Paris
  9969339,  // fashion photography, city street
  30831434, // urban youth street style portrait
  14041408, // portrait, gold dress, studio
];
const ABOUT_PHOTO_ID = 26274786; // studio portrait, editorial fashion look
const HERO_PHOTO_ID  = 17590615; // model in black, studio, white background

const VIDEO_IDS = [
  9512048,  9511841,   // slide 1  — runway walk / catwalk
  19862866, 9512045,   // slide 2  — runway show
  7779784,  3917742,   // slide 3  — photoshoot BTS / wardrobe styling
  8177624,  8484890,   // slide 4  — clothing rack / designer at work
  7679416,  15526547,  // slide 5  — boutique styling / glamour outfit
  5901094,  3894705,   // slide 6  — editorial posing
  7719656,  8508647,   // slide 7  — model posing, studio
  8943618,  3403226,   // slide 8  — posed video shoot
];
const VID_CACHE_KEY = "creator_vidcache_v15";

const USE_LOCAL_ASSETS = true;
const ASSET_BASE = "assets"; // photos/videos/posters ship with the site — no R2/CDN or Pexels calls at runtime

const CONFIG = {
  pexelsKey: "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm",
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",
  creatorEmail: "hello@yourcreator.com",
  creatorName: "@YourName",
};

// url: "#" — placeholder only. Real creator-specific profile links get filled
// in during customization; leaving real handles here would point to
// unrelated third-party accounts that happen to own "yourname".
const SOCIAL_LINKS = [
  { id: "instagram", name: "Instagram", icon: "📷", url: "#", handle: "@yourname", sub: "Daily photos, stories & behind-the-scenes", cta: "Follow Me" },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "#", handle: "@yourname", sub: "Trending videos & viral content", cta: "Follow on TikTok" },
  { id: "booking", name: "Booking", icon: "📅", url: "#", handle: "yourname", sub: "Check availability & book a shoot", cta: "Book Now" },
  { id: "twitter", name: "Twitter / X", icon: "𝕏", url: "#", handle: "@yourname", sub: "Uncensored thoughts, polls & updates", cta: "Follow Me" },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "#", handle: "@yourname", sub: "Full-length videos, vlogs & Q&As", cta: "Subscribe" },
  { id: "twitch", name: "Twitch", icon: "📺", url: "#", handle: "yourname", sub: "Live streams — hang out in real time", cta: "Follow & Watch Live" },
];

const PRODUCTS = [
  { id: "p1", name: "Custom Video", price: 19.99, desc: "Personalised custom video made just for you — your request, your name, your moment", icon: "🎥", badge: "Popular" },
  { id: "p2", name: "Merch & Items", price: 29.99, desc: "Exclusive branded merch, signed items, and limited drops shipped directly to you", icon: "👕", badge: "New" },
];

const $ = (id) => document.getElementById(id);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// --- Gallery state ---
let galleryPhotos = [];
let currentSlide = 0;       // which 2-photo slide is showing
let lightboxIdx = 0;        // which individual photo is in the lightbox
const GALLERY_TARGET = 14;  // matches verified IDs — fallback only fires on genuine load failures
const IMG_CACHE_KEY = "creator_imgcache_v10";
let imgCache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}");

// --- Photo URLs: local assets/ folder, with Pexels CDN as the non-local fallback ---
function photoUrl(id) {
  if (USE_LOCAL_ASSETS) return `${ASSET_BASE}/photos/${id}.jpg`;
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1260`;
}

async function loadGalleryImages() {
  let photos = GALLERY_IDS.map(id => ({
    id,
    src: { large: photoUrl(id), large2x: photoUrl(id) },
  }));
  if (photos.length % 2 !== 0) photos = photos.slice(0, photos.length - 1);
  galleryPhotos = photos;
  renderGallery();
  renderGalleryDots();
}

function slideCount() { return Math.max(1, Math.ceil(galleryPhotos.length / 2)); }

// Render paired slides — each slide = 2 photos side by side
function renderGallery() {
  const grid = $("galleryGrid");
  const sc = slideCount();
  const total = sc + 2; // clone of last prepended + clone of first appended
  grid.style.width = `${total * 100}%`;
  grid.style.setProperty("--slide-count", total);

  const slides = [];
  for (let i = 0; i < galleryPhotos.length; i += 2) {
    const p1 = galleryPhotos[i];
    const p2 = galleryPhotos[i + 1];
    slides.push(`<div class="gallery-slide">
      <img src="${esc(p1.src.large)}" alt="Photo ${i + 1}" loading="lazy" onclick="openLightbox(${i})" title="Click to view full size">
      ${p2 ? `<img src="${esc(p2.src.large)}" alt="Photo ${i + 2}" loading="lazy" onclick="openLightbox(${i + 1})" title="Click to view full size">` : ""}
    </div>`);
  }
  // [clone of last] + real slides + [clone of first] = seamless both-direction wrap
  if (slides.length) grid.innerHTML = [slides[sc - 1], ...slides, slides[0]].join("");
  updateGalleryScroll();
}

function updateGalleryScroll() {
  const total = slideCount() + 2;
  // real slide 0 is at DOM pos 1, so offset by 1
  $("galleryGrid").style.transform = `translateX(${-(currentSlide + 1) * (100 / total)}%)`;
}

function renderGalleryDots() {
  const sc = slideCount();
  const active = ((currentSlide % sc) + sc) % sc;
  $("galleryDots").innerHTML = Array.from({ length: sc }, (_, i) =>
    `<button class="gallery-dot ${i === active ? "active" : ""}" onclick="setSlide(${i})" aria-label="Slide ${i + 1}"></button>`
  ).join("");
}

function setSlide(i) {
  currentSlide = Math.max(0, Math.min(i, slideCount() - 1));
  updateGalleryScroll();
  renderGalleryDots();
}

function galleryPrev() {
  const sc = slideCount();
  if (currentSlide <= 0) {
    const grid = $("galleryGrid");
    // Animate left to clone of last (DOM pos 0 = translateX 0%)
    currentSlide = sc - 1;
    renderGalleryDots();
    grid.style.transform = `translateX(0%)`;
    setTimeout(() => {
      grid.style.transition = "none";
      updateGalleryScroll(); // snap to real last slide
      requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.transition = ""; }));
    }, 420);
  } else {
    setSlide(currentSlide - 1);
  }
}

function galleryNext() {
  const sc = slideCount();
  if (currentSlide >= sc - 1) {
    const grid = $("galleryGrid");
    const total = sc + 2;
    // Animate right to clone of first (DOM pos sc+1)
    currentSlide = 0;
    renderGalleryDots();
    grid.style.transform = `translateX(${-((sc + 1) / total) * 100}%)`;
    setTimeout(() => {
      grid.style.transition = "none";
      updateGalleryScroll(); // snap to real first slide
      requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.transition = ""; }));
    }, 420);
  } else {
    setSlide(currentSlide + 1);
  }
}

// --- Lightbox: scrolls 1 photo at a time ---
function openLightbox(photoIdx) {
  lightboxIdx = photoIdx;
  $("lightboxImg").src = galleryPhotos[photoIdx].src.large2x;
  $("lightboxCounter").textContent = `${photoIdx + 1} / ${galleryPhotos.length}`;
  $("lightbox").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  $("lightbox").hidden = true;
  document.body.style.overflow = "";
}
function lightboxPrev() {
  lightboxIdx = (lightboxIdx - 1 + galleryPhotos.length) % galleryPhotos.length;
  $("lightboxImg").src = galleryPhotos[lightboxIdx].src.large2x;
  $("lightboxCounter").textContent = `${lightboxIdx + 1} / ${galleryPhotos.length}`;
}
function lightboxNext() {
  lightboxIdx = (lightboxIdx + 1) % galleryPhotos.length;
  $("lightboxImg").src = galleryPhotos[lightboxIdx].src.large2x;
  $("lightboxCounter").textContent = `${lightboxIdx + 1} / ${galleryPhotos.length}`;
}

$("galleryPrev").addEventListener("click", galleryPrev);
$("galleryNext").addEventListener("click", galleryNext);
$("lightboxClose").addEventListener("click", closeLightbox);
$("lightboxBackdrop").addEventListener("click", closeLightbox);
$("lightboxPrev").addEventListener("click", lightboxPrev);
$("lightboxNext").addEventListener("click", lightboxNext);

document.addEventListener("keydown", (e) => {
  if (!$("lightbox").hidden) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxPrev();
    if (e.key === "ArrowRight") lightboxNext();
  } else if (!$("videoLightbox").hidden) {
    if (e.key === "Escape") closeVideoLightbox();
    if (e.key === "ArrowLeft") videoLightboxPrev();
    if (e.key === "ArrowRight") videoLightboxNext();
  } else {
    if (e.key === "ArrowLeft") galleryPrev();
    if (e.key === "ArrowRight") galleryNext();
  }
});

// --- Video Gallery ---
let galleryVideos = [];
let currentVideoSlide = 0;

function videoSlideCount() { return Math.max(1, Math.ceil(galleryVideos.length / 2)); }

function getBestVideoSrc(v) {
  const files = (v.video_files || []).filter(f => f.file_type === "video/mp4");
  if (!files.length) return "";
  // Prefer portrait (vertical) files for the gallery display — fall back to all files
  const portrait = files.filter(f => f.height >= f.width);
  const pool = portrait.length ? portrait : files;
  // Always pick the absolute highest resolution available — no quality downgrade
  return [...pool].sort((a, b) => (b.width * b.height) - (a.width * a.height))[0]?.link || "";
}

async function loadVideos() {
  if (USE_LOCAL_ASSETS) {
    galleryVideos = VIDEO_IDS.map(id => ({
      video_files: [{ link: `${ASSET_BASE}/videos/${id}.mp4`, file_type: "video/mp4", quality: "hd", width: 1920, height: 1080 }],
      image: `${ASSET_BASE}/posters/${id}.jpg`,
    }));
    renderVideoGallery();
    renderVideoDots();
    return;
  }

  // Pexels API fallback
  let vidCache = JSON.parse(localStorage.getItem(VID_CACHE_KEY) || "{}");
  try {
    const fetched = await Promise.all(VIDEO_IDS.map(async (id) => {
      if (id === null) return { _blank: true };
      if (vidCache[id]) return vidCache[id];
      try {
        const res = await fetch(`https://api.pexels.com/videos/videos/${id}`,
          { headers: { Authorization: CONFIG.pexelsKey } });
        if (!res.ok) return null;
        const v = await res.json();
        vidCache[id] = v;
        return v;
      } catch { return null; }
    }));
    localStorage.setItem(VID_CACHE_KEY, JSON.stringify(vidCache));
    galleryVideos = fetched.filter(v => v && (v._blank || getBestVideoSrc(v)));
    renderVideoGallery();
    renderVideoDots();
  } catch {}
}

function renderVideoGallery() {
  const grid = $("videoGrid");
  const sc = videoSlideCount();
  const total = sc + 2;
  grid.style.width = `${total * 100}%`;
  grid.style.setProperty("--slide-count", total);
  const slides = [];
  let vidIdx = 0;
  for (let i = 0; i < galleryVideos.length; i += 2) {
    const v1 = galleryVideos[i];
    const v2 = galleryVideos[i + 1];
    const i1 = vidIdx;
    if (!v1._blank) vidIdx++;
    const i2 = vidIdx;
    if (v2 && !v2._blank) vidIdx++;
    const slot1 = v1._blank ? '' :
      `<video src="${esc(getBestVideoSrc(v1))}" muted loop playsinline preload="none" poster="${esc(v1.image || '')}" onclick="openVideoLightbox(${i1})" onerror="handleVideoError(this)" title="Click to watch full screen"></video>`;
    const slot2 = (!v2 || v2._blank) ? '' :
      `<video src="${esc(getBestVideoSrc(v2))}" muted loop playsinline preload="none" poster="${esc(v2.image || '')}" onclick="openVideoLightbox(${i2})" onerror="handleVideoError(this)" title="Click to watch full screen"></video>`;
    slides.push(`<div class="gallery-slide">${slot1}${slot2}</div>`);
  }
  // [clone of last] + real slides + [clone of first]
  if (slides.length) grid.innerHTML = [slides[sc - 1], ...slides, slides[0]].join("");
  updateVideoScroll();
  playCurrentVideoSlide();
}

function updateVideoScroll() {
  const total = videoSlideCount() + 2;
  $("videoGrid").style.transform = `translateX(${-(currentVideoSlide + 1) * (100 / total)}%)`;
}

function renderVideoDots() {
  const sc = videoSlideCount();
  const active = ((currentVideoSlide % sc) + sc) % sc;
  $("videoDots").innerHTML = Array.from({ length: sc }, (_, i) =>
    `<button class="gallery-dot ${i === active ? "active" : ""}" onclick="setVideoSlide(${i})" aria-label="Video slide ${i + 1}"></button>`
  ).join("");
}

function clearLoadWatchdog(v) {
  if (v._loadWatchdog) {
    clearTimeout(v._loadWatchdog);
    v._loadWatchdog = null;
  }
}

// Browsers don't always fire an `error` event when a cross-origin request
// gets blocked (e.g. Chrome's ORB) — the video just sits in NETWORK_LOADING
// forever. This watchdog catches that "stuck, never errors" case too.
function armLoadWatchdog(v, ms = 7000) {
  clearLoadWatchdog(v);
  v._loadWatchdog = setTimeout(() => {
    if (v.readyState < 2) handleVideoError(v);
  }, ms);
}

function handleVideoError(v) {
  clearLoadWatchdog(v);
  const retries = (v._errorRetries || 0) + 1;
  v._errorRetries = retries;
  v.classList.remove("video-error");
  if (retries <= 2) {
    // Transient network hiccup — back off briefly and try loading again.
    setTimeout(() => { armLoadWatchdog(v); v.load(); }, 800 * retries);
    return;
  }
  // Genuinely broken source — stop retrying and show a clear placeholder
  // instead of a dead black box.
  v.classList.add("video-error");
}

function playCurrentVideoSlide() {
  const slides = $("videoGrid").querySelectorAll(".gallery-slide");
  // +1 offset because DOM position 0 is the clone of last
  slides.forEach((slide, i) => {
    slide.querySelectorAll("video").forEach(v => {
      const isCurrent = i === currentVideoSlide + 1;
      const isNeighbor = Math.abs(i - (currentVideoSlide + 1)) === 1;

      // Always clean up previous handlers before reassigning
      if (v._stallHandler) {
        v.removeEventListener("waiting", v._stallHandler);
        v.removeEventListener("stalled", v._stallHandler);
        v._stallHandler = null;
      }
      if (v._canplayHandler) {
        v.removeEventListener("canplay", v._canplayHandler);
        v._canplayHandler = null;
      }

      if (isCurrent) {
        v.preload = "auto";
        const tryPlay = () => { clearLoadWatchdog(v); v.play().catch(() => {}); };
        v._stallHandler = () => setTimeout(tryPlay, 300);
        v.addEventListener("waiting", v._stallHandler);
        v.addEventListener("stalled", v._stallHandler);

        if (!v.paused) {
          // Already playing — leave it alone
        } else if (v.readyState >= 2) {
          // Loaded and paused — just play
          tryPlay();
        } else {
          // Not loaded yet — mirror exactly what the lightbox does:
          // register canplay listener first, then call load()
          v._canplayHandler = tryPlay;
          v.addEventListener("canplay", v._canplayHandler, { once: true });
          armLoadWatchdog(v);
          v.load();
        }
      } else if (isNeighbor) {
        v.preload = "auto";
        v.pause();
      } else {
        v.preload = "none";
        v.pause();
        clearLoadWatchdog(v);
      }
    });
  });
}

function setVideoSlide(i) {
  currentVideoSlide = Math.max(0, Math.min(i, videoSlideCount() - 1));
  updateVideoScroll();
  renderVideoDots();
  playCurrentVideoSlide();
}

function videoPrev() {
  const sc = videoSlideCount();
  if (currentVideoSlide <= 0) {
    const grid = $("videoGrid");
    currentVideoSlide = sc - 1;
    renderVideoDots();
    grid.style.transform = `translateX(0%)`;
    setTimeout(() => {
      grid.style.transition = "none";
      updateVideoScroll();
      playCurrentVideoSlide();
      requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.transition = ""; }));
    }, 420);
  } else {
    setVideoSlide(currentVideoSlide - 1);
  }
}

function videoNext() {
  const sc = videoSlideCount();
  if (currentVideoSlide >= sc - 1) {
    const grid = $("videoGrid");
    const total = sc + 2;
    currentVideoSlide = 0;
    renderVideoDots();
    grid.style.transform = `translateX(${-((sc + 1) / total) * 100}%)`;
    setTimeout(() => {
      grid.style.transition = "none";
      updateVideoScroll();
      playCurrentVideoSlide();
      requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.transition = ""; }));
    }, 420);
  } else {
    setVideoSlide(currentVideoSlide + 1);
  }
}

let lightboxVideoIdx = 0;

const realVideos = () => galleryVideos.filter(v => !v._blank);

function openVideoLightbox(idx) {
  lightboxVideoIdx = idx;
  const v = realVideos()[idx];
  const vid = $("videoLightboxVid");

  // Remove any previous stall/error handler
  if (vid._stallHandler) {
    vid.removeEventListener("waiting", vid._stallHandler);
    vid.removeEventListener("stalled", vid._stallHandler);
    vid._stallHandler = null;
  }
  if (vid._errorHandler) {
    vid.removeEventListener("error", vid._errorHandler);
    vid._errorHandler = null;
  }

  vid.classList.remove("video-error");
  vid._errorRetries = 0;
  vid._errorHandler = () => handleVideoError(vid);
  vid.addEventListener("error", vid._errorHandler);

  const src = getBestVideoSrc(v);
  $("videoLightboxSrc").src = src;
  vid.preload = "auto";
  armLoadWatchdog(vid);
  vid.load();

  const tryPlay = () => { clearLoadWatchdog(vid); vid.play().catch(() => {}); };

  vid._stallHandler = () => setTimeout(tryPlay, 300);
  vid.addEventListener("waiting", vid._stallHandler);
  vid.addEventListener("stalled", vid._stallHandler);

  vid.addEventListener("canplay", tryPlay, { once: true });

  $("videoLightboxCounter").textContent = `${idx + 1} / ${realVideos().length}`;
  $("videoLightbox").hidden = false;
  document.body.style.overflow = "hidden";
}

function videoLightboxPrev() {
  const len = realVideos().length;
  lightboxVideoIdx = (lightboxVideoIdx - 1 + len) % len;
  openVideoLightbox(lightboxVideoIdx);
}

function videoLightboxNext() {
  const len = realVideos().length;
  lightboxVideoIdx = (lightboxVideoIdx + 1) % len;
  openVideoLightbox(lightboxVideoIdx);
}

function closeVideoLightbox() {
  const vid = $("videoLightboxVid");
  if (vid._stallHandler) {
    vid.removeEventListener("waiting", vid._stallHandler);
    vid.removeEventListener("stalled", vid._stallHandler);
    vid._stallHandler = null;
  }
  vid.pause();
  $("videoLightboxSrc").src = "";
  $("videoLightbox").hidden = true;
  document.body.style.overflow = "";
  playCurrentVideoSlide();
}

$("videoPrev").addEventListener("click", videoPrev);
$("videoNext").addEventListener("click", videoNext);
$("videoLightboxClose").addEventListener("click", closeVideoLightbox);
$("videoLightboxBackdrop").addEventListener("click", closeVideoLightbox);
$("videoLightboxPrev").addEventListener("click", videoLightboxPrev);
$("videoLightboxNext").addEventListener("click", videoLightboxNext);

// --- Render Social Links ---
function renderSocialLinks() {
  const grid = $("linksGrid");
  grid.innerHTML = SOCIAL_LINKS.map((link) => {
    const isPlaceholder = link.url === "#";
    const attrs = isPlaceholder
      ? `href="#" onclick="return false;"`
      : `href="${esc(link.url)}" target="_blank" rel="noopener"`;
    return `
    <a ${attrs} class="link-card">
      <div class="link-icon">${link.icon}</div>
      <h3>${esc(link.name)}</h3>
      <p class="link-handle">${esc(link.handle)}</p>
      <p>${esc(link.sub)}</p>
      <span class="link-cta">${esc(link.cta)} →</span>
    </a>`;
  }).join("");
}

// --- Render Products ---
function renderProducts() {
  const grid = $("productsGrid");
  grid.innerHTML = PRODUCTS.map((p) => `
    <div class="product-card">
      ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ""}
      <div class="product-image">${p.icon}</div>
      <div class="product-info">
        <h3>${esc(p.name)}</h3>
        <div class="product-price">$${p.price.toFixed(2)}</div>
        <p class="product-desc">${esc(p.desc)}</p>
        <a href="#contact" class="btn btn-primary btn-sm" style="width:100%;">Buy Now →</a>
      </div>
    </div>`).join("");
}

// --- Load about photo ---
async function loadAboutPhoto() {
  const el = $("aboutImage");
  el.style.backgroundImage = `url("${photoUrl(ABOUT_PHOTO_ID)}")`;
  el.style.backgroundSize = "cover";
  el.style.backgroundPosition = "center top";
}

// --- Load hero background ---
async function loadHeroBg() {
  const el = $("heroBg");
  el.style.backgroundImage = `url("${photoUrl(HERO_PHOTO_ID)}")`;
}

// --- Contact Form ---
const contactForm = $("contactForm");
const contactNote = $("contactNote");
const KEY_PLACEHOLDER = "YOUR_WEB3FORMS_ACCESS_KEY";

async function submitContact(formData) {
  const firstName = String(formData.get("name") || "there").split(" ")[0];
  const btn = contactForm.querySelector('button[type="submit"]');

  if (!CONFIG.web3formsKey || CONFIG.web3formsKey === KEY_PLACEHOLDER) {
    const subject = encodeURIComponent(`Message from ${formData.get("name") || "website"}`);
    const body = encodeURIComponent([...formData.entries()].map(([k, v]) => `${k}: ${v}`).join("\n"));
    window.location.href = `mailto:${CONFIG.creatorEmail}?subject=${subject}&body=${body}`;
    toast(`Opening your email app to send your message…`);
    return;
  }

  const fd = new FormData();
  fd.append("access_key", CONFIG.web3formsKey);
  fd.append("subject", `💌 NEW MESSAGE from ${formData.get("name") || "fan"}`);
  fd.append("from_name", CONFIG.creatorName);
  fd.append("Name", formData.get("name") || "");
  fd.append("Email", formData.get("email") || "");
  fd.append("Subject", formData.get("subject") || "");
  fd.append("Message", formData.get("message") || "");

  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "Sending…";

  try {
    const res = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: fd });
    const data = await res.json();
    if (res.ok && data.success) {
      contactForm.reset();
      toast(`Thanks ${firstName}! I'll get back to you soon 💌`);
      contactNote.textContent = "Sent ✓ — Thanks for reaching out!";
    } else {
      throw new Error(data.message || "Send failed");
    }
  } catch (_) {
    toast(`Couldn't send message — please email ${CONFIG.creatorEmail}.`);
    contactNote.textContent = `Something went wrong. Please email ${CONFIG.creatorEmail} directly.`;
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitContact(new FormData(contactForm));
});

// --- Mobile nav toggle ---
const navToggle = $("navToggle");
const navLinks = $("navLinks");
navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen);
});
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  navToggle.setAttribute("aria-expanded", false);
}));

// --- Toast notifications ---
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 300);
  }, 3500);
}

// Pause/resume gallery videos based on section visibility — saves bandwidth and CPU
new IntersectionObserver(([entry]) => {
  const videos = $("videoGrid")?.querySelectorAll("video") || [];
  if (entry.isIntersecting) {
    playCurrentVideoSlide();
  } else {
    videos.forEach(v => { v.pause(); v.preload = "none"; });
  }
}, { threshold: 0 }).observe(document.getElementById("videos"));

// --- Init ---
loadGalleryImages();
loadVideos();
renderSocialLinks();
renderProducts();
loadAboutPhoto();
loadHeroBg();

