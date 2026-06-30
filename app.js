/* =====================================================================
   Creator Portfolio — Gallery, Products, Links, and Contact Integration
   ===================================================================== */

// Hardcoded Pexels photo IDs — gallery, hero, about all pinned to specific shots
const GALLERY_IDS = [
  12757296, // purple neon bed — moody dark
  5393845,  // black bob knit wrap — elegant
  8169253,  // red bodysuit dark background
  6130800,  // satin & rose — luxe
  12995318, // red lingerie with roses on bed
  12001720, // black bodysuit red gloves
  10670356, // leather jacket red chair
  13400492, // blue glowing stool — artistic
  7037652,  // black lace lingerie standing
  12018041, // redhead black corset
  13441424, // colourful studio lighting
  5498471,  // black harness mask on bed
  289227,   // overhead pink floor — curly hair
  12642189, // young woman black lace pink bg
  8649515,  // black bob plaid dark interior
];
const ABOUT_PHOTO_ID = 11103030; // dark red lingerie, face visible
const HERO_PHOTO_ID  = 3160389;  // dark editorial — woman in black, moody bg

const VIDEO_IDS = [
  27588385, 27588382,  // slide 1  — yellow bikini babe
  30744225, 16093155,  // slide 2
  28879318, 28879306,  // slide 3
  8746336,  8746847,   // slide 4  — brunette red sheet 2
  35673203, 35454852,  // slide 5  — white bikini adorable
  30744218, 27989385,  // slide 6  — wet and black lingerie
  27588411, 27588410,  // slide 7  — painting hottie
  27588416, 27588419,  // slide 8  — 2 thick babes
];
const VID_CACHE_KEY = "creator_vidcache_v15";

const USE_LOCAL_ASSETS = true;
const CDN_BASE = "https://pub-90343f1a234549689c19246f72b2487c.r2.dev";

const CONFIG = {
  pexelsKey: "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm",
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",
  creatorEmail: "hello@yourcreator.com",
  creatorName: "@YourName",
};

const SOCIAL_LINKS = [
  { id: "instagram", name: "Instagram", icon: "📷", url: "https://instagram.com/yourname", handle: "@yourname", sub: "Daily photos, stories & behind-the-scenes", cta: "Follow Me" },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "https://tiktok.com/@yourname", handle: "@yourname", sub: "Trending videos & viral content", cta: "Follow on TikTok" },
  { id: "onlyfans", name: "OnlyFans", icon: "🔥", url: "https://onlyfans.com/yourname", handle: "yourname", sub: "Exclusive content you won't find anywhere else", cta: "Subscribe Now" },
  { id: "twitter", name: "Twitter / X", icon: "𝕏", url: "https://twitter.com/yourname", handle: "@yourname", sub: "Uncensored thoughts, polls & updates", cta: "Follow Me" },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "https://youtube.com/@yourname", handle: "@yourname", sub: "Full-length videos, vlogs & Q&As", cta: "Subscribe" },
  { id: "twitch", name: "Twitch", icon: "📺", url: "https://twitch.tv/yourname", handle: "yourname", sub: "Live streams — hang out in real time", cta: "Follow & Watch Live" },
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

