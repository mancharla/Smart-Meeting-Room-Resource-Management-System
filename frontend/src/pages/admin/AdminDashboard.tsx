import {
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import {
  MeetingRoom,
  Event,
  Inventory2,
  TrendingUp,
  ArrowForward,
} from "@mui/icons-material";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Bar,
} from "react-chartjs-2";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";

import { useAuth } from "../../context/AuthContext";

import {
  getDashboardSummary,
  getMonthlyBookings,
  getRoomUtilization,
  getResourceUsage,
  getUpcomingMeetings,
  type DashboardSummary,
  type MonthlyBooking,
  type RoomUtilization,
  type ResourceUsage,
  type UpcomingMeeting,
} from "../../services/dashboardService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [meetings, setMeetings] =
    useState<UpcomingMeeting[]>([]);

  const [roomUtilization, setRoomUtilization] =
    useState<RoomUtilization[]>([]);

  const [resourceUsage, setResourceUsage] =
    useState<ResourceUsage[]>([]);

  const [monthlyBookings, setMonthlyBookings] =
    useState<MonthlyBooking[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const now = new Date();

        const startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        const endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const results = await Promise.allSettled([
          getDashboardSummary(),
          getUpcomingMeetings(),
          getRoomUtilization(
            startDate.toISOString(),
            endDate.toISOString()
          ),
          getResourceUsage(
            startDate.toISOString(),
            endDate.toISOString()
          ),
          getMonthlyBookings(
            now.getFullYear()
          ),
        ]);

        const [
          summaryData,
          meetingsData,
          roomData,
          resourceData,
          monthlyData,
        ] = results;

        if (summaryData.status === "fulfilled") {
          setSummary(summaryData.value);
        }

        if (meetingsData.status === "fulfilled") {
          setMeetings(meetingsData.value);
        }

        if (roomData.status === "fulfilled") {
          setRoomUtilization(roomData.value);
        }

        if (resourceData.status === "fulfilled") {
          setResourceUsage(resourceData.value);
        }

        if (monthlyData.status === "fulfilled") {
          setMonthlyBookings(monthlyData.value);
        }

        results
          .filter(
            (result) => result.status === "rejected"
          )
          .forEach((result) => {
            if (result.status === "rejected") {
              console.error(
                "Dashboard section loading error:",
                result.reason
              );
            }
          });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const monthlyChartData = {
    labels: monthlyBookings.map(
      (item) => item.month_name
    ),

    datasets: [
      {
        label: "Bookings",
        data: monthlyBookings.map(
          (item) => item.total_bookings
        ),

        borderWidth: 2,
      },
    ],
  };

  const roomChartData = {
    labels: roomUtilization.map(
      (room) => room.room_name
    ),

    datasets: [
      {
        label: "Utilization %",
        data: roomUtilization.map(
          (room) =>
            room.utilization_percentage
        ),

        borderWidth: 1,
      },
    ],
  };

  const formatDateTime = (
    value: string
  ) => {
    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          color: "#FFFFFF",
          background: "linear-gradient(115deg, #12263A 0%, #1B6586 72%, #4D9BA9 100%)",
          boxShadow: "0 18px 38px rgba(18, 38, 58, 0.18)",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 240,
            height: 240,
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50%",
            right: -70,
            top: -120,
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Chip
            label="OPERATIONS OVERVIEW"
            size="small"
            sx={{
              mb: 1.5,
              color: "#D7F0F2",
              backgroundColor: "rgba(255,255,255,0.13)",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          />
        <Typography
          variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Welcome back, {user?.full_name}
        </Typography>

        <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
          Here's an overview of your meeting
          room and resource management system.
        </Typography>
        <Button
          endIcon={<ArrowForward />}
          onClick={() => navigate("/bookings")}
          sx={{
            mt: 2.5,
            color: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.3)",
            "&:hover": { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" },
          }}
          variant="outlined"
        >
          Review bookings
        </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%", borderTop: "3px solid #1B6586" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Rooms
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    {summary?.total_rooms ?? 0}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="success.main"
                  >
                    {summary?.available_rooms ??
                      0}{" "}
                    available
                  </Typography>
                </Box>

                <MeetingRoom
                  sx={{
                    fontSize: 40,
                    color: "primary.main",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%", borderTop: "3px solid #4D9BA9" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Today's Meetings
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    {summary?.today_bookings ??
                      0}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {summary?.upcoming_bookings ??
                      0}{" "}
                    upcoming
                  </Typography>
                </Box>

                <Event
                  sx={{
                    fontSize: 40,
                    color: "success.main",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%", borderTop: "3px solid #D47752" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Resources
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    {summary?.total_resources ??
                      0}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="success.main"
                  >
                    {summary?.available_resources ??
                      0}{" "}
                    available
                  </Typography>
                </Box>

                <Inventory2
                  sx={{
                    fontSize: 40,
                    color: "warning.main",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%", borderTop: "3px solid #7D6B8A" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Bookings
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: 700 }}
                  >
                    {summary?.total_bookings ??
                      0}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="error.main"
                  >
                    {summary?.cancelled_bookings ??
                      0}{" "}
                    cancelled
                  </Typography>
                </Box>

                <TrendingUp
                  sx={{
                    fontSize: 40,
                    color: "secondary.main",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid
        container
        spacing={3}
        sx={{ mt: 1 }}
      >
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, minHeight: 390 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Monthly Bookings
            </Typography>

            <Box
              sx={{
                height: 320,
              }}
            >
              <Bar
                data={monthlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, minHeight: 390 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Room Utilization
            </Typography>

            <Box
              sx={{
                height: 320,
              }}
            >
              <Bar
                data={roomChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Meetings */}
      <Paper
        sx={{
          mt: 3,
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Upcoming Meetings
        </Typography>

        {meetings.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 3 }}
          >
            No upcoming meetings.
          </Typography>
        ) : (
          meetings.slice(0, 5).map(
            (meeting) => (
              <Box
                key={meeting.id}
                sx={{
                  py: 2,
                  borderBottom:
                    "1px solid #eee",
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                <Typography
                  sx={{ fontWeight: 600 }}
                >
                  {meeting.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {formatDateTime(
                    meeting.start_time
                  )}{" "}
                  —{" "}
                  {formatDateTime(
                    meeting.end_time
                  )}
                </Typography>
              </Box>
            )
          )
        )}
      </Paper>

      {/* Resource Usage */}
      <Paper
        sx={{
          mt: 3,
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Resource Usage
        </Typography>

        {resourceUsage.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 2 }}
          >
            No resource usage data available.
          </Typography>
        ) : (
          resourceUsage
            .slice(0, 5)
            .map((resource) => (
              <Box
                key={resource.resource_id}
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  py: 1.5,
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontWeight: 600 }}
                  >
                    {resource.resource_name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {resource.resource_type}
                  </Typography>
                </Box>

                <Typography
                  sx={{ fontWeight: 600 }}
                >
                  {resource.total_bookings}{" "}
                  bookings
                </Typography>
              </Box>
            ))
        )}
      </Paper>
    </MainLayout>
  );
}