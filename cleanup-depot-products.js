import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDAv53Bv6a8iYVsZAWvljxUI2qlhp4n5W4",
  authDomain: "vision-unique.firebaseapp.com",
  projectId: "vision-unique",
  storageBucket: "vision-unique.firebasestorage.app",
  messagingSenderId: "134892705629",
  appId: "1:134892705629:web:fc3302d6b6a7b2d84f3ab4",
  measurementId: "G-FY1VC8TTD0",
  databaseURL:
    "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ALLOWED_PRODUCT_NAMES = new Set(["Carpe", "Riz"]);

async function cleanupDepotProducts(depotId) {
  const productsRef = ref(db, `depots/${depotId}/products`);
  const snapshot = await get(productsRef);

  if (!snapshot.exists()) {
    console.log(`Aucun produit trouvé pour le dépôt ${depotId}.`);
    return;
  }

  const products = snapshot.val();
  const productKeys = Object.keys(products);
  const toDelete = productKeys.filter(
    (key) => !ALLOWED_PRODUCT_NAMES.has(products[key]?.name),
  );

  if (toDelete.length === 0) {
    console.log(`Aucun produit en trop trouvé pour le dépôt ${depotId}.`);
    return;
  }

  console.log(
    `Suppression de ${toDelete.length} produit(s) en trop pour le dépôt ${depotId}...`,
  );

  for (const productKey of toDelete) {
    const productRef = ref(db, `depots/${depotId}/products/${productKey}`);
    const productName = products[productKey]?.name || productKey;
    await set(productRef, null);
    console.log(`  • Supprimé: ${productName}`);
  }

  console.log(`Nettoyage terminé pour le dépôt ${depotId}.`);
}

const depotId = process.argv[2];
if (!depotId) {
  console.error("Usage: node cleanup-depot-products.js <depotId>");
  process.exit(1);
}

cleanupDepotProducts(depotId).catch((err) => {
  console.error("Erreur pendant le nettoyage :", err);
  process.exit(1);
});
