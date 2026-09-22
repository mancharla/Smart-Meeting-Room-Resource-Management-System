import api from "../api/axios";

import type { Notification } from "../types/notification";

export const getNotifications = async (
  unreadOnly = false
): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(
    "/notifications",
    { params: { unread_only: unreadOnly } }
  );
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<Notification> => {
  const response = await api.patch<Notification>(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (
  notificationId: number
): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
