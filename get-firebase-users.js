// Script pour récupérer les utilisateurs via l'API REST Firebase
// Pas de permission issues avec l'API REST

const databaseURL =
  "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app";

async function getAllUsers() {
  try {
    console.log(
      "🔍 Récupération de tous les utilisateurs depuis Firebase (REST API)...\n",
    );

    // Récupérer tous les utilisateurs
    const usersResponse = await fetch(`${databaseURL}/users.json`);
    const allUsers = await usersResponse.json();

    if (!allUsers) {
      console.log("❌ Aucun utilisateur trouvé");
      process.exit(0);
    }

    const users = Object.keys(allUsers).map((key) => ({
      id: key,
      ...allUsers[key],
    }));

    console.log(`✅ Total: ${users.length} utilisateurs trouvés\n`);
    console.log("━".repeat(80));

    // Grouper par rôle
    const managers = users.filter((u) => u.role === "manager");
    const vendors = users.filter((u) => u.role === "vendor");
    const admins = users.filter((u) => u.role === "admin");

    if (managers.length > 0) {
      console.log(`\n📊 MANAGERS (${managers.length}):`);
      console.log("━".repeat(80));
      managers.forEach((m) => {
        console.log(`\n👤 ${m.name}`);
        console.log(`   Téléphone: ${m.phone || "N/A"}`);
        console.log(`   Email: ${m.email || "N/A"}`);
        console.log(`   Statut: ${m.is_active ? "✅ Actif" : "❌ Inactif"}`);
        if (m.created_at) {
          console.log(
            `   Créé: ${new Date(m.created_at).toLocaleDateString()}`,
          );
        }
      });
    }

    if (vendors.length > 0) {
      console.log(`\n\n VENDORS/VENDEUSES (${vendors.length}):`);
      console.log("━".repeat(80));
      vendors.forEach((v) => {
        console.log(`\n👤 ${v.name}`);
        console.log(`   Téléphone: ${v.phone || "N/A"}`);
        console.log(`   Email: ${v.email || "N/A"}`);
        console.log(`   Statut: ${v.is_active ? "✅ Actif" : "❌ Inactif"}`);
        if (v.created_at) {
          console.log(
            `   Créé: ${new Date(v.created_at).toLocaleDateString()}`,
          );
        }
      });
    }

    if (admins.length > 0) {
      console.log(`\n\n🔐 ADMINS (${admins.length}):`);
      console.log("━".repeat(80));
      admins.forEach((a) => {
        console.log(`\n👤 ${a.name}`);
        console.log(`   Email: ${a.email || "N/A"}`);
        console.log(`   Statut: ${a.is_active ? "✅ Actif" : "❌ Inactif"}`);
      });
    }

    // Résumé en tableau
    console.log("\n\n📋 RÉSUMÉ EN TABLEAU:");
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
    const depotsResponse = await fetch(`${databaseURL}/depots.json`);
    const allDepots = await depotsResponse.json();

    if (allDepots) {
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
