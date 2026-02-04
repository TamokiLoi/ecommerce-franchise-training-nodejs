import { IUser } from "../user";
import { AuthResponseDto, UserContext } from "./dto/authResponse.dto";

export const mapAuthToResponse = (user: IUser, contexts: UserContext[]): AuthResponseDto => {
  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatar_url: user.avatar_url,
    },
    contexts,
  };
};
