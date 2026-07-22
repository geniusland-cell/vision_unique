import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { detectAndLogin, logoutUser, getCurrentUser } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "./types";

/**
 * Hook d'authentification avec Firebase Auth
 * Gère la connexion, déconnexion et la session manager
 */
export const useAuth = (): {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (
    phone: string,
    password: string,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (
    name: string,
    phone: string,
    password: string,
    phone_direct: string,
    phone_whatsapp: string,
    quartier: string,
    address: string,
    depot_name: string,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  isManager: () => boolean;
} => {
  const [user, setUser] = useState<User | null>(() => {
    // OPTIMIZATION: Charger depuis localStorage sans attendre le server
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurer la session au démarrage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Récupérer le profil depuis Firestore
        const result = await getCurrentUser(authUser.uid);
        if (result.success && result.data) {
          // Accepter managers ET admins
          if (result.data.role === "manager" || result.data.role === "admin") {
            setUser(result.data);
            // SAUVEGARDER dans localStorage pour prochain chargement instantané
            localStorage.setItem("user", JSON.stringify(result.data));
          } else {
            setUser(null);
            localStorage.removeItem("user");
          }
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Connexion avec Firebase
   * @param {string} phone - Numéro de téléphone (pour managers)
   * @param {string} password - Mot de passe
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const login = async (
    phone: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await detectAndLogin(phone, password);

      if (result.success && result.data) {
        // Accepter managers ET admins
        if (result.data.role !== "manager" && result.data.role !== "admin") {
          setError("Accès réservé aux managers et administrateurs");
          return {
            success: false,
            error: "Accès réservé aux managers et administrateurs",
          };
        }
        setUser(result.data);
        // SAUVEGARDER dans localStorage
        localStorage.setItem("user", JSON.stringify(result.data));
        return { success: true, user: result.data };
      } else {
        const errorMsg = result.error || "Erreur de connexion";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg =
        "Erreur de connexion: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription avec Firebase
   * @param {string} name - Nom du manager
   * @param {string} phone - Téléphone
   * @param {string} password - Mot de passe
   * @param {string} phone_direct - Numéro direct du manager
   * @param {string} phone_whatsapp - Numéro WhatsApp
   * @param {string} quartier - Quartier du dépôt
   * @param {string} address - Adresse du dépôt
   * @param {string} depot_name - Nom du dépôt
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const register = async (
    name: string,
    phone: string,
    password: string,
    phone_direct: string,
    phone_whatsapp: string,
    quartier: string,
    address: string,
    depot_name: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { registerUser } = await import("./firebase");
      const result = await registerUser(
        name,
        phone,
        password,
        phone_direct,
        phone_whatsapp,
        quartier,
        address,
        depot_name,
      );

      if (result.success && result.data) {
        setUser(result.data);
        // SAUVEGARDER dans localStorage
        localStorage.setItem("user", JSON.stringify(result.data));
        return { success: true, user: result.data };
      } else {
        const errorMsg = result.error || "Erreur d'inscription";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg =
        "Erreur d'inscription: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      await logoutUser();
      setUser(null);
      localStorage.removeItem("user");
      return { success: true };
    } catch (err: unknown) {
      const errorMsg =
        "Erreur de déconnexion: " +
        (err instanceof Error ? err.message : "Erreur inconnue");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    // État
    user,
    loading,
    error,

    // Actions
    login,
    register,
    logout,

    // Utilitaires
    isManager: (): boolean => user !== null && user.role === "manager",
  };
};
