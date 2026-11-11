const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("aws_token");
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "Request failed";
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export interface HostedZone {
  id: string;
  name: string;
  description: string;
  type: string;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: string;
  ttl: number;
  routing_policy: string;
  values: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  aws_account_id: string;
  role: string;
}

export const api = {
  async login(username: string, password: string, accountId?: string): Promise<{ token: string; user: User }> {
    const res = await request<{ message: string; token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, aws_account_id: accountId }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("aws_token", res.token);
      localStorage.setItem("aws_user", JSON.stringify(res.user));
    }
    return res;
  },

  async register(username: string, password: string, accountId?: string): Promise<User> {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, aws_account_id: accountId }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("aws_token");
        localStorage.removeItem("aws_user");
      }
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      return await request<User>("/auth/me");
    } catch {
      return null;
    }
  },

  async getHostedZones(search?: string, type?: string): Promise<HostedZone[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (type) params.append("zone_type", type);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<HostedZone[]>(`/hosted-zones${qs}`);
  },

  async getHostedZone(id: string): Promise<HostedZone> {
    return request<HostedZone>(`/hosted-zones/${id}`);
  },

  async createHostedZone(data: { name: string; description?: string; type?: string }): Promise<HostedZone> {
    return request<HostedZone>("/hosted-zones", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateHostedZone(id: string, data: { description?: string; type?: string }): Promise<HostedZone> {
    return request<HostedZone>(`/hosted-zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteHostedZone(id: string): Promise<void> {
    await request(`/hosted-zones/${id}`, { method: "DELETE" });
  },

  async getRecords(zoneId: string, search?: string, recordType?: string): Promise<DNSRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (recordType) params.append("record_type", recordType);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<DNSRecord[]>(`/hosted-zones/${zoneId}/records${qs}`);
  },

  async createRecord(zoneId: string, data: {
    name: string;
    type: string;
    ttl: number;
    routing_policy?: string;
    values: string;
  }): Promise<DNSRecord> {
    return request<DNSRecord>(`/hosted-zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateRecord(zoneId: string, recordId: string, data: Partial<DNSRecord>): Promise<DNSRecord> {
    return request<DNSRecord>(`/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteRecord(zoneId: string, recordId: string): Promise<void> {
    await request(`/hosted-zones/${zoneId}/records/${recordId}`, { method: "DELETE" });
  },

  async bulkDeleteRecords(zoneId: string, recordIds: string[]): Promise<void> {
    await request(`/hosted-zones/${zoneId}/records/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ record_ids: recordIds }),
    });
  },

  async exportBind(zoneId: string): Promise<{ bind_content: string; domain_name: string }> {
    return request<{ bind_content: string; domain_name: string }>(`/hosted-zones/${zoneId}/export/bind`);
  },

  async importBind(zoneId: string, bindText: string): Promise<{ message: string; imported_count: number }> {
    return request<{ message: string; imported_count: number }>(`/hosted-zones/${zoneId}/records/import/bind`, {
      method: "POST",
      body: JSON.stringify({ bind_text: bindText }),
    });
  },

  async getDashboardStats(): Promise<{
    hosted_zones_count: number;
    total_records_count: number;
  }> {
    return request("/dashboard/stats");
  },
};
