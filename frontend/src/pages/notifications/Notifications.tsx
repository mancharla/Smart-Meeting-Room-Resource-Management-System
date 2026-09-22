import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { Delete, DoneAll } from "@mui/icons-material";
import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

import type { Notification } from "../../types/notification";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      setNotifications(await getNotifications());
    } catch (requestError) {
      console.error("Notifications loading error:", requestError);
      setNotifications([]);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markRead = async (notification: Notification) => {
    if (notification.is_read) return;

    try {
      const updated = await markNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) => item.id === updated.id ? updated : item)
      );
    } catch (requestError) {
      console.error("Notification update error:", requestError);
      setError("Unable to update notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    } catch (requestError) {
      console.error("Notifications update error:", requestError);
      setError("Unable to mark notifications as read.");
    }
  };

  const removeNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId)
      );
    } catch (requestError) {
      console.error("Notification delete error:", requestError);
      setError("Unable to delete notification.");
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <MainLayout>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Notifications
            </Typography>
            <Typography color="text.secondary">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
            </Typography>
          </Box>
          <Button
            startIcon={<DoneAll />}
            variant="outlined"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            Mark all as read
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

        {loading ? (
          <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Alert severity="info">No notifications found.</Alert>
        ) : (
          <Stack spacing={2}>
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                sx={{
                  borderLeft: notification.is_read ? "none" : "4px solid",
                  borderColor: "primary.main",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {notification.title}
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>{notification.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.created_at)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      {!notification.is_read && <Chip size="small" label="Unread" color="primary" />}
                      <IconButton
                        size="small"
                        title="Delete notification"
                        onClick={() => void removeNotification(notification.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {!notification.is_read && (
                    <Button size="small" sx={{ mt: 1 }} onClick={() => void markRead(notification)}>
                      Mark as read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </MainLayout>
  );
}
