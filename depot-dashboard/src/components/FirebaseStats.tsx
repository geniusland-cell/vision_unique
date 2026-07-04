import { useState, useEffect, ReactNode } from "react";
import "../styles/FirebaseStats.css";

interface FirebaseStatsData {
  totalReads: number;
  totalWrites: number;
  storageMB: number;
  networkRequests: number;
  lastUpdated: Date;
}

const FirebaseStats = (): ReactNode => {
  const [stats, setStats] = useState<FirebaseStatsData>({
    totalReads: 0,
    totalWrites: 0,
    storageMB: 0,
    networkRequests: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Limites mensuelles (Plan Spark Firebase)
  const LIMITS = {
    reads: 50000,
    writes: 20000,
    storage: 1024, // 1 GO en MB
  };

  useEffect(() => {
    loadFirebaseStats();
    const interval = setInterval(loadFirebaseStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadFirebaseStats = async () => {
    try {
      setLoading(true);
      // Note: Les stats d'utilisation Firebase ne sont disponibles que via la console Firebase
      // et l'API Cloud Monitoring. RTD n'expose pas les stats directement.
      // On affiche les limites et un message informatif pour que l'admin consulte la console
      setStats({
        totalReads: 0,
        totalWrites: 0,
        storageMB: 0,
        networkRequests: 0,
        lastUpdated: new Date(),
      });
      setError(
        "📍 Les statistiques détaillées sont disponibles dans la Console Firebase → Realtime Database → Usage",
      );
    } catch {
      setError("Impossible de charger les statistiques détaillées");
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (used: number, limit: number): number => {
    return Math.min((used / limit) * 100, 100);
  };

  const getAlertLevel = (percentage: number): "ok" | "warning" | "critical" => {
    if (percentage >= 95) return "critical";
    if (percentage >= 80) return "warning";
    return "ok";
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + " GB";
    }
    return bytes.toFixed(2) + " MB";
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("fr-FR");
  };

  const readsPercentage = getProgressPercentage(stats.totalReads, LIMITS.reads);
  const writesPercentage = getProgressPercentage(
    stats.totalWrites,
    LIMITS.writes,
  );
  const storagePercentage = getProgressPercentage(
    stats.storageMB,
    LIMITS.storage,
  );

  return (
    <div className="firebase-stats-container">
      <div className="stats-header">
        <h2>📊 Statistiques Firebase Realtime Database</h2>
        <div className="stats-refresh">
          <button onClick={loadFirebaseStats} disabled={loading}>
            {loading ? "⏳ Chargement..." : "🔄 Actualiser"}
          </button>
          <span className="last-updated">
            Mis à jour : {stats.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </div>
      </div>

      {error && <div className="stats-error">⚠️ {error}</div>}

      <div className="stats-grid">
        {/* Lectures */}
        <div className="stat-card">
          <div className="stat-title">📖 Lectures (Reads/mois)</div>
          <div className={`stat-gauge ${getAlertLevel(readsPercentage)}`}>
            <div className="gauge-bar">
              <div
                className="gauge-fill"
                style={{ width: `${readsPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatNumber(stats.totalReads)} / {formatNumber(LIMITS.reads)}
            </span>
            <span className="stat-percentage">
              {readsPercentage.toFixed(1)}%
            </span>
          </div>
          {getAlertLevel(readsPercentage) === "warning" && (
            <div className="stat-alert">⚠️ Approche de la limite</div>
          )}
          {getAlertLevel(readsPercentage) === "critical" && (
            <div className="stat-alert critical">
              🔴 Limite critique atteinte
            </div>
          )}
        </div>

        {/* Écritures */}
        <div className="stat-card">
          <div className="stat-title">✏️ Écritures (Writes/mois)</div>
          <div className={`stat-gauge ${getAlertLevel(writesPercentage)}`}>
            <div className="gauge-bar">
              <div
                className="gauge-fill"
                style={{ width: `${writesPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatNumber(stats.totalWrites)} / {formatNumber(LIMITS.writes)}
            </span>
            <span className="stat-percentage">
              {writesPercentage.toFixed(1)}%
            </span>
          </div>
          {getAlertLevel(writesPercentage) === "warning" && (
            <div className="stat-alert">⚠️ Approche de la limite</div>
          )}
          {getAlertLevel(writesPercentage) === "critical" && (
            <div className="stat-alert critical">
              🔴 Limite critique atteinte
            </div>
          )}
        </div>

        {/* Stockage */}
        <div className="stat-card">
          <div className="stat-title">💾 Stockage (Plan Spark)</div>
          <div className={`stat-gauge ${getAlertLevel(storagePercentage)}`}>
            <div className="gauge-bar">
              <div
                className="gauge-fill"
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatBytes(stats.storageMB)} / {formatBytes(LIMITS.storage)}
            </span>
            <span className="stat-percentage">
              {storagePercentage.toFixed(1)}%
            </span>
          </div>
          {getAlertLevel(storagePercentage) === "warning" && (
            <div className="stat-alert">⚠️ Approche de la limite</div>
          )}
          {getAlertLevel(storagePercentage) === "critical" && (
            <div className="stat-alert critical">
              🔴 Limite critique atteinte
            </div>
          )}
        </div>

        {/* Activité Réseau */}
        <div className="stat-card">
          <div className="stat-title">📡 Activité Réseau (24h)</div>
          <div className="stat-network">
            <div className="network-value">
              {formatNumber(stats.networkRequests)}
            </div>
            <div className="network-label">requêtes</div>
          </div>
          <div className="stat-info">
            <span className="stat-note">Nombre de requêtes réseau</span>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <p className="stats-legend">
          ℹ️ <strong>Plan Spark Firebase :</strong> 50k lectures/mois • 20k
          écritures/mois • 1 GO stockage gratuit
        </p>
        <p className="stats-note">
          💡 <strong>Conseil :</strong> Si vous dépassez 50k lectures/mois,
          passez au plan Blaze (pay-as-you-go) pour environ $1-10/mois selon
          votre utilisation.
        </p>
      </div>
    </div>
  );
};

export default FirebaseStats;
