import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  code: string;
}

export class SendPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)',
  })
  phoneNumber: string;
}


