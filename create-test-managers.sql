-- Créer Manager 1 - Charbon Standard
INSERT INTO users (
    name, 
    email, 
    phone, 
    password, 
    role, 
    subscription_status, 
    priority_level,
    is_active
) VALUES (
    'Manager Charbon Standard',
    'charbon.standard@mamanpower.com',
    '+242066123401',
    'manager123',
    'depot_manager',
    'free',
    2,
    true
);

-- Créer Manager 2 - Charbon Premium
INSERT INTO users (
    name, 
    email, 
    phone, 
    password, 
    role, 
    subscription_status, 
    priority_level,
    is_active
) VALUES (
    'Manager Charbon Premium',
    'charbon.premium@mamanpower.com',
    '+242066123402',
    'manager123',
    'depot_manager',
    'free',
    2,
    true
);

-- Créer Dépôt pour Manager Charbon Standard
INSERT INTO depots (
    name, 
    location, 
    address, 
    whatsapp_number, 
    phone_direct,
    latitude, 
    longitude,
    managed_by,
    is_active
) VALUES (
    'Dépôt Charbon Standard - Poto-Poto',
    'Poto-Poto, Centre Ville',
    'Marché Central, près de la Poste',
    '+242066123501',
    '+242066123502',
    -4.2726,
    15.2663,
    (SELECT id FROM users WHERE email = 'charbon.standard@mamanpower.com' AND role = 'depot_manager'),
    true
);

-- Créer Dépôt pour Manager Charbon Premium
INSERT INTO depots (
    name, 
    location, 
    address, 
    whatsapp_number, 
    phone_direct,
    latitude, 
    longitude,
    managed_by,
    is_active
) VALUES (
    'Dépôt Charbon Premium - Bakongo',
    'Bakongo, Quartier Historique',
    'Avenue Foch, près du Port',
    '+242066123601',
    '+242066123602',
    -4.2636,
    15.2429,
    (SELECT id FROM users WHERE email = 'charbon.premium@mamanpower.com' AND role = 'depot_manager'),
    true
);

-- Ajouter produits aux dépôts
INSERT INTO depot_products (depot_id, product_id, stock_quantity, price, updated_by)
-- Dépôt Standard: Charbon Bois (qualité standard, prix base)
SELECT 
    (SELECT id FROM depots WHERE name = 'Dépôt Charbon Standard - Poto-Poto') as depot_id,
    (SELECT id FROM products WHERE name = 'Charbon Bois') as product_id,
    500 as stock_quantity,
    1500.00 as price,  -- Prix standard
    (SELECT id FROM users WHERE email = 'charbon.standard@mamanpower.com' AND role = 'depot_manager') as updated_by
UNION ALL
SELECT 
    (SELECT id FROM depots WHERE name = 'Dépôt Charbon Standard - Poto-Poto') as depot_id,
    (SELECT id FROM products WHERE name = 'Charbon Coco') as product_id,
    300 as stock_quantity,
    2000.00 as price,  -- Prix standard
    (SELECT id FROM users WHERE email = 'charbon.standard@mamanpower.com' AND role = 'depot_manager') as updated_by
UNION ALL
-- Dépôt Premium: Charbon Bois (qualité premium, prix plus élevé)
SELECT 
    (SELECT id FROM depots WHERE name = 'Dépôt Charbon Premium - Bakongo') as depot_id,
    (SELECT id FROM products WHERE name = 'Charbon Bois') as product_id,
    400 as stock_quantity,
    1600.00 as price,  -- Prix premium
    (SELECT id FROM users WHERE email = 'charbon.premium@mamanpower.com' AND role = 'depot_manager') as updated_by
UNION ALL
SELECT 
    (SELECT id FROM depots WHERE name = 'Dépôt Charbon Premium - Bakongo') as depot_id,
    (SELECT id FROM products WHERE name = 'Charbon Coco') as product_id,
    250 as stock_quantity,
    2200.00 as price,  -- Prix premium
    (SELECT id FROM users WHERE email = 'charbon.premium@mamanpower.com' AND role = 'depot_manager') as updated_by;

-- Vérification finale
SELECT 
    u.name as manager_name,
    u.email as manager_email,
    d.name as depot_name,
    d.location,
    p.name as product_name,
    c.name as category_name,
    c.emoji,
    dp.stock_quantity,
    dp.price,
    CASE 
        WHEN dp.price = 1500.00 THEN 'Standard'
        WHEN dp.price = 2000.00 THEN 'Standard'
        WHEN dp.price = 1600.00 THEN 'Premium'
        WHEN dp.price = 2200.00 THEN 'Premium'
        ELSE 'Autre'
    END as qualite
FROM users u
JOIN depots d ON d.managed_by = u.id
JOIN depot_products dp ON dp.depot_id = d.id
JOIN products p ON dp.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE u.email IN ('charbon.standard@mamanpower.com', 'charbon.premium@mamanpower.com')
AND u.role = 'depot_manager'
ORDER BY u.email, d.name, c.name, p.name;
