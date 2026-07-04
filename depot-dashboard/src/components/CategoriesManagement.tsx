import { useState } from "react";
import "./CategoriesManagement.css";
import {
  updateMultipleProducts,
  createCategory,
  deleteDepotProduct,
} from "../firebase";
import type { Depot, Category } from "../types";

interface CategoriesManagementProps {
  depot: Depot;
  categories: Category[];
  products: any[];
  onRefresh: () => void;
}

export default function CategoriesManagement({
  depot,
  categories,
  products,
  onRefresh,
}: CategoriesManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Calculer les categories du depot directement sans useEffect
  const getDepotCategories = (): Category[] => {
    if (products.length === 0 || categories.length === 0) return [];

    const categoryIds = [
      ...new Set(products.map((p) => p.products?.category_id).filter(Boolean)),
    ];
    const filteredCategories = categories.filter((cat) =>
      categoryIds.includes(cat.id),
    );
    return filteredCategories;
  };

  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingQualities, setEditingQualities] = useState<Record<string, any>>(
    {},
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        const result = await createCategory(newCategory);
        if (result.success) {
          setNewCategory({ name: "", description: "" });
          setShowModal(false);
          alert("Catégorie ajoutée avec succès!");
          // Rafraîchir les catégories
          if (onRefresh) onRefresh();
        } else {
          alert("Erreur lors de la création: " + result.error);
        }
      } catch {
        alert("Erreur lors de la création de la catégorie");
      }
    }
  };

  const getCategoryQualities = (categoryId: string | null): any[] => {
    // Filtrer les produits par categorie
    const filtered = products.filter((p) => {
      return p.products?.category_id === categoryId;
    });
    return filtered || [];
  };

  const getTotalStock = (categoryId: string | null): number => {
    const categoryQualities = getCategoryQualities(categoryId);
    return categoryQualities.reduce((sum, q: any) => {
      const edited = editingQualities[q.id];
      return sum + (edited ? edited.stock_quantity : q.stock_quantity);
    }, 0);
  };

  const getTotalValue = (categoryId: string | null): number => {
    const categoryQualities = getCategoryQualities(categoryId);
    return categoryQualities.reduce((sum, q: any) => {
      const edited = editingQualities[q.id];
      const stock = edited ? edited.stock_quantity : q.stock_quantity;
      const price = edited ? edited.price : q.price;
      return sum + stock * (price || 0);
    }, 0);
  };

  const handleQualityEdit = (
    qualityId: string,
    field: string,
    value: string,
  ): void => {
    const currentQualities = getCategoryQualities(selectedCategory?.id || null);
    setEditingQualities((prev: Record<string, any>) => ({
      ...prev,
      [qualityId]: {
        ...(prev[qualityId] ||
          currentQualities?.find((q: any) => q.id === qualityId) ||
          {}),
        [field]: parseFloat(value),
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Préparer les mises à jour multiples
      const updates = Object.entries(editingQualities).map(
        ([qualityId, changes]: [string, any]) => ({
          depotProductId: parseInt(qualityId),
          newQuantity: changes.stock_quantity,
          newPrice: changes.price,
        }),
      );

      // Appeler la fonction de mise à jour multiple
      const result = await updateMultipleProducts(updates);

      if (result.success) {
        setEditingQualities({});
        setHasUnsavedChanges(false);
        alert("Modifications sauvegardées avec succès!");
        // Rafraîchir les données
        if (onRefresh) onRefresh();
      } else {
        alert("Erreur lors de la sauvegarde: " + result.error);
      }
    } catch {
      alert("Erreur lors de la sauvegarde des modifications");
    }
  };

  const handleCancelChanges = () => {
    setEditingQualities({});
    setHasUnsavedChanges(false);
  };

  const handleEditProduct = (product: any): void => {
    // Activer le mode édition pour ce produit
    setEditingQualities((prev) => ({
      ...prev,
      [product.id]: {
        ...(prev[product.id] || {}),
        stock_quantity: product.stock_quantity,
        price: product.price,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteProduct = async (product: any): Promise<void> => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer "${product.products?.name}" ?`,
      )
    ) {
      try {
        const result = await deleteDepotProduct(product.id, "current-user"); // TODO: utiliser le vrai user ID
        if (result.success) {
          alert(`Produit "${product.products?.name}" supprimé avec succès`);
          // Rafraîchir les données
          if (onRefresh) onRefresh();
        } else {
          alert("Erreur lors de la suppression: " + result.error);
        }
      } catch {
        alert("Erreur lors de la suppression du produit");
      }
    }
  };

  return (
    <div className="categories-section">
      <div className="section-title">
        <span>📦</span>
        <span>GESTION DES CATÉGORIES - {depot.name}</span>
      </div>

      {/* Categories Grid */}
      <div className="categories-grid">
        {getDepotCategories().map((cat) => (
          <div
            key={cat.id}
            className={`category-card ${selectedCategory?.id === cat.id ? "active" : ""}`}
            onClick={() =>
              setSelectedCategory(cat.id === selectedCategory?.id ? null : cat)
            }
          >
            <div className="category-header">
              <h3>{cat.name}</h3>
              <p className="description">{cat.description}</p>
            </div>

            <div className="category-stats">
              <div className="stat">
                <span className="label">Qualités:</span>
                <span className="value">
                  {getCategoryQualities(cat.id).length}
                </span>
              </div>
              <div className="stat">
                <span className="label">Stock:</span>
                <span className="value">
                  {getTotalStock(cat.id)}{" "}
                  {getCategoryQualities(cat.id)[0]?.products?.unit || "unités"}
                </span>
              </div>
              <div className="stat">
                <span className="label">Valeur:</span>
                <span className="value">
                  {getTotalValue(cat.id).toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add Category Button */}
        <div
          className="category-card add-card"
          onClick={() => setShowModal(true)}
        >
          <div className="add-content">
            <div className="plus-icon">+</div>
            <p>Ajouter une catégorie</p>
          </div>
        </div>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="category-details">
          <div className="category-header-with-actions">
            <h3>
              Qualités -{" "}
              {categories.find((c) => c.id === selectedCategory.id)?.name}
            </h3>
            {hasUnsavedChanges && (
              <div className="save-actions">
                <button
                  className="btn-cancel-small"
                  onClick={handleCancelChanges}
                >
                  Annuler
                </button>
                <button className="btn-save-small" onClick={handleSaveChanges}>
                  ✓ Enregistrer
                </button>
              </div>
            )}
          </div>
          <table className="qualities-table">
            <thead>
              <tr>
                <th>Qualité</th>
                <th>Prix Unitaire(FCFA)</th>
                <th>Unité</th>
                <th>Stock</th>
                <th>Valeur Totale</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getCategoryQualities(selectedCategory?.id || null).map(
                (quality: any) => {
                  const edited = editingQualities[quality.id];
                  const stock = edited
                    ? edited.stock_quantity
                    : quality.stock_quantity;
                  const price = edited ? edited.price : quality.price;
                  const totalValue = stock * (price || 0);

                  return (
                    <tr key={quality.id} className={edited ? "edited-row" : ""}>
                      <td>{quality.products?.name || "Produit"}</td>
                      <td>
                        <input
                          type="number"
                          value={price || ""}
                          className="price-input"
                          onChange={(e) =>
                            handleQualityEdit(
                              quality.id,
                              "price",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>{quality.products?.unit || "unités"}</td>
                      <td>
                        <input
                          type="number"
                          value={stock}
                          className="stock-input"
                          onChange={(e) =>
                            handleQualityEdit(
                              quality.id,
                              "stock_quantity",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="total-value">
                        {totalValue.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          title="Éditer"
                          onClick={() => handleEditProduct(quality)}
                        >
                          edit
                        </button>
                        <button
                          className="btn-delete"
                          title="Supprimer"
                          onClick={() => handleDeleteProduct(quality)}
                        >
                          supprimer
                        </button>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding category */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Ajouter une catégorie</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom de la catégorie</label>
                <input
                  type="text"
                  placeholder="Ex: Charbon Premium"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Ex: Charbon de qualité supérieure"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button className="btn-save" onClick={handleAddCategory}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
