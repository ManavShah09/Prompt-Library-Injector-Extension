/**
 * generate-icons.mjs
 *
 * Resizes the source icon to 16x48x128px PNG files needed by Chrome.
 * Run once after generating the source icon:
 *   node generate-icons.mjs
 *
 * Requires: sharp  (npm install -D sharp)
 * Or: use any image editor to export icons/icon16.png, icon48.png, icon128.png
 *     from your source image.
 *
 * The extension ships placeholder icons that work fine for development.
 * Replace public/icons/icon128.png with your final asset before publishing.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Simple 1x1 dark-violet PNG as placeholder (base64 encoded)
// Replace with actual icons for production
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAABGUlEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg==';

const __dir = dirname(fileURLToPath(import.meta.url));
const iconDir = join(__dir, 'public', 'icons');

if (!existsSync(iconDir)) mkdirSync(iconDir, { recursive: true });

const buf = Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64');
['icon16.png', 'icon48.png', 'icon128.png'].forEach((name) => {
  const dest = join(iconDir, name);
  if (!existsSync(dest)) {
    writeFileSync(dest, buf);
    console.log(`Created placeholder: ${dest}`);
  }
});

console.log('\nDone. Replace public/icons/*.png with actual sized icons before publishing.');
