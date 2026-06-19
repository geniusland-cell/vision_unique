#!/usr/bin/env node
/**
 * Script pour initialiser le système de votes dans Firebase
 * Utilise firebase-admin pour créer directement la structure
 */

const admin = require("firebase-admin");
const path = require("path");

// Service account credentials (à remplir manuellement depuis Firebase Console)
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.database();

async function initializeVotes() {
  try {
    console.log("🚀 Initialisation du système de votes...\n");

    const quarter = "2026-Q2";
    const startDate = new Date(2026, 3, 1); // 1er avril 2026
    const endDate = new Date(2026, 5, 30); // 30 juin 2026

    // Créer la structure des votes pour le trimestre
    const votesRef = db.ref(`votes/${quarter}`);

    await votesRef.set({
      metadata: {
        active: true,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        daysLeft: Math.ceil(
          (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
    });

    console.log(`✅ Métadonnées du trimestre créées:`);
    console.log(`   - Quarter: ${quarter}`);
    console.log(`   - Start Date: ${startDate.toISOString().split("T")[0]}`);
    console.log(`   - End Date: ${endDate.toISOString().split("T")[0]}`);
    console.log(`   - Status: ACTIVE\n`);

    // Créer les entries pour les dépôts existants avec vote_count = 0
    const depotsRef = db.ref("depots");
    const depotsSnapshot = await depotsRef.get();

    if (depotsSnapshot.exists()) {
      const depots = depotsSnapshot.val();
      const depotIds = Object.keys(depots);

      console.log(
        `📊 Initialisation des votes pour ${depotIds.length} dépôts:\n`,
      );

      for (const depotId of depotIds) {
        const depotName = depots[depotId].name || depotId;
        await votesRef.child(depotId).set({
          vote_count: 0,
          voted_by: [],
          last_updated: new Date().toISOString(),
        });
        console.log(`   ✓ ${depotName}`);
      }
    }

    console.log(`\n🎉 Système de votes initialisé avec succès!\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    process.exit(1);
  }
}

initializeVotes();
