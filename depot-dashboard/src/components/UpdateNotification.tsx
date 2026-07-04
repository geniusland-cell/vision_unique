import { useState, useEffect, ReactNode } from "react";

export default function UpdateNotification(): ReactNode {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Écouter les événements du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Un nouveau SW est devenu actif - mise à jour appliquée
        setUpdateAvailable(false);
      });
    }

    // Vérifier régulièrement les mises à jour
    const checkForUpdates = async () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        // Envoyer un message au SW pour vérifier les mises à jour
        navigator.serviceWorker.controller.postMessage({
          type: "SKIP_WAITING",
        });

        // Faire une requête au manifest pour détecter les changements
        try {
          const response = await fetch("/manifest.webmanifest");
          const manifest = await response.json();

          // Si on arrive ici, il y a peut-être une mise à jour
          const currentVersion = sessionStorage.getItem("app_version");
          const newVersion =
            manifest.version || new Date().getTime().toString();

          if (currentVersion && currentVersion !== newVersion) {
            setUpdateAvailable(true);
          }
          sessionStorage.setItem("app_version", newVersion);
        } catch {}
      }
    };

    // Vérifier à l'ouverture
    checkForUpdates();

    // Vérifier toutes les heures (au lieu de 5 minutes)
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Recharger la page pour charger la nouvelle version
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <span className="update-message">✨ Nouvelle version disponible !</span>
        <button className="update-button" onClick={handleUpdate}>
          Mettre à jour maintenant
        </button>
        <button
          className="update-close"
          onClick={() => setUpdateAvailable(false)}
          title="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
