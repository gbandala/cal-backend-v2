# Cal Backend 📅

Una aplicación backend completa para gestión de calendarios y programación de reuniones, inspirada en Calendly. Permite a los usuarios crear eventos, gestionar su disponibilidad e integrar con servicios como Google Calendar y Google Meet.

## 🚀 Funcionalidades Principales

### 🔐 Autenticación y Usuarios
- **Registro de usuarios** con validación de datos
- **Login seguro** con JWT tokens
- **Generación automática** de usernames únicos
- **Hash seguro** de contraseñas con bcrypt
- **Middleware de autenticación** con Passport JWT

### 📅 **Gestión de Calendarios Específicos** ✅
- **Eventos en calendarios dedicados** - Los eventos pueden crearse en calendarios específicos de Google Calendar
- **Scope OAuth ampliado** - Incluye permisos para calendarios específicos
- **Reuniones en calendario correcto** - Las citas van al calendario configurado del evento
- **Eliminación inteligente** - Cancelación desde el calendario correcto

### 📅 Gestión de Eventos
- **Crear eventos personalizados** con título, descripción y duración
- **✅ Calendario específico** - Asignar eventos a calendarios particulares
- **Eventos públicos/privados** con toggle de privacidad
- **URLs amigables** con slugs únicos
- **Tipos de ubicación** (Google Meet, Zoom, etc.)
- **Eventos públicos** accesibles sin autenticación
- **Eliminación en cascada** - Elimina eventos y cancela reuniones automáticamente

### ⏰ Gestión de Disponibilidad
- **Configuración de horarios** por día de la semana
- **Intervalos de tiempo** personalizables entre reuniones
- **Horarios disponibles/no disponibles** por día
- **Consulta pública** de disponibilidad para eventos
- **Slots de tiempo automáticos** basados en duración del evento

### 🔗 Integraciones
- **OAuth2 con Google** para Calendar y Meet
- **✅ Scope ampliado** - Incluye permisos para calendarios específicos
- **Gestión automática de tokens** con refresh automático
- **Múltiples proveedores** (Google configurado, Zoom/Microsoft preparados)
- **Validación de conexiones** activas
- **URLs de autorización** dinámicas

### 🤝 Gestión de Reuniones
- **Programación de reuniones** por invitados
- **✅ Calendario inteligente** - Usa el calendario configurado del evento
- **Creación automática** en Google Calendar
- **Enlaces automáticos** de Google Meet
- **Estados de reunión** (programada, cancelada)
- **Filtros** por estado (próximas, pasadas, canceladas)
- **✅ Cancelación inteligente** - Elimina del calendario correcto

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
```

#### Events (Eventos) - **CON SOPORTE DE CALENDARIOS**
```typescript
- id: UUID
- title: string
- description: string (opcional)
- duration: number (minutos)
- slug: string (único por usuario)
- isPrivate: boolean
- locationType: EventLocationEnum
- calendar_id: string (✅ NUEVO - default: 'primary')
- calendar_name: string (✅ NUEVO - opcional)
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
- user: User (relación N:1)
```

#### Meeting (Reuniones) - **CON CALENDARIO CORRECTO**
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

### 📅 Eventos (`/api/event`) - **CON SOPORTE DE CALENDARIOS**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| POST | `/create` | Crear nuevo evento (✅ acepta calendar_id) | ✅ |
| GET | `/all` | Obtener eventos del usuario (✅ incluye info calendario) | ✅ |
| GET | `/public/:username` | Obtener eventos públicos de un usuario | ❌ |
| GET | `/public/:username/:slug` | Obtener evento específico público | ❌ |
| PUT | `/toggle-privacy` | Cambiar privacidad del evento | ✅ |
| DELETE | `/:eventId` | Eliminar evento (✅ con cancelación en cascada) | ✅ |

### ⏰ Disponibilidad (`/api/availability`)
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/me` | Obtener disponibilidad del usuario | ✅ |
| GET | `/public/:eventId` | Obtener disponibilidad para evento público | ❌ |
| PUT | `/update` | Actualizar disponibilidad | ✅ |

#### ✨ Nuevos parámetros de consulta
Todos los endpoints de disponibilidad ahora soportan los siguientes parámetros:

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `timezone` | Zona horaria del usuario (IANA) | `America/Mexico_City`, `Europe/Bucharest` |
| `date` | Fecha específica para slots (formato YYYY-MM-DD) | `2025-06-13` |

#### Ejemplos de uso mejorados
```bash
# Obtener disponibilidad personal en zona horaria específica
curl -X GET http://localhost:8000/api/availability/me?timezone=America/New_York \
  -H "Authorization: Bearer tu_jwt_token"

# Obtener slots disponibles para una fecha específica en zona horaria específica  
curl -X GET http://localhost:8000/api/availability/public/event-id?timezone=America/Mexico_City&date=2025-06-10

# Actualizar disponibilidad desde zona horaria específica
curl -X PUT http://localhost:8000/api/availability/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{...}' \
  ?timezone=Europe/Bucharest

### 🔗 Integraciones (`/api/integration`) - **SCOPE AMPLIADO**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/all` | Obtener todas las integraciones | ✅ |
| GET | `/check/:appType` | Verificar estado de integración | ✅ |
| GET | `/connect/:appType` | Obtener URL de conexión OAuth (✅ scope ampliado) | ✅ |
| GET | `/google/callback` | Callback OAuth de Google | ❌ |

### 🤝 Reuniones (`/api/meeting`) - **CALENDARIO CORRECTO**
| Método | Endpoint | Descripción | Auth Requerida |
|--------|----------|-------------|----------------|
| GET | `/user/all` | Obtener reuniones del usuario | ✅ |
| POST | `/public/create` | Crear reunión (✅ usa calendario del evento) | ❌ |
| PUT | `/cancel/:meetingId` | Cancelar reunión (✅ del calendario correcto) | ✅ |

