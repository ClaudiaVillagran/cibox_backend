import Order from "../models/Order.js";
import pkg from "transbank-sdk";
import { webpayOptions } from "../config/webpay.js";
import { createShipmentForPaidOrder } from "./shippingController.js";
import { sendEmail } from "../services/emailService.js";
import { buildPaymentApprovedTemplate } from "../utils/emailTemplates.js";

const { WebpayPlus } = pkg;

const getTransaction = () => new WebpayPlus.Transaction(webpayOptions);

const buildBuyOrder = (orderId) => {
  const shortId = String(orderId).slice(-10);
  const shortTs = Date.now().toString().slice(-8);
  return `O${shortId}${shortTs}`;
};

const getFrontendUrls = (order) => {
  const isWeb = order?.payment?.platform === "web";

  return {
    successBase: isWeb
      ? process.env.FRONTEND_SUCCESS_URL_WEB
      : process.env.FRONTEND_SUCCESS_URL,
    failedBase: isWeb
      ? process.env.FRONTEND_FAILED_URL_WEB
      : process.env.FRONTEND_FAILED_URL,
  };
};
export const createWebpayTransaction = async (req, res) => {
  try {
    const { orderId, platform } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId es requerido" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const guestId = req.headers["x-guest-id"];

    const isOwnerUser =
      req.user?.id && String(order.user_id) === String(req.user.id);

    const isOwnerGuest =
      !req.user?.id &&
      guestId &&
      String(order.guest_id || "") === String(guestId);

    if (!isOwnerUser && !isOwnerGuest) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const buyOrder = buildBuyOrder(order._id);

    const sessionId = isOwnerUser
      ? String(req.user.id).slice(-20)
      : String(order.guest_id || `guest_${order._id}`).slice(-20);

    const amount = Math.round(order.total);
    const returnUrl = process.env.WEBPAY_RETURN_URL;

    console.log("WEBPAY RETURN URL:", returnUrl);

    const tx = getTransaction();
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

    order.payment = {
      ...(order.payment || {}),
      method: "webpay",
      status: "pending",
      token: response.token,
      buy_order: buyOrder,
      session_id: sessionId,
      amount,
      platform: platform || "web",
    };

    await order.save();

    return res.json({
      orderId: order._id,
      paymentToken: response.token,
      paymentUrl: response.url,
    });
  } catch (error) {
    console.log("WEBPAY CREATE ERROR:", error);
    return res.status(500).json({
      message: "Error creando transacción Webpay",
      error: error.message,
    });
  }
};

