import api from "../api/axios";
import type { AuditLog } from "../types/auditLog";

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  action?: string;
  entity_type?: string;
}

export const getAuditLogs = async (params?: AuditLogParams): Promise<AuditLog[]> => {
  const response = await api.get<AuditLog[]>("/audit-logs", { params });
  return response.data;
};
