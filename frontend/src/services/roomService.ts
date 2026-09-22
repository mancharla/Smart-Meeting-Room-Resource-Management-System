import api from "../api/axios";

import type {
  MeetingRoom,
  MeetingRoomCreate,
  MeetingRoomUpdate,
} from "../types/room";

export interface RoomSearchParams {
  search?: string;
  location?: string;
  min_capacity?: number;
  is_available?: boolean;
}

export const getRooms = async (
  params?: RoomSearchParams
): Promise<MeetingRoom[]> => {
  const response = await api.get<MeetingRoom[]>(
    "/meeting-rooms",
    {
      params,
    }
  );

  return response.data;
};

export const getRoom = async (
  roomId: number
): Promise<MeetingRoom> => {
  const response = await api.get<MeetingRoom>(
    `/meeting-rooms/${roomId}`
  );

  return response.data;
};

export const createRoom = async (
  data: MeetingRoomCreate
): Promise<MeetingRoom> => {
  const response = await api.post<MeetingRoom>(
    "/meeting-rooms",
    data
  );

  return response.data;
};

export const updateRoom = async (
  roomId: number,
  data: MeetingRoomUpdate
): Promise<MeetingRoom> => {
  const response = await api.put<MeetingRoom>(
    `/meeting-rooms/${roomId}`,
    data
  );

  return response.data;
};

export const deleteRoom = async (
  roomId: number
): Promise<void> => {
  await api.delete(`/meeting-rooms/${roomId}`);
};

export const getMeetingRooms = getRooms;
export const createMeetingRoom = createRoom;
export const updateMeetingRoom = updateRoom;
export const deleteMeetingRoom = deleteRoom;