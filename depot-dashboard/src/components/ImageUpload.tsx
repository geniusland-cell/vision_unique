import { useEffect, useState, ReactNode } from "react";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  buttonText?: string;
}

export default function ImageUpload({
  onImageUpload,
  buttonText = "📸 Importer image",
}: ImageUploadProps): ReactNode {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState<boolean>(false);

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Charger le widget Cloudinary au montage
  useEffect(() => {
    if (window.cloudinary) {
      setIsWidgetReady(true);
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    const loadWidget = () => {
      const script = document.createElement("script");
      // URL correcte du widget Cloudinary
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;

      // Marquer le widget comme prêt quand le script charge
      script.onload = () => {
        // Attendre que cloudinary soit disponible
        const checkCloudinary = setInterval(() => {
          if (window.cloudinary) {
            setIsWidgetReady(true);
            setError(null);
            clearInterval(checkCloudinary);
          }
        }, 100);

        // Timeout après 5 secondes
        setTimeout(() => clearInterval(checkCloudinary), 5000);
      };

      script.onerror = () => {
        retries++;
        if (retries < maxRetries) {
          // Retry après 2 secondes
          setTimeout(() => loadWidget(), 2000);
        } else {
          setError(
            "❌ Erreur: Impossible de charger le widget. Vérifiez votre connexion réseau.",
          );
        }
      };

      document.body.appendChild(script);
    };

    loadWidget();
  }, []);

  // Vérifier que les variables d'environnement sont configurées
  if (!cloudinaryCloudName || !uploadPreset) {
    return (
      <div style={{ color: "red", padding: "10px" }}>
        ⚠️ Erreur: Configuration Cloudinary manquante dans .env
      </div>
    );
  }

  const handleOpenWidget = () => {
    if (!isWidgetReady || !window.cloudinary) {
      setError("⏳ Widget en cours de chargement... Veuillez patienter");
      return;
    }

    setIsUploading(true);
    setError(null);

    // Créer une instance du widget
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudinaryCloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "url", "camera"], // Allow camera, URL, and local file
        multiple: false, // Only one image
        maxFileSize: 5000000, // 5MB max
        clientAllowedFormats: ["image"], // Only image formats
        autoMinimize: true,
        showAdvancedOptions: false,
        showPoweredBy: false,
        theme: "light",
      },
      (error: any, result: any) => {
        if (error) {
          console.error("Upload error:", error);
          setError("❌ Erreur lors de l'upload");
          setIsUploading(false);
        }

        if (result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          setUploadedImageUrl(imageUrl);
          onImageUpload(imageUrl);
          setIsUploading(false);
        }

        if (result && result.event === "close") {
          setIsUploading(false);
        }
      },
    );

    // Ouvrir le widget
    widget.open();
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-content">
        <button
          type="button"
          onClick={handleOpenWidget}
          disabled={isUploading || !isWidgetReady}
          className="image-upload-btn"
          title={!isWidgetReady ? "Widget en cours de chargement..." : ""}
        >
          {isUploading
            ? "⏳ Upload en cours..."
            : !isWidgetReady
              ? "⏳ Chargement..."
              : buttonText}
        </button>

        {uploadedImageUrl && (
          <div className="image-preview">
            <img src={uploadedImageUrl} alt="Preview" className="preview-img" />
            <p className="image-url-text">{uploadedImageUrl}</p>
          </div>
        )}

        {error && <div className="image-upload-error">{error}</div>}
      </div>
    </div>
  );
}

// Extend window type to include Cloudinary
declare global {
  interface Window {
    cloudinary: any;
  }
}
