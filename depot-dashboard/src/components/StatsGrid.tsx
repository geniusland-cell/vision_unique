import { ReactNode } from "react";
import type { Product } from "../types";
import "./StatsGrid.css";

interface StatsGridProps {
  products: Product[];
}

const StatsGrid = ({ products }: StatsGridProps): ReactNode => {
  // Calculer les stats dynamiquement
  const getTotalQualities = (): number => {
    if (!products) return 0;
    return products.length;
  };

  const getTotalStockValue = () => {
    if (!products) return 0;
    return products.reduce((sum, product) => {
      return sum + (product.stock_quantity ?? 0) * (product.price || 0);
    }, 0);
  };

  const getTotalStock = () => {
    if (!products) return 0;
    return products.reduce((sum, product) => {
      return sum + (product.stock_quantity ?? 0);
    }, 0);
  };

  const getTotalCategories = () => {
    if (!products) return 0;
    const uniqueCategories = new Set(
      products.map((p) => p.category).filter(Boolean),
    );
    return uniqueCategories.size;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("fr-FR") + " FCFA";
  };

  const stats = [
    {
      id: "categories",
      icon: "",
      number: getTotalCategories(),
      label: "Catégories",
    },
    {
      id: "qualities",
      icon: "",
      number: getTotalQualities(),
      label: "Qualités totales",
    },
    {
      id: "stock",
      icon: "",
      number: getTotalStock().toLocaleString("fr-FR"),
      label: "Stock total",
    },
    {
      id: "revenue",
      icon: "💰",
      number: formatCurrency(getTotalStockValue()),
      label: "Valeur totale",
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.id} className="stat-card">
          <div className={`stat-icon ${stat.id}`}>{stat.icon}</div>
          <div className="stat-number">{stat.number}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
