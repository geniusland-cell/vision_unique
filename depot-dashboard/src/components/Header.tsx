import { ReactNode } from "react";
import type { User } from "../types";
import "./Header.css";

interface HeaderProps {
  user: User | null;
  onLogout: () => Promise<void>;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
  onShowVotingChart?: () => void;
}

const Header = ({
  user,
  onLogout,
  onToggleDarkMode,
  isDarkMode,
  onShowVotingChart,
}: HeaderProps): ReactNode => {
  return (
    <div className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">D</div>
          <span>DÉPÔT DASHBOARD</span>
        </div>
        <div className="user-info">
          {user && (
            <>
              <span>
                {user.name} ({user.role})
              </span>
              <div className="user-avatar">
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word.charAt(0))
                  .join("")
                  .toUpperCase()}
              </div>
            </>
          )}
          {onShowVotingChart && (
            <button
              className="voting-chart-btn"
              onClick={onShowVotingChart}
              title="Voir le classement des votes"
            >
              📊 Classement
            </button>
          )}
          <button
            className="dark-mode-toggle"
            onClick={onToggleDarkMode}
            title="Toggle Mode Sombre"
          >
            {isDarkMode ? "S" : "N"}
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
