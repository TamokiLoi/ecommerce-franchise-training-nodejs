import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export default class AuthCredentialDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @MinLength(6)
  public password: string;

  constructor(email: string, password: string,) {
    this.email = email;
    this.password = password;
  }
}

export class RegisterDto extends AuthCredentialDto {}
export class LoginDto extends AuthCredentialDto {}
