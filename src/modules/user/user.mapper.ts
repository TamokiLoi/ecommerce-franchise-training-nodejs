import { IUser, UserResponseDto } from "../user";

export const mapUserToResponse = (user: IUser): UserResponseDto => {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatar_url: user.avatar_url,
    is_active: user.is_active ?? false,
    is_deleted: user.is_deleted ?? false,
    created_at: user.created_at?.toISOString() ?? "",
    updated_at: user.updated_at?.toISOString() ?? "",
    is_verified: user.is_verified ?? false,
  };
};
