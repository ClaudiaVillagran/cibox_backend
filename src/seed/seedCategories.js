import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";

dotenv.config();


const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

const categories = [
  {
    name: "Cajas cibox",
    image: null,
    is_featured: true,
    children: [],
  },
  {
    name: "Chocolates y Galletas",
    image: null,
    is_featured: true,
    children: [],
  },
  {
    name: "Cuidado personal",
    image: null,
    is_featured: false,
    children: [],
  },
  {
    name: "Despensa",
    image: null,
    is_featured: false,
    children: [
      "Aceites y grasas",
      "Acetos, sucedáneos y vinagres",
      "Ajíes",
      "Arroces y pastas",
      "Azúcar y endulzantes",
      "Cereales",
      "Condimentos y especias",
      "Conservas",
      "Cremas dulces",
      "Embalaje",
      "Encurtidos",
      "Harinas y repostería",
      "Legumbres",
      "Listos para consumir",
      "Postres",
      "Productos orgánicos",
      "Salsas, aderezos y snacks",
      "Té y café",
    ],
  },
  {
    name: "Frutas y Verduras",
    image: null,
    is_featured: false,
    children: [
      "Frutas",
      "Frutas confitadas",
      "Frutas deshidratadas",
      "Frutos secos",
      "Verduras",
    ],
  },
  {
    name: "Lácteos, Huevos",
    image: null,
    is_featured: false,
    children: [
      "Cremas",
      "Helados",
      "Huevos",
      "Lácteos sin lactosa",
      "Lácteos vegetales",
      "Leche",
      "Mantequilla, margarina y manteca",
      "Quesos",
    ],
  },
  {
    name: "Licores, Bebidas y Aguas",
    image: null,
    is_featured: false,
    children: [
      "Aguas",
      "Bebidas",
      "Cervezas",
      "Destilados",
      "Jugos",
      "Licores",
      "Vinos",
    ],
  },
  {
    name: "Limpieza",
    image: null,
    is_featured: false,
    children: [
      "Accesorios de limpieza",
      "Ambientadores",
      "Desinfectantes",
      "Detergentes",
      "Limpieza de baños",
      "Limpieza de cocina",
      "Limpieza de pisos",
      "Logía",
    ],
  },
  {
    name: "Pollo",
    image: null,
    is_featured: false,
    children: [],
  },
  {
    name: "Productos artesanales",
    image: null,
    is_featured: false,
    children: [],
  },
  {
    name: "Productos de cocina",
    image: null,
    is_featured: false,
    children: [],
  },
  {
    name: "Productos veganos",
    image: null,
    is_featured: false,
    children: [],
  },
  {
    name: "Supermercado",
    image: null,
    is_featured: false,
    children: [],
  },
];

const upsertCategory = async ({
  name,
  image = null,
  is_featured = false,
  is_active = true,
  parent_id = null,
}) => {
  const slug = generateSlug(name);

  const category = await Category.findOneAndUpdate(
    {
      name,
      parent_id,
    },
    {
      name,
      slug,
      image,
      is_featured,
      is_active,
      parent_id,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return category;
};

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo conectado");

    for (const item of categories) {
      const parent = await upsertCategory({
        name: item.name,
        image: item.image || null,
        is_featured: item.is_featured ?? false,
        is_active: true,
        parent_id: null,
      });

      console.log(`Padre OK: ${parent.name}`);

      if (Array.isArray(item.children) && item.children.length) {
        for (const childName of item.children) {
          const child = await upsertCategory({
            name: childName,
            parent_id: parent._id,
            is_featured: false,
            is_active: true,
          });

          console.log(`  └─ Subcategoría OK: ${child.name}`);
        }
      }
    }

    console.log("Seed completado");
    process.exit(0);
  } catch (error) {
    console.error("Error seed:", error);
    process.exit(1);
  }
};
