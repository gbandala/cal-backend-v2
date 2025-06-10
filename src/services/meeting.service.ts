/**
 * SERVICIO DE GESTIÓN DE REUNIONES
 * 
 * Este archivo contiene la lógica de negocio para:
 * - Obtener reuniones de usuarios con filtros
 * - Crear reservas de reuniones para invitados con integración de Google Calendar/Meet
 * - Cancelar reuniones y eliminar eventos de calendario
 * 
 * Integra con Google Calendar API para crear/eliminar eventos automáticamente
 */

import { LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { Meeting, MeetingStatus } from "../database/entities/meeting.entity";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType,
} from "../enums/meeting.enum";
import { CreateMeetingDto } from "../database/dto/meeting.dto";
import {
  Event,
  EventLocationEnumType,
} from "../database/entities/event.entity";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
} from "../database/entities/integration.entity";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { validateGoogleToken } from "./integration.service";
import { googleOAuth2Client } from "../config/oauth.config";
import { google } from "googleapis";
import { toZonedTime, formatInTimeZone, format } from "date-fns-tz";


/**
 * OBTENER REUNIONES DE USUARIO CON FILTROS
 * 
 * Funcionalidad:
 * - Filtra reuniones por estado (próximas, pasadas, canceladas)
 * - Ordena por fecha de inicio ascendente
 * - Incluye información del evento relacionado
 * 
 * @param userId - ID del usuario propietario de las reuniones
 * @param filter - Tipo de filtro: UPCOMING, PAST, CANCELLED
 * @returns Array de reuniones que coinciden con el filtro
 */
export const getUserMeetingsService = async (
  userId: string,
  filter: MeetingFilterEnumType
) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);

  // Configuración base: buscar reuniones del usuario específico
  const where: any = { user: { id: userId } };

  // APLICAR FILTROS SEGÚN EL TIPO SOLICITADO
  if (filter === MeetingFilterEnum.UPCOMING) {
    // Reuniones programadas que aún no han ocurrido
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date()); // Solo futuras
  } else if (filter === MeetingFilterEnum.PAST) {
    // Reuniones programadas que ya pasaron
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = LessThan(new Date()); // Solo pasadas
  } else if (filter === MeetingFilterEnum.CANCELLED) {
    // Reuniones canceladas (cualquier fecha)
    where.status = MeetingStatus.CANCELLED;
  } else {
    // Filtro por defecto: mostrar solo próximas reuniones
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date());
  }

  // Ejecutar consulta con relaciones y ordenamiento
  const meetings = await meetingRepository.find({
    where,
    relations: ["event"], // Incluir datos del evento
    order: { startTime: "ASC" }, // Más próximas primero
  });

  // console.log("Meetings found:", meetings);
  // return meetings || []; // Retornar array vacío si no hay resultados

  console.log("Meetings found (before date processing):", meetings);

  // PROCESAR FECHAS: Remover 'Z' para que se interpreten como horario local
  const processedMeetings = meetings.map(meeting => {
    const processedMeeting = { ...meeting };
    
    // Procesar startTime
    if (processedMeeting.startTime) {
      const startTimeStr = processedMeeting.startTime.toISOString();
      processedMeeting.startTime = startTimeStr.replace('Z', '') as any;
    }
    
    // Procesar endTime
    if (processedMeeting.endTime) {
      const endTimeStr = processedMeeting.endTime.toISOString();
      processedMeeting.endTime = endTimeStr.replace('Z', '') as any;
    }    
    return processedMeeting;
  });

  console.log("Meetings found (after date processing):", processedMeetings);
  return processedMeetings || []; // Retornar array vacío si no hay resultados
};

/**
 * CREAR RESERVA DE REUNIÓN PARA INVITADO
 * 
 * Funcionalidad principal:
 * 1. Valida que el evento existe y es público
 * 2. Verifica integración de video conferencia del organizador
 * 3. Crea evento en Google Calendar con Google Meet
 * 4. Guarda la reunión en base de datos con enlace de Meet
 * 
 * @param createMeetingDto - Datos de la reunión a crear
 * @returns Objeto con meetLink y datos de la reunión creada
 */
