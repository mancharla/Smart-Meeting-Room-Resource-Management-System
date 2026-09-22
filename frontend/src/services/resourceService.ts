import api from "../api/axios";

import type {
  Resource,
  ResourceCreate,
  ResourceSearchParams,
  ResourceUpdate,
} from "../types/resource";

export const getResources = async (
  params?: ResourceSearchParams
): Promise<Resource[]> => {
  const response = await api.get<Resource[]>(
    "/resources",
    { params }
  );

  return response.data;
};

export const createResource = async (
  data: ResourceCreate
): Promise<Resource> => {
  const response = await api.post<Resource>(
    "/resources",
    data
  );

  return response.data;
};

export const updateResource = async (
  resourceId: number,
  data: ResourceUpdate
): Promise<Resource> => {
  const response = await api.put<Resource>(
    `/resources/${resourceId}`,
    data
  );

  return response.data;
};

export const deleteResource = async (
  resourceId: number
): Promise<void> => {
  await api.delete(`/resources/${resourceId}`);
};
