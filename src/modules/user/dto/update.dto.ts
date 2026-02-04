import { IsEmail, IsOptional, IsString } from "class-validator";

export default class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  public email?: string;

  @IsOptional()
  @IsString()
  public name?: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsString()
  public avatar_url?: string;

  constructor(email: string, name: string, phone: string, avatar_url: string) {
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.avatar_url = avatar_url;
  }
}
