import { useState, useEffect, ReactNode } from "react";
import {
  getAllWhatsAppGroups,
  getAdvancedEliteDepots,
  createWhatsAppGroup,
  updateWhatsAppGroupLink,
  updateMemberCount,
} from "../services/whatsappGroupService";
import type { WhatsAppGroup } from "../types/whatsapp";
import "./WhatsAppGroupsManagement.css";

export default function WhatsAppGroupsManagement(): ReactNode {
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>([]);
  const [advancedEliteDepots, setAdvancedEliteDepots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [lienInvitation, setLienInvitation] = useState("");
  const [adminSecondaire, setAdminSecondaire] = useState("");
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [newLien, setNewLien] = useState("");
  const [newMemberCount, setNewMemberCount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsResponse, depotsResponse] = await Promise.all([
        getAllWhatsAppGroups(),
        getAdvancedEliteDepots(),
      ]);

      if (groupsResponse.success) {
        setWhatsappGroups(groupsResponse.data || []);
      }
      if (depotsResponse.success) {
        setAdvancedEliteDepots(depotsResponse.data || []);
      }
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepot || !lienInvitation || !adminSecondaire) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const selectedDepotData = advancedEliteDepots.find(
      (d) => d.id === selectedDepot,
    );

    if (!selectedDepotData) {
      alert("Dépôt non trouvé");
      return;
    }

    try {
      const response = await createWhatsAppGroup(
        selectedDepot,
        selectedDepotData.name || selectedDepotData.depot_name,
        lienInvitation,
        adminSecondaire,
      );

      if (response.success) {
        alert("Groupe WhatsApp créé avec succès!");
        setShowCreateForm(false);
        setSelectedDepot("");
        setLienInvitation("");
        setAdminSecondaire("");
        loadData();
      } else {
        alert(`Erreur: ${response.error}`);
      }
    } catch (err) {
      alert("Erreur lors de la création du groupe");
    }
  };

  const handleUpdateLink = async () => {
    if (!editingGroup || !newLien) {
      alert("Veuillez entrer un nouveau lien");
      return;
    }

    try {
      const response = await updateWhatsAppGroupLink(editingGroup.id, newLien);
      if (response.success) {
        alert("Lien mis à jour avec succès!");
        setEditingGroup(null);
        setNewLien("");
        loadData();
      } else {
        alert(`Erreur: ${response.error}`);
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour du lien");
    }
  };

  const handleUpdateMemberCount = async () => {
    if (!editingGroup || !newMemberCount) {
      alert("Veuillez entrer un nombre de membres");
      return;
    }

    try {
      const count = parseInt(newMemberCount, 10);
      if (isNaN(count) || count < 0) {
        alert("Nombre invalide");
        return;
      }

      const response = await updateMemberCount(editingGroup.id, count);
      if (response.success) {
        alert("Nombre de membres mis à jour!");
        setEditingGroup(null);
        setNewMemberCount("");
        loadData();
      } else {
        alert(`Erreur: ${response.error}`);
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const getDepotsWithoutGroup = () => {
    const depotIdsWithGroups = new Set(
      whatsappGroups.map((g) => g.depotId),
    );
    return advancedEliteDepots.filter((d) => !depotIdsWithGroups.has(d.id));
  };

  if (loading) {
    return <div className="whatsapp-management loading">Chargement...</div>;
  }

  return (
    <div className="whatsapp-management">
      <h2 className="section-title">Gestion des Groupes WhatsApp</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-number">{whatsappGroups.length}</span>
          <span className="stat-label">Groupes actifs</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{getDepotsWithoutGroup().length}</span>
          <span className="stat-label">Dépôts sans groupe</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {whatsappGroups.reduce((sum, g) => sum + g.nombreMembres, 0)}
          </span>
          <span className="stat-label">Total membres</span>
        </div>
      </div>

      <button
        className="create-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? "Annuler" : "+ Créer un groupe"}
      </button>

      {showCreateForm && (
        <form className="create-form" onSubmit={handleCreateGroup}>
          <h3>Créer un groupe WhatsApp</h3>
          
          <div className="form-group">
            <label>Dépôt:</label>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              required
            >
              <option value="">Sélectionner un dépôt</option>
              {getDepotsWithoutGroup().map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name || depot.depot_name} ({depot.tier}) - WA: {depot.phone_whatsapp || depot.phone || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Lien d'invitation WhatsApp:</label>
            <input
              type="url"
              value={lienInvitation}
              onChange={(e) => setLienInvitation(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              required
            />
          </div>

          <div className="form-group">
            <label>Admin secondaire (nom du gérant):</label>
            <input
              type="text"
              value={adminSecondaire}
              onChange={(e) => setAdminSecondaire(e.target.value)}
              placeholder="Ex: Chez Mama Jeanne"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Créer le groupe
          </button>
        </form>
      )}

      <div className="groups-list">
        <h3>Groupes existants</h3>
        {whatsappGroups.length === 0 ? (
          <p className="no-groups">Aucun groupe créé</p>
        ) : (
          whatsappGroups.map((group) => {
            const depot = advancedEliteDepots.find((d) => d.id === group.depotId);
            return (
              <div key={group.depotId} className="group-card">
                <div className="group-info">
                  <h4>{group.depotName || `Dépôt ${group.depotId}`}</h4>
                  <p className="group-details">
                    <span>👥 {group.nombreMembres} membres</span>
                    <span>👤 {group.adminSecondaire}</span>
                    {depot && (
                      <span>📱 WA: {depot.phone_whatsapp || depot.phone || "N/A"}</span>
                    )}
                  </p>
                  <a
                    href={group.lienInvitation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group-link"
                  >
                    {group.lienInvitation}
                  </a>
                </div>
                
                <div className="group-actions">
                  <button
                    onClick={() => {
                      setEditingGroup(group);
                      setNewLien(group.lienInvitation);
                    }}
                    className="action-btn"
                  >
                    Modifier le lien
                  </button>
                  <button
                    onClick={() => {
                      setEditingGroup(group);
                      setNewMemberCount(group.nombreMembres.toString());
                    }}
                    className="action-btn"
                  >
                    Modifier membres
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingGroup && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Modifier le groupe</h3>
            
            {newLien && (
              <div className="form-group">
                <label>Nouveau lien d'invitation:</label>
                <input
                  type="url"
                  value={newLien}
                  onChange={(e) => setNewLien(e.target.value)}
                />
                <button onClick={handleUpdateLink} className="submit-btn">
                  Mettre à jour le lien
                </button>
              </div>
            )}

            {newMemberCount && (
              <div className="form-group">
                <label>Nombre de membres:</label>
                <input
                  type="number"
                  value={newMemberCount}
                  onChange={(e) => setNewMemberCount(e.target.value)}
                  min="0"
                />
                <button onClick={handleUpdateMemberCount} className="submit-btn">
                  Mettre à jour
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setEditingGroup(null);
                setNewLien("");
                setNewMemberCount("");
              }}
              className="cancel-btn"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
