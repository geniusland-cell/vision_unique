import { useState, ReactNode } from "react";
import DepotProducts from "./DepotProducts";
import { updateDepot, getDepotById } from "../firebase";
import ImageUpload from "./ImageUpload";
import type { Depot } from "../types";
import "./DepotCard.css";

interface DepotCardProps {
  depot: Depot;
  onDepotUpdated: (updatedDepot: Depot) => void;
}

export default function DepotCard({
  depot,
  onDepotUpdated,
}: DepotCardProps): ReactNode {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedDepot, setEditedDepot] = useState<Depot>(depot);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  if (!depot) {
    return <div className="depot-card"> Aucun dépôt trouvé</div>;
  }

  const handleSave = async () => {
    try {
      // Sauvegarder dans Firebase
      const result = await updateDepot(
        depot.id,
        editedDepot.name,
        editedDepot.phone,
        editedDepot.phone,
        editedDepot.promo_image_url,
        editedDepot.promo_video_url,
      );

      if (result.success) {
        // Recharger les données du dépôt depuis Firebase
        const reloadResult = await getDepotById(depot.id);
        if (reloadResult.success) {
          // Mettre à jour avec les données fraîches
          setEditedDepot(reloadResult.data);
          alert("✅ Dépôt mis à jour avec succès!");

          // Appeler le callback du parent pour recharger les données
          if (onDepotUpdated) {
            onDepotUpdated(reloadResult.data);
          }
        }
      } else {
        alert("❌ Erreur: " + result.error);
      }
    } catch {
      alert("❌ Erreur lors de la sauvegarde");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedDepot(depot);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: any) => {
    setEditedDepot({ ...editedDepot, [field]: value });
  };

  return (
    <div className="depot-card">
      {/* Header Compact */}
      <div className="depot-header-compact">
        <div className="depot-name-section">
          <h3> {depot.name}</h3>
          <span className="quartier-badge">📍 {depot.location}</span>
        </div>
        <div className="header-actions">
          <button
            className="details-toggle-btn"
            onClick={() => setShowDetails(!showDetails)}
            title="Afficher/Masquer les details"
          >
            {showDetails ? "▼ Détails" : "▶ Détails"}
          </button>
          {!isEditing && (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              ✏️
            </button>
          )}
        </div>
      </div>

      {/* Détails Collapsible */}
      {showDetails && (
        <div className="depot-details-collapse">
          <div className="detail-row">
            <label>☎️ Appel Direct</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedDepot.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Numéro direct"
              />
            ) : (
              <a href={`tel:${depot.phone}`} className="phone-link">
                {depot.phone}
              </a>
            )}
          </div>

          <div className="detail-row">
            <label>💬 WhatsApp</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedDepot.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Numéro WhatsApp"
              />
            ) : (
              <a
                href={`https://wa.me/${depot.phone?.replace(/[^\d+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="phone-link whatsapp-link"
              >
                {depot.phone}
              </a>
            )}
          </div>

          <div className="detail-row">
            <label>🏪 Nom du Dépôt</label>
            {isEditing ? (
              <input
                type="text"
                value={editedDepot.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nom du dépôt/boutique"
              />
            ) : (
              <span>{depot.name}</span>
            )}
          </div>

          <div className="detail-row">
            <label>✓ Statut</label>
            <span
              className={`status ${depot.is_active ? "active" : "inactive"}`}
            >
              {depot.is_active ? "🟢 Actif" : "🔴 Inactif"}
            </span>
          </div>

          {/* Premium Promo Fields - Only for advanced/elite tiers */}
          {isEditing &&
            (depot.tier === "advanced" || depot.tier === "elite") && (
              <>
                <div className="detail-row premium-field">
                  <label>🖼️ Image Promo</label>
                  <ImageUpload
                    onImageUpload={(url) =>
                      handleChange("promo_image_url", url)
                    }
                    depotId={depot.id}
                  />
                </div>
                {depot.tier === "elite" && (
                  <div className="detail-row premium-field">
                    <label>🎬 URL Vidéo Promo</label>
                    <input
                      type="url"
                      value={editedDepot.promo_video_url || ""}
                      onChange={(e) =>
                        handleChange("promo_video_url", e.target.value)
                      }
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                )}
              </>
            )}

          {/* Display Promo Content (View Mode) */}
          {!isEditing &&
            (depot.tier === "advanced" || depot.tier === "elite") && (
              <>
                {depot.promo_image_url && (
                  <div className="detail-row promo-display">
                    <label>🖼️ Image Promo</label>
                    <img
                      src={depot.promo_image_url}
                      alt="Promo"
                      className="promo-image"
                      onClick={() =>
                        window.open(depot.promo_image_url, "_blank")
                      }
                    />
                  </div>
                )}
                {depot.tier === "elite" && depot.promo_video_url && (
                  <div className="detail-row promo-display">
                    <label>🎬 Vidéo Promo</label>
                    <div className="promo-video-container">
                      <iframe
                        src={depot.promo_video_url}
                        className="promo-video"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </>
            )}

          {isEditing && (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave}>
                💾 Enregistrer
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                ✕ Annuler
              </button>
            </div>
          )}
        </div>
      )}

      {/* Produits du dépôt */}
      {isEditing && (
        <div className="edit-mode-header">
          <h4> Gestion des Produits</h4>
          <button
            className="close-edit-btn"
            onClick={handleCancel}
            title="Fermer"
          >
            Fermer
          </button>
        </div>
      )}
      <DepotProducts
        depot={depot}
        isEditing={isEditing}
        onClose={() => setIsEditing(false)}
      />

      {/* Indicateur de modification */}
      {isEditing && (
        <div className="edit-notice">⚠️ Vous etes en mode modification</div>
      )}
    </div>
  );
}
