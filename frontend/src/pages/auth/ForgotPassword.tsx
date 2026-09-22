import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await requestPasswordReset(email);
      setToken(response.reset_token);
    } catch (requestError) {
      console.error("Password reset request error:", requestError);
      setError("Unable to create a reset request.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Reset password</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Request a password reset token.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField required fullWidth type="email" label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Button type="submit" variant="contained">Request reset</Button>
            </Stack>
          </Box>
          {token && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Reset token generated. Use it to continue.
              <Button size="small" onClick={() => navigate(`/reset-password?token=${encodeURIComponent(token)}`)}>Continue</Button>
            </Alert>
          )}
          <Link component={RouterLink} to="/login" sx={{ display: "block", mt: 2 }}>Back to login</Link>
        </CardContent>
      </Card>
    </Box>
  );
}
