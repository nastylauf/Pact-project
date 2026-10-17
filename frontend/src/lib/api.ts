export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type Pact = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly";
  status: "active" | "completed" | "failed" | "archived";
  current_streak: number;
  longest_streak: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
};

export type Checkin = {
  id: string;
  pact_id: string;
  user_id: string;
  date: string;
  note: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type CreatePactInput = {
  title: string;
  description: string;
  frequency: Pact["frequency"];
  start_date: string;
  end_date?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiBase = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Не удалось связаться с Pact API. Проверьте, запущен ли backend.",
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Ошибка запроса (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export function authenticate(
  mode: "login" | "register",
  input: { email: string; password: string; name?: string },
) {
  return request<AuthResponse>(`/api/v1/auth/${mode}`, undefined, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPacts(token: string) {
  return request<Pact[]>("/api/v1/pacts", token);
}

export function createPact(token: string, pact: CreatePactInput) {
  return request<Pact>("/api/v1/pacts", token, {
    method: "POST",
    body: JSON.stringify(pact),
  });
}

export function getCheckins(token: string, pactId: string) {
  return request<Checkin[]>(
    `/api/v1/pacts/${encodeURIComponent(pactId)}/checkins`,
    token,
  );
}

export function createCheckin(
  token: string,
  pactId: string,
  input: { date: string; note: string },
) {
  return request<Checkin>(
    `/api/v1/pacts/${encodeURIComponent(pactId)}/checkins`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
