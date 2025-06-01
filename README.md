# Cal Backend 📅

Una aplicación backend completa para gestión de calendarios y programación de reuniones, inspirada en Calendly. Permite a los usuarios crear eventos, gestionar su disponibilidad e integrar con servicios como Google Calendar y Google Meet.

## 🚀 Funcionalidades Principales

### 🔐 Autenticación y Usuarios
- **Registro de usuarios** con validación de datos
- **Login seguro** con JWT tokens
- **Generación automática** de usernames únicos
- **Hash seguro** de contraseñas con bcrypt
- **Middleware de autenticación** con Passport JWT

### 📅 **NEW! Gestión de Calendarios Específicos**
- **Múltiples calendarios** - Soporte para calendarios específicos de Google Calendar
- **Cache inteligente** - Sincronización automática y cache local de calendarios
- **Selección flexible** - Eventos pueden usar cualquier calendario del usuario
- **Gestión automática** - Sincronización desde Google Calendar API
- **Permisos granulares** - Solo calendarios con permisos de escritura para eventos

### 📅 Gestión de Eventos
- **Crear eventos personalizados** con título, descripción y duración
- **🆕 Calendario específico** - Asignar eventos a calendarios particulares
- **Eventos públicos/privados** con toggle de privacidad
- **URLs amigables** con slugs únicos
- **Tipos de ubicación** (Google Meet, Zoom, etc.)
- **Eventos públicos** accesibles sin autenticación
- **🆕 Reasignación de calendario** - Cambiar calendario de eventos existentes
- **Eliminación** de eventos

### ⏰ Gestión de Disponibilidad
- **Configuración de horarios** por día de la semana
- **Intervalos de tiempo** personalizables entre reuniones
- **Horarios disponibles/no disponibles** por día
- **Consulta pública** de disponibilidad para eventos
- **Slots de tiempo automáticos** basados en duración del evento

### 🔗 Integraciones
- **OAuth2 con Google** para Calendar y Meet
- **🆕 Scope ampliado** - Incluye lectura de calendarios disponibles
- **Gestión automática de tokens** con refresh automático
- **Múltiples proveedores** (Google, Zoom, Microsoft)
- **Validación de conexiones** activas
- **URLs de autorización** dinámicas

### 🤝 Gestión de Reuniones
- **Programación de reuniones** por invitados
- **🆕 Calendario inteligente** - Usa el calendario configurado del evento
- **Creación automática** en Google Calendar
- **Enlaces automáticos** de Google Meet
- **Estados de reunión** (programada, cancelada)
- **Filtros** por estado (próximas, pasadas, canceladas)
- **🆕 Cancelación inteligente** - Elimina del calendario correcto

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **TypeScript** - Tipado estático
- **Express.js** - Framework web
- **TypeORM** - ORM para base de datos

### Base de Datos
- **PostgreSQL** - Base de datos principal
- **Sincronización automática** en desarrollo

### Autenticación & Seguridad
- **Passport.js** - Estrategias de autenticación
- **JWT** - JSON Web Tokens
- **bcrypt** - Hash de contraseñas
- **CORS** - Cross-Origin Resource Sharing

### Validación & Transformación
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de objetos

### Integraciones Externas
- **Google APIs** - Calendar y Meet
- **OAuth2** - Autenticación con servicios externos

### Utilidades
- **date-fns** - Manejo de fechas
- **uuid** - Generación de IDs únicos
- **js-base64** - Codificación base64

## 📊 Modelo de Datos

### Entidades Principales

#### Users (Usuarios)
```typescript
- id: UUID
- name: string
- username: string (único)
- email: string (único)
- password: string (hasheado)
- imageUrl: string (opcional)
- availability: Availability (relación 1:1)
- events: Event[] (relación 1:N)
- integrations: Integration[] (relación 1:N)
- meetings: Meeting[] (relación 1:N)
- calendars: UserCalendar[] (relación 1:N) // 🆕 NUEVO
```

