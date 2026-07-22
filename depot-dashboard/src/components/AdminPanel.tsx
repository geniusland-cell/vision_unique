import { useState, useEffect, ReactNode } from "react";
import {
  getAllManagers,
  getManagerDetailsForAdmin,
  banManager,
  unbanManager,
  banDepot,
  unbanDepot,
  calculateDaysRemaining,
  getSubscriptionStatus,
  updateSubscription,
  upgradeToPremium,
  updateSubscriptionWithTier,
} from "../firebase";
import VotingManagement from "./VotingManagement";
import type { User } from "../types";
import "../styles/AdminPanel.css";

interface AdminPanelProps {
  user: User;
  logout: () => Promise<void>;
}

function AdminPanel({ user, logout }: AdminPanelProps): ReactNode {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [managerDetails, setManagerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"managers" | "stats" | "votes">(
    "managers",
  );
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [premiumLoading, setPremiumLoading] = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      setLoading(true);
      const result = await getAllManagers();
      setManagers(result?.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadManagerDetails = async (managerId: string) => {
    try {
      setLoadingDetails(true);
      const result = await getManagerDetailsForAdmin(managerId);
      if (result?.success) {
        setManagerDetails(result.data);
      } else {
        setManagerDetails(null);
      }
      setSelectedManager(managerId);
    } catch {
      setManagerDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBanManager = async (managerId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir bannir ce manager?")) {
      try {
        await banManager(managerId);
        loadManagers();
        if (selectedManager === managerId) {
          setSelectedManager(null);
          setManagerDetails(null);
        }
      } catch {}
    }
  };

  const handleUnbanManager = async (managerId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir débannir ce manager ?")) {
      try {
        await unbanManager(managerId);
        loadManagers();
        if (selectedManager === managerId) {
          loadManagerDetails(managerId);
        }
      } catch {}
    }
  };

  const handleBanDepot = async (depotId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir bannir ce dépôt? Il ne s'affichera plus dans l'app des mamans.",
      )
    ) {
      try {
        setBanLoading(depotId);
        await banDepot(depotId);
        if (selectedManager) {
          loadManagerDetails(selectedManager);
        }
      } catch {
      } finally {
        setBanLoading(null);
      }
    }
  };

  const handleUnbanDepot = async (depotId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir débannir ce dépôt? Il s'affichera à nouveau dans l'app des mamans.",
      )
    ) {
      try {
        setBanLoading(depotId);
        await unbanDepot(depotId);
        if (selectedManager) {
          loadManagerDetails(selectedManager);
        }
      } catch {
      } finally {
        setBanLoading(null);
      }
    }
  };

  const handlePaymentDepot = async (depotId: string) => {
    if (
      window.confirm(
        "Confirmer le paiement pour renouveler ce dépôt (+30 jours)?",
      )
    ) {
      try {
        setPaymentLoading(depotId);
        const result = await updateSubscription(depotId);
        if (result.success) {
          alert(" Paiement traité avec succès! Dépôt renouvelé pour 30 jours.");
          loadManagerDetails(selectedManager || "");
        } else {
          alert(" Erreur: " + result.error);
        }
      } catch {
        alert("Erreur lors du traitement du paiement");
      } finally {
        setPaymentLoading(null);
      }
    }
  };

  const handleValidatePayment = async (
    depotId: string,
    amount: number,
    tier: "none" | "basic" | "advanced" | "elite",
  ) => {
    if (
      window.confirm(
        `Confirmer le paiement de ${amount.toLocaleString()} FCFA pour ${tier === "none" ? "renouvellement standard" : "upgrade " + tier.toUpperCase()} (+30 jours)?`,
      )
    ) {
      try {
        setPaymentLoading(depotId);
        const result = await updateSubscriptionWithTier(depotId, tier);
        if (result.success) {
          alert(
            `Paiement de ${amount.toLocaleString()} FCFA validé! Dépôt ${tier === "none" ? "renouvelé" : "upgradé en " + tier.toUpperCase()} pour 30 jours.`,
          );
          loadManagerDetails(selectedManager || "");
        } else {
          alert(" Erreur: " + result.error);
        }
      } catch {
        alert("Erreur lors du traitement du paiement");
      } finally {
        setPaymentLoading(null);
      }
    }
  };

  const handleUpgradePremium = async (
    depotId: string,
    tier: "basic" | "advanced" | "elite",
    price: number,
  ) => {
    if (
      window.confirm(
        `Confirmer l'upgrade vers ${tier.toUpperCase()} pour ${price} FCFA (30 jours)?`,
      )
    ) {
      try {
        setPremiumLoading(depotId);
        const result = await upgradeToPremium(depotId, tier, 30);
        if (result.success) {
          alert(` Dépôt mis à niveau en ${tier.toUpperCase()} pour 30 jours!`);
          loadManagerDetails(selectedManager || "");
        } else {
          alert(" Erreur: " + result.error);
        }
      } catch {
        alert("Erreur lors de l'upgrade premium");
      } finally {
        setPremiumLoading(null);
      }
    }
  };

  const activeManagers = managers.filter((m) => m.is_active !== false);
  const bannedManagers = managers.filter((m) => m.is_active === false);

  return (
    <div className={`admin-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="admin-header">
        <div className="admin-logo">
          <span className="admin-logo-icon">👨‍💼</span>
          <span>Admin Panel</span>
        </div>
        <div className="admin-user-info">
          <span>{user?.email}</span>
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title="Toggle Mode Sombre"
          >
            🌙
          </button>
          <button className="logout-btn" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Onglets */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === "managers" ? "active" : ""}`}
            onClick={() => setActiveTab("managers")}
          >
            👥 Managers
          </button>
          <button
            className={`tab-button ${activeTab === "votes" ? "active" : ""}`}
            onClick={() => setActiveTab("votes")}
          >
            Gestion des Votes
          </button>
        </div>

        {/* Contenu Managers */}
        {activeTab === "managers" && (
          <div className="admin-managers-view">
            <div className="admin-left">
              {/* Active Managers Section */}
              <div className="admin-section">
                <h2>Managers Actifs ({activeManagers.length})</h2>
                {loading ? (
                  <div className="loading">Chargement...</div>
                ) : activeManagers.length === 0 ? (
                  <div className="no-data">Aucun manager actif</div>
                ) : (
                  <div className="managers-list">
                    {activeManagers.map((manager) => (
                      <div
                        key={manager.id}
                        className={`manager-item ${
                          selectedManager === manager.id ? "active" : ""
                        }`}
                        onClick={() => loadManagerDetails(manager.id)}
                      >
                        <div className="manager-info">
                          <div className="manager-name">{manager.name}</div>
                          <div className="manager-email">{manager.email}</div>
                          <div className="manager-phone">{manager.phone}</div>
                        </div>
                        <div className="manager-actions">
                          <button
                            className="btn btn-details"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadManagerDetails(manager.id);
                            }}
                          >
                            Détails
                          </button>
                          <button
                            className="btn btn-ban"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBanManager(manager.id);
                            }}
                          >
                            Bannir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Banned Managers Section */}
              <div className="admin-section">
                <h2>Managers Bannies ({bannedManagers.length})</h2>
                {bannedManagers.length === 0 ? (
                  <div className="no-data">Aucun manager banni</div>
                ) : (
                  <div className="managers-list">
                    {bannedManagers.map((manager) => (
                      <div
                        key={manager.id}
                        className={`manager-item banned ${
                          selectedManager === manager.id ? "active" : ""
                        }`}
                        onClick={() => loadManagerDetails(manager.id)}
                      >
                        <div className="manager-info">
                          <div className="manager-name">{manager.name}</div>
                          <div className="manager-email">{manager.email}</div>
                          <div className="manager-phone">{manager.phone}</div>
                        </div>
                        <div className="manager-actions">
                          <button
                            className="btn btn-details"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadManagerDetails(manager.id);
                            }}
                          >
                            Détails
                          </button>
                          <button
                            className="btn btn-unban"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanManager(manager.id);
                            }}
                          >
                            Débannir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manager Details Section */}
            <div className="admin-right">
              {!selectedManager ? (
                <div className="no-selection">
                  Sélectionnez un manager pour voir les détails
                </div>
              ) : loadingDetails ? (
                <div className="loading">Chargement des détails...</div>
              ) : managerDetails ? (
                <div className="manager-details">
                  <h2>{managerDetails.name}</h2>

                  {/* Manager Info */}
                  <div className="details-section">
                    <h3>Informations</h3>
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{managerDetails.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Téléphone:</span>
                      <span className="value">{managerDetails.phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Statut manager:</span>
                      <span
                        className={`status ${managerDetails.is_active ? "active" : "banned"}`}
                      >
                        {managerDetails.is_active ? "Actif" : "Banni"}
                      </span>
                    </div>
                  </div>

                  {/* Depots Section */}
                  {managerDetails.depots &&
                    managerDetails.depots.length > 0 && (
                      <div className="details-section">
                        <h3>Dépôts ({managerDetails.depots.length})</h3>
                        <div className="depots-list">
                          {managerDetails.depots.map((depot: any) => {
                            const daysRemaining = calculateDaysRemaining(
                              depot.subscription_expiry,
                            );
                            const subStatus =
                              getSubscriptionStatus(daysRemaining);
                            const isExpired = daysRemaining < 0;
                            const isWarning =
                              daysRemaining >= 0 && daysRemaining < 7;
                            const statusLabel = depot.payment_pending
                              ? "En attente"
                              : isExpired
                                ? "Inactif"
                                : isWarning
                                  ? "À renouveler"
                                  : "Actif";

                            return (
                              <div
                                key={depot.id}
                                className={`depot-item ${isExpired ? "expired" : isWarning ? "warning" : "active"}`}
                              >
                                <div className="depot-header">
                                  <h4>{depot.name}</h4>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      className={`subscription-badge ${subStatus}`}
                                    >
                                      {isExpired
                                        ? "⚠️ EXPIRÉ"
                                        : isWarning
                                          ? `⏰ ${daysRemaining}j restants`
                                          : `✓ ${daysRemaining}j`}
                                    </span>
                                    <span className="payment-pending">
                                      Statut dépôt: {statusLabel}
                                    </span>
                                  </div>
                                  {depot.payment_pending && (
                                    <span className="payment-pending">
                                      📩 Paiement signalé (
                                      {depot.payment_amount?.toLocaleString() ||
                                        "—"}{" "}
                                      FCFA -{" "}
                                      {depot.requested_tier === "none"
                                        ? "Standard"
                                        : depot.requested_tier?.toUpperCase() ||
                                          "Standard"}
                                      )
                                    </span>
                                  )}
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      marginTop: "8px",
                                    }}
                                  >
                                    {depot.is_active !== false ? (
                                      <button
                                        className="btn btn-ban"
                                        onClick={() => handleBanDepot(depot.id)}
                                        disabled={banLoading === depot.id}
                                      >
                                        {banLoading === depot.id
                                          ? "⏳..."
                                          : "🚫 Bannir"}
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-unban"
                                        onClick={() =>
                                          handleUnbanDepot(depot.id)
                                        }
                                        disabled={banLoading === depot.id}
                                      >
                                        {banLoading === depot.id
                                          ? "⏳..."
                                          : "✅ Débannir"}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="depot-info">
                                  <p>
                                    <strong>Quartier:</strong> {depot.quartier}
                                  </p>
                                  <p>
                                    <strong>Latitude:</strong> {depot.latitude}
                                  </p>
                                  <p>
                                    <strong>Longitude:</strong>{" "}
                                    {depot.longitude}
                                  </p>
                                  {depot.subscription_expiry && (
                                    <p>
                                      <strong>Expiration:</strong>{" "}
                                      {new Date(
                                        depot.subscription_expiry,
                                      ).toLocaleDateString("fr-FR")}
                                    </p>
                                  )}
                                </div>

                                {/* Payment Button for Expired/Warning */}
                                {depot.payment_pending ? (
                                  <div className="payment-action">
                                    <button
                                      className="btn btn-payment btn-validate"
                                      onClick={() =>
                                        handleValidatePayment(
                                          depot.id,
                                          depot.payment_amount || 6000,
                                          depot.requested_tier || "none",
                                        )
                                      }
                                      disabled={paymentLoading === depot.id}
                                    >
                                      {paymentLoading === depot.id
                                        ? "⏳ Traitement..."
                                        : ` Valider ${depot.payment_amount?.toLocaleString()} FCFA (${depot.requested_tier === "none" ? "Standard" : depot.requested_tier?.toUpperCase()})`}
                                    </button>
                                    <small className="payment-info">
                                      Montant reçu:{" "}
                                      {depot.payment_amount?.toLocaleString()}{" "}
                                      FCFA
                                    </small>
                                  </div>
                                ) : (
                                  (isExpired || isWarning) && (
                                    <div className="payment-action">
                                      <button
                                        className="btn btn-payment"
                                        onClick={() =>
                                          handlePaymentDepot(depot.id)
                                        }
                                        disabled={paymentLoading === depot.id}
                                      >
                                        {paymentLoading === depot.id
                                          ? "⏳ Traitement..."
                                          : `💳 Payer 6000 FCFA (+30j)`}
                                      </button>
                                      <small className="payment-info">
                                        Numéro: +242 067 67 81 28 (Maman Power)
                                      </small>
                                    </div>
                                  )
                                )}

                                {/* Premium Tier Buttons - Only show if no payment pending */}
                                {!depot.payment_pending && (
                                  <div className="premium-upgrade-section">
                                    <div className="premium-title">
                                      💎 Système Premium (Classement Spécial)
                                    </div>
                                    <div className="premium-buttons">
                                      <button
                                        className="btn btn-premium btn-basic"
                                        onClick={() =>
                                          handleUpgradePremium(
                                            depot.id,
                                            "basic",
                                            10000,
                                          )
                                        }
                                        disabled={premiumLoading === depot.id}
                                        title="Top 15 par catégorie"
                                      >
                                        {premiumLoading === depot.id
                                          ? "⏳..."
                                          : "💎 10k (Top 15)"}
                                      </button>
                                      <button
                                        className="btn btn-premium btn-advanced"
                                        onClick={() =>
                                          handleUpgradePremium(
                                            depot.id,
                                            "advanced",
                                            15000,
                                          )
                                        }
                                        disabled={premiumLoading === depot.id}
                                        title="Top 10 par catégorie"
                                      >
                                        {premiumLoading === depot.id
                                          ? "⏳..."
                                          : "💎💎 15k (Top 10)"}
                                      </button>
                                      <button
                                        className="btn btn-premium btn-elite"
                                        onClick={() =>
                                          handleUpgradePremium(
                                            depot.id,
                                            "elite",
                                            20000,
                                          )
                                        }
                                        disabled={premiumLoading === depot.id}
                                        title="Top 3 par catégorie"
                                      >
                                        {premiumLoading === depot.id
                                          ? "⏳..."
                                          : "💎💎💎 20k (Top 3)"}
                                      </button>
                                    </div>
                                    <small className="premium-info">
                                      Les tiers premium garantissent une
                                      meilleure visibilité pour 30 jours
                                    </small>
                                  </div>
                                )}

                                {/* Products in this depot */}
                                {depot.products &&
                                  depot.products.length > 0 && (
                                    <div className="products-list">
                                      <strong>
                                        Produits ({depot.products.length})
                                      </strong>
                                      {depot.products.map(
                                        (product: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="product-item"
                                          >
                                            <span className="product-name">
                                              {product.name}
                                            </span>
                                            <span className="product-category">
                                              {product.category}
                                            </span>
                                            <span className="product-price">
                                              {product.price} FCFA/
                                              {product.unit}
                                            </span>
                                            <span className="product-stock">
                                              Stock: {product.stock_quantity}{" "}
                                              {product.unit}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="no-data">Impossible de charger les détails</div>
              )}
            </div>
          </div>
        )}

        {/* Contenu Gestion des Votes */}
        {activeTab === "votes" && (
          <div className="admin-votes-view">
            <VotingManagement />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
