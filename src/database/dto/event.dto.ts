import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
// import { EventLocationEnumType } from "../entities/event.entity";
import { EventLocationEnumType } from "../../enums/EventLocationEnum";

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsEnum(EventLocationEnumType)
  @IsNotEmpty()
  locationType: EventLocationEnumType;

  // ✅ CAMPOS DE CALENDARIO CORREGIDOS
  @IsOptional()
  @IsString()
  calendar_id?: string;     // ✅ Opcional, puede ser undefined (no null)

  @IsOptional()
  @IsString()
  calendar_name?: string;   // ✅ Opcional, puede ser undefined (no null)

  @IsOptional()
  @IsString()
  outlook_calendar_id?: string; // ← NUEVO

  @IsOptional()
  @IsString()
  outlook_calendar_name?: string; // ← NUEVO


}


export class EventIdDTO {
  @IsUUID(4, { message: "Invaild uuid" })
  @IsNotEmpty()
  eventId: string;
}

export class UserNameDTO {
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class UserNameAndSlugDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
