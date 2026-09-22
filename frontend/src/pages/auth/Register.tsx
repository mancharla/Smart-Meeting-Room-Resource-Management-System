import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await registerUser({ full_name: fullName, email, password });
      setComplete(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (requestError) {
      console.error("Registration error:", requestError);
      setError("Unable to create account. Check your details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Create account</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Register as an employee.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {complete && <Alert severity="success" sx={{ mb: 2 }}>Account created. Redirecting to login.</Alert>}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField required fullWidth label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <TextField required fullWidth type="email" label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <TextField required fullWidth type="password" label="Password" helperText="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button type="submit" variant="contained" disabled={saving}>{saving ? "Creating..." : "Create account"}</Button>
            </Stack>
          </Box>
          <Link component={RouterLink} to="/login" sx={{ display: "block", mt: 2 }}>Back to login</Link>
        </CardContent>
      </Card>
    </Box>
  );
}