export const commitWebpayTransaction = async (req, res) => {
  try {
    const { orderId, token } = req.body;

    if (!orderId || !token) {
      return res.status(400).json({
        message: "orderId y token son requeridos",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const guestId = req.headers["x-guest-id"];

    const isOwnerUser =
      req.user?.id && String(order.user_id) === String(req.user.id);

    const isOwnerGuest =
      !req.user?.id &&
      guestId &&
      String(order.guest_id || "") === String(guestId);

    if (!isOwnerUser && !isOwnerGuest) {
      return res.status(403).json({ message: "No autorizado para esta orden" });
    }

    if (order.payment?.status === "approved" || order.status === "paid") {
      return res.status(200).json({
        message: "Pago ya confirmado previamente",
        success: true,
        order,
      });
    }

    const tx = getTransaction();
    const response = await tx.commit(token);

    const isApproved =
      response?.status === "AUTHORIZED" &&
      Number(response?.response_code) === 0;

    order.payment = {
      ...(order.payment || {}),
      method: "webpay",
      status: isApproved ? "approved" : "rejected",
      token,
      authorization_code: response?.authorization_code || null,
      transaction_date: response?.transaction_date || new Date(),
      response_code: response?.response_code ?? null,
      buy_order: response?.buy_order || order?.payment?.buy_order,
      session_id: response?.session_id || order?.payment?.session_id,
      amount: response?.amount || order?.total,
    };

    order.status = isApproved ? "paid" : "pending";
    await order.save();

    if (isApproved && order.customer?.email) {
      const emailTemplate = buildPaymentApprovedTemplate({
        name: order.customer?.fullName || "cliente",
        orderId: order._id,
        total: order.total,
      });

      try {
        await sendEmail({
          to: order.customer.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      } catch (emailError) {
        console.error("PAYMENT APPROVED EMAIL ERROR:", emailError.message);
      }
    }

    return res.status(200).json({
      message: isApproved ? "Pago confirmado" : "Pago rechazado",
      success: isApproved,
      order,
      webpay: response,
    });
  } catch (error) {
    console.error("WEBPAY COMMIT ERROR:", error);

    return res.status(500).json({
      message: "No se pudo confirmar la transacción Webpay",
      error: error.message,
    });
  }
};

export const handleWebpayReturn = async (req, res) => {
  try {
    const tokenWs =
      req.method === "GET" ? req.query.token_ws : req.body.token_ws;

    const tbkToken =
      req.method === "GET" ? req.query.TBK_TOKEN : req.body.TBK_TOKEN;

    const tbkOrder =
      req.method === "GET"
        ? req.query.TBK_ORDEN_COMPRA
        : req.body.TBK_ORDEN_COMPRA;

    if (tokenWs) {
      console.log("WEBPAY RETURN token_ws:", tokenWs);

      const order = await Order.findOne({ "payment.token": tokenWs });

      if (!order) {
        return res
          .status(404)
          .send("No se encontró la orden asociada a la transacción");
      }
      const { successBase, failedBase } = getFrontendUrls(order);

      console.log("ORDER PAYMENT PLATFORM:", order?.payment?.platform);
      console.log(
        "FRONTEND_SUCCESS_URL_WEB:",
        process.env.FRONTEND_SUCCESS_URL_WEB,
      );
      console.log("FRONTEND_SUCCESS_URL:", process.env.FRONTEND_SUCCESS_URL);
      console.log("REDIRECT SUCCESS BASE:", successBase);
      console.log("REDIRECT FAILED BASE:", failedBase);

      // ✅ Ya procesada: no volver a commit
      if (order.payment?.status === "approved" || order.status === "paid") {
        return res.redirect(`${successBase}?orderId=${order._id}`);
      }

      if (order.payment?.status === "rejected") {
        return res.redirect(
          `${failedBase}?orderId=${order._id}&status=rejected`,
        );
      }

      if (
        order.payment?.status === "cancelled" ||
        order.status === "cancelled"
      ) {
        return res.redirect(
          `${failedBase}?orderId=${order._id}&status=cancelled`,
        );
      }

      const tx = getTransaction();
      const response = await tx.commit(tokenWs);

      console.log("WEBPAY RETURN RESPONSE:", response);

      const isApproved =
        response?.status === "AUTHORIZED" &&
        Number(response?.response_code) === 0;

      order.payment = {
        ...(order.payment || {}),
        method: "webpay",
        status: isApproved ? "approved" : "rejected",
        token: tokenWs,
        authorization_code: response?.authorization_code || null,
        transaction_date: response?.transaction_date || new Date(),
        response_code: response?.response_code ?? null,
        buy_order: response?.buy_order || order?.payment?.buy_order,
        session_id: response?.session_id || order?.payment?.session_id,
        amount: response?.amount || order?.total,
      };

      order.status = isApproved ? "paid" : "pending";
      await order.save();

      if (isApproved) {
        try {
          await createShipmentForPaidOrder(order._id);
        } catch (shipmentError) {
          console.error(
            "BLUE SHIPMENT AFTER RETURN ERROR:",
            shipmentError.message,
          );
        }
      }

      const redirectUrl = isApproved
        ? `${successBase}?orderId=${order._id}`
        : `${failedBase}?orderId=${order._id}&status=rejected`;

      return res.redirect(redirectUrl);
    }

    if (tbkToken) {
      const order = await Order.findOne({ "payment.buy_order": tbkOrder });

      if (order) {
        const { failedBase } = getFrontendUrls(order);

        // Si ya estaba aprobada, no la pises
        if (order.payment?.status === "approved" || order.status === "paid") {
          return res.redirect(
            `${failedBase}?orderId=${order._id}&status=approved`,
          );
        }

        order.payment = {
          ...(order.payment || {}),
          method: "webpay",
          status: "cancelled",
          token: tbkToken,
        };

        order.status = "cancelled";
        await order.save();

        return res.redirect(
          `${failedBase}?orderId=${order._id}&status=cancelled`,
        );
      }

      return res.status(200).send("Pago cancelado por el usuario");
    }

    return res.status(400).send("Retorno Webpay inválido");
  } catch (error) {
    console.error("WEBPAY RETURN ERROR:", error?.message);
    console.error(error);
    return res.status(500).send("Error procesando retorno Webpay");
  }
};
