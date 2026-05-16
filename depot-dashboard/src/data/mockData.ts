// Mock data pour la présentation
// Après c'est remplacé par Supabase

export const mockDepots = [
  {
    id: "depot-1",
    name: "Dépôt Charbon - Brazzaville",
    location: "Brazzaville Centre",
  },
  {
    id: "depot-2",
    name: "Dépôt Bois - Pointe-Noire",
    location: "Pointe-Noire Port",
  },
];

export const mockCategories = {
  "depot-1": [
    {
      id: "cat-1-1",
      depot_id: "depot-1",
      name: "Charbon Premium",
      description: "Charbon de qualité supérieure",
      audio_url: null,
    },
    {
      id: "cat-1-2",
      depot_id: "depot-1",
      name: "Charbon Standard",
      description: "Charbon standard courant",
      audio_url: null,
    },
    {
      id: "cat-1-3",
      depot_id: "depot-1",
      name: "Charbon Économique",
      description: "Charbon prix bas",
      audio_url: null,
    },
  ],
  "depot-2": [
    {
      id: "cat-2-1",
      depot_id: "depot-2",
      name: "Bois Dur",
      description: "Bois dur premium pour construction",
      audio_url: null,
    },
    {
      id: "cat-2-2",
      depot_id: "depot-2",
      name: "Bois Tendre",
      description: "Bois tendre pour planche",
      audio_url: null,
    },
    {
      id: "cat-2-3",
      depot_id: "depot-2",
      name: "Bois Combustible",
      description: "Bois pour chauffage",
      audio_url: null,
    },
  ],
};

export const mockQualities = {
  "cat-1-1": [
    {
      id: "q-1",
      category_id: "cat-1-1",
      name: "Charbon Premium Grade A",
      price_per_unit: 850,
      unit_type: "tonnes",
      stock_quantity: 250,
    },
    {
      id: "q-2",
      category_id: "cat-1-1",
      name: "Charbon Premium Grade B",
      price_per_unit: 750,
      unit_type: "tonnes",
      stock_quantity: 180,
    },
  ],
  "cat-1-2": [
    {
      id: "q-3",
      category_id: "cat-1-2",
      name: "Charbon Standard 1",
      price_per_unit: 500,
      unit_type: "tonnes",
      stock_quantity: 500,
    },
    {
      id: "q-4",
      category_id: "cat-1-2",
      name: "Charbon Standard 2",
      price_per_unit: 450,
      unit_type: "tonnes",
      stock_quantity: 420,
    },
  ],
  "cat-1-3": [
    {
      id: "q-5",
      category_id: "cat-1-3",
      name: "Charbon Broyé",
      price_per_unit: 300,
      unit_type: "tonnes",
      stock_quantity: 1000,
    },
    {
      id: "q-6",
      category_id: "cat-1-3",
      name: "Charbon Recyclé",
      price_per_unit: 250,
      unit_type: "tonnes",
      stock_quantity: 750,
    },
  ],
  "cat-2-1": [
    {
      id: "q-7",
      category_id: "cat-2-1",
      name: "Padouk",
      price_per_unit: 1200,
      unit_type: "m3",
      stock_quantity: 85,
    },
    {
      id: "q-8",
      category_id: "cat-2-1",
      name: "Sapelli",
      price_per_unit: 950,
      unit_type: "m3",
      stock_quantity: 120,
    },
  ],
  "cat-2-2": [
    {
      id: "q-9",
      category_id: "cat-2-2",
      name: "Okoumé",
      price_per_unit: 650,
      unit_type: "m3",
      stock_quantity: 200,
    },
    {
      id: "q-10",
      category_id: "cat-2-2",
      name: "Azobé",
      price_per_unit: 700,
      unit_type: "m3",
      stock_quantity: 150,
    },
  ],
  "cat-2-3": [
    {
      id: "q-11",
      category_id: "cat-2-3",
      name: "Bois Sec",
      price_per_unit: 400,
      unit_type: "stère",
      stock_quantity: 500,
    },
    {
      id: "q-12",
      category_id: "cat-2-3",
      name: "Bois Humide",
      price_per_unit: 300,
      unit_type: "stère",
      stock_quantity: 800,
    },
  ],
};