#### 🆕 UserCalendar (Cache de Calendarios)
```typescript
- id: UUID
- userId: string
- calendarId: string (ej: 'primary', 'consultorio@gmail.com')
- calendarName: string
- isPrimary: boolean
- accessRole: string ('owner', 'writer', 'reader')
- backgroundColor: string (opcional)
- isActive: boolean
- lastSynced: Date
- user: User (relación N:1)
```

#### Events (Eventos) - **ACTUALIZADO**
```typescript
- id: UUID
- title: string
- description: string (opcional)
- duration: number (minutos)
- slug: string (único por usuario)
- isPrivate: boolean
- locationType: EventLocationEnum
- calendar_id: string (🆕 NUEVO - default: 'primary')
- calendar_name: string (🆕 NUEVO - opcional)
- user: User (relación N:1)
- meetings: Meeting[] (relación 1:N)
```

#### Availability (Disponibilidad)
```typescript
- id: UUID
- timeGap: number (minutos entre reuniones)
- user: User (relación 1:1)
- days: DayAvailability[] (relación 1:N)
```

#### DayAvailability (Disponibilidad por Día)
```typescript
- id: UUID
- day: DayOfWeekEnum
- startTime: Date
- endTime: Date
- isAvailable: boolean
- availability: Availability (relación N:1)
```

#### Integration (Integraciones) - **ACTUALIZADO**
```typescript
- id: UUID
- provider: IntegrationProviderEnum
- category: IntegrationCategoryEnum
- app_type: IntegrationAppTypeEnum
- access_token: string
- refresh_token: string
- expiry_date: number
- metadata: JSON
- isConnected: boolean
- calendar_id: string (🆕 NUEVO - calendario por defecto)
- calendar_name: string (🆕 NUEVO - opcional)
- user: User (relación N:1)
```

#### Meeting (Reuniones) - **ACTUALIZADO**
```typescript
- id: UUID
- guestName: string
- guestEmail: string
- additionalInfo: string
- startTime: Date
- endTime: Date
- meetLink: string
- calendarEventId: string
- calendarAppType: string
- calendar_id: string (🆕 NUEVO - para cancelaciones correctas)
- status: MeetingStatus
- user: User (relación N:1)
- event: Event (relación N:1)
```

## 🛣️ API Endpoints

### 🔐 Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| POST | `/register` | Registrar nuevo usuario | ❌ |
| POST | `/login` | Iniciar sesión | ❌ |

### 🆕 📅 Calendarios (`/api/calendars`) - **NUEVA SECCIÓN**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/` | Listar calendarios disponibles del usuario | ✅ |
| GET | `/?onlyActive=true` | Filtrar solo calendarios activos | ✅ |
| GET | `/?onlyWritable=true` | Solo calendarios con permisos de escritura | ✅ |
| POST | `/sync` | Sincronizar calendarios desde Google API | ✅ |
| GET | `/:calendarId` | Obtener detalles de calendario específico | ✅ |

### 📅 Eventos (`/api/event`) - **ACTUALIZADO**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| POST | `/create` | Crear nuevo evento (🆕 acepta calendar_id) | ✅ |
| GET | `/all` | Obtener eventos del usuario (🆕 incluye info calendario) | ✅ |
| GET | `/public/:username` | Obtener eventos públicos de un usuario | ❌ |
| GET | `/public/:username/:slug` | Obtener evento específico público | ❌ |
| PUT | `/toggle-privacy` | Cambiar privacidad del evento | ✅ |
| PUT | `/:eventId/calendar` | 🆕 Configurar calendario de evento | ✅ |
| DELETE | `/:eventId` | Eliminar evento | ✅ |

### ⏰ Disponibilidad (`/api/availability`)
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/me` | Obtener disponibilidad del usuario | ✅ |
| GET | `/public/:eventId` | Obtener disponibilidad para evento público | ❌ |
| PUT | `/update` | Actualizar disponibilidad | ✅ |

### 🔗 Integraciones (`/api/integration`) - **ACTUALIZADO**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/all` | Obtener todas las integraciones | ✅ |
| GET | `/check/:appType` | Verificar estado de integración | ✅ |
| GET | `/connect/:appType` | Obtener URL de conexión OAuth (🆕 scope ampliado) | ✅ |
| GET | `/google/callback` | Callback OAuth de Google | ❌ |

