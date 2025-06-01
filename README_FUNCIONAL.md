# Sistema de Gestión de Reservas y Calendario

## 📋 Descripción General

Sistema completo de reservas y gestión de calendario que permite a usuarios crear eventos/servicios reservables y gestionar su disponibilidad. La plataforma conecta expertos/consultores con clientes a través de un sistema de reservas automatizado con integraciones externas.

**🆕 NUEVA FUNCIONALIDAD v2.0**: Soporte completo para calendarios específicos de Google Calendar, permitiendo a los usuarios organizar sus eventos en calendarios dedicados (ej: "Consultorio", "Personal", "Empresa").

## 🏗️ Arquitectura del Sistema

El sistema está compuesto por **cinco servicios principales** que trabajan de manera integrada:

1. **[Servicio de Autenticación](#-servicio-de-autenticación)** - Registro y login de usuarios
2. **[Servicio de Disponibilidad](#-servicio-de-disponibilidad)** - Gestión de horarios disponibles  
3. **[🆕 Servicio de Calendarios](#-servicio-de-calendarios-específicos-nuevo)** - Gestión de calendarios múltiples
4. **[Servicio de Eventos](#-servicio-de-gestión-de-eventos)** - Creación y gestión de servicios reservables
5. **[Servicio de Integraciones](#-servicio-de-integraciones)** - Conexiones con servicios externos

## 🔄 Flujo de Usuario Completo

```
REGISTRO → CONFIGURAR DISPONIBILIDAD → 🆕 SINCRONIZAR CALENDARIOS → CREAR EVENTOS → CONECTAR INTEGRACIONES → RECIBIR RESERVAS
```

---

## 🔐 Servicio de Autenticación

### Descripción
Maneja el registro y autenticación de usuarios con configuración automática de disponibilidad predeterminada.

### Funcionalidades Principales

#### Registro de Usuarios (`registerService`)
- **Auto-configuración inteligente**: Crea disponibilidad L-V 9AM-5PM automáticamente
- **Username único**: Genera automáticamente desde el nombre (ej: "juanperez123abc")
- **Seguridad**: Contraseñas hasheadas, validación de emails duplicados

#### Autenticación (`loginService`)
- **JWT tokens**: Generación de tokens seguros con expiración
- **Validación robusta**: Verificación de credenciales con errores genéricos
- **Sesiones seguras**: Retorna usuario sin contraseña + token de acceso

### Flujo Funcional
1. **Registro**: Usuario proporciona datos → Sistema genera username único → Crea disponibilidad predeterminada
2. **Login**: Usuario ingresa credenciales → Validación → Generación token JWT → Sesión activa

### Características Destacadas
- **UX sin fricción**: Usuario obtiene configuración útil inmediatamente
- **Seguridad empresarial**: Manejo profesional de tokens y contraseñas
- **Escalabilidad**: Username generation con 17.5M combinaciones posibles

---

## 🆕 Servicio de Calendarios Específicos (NUEVO)

### Descripción
**Nueva funcionalidad v2.0** que permite a los usuarios gestionar múltiples calendarios de Google Calendar, sincronizarlos automáticamente y asignar eventos a calendarios específicos.

### Funcionalidades Principales

#### Gestión de Calendarios Múltiples
- **Sincronización automática** (`syncUserCalendarsService`): Obtiene calendarios desde Google Calendar API
- **Cache inteligente** (`getUserCalendarsService`): Almacena calendarios localmente para performance
- **Validación de permisos** (`validateUserCalendarAccess`): Solo calendarios con permisos de escritura
- **Detalles específicos** (`getCalendarDetailsService`): Información completa de cada calendario

#### Inteligencia de Sincronización
- **Auto-sync en primera consulta**: Si no hay calendarios en cache, sincroniza automáticamente
- **Sincronización forzada**: Opción de refrescar completamente el cache
- **Filtrado inteligente**: Excluye calendarios sin permisos de escritura
- **Gestión de errores**: Manejo robusto de errores de API de Google

### Casos de Uso Reales

#### Médico/Consultor
```
PROBLEMA: Dr. Juan tiene calendarios separados:
- "Consultorio" (dr.juan.consultorio@gmail.com)
- "Personal" (dr.juan@gmail.com)  
- "Conferencias" (conferencias.dr.juan@gmail.com)

SOLUCIÓN: 
✅ Sistema sincroniza automáticamente todos los calendarios
✅ Dr. Juan crea evento "Consulta Médica" en calendario "Consultorio"
✅ Pacientes reservan citas que van directamente al calendario correcto
✅ No se mezclan citas personales con profesionales
```

#### Empresa/Freelancer
```
PROBLEMA: María maneja múltiples clientes:
- "Empresa A" (maria.empresaA@gmail.com)
- "Empresa B" (maria.empresaB@gmail.com)
- "Personal" (maria@gmail.com)

SOLUCIÓN:
✅ Crea eventos específicos por cliente en calendarios dedicados
✅ Reuniones van al calendario del cliente correspondiente
✅ Facturación y reportes separados por calendario
✅ Privacidad total entre proyectos de diferentes clientes
```

### Algoritmos de Cache

#### Estrategia de Cache Inteligente
1. **Primera consulta**: Si cache vacío → Auto-sincroniza desde Google
2. **Consultas siguientes**: Usa cache local para velocidad óptima
3. **Actualización manual**: Usuario puede forzar sincronización
4. **Timestamps**: Cada calendario tiene fecha de última sincronización

#### Optimización de Performance
- **SQL directo**: Para operaciones de cache optimizadas
- **Filtrado en BD**: Solo calendarios activos con permisos de escritura
- **Cache por usuario**: Cada usuario tiene su propio cache independiente

---

## ⏰ Servicio de Disponibilidad

### Descripción
Gestiona horarios de disponibilidad de usuarios y genera slots de tiempo disponibles para eventos públicos, considerando reuniones existentes.

### Funcionalidades Principales

#### Gestión Personal
- **Consulta disponibilidad** (`getUserAvailabilityService`): Obtiene configuración actual del usuario
- **Actualización horarios** (`updateAvailabilityService`): Modifica días y horarios disponibles

#### Disponibilidad Pública
- **Slots para eventos** (`getAvailabilityForPublicEventService`): Genera horarios reservables considerando:
  - Horarios de disponibilidad configurados
  - Reuniones ya programadas **🆕 en todos los calendarios**
  - Duración del evento
  - Intervalos entre citas (timeGap)

### Algoritmos Inteligentes

#### Generación de Slots (Actualizado)
1. Para cada día de la semana calcula la próxima fecha
2. Divide horario disponible en intervalos según duración del evento
3. **🆕 Consulta todas las reuniones en todos los calendarios del usuario**
4. Excluye slots con conflictos de reuniones existentes
5. Filtra horarios en el pasado (no permite reservar atrás en el tiempo)

#### Prevención de Conflictos Multi-Calendario
- **Validación integral**: Detecta conflictos en todos los calendarios del usuario
- **🆕 Calendar-aware**: Considera reuniones de diferentes calendarios
- **Tiempo real**: No muestra slots ya pasados si es el día actual
- **Flexibilidad**: Configurable por usuario (horarios, días, intervalos)

---

## 📅 Servicio de Gestión de Eventos (ACTUALIZADO)

### Descripción
Maneja el ciclo completo de eventos/servicios reservables con sistema de URLs públicas, control de privacidad y **🆕 asignación de calendarios específicos**.

### Funcionalidades Principales

#### Gestión de Eventos con Calendarios
- **Creación avanzada** (`createEventService`): 
  - ✅ Crea eventos con slug automático y validación
  - **🆕 Acepta calendar_id y calendar_name específicos**
  - **🆕 Usa calendario por defecto si no se especifica**
- **🆕 Reasignación de calendario** (`setEventCalendarService`): Cambiar calendario de eventos existentes
- **Privacidad** (`toggleEventPrivacyService`): Cambia visibilidad público/privado
- **Consulta personal** (`getUserEventsService`): Lista eventos **🆕 con información de calendario**
- **Eliminación** (`deleteEventService`): Borra eventos de manera segura

#### Acceso Público (Mejorado)
- **Descubrimiento** (`getPublicEventsByUsernameService`): Lista eventos públicos **🆕 con info de calendario**
- **Detalle** (`getPublicEventByUsernameAndSlugService`): Evento específico para reservar

### 🆕 Casos de Uso con Calendarios Específicos

#### Configuración Médico Especialista
```
Dr. García tiene:
1. Evento "Consulta General" → Calendario "Consultorio General"
2. Evento "Consulta Cardiología" → Calendario "Especialidades"
3. Evento "Teleconsulta" → Calendario "Virtual"

RESULTADO:
✅ Pacientes reservan consultas que van al calendario apropiado
✅ Dr. García ve cada tipo de cita en su calendario correspondiente
✅ Diferentes tarifas y configuraciones por especialidad
✅ Reportes separados por tipo de consulta
```

#### Configuración Consultor Empresarial
```
María Consultora tiene:
1. Evento "Asesoría Startups" → Calendario "Startups"
2. Evento "Training Corporativo" → Calendario "Corporativo"  
3. Evento "Mentoría Personal" → Calendario "Personal"

BENEFICIOS:
✅ Clientes empresariales van a calendario profesional
✅ Mentorías personales no se mezclan con trabajo
✅ Facturación automática por tipo de servicio
✅ Diferentes políticas de cancelación por calendario
```

### Arquitectura de URLs Públicas (Mejorada)

#### Sistema SEO-Friendly con Contexto
```
PATRÓN: /[username]/[event-slug]
EJEMPLO: /dr.garcia123/cardiologia-especializada

NUEVOS BENEFICIOS v2.0:
✅ URLs memorables y legibles
✅ Optimización para motores de búsqueda  
✅ Identificación única global de eventos
✅ Estructura escalable
✅ 🆕 Contexto de calendario en metadata
✅ 🆕 Información de especialidad/tipo en evento
```

### Integración con Calendarios

#### Flujo de Creación de Evento
```
1. Usuario selecciona calendario de lista sincronizada
2. Crea evento con calendar_id específico
3. Sistema valida permisos de escritura en calendario
4. Evento guardado con referencia al calendario
5. Futuras reservas van automáticamente al calendario correcto
```

#### Validación y Seguridad
- **Validación de propiedad**: Solo el dueño puede modificar/eliminar eventos
- **🆕 Validación de calendario**: Solo calendarios del usuario con permisos de escritura
- **Datos filtrados**: Consultas públicas excluyen información sensible
- **🆕 Fallback inteligente**: Usa 'primary' si calendario específico no disponible

---

## 🔗 Servicio de Integraciones (ACTUALIZADO)

### Descripción
Gestiona conexiones OAuth con servicios externos con **🆕 scope ampliado** para lectura de calendarios disponibles y soporte para calendarios específicos.

### Funcionalidades Principales

#### Gestión de Conexiones (Mejorada)
- **Estado completo** (`getUserIntegrationsService`): Lista integraciones **🆕 con calendario por defecto**
- **Verificación rápida** (`checkIntegrationService`): Confirma si integración está activa
- **Conexión OAuth ampliada** (`connectAppService`): 
  - ✅ Inicia proceso de autorización con proveedores
  - **🆕 Incluye scope para lectura de calendarios disponibles**
  - **🆕 Solicita permisos para calendario.readonly**
- **Persistencia** (`createIntegrationService`): Guarda tokens tras autorización exitosa

#### Gestión de Tokens (Mejorada)
- **Validación automática** (`validateGoogleToken`): Renueva tokens de Google automáticamente
- **🆕 Scope management**: Gestiona diferentes permisos (eventos + calendarios)
- **Seguridad OAuth**: Estado codificado, scopes mínimos, almacenamiento seguro

### Integraciones Soportadas (Actualizadas)

#### Google Meet & Calendar (Ampliado)
- **Funcionalidad básica**: Crea eventos en Google Calendar + enlaces Meet automáticos
- **🆕 Gestión de calendarios**: Lista y accede a calendarios específicos del usuario
- **Scopes actualizados**: 
  - `calendar.events` (lectura/escritura de eventos)
  - **🆕 `calendar.readonly`** (lectura de calendarios disponibles)
- **Renovación**: Tokens se renuevan automáticamente sin intervención del usuario

#### Zoom Meeting (Preparado para calendarios)
- **Estado**: Estructura configurada, implementación OAuth pendiente
- **🆕 Funcionalidad planeada**: Soporte para múltiples calendarios Zoom
- **Integración futura**: Mapeo calendario Google ↔ Zoom rooms

#### Outlook Calendar (Preparado para múltiples calendarios)  
- **Estado**: Configuración lista, integración OAuth pendiente
- **🆕 Funcionalidad planeada**: Soporte para múltiples carpetas/calendarios Outlook
- **Sincronización bidireccional**: Outlook ↔ Sistema ↔ Google

### Flujo OAuth Completo (Actualizado)
```
1. Usuario selecciona "Conectar Google Calendar"
2. Sistema genera URL OAuth con scopes ampliados
3. Usuario autoriza permisos de eventos + lectura calendarios
4. Google retorna código + estado
5. Sistema intercambia código por tokens
6. 🆕 Sistema obtiene lista de calendarios disponibles
7. 🆕 Cache calendarios en base de datos local
8. Tokens guardados en BD de forma segura
9. Integración lista + calendarios sincronizados
```

---

## 🆕 Flujos Funcionales Multi-Calendario

### Flujo Completo de Usuario v2.0

#### 1. Configuración Inicial Ampliada
```
Registro → Username automático + Disponibilidad L-V 9AM-5PM
    ↓
Login → JWT token generado
    ↓
Conectar Google Calendar → OAuth con scopes ampliados
    ↓
🆕 Auto-sincronización calendarios → Cache local creado
    ↓
Listar calendarios disponibles → Usuario ve opciones
    ↓
Crear evento "Consultoría Marketing" en calendario específico
    ↓
Evento configurado → calendar_id: "consultorio@gmail.com"
    ↓
Hacer evento público → URL: /usuario123abc/consultoria-marketing
```

#### 2. Reserva de Cliente (Mejorada)
```
Cliente visita → /usuario123abc/consultoria-marketing
    ↓
Sistema consulta evento → Obtiene calendar_id configurado
    ↓
Consulta disponibilidad → Considera reuniones de TODOS los calendarios
    ↓
Muestra slots libres → Excludye conflictos multi-calendario
    ↓
Cliente selecciona horario → Reserva confirmada
    ↓
🆕 Reunión creada en calendario específico del evento
    ↓
Meeting.calendar_id guardado → Para cancelaciones futuras
    ↓
Invitación enviada desde calendario correcto
```

#### 3. Gestión de Reuniones Multi-Calendario
```
Reunión creada → calendar_id: "consultorio@gmail.com"
    ↓
Cliente cancela → Sistema busca meeting.calendar_id
    ↓
🆕 Cancelación del calendario correcto → No afecta otros calendarios
    ↓
Notificación desde calendario específico → Contexto apropiado
```

### Casos de Uso Avanzados

#### Escenario: Médico con Múltiples Especialidades
```
CONFIGURACIÓN:
- Calendario "Cardiología": cardiologia.dr.lopez@gmail.com
- Calendario "Medicina General": general.dr.lopez@gmail.com  
- Calendario "Emergencias": emergencias.dr.lopez@gmail.com

EVENTOS CONFIGURADOS:
1. "Consulta Cardiología" → Calendario "Cardiología" 
2. "Consulta General" → Calendario "Medicina General"
3. "Urgencia" → Calendario "Emergencias"

FLUJO PACIENTE:
- Paciente cardíaco reserva "Consulta Cardiología"
- Cita aparece solo en calendario de Cardiología
- Dr. López ve citas organizadas por especialidad
- Facturación y reportes separados automáticamente
```

#### Escenario: Consultora con Múltiples Clientes
```
CONFIGURACIÓN:
- Calendario "Cliente A": maria.clienteA@gmail.com
- Calendario "Cliente B": maria.clienteB@gmail.com
- Calendario "Personal": maria@gmail.com

EVENTOS CONFIGURADOS:
1. "Asesoría Cliente A" → Calendario "Cliente A"
2. "Training Cliente B" → Calendario "Cliente B"  
3. "Mentoría Personal" → Calendario "Personal"

BENEFICIOS:
- Cada cliente ve solo sus reuniones
- Facturación automática por proyecto
- Privacidad total entre clientes
- Reportes de tiempo por cliente automáticos
```

---

## 🔄 Integración Entre Servicios (Actualizada)

### Dependencias Entre Servicios v2.0

#### Servicio de Calendarios → Todos los Servicios
- **Base fundamental**: Todos los servicios consultan calendarios disponibles
- **Cache compartido**: Performance optimizada para toda la aplicación
- **Validación universal**: Permisos verificados en cada operación

#### Servicio de Eventos → Calendarios
- Los eventos almacenan `calendar_id` específico del calendario seleccionado
- Validación automática de que el usuario tiene acceso al calendario
- Fallback a 'primary' si calendario no disponible

#### Disponibilidad → Calendarios Multi  
- Al generar slots, consulta reuniones de **TODOS** los calendarios del usuario
- Prevención de conflictos inter-calendario automática
- Performance optimizada con queries unificadas

#### Integraciones → Calendarios
- OAuth con scopes ampliados para acceso a lista de calendarios
- Auto-sincronización en primera conexión
- Renovación de tokens mantiene acceso a todos los calendarios

#### Reuniones → Calendarios Específicos
- Cada reunión guarda `calendar_id` donde fue creada
- Cancelaciones van al calendario correcto automáticamente
- Invitaciones enviadas desde contexto apropiado

### Flujos de Sincronización

#### Sincronización Inicial (Primera vez)
```
1. Usuario conecta Google Calendar
2. Sistema obtiene tokens con scopes ampliados
3. Auto-sincronización de calendarios disponibles
4. Cache local creado con todos los calendarios
5. Usuario listo para usar calendarios específicos
```

#### Sincronización Manual
```
1. Usuario solicita refresh de calendarios
2. Sistema valida tokens de Google
3. Re-sincronización forzada desde Google API
4. Cache actualizado con cambios
5. Nuevos calendarios disponibles inmediatamente
```

#### Sincronización Automática
```
1. Usuario consulta calendarios
2. Sistema verifica último sync
3. Si > 24 horas, auto-sincroniza en background
4. Cache siempre actualizado sin intervención manual
```

---

## 📊 Métricas y Monitoreo (Ampliadas)

### Métricas por Servicio v2.0

#### 🆕 Calendarios
- Calendarios sincronizados por usuario
- Frecuencia de sincronización manual vs automática
- Errores de sincronización y recuperación
- Uso de calendarios específicos vs 'primary'
- Performance de cache hits vs API calls

#### Autenticación
- Registros exitosos vs fallidos
- Intentos de login y tasas de éxito
- Generación de usernames únicos

#### Disponibilidad (Mejorada)
- Slots generados por evento **🆕 por calendario**
- Conflictos detectados multi-calendario
- Modificaciones de horarios por usuario
- **🆕 Reuniones evitadas por conflictos inter-calendario**

#### Eventos (Ampliados)
- Eventos creados públicos vs privados **🆕 por calendario**
- Cambios de privacidad
- **🆕 Reasignaciones de calendario**
- Accesos a URLs públicas **🆕 con contexto de calendario**

#### Integraciones (Actualizadas)
- Conexiones OAuth exitosas **🆕 con scope ampliado**
- Renovaciones de tokens automáticas
- Errores de integración por proveedor
- **🆕 Sincronizaciones de calendario exitosas/fallidas**

#### 🆕 Reuniones Multi-Calendario
- Reuniones creadas por calendario específico
- Cancelaciones del calendario correcto
- Errores de calendar_id missing
- Performance de creación por tipo de calendario

---

## 🛣️ Roadmap y Extensiones (Actualizado)

### Funcionalidades Futuras v2.0

#### Calendarios Avanzados
- **🆕 Sincronización bidireccional**: Cambios en Google reflejados automáticamente
- **🆕 Calendarios compartidos**: Soporte para calendarios de equipo
- **🆕 Políticas por calendario**: Diferentes reglas de cancelación/modificación
- **🆕 Templates de calendario**: Configuraciones predefinidas por industria

#### Integraciones Adicionales
- **Microsoft Teams**: Video conferencing integrado **🆕 con calendario Exchange**
- **Apple Calendar**: Sincronización móvil nativa **🆕 multiple calendars**
- **Stripe**: Pagos para eventos premium **🆕 con facturación por calendario**
- **Calendly**: Importar configuraciones existentes **🆕 manteniendo estructura**

#### Mejoras de Sistema
- **🆕 Dashboard multi-calendario**: Vista unificada de todos los calendarios
- **🆕 Analytics por calendario**: Métricas específicas por calendario
- **🆕 Backup de calendarios**: Respaldo automático de configuraciones
- **Notificaciones**: Email/SMS automáticos pre-reunión **🆕 desde calendario correcto**

#### Escalabilidad
- **🆕 Cache distribuido**: Redis para cache de calendarios multi-usuario
- **🆕 Webhooks de Google**: Notificaciones en tiempo real de cambios
- **🆕 API multi-calendario**: Endpoints específicos para gestión masiva
- **Microservicios**: Separación de servicios por dominio

### Funcionalidades Empresariales

#### Gestión de Equipos
- **🆕 Calendarios de equipo**: Compartir calendarios entre usuarios
- **🆕 Políticas organizacionales**: Reglas de calendario por empresa
- **🆕 Reportes consolidados**: Analytics multi-usuario por calendario
- **🆕 Permisos granulares**: Admin, manager, user roles por calendario

---

## 🔧 Configuración y Deployment (Actualizada)

### Variables de Entorno Requeridas v2.0
```env
# Base
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret

# Google OAuth (🆕 SCOPE AMPLIADO)
GOOGLE_CLIENT_ID=your-google-client-id  
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=https://yourdomain.com/oauth/callback

# 🆕 Configuración de Cache
CALENDAR_CACHE_TTL=86400  # 24 horas
AUTO_SYNC_THRESHOLD=24    # horas
```

### Dependencias Principales (Actualizadas)
- **TypeORM**: ORM para base de datos **🆕 con entidad UserCalendar**
- **Google APIs**: OAuth y Calendar integration **🆕 con scope ampliado**
- **JWT**: Manejo de tokens de autenticación
- **date-fns**: Manipulación de fechas y horarios
- **🆕 Cache strategies**: Optimización de performance para calendarios

### 🆕 Script de Migración
```sql
-- Ejecutar para actualizar BD existente
-- Archivo: cal_backendv2.sql
-- Incluye:
-- - Tabla user_calendars
-- - Campos calendar_id en events, meetings, integrations
-- - Índices optimizados
-- - Constraints de seguridad
```

---

## 📞 Soporte y Contacto (Ampliado)

### 🆕 Soporte Multi-Calendario

Para problemas específicos de calendarios:

1. **Errores de sincronización**: 
   - Verificar permisos OAuth en Google
   - Revisar logs de sincronización
   - Probar sincronización manual forzada

2. **Calendarios no aparecen**:
   - Confirmar permisos de escritura en Google
   - Verificar scope oauth en integración
   - Limpiar cache y re-sincronizar

3. **Reuniones van a calendario incorrecto**:
   - Verificar calendar_id del evento
   - Confirmar que calendario sigue existiendo
   - Revisar logs de creación de reunión

### Soporte General

Para preguntas técnicas, reportes de bugs o solicitudes de nuevas funcionalidades:

1. **Revisa la documentación**: Busca en este README primero
2. **Consulta logs**: Los servicios incluyen logging detallado **🆕 incluyendo calendar_id**
3. **Reporta issues**: Incluye pasos para reproducir y logs relevantes
4. **Solicita features**: Describe el caso de uso y beneficio esperado

### 🆕 Testing con Postman v2.0

- **Colección actualizada**: 47 requests con soporte completo para calendarios
- **3 flujos específicos**: Testing de funcionalidad multi-calendario
- **Scripts automáticos**: Captura calendar_id y variables automáticamente
- **Debugging**: Logs específicos de operaciones de calendario

---

**🆕 Versión 2.0**: Soporte completo para calendarios específicos  
**Última actualización**: Junio 2025  
**Funcionalidades destacadas**: Multi-calendario, cache inteligente, sincronización automática  
**Mantenido por**: Equipo de Desarrollo + Especialistas en Calendar APIs