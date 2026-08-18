import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('🔍 Vérification de la configuration Cloudinary...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ Fichier .env non trouvé');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let cloudName = '';
let uploadPreset = '';

for (const line of lines) {
  if (line.startsWith('VITE_CLOUDINARY_CLOUD_NAME=')) {
    cloudName = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_CLOUDINARY_UPLOAD_PRESET=')) {
    uploadPreset = line.split('=')[1].trim();
  }
}

console.log('Configuration actuelle:');
console.log('Cloud Name:', cloudName || '❌ Non défini');
console.log('Upload Preset:', uploadPreset || '❌ Non défini');
console.log();

if (!uploadPreset || uploadPreset === 'votre_upload_preset') {
  console.log('⚠️ PROBLÈME: Upload preset non configuré');
  console.log();
  console.log('📋 ÉTAPES POUR CRÉER LE PRESET:');
  console.log('1. Allez sur https://console.cloudinary.com/');
  console.log('2. Connectez-vous avec votre compte');
  console.log('3. Allez dans Settings > Upload > Upload presets');
  console.log('4. Cliquez sur "Add upload preset"');
  console.log('5. Configurez:');
  console.log('   - Name: depot_images_preset');
  console.log('   - Mode: Unsigned');
  console.log('   - Signing mode: Don\'t sign');
  console.log('   - Cochez "Auto format" et "Auto quality"');
  console.log('6. Cliquez sur "Save"');
  console.log('7. Copiez le nom du preset (ex: depot_images_preset)');
  console.log();
  console.log('📝 Ensuite, modifiez le fichier .env et remplacez:');
  console.log('   VITE_CLOUDINARY_UPLOAD_PRESET=votre_upload_preset');
  console.log('   par:');
  console.log('   VITE_CLOUDINARY_UPLOAD_PRESET=depot_images_preset');
  console.log();
  console.log('🔄 Redémarrez ensuite votre application: npm run dev');
} else {
  console.log('✅ Configuration semble correcte');
  console.log('⚠️ Si l\'erreur persiste, vérifiez que le preset existe dans Cloudinary');
  console.log('   et qu\'il est bien en mode "Unsigned".');
}
