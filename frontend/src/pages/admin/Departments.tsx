import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Business,
  Delete,
  Edit,
} from "@mui/icons-material";

import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../services/departmentService";

import type {
  Department,
  DepartmentCreate,
} from "../../types/department";

const emptyForm: DepartmentCreate = {
  name: "",
  description: "",
};

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentCreate>({
    ...emptyForm,
  });

  const loadDepartments = async () => {
    setLoading(true);
    setError("");

    try {
      setDepartments(await getDepartments());
    } catch (requestError) {
      console.error("Departments loading error:", requestError);
      setDepartments([]);
      setError("Unable to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingDepartment(null);
    setFormData({ ...emptyForm });
  };

  const saveDepartment = async () => {
    if (!formData.name.trim()) {
      setError("Department name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, formData);
      } else {
        await createDepartment(formData);
      }
      closeDialog();
      await loadDepartments();
    } catch (requestError) {
      console.error("Department save error:", requestError);
      setError("Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const removeDepartment = async (department: Department) => {
    setDeletingId(department.id);
    setError("");

    try {
      await deleteDepartment(department.id);
      await loadDepartments();
    } catch (requestError) {
      console.error("Department delete error:", requestError);
      setError("Unable to delete department. It may have assigned users.");
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
              Departments
            </Typography>
            <Typography color="text.secondary">
              Organize users into company departments.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingDepartment(null);
              setFormData({ ...emptyForm });
              setDialogOpen(true);
            }}
          >
            Add Department
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : departments.length === 0 ? (
          <Alert severity="info">No departments found.</Alert>
        ) : (
          <Grid container spacing={3}>
            {departments.map((department) => (
              <Grid key={department.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Business color="primary" />
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                      {department.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ minHeight: 48, mt: 1 }}>
                      {department.description || "No description provided."}
                    </Typography>
                    <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
                      <IconButton
                        color="primary"
                        title="Edit department"
                        onClick={() => {
                          setEditingDepartment(department);
                          setFormData({
                            name: department.name,
                            description: department.description || "",
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        title="Delete department"
                        disabled={deletingId === department.id}
                        onClick={() => void removeDepartment(department)}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingDepartment ? "Edit Department" : "Add Department"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              required
              label="Department name"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
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
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void saveDepartment()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Department"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
