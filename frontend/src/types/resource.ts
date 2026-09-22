export interface Resource {
  id: number;
  name: string;
  resource_type: string;
  quantity: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreate {
  name: string;
  resource_type: string;
  quantity: number;
  description?: string;
  is_available?: boolean;
}

export interface ResourceUpdate {
  name?: string;
  resource_type?: string;
  quantity?: number;
  description?: string;
  is_available?: boolean;
}

export interface ResourceSearchParams {
  search?: string;
  resource_type?: string;
  is_available?: boolean;
}