export const createMeetBookingForGuestService = async (
  createMeetingDto: CreateMeetingDto,
  timezone: string
) => {

  // Extraer y convertir datos del DTO
  const { eventId, guestEmail, guestName, additionalInfo } = createMeetingDto;
  const startTime = new Date(createMeetingDto.startTime);
  const endTime = new Date(createMeetingDto.endTime);
  // console.log('---------------------------------------------------------------');
  // console.log('startTime:', startTime);
  // console.log('endTime:', endTime);
  // console.log('timezone startTime:', timezone, formatInTimeZone(startTime, timezone, 'yyyy-MM-dd HH:mm'));
  // console.log('timezone endTime:', timezone, formatInTimeZone(endTime, timezone, 'yyyy-MM-dd HH:mm'));
  // console.log('---------------------------------------------------------------');

  // Repositorios necesarios
  const eventRepository = AppDataSource.getRepository(Event);

  const integrationRepository = AppDataSource.getRepository(Integration);
  const meetingRepository = AppDataSource.getRepository(Meeting);

  // PASO 1: VALIDAR QUE EL EVENTO EXISTE Y ES RESERVABLE
  const event = await eventRepository.findOne({
    where: { id: eventId, isPrivate: false },
    relations: ["user"], // Incluir datos del organizador
  });

  if (!event) {
    console.log("Event not found:", eventId);
    throw new NotFoundException("Event not found");
  }

  // 🆕 VALIDAR QUE EL EVENTO TENGA CALENDARIO CONFIGURADO
  if (!event.calendar_id) {
    throw new BadRequestException("Event does not have a calendar configured");
  }

  // PASO 2: VALIDAR TIPO DE UBICACIÓN/INTEGRACIÓN
  if (!Object.values(EventLocationEnumType).includes(event.locationType)) {
    console.log("Invalid location type:", event.locationType);
    throw new BadRequestException("Invalid location type");
  }

  // PASO 3: VERIFICAR INTEGRACIÓN DE VIDEO CONFERENCIA DEL ORGANIZADOR
  const meetIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum[event.locationType], // Buscar integración correspondiente
    },
  });

  if (!meetIntegration) {
    console.log("No video conferencing integration found for user:", event.user.id);
    throw new BadRequestException("No video conferencing integration found");
  }

  // Variables para almacenar datos del calendario/meet
  let meetLink: string = "";
  let calendarEventId: string = "";
  let calendarAppType: string = "";

  // PASO 4: CREAR EVENTO EN GOOGLE CALENDAR CON GOOGLE MEET
  if (event.locationType === EventLocationEnumType.GOOGLE_MEET_AND_CALENDAR) {
    // Obtener cliente autenticado de Google Calendar
    const { calendarType, calendar } = await getCalendarClient(
      meetIntegration.app_type,
      meetIntegration.access_token,
      meetIntegration.refresh_token,
      meetIntegration.expiry_date
    );

  // ✅ SOLUCIÓN SIMPLE: Interpretar la fecha como hora local
  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().replace('Z', '');
  };

    const formattedStart = formatDateForCalendar(startTime);
    const formattedEnd = formatDateForCalendar(endTime);

    console.log('---------------------------------------------------------------');
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    console.log('timezone startTime:', timezone, formattedStart);
    console.log('timezone endTime:', timezone, formattedEnd);
    console.log('---------------------------------------------------------------');


    // Crear evento en Google Calendar con Google Meet automático
    const response = await calendar.events.insert({
      calendarId: event.calendar_id, // ← 🎯 CAMBIO: usar calendar específico
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${guestName} - ${event.title}`,
        description: additionalInfo,
        start: {
          dateTime: formattedStart,
          timeZone: timezone, // Usar zona horaria del invitado
        },
        end: {
          dateTime: formattedEnd,
          timeZone: timezone, // Usar zona horaria del invitado
        },
        // start: { dateTime: startTime.toLocaleDateString() + 'T' + startTime.toLocaleTimeString() },
        // end: { dateTime: endTime.toLocaleDateString() + 'T' + endTime.toLocaleTimeString() },
        // end: {dateTime:endTime},
        attendees: [
          { email: guestEmail },
          { email: event.user.email }
        ],
        conferenceData: {
          createRequest: {
            requestId: `${event.id}-${Date.now()}`,
          },
        },
      },
    });
    console.log("Google Calendar event created:", response.data);

    // Extraer datos importantes de la respuesta
    meetLink = response.data.hangoutLink!; // Enlace de Google Meet
    calendarEventId = response.data.id!; // ID del evento en Google Calendar
    calendarAppType = calendarType; // Tipo de calendario usado
  }

  // PASO 5: GUARDAR REUNIÓN EN BASE DE DATOS
  const meeting = meetingRepository.create({
    event: { id: event.id }, // Relación con el evento
    user: event.user, // Organizador (heredado del evento)
    guestName,
    guestEmail,
    additionalInfo,
    startTime,
    endTime,
    meetLink: meetLink, // Enlace de Google Meet generado
    calendarEventId: calendarEventId, // Para cancelaciones futuras
    calendarAppType: calendarAppType, // Para saber qué API usar
  });
  console.log("Creating meeting:", meeting);

  await meetingRepository.save(meeting);

  // Retornar datos importantes para el frontend
  return {
    meetLink, // Para que el invitado pueda unirse
    meeting, // Datos completos de la reunión creada
  };
};

/**
 * CANCELAR REUNIÓN Y ELIMINAR DE CALENDARIO
 * 
 * Funcionalidad:
 * 1. Busca la reunión y valida que existe
 * 2. Encuentra la integración de calendario del organizador
 * 3. Elimina el evento del calendario externo (Google Calendar)
 * 4. Marca la reunión como cancelada en base de datos
 * 
 * @param meetingId - ID de la reunión a cancelar
 * @returns Objeto indicando éxito de la operación
 */
export const cancelMeetingService = async (meetingId: string) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // PASO 1: BUSCAR REUNIÓN CON DATOS DEL EVENTO Y USUARIO
  const meeting = await meetingRepository.findOne({
    where: { id: meetingId },
    relations: ["event", "event.user"], // Necesitamos datos del organizador
  });

  if (!meeting) throw new NotFoundException("Meeting not found");

  try {
    // PASO 2: BUSCAR INTEGRACIÓN DE CALENDARIO DEL ORGANIZADOR ESPECÍFICO
    const calendarIntegration = await integrationRepository.findOne({
      where: {
        user: { id: meeting.event.user.id }, // ← 🎯 AGREGAR: Filtrar por usuario específico
        app_type: IntegrationAppTypeEnum[
          meeting.calendarAppType as keyof typeof IntegrationAppTypeEnum
        ],
      },
    });

    // PASO 3: ELIMINAR EVENTO DEL CALENDARIO EXTERNO
    if (calendarIntegration) {
      // Obtener cliente autenticado
      const { calendar, calendarType } = await getCalendarClient(
        calendarIntegration.app_type,
        calendarIntegration.access_token,
        calendarIntegration.refresh_token,
        calendarIntegration.expiry_date
      );

      // Eliminar según el tipo de calendario
      switch (calendarType) {
        case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
          await calendar.events.delete({
            calendarId: meeting.event.calendar_id,
            eventId: meeting.calendarEventId,
          });
          break;
        default:
          throw new BadRequestException(
            `Unsupported calendar provider: ${calendarType}`
          );
      }
    } else {
      // ← 🆕 AGREGAR: Log si no se encuentra la integración
      console.warn(`No calendar integration found for user ${meeting.event.user.id} with app_type ${meeting.calendarAppType}`);
      // Continuar con la cancelación en BD aunque no se pueda eliminar del calendario
    }
  } catch (error) {
    // Si falla la eliminación del calendario, lanzar error específico
    console.error("Calendar deletion error:", error);
    throw new BadRequestException("Failed to delete event from calendar");
  }

  // PASO 4: MARCAR REUNIÓN COMO CANCELADA EN BASE DE DATOS
  meeting.status = MeetingStatus.CANCELLED;
  await meetingRepository.save(meeting);

  return { success: true };
};

/**
 * FUNCIÓN HELPER: OBTENER CLIENTE DE CALENDARIO AUTENTICADO
 * 
 * Funcionalidad:
 * - Valida tokens de acceso (refresca si es necesario)
 * - Configura cliente de Google Calendar con autenticación OAuth2
 * - Maneja diferentes tipos de proveedores de calendario
 * 
 * @param appType - Tipo de aplicación/integración
 * @param access_token - Token de acceso OAuth2
 * @param refresh_token - Token de actualización OAuth2
 * @param expiry_date - Fecha de expiración del token
 * @returns Cliente de calendario configurado y tipo de calendario
 */
async function getCalendarClient(
  appType: IntegrationAppTypeEnum,
  access_token: string,
  refresh_token: string,
  expiry_date: number | null
) {
  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      // Validar y obtener token válido (refresca automáticamente si expiró)
      const validToken = await validateGoogleToken(
        access_token,
        refresh_token,
        expiry_date
      );

      // Configurar cliente OAuth2 de Google
      googleOAuth2Client.setCredentials({ access_token: validToken });

      // Crear cliente de Google Calendar API
      const calendar = google.calendar({
        version: "v3",
        auth: googleOAuth2Client,
      });

      return {
        calendar,
        calendarType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      };

    default:
      throw new BadRequestException(
        `Unsupported Calendar provider: ${appType}`
      );
  }
}

