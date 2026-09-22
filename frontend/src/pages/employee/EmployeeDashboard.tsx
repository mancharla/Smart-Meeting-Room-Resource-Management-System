import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import {
  ArrowForward,
  Event,
  MeetingRoom,
  Notifications,
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { getBookings } from "../../services/bookingService";
import {
  getDashboardSummary,
  getUpcomingMeetings,
  type UpcomingMeeting,
} from "../../services/dashboardService";
import { getMeetingRooms } from "../../services/roomService";
import { getNotifications } from "../../services/notificationService";

interface EmployeeStats {
  upcomingMeetings: number;
  availableRooms: number;
  myBookings: number;
  unreadNotifications: number;
}

const initialStats: EmployeeStats = {
  upcomingMeetings: 0,
  availableRooms: 0,
  myBookings: 0,
  unreadNotifications: 0,
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(initialStats);
  const [upcomingMeetings, setUpcomingMeetings] = useState<
    UpcomingMeeting[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployeeDashboard = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getUpcomingMeetings(),
        getBookings({ booking_status: "CONFIRMED" }),
        getMeetingRooms({ is_available: true }),
        getNotifications(true),
        getDashboardSummary(),
      ]);

      const [
        upcomingResult,
        bookingsResult,
        roomsResult,
        notificationsResult,
        summaryResult,
      ] = results;

      if (upcomingResult.status === "fulfilled") {
        setUpcomingMeetings(upcomingResult.value.slice(0, 5));
        setStats((current) => ({
          ...current,
          upcomingMeetings: upcomingResult.value.length,
        }));
      }

      if (bookingsResult.status === "fulfilled") {
        const futureBookings = bookingsResult.value
          .filter(
            (booking) =>
              new Date(booking.start_time).getTime() > Date.now()
          )
          .sort(
            (first, second) =>
              new Date(first.start_time).getTime() -
              new Date(second.start_time).getTime()
          );

        if (upcomingResult.status === "rejected") {
          setUpcomingMeetings(
            futureBookings.slice(0, 5).map((booking) => ({
              id: booking.id,
              user_id: booking.user_id,
              room_id: booking.room_id,
              title: booking.title,
              description: booking.description || "",
              start_time: booking.start_time,
              end_time: booking.end_time,
              status: booking.status,
            }))
          );
          setStats((current) => ({
            ...current,
            upcomingMeetings: futureBookings.length,
          }));
        }

        setStats((current) => ({
          ...current,
          myBookings: bookingsResult.value.length,
        }));
      }

      if (roomsResult.status === "fulfilled") {
        setStats((current) => ({
          ...current,
          availableRooms: roomsResult.value.length,
        }));
      } else if (summaryResult.status === "fulfilled") {
        setStats((current) => ({
          ...current,
          availableRooms: summaryResult.value.available_rooms,
        }));
      }

      if (notificationsResult.status === "fulfilled") {
        setStats((current) => ({
          ...current,
          unreadNotifications: notificationsResult.value.length,
        }));
      }

      if (results.some((result) => result.status === "rejected")) {
        setError("Some dashboard data is temporarily unavailable.");
      }

      setLoading(false);
    };

    void loadEmployeeDashboard();
  }, []);

  return (
    <MainLayout>
      <Box>
        <Box
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            color: "#FFFFFF",
            background:
              "linear-gradient(115deg, #12263A 0%, #1B6586 72%, #4D9BA9 100%)",
            boxShadow: "0 18px 38px rgba(18, 38, 58, 0.18)",
          }}
        >
          <Chip
            label="EMPLOYEE WORKSPACE"
            size="small"
            sx={{
              mb: 1.5,
              color: "#D7F0F2",
              backgroundColor: "rgba(255,255,255,0.13)",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back, {user?.full_name}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
            Plan your next meeting and keep your workday moving.
          </Typography>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate("/bookings")}
            sx={{
              mt: 2.5,
              color: "#FFFFFF",
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": {
                borderColor: "#FFFFFF",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Book a meeting
          </Button>
        </Box>

        {error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{ minHeight: 280, display: "grid", placeItems: "center" }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {[
                {
                  label: "Upcoming meetings",
                  value: stats.upcomingMeetings,
                  icon: <Event />,
                  color: "#1B6586",
                },
                {
                  label: "Available rooms",
                  value: stats.availableRooms,
                  icon: <MeetingRoom />,
                  color: "#4D9BA9",
                },
                {
                  label: "My bookings",
                  value: stats.myBookings,
                  icon: <Event />,
                  color: "#D47752",
                },
                {
                  label: "Unread notifications",
                  value: stats.unreadNotifications,
                  icon: <Notifications />,
                  color: "#7D6B8A",
                },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ height: "100%", borderTop: `3px solid ${item.color}` }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">{item.label}</Typography>
                        <Box sx={{ color: item.color }}>{item.icon}</Box>
                      </Box>
                      <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                        {item.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Upcoming meetings
                  </Typography>
                  <Button size="small" onClick={() => navigate("/bookings")}>
                    View all
                  </Button>
                </Box>
                {upcomingMeetings.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No upcoming meetings scheduled.
                  </Typography>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <Box
                      key={meeting.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 1.75,
                        borderBottom: "1px solid rgba(19,34,56,0.08)",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {meeting.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Room {meeting.room_id} · {formatDateTime(meeting.start_time)}
                        </Typography>
                      </Box>
                      <Chip size="small" label={meeting.status} color="success" />
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </MainLayout>
  );
}