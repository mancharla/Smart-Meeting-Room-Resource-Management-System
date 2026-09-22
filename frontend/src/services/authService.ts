import api from "../api/axios";
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "../types/auth";

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    data
  );

  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>("/auth/me");

  return response.data;
};

export const register = async (data: {
  full_name: string;
  email: string;
  password: string;
  role_id: number;
  department_id?: number | null;
}) => {
  const response = await api.post("/auth/register", data);

  return response.data;
};

export const refreshToken = async (
  refresh_token: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/auth/refresh",
    {
      refresh_token,
    }
  );

  return response.data;
};

export const registerUser = async (data: {
  full_name: string;
  email: string;
  password: string;
  department_id?: number;
}): Promise<User> => {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}): Promise<void> => {
  await api.post("/auth/change-password", data);
};

export const requestPasswordReset = async (
  email: string
): Promise<{ reset_token: string }> => {
  const response = await api.post<{ reset_token: string }>(
    "/auth/forgot-password",
    { email }
  );
  return response.data;
};

export const resetPassword = async (
  token: string,
  new_password: string
): Promise<void> => {
  await api.post("/auth/reset-password", {
    token,
    new_password,
  });
};