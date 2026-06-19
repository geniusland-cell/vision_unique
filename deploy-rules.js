// Script to deploy Firebase Realtime Database Rules
// Usage: node deploy-rules.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: "vision-unique",
  private_key_id: "e3c8d8f8f8f8f8f8f8f8f8f8f8f8f8f8",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4/4dNWnZvFM8tOb3/hg8p8BvMbYz8x6gNfX9qM5H3iWHUVYaJjD3k3\nx6gjMmvbg0dBRfKxJG7JZtG7/yL6M1h2a4XQWQ3wX3XU/pKXVVWyT2DH3tPh1PIA\nwFl7tpKqWGP7v2gK5y9IvT0mBxJh6bfL8gZXnQ4qPHvPq8LqQzC9H9V8H0mZjUG+\nTQ/5l5V8VfhHZKyT0pKlDzLWkbmBxJqLvCqLUHgYeHfqVuYHOwVzhcZN2qVq2jVq\nnIrE3zGvShWBz9eQJ1CPvMVe1lWxHnDN3Kq6nPp9rvVHZQWCPo6Yd0CrXQ0RfWOO\nQyD5mVZ3AgMBAAECggEAA\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-e3c8d@vision-unique.iam.gserviceaccount.com",
  client_id: "117897654321234567890",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-e3c8d%40vision-unique.iam.gserviceaccount.com",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
});

const rulesPath = path.join(__dirname, "firebase.rules.json");
const rulesContent = fs.readFileSync(rulesPath, "utf8");
const rules = JSON.parse(rulesContent);

async function deployRules() {
  try {
    console.log("🔐 Déploiement des règles Firebase RTD...");

    const db = admin.database();
    const rulesRef = db.ref(".json");

    // Note: Firebase Admin SDK ne déploie pas directement les règles
    // Il faut utiliser la CLI Firebase ou l'API REST Firebase Management
    // Affichons juste un message que les règles doivent être mises à jour manuellement

    console.log("✅ Règles lues avec succès:");
    console.log(JSON.stringify(rules, null, 2));
    console.log("\n⚠️  Pour déployer les règles, utilisez:");
    console.log("   firebase deploy --only database:rules");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

deployRules();
