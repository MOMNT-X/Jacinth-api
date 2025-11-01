import { IsEmail, IsString } from "class-validator";

export class UpdateEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  password: string;
}