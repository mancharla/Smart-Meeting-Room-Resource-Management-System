import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import {
  cancelBooking,
  createBooking,
  getBookings,
} from "../../services/bookingService";
import { getMeetingRooms } from "../../services/roomService";

import type {
  Booking,
  BookingCreate,
  BookingStatus,
} from "../../types/booking";
import type { MeetingRoom } from "../../types/room";

const emptyForm: BookingCreate = {
  room_id: 0,
  title: "",
  description: "",
  start_time: "",
  end_time: "",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const statusColor = (status: BookingStatus) => {
  if (status === "CONFIRMED") return "success";
  if (status === "CANCELLED") return "error";
  return "default";
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BookingCreate>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadBookings = async (
    nextTitle = title,
    nextStatus = status
  ) => {
    setLoading(true);

    try {
      const data = await getBookings({
        title: nextTitle.trim() || undefined,
        booking_status: nextStatus
          ? (nextStatus as BookingStatus)
          : undefined,
      });

      setBookings(data);
    } catch (error) {
      console.error("Meetings loading error:", error);
      setBookings([]);
      setError("Unable to load your meetings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadBookings();
    void getMeetingRooms().then(setRooms).catch((requestError) => {
      console.error("Meeting rooms loading error:", requestError);
      setError("Unable to load meeting rooms for booking.");
    });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const saveBooking = async () => {
    if (
      !formData.room_id ||
      !formData.title.trim() ||
      !formData.start_time ||
      !formData.end_time
    ) {
      setError("Room, title, start time, and end time are required.");
      return;
    }

    if (formData.end_time <= formData.start_time) {
      setError("End time must be after the start time.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createBooking({
        ...formData,
        title: formData.title.trim(),
        start_time: `${formData.start_time}:00`,
        end_time: `${formData.end_time}:00`,
        recurrence: formData.recurrence || undefined,
        recurrence_end_date: formData.recurrence_end_date
          ? `${formData.recurrence_end_date}:00`
          : undefined,
      });
      setDialogOpen(false);
      setFormData({ ...emptyForm });
      await loadBookings();
    } catch (requestError) {
      console.error("Meeting booking error:", requestError);
      setError("Unable to book this meeting. Check the room and time.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    setError("");

    try {
      const updated = await cancelBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === updated.id ? updated : booking
        )
      );
    } catch (requestError) {
      console.error("Meeting cancellation error:", requestError);
      setError("Unable to cancel this meeting.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Meetings
            </Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              Book Meeting
            </Button>
          </Box>
          <Typography color="text.secondary">
            View your scheduled meetings and bookings.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  label="Search meetings"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      loadBookings();
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      setStatus(nextStatus);
                      void loadBookings(title, nextStatus);
                    }}
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Alert severity="info">
            No meetings found.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600 }}
                      >
                        {booking.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Room {booking.room_id} · {formatDateTime(booking.start_time)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={booking.status}
                      color={statusColor(booking.status)}
                    />
                  </Box>

                  <Typography sx={{ mt: 1.5 }}>
                    {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                  </Typography>

                  {booking.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {booking.description}
                    </Typography>
                  )}

                  {booking.status !== "CANCELLED" && (
                    <Button
                      size="small"
                      color="error"
                      sx={{ mt: 1 }}
                      disabled={cancellingId === booking.id}
                      onClick={() => void handleCancel(booking.id)}
                    >
                      {cancellingId === booking.id
                        ? "Cancelling..."
                        : "Cancel meeting"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Book Meeting</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Meeting room"
              value={formData.room_id || ""}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  room_id: Number(event.target.value),
                }))
              }
            >
              {rooms.filter((room) => room.is_available).map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name} · {room.location}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              required
              label="Meeting title"
              value={formData.title}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <TextField
              select
              fullWidth
              label="Repeat"
              value={formData.recurrence || ""}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  recurrence: event.target.value || undefined,
                  recurrence_end_date: event.target.value
                    ? current.recurrence_end_date
                    : undefined,
                }))
              }
            >
              <MenuItem value="">Does not repeat</MenuItem>
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </TextField>
            {formData.recurrence && (
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Repeat until"
                value={formData.recurrence_end_date || ""}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    recurrence_end_date: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
            <TextField
              fullWidth
              required
              type="datetime-local"
              label="Start time"
              value={formData.start_time}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  start_time: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              required
              type="datetime-local"
              label="End time"
              value={formData.end_time}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  end_time: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={() => void saveBooking()} variant="contained" disabled={saving}>
            {saving ? "Booking..." : "Book Meeting"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
