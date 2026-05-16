-- ============================================
-- DEPOT DASHBOARD - DATABASE SCHEMA
-- Congo Brazzaville - Multi-depot Management
-- ============================================

-- Table: DEPOTS
-- Chaque dépôt a son propre dashboard
CREATE TABLE depots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: CATEGORIES
-- Charbon, Bois, etc. avec catégories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id UUID NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  audio_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: QUALITIES
-- Qualités spécifiques à chaque catégorie
CREATE TABLE qualities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  unit_type VARCHAR(50) NOT NULL, -- "tonnes", "m3", "kg", etc.
  stock_quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: AUDIOS
-- Audios enregistrés pour chaque catégorie (français + lingala)
CREATE TABLE audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL, -- 'fr', 'lingala'
  file_url TEXT NOT NULL,
  file_size INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: STOCK_HISTORY
-- Historique des modifications de stock pour traçabilité
CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quality_id UUID NOT NULL REFERENCES qualities(id) ON DELETE CASCADE,
  old_quantity DECIMAL(10, 2),
  new_quantity DECIMAL(10, 2) NOT NULL,
  change_reason VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Table: ORDERS (optionnel - pour historique ventes)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id UUID NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
  quality_id UUID NOT NULL REFERENCES qualities(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  quantity DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_categories_depot ON categories(depot_id);
CREATE INDEX idx_qualities_category ON qualities(category_id);
CREATE INDEX idx_audios_category ON audios(category_id);
CREATE INDEX idx_stock_history_quality ON stock_history(quality_id);
CREATE INDEX idx_orders_depot ON orders(depot_id);
