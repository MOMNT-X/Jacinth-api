import { IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

