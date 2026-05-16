import { useState, useEffect, ReactNode } from "react";
import {
  getAllManagers,
  getManagerDetailsForAdmin,
  banManager,
  unbanManager,
} from "../firebase";
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
    } catch (error) {
      console.error("Erreur lors du chargement des managers:", error);
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
        console.error("Erreur:", result?.error);
      }
      setSelectedManager(managerId);
    } catch (error) {
      console.error("Erreur lors du chargement des détails du manager:", error);
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
      } catch (error) {
        console.error("Erreur lors du bannissement du manager:", error);
      }
    }
  };

  const handleUnbanManager = async (managerId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir débannir ce manager?")) {
      try {
        await unbanManager(managerId);
        loadManagers();
        if (selectedManager === managerId) {
          loadManagerDetails(managerId);
        }
      } catch (error) {
        console.error("Erreur lors du débannissement du manager:", error);
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
                  <span className="label">Statut:</span>
                  <span
                    className={`status ${managerDetails.is_active ? "active" : "banned"}`}
                  >
                    {managerDetails.is_active ? "Actif" : "Banni"}
                  </span>
                </div>
              </div>

              {/* Depots Section */}
              {managerDetails.depots && managerDetails.depots.length > 0 && (
                <div className="details-section">
                  <h3>Dépôts ({managerDetails.depots.length})</h3>
                  <div className="depots-list">
                    {managerDetails.depots.map((depot: any) => (
                      <div key={depot.id} className="depot-item">
                        <h4>{depot.name}</h4>
                        <div className="depot-info">
                          <p>
                            <strong>Quartier:</strong> {depot.quartier}
                          </p>
                          <p>
                            <strong>Latitude:</strong> {depot.latitude}
                          </p>
                          <p>
                            <strong>Longitude:</strong> {depot.longitude}
                          </p>
                        </div>

                        {/* Products in this depot */}
                        {depot.products && depot.products.length > 0 && (
                          <div className="products-list">
                            <strong>Produits ({depot.products.length})</strong>
                            {depot.products.map((product: any, idx: number) => (
                              <div key={idx} className="product-item">
                                <span className="product-name">
                                  {product.name}
                                </span>
                                <span className="product-category">
                                  {product.category}
                                </span>
                                <span className="product-price">
                                  {product.price} FCFA/{product.unit}
                                </span>
                                <span className="product-stock">
                                  Stock: {product.stock_quantity} {product.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-data">Impossible de charger les détails</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
