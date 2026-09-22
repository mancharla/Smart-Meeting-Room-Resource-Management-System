import api from "../api/axios";

import type {
  Department,
  DepartmentCreate,
  DepartmentUpdate,
} from "../types/department";

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>("/departments");
  return response.data;
};

export const createDepartment = async (
  data: DepartmentCreate
): Promise<Department> => {
  const response = await api.post<Department>("/departments", data);
  return response.data;
};

export const updateDepartment = async (
  departmentId: number,
  data: DepartmentUpdate
): Promise<Department> => {
  const response = await api.put<Department>(
    `/departments/${departmentId}`,
    data
  );
  return response.data;
};

export const deleteDepartment = async (
  departmentId: number
): Promise<void> => {
  await api.delete(`/departments/${departmentId}`);
};
