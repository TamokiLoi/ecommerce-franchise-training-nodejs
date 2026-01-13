import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export default class AuthCredentialDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @MinLength(6)
  public password: string;

  public group_id: string;

  constructor(email: string, password: string, group_id?: string) {
    this.email = email;
    this.password = password;
    this.group_id = "";
  }
}

export class RegisterDto extends AuthCredentialDto {}
export class LoginDto extends AuthCredentialDto {}