### 🤝 Reuniones (`/api/meeting`) - **ACTUALIZADO**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/user/all` | Obtener reuniones del usuario (🆕 incluye calendar_id) | ✅ |
| POST | `/public/create` | Crear reunión (🆕 usa calendario del evento) | ❌ |
| PUT | `/cancel/:meetingId` | Cancelar reunión (🆕 del calendario correcto) | ✅ |

## 🆕 Flujos de Calendario Específico

### 1. Configuración de Calendarios
```mermaid
graph TD
    A[Usuario Login] --> B[GET /calendars]
    B --> C{¿Calendarios en cache?}
    C -->|No| D[Auto-sincronizar desde Google]
    C -->|Sí| E[Mostrar calendarios disponibles]
    D --> E
    E --> F[Usuario selecciona calendario]
    F --> G[Crear evento con calendar_id]
```

### 2. Flujo de Reunión con Calendario Específico
```mermaid
graph TD
    A[Invitado reserva slot] --> B[Sistema busca evento]
    B --> C[Obtiene calendar_id del evento]
    C --> D[Crea reunión en calendario específico]
    D --> E[Guarda calendar_id en meeting]
    E --> F[Envía invitación desde calendario correcto]
```

### 3. Sincronización de Calendarios
```mermaid
graph TD
    A[POST /calendars/sync] --> B[Validar integración Google]
    B --> C[Obtener lista desde Google API]
    C --> D[Actualizar cache local]
    D --> E[Filtrar solo calendarios con permisos]
    E --> F[Retornar calendarios disponibles]
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL
- Cuenta de Google Cloud Console (para integraciones)

### 1. Clonar el repositorio
```bash
git clone https://github.com/gbandala/cal-backend.git
cd cal-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# Configuración del servidor
PORT=8000
NODE_ENV=development
BASE_PATH=/api

# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/cal_backend

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=1d

# Google OAuth (🆕 SCOPE AMPLIADO)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/integration/google/callback

# Frontend
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_INTEGRATION_URL=http://localhost:3000/integrations
```

### 4. Configurar Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar las APIs:
   - Google Calendar API
   - Google Meet API
4. Crear credenciales OAuth 2.0:
   - Tipo: Aplicación web
   - **🆕 Scopes necesarios**:
     - `https://www.googleapis.com/auth/calendar.events` (leer/escribir eventos)
     - `https://www.googleapis.com/auth/calendar.readonly` (leer calendarios disponibles)
   - URIs de redirección autorizados: `http://localhost:8000/api/integration/google/callback`
5. Copiar Client ID y Client Secret al archivo `.env`

### 5. Configurar base de datos
```bash
# Usar el script actualizado con soporte para calendarios
psql -U usuario -d cal_backend -f cal_backendv2.sql
```

### 6. Ejecutar la aplicación

#### Desarrollo
```bash
npm run dev
```

#### Producción
```bash
npm run build
npm start
```

La aplicación estará disponible en `http://localhost:8000`

## 📝 Ejemplos de Uso

### Registro de Usuario
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Juan Pérez",
    "email": "dr.juan@ejemplo.com",
    "password": "password123"
  }'
```

### 🆕 Obtener Calendarios Disponibles
```bash
curl -X GET http://localhost:8000/api/calendars \
  -H "Authorization: Bearer tu_jwt_token"
```

### 🆕 Crear Evento en Calendario Específico
```bash
curl -X POST http://localhost:8000/api/event/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{
    "title": "Consulta Médica - 30 min",
    "description": "Consulta en calendario específico",
    "duration": 30,
    "locationType": "GOOGLE_MEET_AND_CALENDAR",
    "calendar_id": "consultorio@gmail.com",
    "calendar_name": "Calendario Consultorio"
  }'
```

### 🆕 Cambiar Calendario de Evento Existente
```bash
curl -X PUT http://localhost:8000/api/events/event-id/calendar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{
    "calendar_id": "primary",
    "calendar_name": "Mi Calendario Principal"
  }'
```

### 🆕 Sincronizar Calendarios
```bash
curl -X POST http://localhost:8000/api/calendars/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{
    "forceRefresh": true
  }'
