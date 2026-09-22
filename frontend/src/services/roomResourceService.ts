import api from "../api/axios";
import type { RoomResource } from "../types/roomResource";

export const getRoomResources = async (roomId: number): Promise<RoomResource[]> => {
  const response = await api.get<RoomResource[]>(`/room-resources/room/${roomId}`);
  return response.data;
};

export const assignResourceToRoom = async (data: RoomResource): Promise<RoomResource> => {
  const response = await api.post<RoomResource>("/room-resources", data);
  return response.data;
};

export const removeResourceFromRoom = async (roomId: number, resourceId: number): Promise<void> => {
  await api.delete(`/room-resources/room/${roomId}/resource/${resourceId}`);
};
