// TODO: Consider moving UserContext to a separate file if it is used in multiple places.
export interface UserContext {
  role: string;
  scope: "GLOBAL" | "FRANCHISE";
  franchiseId: string | null;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    avatar_url: string;
  };
  contexts: UserContext[];
}
