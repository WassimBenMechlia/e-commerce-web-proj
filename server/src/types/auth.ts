export type UserRole = 'customer' | 'admin';

export interface RequestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
}
