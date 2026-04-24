import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import {
  generateRandomToken,
  getTokenExpiryDate,
} from "../utils/authTokens.js";
import { sendEmail } from "../services/emailService.js";
import {
  buildVerifyEmailTemplate,
  buildResetPasswordTemplate,
} from "../utils/emailTemplates.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const isValidEmailFormat = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_APP_URL || "myapp://";
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nombre, email y password son obligatorios",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmailFormat(normalizedEmail)) {
      return res.status(400).json({
        message: "Correo inválido",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "El usuario ya existe",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = generateRandomToken();

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires: getTokenExpiryDate(60 * 24),
    });

    const verifyUrl = `${getFrontendBaseUrl()}/auth/verify-email?token=${verificationToken}`;
    const emailTemplate = buildVerifyEmailTemplate({
      name: user.name,
      verifyUrl,
    });

    console.log("sendEmail", user);
    console.log("template", emailTemplate);
    // console.log(user.email, emailTemplate.subject, emailTemplate.text, emailTemplate.html  );
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    res.status(201).json({
      message:
        "Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log('token',token);

    if (!token) {
      return res.status(400).json({
        message: "Token de verificación requerido",
      });
    }

    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;

    await user.save();

    return res.status(200).json({
      message: "Correo verificado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al verificar correo",
      error: error.message,
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "El correo es obligatorio",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        message: "Este correo ya está verificado",
      });
    }

    const verificationToken = generateRandomToken();

    user.email_verification_token = verificationToken;
    user.email_verification_expires = getTokenExpiryDate(60 * 24);
    await user.save();

    const verifyUrl = `${getFrontendBaseUrl()}/auth/verify-email?token=${verificationToken}`;
    const emailTemplate = buildVerifyEmailTemplate({
      name: user.name,
      verifyUrl,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    return res.status(200).json({
      message: "Correo de verificación reenviado",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al reenviar verificación",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Debes verificar tu correo antes de iniciar sesión",
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login exitoso",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "El correo es obligatorio",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        message:
          "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
      });
    }

    const resetToken = generateRandomToken();

    user.reset_password_token = resetToken;
    user.reset_password_expires = getTokenExpiryDate(60);
    await user.save();

    const resetUrl = `${getFrontendBaseUrl()}/auth/reset-password?token=${resetToken}`;
    const emailTemplate = buildResetPasswordTemplate({
      name: user.name,
      resetUrl,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    return res.status(200).json({
      message:
        "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al solicitar restablecimiento",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token y nueva contraseña son obligatorios",
      });
    }

    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.reset_password_token = null;
    user.reset_password_expires = null;

    await user.save();

    return res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al restablecer contraseña",
      error: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
};
