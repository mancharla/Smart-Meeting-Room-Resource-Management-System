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
  Inventory2,
  Search,
} from "@mui/icons-material";

import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
} from "../../services/resourceService";

import type {
  Resource,
  ResourceCreate,
} from "../../types/resource";

const emptyForm: ResourceCreate = {
  name: "",
  resource_type: "",
  quantity: 1,
  description: "",
  is_available: true,
};

export default function Resources() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<Resource | null>(null);
  const [formData, setFormData] =
    useState<ResourceCreate>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadResources = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getResources({
        search: search.trim() || undefined,
        resource_type: resourceType.trim() || undefined,
        is_available:
          availability === ""
            ? undefined
            : availability === "true",
      });
      setResources(data);
    } catch (requestError) {
      console.error("Resources loading error:", requestError);
      setResources([]);
      setError("Unable to load resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  const updateForm = (
    field: keyof ResourceCreate,
    value: string | number | boolean
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingResource(null);
    setFormData({ ...emptyForm });
  };

  const saveResource = async () => {
    if (!formData.name.trim() || !formData.resource_type.trim()) {
      setError("Name and resource type are required.");
      return;
    }

    if (formData.quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingResource) {
        await updateResource(editingResource.id, formData);
      } else {
        await createResource(formData);
      }
      closeDialog();
      await loadResources();
    } catch (requestError) {
      console.error("Resource save error:", requestError);
      setError("Unable to save resource.");
    } finally {
      setSaving(false);
    }
  };

  const removeResource = async (resource: Resource) => {
    setDeletingId(resource.id);
    setError("");

    try {
      await deleteResource(resource.id);
      await loadResources();
    } catch (requestError) {
      console.error("Resource delete error:", requestError);
      setError("Unable to delete resource.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Resources
            </Typography>
            <Typography color="text.secondary">
              View and manage equipment available for meetings.
            </Typography>
          </Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingResource(null);
                setFormData({ ...emptyForm });
                setDialogOpen(true);
              }}
            >
              Add Resource
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Search resources"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadResources();
                  }}
                  slotProps={{
                    input: {
                      startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Resource type"
                  value={resourceType}
                  onChange={(event) => setResourceType(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select
                    value={availability}
                    label="Availability"
                    onChange={(event) => setAvailability(event.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Available</MenuItem>
                    <MenuItem value="false">Unavailable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button fullWidth variant="contained" onClick={() => void loadResources()}>
                  Search
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : resources.length === 0 ? (
          <Alert severity="info">No resources found.</Alert>
        ) : (
          <Grid container spacing={3}>
            {resources.map((resource) => (
              <Grid key={resource.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Inventory2 color="primary" />
                      <Chip
                        size="small"
                        label={resource.is_available ? "Available" : "Unavailable"}
                        color={resource.is_available ? "success" : "default"}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                      {resource.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {resource.resource_type} · Quantity: {resource.quantity}
                    </Typography>
                    {resource.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {resource.description}
                      </Typography>
                    )}
                    {isAdmin && (
                      <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
                        <IconButton
                          color="primary"
                          title="Edit resource"
                          onClick={() => {
                            setEditingResource(resource);
                            setFormData({
                              name: resource.name,
                              resource_type: resource.resource_type,
                              quantity: resource.quantity,
                              description: resource.description || "",
                              is_available: resource.is_available,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          title="Delete resource"
                          disabled={deletingId === resource.id}
                          onClick={() => void removeResource(resource)}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              required
              label="Name"
              value={formData.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />
            <TextField
              fullWidth
              required
              label="Resource type"
              value={formData.resource_type}
              onChange={(event) => updateForm("resource_type", event.target.value)}
            />
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={(event) => updateForm("quantity", Number(event.target.value))}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={formData.description}
              onChange={(event) => updateForm("description", event.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={formData.is_available ? "true" : "false"}
                label="Availability"
                onChange={(event) => updateForm("is_available", event.target.value === "true")}
              >
                <MenuItem value="true">Available</MenuItem>
                <MenuItem value="false">Unavailable</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button onClick={() => void saveResource()} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Resource"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
