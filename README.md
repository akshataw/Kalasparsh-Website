# Kalasparsh Tattoo — Portfolio Website

Two-page static site for **Kalasparsh Tattoo** (artist: Omkar Waghe, Thane (W)).
Plain HTML, CSS and JavaScript. No framework and no build step, so it deploys directly to Cloudflare Pages.

```
index.html      Home: hero, artist, selected work, videos, aftercare, reviews, booking form, FAQ
gallery.html    Full gallery with style filters and a full-screen viewer
thanks.html     Shown after the booking form is sent
css/styles.css  All styles. Colours and fonts are set at the top in :root
js/main.js      Menu, scroll effects, sliders, lightbox, FAQ, gallery filter, form
assets/logo.svg Logo / favicon (black circle, red "क")
_headers        Cloudflare cache + security headers
tasks.md        Build checklist
```

## Run locally

```bash
cd PortfolioWebsite
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on Cloudflare Pages (Git, auto-deploy)

1. **Push this folder to GitHub.**
   ```bash
   git remote add origin https://github.com/<your-username>/kalasparsh-tattoo.git
   git push -u origin main
   ```
2. **Connect it in Cloudflare** (one-time setup): log in at dash.cloudflare.com, then go to **Workers & Pages → Create → Pages → Connect to Git**.
   Authorise the Cloudflare GitHub app, then pick the repo and enter these settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **/**
   - Click **Save and Deploy**.
3. The site goes live at `https://<project-name>.pages.dev`. **Every push to `main` redeploys it automatically**, and pull requests get preview URLs.
4. Optional: add your own domain under the Pages project → **Custom domains**.

No Cloudflare API token or GitHub token is needed for this flow.

## Turn on the booking form (Web3Forms, free)

1. Go to **https://web3forms.com**, enter the email that should receive bookings, and click **Create Access Key**.
2. The key arrives by email. Open `index.html`, search for `YOUR_WEB3FORMS_ACCESS_KEY` and replace it with your key.
   The key is meant to be public, so it's safe to commit.
3. Commit and push. Cloudflare redeploys and the form starts working. The free plan allows 250 submissions a month.

Until the key is added, the form checks every field but shows a message asking visitors to use WhatsApp or email instead.

## Editing content

| What | Where |
|---|---|
| Phone, email, WhatsApp, Instagram | Search `98705`, `wagheakshu@gmail.com`, `wa.me`, `instagram.com` in the HTML files (header CTA, contact cards, footer, JSON-LD) and in `js/main.js` (form fallback messages) |
| Artist bio, stats (9+ years, 1500+ tattoos) | `index.html` → section `#about` (also the hero card) |
| Reviews | `index.html` → section `#reviews`. **These are sample reviews. Replace them with real client reviews before launch.** |
| FAQ answers (deposit, touch-up policy, etc.) | `index.html` → section `#faq`, **and** the matching text in the `FAQPage` JSON-LD in `<head>` |
| Aftercare steps | `index.html` → section `#aftercare` |
| Colours / fonts | `css/styles.css` → `:root` tokens (`--red-600`, `--ink-950`, …) |

### Replacing photos with the studio's own work

The photos currently come from **Unsplash** (free licence) and the videos from **Mixkit** (free licence). They're placeholders.

1. Put your images in `assets/images/` (export from Instagram, or use originals, at roughly 1600px on the long side and saved as `.webp` or `.jpg`).
2. In `gallery.html` each tattoo is one `<button class="tile" …>` block:
   - `src` / `srcset`: the thumbnail (you can point both at your file, e.g. `assets/images/peony.webp`)
   - `data-full`: the large image shown in the viewer
   - `data-title`, `data-meta`, the caption text and `alt`: describe the piece
   - `data-style`: one of `fineline`, `blackwork`, `realism`, `colour`, `script` (this drives the filter)
3. The 6 tiles in the home page's "Selected work" use the same format.
4. Update the piece count in the gallery hero (`19`).

**Videos:** in `index.html` → `#process`, replace each `<source src="…mp4">` and its `poster="…jpg"` with your own clips (`assets/videos/…`). Keep them short (10–20 s), muted-friendly, and under about 8 MB each.

## Notes

- Fully responsive (tested at 390, 768, 1024 and 1440px widths), keyboard accessible, and respects the "reduce motion" setting.
- SEO: a meta description and Open Graph tags on each page, plus `TattooParlor` and `FAQPage` structured data.
