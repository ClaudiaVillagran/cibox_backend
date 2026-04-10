import Order from "../models/Order.js";
import pkg from "transbank-sdk";
import { webpayOptions } from "../config/webpay.js";

const { WebpayPlus } = pkg;

const getTransaction = () => new WebpayPlus.Transaction(webpayOptions);

const buildBuyOrder = (orderId) => {
  const shortId = String(orderId).slice(-10);
  const shortTs = Date.now().toString().slice(-8);
  return `O${shortId}${shortTs}`;
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

    if (String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const buyOrder = buildBuyOrder(order._id);
    const sessionId = String(req.user.id).slice(-20);
    const amount = Math.round(order.total);
    const returnUrl = process.env.WEBPAY_RETURN_URL;

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
      platform: platform || "native",
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

    if (String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "No autorizado para esta orden" });
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

    // ✅ PAGO EXITOSO
    if (tokenWs) {
      const tx = getTransaction();
      const response = await tx.commit(tokenWs);

      const order = await Order.findOne({ "payment.token": tokenWs });

      if (order) {
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

        const isWeb = order?.payment?.platform === "web";

        const successBase = isWeb
          ? process.env.FRONTEND_SUCCESS_URL_WEB
          : process.env.FRONTEND_SUCCESS_URL;

        const failedBase = isWeb
          ? process.env.FRONTEND_FAILED_URL_WEB
          : process.env.FRONTEND_FAILED_URL;

        const redirectUrl = isApproved
          ? `${successBase}?orderId=${order._id}`
          : isWeb
            ? `${failedBase}/${order._id}`
            : `${failedBase}/${order._id}`;

        return res.redirect(redirectUrl);
      }

      return res
        .status(200)
        .send("Transacción procesada, pero no se encontró la orden");
    }

    // ❌ PAGO CANCELADO
    if (tbkToken) {
      const order = await Order.findOne({ "payment.buy_order": tbkOrder });

      if (order) {
        order.payment = {
          ...(order.payment || {}),
          method: "webpay",
          status: "cancelled",
          token: tbkToken,
        };

        order.status = "cancelled";

        await order.save();

        return res.redirect(`${failedBase}/${order._id}?status=cancelled`);
      }

      return res.status(200).send("Pago cancelado por el usuario");
    }

    return res.status(400).send("Retorno Webpay inválido");
  } catch (error) {
    console.error("WEBPAY RETURN ERROR:", error);
    return res.status(500).send("Error procesando retorno Webpay");
  }
};
