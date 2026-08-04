import { useState, useEffect, ReactNode } from "react";
import Header from "./components/Header";
import AdminPanel from "./components/AdminPanel";
import DepotCard from "./components/DepotCard";
import UpdateNotification from "./components/UpdateNotification";
import VotingChart from "./components/VotingChart";
import "./App.css";
import "./auth.css";
import { useAuth } from "./auth";
import {
  registerUser,
  calculateDaysRemaining,
  markPaymentPending,
  backfillDepotCoordinates,
} from "./firebase";
import { getManagerDepots } from "./firebase";
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
  const [isLoadingDepots, setIsLoadingDepots] = useState<boolean>(false);

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionAlert, setSubscriptionAlert] = useState<boolean>(false);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState<boolean>(false);
  const [isRenewingSubscription, setIsRenewingSubscription] =
    useState<boolean>(false);
  const [showVotingChart, setShowVotingChart] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

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
  }, []);

  useEffect(() => {
    const initializeDashboardData = async () => {
      await backfillDepotCoordinates();
    };

    initializeDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      const loadManagerData = async () => {
        try {
          setIsLoadingDepots(true);

          const depotsResult = await getManagerDepots(user.id);
          const depotsData = depotsResult.success ? depotsResult.data : [];
          setDepots(depotsData || []);

          if (depotsData && depotsData.length > 0) {
            setSelectedDepot(depotsData[0]);
          }

          setIsLoadingDepots(false);
        } catch {
          setIsLoadingDepots(false);
        }
      };

      loadManagerData();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDepot) {
      setDaysRemaining(null);
      setSubscriptionAlert(false);
      setShowUpgradeNotice(false);
      return;
    }

    const remaining = selectedDepot.subscription_expiry
      ? calculateDaysRemaining(selectedDepot.subscription_expiry)
      : null;
    setDaysRemaining(remaining);

    const isPremiumTier = ["basic", "advanced", "elite"].includes(
      selectedDepot.tier || "none",
    );
    const isPaymentPending = Boolean(selectedDepot.payment_pending);

    const tierRemaining = selectedDepot.tier_expiry
      ? calculateDaysRemaining(selectedDepot.tier_expiry)
      : null;
    const isTierExpired = tierRemaining !== null && tierRemaining < 0;
    const isSubscriptionExpired = remaining !== null && remaining < 0;
    const isSubscriptionWarning =
      remaining !== null && remaining >= 0 && remaining < 7;

    if (isPaymentPending) {
      setSubscriptionAlert(true);
      setShowUpgradeNotice(false);
      return;
    }

    if (isTierExpired) {
      setSubscriptionAlert(true);
      setShowUpgradeNotice(false);
      return;
    }

    if (isSubscriptionExpired || isSubscriptionWarning) {
      setSubscriptionAlert(true);
      setShowUpgradeNotice(false);
      return;
    }

    if (isPremiumTier) {
      setSubscriptionAlert(false);
      setShowUpgradeNotice(false);
      return;
    }

    setSubscriptionAlert(false);
    setShowUpgradeNotice(true);

    const timer = window.setTimeout(() => {
      setShowUpgradeNotice(false);
    }, 15000);

    return () => window.clearTimeout(timer);
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
    }
  };

  const handleDepotUpdated = (updatedDepot: Depot) => {
    setSelectedDepot(updatedDepot);

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
        signUpData.quartier,
        signUpData.address, // Adresse du dépôt
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setSignUpError("Erreur lors de la création du compte: " + errorMessage);
    }
  };

  const handleRenewSubscription = async (
    amount: number,
    tier: "none" | "basic" | "advanced" | "elite",
    billingCycle: "monthly" | "quarterly" = "monthly",
  ) => {
    if (!selectedDepot) return;

    const confirmed = window.confirm(
      `Confirmez-vous ce choix : ${tier === "none" ? "renouvellement standard" : "forfait " + tier.toUpperCase()} ${billingCycle === "quarterly" ? "trimestriel" : "mensuel"} à ${amount.toLocaleString()} FCFA ?`,
    );

    if (!confirmed) return;

    setIsRenewingSubscription(true);
    try {
      const res = await markPaymentPending(
        selectedDepot.id,
        amount,
        tier,
        billingCycle,
      );
      if (res.success) {
        const pendingDepot = {
          ...selectedDepot,
          payment_pending: true,
          payment_amount: amount,
          requested_tier: tier,
          requested_cycle: billingCycle,
          subscription_plan: billingCycle,
          subscription_status: "inactive" as const,
        };

        setSelectedDepot(pendingDepot);
        setDepots((prevDepots) =>
          prevDepots.map((depot) =>
            depot.id === selectedDepot.id ? pendingDepot : depot,
          ),
        );

        alert(
          `Notification envoyée à l'admin. Veuillez effectuer le paiement de ${amount.toLocaleString()} FCFA au +242 06 767 81 28 et l'admin validera votre ${tier === "none" ? "renouvellement standard" : "upgrade " + tier.toUpperCase()} (${billingCycle === "quarterly" ? "trimestriel" : "mensuel"}).`,
        );
      } else {
        alert("Erreur notification: " + (res.error || "unknown"));
      }
    } catch {
      alert(" Erreur lors du renouvellement de l'abonnement");
    } finally {
      setIsRenewingSubscription(false);
    }
  };

  // Afficher l'interface de connexion si pas de manager connecté
  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="logo">
                <div className="logo-icon">D</div>
                <span>DEPÔT DASHBOARD</span>
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
                  : async (e) => {
                      e.preventDefault();
                      await login(loginData.identifier, loginData.password);
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
                      placeholder="Ex: Frigo Bacongo, Dépôt Charbon Jean, Magasin Epiceries/Vivre secs"
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

              <button
                type="submit"
                className={`login-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    Traitement...
                  </>
                ) : isSignUp ? (
                  " S'inscrire"
                ) : (
                  " Se connecter"
                )}
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
      <UpdateNotification />
      <Header
        user={user}
        onLogout={async () => {
          await logout();
        }}
        onToggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        onShowVotingChart={() => setShowVotingChart(true)}
        onShowHelp={() => setShowHelpModal(true)}
      />

      <div className="main-container">
        {/* Spinner de chargement */}
        {isLoadingDepots && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement des dépôts...</p>
          </div>
        )}

        {/* Depot Selector */}
        {!isLoadingDepots && depots.length > 0 && (
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

        {!isLoadingDepots && showUpgradeNotice && selectedDepot && (
          <div className="subscription-upgrade-banner">
            <strong>✨ Nouveau :</strong> débloquez les images et vidéos de vos
            produits en passant à l’offre premium de{" "}
            <strong>10 000 à 15 000 FCFA</strong>.
            <span>
              Profitez d’un meilleur visuel pour attirer plus de clients.
            </span>
            <button
              type="button"
              className="subscription-upgrade-btn"
              onClick={() => setSubscriptionAlert(true)}
            >
              Renouveler / Passer premium
            </button>
          </div>
        )}

        {/* ← NOUVEAU: Alerte et bouton Payer pour l'expiration de l'abonnement */}
        {!isLoadingDepots && subscriptionAlert && selectedDepot && (
          <div className="subscription-alert">
            <button
              type="button"
              className="subscription-alert-close"
              onClick={() => setSubscriptionAlert(false)}
              aria-label="Fermer la notice de renouvellement"
            >
              ✕
            </button>
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
            {selectedDepot.payment_pending ? (
              <div className="payment-pending-message">
                <p> Paiement en attente de validation admin</p>
                <p className="payment-info">
                  Effectuez le paiement MOMO au +242 06 767 81 28
                </p>
                <div className="payment-selection-info">
                  <p>
                    <strong>Montant sélectionné:</strong>{" "}
                    {selectedDepot.payment_amount?.toLocaleString()} FCFA
                  </p>
                  <p>
                    <strong>Forfait demandé:</strong>{" "}
                    {selectedDepot.requested_tier === "none"
                      ? "Standard"
                      : selectedDepot.requested_tier?.toUpperCase()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="payment-buttons-container">
                <h4>Choisissez votre forfait:</h4>
                <button
                  onClick={() =>
                    handleRenewSubscription(6000, "none", "monthly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-standard"
                >
                  💳 6,000 FCFA
                  <br />
                  <small>Standard Mensuel (+30j)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(10000, "basic", "monthly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-basic"
                >
                  💎 10,000 FCFA
                  <br />
                  <small>Premium Basic Mensuel (Top 15)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(15000, "advanced", "monthly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-advanced"
                >
                  💎💎 15,000 FCFA
                  <br />
                  <small>Premium Advanced Mensuel (Top 10)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(20000, "elite", "monthly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-elite"
                >
                  💎💎💎 20,000 FCFA
                  <br />
                  <small>Premium Elite Mensuel (Top 3)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(28000, "basic", "quarterly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-basic"
                >
                  💎 28,000 FCFA
                  <br />
                  <small>Premium Basic Trimestriel (Top 15)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(42000, "advanced", "quarterly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-advanced"
                >
                  💎💎 42,000 FCFA
                  <br />
                  <small>Premium Advanced Trimestriel (Top 10)</small>
                </button>
                <button
                  onClick={() =>
                    handleRenewSubscription(56000, "elite", "quarterly")
                  }
                  disabled={isRenewingSubscription}
                  className="btn-payment-option btn-elite"
                >
                  💎💎💎 56,000 FCFA
                  <br />
                  <small>Premium Elite Trimestriel (Top 3)</small>
                </button>
              </div>
            )}
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

      <footer className="app-footer">
        <p>© 2026 | Depot Dashboard Genesis v1.0 | Powered by Vision Unique</p>
        <a
          href="https://wa.me/242067678128?text=Bonjour,%20je%20voudrais%20donner%20mon%20avis%20sur%20les%20am%C3%A9liorations%20logistiques%20du%20Depot%20Dashboard"
          className="whatsapp-feedback-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Donnez votre avis sur WhatsApp
        </a>
      </footer>

      <VotingChart
        isOpen={showVotingChart}
        onClose={() => setShowVotingChart(false)}
      />

      {showHelpModal && (
        <div
          className="help-modal-overlay"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="help-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-modal-header">
              <h2>À propos de Depot Dashboard</h2>
              <button
                className="help-modal-close"
                onClick={() => setShowHelpModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="help-modal-body">
              <div className="help-section">
                <h3> Qu'est-ce que Depot Dashboard ?</h3>
                <p>
                  Depot Dashboard est une application de gestion pour les
                  managers de dépôts. Elle permet de gérer vos produits, vos
                  stocks, votre abonnement et d'améliorer votre logistique.
                </p>
              </div>
              <div className="help-section">
                <h3> Comment ça fonctionne?</h3>
                <ul>
                  <li>
                    <strong>Gestion des produits:</strong> Ajoutez, modifiez ou
                    supprimez vos produits avec prix et stock pour une meilleure
                    organisation
                  </li>
                  <li>
                    <strong>Stock:</strong> Suivez vos quantités en stock et
                    mettez à jour vos unités pour une meilleure gestion
                  </li>
                  <li>
                    <strong>Abonnement:</strong> Renouvelez votre abonnement
                    mensuel pour garder votre dépôt actif
                  </li>
                  <li>
                    <strong>Premium:</strong> Upgradez vers les tiers premium
                    (Basic, Advanced, Elite) pour une meilleure visibilité vous
                    béneficeriez ici de la fonctionnalité de mettre une image
                    sur vos produits et dans certains cas une courte video
                  </li>
                </ul>
              </div>
              <div className="help-section">
                <h3>💎 Système Premium</h3>
                <ul>
                  <li>
                    <strong>Basic (10 000 FCFA):</strong> Top 15 par catégorie :
                    votre depot s'affichera parmi les 15 pemier depot visible
                    par les utilisateurs
                  </li>
                  <li>
                    <strong>Advanced (15 000 FCFA):</strong> Top 10 par
                    catégorie : votre depot s'affichera parmi les 10 pemier
                    depot visible par les utilisateurs
                  </li>
                  <li>
                    <strong>Elite (20 000 FCFA):</strong> Top 3 par catégorie :
                    votre depot s'affichera parmi les 3 pemier depot visible par
                    les utilisateurs
                  </li>
                </ul>
              </div>
              <div className="help-section">
                <h3>Système de Vote</h3>
                <p>
                  Les mamans votent pour leurs dépôts préférés. Les meilleurs
                  dépôts gagnent en visibilité dans le classement trimestriel
                  par illustration un depot avec un abonnment basic, avec une
                  bonne note lors des votes aura la meme visubilité et jouiera
                  des memes privilege que celui qui à un abonnment élite.
                </p>
              </div>
              <div className="help-section">
                <h3>💬 Besoin d'aide?</h3>
                <p>
                  Utilisez le bouton WhatsApp au bas du l'Application pour nous
                  contacter et donner votre avis sur les améliorations
                  logistiques .
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Logo */}
      <a
        href="https://geniusland.netlify.app"
        className="fixed-logo"
        target="_blank"
        rel="noopener noreferrer"
        title="Vision Unique"
      >
        <img src="/photo-pro.jpg" alt="Vision Unique Logo" />
      </a>
    </div>
  );
}

export default App;
