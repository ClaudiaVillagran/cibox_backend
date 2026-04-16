export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const isValidEmailFormat = (email = "") => {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};

export const normalizePhoneCL = (phone = "") => {
  let value = String(phone).replace(/[^\d+]/g, "");

  if (value.startsWith("56")) {
    value = `+${value}`;
  }

  if (!value.startsWith("+56") && value.length === 9 && value.startsWith("9")) {
    value = `+56${value}`;
  }

  return value;
};

export const isValidPhoneCL = (phone = "") => {
  const value = normalizePhoneCL(phone);
  return /^\+569\d{8}$/.test(value);
};

export const cleanRut = (rut = "") =>
  String(rut).replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();

export const formatRut = (rut = "") => {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let formattedBody = "";
  let count = 0;

  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body[i] + formattedBody;
    count++;
    if (count === 3 && i !== 0) {
      formattedBody = "." + formattedBody;
      count = 0;
    }
  }

  return `${formattedBody}-${dv}`;
};

export const isValidRut = (rut = "") => {
  const cleaned = cleanRut(rut);

  if (!/^\d{7,8}[0-9K]$/.test(cleaned)) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = 11 - (sum % 11);
  let expectedDv = "";

  if (mod === 11) expectedDv = "0";
  else if (mod === 10) expectedDv = "K";
  else expectedDv = String(mod);

  return expectedDv === dv;
};

export const isValidAddressText = (value = "", min = 5) => {
  return String(value).trim().length >= min;
};

export const validateCheckoutPayload = ({ customer = {}, shipping = {} }) => {
  const errors = {};

  if (!String(customer.fullName || "").trim()) {
    errors.fullName = "Ingresa tu nombre completo";
  }

  if (!isValidEmailFormat(customer.email)) {
    errors.email = "Ingresa un correo válido";
  }

  if (!isValidPhoneCL(customer.phone)) {
    errors.phone = "Ingresa un teléfono chileno válido";
  }

  if (!isValidRut(customer.rut)) {
    errors.rut = "Ingresa un RUT válido";
  }

  if (!String(shipping.region || "").trim()) {
    errors.region = "Selecciona una región";
  }

  if (!String(shipping.city || "").trim()) {
    errors.city = "Selecciona una comuna";
  }

  if (!isValidAddressText(shipping.address, 5)) {
    errors.address = "Ingresa una dirección válida";
  }

  return errors;
};