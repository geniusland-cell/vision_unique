import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

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

async function getAllUsers() {
  try {
    console.log(
      " Récupération de tous les utilisateurs depuis Firebase...\n",
    );

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log(" Aucun utilisateur trouvé");
      process.exit(0);
    }

    const allUsers = snapshot.val();
    const users = Object.keys(allUsers).map((key) => ({
      id: key,
      ...allUsers[key],
    }));

    console.log(` Total: ${users.length} utilisateurs trouvés\n`);
    console.log("━".repeat(80));

    // Grouper par rôle
    const managers = users.filter((u) => u.role === "manager");
    const vendors = users.filter((u) => u.role === "vendor");
    const admins = users.filter((u) => u.role === "admin");

    if (managers.length > 0) {
      console.log(`\n MANAGERS (${managers.length}):`);
      console.log("━".repeat(80));
      managers.forEach((m) => {
        console.log(`\n ${m.name}`);
        console.log(`   Téléphone: ${m.phone || "N/A"}`);
        console.log(`   Email: ${m.email || "N/A"}`);
        console.log(`   Statut: ${m.is_active ? " Actif" : " Inactif"}`);
        console.log(`   Créé: ${new Date(m.created_at).toLocaleDateString()}`);
      });
    }

    if (vendors.length > 0) {
      console.log(`\n\n🛍️ VENDORS/VENDEUSES (${vendors.length}):`);
      console.log("━".repeat(80));
      vendors.forEach((v) => {
        console.log(`\n👤 ${v.name}`);
        console.log(`   Téléphone: ${v.phone || "N/A"}`);
        console.log(`   Email: ${v.email || "N/A"}`);
        console.log(`   Statut: ${v.is_active ? " Actif" : " Inactif"}`);
        console.log(`   Créé: ${new Date(v.created_at).toLocaleDateString()}`);
      });
    }

    if (admins.length > 0) {
      console.log(`\n\n ADMINS (${admins.length}):`);
      console.log("━".repeat(80));
      admins.forEach((a) => {
        console.log(`\n ${a.name}`);
        console.log(`   Email: ${a.email || "N/A"}`);
        console.log(`   Statut: ${a.is_active ? " Actif" : " Inactif"}`);
      });
    }

    // Résumé en tableau
    console.log("\n\n RÉSUMÉ EN TABLEAU:");
    console.log("━".repeat(80));
    console.log("\nMANAGERS:");
    if (managers.length > 0) {
      managers.forEach((m) => {
        console.log(`  ${m.phone} / test123456 (${m.name})`);
      });
    } else {
      console.log("  Aucun manager trouvé");
    }

    console.log("\nVENDORS:");
    if (vendors.length > 0) {
      vendors.forEach((v) => {
        console.log(`  ${v.phone} / test123456 (${v.name})`);
      });
    } else {
      console.log("  Aucun vendor trouvé");
    }

    // Récupérer aussi les dépôts
    console.log("\n\n🏪 DÉPÔTS:");
    console.log("━".repeat(80));
    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (depotsSnapshot.exists()) {
      const allDepots = depotsSnapshot.val();
      const depots = Object.keys(allDepots).map((key) => ({
        id: key,
        ...allDepots[key],
      }));

      depots.forEach((d) => {
        const manager = users.find((u) => u.id === d.managed_by);
        console.log(`\n🏢 ${d.name}`);
        console.log(`   Location: ${d.location}`);
        console.log(`   Manager: ${manager ? manager.name : "N/A"}`);
        console.log(`   Téléphone direct: ${d.phone_direct || "N/A"}`);
        console.log(`   WhatsApp: ${d.phone_whatsapp || "N/A"}`);
        console.log(`   Statut: ${d.is_active ? "✅ Actif" : "❌ Inactif"}`);
      });
    }

    console.log("\n" + "━".repeat(80) + "\n");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }

  process.exit(0);
}

getAllUsers();
