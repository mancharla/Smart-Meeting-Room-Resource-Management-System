import api from "../api/axios";

import type {
  BookingReport,
  BookingReportSummary,
} from "../types/report";

export interface BookingReportParams {
  start_date?: string;
  end_date?: string;
  booking_status?: string;
}

export const getBookingReport = async (
  params?: BookingReportParams
): Promise<BookingReport[]> => {
  const response = await api.get<BookingReport[]>(
    "/reports/bookings",
    { params }
  );
  return response.data;
};

export const getBookingReportSummary = async (
  params?: BookingReportParams
): Promise<BookingReportSummary> => {
  const response = await api.get<BookingReportSummary>(
    "/reports/bookings/summary",
    { params }
  );
  return response.data;
};

export const downloadBookingReport = async (
  format: "pdf" | "excel",
  params?: BookingReportParams
): Promise<void> => {
  const response = await api.get<Blob>(
    `/reports/bookings/export/${format}`,
    {
      params,
      responseType: "blob",
    }
  );

  const extension = format === "pdf" ? "pdf" : "xlsx";
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `booking_report.${extension}`;
  link.click();

  URL.revokeObjectURL(url);
};
