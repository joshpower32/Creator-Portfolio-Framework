/* =====================================================================
   Creator Portfolio — Gallery, Products, Links, and Contact Integration
   ===================================================================== */

const CONFIG = {
  pexelsKey: "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm",
  galleryQueries: ["fashion photography", "portrait photo", "creative photoshoot", "professional modeling", "lifestyle photography", "studio portrait"],
  heroBgQuery: "creative professional portrait",
  aboutPhotoQuery: "confident portrait woman",
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",
  creatorEmail: "hello@yourcreator.com",
  creatorName: "@YourName",
};

const SOCIAL_LINKS = [
  { id: "instagram", name: "Instagram", icon: "📷", url: "https://instagram.com/yourname" },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "https://tiktok.com/@yourname" },
  { id: "onlyfans", name: "OnlyFans", icon: "❤️", url: "https://onlyfans.com/yourname" },
  { id: "twitter", name: "Twitter", icon: "𝕏", url: "https://twitter.com/yourname" },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "https://youtube.com/@yourname" },
  { id: "twitch", name: "Twitch", icon: "📺", url: "https://twitch.tv/yourname" },
];

const PRODUCTS = [
  { id: "p1", name: "Exclusive Photo Set", price: 9.99, desc: "10 exclusive unedited photos", icon: "📸" },
  { id: "p2", name: "Custom Shoutout Video", price: 19.99, desc: "Personalized 30-second video message", icon: "🎥" },
  { id: "p3", name: "Signed Merchandise", price: 29.99, desc: "Autographed merchandise item", icon: "👕" },
  { id: "p4", name: "Behind-the-Scenes Pack", price: 14.99, desc: "30+ BTS photos from shoots", icon: "🎬" },
  { id: "p5", name: "Monthly Digital Bundle", price: 24.99, desc: "Exclusive monthly content pack", icon: "📦" },
  { id: "p6", name: "Premium Print", price: 39.99, desc: "High-quality 11x14 print", icon: "🖼️" },
];

const $ = (id) => document.getElementById(id);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// --- Gallery state and control ---
let galleryPhotos = [];
let currentGalleryIndex = 0;
const IMG_CACHE_KEY = "creator_imgcache";
let imgCache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}");

// Fetch gallery images from Pexels
async function loadGalleryImages() {
  const queries = CONFIG.galleryQueries;
  let allPhotos = [];

  try {
    for (let i = 0; i < queries.length; i++) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(queries[i])}&per_page=1&orientation=landscape`,
        { headers: { Authorization: CONFIG.pexelsKey } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        allPhotos.push(data.photos[0]);
      }
    }
    galleryPhotos = allPhotos;
    renderGallery();
    renderGalleryDots();
  } catch (_) {
    $("galleryGrid").innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#b0b0b0;padding:40px;'>Unable to load gallery. Check your API key.</p>";
  }
}

function renderGallery() {
  const grid = $("galleryGrid");
  grid.innerHTML = galleryPhotos.map((p, i) => `<img src="${esc(p.src.landscape)}" alt="Photo ${i + 1}" loading="lazy">`).join("");
  updateGalleryScroll();
}

function updateGalleryScroll() {
  const grid = $("galleryGrid");
  grid.style.transform = `translateX(${-currentGalleryIndex * 100}%)`;
}

function renderGalleryDots() {
  const dots = $("galleryDots");
  dots.innerHTML = galleryPhotos.map((_, i) =>
    `<button class="gallery-dot ${i === currentGalleryIndex ? "active" : ""}" onclick="setGalleryIndex(${i})" aria-label="Photo ${i + 1}"></button>`
  ).join("");
}

function setGalleryIndex(idx) {
  currentGalleryIndex = idx;
  updateGalleryScroll();
  renderGalleryDots();
}

function galleryPrev() {
  currentGalleryIndex = (currentGalleryIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
  updateGalleryScroll();
  renderGalleryDots();
}

function galleryNext() {
  currentGalleryIndex = (currentGalleryIndex + 1) % galleryPhotos.length;
  updateGalleryScroll();
  renderGalleryDots();
}

$("galleryPrev").addEventListener("click", galleryPrev);
$("galleryNext").addEventListener("click", galleryNext);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") galleryPrev();
  if (e.key === "ArrowRight") galleryNext();
});

// --- Render Social Links ---
function renderSocialLinks() {
  const grid = $("linksGrid");
  grid.innerHTML = SOCIAL_LINKS.map((link) => `
    <a href="${esc(link.url)}" target="_blank" rel="noopener" class="link-card">
      <div class="link-icon">${link.icon}</div>
      <h3>${esc(link.name)}</h3>
      <p>Follow me here</p>
    </a>`).join("");
}

// --- Render Products ---
function renderProducts() {
  const grid = $("productsGrid");
  grid.innerHTML = PRODUCTS.map((p) => `
    <div class="product-card">
      <div class="product-image" style="font-size:4rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #1a1a1a, #0a0a0a);">${p.icon}</div>
      <div class="product-info">
        <h3>${esc(p.name)}</h3>
        <div class="product-price">$${p.price.toFixed(2)}</div>
        <p class="product-desc">${esc(p.desc)}</p>
        <a href="#contact" class="btn btn-primary btn-sm" style="width:100%;">Get Now</a>
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
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(CONFIG.aboutPhotoQuery)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: CONFIG.pexelsKey } }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      const url = data.photos[0].src.medium;
      imgCache[cacheKey] = { url };
      localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    }
  } catch (_) {}
}

// --- Load hero background ---
async function loadHeroBg() {
  const el = $("heroBg");
  const cacheKey = "__hero";
  const cached = imgCache[cacheKey]?.url;
  if (cached) { el.style.backgroundImage = `url("${cached}")`; return; }
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(CONFIG.heroBgQuery)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: CONFIG.pexelsKey } }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      const url = data.photos[0].src.landscape;
      imgCache[cacheKey] = { url };
      localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
      el.style.backgroundImage = `url("${url}")`;
    }
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
renderSocialLinks();
renderProducts();
loadAboutPhoto();
loadHeroBg();
