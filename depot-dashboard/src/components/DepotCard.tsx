import { useState, useEffect, ReactNode } from "react";
import DepotProducts from "./DepotProducts";
import { updateDepot, getDepotById } from "../firebase";
import { getWhatsAppGroupByDepotId } from "../services/whatsappGroupService";
import ImageUpload from "./ImageUpload";
import { MapPin, Phone, MessageCircle, Store, CheckCircle, XCircle, Image as ImageIcon, Video, Smartphone, Lock, X, Edit, Save, AlertTriangle } from "lucide-react";
import type { Depot } from "../types";
import type { WhatsAppGroup } from "../types/whatsapp";
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
  const [whatsappGroup, setWhatsappGroup] = useState<WhatsAppGroup | null>(null);

  useEffect(() => {
    const loadWhatsAppGroup = async () => {
      if (depot.tier === "Advanced" || depot.tier === "Elite") {
        try {
          const response = await getWhatsAppGroupByDepotId(depot.id);
          if (response.success && response.data) {
            setWhatsappGroup(response.data);
          }
        } catch (err) {
          console.error("Erreur chargement groupe WhatsApp:", err);
        }
      }
    };

    loadWhatsAppGroup();
  }, [depot.id, depot.tier]);

  if (!depot) {
    return <div className="depot-card"> Aucun dépôt trouvé</div>;
  }

  const handleSave = async () => {
    try {
      // Sauvegarder dans Firebase
      const result = await updateDepot(
        depot.id,
        editedDepot.name,
        editedDepot.phone_direct || "",
        editedDepot.phone_whatsapp || "",
        editedDepot.promo_image_url,
        editedDepot.promo_video_url,
      );

      if (result.success) {
        // Recharger les données du dépôt depuis Firebase
        const reloadResult = await getDepotById(depot.id);
        if (reloadResult.success) {
          // Mettre à jour avec les données fraîches
          setEditedDepot(reloadResult.data);
          alert("Dépôt mis à jour avec succès!");

          // Appeler le callback du parent pour recharger les données
          if (onDepotUpdated) {
            onDepotUpdated(reloadResult.data);
          }
        }
      } else {
        alert("Erreur: " + result.error);
      }
    } catch {
      alert("Erreur lors de la sauvegarde");
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
          <h3> {editedDepot.name}</h3>
          <span className="quartier-badge"><MapPin size={16} /> {depot.location}</span>
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
              <Edit size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Détails Collapsible */}
      {showDetails && (
        <div className="depot-details-collapse">
          <div className="detail-row">
            <label><Phone size={16} /> Appel Direct</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedDepot.phone_direct || ""}
                onChange={(e) => handleChange("phone_direct", e.target.value)}
                placeholder="Numéro direct"
              />
            ) : (
              <a href={`tel:${editedDepot.phone_direct || editedDepot.phone || ""}`} className="phone-link">
                {editedDepot.phone_direct || editedDepot.phone || ""}
              </a>
            )}
          </div>

          <div className="detail-row">
            <label><MessageCircle size={16} /> WhatsApp</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedDepot.phone_whatsapp || ""}
                onChange={(e) => handleChange("phone_whatsapp", e.target.value)}
                placeholder="Numéro WhatsApp"
              />
            ) : (
              <a
                href={`https://wa.me/${(editedDepot.phone_whatsapp || editedDepot.phone || "").replace(/[^\d+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="phone-link whatsapp-link"
              >
                {editedDepot.phone_whatsapp || editedDepot.phone || ""}
              </a>
            )}
          </div>

          <div className="detail-row">
            <label><Store size={16} /> Nom du Dépôt</label>
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
            <label>Statut</label>
            <span
              className={`status ${depot.is_active ? "active" : "inactive"}`}
            >
              {depot.is_active ? <><CheckCircle size={16} /> Actif</> : <><XCircle size={16} /> Inactif</>}
            </span>
          </div>

          {/* Premium Promo Fields - Only for Advanced/Elite tiers */}
          {isEditing &&
            (depot.tier === "Advanced" || depot.tier === "Elite") && (
              <>
                <div className="detail-row premium-field">
                  <label><ImageIcon size={16} /> Image Promo</label>
                  <ImageUpload
                    onImageUpload={(url) =>
                      handleChange("promo_image_url", url)
                    }
                    depotId={depot.id}
                  />
                </div>
                {depot.tier === "Elite" && (
                  <div className="detail-row premium-field">
                    <label><Video size={16} /> URL Vidéo Promo</label>
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
            (depot.tier === "Advanced" || depot.tier === "Elite") && (
              <>
                {depot.promo_image_url && (
                  <div className="detail-row promo-display">
                    <label><ImageIcon size={16} /> Image Promo</label>
                    <img
                      src={depot.promo_image_url}
                      alt="Promo"
                      className="promo-image"
                      onClick={() =>
                        depot.promo_image_url &&
                        window.open(depot.promo_image_url, "_blank")
                      }
                    />
                  </div>
                )}
                {depot.tier === "Elite" && depot.promo_video_url && (
                  <div className="detail-row promo-display">
                    <label><Video size={16} /> Vidéo Promo</label>
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

          {/* WhatsApp Group Status for Advanced/Elite */}
          {!isEditing &&
            (depot.tier === "Advanced" || depot.tier === "Elite") && (
              <div className="detail-row whatsapp-group-status">
                <label><Smartphone size={16} /> Groupe WhatsApp Privé</label>
                {whatsappGroup ? (
                  <div className="group-status-active">
                    <span className="status-indicator"><CheckCircle size={16} /> Actif</span>
                    <span className="member-count">
                      {whatsappGroup.nombreMembres} membres
                    </span>
                    <a
                      href={whatsappGroup.lienInvitation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group-link-btn"
                    >
                      Voir le groupe
                    </a>
                  </div>
                ) : (
                  <span className="status-indicator inactive">
                    <Lock size={16} /> Non configuré
                  </span>
                )}
              </div>
            )}

          {isEditing && (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave}>
                <Save size={16} /> Enregistrer
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                <X size={16} /> Annuler
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
        <div className="edit-notice"><AlertTriangle size={16} /> Vous etes en mode modification</div>
      )}
    </div>
  );
}
