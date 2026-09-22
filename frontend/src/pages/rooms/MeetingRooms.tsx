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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  MeetingRoom as MeetingRoomIcon,
  Search,
} from "@mui/icons-material";

import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";

import {
  createMeetingRoom,
  deleteMeetingRoom,
  getMeetingRooms,
  updateMeetingRoom,
} from "../../services/roomService";

import type {
  MeetingRoom,
  MeetingRoomCreate,
} from "../../types/room";

const emptyForm: MeetingRoomCreate = {
  name: "",
  location: "",
  capacity: 1,
  description: "",
  facilities: "",
  is_available: true,
};

export default function MeetingRooms() {
  const { user } = useAuth();

  const isAdmin = user?.role_id === 1;

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [availability, setAvailability] = useState("");

  // Create / Edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] =
    useState<MeetingRoom | null>(null);

  const [formData, setFormData] =
    useState<MeetingRoomCreate>(emptyForm);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [selectedRoom, setSelectedRoom] =
    useState<MeetingRoom | null>(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMeetingRooms({
        search: search.trim() || undefined,
        location: location.trim() || undefined,
        min_capacity: minCapacity
          ? Number(minCapacity)
          : undefined,
        is_available:
          availability === ""
            ? undefined
            : availability === "true",
      });

      setRooms(data);
    } catch (err: any) {
      console.error(
        "Meeting rooms loading error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load meeting rooms."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleSearch = () => {
    loadRooms();
  };

  const handleClearFilters = async () => {
    setSearch("");
    setLocation("");
    setMinCapacity("");
    setAvailability("");

    try {
      setLoading(true);
      setError("");

      const data = await getMeetingRooms();

      setRooms(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load meeting rooms."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({ ...emptyForm });
    setError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (room: MeetingRoom) => {
    setEditingRoom(room);

    setFormData({
      name: room.name,
      location: room.location,
      capacity: room.capacity,
      description: room.description || "",
      facilities: room.facilities || "",
      is_available: room.is_available,
    });

    setError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingRoom(null);
    setFormData({ ...emptyForm });
  };

  const handleFormChange = (
    field: keyof MeetingRoomCreate,
    value: string | number | boolean
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Room name is required.");
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required.");
      return;
    }

    if (!formData.capacity || formData.capacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingRoom) {
        await updateMeetingRoom(
          editingRoom.id,
          formData
        );
      } else {
        await createMeetingRoom(formData);
      }

      setDialogOpen(false);
      setEditingRoom(null);
      setFormData({ ...emptyForm });

      await loadRooms();
    } catch (err: any) {
      console.error(
        "Meeting room save error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to save meeting room."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedRoom(null);
  };

  const handleDelete = async () => {
    if (!selectedRoom) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteMeetingRoom(selectedRoom.id);

      setDeleteDialogOpen(false);
      setSelectedRoom(null);

      await loadRooms();
    } catch (err: any) {
      console.error(
        "Meeting room delete error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to delete meeting room."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <Box>
        {/* Page Header */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center",
            },
            flexDirection: {
              xs: "column",
              md: "row",
            },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Meeting Rooms
            </Typography>

            <Typography
              color="text.secondary"
            >
              View and manage meeting rooms,
              capacity, facilities, and
              availability.
            </Typography>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
            >
              Add Meeting Room
            </Button>
          )}
        </Box>

        {/* Error */}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Search and Filters */}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600 }}
            >
              Search & Filters
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Room name or location"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Search
                          sx={{
                            mr: 1,
                            color: "text.secondary",
                          }}
                        />
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 2.5,
                }}
              >
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="e.g. First Floor"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Min Capacity"
                  type="number"
                  value={minCapacity}
                  onChange={(event) =>
                    setMinCapacity(
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                    },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>
                    Availability
                  </InputLabel>

                  <Select
                    value={availability}
                    label="Availability"
                    onChange={(event) =>
                      setAvailability(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      All
                    </MenuItem>

                    <MenuItem value="true">
                      Available
                    </MenuItem>

                    <MenuItem value="false">
                      Unavailable
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 1.5,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  sx={{
                    height: 40,
                  }}
                >
                  Search
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  size="small"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Summary */}

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {rooms.length} meeting room
            {rooms.length !== 1 ? "s" : ""} found
          </Typography>
        </Box>

        {/* Loading */}

        {loading ? (
          <Box
            sx={{
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <CircularProgress />

            <Typography
              color="text.secondary"
            >
              Loading meeting rooms...
            </Typography>
          </Box>
        ) : rooms.length === 0 ? (
          /* Empty State */

          <Card>
            <CardContent
              sx={{
                minHeight: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <MeetingRoomIcon
                sx={{
                  fontSize: 64,
                  color: "text.disabled",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                sx={{ fontWeight: 600 }}
              >
                No meeting rooms found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Try changing your search or
                filter criteria.
              </Typography>

              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenCreate}
                  sx={{ mt: 3 }}
                >
                  Add Meeting Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Room Cards */

          <Grid
            container
            spacing={3}
          >
            {rooms.map((room) => (
              <Grid
                key={room.id}
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 4,
                }}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease",

                    "&:hover": {
                      transform:
                        "translateY(-3px)",
                      boxShadow:
                        "0 8px 24px rgba(0,0,0,0.10)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                    }}
                  >
                    {/* Room top section */}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            "rgba(21, 101, 192, 0.08)",
                          color: "primary.main",
                        }}
                      >
                        <MeetingRoomIcon />
                      </Box>

                      <Chip
                        size="small"
                        label={
                          room.is_available
                            ? "Available"
                            : "Unavailable"
                        }
                        color={
                          room.is_available
                            ? "success"
                            : "default"
                        }
                        variant={
                          room.is_available
                            ? "filled"
                            : "outlined"
                        }
                      />
                    </Box>

                    {/* Room name */}

                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 700 }}
                    >
                      {room.name}
                    </Typography>

                    {/* Location */}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      📍 {room.location}
                    </Typography>

                    {/* Capacity */}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      👥 Capacity:{" "}
                      {room.capacity} people
                    </Typography>

                    {/* Description */}

                    {room.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          lineHeight: 1.6,
                        }}
                      >
                        {room.description}
                      </Typography>
                    )}

                    {/* Facilities */}

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700 }}
                      >
                        FACILITIES
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          lineHeight: 1.5,
                        }}
                      >
                        {room.facilities ||
                          "No facilities listed"}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Admin Actions */}

                  {isAdmin && (
                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        gap: 1,
                      }}
                    >
                      <IconButton
                        color="primary"
                        onClick={() =>
                          handleOpenEdit(room)
                        }
                        title="Edit room"
                      >
                        <Edit />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() =>
                          handleOpenDelete(room)
                        }
                        title="Delete room"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create / Edit Room Dialog */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingRoom
            ? "Edit Meeting Room"
            : "Add Meeting Room"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <TextField
              fullWidth
              required
              label="Room Name"
              placeholder="Conference Room A"
              value={formData.name}
              onChange={(event) =>
                handleFormChange(
                  "name",
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              required
              label="Location"
              placeholder="First Floor"
              value={formData.location}
              onChange={(event) =>
                handleFormChange(
                  "location",
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              required
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(event) =>
                handleFormChange(
                  "capacity",
                  Number(event.target.value)
                )
              }
              slotProps={{
                htmlInput: {
                  min: 1,
                },
              }}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              placeholder="Describe the meeting room..."
              value={formData.description}
              onChange={(event) =>
                handleFormChange(
                  "description",
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Facilities"
              placeholder="Projector, Whiteboard, Video Conferencing"
              value={formData.facilities}
              onChange={(event) =>
                handleFormChange(
                  "facilities",
                  event.target.value
                )
              }
            />

            <FormControl fullWidth>
              <InputLabel>
                Availability
              </InputLabel>

              <Select
                value={
                  formData.is_available
                    ? "true"
                    : "false"
                }
                label="Availability"
                onChange={(event) =>
                  handleFormChange(
                    "is_available",
                    event.target.value ===
                      "true"
                  )
                }
              >
                <MenuItem value="true">
                  Available
                </MenuItem>

                <MenuItem value="false">
                  Unavailable
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingRoom
              ? "Update Room"
              : "Create Room"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Delete Meeting Room
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {selectedRoom?.name}
            </strong>
            ?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={handleCloseDelete}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "Deleting..."
              : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
