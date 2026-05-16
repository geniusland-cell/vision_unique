-- ============================================
-- DEPOT DASHBOARD - SAMPLE DATA
-- Congo Brazzaville - Multi-depot Management
-- ============================================

-- Insert Depots
INSERT INTO depots (name, location) VALUES
  ('Dépôt Charbon - Brazzaville', 'Brazzaville Centre'),
  ('Dépôt Bois - Pointe-Noire', 'Pointe-Noire Port');

-- Get depot IDs for reference
-- depot_1 = Brazzaville, depot_2 = Pointe-Noire

-- ============================================
-- DEPOT 1: CHARBON - BRAZZAVILLE
-- ============================================

-- Categories for Charbon Depot
INSERT INTO categories (depot_id, name, description) VALUES
  ((SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville'), 'Charbon Premium', 'Charbon de qualité supérieure'),
  ((SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville'), 'Charbon Standard', 'Charbon standard courant'),
  ((SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville'), 'Charbon Économique', 'Charbon prix bas');

-- Qualities for Charbon Premium
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Premium'), 'Charbon Premium Grade A', 850.00, 'tonnes', 250),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Premium'), 'Charbon Premium Grade B', 750.00, 'tonnes', 180);

-- Qualities for Charbon Standard
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Standard'), 'Charbon Standard 1', 500.00, 'tonnes', 500),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Standard'), 'Charbon Standard 2', 450.00, 'tonnes', 420);

-- Qualities for Charbon Économique
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Économique'), 'Charbon Broyé', 300.00, 'tonnes', 1000),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Charbon - Brazzaville') AND name = 'Charbon Économique'), 'Charbon Recyclé', 250.00, 'tonnes', 750);

-- ============================================
-- DEPOT 2: BOIS - POINTE-NOIRE
-- ============================================

-- Categories for Bois Depot
INSERT INTO categories (depot_id, name, description) VALUES
  ((SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire'), 'Bois Dur', 'Bois dur premium pour construction'),
  ((SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire'), 'Bois Tendre', 'Bois tendre pour planche'),
  ((SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire'), 'Bois Combustible', 'Bois pour chauffage');

-- Qualities for Bois Dur
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Dur'), 'Padouk', 1200.00, 'm3', 85),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Dur'), 'Sapelli', 950.00, 'm3', 120);

-- Qualities for Bois Tendre
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Tendre'), 'Okoumé', 650.00, 'm3', 200),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Tendre'), 'Azobé', 700.00, 'm3', 150);

-- Qualities for Bois Combustible
INSERT INTO qualities (category_id, name, price_per_unit, unit_type, stock_quantity) VALUES
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Combustible'), 'Bois Sec', 400.00, 'stère', 500),
  ((SELECT id FROM categories WHERE depot_id = (SELECT id FROM depots WHERE name = 'Dépôt Bois - Pointe-Noire') AND name = 'Bois Combustible'), 'Bois Humide', 300.00, 'stère', 800);

-- ============================================
-- SUMMARY STATS
-- ============================================
-- Depot 1 (Charbon Brazzaville):
--   - 3 categories: Premium, Standard, Économique
--   - 6 qualities total
--   - Total stock: ~3,100 tonnes

-- Depot 2 (Bois Pointe-Noire):
--   - 3 categories: Dur, Tendre, Combustible
--   - 6 qualities total
--   - Total stock: ~1,855 m3 + stères
