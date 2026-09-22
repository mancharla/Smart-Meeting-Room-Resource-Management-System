import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#1B6586",
      dark: "#12465D",
      light: "#5EAFC2",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#D47752",
      dark: "#A95439",
      light: "#E5A184",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#F4F6F8",
      paper: "#FFFFFF",
    },

    success: {
      main: "#2E7D32",
    },

    warning: {
      main: "#ED6C02",
    },

    error: {
      main: "#D32F2F",
    },
  },

  typography: {
    fontFamily: [
      "DM Sans",
      "Segoe UI",
      "sans-serif",
    ].join(","),

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 700,
    },

    h3: {
      fontWeight: 700,
    },

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "9px 18px",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(19, 34, 56, 0.07)",
          boxShadow: "0 12px 32px rgba(19, 34, 56, 0.06)",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(19, 34, 56, 0.07)",
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;