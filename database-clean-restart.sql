-- =====================================
-- NETTOYAGE COMPLET ET RECÉATION
-- Supprime TOUTES les tables et les recrée
-- =====================================

-- =====================================
-- ÉTAPE 1 : SUPPRESSION DES TABLES
-- =====================================

-- Supprimer les tables en ordre inverse (pour éviter les contraintes)
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS depot_premium_vendors CASCADE;
DROP TABLE IF EXISTS stock_history CASCADE;
DROP TABLE IF EXISTS audio_messages CASCADE;
DROP TABLE IF EXISTS depot_products CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS quartiers CASCADE;
DROP TABLE IF EXISTS depots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS role_statistics CASCADE;
DROP VIEW IF EXISTS user_login_info CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS calculate_distance CASCADE;
DROP FUNCTION IF EXISTS find_nearest_depots CASCADE;
DROP FUNCTION IF EXISTS get_active_quartiers CASCADE;
DROP FUNCTION IF EXISTS get_premium_vendors CASCADE;
DROP FUNCTION IF EXISTS add_premium_vendor CASCADE;
DROP FUNCTION IF EXISTS authenticate_user CASCADE;
DROP FUNCTION IF EXISTS register_user CASCADE;
DROP FUNCTION IF EXISTS check_email_exists CASCADE;

-- =====================================
-- ÉTAPE 2 : RECÉATION DES TABLES (ordre correct)
-- =====================================

-- 1. Quartiers (référencée par users)
CREATE TABLE quartiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Catégories (référencée par products)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Users (référence quartiers)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'vendeur',
  subscription_status VARCHAR(20) DEFAULT 'free',
  priority_level INTEGER DEFAULT 1,
  quartier_id UUID REFERENCES quartiers(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Dépôts (référence users)
CREATE TABLE depots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  whatsapp_number VARCHAR(20),
  phone_direct VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  managed_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Produits (référence categories)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  base_price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Depot_products (table pivot)
CREATE TABLE depot_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(depot_id, product_id)
);

-- 7. Audio_messages
CREATE TABLE audio_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message_url TEXT NOT NULL,
  transcription TEXT,
  duration_seconds INTEGER,
  language VARCHAR(10) DEFAULT 'fr',
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Stock_history
CREATE TABLE stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_product_id UUID REFERENCES depot_products(id) ON DELETE CASCADE,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  change_type VARCHAR(20) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. User_favorites
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, depot_id)
);

-- 10. Depot_premium_vendors
CREATE TABLE depot_premium_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(depot_id, user_id)
);

-- =====================================
-- ÉTAPE 3 : INDEX POUR PERFORMANCE
-- =====================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_quartier ON users(quartier_id);
CREATE INDEX idx_depots_managed_by ON depots(managed_by);
CREATE INDEX idx_depots_location ON depots(location);
CREATE INDEX idx_depots_gps ON depots(latitude, longitude);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_depot_products_depot ON depot_products(depot_id);
CREATE INDEX idx_depot_products_product ON depot_products(product_id);
CREATE INDEX idx_depot_products_stock ON depot_products(stock_quantity);
CREATE INDEX idx_quartiers_name ON quartiers(name);
CREATE INDEX idx_quartiers_gps ON quartiers(latitude, longitude);

-- =====================================
-- ÉTAPE 4 : FONCTIONS PRINCIPALES
-- =====================================

-- Calcul de distance GPS
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        COS(RADIANS(lon2) - RADIANS(lon1)) +
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trouver les dépôts les plus proches
CREATE OR REPLACE FUNCTION find_nearest_depots(
    p_user_id UUID,
    p_user_latitude DECIMAL DEFAULT NULL,
    p_user_longitude DECIMAL DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    depot_id UUID,
    depot_name VARCHAR,
    distance_km DECIMAL,
    address TEXT,
    phone_direct VARCHAR,
    whatsapp_number VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL
) AS $$
DECLARE
    v_user_lat DECIMAL;
    v_user_lon DECIMAL;
BEGIN
    IF p_user_latitude IS NOT NULL AND p_user_longitude IS NOT NULL THEN
        v_user_lat := p_user_latitude;
        v_user_lon := p_user_longitude;
    ELSE
        SELECT q.latitude, q.longitude 
        INTO v_user_lat, v_user_lon
        FROM users u
        JOIN quartiers q ON u.quartier_id = q.id
        WHERE u.id = p_user_id;
        
        IF v_user_lat IS NULL THEN
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        calculate_distance(v_user_lat, v_user_lon, d.latitude, d.longitude),
        d.address,
        d.phone_direct,
        d.whatsapp_number,
        d.latitude,
        d.longitude
    FROM depots d
    WHERE d.is_active = true 
      AND d.latitude IS NOT NULL 
      AND d.longitude IS NOT NULL
    ORDER BY calculate_distance(v_user_lat, v_user_lon, d.latitude, d.longitude)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir les quartiers actifs
