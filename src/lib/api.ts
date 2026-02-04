async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }
  return response.json();
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },
};

export const auth = {
  async login(email: string, password: string): Promise<{ user: { id: string; username: string; email: string } }> {
    return api.post("/api/auth/login", { email, password });
  },

  async register(email: string, password: string, fullName?: string): Promise<{ user: { id: string; username: string; email: string } }> {
    return api.post("/api/auth/register", { email, password, fullName });
  },

  async logout(): Promise<{ success: boolean }> {
    return api.post("/api/auth/logout");
  },

  async getUser(): Promise<{ user: { id: string; username: string; email?: string } | null }> {
    return api.get("/api/auth/user");
  },
};
