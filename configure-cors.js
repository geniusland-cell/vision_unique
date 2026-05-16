// Configure CORS for Firebase Storage
// Run: node configure-cors.js

const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
const serviceAccountPath = "./depot-dashboard/firebase-service-account.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Fichier not found:", serviceAccountPath);
  console.error(
    "Tu dois avoir firebase-service-account.json dans depot-dashboard/",
  );
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "vision-unique.appspot.com",
});

const bucket = admin.storage().bucket();

// CORS configuration
const corsConfig = [
  {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    method: ["GET", "HEAD", "DELETE", "PUT", "POST"],
    responseHeader: ["Content-Type", "x-goog-meta-uploaded-by"],
    maxAgeSeconds: 3600,
  },
];

bucket
  .setCorsConfiguration(corsConfig)
  .then(() => {
    console.log("✅ CORS configured successfully!");
    console.log("Allowed origins:", corsConfig[0].origin);
    console.log(
      "\nVous pouvez maintenant uploader des images depuis localhost!",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error configuring CORS:", error);
    process.exit(1);
  });
