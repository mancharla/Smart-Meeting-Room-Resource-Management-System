import { Alert, Box, Card, CardContent, Chip, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Paper, Button } from "@mui/material";
import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { getAuditLogs } from "../../services/auditLogService";
import type { AuditLog } from "../../types/auditLog";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async (nextPage = page) => {
    setLoading(true);
    try {
      setLogs(await getAuditLogs({ page: nextPage, page_size: 20, action: action || undefined, entity_type: entityType || undefined }));
      setPage(nextPage);
    } catch (requestError) {
      console.error("Audit logs loading error:", requestError);
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadLogs(1); }, []);

  return <MainLayout><Box>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Audit Logs</Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>Review administrative activity.</Typography>
    {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}
    <Card sx={{ mb: 3 }}><CardContent><Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 5 }}><TextField fullWidth label="Action" value={action} onChange={(event) => setAction(event.target.value)} /></Grid>
      <Grid size={{ xs: 12, sm: 5 }}><FormControl fullWidth><InputLabel>Entity</InputLabel><Select value={entityType} label="Entity" onChange={(event) => setEntityType(event.target.value)}><MenuItem value="">All entities</MenuItem><MenuItem value="USER">User</MenuItem><MenuItem value="BOOKING">Booking</MenuItem><MenuItem value="MEETING_ROOM">Meeting room</MenuItem><MenuItem value="RESOURCE">Resource</MenuItem></Select></FormControl></Grid>
      <Grid size={{ xs: 12, sm: 2 }}><Button fullWidth variant="contained" onClick={() => void loadLogs(1)}>Filter</Button></Grid>
    </Grid></CardContent></Card>
    {loading ? <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Action</TableCell><TableCell>Entity</TableCell><TableCell>Description</TableCell></TableRow></TableHead><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{new Date(log.created_at).toLocaleString()}</TableCell><TableCell><Chip size="small" label={log.action} /></TableCell><TableCell>{log.entity_type}</TableCell><TableCell>{log.description || "-"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}><Button disabled={page === 1} onClick={() => void loadLogs(page - 1)}>Previous</Button><Typography sx={{ alignSelf: "center" }}>Page {page}</Typography><Button disabled={logs.length < 20} onClick={() => void loadLogs(page + 1)}>Next</Button></Box>
    </>}
  </Box></MainLayout>;
}
