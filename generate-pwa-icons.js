#!/usr/bin/env node
/**
 * Generate PWA icons from favicon.svg
 * Install: npm install sharp
 * Run: node generate-pwa-icons.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const apps = [
  { name: "maman-power-app", color: "#009739" },
  { name: "depot-dashboard", color: "#009739" },
];

async function generateIcons() {
  for (const app of apps) {
    const publicDir = path.join(__dirname, app.name, "public");

    console.log(`📦 Generating icons for ${app.name}...`);

    try {
      // Create SVG-based PNG icons with app name and color
      const svg192 = `
        <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="192" fill="${app.color}"/>
          <text x="96" y="96" font-size="80" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
            ${app.name === "maman-power-app" ? "👩" : "📦"}
          </text>
        </svg>
      `;

      const svg512 = svg192.replace("192", "512").replace("80", "210");

      // 192x192 icon
      await sharp(Buffer.from(svg192))
        .png()
        .toFile(path.join(publicDir, "pwa-192x192.png"));
      console.log("✅ Created pwa-192x192.png");

      // 512x512 icon
      await sharp(Buffer.from(svg512))
        .png()
        .toFile(path.join(publicDir, "pwa-512x512.png"));
      console.log("✅ Created pwa-512x512.png");
    } catch (error) {
      console.error(`❌ Error for ${app.name}:`, error.message);
    }
  }

  console.log("\n✅ PWA icons generated successfully!");
  console.log("Next: npm run build && netlify deploy --prod --dir=dist");
}

generateIcons();
