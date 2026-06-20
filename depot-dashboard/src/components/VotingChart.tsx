import { useEffect, useState, ReactNode } from "react";
import { getVotingRankings, getCurrentQuarter } from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./VotingChart.css";

interface VotingChartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RankingItem {
  depotId: string;
  vote_count: number;
  depot_name?: string;
}

const VotingChart = ({ isOpen, onClose }: VotingChartProps): ReactNode => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");

  // Charger les données
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getVotingRankings();
        setRankings(data);
        setQuarter(getCurrentQuarter());
        setLoading(false);
      } catch (err) {
        console.error(" Erreur chargement données:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Transformer les données pour Recharts
  const chartData = rankings.map((depot, index) => ({
    name: depot.depot_name || `Dépôt ${index + 1}`,
    votes: depot.vote_count,
    rank: index + 1,
    fill:
      index === 0
        ? "#FFD700"
        : index === 1
          ? "#C0C0C0"
          : index === 2
            ? "#CD7F32"
            : "#4F46E5",
  }));

  return (
    <div className="voting-chart-overlay" onClick={onClose}>
      <div className="voting-chart-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chart-header">
          <h1>📈 Classement des Votes - {quarter}</h1>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="chart-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner">⏳</div>
              <p>Chargement du graphique...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Aucun vote enregistré pour le moment</p>
              <p className="empty-subtitle">
                Attendez que vos mamans votent pour les dépôts!
              </p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis
                    label={{
                      value: "Votes",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} votes`, "Nombre de votes"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="votes" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingChart;
