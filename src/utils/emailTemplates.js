
export const buildVerifyEmailTemplate = ({ name, verifyUrl }) => {
  return {
    subject: "Verifica tu correo en CIBOX",
    text: `Hola ${name}, verifica tu correo aquí: ${verifyUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Verifica tu correo</h2>
        <p>Hola <strong>${name}</strong>, gracias por registrarte en CIBOX.</p>
        <p>Para activar tu cuenta, haz click en el siguiente botón:</p>
        <p>
          <a
            href="${verifyUrl}"
            style="display:inline-block;padding:12px 20px;background:#4E9B27;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;"
          >
            Verificar correo
          </a>
        </p>
        <p>Si el botón no funciona, copia y pega este enlace:</p>
        <p>${verifyUrl}</p>
      </div>
    `,
  };
};

export const buildResetPasswordTemplate = ({ name, resetUrl }) => {
  return {
    subject: "Restablece tu contraseña en CIBOX",
    text: `Hola ${name}, restablece tu contraseña aquí: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Restablecer contraseña</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 20px;background:#4E9B27;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;"
          >
            Crear nueva contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>Si el botón no funciona, copia y pega este enlace:</p>
        <p>${resetUrl}</p>
      </div>
    `,
  };
};

export const buildOrderCreatedTemplate = ({ name, orderId, total }) => {
  return {
    subject: "Recibimos tu pedido en CIBOX",
    text: `Hola ${name}, recibimos tu pedido ${orderId} por un total de $${total}. Te avisaremos cuando avance.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Pedido recibido</h2>
        <p>Hola <strong>${name}</strong>, recibimos tu pedido correctamente.</p>
        <p><strong>Número de pedido:</strong> ${orderId}</p>
        <p><strong>Total:</strong> $${total}</p>
        <p>Te avisaremos cuando el estado de tu compra avance.</p>
      </div>
    `,
  };
};

export const buildPaymentApprovedTemplate = ({ name, orderId, total }) => {
  return {
    subject: "Pago confirmado en CIBOX",
    text: `Hola ${name}, confirmamos el pago de tu pedido ${orderId} por $${total}.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Pago confirmado</h2>
        <p>Hola <strong>${name}</strong>, tu pago fue confirmado correctamente.</p>
        <p><strong>Número de pedido:</strong> ${orderId}</p>
        <p><strong>Total pagado:</strong> $${total}</p>
        <p>Ahora comenzaremos a preparar tu pedido.</p>
      </div>
    `,
  };
};

export const buildOrderStatusChangedTemplate = ({
  name,
  orderId,
  status,
  trackingNumber,
}) => {
  const statusLabels = {
    pending: "Pendiente",
    paid: "Pagado",
    preparing: "En preparación",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return {
    subject: `Actualización de tu pedido en CIBOX: ${statusLabels[status] || status}`,
    text: `Hola ${name}, tu pedido ${orderId} ahora está en estado: ${
      statusLabels[status] || status
    }${trackingNumber ? `. Tracking: ${trackingNumber}` : ""}.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Actualización de pedido</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Tu pedido <strong>${orderId}</strong> ahora está en estado:</p>
        <p style="font-size:18px;font-weight:700;color:#4E9B27;">
          ${statusLabels[status] || status}
        </p>
        ${
          trackingNumber
            ? `<p><strong>Número de seguimiento:</strong> ${trackingNumber}</p>`
            : ""
        }
      </div>
    `,
  };
};

export const buildVendorApprovedTemplate = ({ name, storeName }) => {
  return {
    subject: "Tu tienda fue aprobada en CIBOX",
    text: `Hola ${name}, tu tienda ${storeName} fue aprobada correctamente.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Tienda aprobada</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Tu tienda <strong>${storeName}</strong> fue aprobada correctamente.</p>
        <p>Ya puedes comenzar a gestionar tus productos en CIBOX.</p>
      </div>
    `,
  };
};

export const buildVendorRequestReceivedTemplate = ({ name, storeName }) => {
  return {
    subject: "Recibimos tu solicitud de tienda en CIBOX",
    text: `Hola ${name}, recibimos la solicitud de tu tienda ${storeName}. Te avisaremos cuando sea revisada.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Solicitud recibida</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Recibimos la solicitud para tu tienda <strong>${storeName}</strong>.</p>
        <p>Te avisaremos cuando sea revisada y aprobada.</p>
      </div>
    `,
  };
};

export const buildVendorDeactivatedTemplate = ({ name, storeName }) => {
  return {
    subject: "Tu tienda fue desactivada en CIBOX",
    text: `Hola ${name}, tu tienda ${storeName} fue desactivada. Si necesitas más información, contáctanos.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Tienda desactivada</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Tu tienda <strong>${storeName}</strong> fue desactivada.</p>
        <p>Si necesitas más información, por favor contáctanos.</p>
      </div>
    `,
  };
};

export const buildProductDeactivatedTemplate = ({ name, productName }) => {
  return {
    subject: "Uno de tus productos fue desactivado en CIBOX",
    text: `Hola ${name}, tu producto ${productName} fue desactivado por un administrador.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Producto desactivado</h2>
        <p>Hola <strong>${name}</strong>.</p>
        <p>Tu producto <strong>${productName}</strong> fue desactivado por un administrador.</p>
        <p>Si necesitas más detalles, contáctanos.</p>
      </div>
    `,
  };
};