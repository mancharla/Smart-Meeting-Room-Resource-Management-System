import api from "../api/axios";

import type {
  AdminUser,
  UserSearchParams,
  UserUpdate,
} from "../types/user";

export const getUsers = async (
  params?: UserSearchParams
): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>(
    "/users",
    { params }
  );

  return response.data;
};

export const updateUser = async (
  userId: number,
  data: UserUpdate
): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(
    `/users/${userId}`,
    data
  );

  return response.data;
};

export const activateUser = async (
  userId: number
): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(
    `/users/${userId}/activate`
  );

  return response.data;
};

export const deactivateUser = async (
  userId: number
): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(
    `/users/${userId}/deactivate`
  );

  return response.data;
};
