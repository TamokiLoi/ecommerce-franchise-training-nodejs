import { UserResponseDto } from "./dto/userResponse.dto";
import { IUser } from "./user.interface";

export const mapUserToResponse = (user: IUser): UserResponseDto => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
};
