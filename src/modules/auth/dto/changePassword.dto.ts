import { IsNotEmpty, MinLength } from 'class-validator';

export default class ChangePasswordDto {
    @IsNotEmpty()
    @MinLength(6)
    public old_password: string;

    @IsNotEmpty()
    @MinLength(6)
    public new_password: string;

    constructor(old_password: string, new_password: string) {
        this.old_password = old_password;
        this.new_password = new_password;
    }
}
