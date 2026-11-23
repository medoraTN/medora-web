export type UserRole = 'ADMIN' | 'MEDICAL' | 'ADMIN_STAFF' | 'SUPERVISOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}
