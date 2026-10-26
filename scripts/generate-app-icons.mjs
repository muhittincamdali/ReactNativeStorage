#!/usr/bin/env node
// Draws the StorageDemo app icons (three stacked storage drawers in the repository blues) as SVG
// and renders them to PNG with headless Chrome, so the example ships no third-party artwork.
//
// Usage: node scripts/generate-app-icons.mjs   (CHROME_PATH overrides the browser location)
// Output: Examples/StorageDemo/assets/*.png
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'Examples/StorageDemo/assets');
const work = join(root, '_work/icons');

const BLUE = '#0071E3';
const NAVY = '#003A85';
const SKY = '#64D2FF';
const WHITE = '#FFFFFF';

/** Three drawers with handles, centred in a 1024 box and scaled to `scale` of it. */
function drawers(fill, handle, scale) {
  const width = 560 * scale;
  const height = 150 * scale;
  const gap = 40 * scale;
  const x = (1024 - width) / 2;
  const top = (1024 - (3 * height + 2 * gap)) / 2;
  return [0, 1, 2]
    .map((row) => {
      const y = top + row * (height + gap);
      const handleWidth = 140 * scale;
      return [
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${36 * scale}" fill="${fill}"/>`,
        `<rect x="${(1024 - handleWidth) / 2}" y="${y + height / 2 - 14 * scale}" width="${handleWidth}" height="${28 * scale}" rx="${14 * scale}" fill="${handle}"/>`,
      ].join('');
    })
    .join('');
}

const svg = (body, background = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background}${body}</svg>`;

const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="${NAVY}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/>`;

/** File name → [SVG, size rendered in Chrome, size after scaling (macOS sips)]. */
const icons = {
  'icon.png': [svg(drawers(WHITE, SKY, 1), gradient), 1024],
  'splash-icon.png': [svg(drawers(BLUE, SKY, 1)), 1024],
  'favicon.png': [svg(drawers(WHITE, SKY, 1.25), gradient), 1024, 48],
  'android-icon-background.png': [
    svg('', `<rect width="1024" height="1024" fill="${BLUE}"/>`),
    1024,
  ],
  'android-icon-foreground.png': [svg(drawers(WHITE, SKY, 0.62)), 1024],
  'android-icon-monochrome.png': [svg(drawers(WHITE, '#000000', 0.62)), 1024],
};

function chrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error('No Chrome found; set CHROME_PATH.');
  return found;
}

mkdirSync(work, { recursive: true });
const profile = mkdtempSync(join(work, 'profile-'));
try {
  for (const [file, [source, size, scaledTo]] of Object.entries(icons)) {
    const html = join(work, `${file}.html`);
    writeFileSync(
      html,
      `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
    );
    execFileSync(
      chrome(),
      [
        '--headless=new',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--hide-scrollbars',
        `--user-data-dir=${profile}`,
        '--default-background-color=00000000',
        '--force-device-scale-factor=1',
        `--window-size=${size},${size}`,
        `--screenshot=${join(assets, file)}`,
        `file://${html}`,
      ],
      { stdio: 'ignore', timeout: 60000 },
    );
    // Chrome cannot open a window smaller than about 500 px; small icons are scaled down after.
    if (scaledTo)
      execFileSync('sips', ['-z', String(scaledTo), String(scaledTo), join(assets, file)], {
        stdio: 'ignore',
      });
    console.log(`Examples/StorageDemo/assets/${file}`);
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}
