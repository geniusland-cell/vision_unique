import { useState, ReactNode } from "react";

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

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Vérifier que les variables d'environnement sont configurées
  if (!cloudinaryCloudName || !uploadPreset) {
    return (
      <div style={{ color: "red", padding: "10px" }}>
        ⚠️ Erreur: Configuration Cloudinary manquante dans .env
      </div>
    );
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5000000) {
      setError("❌ Fichier trop volumineux (max 5MB)");
      return;
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith("image/")) {
      setError("❌ Veuillez sélectionner une image");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("cloud_name", cloudinaryCloudName);

      // Uploader directement vers l'API Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.secure_url) {
        setUploadedImageUrl(data.secure_url);
        onImageUpload(data.secure_url);
        setIsUploading(false);
      } else {
        throw new Error("Pas d'URL reçue de Cloudinary");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("❌ Erreur lors du téléchargement. Vérifiez votre connexion.");
      setIsUploading(false);
    }
  };

  const triggerFileInput = (useCamera: boolean = false) => {
    const input = document.createElement("input");
    input.type = "file";
    
    // Important: Fixer capture AVANT accept pour éviter les conflits
    if (useCamera) {
      input.capture = "environment"; // Caméra arrière (dos du téléphone)
      input.accept = "image/*";
    } else {
      input.accept = "image/*";
      // PAS de capture pour la galerie
    }

    input.onchange = (e) =>
      handleFileSelect(e as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-content">
        <div className="image-upload-buttons">
          <button
            type="button"
            onClick={() => triggerFileInput(true)}
            disabled={isUploading}
            className="image-upload-btn"
            title="Prendre une photo directe"
          >
            {isUploading ? "⏳" : "📸"}
          </button>
          <button
            type="button"
            onClick={() => triggerFileInput(false)}
            disabled={isUploading}
            className="image-upload-btn"
            title="Choisir une image de la galerie"
          >
            {isUploading ? "⏳" : "🖼️"}
          </button>
        </div>

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
