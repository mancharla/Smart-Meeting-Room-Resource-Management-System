import api from "../api/axios";

import type {
  Booking,
  BookingCreate,
  BookingSearchParams,
} from "../types/booking";

export const createBooking = async (
  data: BookingCreate
): Promise<Booking> => {
  const response = await api.post<Booking>(
    "/bookings",
    data
  );

  return response.data;
};

export const cancelBooking = async (
  bookingId: number
): Promise<Booking> => {
  const response = await api.patch<Booking>(
    `/bookings/${bookingId}/cancel`
  );

  return response.data;
};

export const getBookings = async (
  params?: BookingSearchParams
): Promise<Booking[]> => {
  const response = await api.get<Booking[]>(
    "/bookings",
    { params }
  );

  return response.data;
};
