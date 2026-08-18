/**
 * Uploader une image vers Cloudinary (Unsigned Upload - sécurisé côté client)
 * Utilise un upload preset pour éviter d'exposer l'API key et le secret
 * @param file - Fichier image à uploader
 * @param folder - Dossier de stockage (défaut: depot_images)
 * @returns URL publique de l'image ou erreur
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = "depot_images",
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    console.log(
      "📸 Début upload Cloudinary - file:",
      file.name,
      "size:",
      file.size,
      "type:",
      file.type,
    );

    // Validation du fichier
    if (!file.type.startsWith("image/")) {
      console.error("❌ Erreur: Le fichier n'est pas une image");
      return { success: false, error: "Le fichier doit être une image" };
    }

    // Limiter la taille à 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("❌ Erreur: L'image est trop grande");
      return { success: false, error: "L'image doit faire moins de 5MB" };
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dmbbpm6fj";
    const uploadPreset =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

    console.log("⬆️ Upload vers Cloudinary en cours...");

    // Créer FormData pour l'upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);
    formData.append(
      "public_id",
      `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
    );

    // Upload via API REST (sans exposer l'API key/secret)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "❌ Erreur upload Cloudinary:",
        result.error?.message || result,
      );
      return {
        success: false,
        error: result.error?.message || "Erreur upload Cloudinary",
      };
    }

    console.log("✅ Image uploadée avec succès:", result.secure_url);
    return { success: true, data: result.secure_url };
  } catch (error) {
    console.error("❌ Erreur upload Cloudinary:", error);
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMsg };
  }
};
