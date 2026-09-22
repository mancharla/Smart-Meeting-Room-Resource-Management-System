import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { changePassword } from "../../services/authService";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch (requestError) {
      console.error("Change password error:", requestError);
      setError("Unable to change password. Check your current password.");
    }
  };

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 520 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Change password</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Update your account password.</Typography>
        <Card><CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField required fullWidth type="password" label="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              <TextField required fullWidth type="password" label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <Button type="submit" variant="contained">Change password</Button>
            </Stack>
          </Box>
        </CardContent></Card>
      </Box>
    </MainLayout>
  );
}
