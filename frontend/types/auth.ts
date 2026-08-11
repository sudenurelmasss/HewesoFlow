export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department?: string | null;
}

export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  tokenExpiration: string;
  roles: string[];
}

export interface AuthServiceResult {
  isSuccess: boolean;
  message: string;
  data: AuthUser | null;
}