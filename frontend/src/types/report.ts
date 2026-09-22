export interface BookingReport {
  booking_id: number;
  user_id: number;
  room_id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface BookingReportSummary {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  total_booked_hours: number;
}
