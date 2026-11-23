export const USER_ROLES = ['ADMIN', 'MEDICAL', 'ADMIN_STAFF', 'SUPERVISOR'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  MEDICAL: 'Personnel médical',
  ADMIN_STAFF: 'Personnel administratif',
  SUPERVISOR: 'Superviseur Urgence',
};

/** Session / login user (API auth payload). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/** Admin user directory entry (API /users payload). */
export interface ManagedUser extends User {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  items: ManagedUser[];
  pagination: UserPagination;
}

export interface UserResponse {
  user: ManagedUser;
}

export interface UserQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
}
