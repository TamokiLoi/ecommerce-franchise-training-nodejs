export interface UserResponseDto {
  id: string;
  email: string;
  role: string;
  name: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}
