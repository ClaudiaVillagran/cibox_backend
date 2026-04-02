import Product from '../models/Product.js';

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      message: 'Producto creado correctamente',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ is_active: true });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    res.json({
      message: 'Producto actualizado correctamente',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

export const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    res.json({
      message: 'Producto desactivado correctamente',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al desactivar producto',
      error: error.message
    });
  }
};