```

## 🔒 Seguridad

- **Autenticación JWT** con tokens seguros
- **Hash de contraseñas** con bcrypt y salt rounds
- **Validación de entrada** con class-validator
- **Middleware de autenticación** en rutas protegidas
- **Manejo seguro de tokens OAuth** con refresh automático
- **🆕 Validación de acceso a calendarios** - Solo calendarios del usuario
- **🆕 Permisos granulares** - Verificación de permisos de escritura
- **CORS configurado** para orígenes específicos

## 🏗️ Arquitectura

### Estructura de Carpetas
```
src/
├── @types/           # Tipos TypeScript personalizados
├── config/           # Configuraciones (DB, OAuth, etc.)
├── controllers/      # Controladores de las rutas
│   └── calendar.controller.ts  # 🆕 NUEVO
├── database/
│   ├── dto/         # Data Transfer Objects
│   │   └── calendar.dto.ts     # 🆕 NUEVO
│   └── entities/    # Entidades de TypeORM
│       └── user-calendar.entity.ts  # 🆕 NUEVO
├── enums/           # Enumeraciones
├── middlewares/     # Middlewares personalizados
├── routes/          # Definición de rutas
│   └── calendar.routes.ts      # 🆕 NUEVO
├── services/        # Lógica de negocio
│   └── calendar.service.ts     # 🆕 NUEVO
└── utils/           # Utilidades y helpers
    └── calendar.helper.ts      # 🆕 NUEVO
```

### Patrón de Diseño
- **Arquitectura en capas** (Controllers → Services → Repository)
- **DTOs** para validación de entrada
- **Entities** con TypeORM para modelado de datos
- **🆕 Cache de calendarios** - Optimización con sincronización inteligente
- **🆕 Helpers especializados** - Utilidades para gestión de calendarios
- **Middlewares** para funcionalidades transversales
- **Error handling** centralizado

## 🧪 Testing y Desarrollo

### Scripts Disponibles
```bash
npm run dev      # Modo desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Ejecutar en producción
```

### 🆕 Colección Postman v2.0
- **47 requests** organizados por funcionalidad
- **3 flujos completos** de testing para calendarios
- **Scripts automáticos** para capturar variables
- **Testing de calendarios específicos** incluido

### Debugging
- Logs de errores en consola
- Información de conexión a base de datos
- **🆕 Logs de sincronización** de calendarios
- **🆕 Tracking de calendar_id** en operaciones
- Manejo de errores HTTP estructurado

## 🆕 Características Destacadas v2.0

### Inteligencia de Calendario
- **Auto-detección**: Sincroniza calendarios automáticamente en primera consulta
- **Cache inteligente**: Evita llamadas repetitivas a Google API
- **Permisos granulares**: Solo muestra calendarios donde puede escribir
- **Backup automático**: Usa 'primary' si calendario específico no disponible

### Experiencia de Usuario
- **Configuración sin fricción**: Lista calendarios disponibles al instante
- **Flexibilidad total**: Cambiar calendario de eventos existentes
- **Consistencia**: Reuniones siempre en el calendario correcto
- **Transparencia**: Usuario siempre sabe qué calendario se usa

### Optimización Técnica
- **SQL directo**: Para operaciones de cache optimizadas
- **Queries inteligentes**: Filtros por estado y permisos
- **Renovación automática**: Tokens de Google sin intervención manual
- **Escalabilidad**: Estructura preparada para múltiples proveedores

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/CalendarSpecific`)
3. Commit cambios (`git commit -m 'Add calendar specific functionality'`)
4. Push a la rama (`git push origin feature/CalendarSpecific`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

**gbandala** - [GitHub](https://github.com/gbandala)

## 🙏 Agradecimientos

- Inspirado en Calendly
- Gracias a la comunidad de TypeScript y Node.js
- Google APIs por las integraciones de calendario
- **🆕 Contributors** del desarrollo de calendarios específicos

---

**🆕 Versión 2.0** - Soporte completo para calendarios específicos  
**Última actualización**: Junio 2025  
**Funcionalidades nuevas**: Calendarios múltiples, cache inteligente, sincronización automática