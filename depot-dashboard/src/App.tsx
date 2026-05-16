import { useState, useEffect, ReactNode } from "react";
import Header from "./components/Header";
import AdminPanel from "./components/AdminPanel";
import StatsGrid from "./components/StatsGrid";
import DepotCard from "./components/DepotCard";
import "./App.css";
import "./auth.css";
import { useAuth } from "./auth";
import {
  registerUser,
  getQuartiers,
  initializeQuartiers,
  detectAndLogin,
  calculateDaysRemaining,
  updateSubscription,
} from "./firebase";
import { getManagerDepots, getDepotProducts } from "./firebase";
import type { Depot, Quartier } from "./types";

function App(): ReactNode {
  // Hook d'authentification manager
  const { user, loading, error, login, logout } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<{
    identifier: string;
    password: string;
  }>({
    identifier: "",
    password: "",
  });
  const [signUpData, setSignUpData] = useState<{
    name: string;
    phone: string;
    phone_whatsapp: string;
    quartier: string;
    address: string;
    depot_name: string;
    password: string;
  }>({
    name: "",
    phone: "",
    phone_whatsapp: "",
    quartier: "",
    address: "",
    depot_name: "",
    password: "",
  });
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem("dashboardDarkMode");
    return savedDarkMode === "enabled";
  });
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [depotProducts, setDepotProducts] = useState<any[]>([]);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(() => {
    // Vérifier si on a un user en cache
    try {
      const savedUser = localStorage.getItem("managerUser");
      return savedUser ? true : false;
    } catch {
      return false;
    }
  });

  // ← NOUVEAU: States pour la gestion d'expiration d'abonnement
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionAlert, setSubscriptionAlert] = useState<boolean>(false);
  const [isRenewingSubscription, setIsRenewingSubscription] =
    useState<boolean>(false);

  // Appliquer dark mode au body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  // Charger les quartier au montage
  useEffect(() => {
    // Quartiers pre-definis de Brazaville
    const defaultQuartiers = [
      { id: "1", name: "Bakongo" },
      { id: "2", name: "Poto-Poto" },
      { id: "3", name: "Moungali" },
      { id: "4", name: "Ouenzé" },
      { id: "5", name: "Talangaï" },
      { id: "6", name: "Mfilou" },
      { id: "7", name: "Makélékélé" },
      { id: "8", name: "Djiri" },
      { id: "9", name: "Madibou" },
    ];

    setQuartiers(defaultQuartiers as Quartier[]);

    // En parallele, essayer de charger et creer les quartiers en Firebase
    const loadQuartiers = async () => {
      try {
        const result = await getQuartiers();

        if (!result.success || !result.data || result.data.length === 0) {
          // Si pas de quartiers en Firebase, les créer
          console.log("📍 Création des quartiers en Firebase...");
          await initializeQuartiers();
        }
      } catch (error) {
        console.error(" Erreur création quartiers Firebase:", error);
        // Continue sans erreur - les quartiers locaux sont suffisants pour la dropdown
      }
    };

    loadQuartiers();
  }, []);

  // Charger les données du manager une fois connecté
  useEffect(() => {
    if (user) {
      const loadManagerData = async () => {
        try {
          console.log(" Chargement des dépôts du manager:", user.id);

          // Charger les dépôts du manager
          const depotsResult = await getManagerDepots(user.id);
          const depotsData = depotsResult.success ? depotsResult.data : [];
          setDepots(depotsData || []);

          if (depotsData && depotsData.length > 0) {
            setSelectedDepot(depotsData[0]);

            // Charger les produits du premier dépôt
            const productsResult = await getDepotProducts(depotsData[0].id);
            setDepotProducts(productsResult.data || []);
          }

          console.log(" Données du manager chargées");
        } catch (error) {
          console.error(" Erreur chargement données manager:", error);
        }
      };

      loadManagerData();
    }
  }, [user]);

  // ← NOUVEAU: useEffect pour calculer l'expiration de l'abonnement
  useEffect(() => {
    if (selectedDepot && selectedDepot.subscription_expiry) {
      const remaining = calculateDaysRemaining(
        selectedDepot.subscription_expiry,
      );
      setDaysRemaining(remaining);

      // Afficher l'alerte si < 7 jours ou expiré
      if (remaining < 7) {
        setSubscriptionAlert(true);
      } else {
        setSubscriptionAlert(false);
      }
    }
  }, [selectedDepot]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem(
      "dashboardDarkMode",
      newDarkMode ? "enabled" : "disabled",
    );
  };

  const handleDepotChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const depotId = e.target.value;
    const depot = depots.find((d) => d.id === depotId);
    if (depot) {
      setSelectedDepot(depot);

      // Charger les produits du nouveau dépôt
      const productsResult = await getDepotProducts(depot.id);
      setDepotProducts(productsResult.data || []);
    }
  };

  const handleDepotUpdated = (updatedDepot: Depot) => {
    // Mettre à jour le dépôt sélectionné avec les nouvelles données
    setSelectedDepot(updatedDepot);

    // Mettre à jour le dépôt dans la liste des dépôts
    setDepots((prevDepots) =>
      prevDepots.map((d) => (d.id === updatedDepot.id ? updatedDepot : d)),
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (
      !signUpData.name ||
      !signUpData.phone ||
      !signUpData.phone_whatsapp ||
      !signUpData.quartier ||
      !signUpData.address ||
      !signUpData.password
    ) {
      setSignUpError("Tous les champs sont requis");
      return;
    }

    if (signUpData.password.length < 6) {
      setSignUpError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    try {
      const result = await registerUser(
        signUpData.name,
        signUpData.phone,
        signUpData.password,
        signUpData.phone,
        signUpData.phone_whatsapp,
        signUpData.address, // Adresse du dépôt
        signUpData.quartier,
        signUpData.depot_name, // Nom personnalisé du dépôt
      );

      if (result.success) {
        alert(
          " Compte manager créé avec succès et dépôt créé automatiquement!",
        );
        setIsSignUp(false);
        setLoginData({ identifier: "", password: "" });
        setSignUpData({
          name: "",
          phone: "",
          phone_whatsapp: "",
          address: "",
          quartier: "",
          depot_name: "",
          password: "",
        });
        // Essayer de se connecter automatiquement
        login(signUpData.phone, signUpData.password);
      } else {
        setSignUpError(result.error || "Erreur lors de la création du compte");
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      setSignUpError(
        "Erreur lors de la création du compte: " +
          (error instanceof Error ? error.message : "Erreur inconnue"),
      );
    }
  };

  // ← NOUVEAU: Fonction pour renouveler l'abonnement (bouton "Payer")
  const handleRenewSubscription = async () => {
    if (!selectedDepot) return;

    setIsRenewingSubscription(true);
    try {
      const result = await updateSubscription(selectedDepot.id);
      if (result.success) {
        alert(" Abonnement renouvelé pour 30 jours!");

        // Recharger le dépôt pour voir la nouvelle date d'expiration
        const updatedDepot = {
          ...selectedDepot,
          subscription_expiry: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          subscription_status: "active",
        };
        setSelectedDepot(updatedDepot as Depot);

        // Recalculer les jours restants
        const remaining = calculateDaysRemaining(
          updatedDepot.subscription_expiry,
        );
        setDaysRemaining(remaining);
        setSubscriptionAlert(false);
      } else {
        alert(" Erreur renouvellement: " + result.error);
      }
    } catch (error) {
      console.error("Erreur renouvellement abonnement:", error);
      alert(" Erreur lors du renouvellement de l'abonnement");
    } finally {
      setIsRenewingSubscription(false);
    }
  };

  // SPINNER pour les managers qui reviennent (cache plein + Firebase en cours de validation)
  if (isCached && loading && !user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">D</div>
                <span>DÉPÔT DASHBOARD</span>
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "20px",
                  animation: "spin 1s linear infinite",
                }}
              >
                ⏳
              </div>
              <h2 style={{ marginBottom: "10px", color: "#009739" }}>
                Restauration de votre session...
              </h2>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Merci de patienter quelques secondes
              </p>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Afficher l'interface de connexion si pas de manager connecté
  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">D</div>
                <span>DÉPÔT DASHBOARD</span>
              </div>
              <h2>
                {isSignUp ? "Créer un compte Manager" : "Connexion Manager"}
              </h2>
              <p>
                {isSignUp
                  ? "Inscrivez-vous pour gérer vos dépôts"
                  : "Connectez-vous pour gérer vos dépôts"}
              </p>
            </div>

            <form
              onSubmit={
                isSignUp
                  ? handleSignUp
                  : (e) => {
                      e.preventDefault();
                      detectAndLogin(loginData.identifier, loginData.password);
                    }
              }
            >
              {isSignUp && (
                <div className="form-group">
                  <label>👤 Nom Complet</label>
                  <input
                    type="text"
                    placeholder="Votre nom complet"
                    value={signUpData.name}
                    onChange={(e) =>
                      setSignUpData({ ...signUpData, name: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label> Identifiant (Email ou Téléphone)</label>
                <input
                  type="text"
                  placeholder="Votre email ou téléphone"
                  value={isSignUp ? signUpData.phone : loginData.identifier}
                  onChange={(e) => {
                    if (isSignUp) {
                      setSignUpData({ ...signUpData, phone: e.target.value });
                    } else {
                      setLoginData({
                        ...loginData,
                        identifier: e.target.value,
                      });
                    }
                  }}
                  required
                />
              </div>

              {isSignUp && (
                <>
                  <div className="form-group">
                    <label>💬 Numéro WhatsApp du Dépôt</label>
                    <input
                      type="tel"
                      placeholder="+242 061234567"
                      value={signUpData.phone_whatsapp}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          phone_whatsapp: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>📍 Quartier</label>
                    <select
                      value={signUpData.quartier}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          quartier: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">-- Sélectionner un quartier --</option>
                      {quartiers.map((q) => (
                        <option key={q.id} value={q.name}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>📍 Adresse du Dépôt</label>
                    <input
                      type="text"
                      placeholder="Ex: Rue Bakongo, à côté pharmacie Jean Marie"
                      value={signUpData.address}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          address: e.target.value,
                        })
                      }
                      required
                    />
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Adresse précise pour que les clients trouvent facilement
                    </small>
                  </div>

                  <div className="form-group">
                    <label>🏪 Nom du Dépôt/Boutique (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: Frigo Bacongo, Dépôt Charbon Jean, Magasin Vivriers"
                      value={signUpData.depot_name}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          depot_name: e.target.value,
                        })
                      }
                    />
                    <small style={{ color: "#666", fontSize: "12px" }}>
                      Laissez vide pour utiliser: Votre nom + Quartier
                    </small>
                  </div>
                </>
              )}

              <div className="form-group">
                <label> Mot de passe</label>
                <input
                  type="password"
                  placeholder="Votre mot de passe"
                  value={isSignUp ? signUpData.password : loginData.password}
                  onChange={(e) => {
                    if (isSignUp) {
                      setSignUpData({
                        ...signUpData,
                        password: e.target.value,
                      });
                    } else {
                      setLoginData({ ...loginData, password: e.target.value });
                    }
                  }}
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? "Traitement..."
                  : isSignUp
                    ? " S'inscrire"
                    : " Se connecter"}
              </button>
            </form>

            {(error || signUpError) && (
              <div className="error-message"> {error || signUpError}</div>
            )}

            <div className="login-footer">
              {!isSignUp ? (
                <>
                  <p>Pas encore inscrit?</p>
                  <button
                    onClick={() => setIsSignUp(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0066cc",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  <p>Vous avez déjà un compte?</p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0066cc",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Se connecter
                  </button>
                </>
              )}
              <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
                Accès réservé aux gestionnaires de dépôts
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  // Afficher le panneau admin si user est admin
  if (user && user.role === "admin") {
    return (
      <AdminPanel
        user={user}
        logout={async () => {
          await logout();
        }}
      />
    );
  }

  return (
    <div className={isDarkMode ? "dark-mode" : ""}>
      <Header
        user={user}
        onLogout={async () => {
          await logout();
        }}
        onToggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
      />

      <div className="main-container">
        <div className="stats-toggle-container">
          <button
            className="stats-toggle-btn"
            onClick={() => setShowStats(!showStats)}
            title={showStats ? "Masquer les stats" : "Afficher les stats"}
          >
            📊 {showStats ? "▼ Statistiques" : "▶ Statistiques"}
          </button>
        </div>
        {showStats && <StatsGrid products={depotProducts} />}

        {/* Depot Selector */}
        {depots.length > 0 && (
          <div className="depot-selector">
            <label> Sélectionner un dépôt:</label>
            <select
              value={selectedDepot?.id || ""}
              onChange={handleDepotChange}
            >
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ← NOUVEAU: Alerte et bouton Payer pour l'expiration de l'abonnement */}
        {subscriptionAlert && selectedDepot && (
          <div className="subscription-alert">
            {daysRemaining !== null && daysRemaining < 0 ? (
              <>
                <h3>⚠️ Votre abonnement a expiré!</h3>
                <p>Veuillez renouveler votre abonnement pour continuer.</p>
                <p className="status-inactive">Status: Inactif</p>
              </>
            ) : (
              <>
                <h3>⚠️ Abonnement expire bientôt!</h3>
                <p>
                  Il vous reste <strong>{daysRemaining} jour(s)</strong> avant
                  l'expiration.
                </p>
                <p className="status-warning">Status: À renouveler</p>
              </>
            )}
            <button
              onClick={handleRenewSubscription}
              disabled={isRenewingSubscription}
              className="btn-payer"
            >
              {isRenewingSubscription
                ? "⏳ Renouvellement..."
                : "💳 Payer (+30 jours)"}
            </button>
          </div>
        )}

        {/* Depot Card - Afficher les détails du dépôt */}
        {selectedDepot && (
          <DepotCard
            depot={selectedDepot}
            onDepotUpdated={() => handleDepotUpdated(selectedDepot!)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
