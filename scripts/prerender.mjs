/**
 * Writes every page as finished HTML (so search engines and AI assistants
 * can read it without running scripts), plus sitemaps, robots.txt,
 * llms.txt, llms-full.txt, an RSS feed, the web manifest and the IndexNow
 * key and URL list.
 *
 * Runs after `vite build` (client) and `vite build --ssr` (server entry).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://personality.dhurta.org';
const TODAY = new Date().toISOString().slice(0, 10);
// IndexNow lets Bing, Yandex and others know when pages change.
const INDEXNOW_KEY = 'b7e4c2a9f1d84e6fa3c05d9e2b71f468';

const ssr = await import(pathToFileURL(path.join(ROOT, 'dist-ssr', 'entry-server.js')).href);
const routes = ssr.buildRoutes();
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = (p) => `${ORIGIN}${p}`;
const byPath = new Map(routes.map((r) => [r.path, r]));

function head(r) {
  const img = abs(r.image ?? '/og.png');
  const tags = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${abs(r.path)}" />`,
    `<meta property="og:type" content="${r.page.kind === 'home' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="Personality" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:url" content="${abs(r.path)}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:locale" content="${r.lang === 'hi' ? 'hi_IN' : 'en_IN'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
  ];
  if (r.alt && byPath.has(r.alt)) {
    const en = r.lang === 'en' ? r.path : r.alt;
    const hi = r.lang === 'hi' ? r.path : r.alt;
    tags.push(
      `<link rel="alternate" hreflang="en" href="${abs(en)}" />`,
      `<link rel="alternate" hreflang="hi" href="${abs(hi)}" />`,
      `<link rel="alternate" hreflang="x-default" href="${abs(en)}" />`,
    );
  }
  for (const j of r.jsonld) tags.push(`<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`);
  return tags.join('\n    ');
}

let written = 0;
for (const r of routes) {
  const body = ssr.render(r);
  const html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${r.lang === 'hi' ? 'hi' : 'en'}">`)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, head(r))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  const out = path.join(DIST, r.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  written++;
}

// ------------------------------------------------------------- sitemaps
const groups = [...new Set(routes.map((r) => r.group))];
const staticPages = [
  { path: '/privacy/', group: 'company', priority: 0.4 },
  { path: '/credits/', group: 'company', priority: 0.2 },
];
for (const g of groups) {
  const list = [...routes.filter((r) => r.group === g), ...staticPages.filter((p) => p.group === g)];
  const urls = list.map((r) => {
    const alts =
      r.alt && byPath.has(r.alt)
        ? [
            `    <xhtml:link rel="alternate" hreflang="${r.lang}" href="${abs(r.path)}"/>`,
            `    <xhtml:link rel="alternate" hreflang="${r.lang === 'en' ? 'hi' : 'en'}" href="${abs(r.alt)}"/>`,
          ].join('\n')
        : '';
    const imgs =
      r.page?.kind === 'home'
        ? ['/og.png', '/app/01_health.png', '/app/02_analyze.png', '/app/03_style.png', '/app/04_skills.png', '/app/05_pose.png']
            .map((i) => `    <image:image><image:loc>${abs(i)}</image:loc></image:image>`)
            .join('\n')
        : r.page?.kind === 'guidesHub' || r.path === '/'
          ? ''
          : '';
    return `  <url>\n    <loc>${abs(r.path)}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>\n${alts}${alts && imgs ? '\n' : ''}${imgs}\n  </url>`;
  });
  fs.mkdirSync(path.join(DIST, 'sitemaps'), { recursive: true });
  fs.writeFileSync(
    path.join(DIST, 'sitemaps', `${g}.xml`),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`,
  );
}
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${groups
    .map((g) => `  <sitemap><loc>${abs(`/sitemaps/${g}.xml`)}</loc><lastmod>${TODAY}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>\n`,
);

// --------------------------------------------------------------- robots
// Search engines and AI assistants are welcome to read and cite the site.
fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    '',
    ...['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'DuckAssistBot', 'meta-externalagent', 'CCBot']
      .flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'),
);

// ------------------------------------------------------------ llms.txt
const sect = (title, list) => [`## ${title}`, ...list.map((r) => `- [${r.title}](${abs(r.path)}): ${r.description}`), ''];
const pick = (kind) => routes.filter((r) => r.page.kind === kind && r.lang === 'en');
fs.writeFileSync(
  path.join(DIST, 'llms.txt'),
  [
    '# Personality',
    '',
    '> Personality (by dhurta.Inc) is a private, on-device Android app for body, food, style and skills. It reads 478 face points and 33 body points live on the device (Google MediaPipe), builds training plans that adjust after every session and level up, suggests meals for the user\'s region and diet, and teaches 13 fighting arts including Kalaripayattu, Silambam and Gatka. No accounts, no uploads, no ads or tracking. Coming soon to Android.',
    '',
    'Key facts: face shape from three outline ratios matched to six reference shapes (no beauty scores); posture measured in degrees with neutral wording; squat counting from the 3D knee angle (down below 105°, up above 155°); 97 dishes from 13 cuisines with nutrition; content in English and Hindi. Contact: support@dhurta.org.',
    '',
    '## Main',
    `- [Home — try the live face and body scan](${ORIGIN}/)`,
    `- [How it works: methods and limits](${ORIGIN}/about/)`,
    `- [Contact, API & integrations](${ORIGIN}/contact/)`,
    `- [Privacy policy](${ORIGIN}/privacy/)`,
    `- [Full guide content as text](${ORIGIN}/llms-full.txt)`,
    '',
    ...sect('Fighting skills', pick('skill')),
    ...sect('Exercises', pick('exercise')),
    ...sect('Yoga', [...pick('yogaHub'), ...pick('yogaFlow')]),
    ...sect('Posture', [...pick('postureHub'), ...pick('posture')]),
    ...sect('Face shapes', [...pick('faceHub'), ...pick('face')]),
    ...sect('Style & grooming', [...pick('guidesHub'), ...pick('guide')]),
    `## Food`,
    `- [${pick('foodHub')[0].title}](${ORIGIN}/food/): one page per dish with calories, protein, carbs and fat.`,
    '',
  ].join('\n'),
);
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), ssr.knowledge());

// ----------------------------------------------------------------- feed
const feedItems = routes.filter((r) => ['skill', 'exercise', 'guide', 'posture', 'face', 'yogaFlow'].includes(r.page.kind) && r.lang === 'en');
fs.writeFileSync(
  path.join(DIST, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>Personality guides</title>\n  <link>${ORIGIN}/guides/</link>\n  <atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml"/>\n  <description>Fighting skills, exercises, yoga, posture, face shapes and style guides from Personality.</description>\n  <language>en</language>\n${feedItems
    .map((r) => `  <item><title>${esc(r.title)}</title><link>${abs(r.path)}</link><guid>${abs(r.path)}</guid><description>${esc(r.description)}</description></item>`)
    .join('\n')}\n</channel>\n</rss>\n`,
);

// ------------------------------------------------------------- manifest
fs.writeFileSync(
  path.join(DIST, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Personality',
      short_name: 'Personality',
      description: 'Live face and body scanning, training, food, style and fighting skills — on your device.',
      start_url: '/',
      display: 'standalone',
      background_color: '#06070A',
      theme_color: '#06070A',
      icons: [
        { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    null,
    2,
  ),
);

// ------------------------------------------------------------- IndexNow
fs.writeFileSync(path.join(DIST, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
fs.writeFileSync(
  path.join(DIST, 'indexnow.json'),
  JSON.stringify({ host: 'personality.dhurta.org', key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: routes.map((r) => abs(r.path)) }),
);

console.log(`prerendered ${written} pages, ${groups.length} sitemaps`);
