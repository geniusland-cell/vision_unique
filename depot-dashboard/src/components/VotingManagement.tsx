import { useState, useEffect, ReactNode } from "react";
import {
  getCurrentQuarter,
  getVotingRankings,
  getVotingStatus,
  launchVoting,
  closeVoting,
  resetVoting,
  updateVotingDuration,
  upgradeTier,
  removeTier,
  getTierPrice,
} from "../firebase";
import "../styles/VotingManagement.css";

interface VotingManagementProps {}

interface VotingSettings {
  status: "PENDING" | "VOTING_ACTIVE" | "VOTING_CLOSED";
  started_at: string | null;
  voting_period_days: number;
  ends_at: string | null;
}

function VotingManagement({}: VotingManagementProps): ReactNode {
  const [currentQuarter, setCurrentQuarter] = useState<string>("");
  const [votingSettings, setVotingSettings] = useState<VotingSettings>({
    status: "PENDING",
    started_at: null,
    voting_period_days: 3,
    ends_at: null,
  });
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<
    "basic" | "advanced" | "elite"
  >("basic");
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");

  useEffect(() => {
    loadVotingData();
  }, []);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      const quarter = getCurrentQuarter();
      setCurrentQuarter(quarter);

      const status = await getVotingStatus();
      setVotingSettings({
        status: status.status,
        started_at: status.started_at,
        voting_period_days: status.voting_duration_days || 3,
        ends_at: status.ends_at,
      });

      const rankingsResult = await getVotingRankings();
      setRankings(rankingsResult || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoting = async () => {
    try {
      setLoading(true);
      const result = await launchVoting(votingSettings.voting_period_days);

      if (result.success) {
        alert(
          `✅ Votes lancés pour ${votingSettings.voting_period_days} jours!\n\n` +
            `🙏 COLLECTE DE SOUTIEN TRIMESTRIELLE ACTIVÉE\n\n` +
            `La collecte de soutien de 1 000 FCFA à 15 000 FCFA est maintenant active.\n` +
            `Les utilisatrices verront le message de collecte après chaque vote.\n\n` +
            `� Paiement par dépôt sur: 06 767 81 28\n` +
            `💬 WhatsApp pour explications: 06 767 81 28`,
        );
        loadVotingData();
      } else {
        alert("❌ Erreur: " + result.error);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    try {
      setLoading(true);
      const result = await closeVoting();

      if (result.success) {
        alert("✅ Votes fermés! Délibération en cours...");
        loadVotingData();
      } else {
        alert("❌ Erreur: " + result.error);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleResetVoting = async () => {
    try {
      setLoading(true);
      const result = await resetVoting();

      if (result.success) {
        alert(
          "✅ Cycle de vote réinitialisé! Tous les votes du trimestre ont été supprimés. Vous pouvez maintenant relancer les votes.",
        );
        loadVotingData();
      } else {
        alert("❌ Erreur: " + result.error);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleUpdateDuration = async () => {
    try {
      setLoading(true);
      const result = await updateVotingDuration(
        votingSettings.voting_period_days,
      );

      if (result.success) {
        alert("✅ Durée des votes mise à jour");
        loadVotingData();
      } else {
        alert("❌ Erreur: " + result.error);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleUpgradeTier = async () => {
    if (!selectedDepotId) {
      alert("Sélectionnez un dépôt");
      return;
    }

    try {
      setLoading(true);
      const result = await upgradeTier(selectedDepotId, selectedTier);

      if (result.success) {
        alert(
          `✅ ${selectedTier.toUpperCase()} activé! Prix: ${getTierPrice(selectedTier)} FCFA`,
        );
        loadVotingData();
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleRemoveTier = async (depotId: string) => {
    if (!window.confirm("Retirer le tier premium?")) return;

    try {
      setLoading(true);
      const result = await removeTier(depotId);

      if (result.success) {
        alert("✅ Tier supprimé");
        loadVotingData();
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="voting-management">
      <h2>🗳️ Gestion des Votes & Tiers Premium</h2>

      {/* Section État */}
      <div className="voting-status">
        <h3>📊 Trimestre {currentQuarter}</h3>
        <div className={`status-badge ${votingSettings.status.toLowerCase()}`}>
          {votingSettings.status === "PENDING" && "⏳ En attente"}
          {votingSettings.status === "VOTING_ACTIVE" && "🟢 Votes actifs"}
          {votingSettings.status === "VOTING_CLOSED" && "🔴 Votes fermés"}
        </div>

        {votingSettings.ends_at && (
          <p>Fin prévue: {new Date(votingSettings.ends_at).toLocaleString()}</p>
        )}
      </div>

      {/* Section Contrôles des Votes */}
      <div className="voting-controls">
        <h3>⚙️ Contrôle des Votes</h3>

        <div className="control-input">
          <label>Durée de vote (jours):</label>
          <input
            type="number"
            min="1"
            max="30"
            value={votingSettings.voting_period_days}
            onChange={(e) =>
              setVotingSettings({
                ...votingSettings,
                voting_period_days: Number.isNaN(parseInt(e.target.value))
                  ? 3
                  : parseInt(e.target.value),
              })
            }
            disabled={loading || votingSettings.status === "VOTING_CLOSED"}
          />
        </div>

        <button
          className="btn-start"
          onClick={handleStartVoting}
          disabled={loading || votingSettings.status !== "PENDING"}
        >
          🟢 Lancer les votes
        </button>

        <button
          className="btn-update"
          onClick={handleUpdateDuration}
          disabled={loading || votingSettings.status === "VOTING_CLOSED"}
        >
          📝 Modifier la durée
        </button>

        <button
          className="btn-close"
          onClick={handleCloseVoting}
          disabled={loading || votingSettings.status !== "VOTING_ACTIVE"}
        >
          🔴 Fermer les votes
        </button>

        <button
          className="btn-reset"
          onClick={handleResetVoting}
          disabled={loading || votingSettings.status === "PENDING"}
        >
          🔄 Réinitialiser le cycle
        </button>
      </div>

      {/* Section Tiers Premium */}
      <div className="tier-management">
        <h3>💰 Gestion des Tiers Premium</h3>

        <div className="tier-input-group">
          <select
            value={selectedDepotId}
            onChange={(e) => setSelectedDepotId(e.target.value)}
            className="depot-select"
          >
            <option value="">-- Sélectionner un dépôt --</option>
            {rankings.map((depot) => (
              <option key={depot.depotId} value={depot.depotId}>
                {depot.depot_name} (Votes: {depot.vote_count})
              </option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
          >
            <option value="basic">
              🟦 BASIC - 20 000 FCFA (TOP 15 par catégorie)
            </option>
            <option value="advanced">
              🟨 ADVANCED - 25 000 FCFA (TOP 10 par catégorie)
            </option>
            <option value="elite">
              🟥 ELITE - 30 000 FCFA (TOP 3 par catégorie)
            </option>
          </select>

          <button
            className="btn-upgrade"
            onClick={handleUpgradeTier}
            disabled={loading || !selectedDepotId}
          >
            ✨ Upgrader Tier
          </button>
        </div>
      </div>

      {/* Section Résultats du Vote */}
      <div className="voting-results">
        <h3>🏆 Résultats du Trimestre</h3>

        <table className="rankings-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Dépôt</th>
              <th>Votes</th>
              <th>Tier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length > 0 ? (
              rankings.map((depot, index) => (
                <tr key={depot.depotId}>
                  <td>
                    {index === 0 && "🥇"} {index === 1 && "🥈"}{" "}
                    {index === 2 && "🥉"} #{index + 1}
                  </td>
                  <td>{depot.depot_name}</td>
                  <td className="vote-count">{depot.vote_count}</td>
                  <td>
                    <span className={`tier-badge ${depot.tier || "none"}`}>
                      {!depot.tier || depot.tier === "none"
                        ? "Gratuit"
                        : depot.tier.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {depot.tier && depot.tier !== "none" && (
                      <button
                        className="btn-remove-tier"
                        onClick={() => handleRemoveTier(depot.depotId)}
                      >
                        ✕ Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="no-data">
                  Aucun vote enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section Tarifs */}
      <div className="pricing-info">
        <h3>💵 Tarifs des Tiers</h3>
        <div className="pricing-grid">
          <div className="pricing-card basic">
            <h4>🟦 BASIC</h4>
            <p className="price">20 000 FCFA</p>
            <p>Top 15 par catégorie</p>
          </div>
          <div className="pricing-card advanced">
            <h4>🟨 ADVANCED</h4>
            <p className="price">25 000 FCFA</p>
            <p>Top 10 par catégorie</p>
          </div>
          <div className="pricing-card elite">
            <h4>🟥 ELITE</h4>
            <p className="price">30 000 FCFA</p>
            <p>Top 3 par catégorie</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VotingManagement;
