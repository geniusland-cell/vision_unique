// Script pour afficher la structure complète de Firebase Realtime Database

const databaseURL =
  "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app";

async function exploreFirebase() {
  try {
    console.log("🔍 Exploration de la structure Firebase...\n");

    // Récupérer toutes les données racine
    const rootResponse = await fetch(`${databaseURL}/.json?shallow=true`);
    const rootData = await rootResponse.json();

    console.log("📦 Nodes disponibles au niveau racine:");
    console.log(JSON.stringify(Object.keys(rootData), null, 2));
    console.log("\n");

    // Récupérer les détails de chaque node
    for (const node of Object.keys(rootData)) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Contenu de /${node}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        const nodeResponse = await fetch(
          `${databaseURL}/${node}.json?limitToFirst=10`,
        );
        const nodeData = await nodeResponse.json();

        if (nodeData === null) {
          console.log(`  (vide)`);
        } else if (typeof nodeData === "object") {
          const keys = Object.keys(nodeData);
          console.log(`  ✅ ${keys.length} éléments trouvés`);
          if (keys.length > 0) {
            console.log(`  Premiers éléments:`);
            keys.slice(0, 3).forEach((key) => {
              console.log(`    - ${key}`);
              if (typeof nodeData[key] === "object") {
                const subKeys = Object.keys(nodeData[key]).slice(0, 3);
                console.log(
                  `      ${subKeys.join(", ")}${subKeys.length > 3 ? "..." : ""}`,
                );
              }
            });
          }
        }
      } catch (err) {
        console.log(`  ❌ Erreur: ${err.message}`);
      }
    }

    console.log("\n" + "━".repeat(50) + "\n");

    // Afficher les utilisateurs spécifiquement
    console.log("\n👥 CHERCHER UTILISATEURS:");
    console.log("━".repeat(50));

    try {
      const usersResponse = await fetch(`${databaseURL}/users.json`);
      const usersData = await usersResponse.json();

      if (usersData) {
        Object.keys(usersData).forEach((uid) => {
          const user = usersData[uid];
          console.log(`\n  👤 ${user.name || "Sans nom"}`);
          console.log(`     Email: ${user.email || "N/A"}`);
          console.log(`     Phone: ${user.phone || "N/A"}`);
          console.log(`     Role: ${user.role || "N/A"}`);
        });
      } else {
        console.log("  ℹ️ Pas de nœud /users");
      }
    } catch (err) {
      console.log(`  ❌ Erreur lecture /users: ${err.message}`);
    }

    // Afficher les dépôts
    console.log("\n\n🏪 CHERCHER DÉPÔTS:");
    console.log("━".repeat(50));

    try {
      const depotsResponse = await fetch(`${databaseURL}/depots.json`);
      const depotsData = await depotsResponse.json();

      if (depotsData) {
        Object.keys(depotsData).forEach((depotId) => {
          const depot = depotsData[depotId];
          if (depot && depot.name) {
            console.log(`\n  🏢 ${depot.name}`);
            console.log(`     Location: ${depot.location || "N/A"}`);
            console.log(`     Téléphone: ${depot.phone_direct || "N/A"}`);
          }
        });
      } else {
        console.log("  ℹ️ Pas de nœud /depots");
      }
    } catch (err) {
      console.log(`  ❌ Erreur lecture /depots: ${err.message}`);
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }

  process.exit(0);
}

exploreFirebase();
