import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  MeetingRoom as MeetingRoomIcon,
  Inventory2 as ResourceIcon,
  Event as BookingIcon,
  Notifications as NotificationsIcon,
  Assessment as ReportsIcon,
  People as PeopleIcon,
  Business as DepartmentIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";

import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const drawerWidth = 250;
const ink = "#12263A";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] =
    useState<null | HTMLElement>(null);

  const isAdmin = user?.role_id === 1;

  const adminNavigation: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <DashboardIcon />,
    },
    {
      label: "Meeting Rooms",
      path: "/rooms",
      icon: <MeetingRoomIcon />,
    },
    {
      label: "Resources",
      path: "/resources",
      icon: <ResourceIcon />,
    },
    {
      label: "Room Resources",
      path: "/admin/room-resources",
      icon: <MeetingRoomIcon />,
    },
    {
      label: "Bookings",
      path: "/bookings",
      icon: <BookingIcon />,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: <PeopleIcon />,
    },
    {
      label: "Departments",
      path: "/admin/departments",
      icon: <DepartmentIcon />,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: <ReportsIcon />,
    },
    {
      label: "Audit Logs",
      path: "/admin/audit-logs",
      icon: <ReportsIcon />,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <NotificationsIcon />,
    },
  ];

  const employeeNavigation: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/employee/dashboard",
      icon: <DashboardIcon />,
    },
    {
      label: "Meeting Rooms",
      path: "/rooms",
      icon: <MeetingRoomIcon />,
    },
    {
      label: "Resources",
      path: "/resources",
      icon: <ResourceIcon />,
    },
    {
      label: "My Bookings",
      path: "/bookings",
      icon: <BookingIcon />,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <NotificationsIcon />,
    },
  ];

  const navigation = isAdmin
    ? adminNavigation
    : employeeNavigation;

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    setProfileAnchor(null);
    logout();
    navigate("/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
          background: `linear-gradient(180deg, ${ink} 0%, #173B50 100%)`,
          color: "#EAF3F5",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2.2,
          minHeight: 64,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            backgroundColor: "secondary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          SM
        </Box>

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.2, color: "#FFFFFF" }}
          >
            Smart Meeting
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "rgba(234,243,245,0.64)" }}
          >
            Room Management
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Role */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: "rgba(234,243,245,0.54)" }}
        >
          ACCOUNT
        </Typography>

        <Typography
          variant="body2"
          sx={{ mt: 0.5, fontWeight: 600, color: "#FFFFFF" }}
        >
          {isAdmin ? "Administrator" : "Employee"}
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() =>
              handleNavigation(item.path)
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: location.pathname === item.path
                ? "#FFFFFF"
                : "rgba(234,243,245,0.68)",
              backgroundColor:
                location.pathname === item.path
                  ? "rgba(94, 175, 194, 0.20)"
                  : "transparent",
              fontWeight:
                location.pathname === item.path
                  ? 600
                  : 400,

              "&:hover": {
                backgroundColor: "rgba(94, 175, 194, 0.14)",
                color: "#FFFFFF",
              },

              "&::before": location.pathname === item.path
                ? {
                    content: '""',
                    width: 3,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: "secondary.light",
                    position: "absolute",
                    left: 0,
                  }
                : undefined,

              "& .MuiListItemIcon-root": {
                color: "inherit",
                minWidth: 42,
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: { fontSize: 14, fontWeight: 500 },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Bottom */}
      <Box sx={{ p: 1.5 }}>
        <Divider sx={{ mb: 1 }} />

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "rgba(255, 190, 174, 0.86)",

            "&:hover": {
              backgroundColor: "rgba(212, 119, 82, 0.16)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 42,
              color: "inherit",
            }}
          >
            <LogoutIcon />
          </ListItemIcon>

          <ListItemText
            primary="Logout"
            slotProps={{
              primary: {
                sx: { fontSize: 14, fontWeight: 500 },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,

            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              background: `linear-gradient(180deg, ${ink} 0%, #173B50 100%)`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(14px)",
            color: "text.primary",
            borderBottom: "1px solid rgba(19, 34, 56, 0.08)",
          }}
        >
          <Toolbar
            sx={{
              minHeight: "64px !important",
              px: {
                xs: 2,
                md: 3,
              },
            }}
          >
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() =>
                  setMobileOpen(true)
                }
                aria-label="Open navigation"
                sx={{ mr: 1, color: "primary.main" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Smart Meeting Room
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                Resource Management System
              </Typography>
            </Box>

            {/* Notifications */}
            <IconButton
              onClick={() =>
                navigate("/notifications")
              }
              aria-label="Open notifications"
              sx={{ mr: 1, color: "primary.main" }}
            >
              <NotificationsIcon />
            </IconButton>

            {/* User */}
            <IconButton
              onClick={(event) =>
                setProfileAnchor(
                  event.currentTarget
                )
              }
              aria-label="Open account menu"
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  backgroundColor: "primary.main",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {user?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </Avatar>
            </IconButton>

            {/* Profile Menu */}
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() =>
                setProfileAnchor(null)
              }
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  minWidth: 230,
                }}
              >
                <Typography
                  sx={{ fontWeight: 600 }}
                >
                  {user?.full_name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    wordBreak: "break-word",
                  }}
                >
                  {user?.email}
                </Typography>

                <Typography
                  variant="caption"
                  color="primary"
                >
                  {isAdmin
                    ? "Administrator"
                    : "Employee"}
                </Typography>
              </Box>

              <Divider />

              <MenuItem
                onClick={() => {
                  setProfileAnchor(null);
                  navigate("/change-password");
                }}
              >
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>

                Profile
              </MenuItem>

              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: "error.main",
                }}
              >
                <ListItemIcon>
                  <LogoutIcon
                    fontSize="small"
                    color="error"
                  />
                </ListItemIcon>

                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          sx={{
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}