#!/usr/bin/env node

/**
 * PWA Icon Generator
 *
 * Generates PNG icons from SVG for PWA manifest.
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icons.cjs
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Installing...');
  console.log('Run: npm install sharp --save-dev');
  console.log('Then run this script again.');
  process.exit(1);
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="102" fill="#0a0a0f"/>
  <!-- Inner glow border -->
  <rect x="16" y="16" width="480" height="480" rx="86" fill="none" stroke="url(#grad)" stroke-width="3" opacity="0.3"/>
  <!-- Flexed arm emoji-style icon -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Arm -->
    <path d="M-80 40 Q-60 -40 0 -80 Q40 -100 80 -60 Q100 -20 80 40 Q60 80 20 100 Q-20 110 -60 80 Q-90 60 -80 40Z"
          fill="url(#grad)"/>
    <!-- Bicep highlight -->
    <ellipse cx="20" cy="-20" rx="35" ry="25" fill="white" opacity="0.2"/>
    <!-- Fist -->
    <circle cx="90" cy="-50" r="30" fill="url(#grad)"/>
    <circle cx="90" cy="-50" r="25" fill="#0a0a0f" opacity="0.3"/>
  </g>
  <!-- XP sparkles -->
  <g fill="#00f5d4" opacity="0.8">
    <polygon points="120,100 125,115 140,115 128,125 133,140 120,130 107,140 112,125 100,115 115,115" />
    <polygon points="380,380 383,390 393,390 385,397 388,407 380,400 372,407 375,397 367,390 377,390" transform="scale(0.8) translate(80,80)"/>
    <polygon points="400,120 403,130 413,130 405,137 408,147 400,140 392,147 395,137 387,130 397,130" transform="scale(0.6) translate(200,-50)"/>
  </g>
  <!-- Level up arrow -->
  <g transform="translate(400, 400)" fill="url(#grad)" opacity="0.6">
    <polygon points="0,-30 20,10 10,10 10,30 -10,30 -10,10 -20,10"/>
  </g>
</svg>`;

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating PWA icons...\n');

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);

    await sharp(Buffer.from(ICON_SVG))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Also save the source SVG for reference
  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, ICON_SVG);
  console.log(`  ✓ icon.svg (source)`);

  console.log('\n✅ All icons generated in /public/');
}

generateIcons().catch(console.error);