// --- Load gallery: hardcoded IDs + fallback fill ---
async function loadGalleryImages() {
  if (USE_LOCAL_ASSETS) {
    let photos = GALLERY_IDS.map(id => ({
      id,
      src: { large: `${CDN_BASE}/photos/${id}.jpg`, large2x: `${CDN_BASE}/photos/${id}.jpg` },
    }));
    if (photos.length % 2 !== 0) photos = photos.slice(0, photos.length - 1);
    galleryPhotos = photos;
    renderGallery();
    renderGalleryDots();
    return;
  }

  // Pexels API fallback (used if USE_LOCAL_ASSETS is false)
  const fetched = await Promise.all(GALLERY_IDS.map(async (id) => {
    const cacheKey = "pid_" + id;
    if (imgCache[cacheKey]) return imgCache[cacheKey];
    try {
      const res = await fetch(`https://api.pexels.com/v1/photos/${id}`,
        { headers: { Authorization: CONFIG.pexelsKey } });
      if (!res.ok) return null;
      const p = await res.json();
      imgCache[cacheKey] = p;
      return p;
    } catch { return null; }
  }));

  let photos = fetched.filter(Boolean);

  if (photos.length < GALLERY_TARGET) {
    const need = GALLERY_TARGET - photos.length;
    const existIds = new Set(photos.map(p => p.id));
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=woman+portrait+lingerie+model&per_page=${need + 4}&orientation=portrait&page=1`,
        { headers: { Authorization: CONFIG.pexelsKey } });
      if (res.ok) {
        const data = await res.json();
        const extras = (data.photos || []).filter(p => !existIds.has(p.id)).slice(0, need);
        photos = [...photos, ...extras];
      }
    } catch { /* keep what we have */ }
  }

  if (photos.length % 2 !== 0 && photos.length > 1) photos = photos.slice(0, photos.length - 1);
  localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
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
      video_files: [{ link: `${CDN_BASE}/videos/${id}.mp4`, file_type: "video/mp4", quality: "hd", width: 1920, height: 1080 }],
      image: `${CDN_BASE}/posters/${id}.jpg`,
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
      `<video src="${esc(getBestVideoSrc(v1))}" muted loop playsinline preload="none" poster="${esc(v1.image || '')}" onclick="openVideoLightbox(${i1})" title="Click to watch full screen"></video>`;
    const slot2 = (!v2 || v2._blank) ? '' :
      `<video src="${esc(getBestVideoSrc(v2))}" muted loop playsinline preload="none" poster="${esc(v2.image || '')}" onclick="openVideoLightbox(${i2})" title="Click to watch full screen"></video>`;
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
        const tryPlay = () => v.play().catch(() => {});
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
          v.load();
        }
      } else if (isNeighbor) {
        v.preload = "auto";
        v.pause();
      } else {
        v.preload = "none";
        v.pause();
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

  // Remove any previous stall handler
  if (vid._stallHandler) {
    vid.removeEventListener("waiting", vid._stallHandler);
    vid.removeEventListener("stalled", vid._stallHandler);
    vid._stallHandler = null;
  }

  const src = getBestVideoSrc(v);
  $("videoLightboxSrc").src = src;
  vid.preload = "auto";
  vid.load();

  const tryPlay = () => vid.play().catch(() => {});

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
  grid.innerHTML = SOCIAL_LINKS.map((link) => `
    <a href="${esc(link.url)}" target="_blank" rel="noopener" class="link-card">
      <div class="link-icon">${link.icon}</div>
      <h3>${esc(link.name)}</h3>
      <p class="link-handle">${esc(link.handle)}</p>
      <p>${esc(link.sub)}</p>
      <span class="link-cta">${esc(link.cta)} →</span>
    </a>`).join("");
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
  if (USE_LOCAL_ASSETS) {
    el.style.backgroundImage = `url("${CDN_BASE}/photos/${ABOUT_PHOTO_ID}.jpg")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center top";
    return;
  }
  const cacheKey = "__about";
  const cached = imgCache[cacheKey]?.url;
  if (cached) { el.style.backgroundImage = `url("${cached}")`; el.style.backgroundSize = "cover"; el.style.backgroundPosition = "center"; return; }
  try {
    const res = await fetch(`https://api.pexels.com/v1/photos/${ABOUT_PHOTO_ID}`,
      { headers: { Authorization: CONFIG.pexelsKey } });
    if (!res.ok) return;
    const data = await res.json();
    const url = data.src.large;
    imgCache[cacheKey] = { url };
    localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center top";
  } catch (_) {}
}

// --- Load hero background ---
async function loadHeroBg() {
  const el = $("heroBg");
  if (USE_LOCAL_ASSETS) {
    el.style.backgroundImage = `url("${CDN_BASE}/photos/${HERO_PHOTO_ID}.jpg")`;
    return;
  }
  const cacheKey = "__hero";
  const cached = imgCache[cacheKey]?.url;
  if (cached) { el.style.backgroundImage = `url("${cached}")`; return; }
  try {
    const res = await fetch(`https://api.pexels.com/v1/photos/${HERO_PHOTO_ID}`,
      { headers: { Authorization: CONFIG.pexelsKey } });
    if (!res.ok) return;
    const data = await res.json();
    const url = data.src.large;
    imgCache[cacheKey] = { url };
    localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
    el.style.backgroundImage = `url("${url}")`;
  } catch (_) {}
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
