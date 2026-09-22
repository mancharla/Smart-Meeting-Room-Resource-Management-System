export interface MeetingRoom {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  facilities: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingRoomCreate {
  name: string;
  location: string;
  capacity: number;
  description?: string;
  facilities?: string;
  is_available?: boolean;
}

export interface MeetingRoomUpdate {
  name?: string;
  location?: string;
  capacity?: number;
  description?: string;
  facilities?: string;
  is_available?: boolean;
}