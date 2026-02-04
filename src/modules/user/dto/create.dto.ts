import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { BaseDto } from "../../../core/dtos";
import { PASSWORD_LENGTH_MIN } from "../../../core/constants";

export default class CreateUserDto extends BaseDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @MinLength(PASSWORD_LENGTH_MIN)
  public password: string;

  public role: string;
  public name: string;

  constructor(
    email: string,
    password: string,
    name: string,
    role: string,

    created_at: Date = new Date(),
    updated_at: Date = new Date(),
    is_deleted: boolean = false,
  ) {
    super(created_at, updated_at, is_deleted);
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
  }
}
