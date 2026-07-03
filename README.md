# Creator Portfolio — Premium Creator/Model Website

A professional, modern website for fashion models, photographers, and content creators. Features a **photo gallery**, **social media link aggregator**, **merchandise shop**, **exclusive membership tiers**, and **contact form**. Pure HTML/CSS/JS — no build step, free hosting on GitHub Pages or Netlify.

Built for creators who want to:
- Showcase their best content
- Direct fans to all social media profiles
- Sell merchandise and digital products
- Offer exclusive subscription/membership tiers
- Collect fan messages and collaboration requests

## Features

- **Hero section** with premium gradient design
- **Portfolio gallery** with arrow navigation and Pexels photo integration
- **Social media links** — Instagram, TikTok, Booking, Twitter, YouTube, Twitch (fully customizable)
- **Shop section** — digital products, merchandise, exclusive content
- **Exclusive membership tiers** — Fan Club ($9.99), VIP Club ($19.99), Platinum ($49.99) with features
- **About section** with creator bio and portrait photo
- **Contact form** wired to Web3Forms for fan messages
- **Mobile responsive** — tested and optimized for all devices
- **Modern dark aesthetic** with vibrant pink/magenta accent
- **Fully accessible** — ARIA labels, keyboard navigation, semantic HTML

## Personalising for a creator

1. **Brand colors** — edit `:root` in `styles.css`:
   - Change `--brand: #ff006e` to creator's signature color
   - Adjust the gradient in hero section
   
2. **Creator name** — update throughout `index.html`:
   - Replace `@YourName` with creator's handle/name
   - Update social media handles and URLs
   - Update creator email, location, bio

3. **Social media links** — edit `SOCIAL_LINKS` array in `app.js`:
   - Update URLs for all platforms (Instagram, TikTok, Booking, etc.)
   - Can add/remove platforms as needed

4. **Products/Merchandise** — edit `PRODUCTS` array in `app.js`:
   - Name, price, description, icon emoji
   - Customize what you're selling (photos, videos, merch, etc.)

5. **Subscription tiers** — customize in `index.html`:
   - Tier names, prices, features
   - Can add/remove tiers or adjust pricing

6. **About section** — update bio and contact info in `index.html`

## Local preview

```bash
python3 -m http.server 5590   # then open http://localhost:5590
```

## Gallery & Photos

- Gallery auto-loads from Pexels API (using creator-related search terms)
- About section loads a portrait photo automatically
- Hero background loads a professional portrait automatically

To use real photos instead:
- Edit `CONFIG.galleryQueries` in `app.js` to match creator's niche
- Or directly set image URLs in HTML

## Web3Forms Integration (Contact Form)

The contact form is wired to **Web3Forms** so fan messages email the creator automatically.

1. Get a FREE key at [web3forms.com](https://web3forms.com) using the **creator's email**
2. Paste it into `CONFIG.web3formsKey` in `app.js`
3. Update `CONFIG.creatorEmail` and `CONFIG.creatorName`
4. Test a message from the live site — confirm email arrives

**Fallback:** If no Web3Forms key is set, the form opens the creator's email app (mailto) so no message is lost.

Free tier = 250 submissions/month per key.

## Subscription / Product Management

Currently the site shows subscription tiers and products, but payment processing is not built in. To complete the flow:

**For subscriptions:**
- Wire to **Stripe** (recurring subscriptions)
- Or **Patreon** (creator membership platform)

**For products:**
- Wire to **Gumroad** (digital products)
- Or **Shopify** (physical merchandise)
- Or **Stripe Payment Links** (simple checkout)

The buttons currently link to `#contact` — customize the destination based on platform.

## Hosting

1. Push to GitHub (free demo)
2. Deploy to **Netlify** or **Cloudflare Pages** (both free, custom domain support)
3. Point custom domain nameservers to Netlify/Cloudflare
4. Creator can use custom domain (creator.com) or brand domain

## Notes

- Gallery and about photo auto-load from Pexels (demo data); customize search terms for your niche
- All colors are fully customizable via CSS variables
- Mobile-first responsive design
- Dark theme optimized for creator brands (customizable to any color)
- Social links open in new tabs
- No backend required — fully static site

## Best For

- Fashion and portfolio models
- Influencers (Instagram, TikTok, YouTube)
- Content creators building a central hub
- Photographers and artists
- Anyone selling digital or physical products
- Anyone who wants to centralize their online presence

## Selling This Template

This is a complete, sellable template for creators, models, influencers, and content creators. The multi-tier subscription model + shop section makes it ideal for creators looking to monetize their audience beyond their primary platform.

**Potential clients:**
- Models (build portfolio + fan engagement)
- Content creators (centralize social, sell products)
- Influencers (aggregate followers, sell courses/coaching)
- Photographers (showcase work + sell prints)
- Artists (portfolio + shop)
