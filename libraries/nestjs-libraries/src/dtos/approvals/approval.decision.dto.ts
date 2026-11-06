import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ApprovalDecisionDto {
  @IsIn(['approve', 'changes'])
  decision: 'approve' | 'changes';

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