## ✅ Flujos Implementados

### 1. Configuración de Calendarios Específicos
```mermaid
graph TD
    A[Usuario conecta Google Calendar] --> B[OAuth con scopes ampliados]
    B --> C[Usuario crea evento]
    C --> D[Especifica calendar_id]
    D --> E[Evento guardado con calendario]
    E --> F[Reuniones van al calendario correcto]
```

### 2. Flujo de Reunión con Calendario Específico
```mermaid
graph TD
    A[Invitado reserva slot] --> B[Sistema busca evento]
    B --> C[Obtiene calendar_id del evento]
    C --> D[Crea reunión en calendario específico]
    D --> E[Google Meet generado]
    E --> F[Invitación desde calendario correcto]
```

### 3. Eliminación en Cascada
```mermaid
graph TD
    A[DELETE event] --> B[Buscar reuniones asociadas]
    B --> C[Cancelar cada reunión]
    C --> D[Eliminar de Google Calendar]
    D --> E[Eliminar reuniones de BD]
    E --> F[Eliminar evento]
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

# Google OAuth (✅ SCOPE AMPLIADO)
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
   - **✅ Scopes necesarios**:
     - `https://www.googleapis.com/auth/calendar` (acceso completo)
     - `https://www.googleapis.com/auth/calendar.events` (eventos específicos)
   - URIs de redirección autorizados: `http://localhost:8000/api/integration/google/callback`
5. Copiar Client ID y Client Secret al archivo `.env`

### 5. Configurar base de datos
```bash
# Crear base de datos y ejecutar schema
psql -U usuario -d cal_backend -f cal_backend.sql
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

### ✅ Crear Evento en Calendario Específico
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

### ✅ Crear Reunión (Usa calendario del evento automáticamente)
```bash
curl -X POST http://localhost:8000/api/meeting/public/create \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-id",
    "startTime": "2025-06-02T14:00:00.000Z",
    "endTime": "2025-06-02T14:30:00.000Z",
    "guestName": "Test Guest",
    "guestEmail": "test.guest@ejemplo.com",
    "additionalInfo": "Reunión de prueba"
  }'
```

### ✅ Cancelar Reunión (Del calendario correcto)
```bash
curl -X PUT http://localhost:8000/api/meeting/cancel/meeting-id \
  -H "Authorization: Bearer tu_jwt_token"
```

## 🔒 Seguridad

- **Autenticación JWT** con tokens seguros
- **Hash de contraseñas** con bcrypt y salt rounds
- **Validación de entrada** con class-validator
- **Middleware de autenticación** en rutas protegidas
- **Manejo seguro de tokens OAuth** con refresh automático
- **✅ Validación de ownership** - Solo el propietario puede modificar eventos
- **✅ Calendario correcto** - Reuniones solo en calendarios del usuario
- **CORS configurado** para orígenes específicos

## 🏗️ Arquitectura

### Estructura de Carpetas
```
src/
├── @types/           # Tipos TypeScript personalizados
├── config/           # Configuraciones (DB, OAuth, etc.)
├── controllers/      # Controladores de las rutas
├── database/
│   ├── dto/         # Data Transfer Objects
│   └── entities/    # Entidades de TypeORM
├── enums/           # Enumeraciones
├── middlewares/     # Middlewares personalizados
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
└── utils/           # Utilidades y helpers
```

### Patrón de Diseño
- **Arquitectura en capas** (Controllers → Services → Repository)
- **DTOs** para validación de entrada
- **Entities** con TypeORM para modelado de datos
- **Middlewares** para funcionalidades transversales
- **Error handling** centralizado
- **✅ Separation of concerns** - Cada servicio maneja su dominio

## 🧪 Testing y Desarrollo

### Scripts Disponibles
```bash
npm run dev      # Modo desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Ejecutar en producción
```

### Colección Postman
- Requests organizados por funcionalidad
- Scripts automáticos para capturar variables
- ✅ Testing de calendarios específicos incluido

### Debugging
- Logs de errores en consola
- Información de conexión a base de datos
- ✅ Tracking de calendar_id en operaciones
- Manejo de errores HTTP estructurado

## ✅ Estado Actual - Funcionalidades Completadas

### 🎯 Lo que Funciona 100%
- ✅ **OAuth con calendarios específicos** - Scopes ampliados funcionando
- ✅ **Eventos en calendarios dedicados** - No más "primary" hardcodeado
- ✅ **Reuniones en calendario correcto** - Usa calendar_id del evento
- ✅ **Cancelación inteligente** - Del calendario específico, no primary
- ✅ **Eliminación en cascada** - Event Types → Meetings → Google Calendar
- ✅ **Foreign key fixes** - Sin errores de integridad referencial
- ✅ **Gestión de tokens** - Refresh automático funcionando

### 📋 Próximos Pasos (Roadmap)
- 🚧 **Cache de calendarios** - Sincronización automática desde Google
- 🚧 **Endpoints /api/calendars** - CRUD completo de calendarios
- 🚧 **Reasignación de calendarios** - Cambiar calendario de eventos existentes
- 🚧 **Dashboard multi-calendario** - Vista unificada
- 🚧 **Analytics por calendario** - Métricas específicas

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

**gbandala** - [GitHub](https://github.com/gbandala)

## 🙏 Agradecimientos

- Inspirado en Calendly
- Gracias a la comunidad de TypeScript y Node.js
- Google APIs por las integraciones de calendario

---

**✅ Versión 2.0-beta** - Soporte básico para calendarios específicos  
**Última actualización**: Junio 2025  
**Estado**: Core functionality completada, extensiones en desarrollo