import { useState, useEffect, useCallback } from "react";
import {
  getDepotProducts,
  updateDepotProduct,
  addDepotProduct,
  removeDepotProduct,
  uploadProductImage,
} from "../firebase";
import type { Depot } from "../types";
import "./DepotProducts.css";

interface DepotProductsProps {
  depot: Depot;
  isEditing: boolean;
  onClose: () => void;
}

export default function DepotProducts({
  depot,
  isEditing,
  onClose,
}: DepotProductsProps) {
  const depotId = depot.id;
  const CATEGORIES = [
    "Poisson",
    "Charbon",
    "Boissons",
    "Vivriers",
    "Fruits",
    "Viande",
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editingImageProductId, setEditingImageProductId] = useState<
    string | null
  >(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Modal lightbox
  const [newProduct, setNewProduct] = useState<{
    name: string;
    category: string;
    price: string;
    stock_quantity: string;
    unit: string;
    image: string;
  }>({
    name: "",
    category: "",
    price: "",
    stock_quantity: "",
    unit: "kg",
    image: "",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const result = await getDepotProducts(depotId);
    if (result.success) {
      setProducts(result.data || []);
      // Initialize edit data with current values
      const initialEditData: Record<string, any> = {};
      (result.data || []).forEach((p: any) => {
        initialEditData[p.id] = { ...p };
      });
      setEditData(initialEditData);
    }
    setLoading(false);
  }, [depotId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await loadProducts();
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadProducts]);

  // Handle image file upload to Firebase Storage
  const handleImageUpload = async (file: File): Promise<void> => {
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const result = await uploadProductImage(file);
    setIsUploading(false);

    if (result.success && result.data?.imageUrl) {
      setImagePreview(result.data.imageUrl);
      setNewProduct({ ...newProduct, image: result.data.imageUrl });
    } else {
      setUploadError(result.error || "Erreur lors du téléchargement");
    }
  };

  // Modal lightbox functions
  const openImageModal = (imageUrl: string): void => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = (): void => {
    setSelectedImage(null);
  };

  // Trigger camera
  const triggerCamera = (): void => {
    const input = document.getElementById(
      "cameraInput",
    ) as HTMLInputElement | null;
    if (input) {
      input.capture = "environment";
      input.click();
    }
  };

  // Trigger gallery
  const triggerGallery = (): void => {
    const input = document.getElementById(
      "galleryInput",
    ) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  // Handle image upload for existing products (in edit mode)
  const handleProductImageUpload = async (
    file: File,
    productId: string,
  ): Promise<void> => {
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const result = await uploadProductImage(file);
    setIsUploading(false);

    if (result.success && result.data?.imageUrl) {
      // Update editData with new image URL
      setEditData((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          image: result.data.imageUrl,
        },
      }));
      setEditingImageProductId(null);
      alert("Image mise à jour");
    } else {
      setUploadError(result.error || "Erreur lors du téléchargement");
    }
  };

  // Trigger camera for product image
  const triggerProductCamera = (productId: string): void => {
    setEditingImageProductId(productId);
    const input = document.getElementById(
      "cameraInputProduct",
    ) as HTMLInputElement | null;
    if (input) {
      input.capture = "environment";
      input.click();
    }
  };

  // Trigger gallery for product image
  const triggerProductGallery = (productId: string): void => {
    setEditingImageProductId(productId);
    const input = document.getElementById(
      "galleryInputProduct",
    ) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  const handleEditChange = (
    productId: string,
    field: string,
    value: any,
  ): void => {
    setEditData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]:
          field === "price" || field === "stock_quantity"
            ? parseFloat(value) || value
            : value,
      },
    }));
  };

  const handleSaveProduct = async (productId: string): Promise<void> => {
    const product = editData[productId];
    const result = await updateDepotProduct(
      depotId,
      productId,
      parseFloat(product.price),
      parseInt(product.stock_quantity),
      product.image || "",
    );

    if (result.success) {
      loadProducts();
      alert("Produit mis à jour");
    } else {
      alert("Erreur: " + result.error);
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    if (window.confirm("Supprimer ce produit?")) {
      const result = await removeDepotProduct(depotId, productId);
      if (result.success) {
        loadProducts();
        alert("Produit supprimé");
      } else {
        alert("Erreur: " + result.error);
      }
    }
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.category ||
      !newProduct.price ||
      !newProduct.stock_quantity
    ) {
      alert("Tous les champs sont requis (incluant la catégorie)");
      return;
    }

    const result = await addDepotProduct(
      depotId,
      newProduct.name,
      newProduct.category,
      parseFloat(newProduct.price),
      parseInt(newProduct.stock_quantity),
      newProduct.unit,
      newProduct.image || "",
    );

    if (result.success) {
      setNewProduct({
        name: "",
        category: "",
        price: "",
        stock_quantity: "",
        unit: "kg",
        image: "",
      });
      setImagePreview("");
      setUploadError("");
      loadProducts();
      alert("Produit ajouté");
    } else {
      alert("Erreur: " + result.error);
    }
  };

  if (loading) {
    return <div className="depot-products">Chargement...</div>;
  }

  return (
    <div className="depot-products">
      {/* SECTION 1: Carte d'affichage (cahier) */}
      <div className="products-notebook">
        <div className="notebook-content">
          {products && products.length > 0 ? (
            <div className="products-table-display">
              {products.map((product) => (
                <div key={product.id} className="product-line">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-thumb-small"
                      title={product.name}
                      onClick={() => openImageModal(product.image)}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <div className="product-thumb-placeholder-small">📦</div>
                  )}
                  <span className="product-name">{product.name}</span>
                  <span className="product-category">{product.category}</span>
                  <span className="product-price">
                    {product.price} FCFA/{product.unit}
                  </span>
                  <span className="product-stock">
                    {product.stock_quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products-message">Aucun produit</div>
          )}
        </div>
      </div>

      {/* SECTION 2: Tableau d'édition */}
      {isEditing && (
        <div className="edit-section">
          <div className="edit-header">Gestion des produits</div>
          <table className="products-edit-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix (FCFA)</th>
                <th>Stock</th>
                <th>Unité</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>
                    <select
                      value={editData[product.id]?.category || ""}
                      onChange={(e) =>
                        handleEditChange(product.id, "category", e.target.value)
                      }
                    >
                      <option value="">-- Sélectionner --</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editData[product.id]?.price || ""}
                      onChange={(e) =>
                        handleEditChange(product.id, "price", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editData[product.id]?.stock_quantity || ""}
                      onChange={(e) =>
                        handleEditChange(
                          product.id,
                          "stock_quantity",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editData[product.id]?.unit || "kg"}
                      onChange={(e) =>
                        handleEditChange(product.id, "unit", e.target.value)
                      }
                    >
                      <option value="kg">kg</option>
                      <option value="sac">sac</option>
                      <option value="bouteille">bouteille</option>
                      <option value="régime">régime</option>
                    </select>
                  </td>
                  <td className="product-image-cell">
                    <div className="image-edit-container">
                      {editData[product.id]?.image ? (
                        <img
                          src={editData[product.id].image}
                          alt={product.name}
                          className="product-image-thumb"
                        />
                      ) : (
                        <div className="product-image-placeholder-edit">📦</div>
                      )}
                      <div className="image-edit-buttons">
                        <button
                          type="button"
                          className="btn-edit-camera"
                          onClick={() => triggerProductCamera(product.id)}
                          disabled={isUploading}
                          title="Prendre une photo"
                        >
                          📸
                        </button>
                        <button
                          type="button"
                          className="btn-edit-gallery"
                          onClick={() => triggerProductGallery(product.id)}
                          disabled={isUploading}
                          title="Choisir galerie"
                        >
                          🖼️
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-save"
                      onClick={() => handleSaveProduct(product.id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Formulaire d'ajout */}
          <div className="add-product-form">
            <div className="add-form-title">Ajouter un produit</div>
            <div className="add-form-fields">
              <input
                type="text"
                placeholder="Nom du produit"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Prix (FCFA)"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Quantité en stock"
                value={newProduct.stock_quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock_quantity: e.target.value,
                  })
                }
              />
              <select
                value={newProduct.unit}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unit: e.target.value })
                }
              >
                <option value="kg">kg</option>
                <option value="sac">sac</option>
                <option value="bouteille">bouteille</option>
                <option value="régime">régime</option>
              </select>

              {/* Image Upload Section */}
              <div className="image-upload-section">
                <label>Photo du produit (optionnel):</label>
                {imagePreview && (
                  <div className="image-preview-container">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="image-preview"
                    />
                  </div>
                )}
                <div className="upload-buttons">
                  <button
                    type="button"
                    className="btn-camera"
                    onClick={triggerCamera}
                    disabled={isUploading}
                  >
                    📸 Prendre une photo
                  </button>
                  <button
                    type="button"
                    className="btn-gallery"
                    onClick={triggerGallery}
                    disabled={isUploading}
                  >
                    🖼️ Choisir galerie
                  </button>
                </div>
                {isUploading && (
                  <div className="upload-loading">
                    ⏳ Téléchargement en cours...
                  </div>
                )}
                {uploadError && (
                  <div className="upload-error">❌ {uploadError}</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  id="cameraInput"
                />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  id="galleryInput"
                />
              </div>

              <button className="btn-add" onClick={handleAddProduct}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Input files for editing existing product images */}
          <div style={{ display: "none" }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (editingImageProductId && file) {
                  handleProductImageUpload(file, editingImageProductId);
                }
              }}
              id="cameraInputProduct"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (editingImageProductId && file) {
                  handleProductImageUpload(file, editingImageProductId);
                }
              }}
              id="galleryInputProduct"
            />
          </div>
        </div>
      )}

      {/* IMAGE MODAL LIGHTBOX */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <img
            src={selectedImage}
            alt="Enlarged"
            className="image-modal-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="image-modal-close"
            onClick={closeImageModal}
            title="Fermer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
