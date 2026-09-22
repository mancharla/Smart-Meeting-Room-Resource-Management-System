import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { Search } from "@mui/icons-material";
import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import {
  activateUser,
  deactivateUser,
  getUsers,
} from "../../services/userService";

import type { AdminUser } from "../../types/user";

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers({
        search: search.trim() || undefined,
      });
      setUsers(data);
    } catch (requestError) {
      console.error("Users loading error:", requestError);
      setUsers([]);
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleUserStatus = async (user: AdminUser) => {
    setUpdatingId(user.id);
    setError("");

    try {
      const updated = user.is_active
        ? await deactivateUser(user.id)
        : await activateUser(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } catch (requestError) {
      console.error("User status update error:", requestError);
      setError("Unable to update user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Users
          </Typography>
          <Typography color="text.secondary">
            Manage accounts and access status.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Search by name or email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadUsers();
                  }}
                  slotProps={{
                    input: {
                      startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => void loadUsers()}
                  sx={{ height: 40 }}
                >
                  Search Users
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Alert severity="info">No users found.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role_name || "-"}</TableCell>
                    <TableCell>{user.department_name || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.is_active ? "Active" : "Inactive"}
                        color={user.is_active ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.is_active ? "error" : "success"}
                        disabled={updatingId === user.id}
                        onClick={() => void toggleUserStatus(user)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </MainLayout>
  );
}
