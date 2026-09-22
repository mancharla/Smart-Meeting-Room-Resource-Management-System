import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import MeetingRooms from "../pages/rooms/MeetingRooms";
import Bookings from "../pages/bookings/Bookings";
import Resources from "../pages/resources/Resources";
import Users from "../pages/admin/Users";
import Departments from "../pages/admin/Departments";
import Reports from "../pages/reports/Reports";
import Notifications from "../pages/notifications/Notifications";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ChangePassword from "../pages/auth/ChangePassword";
import RoomResources from "../pages/admin/RoomResources";
import AuditLogs from "../pages/admin/AuditLogs";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Employee */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={[2]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <MeetingRooms />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Bookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Resources />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <Departments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/room-resources"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <RoomResources />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={[1]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}