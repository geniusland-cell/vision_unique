import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, ".env");
const envContent = `# Configuration Cloudinary pour l'upload d'images (Unsigned Upload - Sécurisé)
VITE_CLOUDINARY_CLOUD_NAME=dmbbpm6fj
VITE_CLOUDINARY_UPLOAD_PRESET=votre_upload_preset
`;

fs.writeFileSync(envPath, envContent);
console.log("✅ Fichier .env créé avec succès");
console.log(
  "⚠️ IMPORTANT: Vous devez créer un upload preset unsigned dans Cloudinary:",
);
console.log("1. Allez sur https://console.cloudinary.com/");
console.log("2. Settings > Upload > Upload presets");
console.log('3. Cliquez "Add upload preset"');
console.log("4. Nommez-le (ex: depot_images_preset)");
console.log("5. Mode: Unsigned");
console.log('6. Cochez "Auto-format" et "Auto-quality"');
console.log("7. Sauvegardez et copiez le nom du preset");
console.log(
  '8. Remplacez "votre_upload_preset" dans .env par le nom du preset',
);
