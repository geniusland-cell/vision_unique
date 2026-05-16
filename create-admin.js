// Exécute avec: node create-admin.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDAv53Bv6a8iYVsZAWvljxUI2qlhp4n5W4",
  authDomain: "vision-unique.firebaseapp.com",
  projectId: "vision-unique",
  storageBucket: "vision-unique.firebasestorage.app",
  messagingSenderId: "134892705629",
  appId: "1:134892705629:web:fc3302d6b6a7b2d84f3ab4",
  measurementId: "G-FY1VC8TTD0",
  databaseURL: "https://vision-unique-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const createAdmin = async () => {
  try {
    const name = "Genius Mampouya";
    const email = "mampouyaraphael04@gmail.com";
    const phone = "+242 06 767 81 28";
    const password = "242N64007";
    const reference = "242N64007";

    console.log("👨‍💼 Création du compte ADMIN...");
    console.log("Nom:", name);
    console.log("Email:", email);
    console.log("Téléphone:", phone);

    // 1. Créer l'utilisateur dans Firebase Auth
    const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);
    console.log(" Compte créé dans Firebase Auth. UID:", authUser.uid);

    // 2. Créer le profil admin dans Realtime Database
    const userRef = ref(db, `users/${authUser.uid}`);
    await set(userRef, {
      id: authUser.uid,
      name: name,
      email: email,
      phone: phone,
      role: "admin",
      reference: reference,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log("✅ Profil admin créé dans Realtime Database");
    console.log("✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS!");
    console.log("\n Identifiants de connexion:");
    console.log("Email:", email);
    console.log("Mot de passe:", password);
    console.log("Référence:", reference);
    console.log("\nTu peux maintenant te connecter à: http://localhost:5173/");

    process.exit(0);
  } catch (error) {
    console.error(" Erreur:", error.message);
    process.exit(1);
  }
};

createAdmin();
