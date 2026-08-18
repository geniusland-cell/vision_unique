// Configure CORS for Firebase Storage using gsutil
// Alternative: Use Firebase Console manually

console.log(
  "⚠️ Pour configurer CORS sur Firebase Storage, vous avez deux options:",
);
console.log("");
console.log("OPTION 1: Via Firebase Console (recommandé)");
console.log("1. Allez sur https://console.firebase.google.com/");
console.log("2. Sélectionnez le projet 'vision-unique'");
console.log("3. Allez dans Storage > Files");
console.log("4. Cliquez sur l'icône ⚙️ (Paramètres)");
console.log("5. Cliquez sur l'onglet 'Règles' ou 'CORS'");
console.log("6. Ajoutez cette configuration CORS:");
console.log("");
console.log(
  JSON.stringify(
    [
      {
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
        ],
        method: ["GET", "HEAD", "DELETE", "PUT", "POST"],
        responseHeader: ["Content-Type", "Authorization"],
        maxAgeSeconds: 3600,
      },
    ],
    null,
    2,
  ),
);
console.log("");
console.log("OPTION 2: Via gsutil (nécessite Google Cloud SDK)");
console.log(
  "1. Installez Google Cloud SDK: https://cloud.google.com/sdk/docs/install",
);
console.log("2. Authentifiez: gcloud auth login");
console.log(
  "3. Configurez CORS: gsutil cors set cors.json gs://vision-unique.firebasestorage.app",
);
console.log("");
console.log(
  "Après configuration, redémarrez votre application pour tester l'upload.",
);
