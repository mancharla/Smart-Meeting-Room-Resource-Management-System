export type BookingStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  recurrence: string | null;
  recurrence_end_date: string | null;
  status: BookingStatus;
  resources: Array<{
    resource_id: number;
    quantity: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface BookingSearchParams {
  title?: string;
  booking_status?: BookingStatus;
  start_date?: string;
  end_date?: string;
}

export interface BookingCreate {
  room_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  recurrence?: string;
  recurrence_end_date?: string;
  resources?: Array<{
    resource_id: number;
    quantity: number;
  }>;
}
