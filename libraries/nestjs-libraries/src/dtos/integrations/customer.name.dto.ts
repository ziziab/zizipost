import { IsOptional, IsString, MinLength } from 'class-validator';

export class CustomerNameDto {
  @IsString()
  @MinLength(1)
  name: string;

  // Brand logo path from the media library. Empty string removes it.
  @IsOptional()
  @IsString()
  picture?: string;
}
