export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}
