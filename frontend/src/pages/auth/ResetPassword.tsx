import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = searchParams.get("token");
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch (requestError) {
      console.error("Password reset error:", requestError);
      setError("Unable to reset password. The token may be expired.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Set new password</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {complete ? <Alert severity="success">Password reset successfully. <Link component={RouterLink} to="/login">Sign in</Link></Alert> : (
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextField required fullWidth type="password" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <Button type="submit" variant="contained">Reset password</Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
