import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

import {
  PictureAsPdf,
  TableView,
} from "@mui/icons-material";

import MainLayout from "../../components/layout/MainLayout";
import {
  downloadBookingReport,
  getBookingReport,
  getBookingReportSummary,
} from "../../services/reportService";

import type { BookingReportParams } from "../../services/reportService";

import type {
  BookingReport,
  BookingReportSummary,
} from "../../types/report";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function Reports() {
  const [summary, setSummary] = useState<BookingReportSummary | null>(null);
  const [reports, setReports] = useState<BookingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const loadReports = async () => {
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    const params: BookingReportParams = {
      start_date: startDate
        ? `${startDate}T00:00:00`
        : undefined,
      end_date: endDate
        ? `${endDate}T23:59:59`
        : undefined,
      booking_status: status || undefined,
    };

      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getBookingReportSummary(params),
        getBookingReport(params),
      ]);

      const [summaryResult, reportResult] = results;

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      }
      if (reportResult.status === "fulfilled") {
        setReports(reportResult.value);
      }
      if (results.some((result) => result.status === "rejected")) {
        setError("Some report data is unavailable.");
      }

      setLoading(false);
  };

  const exportReport = async (format: "pdf" | "excel") => {
    setExporting(format);
    setError("");

    try {
      await downloadBookingReport(format, {
        start_date: startDate
          ? `${startDate}T00:00:00`
          : undefined,
        end_date: endDate
          ? `${endDate}T23:59:59`
          : undefined,
        booking_status: status || undefined,
      });
    } catch (requestError) {
      console.error("Report export error:", requestError);
      setError(`Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setExporting(null);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    void loadReports();
  }, []);

  return (
    <MainLayout>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Reports
          </Typography>
          <Typography color="text.secondary">
            Review booking activity and meeting usage.
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { md: "center" } }}
            >
              <TextField
                label="Start date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl sx={{ minWidth: 170 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => void loadReports()}
                disabled={loading}
              >
                Apply filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                disabled={exporting !== null}
                onClick={() => void exportReport("pdf")}
              >
                {exporting === "pdf" ? "Exporting..." : "PDF"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableView />}
                disabled={exporting !== null}
                onClick={() => void exportReport("excel")}
              >
                {exporting === "excel" ? "Exporting..." : "Excel"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="info" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                ["Total bookings", summary?.total_bookings ?? 0],
                ["Confirmed", summary?.confirmed_bookings ?? 0],
                ["Cancelled", summary?.cancelled_bookings ?? 0],
                ["Booked hours", summary?.total_booked_hours ?? 0],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary">{label}</Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                        {value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {reports.length === 0 ? (
              <Alert severity="info">No booking report data found.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Meeting</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.booking_id} hover>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.room_id}</TableCell>
                        <TableCell>{formatDate(report.start_time)}</TableCell>
                        <TableCell>{formatDate(report.end_time)}</TableCell>
                        <TableCell><Chip size="small" label={report.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
}
