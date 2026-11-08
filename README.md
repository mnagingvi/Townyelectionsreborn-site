# Towny Elections Reborn — website

A responsive, dependency-free landing page for [Towny Elections Reborn](https://github.com/mnagingvi/TownyElections-2). The site is plain HTML, CSS, and JavaScript; it has no build step, package manager, or external asset dependency.

## Preview locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. You can also open `index.html` directly, but a local server gives you the closest preview of how the site will run on Pages.

## Publish for free with Cloudflare Pages

This is a static site, so Cloudflare Pages can deploy it directly from GitHub without a framework, build command, or paid plan.

1. Push the site to the GitHub repository. For a normal production setup, merge the changes into its `main` branch first.
2. In the Cloudflare dashboard, open **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**. Connect GitHub if prompted, then select this site repository.
3. Configure the build:
   - **Framework preset:** `None`
   - **Build command:** leave blank (no build is needed)
   - **Build output directory:** `.`
   - **Root directory:** leave blank / use the repository root
4. Choose **Save and Deploy**. Cloudflare will serve `index.html` and the other files from the repository root at a free `*.pages.dev` address.
5. After the first deploy, every push to the production branch will publish an update. Pull requests and other branches can get preview deployments too. A custom domain is optional; the `pages.dev` address works without buying one.

If you connected Cloudflare to this repository before the pull request is merged, choose the branch containing the site for a preview deployment, or change the **Production branch** to `main` after the merge.

There is no npm install step and no plugin jar in this repository. The **Get the plugin** buttons link to the separate Minecraft plugin's GitHub releases page.

## What is in the site

- `index.html` — page content and the interactive ballot preview
- `styles.css` — responsive design and CSS-only Minecraft-inspired artwork
- `script.js` — mobile navigation, ballot-method demo, and copy-command button
- `favicon.svg` — site icon
- `_headers` — basic security headers for Cloudflare Pages
