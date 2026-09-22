import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { getMeetingRooms } from "../../services/roomService";
import { getResources } from "../../services/resourceService";
import { assignResourceToRoom, getRoomResources, removeResourceFromRoom } from "../../services/roomResourceService";
import type { MeetingRoom } from "../../types/room";
import type { Resource } from "../../types/resource";
import type { RoomResource } from "../../types/roomResource";

export default function RoomResources() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<RoomResource[]>([]);
  const [roomId, setRoomId] = useState(0);
  const [resourceId, setResourceId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = async (nextRoomId: number) => {
    if (!nextRoomId) return;
    try {
      setAssignments(await getRoomResources(nextRoomId));
    } catch (requestError) {
      console.error("Room resources loading error:", requestError);
      setError("Unable to load room assignments.");
    }
  };

  useEffect(() => {
    Promise.all([getMeetingRooms(), getResources()])
      .then(([roomData, resourceData]) => {
        setRooms(roomData);
        setResources(resourceData);
        if (roomData[0]) {
          setRoomId(roomData[0].id);
          void loadAssignments(roomData[0].id);
        }
      })
      .catch((requestError) => {
        console.error("Room resource setup error:", requestError);
        setError("Unable to load rooms and resources.");
      })
      .finally(() => setLoading(false));
  }, []);

  const assign = async () => {
    if (!roomId || !resourceId) return;
    try {
      await assignResourceToRoom({ room_id: roomId, resource_id: resourceId });
      setResourceId(0);
      await loadAssignments(roomId);
    } catch (requestError) {
      console.error("Resource assignment error:", requestError);
      setError("Unable to assign resource. It may already be assigned.");
    }
  };

  const remove = async (assignment: RoomResource) => {
    try {
      await removeResourceFromRoom(assignment.room_id, assignment.resource_id);
      await loadAssignments(roomId);
    } catch (requestError) {
      console.error("Resource removal error:", requestError);
      setError("Unable to remove resource assignment.");
    }
  };

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Room Resources</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>Assign shared resources to meeting rooms.</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}
        {loading ? <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card><CardContent><Stack spacing={2}>
                <FormControl fullWidth><InputLabel>Meeting room</InputLabel><Select value={roomId || ""} label="Meeting room" onChange={(event) => { const next = Number(event.target.value); setRoomId(next); void loadAssignments(next); }}>
                  {rooms.map((room) => <MenuItem key={room.id} value={room.id}>{room.name}</MenuItem>)}
                </Select></FormControl>
                <FormControl fullWidth><InputLabel>Resource</InputLabel><Select value={resourceId || ""} label="Resource" onChange={(event) => setResourceId(Number(event.target.value))}>
                  {resources.map((resource) => <MenuItem key={resource.id} value={resource.id}>{resource.name} ({resource.resource_type})</MenuItem>)}
                </Select></FormControl>
                <Button variant="contained" onClick={() => void assign()} disabled={!roomId || !resourceId}>Assign resource</Button>
              </Stack></CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card><CardContent><Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Assigned resources</Typography>
                {assignments.length === 0 ? <Typography color="text.secondary">No resources assigned to this room.</Typography> : assignments.map((assignment) => {
                  const resource = resources.find((item) => item.id === assignment.resource_id);
                  return <Box key={`${assignment.room_id}-${assignment.resource_id}`} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid #eee" }}><Typography>{resource?.name || `Resource #${assignment.resource_id}`}</Typography><Button size="small" color="error" onClick={() => void remove(assignment)}>Remove</Button></Box>;
                })}
              </CardContent></Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </MainLayout>
  );
}
