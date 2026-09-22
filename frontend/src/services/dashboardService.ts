import api from "../api/axios";

export interface DashboardSummary {
  total_rooms: number;
  available_rooms: number;
  unavailable_rooms: number;
  total_resources: number;
  available_resources: number;
  unavailable_resources: number;
  total_bookings: number;
  today_bookings: number;
  upcoming_bookings: number;
  cancelled_bookings: number;
}

export interface UpcomingMeeting {
  id: number;
  user_id: number;
  room_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface AvailableRoom {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  facilities: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomUtilization {
  room_id: number;
  room_name: string;
  total_bookings: number;
  booked_hours: number;
  utilization_percentage: number;
}

export interface ResourceUsage {
  resource_id: number;
  resource_name: string;
  resource_type: string;
  total_quantity: number;
  total_bookings: number;
  quantity_hours: number;
}

export interface MonthlyBooking {
  month: number;
  month_name: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
}

export const getDashboardSummary =
  async (): Promise<DashboardSummary> => {
    const response =
      await api.get<DashboardSummary>(
        "/dashboard/summary"
      );

    return response.data;
  };

export const getUpcomingMeetings =
  async (): Promise<UpcomingMeeting[]> => {
    const response =
      await api.get<UpcomingMeeting[]>(
        "/dashboard/upcoming-meetings"
      );

    return response.data;
  };

export const getAvailableRooms =
  async (
    startTime: string,
    endTime: string,
    minCapacity?: number,
    location?: string
  ): Promise<AvailableRoom[]> => {
    const response =
      await api.get<AvailableRoom[]>(
        "/dashboard/available-rooms",
        {
          params: {
            start_time: startTime,
            end_time: endTime,
            min_capacity: minCapacity,
            location,
          },
        }
      );

    return response.data;
  };

export const getRoomUtilization =
  async (
    startDate: string,
    endDate: string
  ): Promise<RoomUtilization[]> => {
    const response =
      await api.get<RoomUtilization[]>(
        "/dashboard/room-utilization",
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

    return response.data;
  };

export const getResourceUsage =
  async (
    startDate: string,
    endDate: string
  ): Promise<ResourceUsage[]> => {
    const response =
      await api.get<ResourceUsage[]>(
        "/dashboard/resource-usage",
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

    return response.data;
  };

export const getMonthlyBookings =
  async (
    year: number
  ): Promise<MonthlyBooking[]> => {
    const response =
      await api.get<MonthlyBooking[]>(
        "/dashboard/monthly-bookings",
        {
          params: {
            year,
          },
        }
      );

    return response.data;
  };