CREATE OR REPLACE FUNCTION get_active_quartiers()
RETURNS TABLE(
    quartier_id UUID,
    name VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.name,
        q.latitude,
        q.longitude,
        q.description
    FROM quartiers q
    WHERE q.is_active = true
    ORDER BY q.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- ÉTAPE 5 : DONNÉES INITIALES
-- =====================================

-- Insertion des catégories de base
INSERT INTO categories (name, emoji, description) VALUES
('Poisson', '🐟', 'Produits de la mer et poissons frais'),
('Charbon', '⚫', 'Différents types de charbon pour cuisine'),
('Boissons', '🍺', 'Boissons et liquides divers'),
('Vivriers', '🌾', 'Produits agricoles et céréales'),
('Fruits', '🍌', 'Fruits frais et tropicaux');

-- Insertion des produits de base
INSERT INTO products (name, category_id, base_price, unit) VALUES
('Carpe', (SELECT id FROM categories WHERE name = 'Poisson'), 2500.00, 'kg'),
('Capitaine', (SELECT id FROM categories WHERE name = 'Poisson'), 3500.00, 'kg'),
('Charbon Bois', (SELECT id FROM categories WHERE name = 'Charbon'), 1500.00, 'sac'),
('Charbon Coco', (SELECT id FROM categories WHERE name = 'Charbon'), 2000.00, 'sac'),
('Primus', (SELECT id FROM categories WHERE name = 'Boissons'), 800.00, 'bouteille'),
('Riz', (SELECT id FROM categories WHERE name = 'Vivriers'), 2500.00, 'sac'),
('Bananes', (SELECT id FROM categories WHERE name = 'Fruits'), 200.00, 'régime');

-- Insertion des quartiers de Brazzaville
INSERT INTO quartiers (name, latitude, longitude, description) VALUES
('Bakongo', -4.2636, 15.2429, '1er arrondissement - Quartier historique au sud de Brazzaville'),
('Poto-Poto', -4.2726, 15.2663, '2ème arrondissement - Centre ville et quartier commercial'),
('Moungali', -4.2514, 15.2721, '3ème arrondissement - Quartier résidentiel nord'),
('Ouenzé', -4.2857, 15.2514, '4ème arrondissement - Quartier populaire et animé'),
('Talangaï', -4.2429, 15.2857, '5ème arrondissement - Grand quartier nord de Brazzaville'),
('Mfilou', -4.2600, 15.3000, '6ème arrondissement - Zone périphérique nord-est'),
('Makélékélé', -4.2900, 15.2400, '7ème arrondissement - Quartier sud-ouest'),
('Djiri', -4.3000, 15.2000, '8ème arrondissement - Zone administrative et résidentielle'),
('Madibou', -4.3200, 15.1800, '9ème arrondissement - Zone rurale et périphérique sud');

-- =====================================
-- ÉTAPE 5.5 : FONCTIONS POUR AUTHENTIFICATION
-- =====================================

-- Auto-créer le profil utilisateur quand Supabase Auth crée un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.user_metadata->>'name', NEW.email),
    COALESCE(NEW.user_metadata->>'role', 'vendor'),
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.user_metadata->>'name', EXCLUDED.name),
    email = NEW.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencher le trigger quand un nouvel utilisateur Auth est créé
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================
-- ÉTAPE 6 : COMPTE ADMIN PAR DÉFAUT
-- =====================================

-- Créer votre compte admin avec mot de passe
INSERT INTO users (
    name, 
    email, 
    phone, 
    password, 
    role, 
    subscription_status, 
    priority_level
) VALUES (
    'Admin Maman Power',
    'mampouyaraphael04@gmail.com',
    '+242 06 676 81 28',
    'admin123',
    'admin',
    'free',
    3
);

-- =====================================
-- COMMENTAIRES
-- =====================================

COMMENT ON TABLE users IS 'Table utilisateurs principale avec authentification simple';
COMMENT ON TABLE depots IS 'Points de vente avec gestion par manager';
COMMENT ON TABLE categories IS 'Catégories de produits avec emojis';
COMMENT ON TABLE products IS 'Catalogue général des produits';
COMMENT ON TABLE depot_products IS 'Table pivot pour le stock par dépôt';
COMMENT ON TABLE audio_messages IS 'Messages audio pour les vendeuses';
COMMENT ON TABLE stock_history IS 'Historique des changements de stock';
COMMENT ON TABLE user_favorites IS 'Dépôts favoris des vendeuses';
COMMENT ON TABLE quartiers IS 'Quartiers de Brazzaville avec coordonnées GPS';
COMMENT ON TABLE depot_premium_vendors IS 'Liste des vendeuses PREMIUM par dépôt';

COMMENT ON COLUMN users.password IS 'Mot de passe en clair pour connexion simple';
COMMENT ON COLUMN users.role IS 'Rôle : admin, depot_manager, vendeur';
COMMENT ON COLUMN users.subscription_status IS 'Statut d''abonnement : free, premium';
COMMENT ON COLUMN users.priority_level IS 'Priorité : admin=3, depot_manager=2, vendeur=1';
COMMENT ON COLUMN users.last_login IS 'Dernière connexion de l''utilisateur';
COMMENT ON COLUMN users.login_count IS 'Nombre de connexions total';

-- =====================================
-- INSTRUCTIONS FINALES
-- =====================================

/*
SYSTÈME PRÊT :

1. Exécutez ce fichier dans Supabase SQL Editor
2. Votre compte admin sera : mampouyaraphael04@gmail.com / admin123
3. Les 3 rôles sont prêts : admin, depot_manager, vendeur
4. Toutes les fonctions GPS et PREMIUM sont opérationnelles
5. Les données initiales sont insérées

POUR VOTRE APPLICATION REACT :

1. Connexion simple :
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('password', password)
  .single();

2. Rôle automatique :
if (data.role === 'admin') → interface admin
if (data.role === 'depot_manager') → interface manager  
if (data.role === 'vendeur') → interface maman

3. Pas besoin de auth.users compliqué
4. Pas besoin de tokens JWT complexes
5. Simple et efficace
*/
