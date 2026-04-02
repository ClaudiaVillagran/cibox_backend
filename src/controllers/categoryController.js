import Category from "../models/Category.js";

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "El nombre es obligatorio",
      });
    }

    const slug = generateSlug(name);

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "La categoría ya existe",
      });
    }

    const category = await Category.create({
      name,
      slug,
    });

    res.status(201).json({
      message: "Categoría creada correctamente",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear categoría",
      error: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true }).sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener categorías",
      error: error.message,
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener categoría",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    res.json({
      message: "Categoría actualizada correctamente",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar categoría",
      error: error.message,
    });
  }
};

export const deactivateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    res.json({
      message: "Categoría desactivada correctamente",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al desactivar categoría",
      error: error.message,
    });
  }
};