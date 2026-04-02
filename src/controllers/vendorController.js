import Vendor from "../models/Vendor.js";
import User from "../models/User.js";

export const createVendor = async (req, res) => {
  try {
    const { user_id, store_name, description } = req.body;

    if (!user_id || !store_name) {
      return res.status(400).json({
        message: "user_id y store_name son obligatorios",
      });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const existingVendor = await Vendor.findOne({ user_id });

    if (existingVendor) {
      return res.status(400).json({
        message: "Este usuario ya tiene vendor",
      });
    }

    const vendor = await Vendor.create({
      user_id,
      store_name,
      description,
    });

    user.role = "vendor";
    await user.save();

    res.status(201).json({
      message: "Vendor creado correctamente",
      vendor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear vendor",
      error: error.message,
    });
  }
};

export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ is_active: true }).populate(
      "user_id",
      "name email role"
    );

    res.json(vendors);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener vendors",
      error: error.message,
    });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate(
      "user_id",
      "name email role"
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener vendor",
      error: error.message,
    });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { store_name, description, approved, rating, is_active } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    if (store_name !== undefined) vendor.store_name = store_name;
    if (description !== undefined) vendor.description = description;
    if (approved !== undefined) vendor.approved = approved;
    if (rating !== undefined) vendor.rating = rating;
    if (is_active !== undefined) vendor.is_active = is_active;

    await vendor.save();

    const user = await User.findById(vendor.user_id);

    if (user) {
      if (vendor.is_active) {
        user.role = "vendor";
      } else {
        user.role = "customer";
      }

      await user.save();
    }

    const populatedVendor = await Vendor.findById(vendor._id).populate(
      "user_id",
      "name email role"
    );

    res.json({
      message: "Vendor actualizado correctamente",
      vendor: populatedVendor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar vendor",
      error: error.message,
    });
  }
};

export const deactivateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor no encontrado",
      });
    }

    vendor.is_active = false;
    await vendor.save();

    const user = await User.findById(vendor.user_id);

    if (user) {
      user.role = "customer";
      await user.save();
    }

    res.json({
      message: "Vendor desactivado correctamente",
      vendor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al desactivar vendor",
      error: error.message,
    });
  }
};