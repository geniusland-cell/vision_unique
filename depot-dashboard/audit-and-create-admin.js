
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDAv53Bv6a8iYVsZAWvljxUI2qlhp4n5W4",
  authDomain: "vision-unique.firebaseapp.com",
  projectId: "vision-unique",
  storageBucket: "vision-unique.firebasestorage.app",
  messagingSenderId: "134892705629",
  appId: "1:134892705629:web:fc3302d6b6a7b2d84f3ab4",
  databaseURL:
    "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function run() {
  try {
    console.log("═══════════════════════════════════════════════════════════");
    console.log(" AUDIT FIREBASE - LISTER TOUS LES UTILISATEURS");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    // 1. Lire tous les utilisateurs
    const usersRef = ref(db, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      console.log(" Aucun utilisateur trouvé!\n");
      process.exit(0);
    }

    const allUsersData = usersSnapshot.val();
    const users = Object.keys(allUsersData).map((key) => ({
      uid: key,
      ...allUsersData[key],
    }));

    console.log(` Total: ${users.length} utilisateurs trouvés\n`);
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );

    // Grouper par rôle
    const managers = users.filter((u) => u.role === "manager");
    const vendors = users.filter((u) => u.role === "vendor");
    const admins = users.filter((u) => u.role === "admin");

    // Afficher les MANAGERS
    if (managers.length > 0) {
      console.log(` MANAGERS (${managers.length}):\n`);
      managers.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name}`);
        console.log(`   Téléphone: ${m.phone}`);
        console.log(`   Email: ${m.email}`);
        console.log(`   Statut: ${m.is_active ? "ACTIF" : "INACTIF"}`);
        console.log(
          `   Créé: ${new Date(m.created_at).toLocaleDateString()}`,
        );
        console.log("");
      });
    } else {
      console.log(" Aucun manager trouvé\n");
    }

    // Afficher les VENDORS
    if (vendors.length > 0) {
      console.log(` VENDORS/VENDEUSES (${vendors.length}):\n`);
      vendors.forEach((v, i) => {
        console.log(`${i + 1}. ${v.name}`);
        console.log(`   Téléphone: ${v.phone}`);
        console.log(`   Email: ${v.email}`);
        console.log(`   Statut: ${v.is_active ? "ACTIF" : "INACTIF"}`);
        console.log(`   Créé: ${new Date(v.created_at).toLocaleDateString()}`);
        console.log("");
      });
    } else {
      console.log(" Aucun vendor trouvé\n");
    }

    // Afficher les ADMINS
    if (admins.length > 0) {
      console.log(` ADMINS (${admins.length}):\n`);
      admins.forEach((a, i) => {
        console.log(`${i + 1}. ${a.name}`);
        console.log(`   Email: ${a.email}`);
        console.log(`   Statut: ${a.is_active ? "ACTIF" : "INACTIF"}`);
        console.log("");
      });
    } else {
      console.log(" Aucun admin trouvé\n");
    }

    // Afficher les DÉPÔTS
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );
    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (depotsSnapshot.exists()) {
      const allDepotsData = depotsSnapshot.val();
      const depots = Object.keys(allDepotsData).map((key) => ({
        id: key,
        ...allDepotsData[key],
      }));

      console.log(` DÉPÔTS (${depots.length}):\n`);
      depots.forEach((d, i) => {
        const manager = users.find((u) => u.uid === d.managed_by);
        console.log(`${i + 1}. ${d.name}`);
        console.log(`   Location: ${d.location}`);
        console.log(`   Manager: ${manager ? manager.name : "N/A"}`);
        console.log(`   Tél direct: ${d.phone_direct || "N/A"}`);
        console.log(`   WhatsApp: ${d.phone_whatsapp || "N/A"}`);
        console.log(`   Statut: ${d.is_active ? "ACTIF" : "INACTIF"}`);
        console.log("");
      });
    }

    // Créer un compte ADMIN si aucun n'existe
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );
    if (admins.length === 0) {
      console.log("⚠️  AUCUN ADMIN TROUVÉ! Création d'un compte admin...\n");

      const adminUid = `admin_${Date.now()}`;
      const adminPhone = "+242099999999";
      const adminEmail = `admin${adminPhone.replace(/[^\d]/g, "")}@maman-power.app`;

      const adminRef = ref(db, `users/${adminUid}`);
      await set(adminRef, {
        id: adminUid,
        name: "Admin Manager",
        email: adminEmail,
        phone: adminPhone,
        role: "admin",
        is_active: true,
        subscription_status: "premium",
        priority_level: 99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(" COMPTE ADMIN CRÉÉ!\n");
      console.log(" IDENTIFIANTS ADMIN:");
      console.log(`   Téléphone: ${adminPhone}`);
      console.log(`   Mot de passe: admin123`);
      console.log(`   Email: ${adminEmail}\n`);
    }

    // Résumé en tableau
    console.log("═══════════════════════════════════════════════════════════");
    console.log(" RÉSUMÉ POUR LA DÉMO:\n");

    console.log(" MANAGERS À TESTER:");
    managers.slice(0, 3).forEach((m) => {
      console.log(`   ${m.phone} / test123456 → ${m.name}`);
    });

    console.log("\n VENDORS À TESTER:");
    vendors.slice(0, 3).forEach((v) => {
      console.log(`   ${v.phone} / test123456 → ${v.name}`);
    });

    if (admins.length > 0) {
      console.log("\n ADMIN:");
      admins.forEach((a) => {
        console.log(`   ${a.phone || a.email} / admin123 → ${a.name}`);
      });
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════\n",
    );
  } catch (error) {
    console.error(" Erreur:", error.message);
  }

  process.exit(0);
}

run();
