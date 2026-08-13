import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, set, get, push, update } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import type { User, Depot, Category, FirebaseResponse } from "./types";
import { getCoordinatesForQuartier } from "./utils/quartierCoordinates";
import {
  calculateVotingEndDate,
  normalizeVotingDurationDays,
} from "./utils/voting.ts";

const isDevelopment = import.meta.env.DEV;

const safeLog = (message: string, ...args: unknown[]) => {
  if (isDevelopment) {
    console.log(message, ...args);
  }
};

const safeError = (message: string, ...args: unknown[]) => {
  if (isDevelopment) {
    console.error(message, ...args);
  }
};

// Configuration Firebase (IDENTIQUE)
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

function generateEmailFromPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/[^\d]/g, "");

  // If doesn't start with 242, prepend it
  if (!cleanPhone.startsWith("242")) {
    cleanPhone = "242" + cleanPhone;
  }

  return `manager${cleanPhone}@maman-power.app`;
}

export const registerUser = async (
  name: string,
  phone: string,
  password: string,
  phone_direct: string,
  phone_whatsapp: string,
  quartier: string,
  address: string = "", // Adresse du dépôt (nouveau)
  depot_name: string = "", // Nom personnalisé du dépôt (optionnel)
): Promise<FirebaseResponse<any>> => {
  try {
    // Validation
    if (
      !name ||
      !phone ||
      !password ||
      !phone_direct ||
      !phone_whatsapp ||
      !quartier
    ) {
      return {
        success: false,
        error: "Tous les champs sont requis",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Le mot de passe doit faire au moins 6 caractères",
      };
    }

    // Generate email from phone
    const userEmail = generateEmailFromPhone(phone);
    safeLog("📝 Inscription Manager pour", phone, "→", userEmail);

    // 1. Create Firebase Auth user
    const { user: authUser } = await createUserWithEmailAndPassword(
      auth,
      userEmail,
      password,
    );

    safeLog("✅ Compte Manager créé.");

    // 2. Create user profile in Realtime Database
    const userRef = ref(db, `users/${authUser.uid}`);
    await set(userRef, {
      id: authUser.uid,
      name: name,
      email: userEmail,
      phone: phone,
      role: "manager",
      is_active: true,
      subscription_status: "free",
      priority_level: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    safeLog("✅ Profil Manager créé dans Realtime DB");

    // 3. Auto-create unique depot for this manager
    const newDepotRef = push(ref(db, "depots"));
    // Utiliser le nom personnalisé s'il existe, sinon utiliser name + quartier
    const depotName = depot_name?.trim()
      ? depot_name
      : `Dépôt ${name.split(" ")[0]} - ${quartier}`;
    const coordinates = getCoordinatesForQuartier(quartier);

    await set(newDepotRef, {
      name: depotName,
      location: address || quartier,
      quartier: quartier,
      address: address, // Adresse du dépôt
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      phone_direct: phone_direct,
      phone_whatsapp: phone_whatsapp,
      managed_by: authUser.uid,
      manager_name: name,
      is_active: true,
      subscription_status: "active", // ← Nouveau
      subscription_expiry: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // ← Nouveau: +30 jours
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    safeLog("✅ Dépôt auto-créé.");

    // 4. Initialize depot with default products
    await initializeDepotProducts(newDepotRef.key);

    return {
      success: true,
      data: {
        id: authUser.uid,
        email: userEmail,
        name: name,
        phone: phone,
        phone_direct: phone_direct,
        phone_whatsapp: phone_whatsapp,
        role: "manager",
        is_active: true,
        depot_id: newDepotRef.key,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur d'inscription Manager:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// CONNEXION - Login with email + password (ADMIN)
// =====================================
export const loginByEmail = async (
  email: string,
  password: string,
): Promise<FirebaseResponse<User>> => {
  try {
    safeLog("📧 Tentative connexion ADMIN");

    // 1. Authenticate with Firebase
    const { user: authUser } = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    safeLog("✅ Authentification ADMIN réussie");

    // 2. Get user profile from Realtime Database
    const userRef = ref(db, `users/${authUser.uid}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      safeError("❌ Profil ADMIN non trouvé dans Realtime Database");
      return {
        success: false,
        error: "Profil utilisateur non trouvé dans la base de données",
      };
    }

    const userData = userSnap.val();

    // Verify admin role
    if (userData.role !== "admin") {
      safeError("❌ L'utilisateur n'est pas un administrateur");
      return { success: false, error: "Accès réservé aux administrateurs" };
    }

    safeLog("✅ Profil ADMIN chargé");

    return {
      success: true,
      data: userData,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur connexion ADMIN:", errorMsg);
    return { success: false, error: "Email ou mot de passe incorrect" };
  }
};

// =====================================
// CONNEXION - Detect and Login (EMAIL or PHONE)
// =====================================
export const detectAndLogin = async (
  identifier: string,
  password: string,
): Promise<FirebaseResponse<User>> => {
  // Check if it's an email (contains @)
  if (identifier.includes("@")) {
    safeLog("📧 Détecté: EMAIL → Tentative connexion ADMIN");
    return loginByEmail(identifier, password);
  } else {
    safeLog("📱 Détecté: TÉLÉPHONE → Tentative connexion MANAGER");
    return loginByPhone(identifier, password);
  }
};

export const loginByPhone = async (
  phone: string,
  password: string,
): Promise<FirebaseResponse<User>> => {
  try {
    safeLog("📱 Tentative connexion Manager");

    // 1. Generate email from phone
    const userEmail = generateEmailFromPhone(phone);

    // 2. Authenticate with Firebase
    const { user: authUser } = await signInWithEmailAndPassword(
      auth,
      userEmail,
      password,
    );

    safeLog("✅ Authentification Manager réussie");

    // 3. Get user profile from Realtime Database
    const userRef = ref(db, `users/${authUser.uid}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      safeError("❌ Profil Manager non trouvé");
      return { success: false, error: "Profil utilisateur non trouvé" };
    }

    const userData = userSnap.val();
    safeLog("✅ Profil Manager chargé");

    return {
      success: true,
      data: userData,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur connexion Manager:", errorMsg);
    return { success: false, error: "Numéro ou mot de passe incorrect" };
  }
};

// =====================================
// DÉCONNEXION
// =====================================
export const logoutUser = async (): Promise<FirebaseResponse<null>> => {
  try {
    await signOut(auth);
    safeLog("✅ Déconnexion Manager réussie");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur déconnexion:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET CURRENT USER
// =====================================
export const getCurrentUser = async (
  uid: string,
): Promise<FirebaseResponse<User>> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.val() };
    }
    return { success: false, error: "Utilisateur non trouvé" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur récupération Manager:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET DEPOTS FOR MANAGER
// =====================================
export const getManagerDepots = async (
  managerId: string,
): Promise<FirebaseResponse<Depot[]>> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const depotsData = snapshot.val();
    const depots = Object.keys(depotsData)
      .filter(
        (key) =>
          depotsData[key].managed_by === managerId &&
          depotsData[key].is_active !== false,
      )
      .map((key) => ({ id: key, ...depotsData[key] }))
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 1);

    return { success: true, data: depots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur récupération dépôts:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET CATEGORIES
// =====================================
export const getCategories = async (): Promise<
  FirebaseResponse<Category[]>
> => {
  try {
    const categoriesRef = ref(db, "categories");
    const snapshot = await get(categoriesRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const categoriesData = snapshot.val();
    const categories = Object.keys(categoriesData)
      .filter(
        (key) =>
          categoriesData[key].is_active === undefined ||
          categoriesData[key].is_active === true,
      )
      .map((key) => ({ id: key, ...categoriesData[key] }));

    return { success: true, data: categories };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError("❌ Erreur récupération catégories:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// creation de catégorie
// =====================================
export const createCategory = async (
  categoryData: any,
): Promise<FirebaseResponse<any>> => {
  try {
    const newCatRef = push(ref(db, "categories"));
    await set(newCatRef, {
      name: categoryData.name,
      description: categoryData.description || "",
      emoji: categoryData.emoji || "📦",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    safeLog(" Catégorie créée");
    return { success: true, data: { id: newCatRef.key, ...categoryData } };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur création catégorie:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// UPDATE MULTIPLE PRODUCTS
// =====================================
export const updateMultipleProducts = async (
  updates: any[],
): Promise<FirebaseResponse<{ id: string; success: boolean }[]>> => {
  try {
    const results: { id: string; success: boolean }[] = [];
    for (const update of updates) {
      const productRef = ref(
        db,
        `depots/${update.depotId}/products/${update.depotProductId}`,
      );
      await set(productRef, {
        stock_quantity: update.newQuantity,
        price: update.newPrice,
        updated_at: new Date().toISOString(),
      });
      results.push({ id: update.depotProductId, success: true });
    }
    safeLog(" Produits mis à jour");
    return { success: true, data: results };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur mise à jour produits:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// DELETE DEPOT PRODUCT
// =====================================
export const deleteDepotProduct = async (
  depotId: string,
  productId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const productRef = ref(db, `depots/${depotId}/products/${productId}`);
    await set(productRef, null); // Soft delete by setting to null
    safeLog(" Produit supprimé");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur suppression produit:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET QUARTIERS
// =====================================
export const getQuartiers = async (): Promise<FirebaseResponse<any[]>> => {
  try {
    const quartiersRef = ref(db, "quartiers");
    const snapshot = await get(quartiersRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const quartiersData = snapshot.val();
    const quartiers = Object.keys(quartiersData).map((key) => ({
      id: key,
      ...quartiersData[key],
    }));

    return { success: true, data: quartiers };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération quartiers:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const backfillDepotCoordinates = async (): Promise<void> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return;
    }

    const depotsData = snapshot.val();
    const updates: Record<string, Record<string, unknown>> = {};

    Object.entries(depotsData).forEach(([depotId, depot]: [string, any]) => {
      const hasCoordinates =
        typeof depot?.latitude === "number" &&
        typeof depot?.longitude === "number";

      if (hasCoordinates || !depot?.quartier) {
        return;
      }

      const coordinates = getCoordinatesForQuartier(depot.quartier);
      updates[depotId] = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db, "depots"), updates);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur backfill coordonnées dépôts:", errorMsg);
  }
};

// =====================================
// initialisation des quartiers (9 quartiers de Brazzaville)
// =====================================
export const initializeQuartiers = async (): Promise<
  FirebaseResponse<null>
> => {
  try {
    safeLog("📍 Création des quartiers...");

    const quartiers = [
      {
        name: "Bakongo",
        latitude: -4.2636,
        longitude: 15.2429,
        description: "1er arrondissement - Quartier historique",
      },
      {
        name: "Poto-Poto",
        latitude: -4.2726,
        longitude: 15.2663,
        description: "2ème arrondissement - Centre ville",
      },
      {
        name: "Moungali",
        latitude: -4.2514,
        longitude: 15.2721,
        description: "3ème arrondissement - Quartier résidentiel",
      },
      {
        name: "Ouenzé",
        latitude: -4.2857,
        longitude: 15.2514,
        description: "4ème arrondissement - Quartier populaire",
      },
      {
        name: "Talangaï",
        latitude: -4.2429,
        longitude: 15.2857,
        description: "5ème arrondissement - Grand quartier nord",
      },
      {
        name: "Mfilou",
        latitude: -4.26,
        longitude: 15.3,
        description: "6ème arrondissement - Zone nord-est",
      },
      {
        name: "Makélékélé",
        latitude: -4.29,
        longitude: 15.24,
        description: "7ème arrondissement - Quartier sud-ouest",
      },
      {
        name: "Djiri",
        latitude: -4.3,
        longitude: 15.2,
        description: "8ème arrondissement - Zone administrative",
      },
      {
        name: "Madibou",
        latitude: -4.32,
        longitude: 15.18,
        description: "9ème arrondissement - Zone rurale",
      },
    ];

    for (const q of quartiers) {
      const existingRef = ref(db, `quartiers`);
      const snapshot = await get(existingRef);
      if (snapshot.exists()) {
        const existing = Object.values(
          snapshot.val() as Record<string, any>,
        ).find((qua: any) => qua.name === q.name);
        if (existing) continue; // Skip if exists
      }

      const newQRef = push(ref(db, "quartiers"));
      await set(newQRef, {
        name: q.name,
        latitude: q.latitude,
        longitude: q.longitude,
        description: q.description,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }

    safeLog(" Quartiers créés");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur création quartiers:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// INITIALIZE DEPOTS FOR MANAGER
// =====================================
export const initializeDepots = async (
  managerId: string,
): Promise<FirebaseResponse<any>> => {
  try {
    safeLog(" Initialisation des dépôts pour manager");

    // Dépôt de Brazzaville avec numéros directs et WhatsApp
    const depots = [
      {
        name: "Dépôt Poto-Poto",
        location: "Poto-Poto, Brazzaville",
        quartier: "Poto-Poto",
        phone_direct: "+242061234567",
        phone_whatsapp: "+242061234567",
        description: "Dépôt principal zone nord",
      },
    ];

    const createdDepots = [];
    for (const depot of depots) {
      const newDepotRef = push(ref(db, "depots"));
      const coordinates = getCoordinatesForQuartier(depot.quartier);
      await set(newDepotRef, {
        name: depot.name,
        location: depot.location,
        quartier: depot.quartier,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        phone_direct: depot.phone_direct,
        phone_whatsapp: depot.phone_whatsapp,
        description: depot.description,
        managed_by: managerId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      createdDepots.push({ id: newDepotRef.key, ...depot });
      safeLog(" Dépôt créé");
    }

    return { success: true, data: createdDepots };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur initialisation dépôts:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// INITIALIZE DEPOT PRODUCTS
// =====================================
export const initializeDepotProducts = async (
  depotId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    // Produits par défaut : 2 seulement (1 par catégorie pour économiser)
    const products = [
      {
        name: "Carpe",
        category: "Poisson & Viande",
        price: 2500,
        stock_quantity: 10,
        unit: "kg",
      },
      {
        name: "Riz",
        category: "Epiceries/Vivre secs",
        price: 2500,
        stock_quantity: 20,
        unit: "sac",
      },
    ];

    const productsRef = ref(db, `depots/${depotId}/products`);
    for (const product of products) {
      const newProductRef = push(productsRef);
      await set(newProductRef, {
        name: product.name,
        category: product.category,
        price: product.price,
        stock_quantity: product.stock_quantity,
        unit: product.unit,
        created_at: new Date().toISOString(),
        is_active: true,
      });
    }

    safeLog(` ${products.length} produits initialisés pour le dépôt`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur initialisation produits:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET DEPOT PRODUCTS
// =====================================
export const getDepotProducts = async (
  depotId: string,
): Promise<FirebaseResponse<any[]>> => {
  try {
    const productsRef = ref(db, `depots/${depotId}/products`);
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }
    const products = Object.keys(snapshot.val()).map((key) => ({
      id: key,
      ...snapshot.val()[key],
    }));
    return { success: true, data: products };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération produits:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET DEPOT STATS
// =====================================
export const getDepotStats = async (
  depotId: string,
): Promise<FirebaseResponse<any>> => {
  try {
    const productsRef = ref(db, `depots/${depotId}/products`);
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) {
      return { success: true, data: { total: 0, value: 0, products: 0 } };
    }
    const products = Object.values(snapshot.val() as Record<string, any>);
    const stats = {
      total: products.reduce((sum, p: any) => sum + (p.stock_quantity || 0), 0),
      value: products.reduce(
        (sum, p: any) => sum + (p.stock_quantity || 0) * (p.price || 0),
        0,
      ),
      products: products.length,
    };
    return { success: true, data: stats };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur calcul stats:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// UPDATE DEPOT PRODUCT (prix et stock)
// =====================================
export const updateDepotProduct = async (
  depotId: string,
  productId: string,
  price: number,
  stockQuantity: number,
  image: string = "",
  unit: string = "",
): Promise<FirebaseResponse<null>> => {
  try {
    const productRef = ref(db, `depots/${depotId}/products/${productId}`);
    const updates: Record<string, any> = {
      price,
      stock_quantity: stockQuantity,
      last_updated: new Date().toISOString(),
    };
    if (image) {
      updates.image = image;
    }
    if (unit) {
      updates.unit = unit;
    }
    await update(productRef, updates);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur mise à jour produit:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// ADD PRODUCT TO DEPOT
// =====================================
export const addDepotProduct = async (
  depotId: string,
  productName: string,
  categoryName: string,
  price: number,
  stockQuantity: number,
  unit: string,
  image: string = "",
): Promise<FirebaseResponse<{ productId: string | null }>> => {
  try {
    const productsRef = ref(db, `depots/${depotId}/products`);
    const newProductRef = push(productsRef);

    await set(newProductRef, {
      name: productName,
      category: categoryName,
      price,
      stock_quantity: stockQuantity,
      unit,
      image: image || "",
      created_at: new Date().toISOString(),
      is_active: true,
    });

    return { success: true, data: { productId: newProductRef.key } };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur ajout produit:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// DELETE PRODUCT FROM DEPOT
// =====================================
export const removeDepotProduct = async (
  depotId: string,
  productId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const productRef = ref(db, `depots/${depotId}/products/${productId}`);
    await set(productRef, null);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur suppression produit:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const updateDepot = async (
  depotId: string,
  name: string,
  phone_direct: string,
  phone_whatsapp: string,
  promo_image_url?: string,
  promo_video_url?: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);

    const updates: any = {
      name: name,
      phone_direct: phone_direct,
      phone_whatsapp: phone_whatsapp,
      updated_at: new Date().toISOString(),
    };

    if (promo_image_url !== undefined) {
      updates.promo_image_url = promo_image_url;
    }

    if (promo_video_url !== undefined) {
      updates.promo_video_url = promo_video_url;
    }

    await update(depotRef, updates);

    safeLog(" Dépôt mis à jour");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur mise à jour dépôt:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET SINGLE DEPOT BY ID
// =====================================
export const getDepotById = async (
  depotId: string,
): Promise<FirebaseResponse<any>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    const snapshot = await get(depotRef);

    if (!snapshot.exists()) {
      return { success: false, error: "Dépôt non trouvé" };
    }

    return {
      success: true,
      data: {
        id: depotId,
        ...snapshot.val(),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération dépôt:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// GET ALL PRODUCTS (base products list)
// =====================================
export const getAllProducts = async () => {
  try {
    const productsRef = ref(db, "products");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const products = Object.keys(snapshot.val()).map((key) => ({
      id: key,
      ...snapshot.val()[key],
    }));

    return { success: true, data: products };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération produits:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// ADMIN FUNCTIONS
// =====================================

// Récupérer tous les managers
export const getAllManagers = async () => {
  try {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const allUsers = snapshot.val();
    const managers = Object.keys(allUsers)
      .filter((key) => allUsers[key].role === "manager")
      .map((key) => ({
        id: key,
        ...allUsers[key],
      }))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    safeLog(` Récupéré ${managers.length} managers`);
    return { success: true, data: managers };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération managers:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Récupérer les dépôts d'un manager avec produits
export const getManagerDetailsForAdmin = async (
  managerId: string,
): Promise<FirebaseResponse<any>> => {
  try {
    // 1. Récupérer les infos du manager
    const userRef = ref(db, `users/${managerId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return { success: false, error: "Manager non trouvé" };
    }

    const manager = userSnapshot.val();

    // 2. Récupérer ses dépôts
    const depotsRef = ref(db, "depots");
    const depotsSnapshot = await get(depotsRef);

    if (!depotsSnapshot.exists()) {
      return {
        success: true,
        data: { ...manager, id: managerId, depots: [] },
      };
    }

    const allDepots = depotsSnapshot.val();
    const managerDepots = Object.keys(allDepots)
      .filter((key) => allDepots[key].managed_by === managerId)
      .map((key) => ({ id: key, ...allDepots[key] }))
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);

    // 3. Pour chaque dépôt, récupérer les produits EN PARALLÈLE
    const depotsWithProducts = await Promise.all(
      managerDepots.map(async (depot) => {
        const productsRef = ref(db, `depots/${depot.id}/products`);
        const productsSnapshot = await get(productsRef);

        const products = productsSnapshot.exists()
          ? Object.keys(productsSnapshot.val()).map((key) => ({
              id: key,
              ...productsSnapshot.val()[key],
            }))
          : [];

        return {
          ...depot,
          products: products,
        };
      }),
    );

    return {
      success: true,
      data: {
        ...manager,
        id: managerId,
        depots: depotsWithProducts,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur récupération détails manager:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// UPLOAD PRODUCT IMAGE TO FIREBASE STORAGE
// =====================================
export const uploadProductImage = async (
  file: File,
): Promise<FirebaseResponse<any>> => {
  try {
    if (!file) {
      return { success: false, error: "Aucun fichier sélectionné" };
    }

    // Valider que c'est une image
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Le fichier doit être une image" };
    }

    // Limiter la taille à 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "L'image doit faire moins de 5MB" };
    }

    safeLog("📸 Upload image");

    // Créer un nom unique pour l'image
    const timestamp = Date.now();
    const imageName = `products/${timestamp}_${file.name}`;

    // Upload vers Firebase Storage
    const fileRef = storageRef(storage, imageName);
    const snapshot = await uploadBytes(fileRef, file);

    // Récupérer l'URL publique
    const downloadURL = await getDownloadURL(snapshot.ref);

    safeLog(" Image uploadée");
    return { success: true, data: { imageUrl: downloadURL } };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur upload image:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Bannir un manager
export const banManager = async (
  managerId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const userRef = ref(db, `users/${managerId}`);
    await update(userRef, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    safeLog(" Manager banni");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur bannissement manager:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Débannir un manager
export const unbanManager = async (
  managerId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const userRef = ref(db, `users/${managerId}`);
    await update(userRef, {
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    safeLog(" Manager débanni");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur débannissement manager:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Bannir un dépôt
export const banDepot = async (
  depotId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      is_active: false,
      subscription_status: "inactive",
      payment_pending: false,
      payment_amount: null,
      requested_tier: null,
      payment_notified_at: null,
      updated_at: new Date().toISOString(),
    });

    safeLog(" Dépôt banni");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur bannissement dépôt:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// Débannir un dépôt
export const unbanDepot = async (
  depotId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      is_active: true,
      subscription_status: "active",
      payment_pending: false,
      payment_amount: null,
      requested_tier: null,
      payment_notified_at: null,
      updated_at: new Date().toISOString(),
    });

    safeLog(" Dépôt débanni");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur débannissement dépôt:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// CRÉER COMPTE ADMIN
// =====================================
export const createAdminAccount = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  reference: string,
): Promise<FirebaseResponse<any>> => {
  try {
    safeLog("👨‍💼 Création compte ADMIN");

    // 1. Create Firebase Auth user
    const { user: authUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    safeLog(" Compte Admin créé.");

    // 2. Create admin profile in Realtime Database
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

    safeLog(" Profil Admin créé dans Realtime DB");

    return {
      success: true,
      data: {
        id: authUser.uid,
        email: email,
        name: name,
        phone: phone,
        role: "admin",
        reference: reference,
        is_active: true,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur création compte Admin:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// =====================================
// SUBSCRIPTION SYSTEM UTILITIES
// =====================================

/**
 * Calcule les jours restants avant expiration de l'abonnement
 * @param {string} expiryDateString - ISO date string de l'expiration
 * @returns {number} Jours restants (négatif si expiré)
 */
export const calculateDaysRemaining = (
  expiryDateString: string | undefined,
): number => {
  if (!expiryDateString) return -1; // Par défaut, considérer comme expiré
  const now = new Date();
  const expiryDate = new Date(expiryDateString);
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Détermine l'état de l'abonnement
 * @param {number} daysRemaining - Jours restants
 * @returns {string} État: "active" | "warning" | "inactive"
 */
export const getSubscriptionStatus = (daysRemaining: number): string => {
  if (daysRemaining < 0) return "inactive";
  if (daysRemaining < 7) return "warning";
  return "active";
};

/**
 * Renouvelle l'abonnement d'un dépôt (+30 jours) - Pour le bouton "Payer"
 * @param {string} depotId - ID du dépôt
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubscription = async (
  depotId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);

    // Ajouter 30 jours a partir de maintenant
    const newExpiryDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await update(depotRef, {
      subscription_expiry: newExpiryDate,
      subscription_status: "active",
      payment_pending: false,
      payment_notified_at: null,
      payment_amount: null,
      requested_tier: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    safeLog(" Abonnement renouvelé pour dépôt");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur renouvellement abonnement:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Renouvelle l'abonnement d'un dépôt avec un tier spécifique (+30 jours)
 * @param {string} depotId - ID du dépôt
 * @param {string} tier - Tier à appliquer (none, basic, advanced, elite)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubscriptionWithTier = async (
  depotId: string,
  tier: "none" | "basic" | "advanced" | "elite",
  billingCycle: "monthly" | "quarterly" = "monthly",
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    const durationDays = billingCycle === "quarterly" ? 90 : 30;

    const newExpiryDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const tierExpiryDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const updates: any = {
      subscription_expiry: newExpiryDate,
      subscription_plan: billingCycle,
      subscription_status: "active",
      payment_pending: false,
      payment_notified_at: null,
      payment_amount: null,
      requested_tier: null,
      requested_cycle: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (tier !== "none") {
      updates.tier = tier;
      updates.tier_expiry = tierExpiryDate;
    }

    await update(depotRef, updates);

    safeLog(` Abonnement ${billingCycle} renouvelé avec tier pour dépôt`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur renouvellement abonnement avec tier:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Marquer qu'un dépôt a effectué un paiement (le manager notifie l'admin)
 * @param depotId
 * @param amount - Montant que le dépôt veut payer
 * @param tier - Tier que le dépôt veut obtenir
 */
export const markPaymentPending = async (
  depotId: string,
  amount: number,
  tier: "none" | "basic" | "advanced" | "elite",
  billingCycle: "monthly" | "quarterly" = "monthly",
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      is_active: true,
      payment_pending: true,
      payment_amount: amount,
      requested_tier: tier,
      requested_cycle: billingCycle,
      subscription_plan: billingCycle,
      subscription_status: "inactive",
      payment_notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    safeLog(" Paiement en attente marqué pour dépôt");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur marquage paiement:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

// ==================== SYSTÈME DE TIERS PREMIUM ====================

/**
 * Upgrade tier d'un dépôt
 * @param depotId
 * @param newTier - "basic" (10k), "advanced" (15k), "elite" (25k)
 * @param durationDays - Défault 30 jours
 */
export const upgradeTier = async (
  depotId: string,
  newTier: "basic" | "advanced" | "elite",
  durationDays: number = 30,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    const tierExpiryDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    await update(depotRef, {
      tier: newTier,
      tier_expiry: tierExpiryDate,
      payment_pending: false,
      payment_amount: null,
      requested_tier: null,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    });

    safeLog(`✅ Tier ${newTier} appliqué au dépôt`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur upgrade tier:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Downgrade ou annuler le tier
 */
export const removeTier = async (
  depotId: string,
): Promise<FirebaseResponse<null>> => {
  try {
    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      tier: "none",
      tier_expiry: null,
      updated_at: new Date().toISOString(),
    });

    safeLog("✅ Tier annulé pour dépôt");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur annulation tier:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Obtenir le prix d'un tier
 */
export const getTierPrice = (tier: "basic" | "advanced" | "elite"): number => {
  const prices: Record<string, number> = {
    basic: 10000,
    advanced: 15000,
    elite: 20000,
  };
  return prices[tier] || 0;
};

// ==================== SYSTÈME DE VOTE ====================

/**
 * Obtenir le trimestre courant (ex: "2026-Q2")
 */
export const getCurrentQuarter = (): string => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
};

/**
 * Obtenir le classement des votes du trimestre
 * @returns Top 10 des dépôts par votes
 */
export const getVotingRankings = async (): Promise<
  Array<{
    depotId: string;
    vote_count: number;
    depot_name?: string;
  }>
> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesRef = ref(db, `votes/${currentQuarter}`);
    const snapshot = await get(votesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const votesData = snapshot.val();

    // Trier par vote_count
    const ranked = Object.entries(votesData)
      .filter(([key]) => key !== "metadata")
      .map(([depotId, data]: any) => ({
        depotId,
        vote_count: data.vote_count || 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 10); // Top 10

    // Enrichir avec les noms des dépôts
    const enriched = await Promise.all(
      ranked.map(async (item) => {
        try {
          const depotRef = ref(db, `depots/${item.depotId}`);
          const depotSnapshot = await get(depotRef);
          const depotData = depotSnapshot.val();
          return {
            ...item,
            depot_name: depotData?.name || `Dépôt ${item.depotId}`,
          };
        } catch {
          return item;
        }
      }),
    );

    return enriched;
  } catch (err: unknown) {
    safeError(" Erreur classement votes:", err);
    return [];
  }
};

/**
 * Lancer les votes pour le trimestre courant
 * @param votingDurationDays - Durée des votes en jours (défaut: 3)
 */
export const launchVoting = async (
  votingDurationDays: number = 3,
): Promise<FirebaseResponse<null>> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesSettingsRef = ref(db, `votes_settings/${currentQuarter}`);

    const startedAt = new Date().toISOString();
    const endsAt = new Date(
      Date.now() + votingDurationDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    await set(votesSettingsRef, {
      status: "VOTING_ACTIVE",
      started_at: startedAt,
      ends_at: endsAt,
      voting_duration_days: votingDurationDays,
      updated_at: new Date().toISOString(),
    });

    safeLog(`✅ Votes lancés pour ${currentQuarter}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur lancement votes:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Fermer les votes pour le trimestre courant
 */
export const closeVoting = async (): Promise<FirebaseResponse<null>> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesSettingsRef = ref(db, `votes_settings/${currentQuarter}`);

    await update(votesSettingsRef, {
      status: "VOTING_CLOSED",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    safeLog(`✅ Votes fermés pour ${currentQuarter}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur fermeture votes:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Réinitialiser le cycle de vote pour permettre un nouveau lancement
 */
export const resetVoting = async (): Promise<FirebaseResponse<null>> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesSettingsRef = ref(db, `votes_settings/${currentQuarter}`);

    await update(votesSettingsRef, {
      status: "PENDING",
      started_at: null,
      ends_at: null,
      closed_at: null,
      updated_at: new Date().toISOString(),
    });

    safeLog(`✅ Cycle de vote réinitialisé pour ${currentQuarter}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur réinitialisation votes:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Mettre à jour la durée des votes pour le trimestre courant
 */
export const updateVotingDuration = async (
  votingDurationDays: number,
): Promise<FirebaseResponse<null>> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesSettingsRef = ref(db, `votes_settings/${currentQuarter}`);
    const snapshot = await get(votesSettingsRef);

    if (!snapshot.exists()) {
      return { success: false, error: "Aucun cycle de vote n'a été lancé" };
    }

    const currentSettings = snapshot.val() || {};
    const normalizedDuration = normalizeVotingDurationDays(votingDurationDays);

    const updatePayload: Record<string, unknown> = {
      voting_duration_days: normalizedDuration,
      updated_at: new Date().toISOString(),
    };

    if (currentSettings.status === "VOTING_ACTIVE") {
      const startedAt = currentSettings.started_at || new Date().toISOString();
      updatePayload.ends_at = calculateVotingEndDate(
        startedAt,
        normalizedDuration,
      );
    }

    await update(votesSettingsRef, updatePayload);

    safeLog(`✅ Durée de vote mise à jour pour ${currentQuarter}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur mise à jour durée votes:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Obtenir le statut des votes pour le trimestre courant
 */
export const getVotingStatus = async (): Promise<any> => {
  try {
    const currentQuarter = getCurrentQuarter();
    const votesSettingsRef = ref(db, `votes_settings/${currentQuarter}`);
    const snapshot = await get(votesSettingsRef);

    if (!snapshot.exists()) {
      return {
        status: "PENDING",
        started_at: null,
        ends_at: null,
        voting_duration_days: 3,
      };
    }

    return snapshot.val();
  } catch (err: unknown) {
    safeError(" Erreur obtention statut votes:", err);
    return {
      status: "PENDING",
      started_at: null,
      ends_at: null,
      voting_duration_days: 3,
    };
  }
};

/**
 * Migration: Ajouter subscription_expiry et subscription_status aux dépôts existants
 * @returns {Promise<{success: boolean, migratedCount: number, error?: string}>}
 */
export const migrateExistingDepots = async (): Promise<any> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return { success: true, migratedCount: 0 };
    }

    const allDepots = snapshot.val();
    let migratedCount = 0;

    const updates: Record<string, string> = {};
    for (const depotId in allDepots) {
      const depot = allDepots[depotId];

      // Vérifier si le dépôt n'a pas déjà subscription_expiry
      if (!depot.subscription_expiry) {
        // Utiliser created_at comme base, ou maintenant si created_at n'existe pas
        const baseDate = depot.created_at
          ? new Date(depot.created_at)
          : new Date();
        const expiryDate = new Date(
          baseDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        updates[`depots/${depotId}/subscription_expiry` as string] =
          expiryDate.toISOString();
        updates[`depots/${depotId}/subscription_status` as string] = "active";
        migratedCount++;
      }
    }

    // Appliquer toutes les mises à jour en une seule opération
    if (migratedCount > 0) {
      await update(ref(db), updates);
      safeLog(` Migration: ${migratedCount} dépôts migrés`);
    }

    return { success: true, migratedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur migration dépôts:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Vérifier et désactiver les dépôts expirés (subscription > 30 jours sans renouvellement)
 * À appeler :
 * - Au démarrage de l'app admin
 * - Ou chaque jour via un service worker/cron
 * @returns {Promise<{success: boolean, deactivatedCount: number, error?: string}>}
 */
export const checkAndDeactivateExpiredDepots = async (): Promise<any> => {
  try {
    const depotsRef = ref(db, "depots");
    const snapshot = await get(depotsRef);

    if (!snapshot.exists()) {
      return { success: true, deactivatedCount: 0 };
    }

    const allDepots = snapshot.val();
    let deactivatedCount = 0;
    const updates: Record<string, any> = {};
    const now = new Date();

    for (const depotId in allDepots) {
      const depot = allDepots[depotId];

      // Vérifier si le dépôt a une date d'expiration
      if (depot.subscription_expiry) {
        const expiryDate = new Date(depot.subscription_expiry);

        // Si la date d'expiration est passée ET le dépôt est actif
        if (expiryDate < now && depot.is_active !== false) {
          safeLog(" ⚠️ Dépôt expiré - Désactivation...");

          updates[`depots/${depotId}/is_active`] = false;
          updates[`depots/${depotId}/subscription_status`] = "inactive";
          deactivatedCount++;
        }
      }
    }

    // Appliquer les mises à jour
    if (deactivatedCount > 0) {
      await update(ref(db), updates);
      safeLog(` ✅ ${deactivatedCount} dépôt(s) désactivé(s)`);
    }

    return { success: true, deactivatedCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur vérification dépôts expirés:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Mettre à niveau un dépôt en premium (pour les admins)
 * @param depotId - ID du dépôt
 * @param tier - Type de tier ('basic', 'advanced', 'elite')
 * @param durationDays - Durée en jours (défaut: 30)
 */
export const upgradeToPremium = async (
  depotId: string,
  tier: "basic" | "advanced" | "elite",
  durationDays: number = 30,
  billingCycle: "monthly" | "quarterly" = "monthly",
): Promise<FirebaseResponse<null>> => {
  try {
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

    const depotRef = ref(db, `depots/${depotId}`);
    await update(depotRef, {
      tier: tier,
      tier_expiry: premiumUntil.toISOString(),
      subscription_plan: billingCycle,
      payment_pending: false,
      payment_amount: null,
      requested_tier: null,
      requested_cycle: null,
      subscription_status: "active",
      subscription_expiry: premiumUntil.toISOString(),
      is_active: true,
      payment_notified_at: null,
      updated_at: new Date().toISOString(),
    });

    safeLog(` Dépôt mis à niveau en ${tier} pour ${billingCycle}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    safeError(" Erreur upgrade premium:", errorMsg);
    return { success: false, error: errorMsg };
  }
};
