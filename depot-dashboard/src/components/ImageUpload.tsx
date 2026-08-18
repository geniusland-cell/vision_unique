import { useState, ReactNode } from "react";
import imageCompression from "browser-image-compression";
import { uploadDepotImage } from "../firebase";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  depotId: string;
  buttonText?: string;
  hidePreview?: boolean; // Option pour cacher le preview si l'image est affichée ailleurs
}

export default function ImageUpload({
  onImageUpload,
  depotId,
  hidePreview = false,
}: ImageUploadProps): ReactNode {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith("image/")) {
      setError("❌ Veuillez sélectionner une image");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Options de compression
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      // Compresser l'image côté client
      const compressedFile = await imageCompression(file, options);

      console.log(
        `Image compressée: ${file.size} -> ${compressedFile.size} bytes`,
      );

      // Uploader vers Firebase Storage
      const result = await uploadDepotImage(compressedFile, depotId);

      if (result.success && result.data) {
        setUploadedImageUrl(result.data);
        onImageUpload(result.data);
        setIsUploading(false);
      } else {
        throw new Error(result.error || "Erreur upload Firebase");
      }
    } catch {
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
      handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
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

        {uploadedImageUrl && !hidePreview && (
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
