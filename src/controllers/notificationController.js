import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit = 20 } = req.query;

    const filters = {
      user_id: userId,
    };

    if (unreadOnly === "true") {
      filters.is_read = false;
    }

    const notifications = await Notification.find(filters)
      .sort({ created_at: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      user_id: userId,
      is_read: false,
    });

    res.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener notificaciones",
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        user_id: userId,
      },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada",
      });
    }

    res.json({
      message: "Notificación marcada como leída",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar notificación",
      error: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      {
        user_id: userId,
        is_read: false,
      },
      {
        is_read: true,
      }
    );

    res.json({
      message: "Todas las notificaciones fueron marcadas como leídas",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al marcar notificaciones",
      error: error.message,
    });
  }
};