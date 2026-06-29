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
  36330964, 8431520, 36330966, 3841358, 19886272,
  6568266,  7571413, 8732392,  8746847, 8733251,
  8746336,  8746841, 8056089,  36330965, 6646601,
  6762994,  8348817, 36082685, 16008307, 8348877,
  8331896,
];
const VID_CACHE_KEY = "creator_vidcache_v1";

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
  // Fetch each hardcoded ID (use localStorage cache to skip re-fetching)
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

  // Fill any gaps up to GALLERY_TARGET from a Pexels search
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

  // Ensure even count so no half-empty last slide
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
  const total = sc + 1; // +1 clone of slide 0 at the end for infinite wrap
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
  // Clone of first slide — enables seamless right-wrap
  if (slides.length) slides.push(slides[0]);
  grid.innerHTML = slides.join("");
  updateGalleryScroll();
}

function updateGalleryScroll() {
  const total = slideCount() + 1;
  $("galleryGrid").style.transform = `translateX(${-currentSlide * (100 / total)}%)`;
}

function renderGalleryDots() {
  const sc = slideCount();
  const active = currentSlide >= sc ? 0 : currentSlide;
  $("galleryDots").innerHTML = Array.from({ length: sc }, (_, i) =>
    `<button class="gallery-dot ${i === active ? "active" : ""}" onclick="setSlide(${i})" aria-label="Slide ${i + 1}"></button>`
  ).join("");
}

function setSlide(i) {
  currentSlide = Math.max(0, Math.min(i, slideCount() - 1));
  updateGalleryScroll();
  renderGalleryDots();
}

function galleryPrev() { setSlide(currentSlide - 1); }
function galleryNext() {
  const sc = slideCount();
  if (currentSlide >= sc - 1) {
    // Animate into the clone, then snap back to real slide 0
    currentSlide = sc;
    updateGalleryScroll();
    renderGalleryDots();
    setTimeout(() => {
      const grid = $("galleryGrid");
      grid.style.transition = "none";
      currentSlide = 0;
      updateGalleryScroll();
      renderGalleryDots();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        grid.style.transition = "";
      }));
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

function getBestVideoSrc(v, quality = "hd") {
  const files = (v.video_files || []).filter(f => f.file_type === "video/mp4");
  const portrait = files.filter(f => f.height >= f.width);
  const pool = portrait.length ? portrait : files;
  if (quality === "sd") {
    // Only use SD if it's at least 400px on the short side — otherwise HD looks far better
    const sd = pool.find(f => f.quality === "sd" && Math.min(f.width, f.height) >= 400);
    return (sd || pool.find(f => f.quality === "hd") || pool[0])?.link || "";
  }
  return (pool.find(f => f.quality === "hd") || pool.find(f => f.quality === "sd") || pool[0])?.link || "";
}

async function loadVideos() {
  let vidCache = JSON.parse(localStorage.getItem(VID_CACHE_KEY) || "{}");
  try {
    const fetched = await Promise.all(VIDEO_IDS.map(async (id) => {
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
    let videos = fetched.filter(v => v && getBestVideoSrc(v, "sd"));
    if (videos.length % 2 !== 0 && videos.length > 1) videos = videos.slice(0, videos.length - 1);
    galleryVideos = videos;
    renderVideoGallery();
    renderVideoDots();
  } catch {}
}

function renderVideoGallery() {
  const grid = $("videoGrid");
  const sc = videoSlideCount();
  const total = sc + 1;
  grid.style.width = `${total * 100}%`;
  grid.style.setProperty("--slide-count", total);
  const slides = [];
  for (let i = 0; i < galleryVideos.length; i += 2) {
    const v1 = galleryVideos[i];
    const v2 = galleryVideos[i + 1];
    slides.push(`<div class="gallery-slide">
      <video src="${esc(getBestVideoSrc(v1, 'sd'))}" muted loop playsinline preload="none" poster="${esc(v1.image || '')}" onclick="openVideoLightbox(${i})" title="Click to watch full screen"></video>
      ${v2 ? `<video src="${esc(getBestVideoSrc(v2, 'sd'))}" muted loop playsinline preload="none" poster="${esc(v2.image || '')}" onclick="openVideoLightbox(${i + 1})" title="Click to watch full screen"></video>` : ""}
    </div>`);
  }
  if (slides.length) slides.push(slides[0]);
  grid.innerHTML = slides.join("");
  updateVideoScroll();
  playCurrentVideoSlide();
}

function updateVideoScroll() {
  const total = videoSlideCount() + 1;
  $("videoGrid").style.transform = `translateX(${-currentVideoSlide * (100 / total)}%)`;
}

function renderVideoDots() {
  const sc = videoSlideCount();
  const active = currentVideoSlide >= sc ? 0 : currentVideoSlide;
  $("videoDots").innerHTML = Array.from({ length: sc }, (_, i) =>
    `<button class="gallery-dot ${i === active ? "active" : ""}" onclick="setVideoSlide(${i})" aria-label="Video slide ${i + 1}"></button>`
  ).join("");
}

function playCurrentVideoSlide() {
  const slides = $("videoGrid").querySelectorAll(".gallery-slide");
  slides.forEach((slide, i) => {
    slide.querySelectorAll("video").forEach(v => {
      if (i === currentVideoSlide) { v.play().catch(() => {}); }
      else { v.pause(); }
    });
  });
}

function setVideoSlide(i) {
  currentVideoSlide = Math.max(0, Math.min(i, videoSlideCount() - 1));
  updateVideoScroll();
  renderVideoDots();
  playCurrentVideoSlide();
}

function videoPrev() { setVideoSlide(currentVideoSlide - 1); }
function videoNext() {
  const sc = videoSlideCount();
  if (currentVideoSlide >= sc - 1) {
    currentVideoSlide = sc;
    updateVideoScroll();
    renderVideoDots();
    playCurrentVideoSlide();
    setTimeout(() => {
      const grid = $("videoGrid");
      grid.style.transition = "none";
      currentVideoSlide = 0;
      updateVideoScroll();
      renderVideoDots();
      playCurrentVideoSlide();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        grid.style.transition = "";
      }));
    }, 420);
  } else {
    setVideoSlide(currentVideoSlide + 1);
  }
}

let lightboxVideoIdx = 0;

function openVideoLightbox(idx) {
  lightboxVideoIdx = idx;
  const v = galleryVideos[idx];
  $("videoLightboxSrc").src = getBestVideoSrc(v, "hd");
  const vid = $("videoLightboxVid");
  vid.load();
  vid.play().catch(() => {});
  $("videoLightboxCounter").textContent = `${idx + 1} / ${galleryVideos.length}`;
  $("videoLightbox").hidden = false;
  document.body.style.overflow = "hidden";
}

function videoLightboxPrev() {
  lightboxVideoIdx = (lightboxVideoIdx - 1 + galleryVideos.length) % galleryVideos.length;
  openVideoLightbox(lightboxVideoIdx);
}

function videoLightboxNext() {
  lightboxVideoIdx = (lightboxVideoIdx + 1) % galleryVideos.length;
  openVideoLightbox(lightboxVideoIdx);
}

function closeVideoLightbox() {
  $("videoLightboxVid").pause();
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

// --- Init ---
loadGalleryImages();
loadVideos();
renderSocialLinks();
renderProducts();
loadAboutPhoto();
loadHeroBg();
