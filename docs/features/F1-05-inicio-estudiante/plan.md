# Plan · F1-05 · Inicio del estudiante + barra de navegación inferior

> Pedido del usuario: «iniciemos implementando el home y aplica la misma Bottom Navigation Bar de
> livic … aplicar ya». El usuario autorizó ejecutar sin esperar la aprobación del plan.
> Rama `feat/F1-05-inicio-estudiante`, sale de `feat/F1-04-rediseno-animado` en `3c899d6`.
> Diseño aprobado: `output/canvas-live/project/A-M2-Inicio-{Dark,Light}.dc.html`.

## 0. Definition of Ready

| Punto | Estado |
|---|---|
| Código de tablero | ✔ F1-05 (ítem 1.17 del contrato: inicio real del estudiante) |
| Criterios verificables | ✔ Sección 3 |
| Dependencias | ✔ Sin dependencias nuevas. `@react-navigation/bottom-tabs` no está instalado: se usa el patrón de Livic (estado de pestaña + contexto), sin paquetes. |
| API | ✔ Todo lo que pinta el inicio sale de endpoints que el estudiante ya puede llamar con el token de la App (`PERMITIDAS_ESTUDIANTE` en `app/api/seguridad.php`). Verificado con `curl` contra el Docker local con `ana`/`1234`. |

## 1. Resumen

Tras el login, el estudiante deja de ver el «Inicio provisional» y entra a una estructura de cuatro
pestañas (Inicio, Clases, Mensajes, Tareas) con la barra inferior animada de APL-Livic-movil
(`LivicTabBar`). La pestaña Inicio es la pantalla A-M2: saludo, plan y ciclo, próxima clase con
cuenta atrás, progreso del ciclo, cancelaciones disponibles, tareas pendientes y último mensaje.
Clases, Mensajes y Tareas quedan como «Próximamente». Profe y admin siguen en el inicio provisional.

## 2. Alcance

**Entra**

- `src/shared/iconos/`: íconos SVG de trazo 1.75 (inicio, clases, mensajes, tareas, reloj, flecha).
- `src/shared/movimiento/barraPestanas.ts`: estado compartido de ocultar la barra con el scroll
  (`makeMutable`) y el hook `useOcultarBarraAlDesplazar`.
- `src/app/navigation/BarraPestanas.tsx`: copia fiel de `LivicTabBar` con tokens del tema.
- `src/app/navigation/PestanasEstudiante.tsx` + `ContextoPestanas.tsx`: estado de la pestaña activa,
  contexto `irAPestana` y la insignia de no leídos.
- Módulo `src/modules/inicio/` (domain, aplications, infrastructure, presentation).
- Pantallas mínimas de Clases, Mensajes y Tareas con estado vacío de marca.
- Token nuevo `velo` (fondo de la hoja inferior) en los dos temas.

**No entra**

- Reagendar o cancelar (el botón «Reagendar» solo avisa «Próximamente»).
- Contenido real de las pestañas Clases, Mensajes y Tareas (features propias).
- Inicio real de profe y admin (siguen con `InicioProvisionalScreen`).
- Caché sin conexión (1.15), notificaciones push y refresco automático periódico.
- Cambios en el backend.

## 3. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA1 | Con sesión de estudiante se ve la estructura de pestañas con Inicio activa; profe y admin siguen viendo el inicio provisional. | Tests de `NavegadorRaiz`. |
| CA2 | La barra tiene 4 pestañas (Inicio, Clases, Mensajes, Tareas) con `accessibilityRole="tab"` y `accessibilityState.selected` en la activa; pulsar una pestaña la activa y cambia el contenido. | Test de `BarraPestanas` y de `PestanasEstudiante`. |
| CA3 | La barra replica `LivicTabBar`: SVG de 72 de alto con hendidura que viaja con resorte, círculo elevado de 58 con el ícono activo y pop al cambiar, íconos inactivos que se apagan en la activa, etiqueta con color interpolado y press-scale 0.94. | Revisión de código + prueba manual. |
| CA4 | La barra se oculta con el teclado y al desplazar hacia abajo, y reaparece al subir; con reduce-motion los cambios son instantáneos. | Test del hook de scroll y del reduce-motion; manual. |
| CA5 | Colores solo por token: barra `superficie` + `borde`, círculo `marca` con ícono `sobreMarca` (verde #86EF86 con negro en oscuro, verde bosque con blanco en claro), inactivos `textoSecundario`. | `auditar-marca.mjs` sin hallazgos de marca; test. |
| CA6 | La pestaña Mensajes muestra una insignia con los no leídos que obtiene el Inicio (oculta con 0; «9+» desde 10). | Test de la barra. |
| CA7 | Cabecera: «Hola, {nombre}», «Plan {plan} · ciclo {inicio} – {fin}» y avatar con la inicial. El avatar abre una hoja con «Cerrar sesión» y, solo en `__DEV__`, «Ver sistema de diseño». | Test de pantalla. |
| CA8 | «Cerrar sesión» de la hoja usa `cerrarSesionUseCase` (vía `useSesionController`) y vuelve al login. | Test de `NavegadorRaiz`. |
| CA9 | Tarjeta «PRÓXIMA CLASE»: cuenta atrás («En 35 min», «En 21 h», «En 3 días», «Ahora»), día y hora («Mañana · 6:00 p. m.»), profe, duración y «por Zoom»; «Ir a mi clase» abre el enlace de Zoom con `EnlacesPort` (sin enlace, el botón no aparece y se explica); «Reagendar» avisa «Próximamente». Sin clases futuras: «Aún no tienes clases programadas». | Tests de dominio y de pantalla. |
| CA10 | Tarjeta CICLO: «{tomadas} de {total} clases» con barra de progreso, con la misma regla que la web (`StudentHome`). Tarjeta CANCELACIONES: «{disponibles} de {máximo}» y «Avisa con 12 h de antelación» (24 h en planes Flex); sin cancelaciones en el plan, lo dice. | Tests de dominio y de pantalla. |
| CA11 | Tareas pendientes: hasta 3, con «Vence {fecha}» y el total «N por entregar»; sin pendientes, «Aún no tienes tareas pendientes». | Tests. |
| CA12 | Mensajes: último mensaje (remitente, hora, texto) y no leídos; sin mensajes, «Aún no tienes mensajes». | Tests. |
| CA13 | Carga con `PulsoCarga`; error total con `AvisoEnLinea` y «Reintentar»; si falla una sola sección, esa sección muestra su aviso y el resto se pinta; pull-to-refresh recarga todo. | Tests de controller y pantalla. |
| CA14 | Entradas escalonadas con `Revelar`, `usePresionEscala` en las tarjetas pulsables y reduce-motion respetado. | Revisión + test con reduce-motion. |
| CA15 | Ningún dato de ejemplo: todo sale de la API o de la sesión; lo que no exista se muestra como vacío honesto. | Revisión + tests del adaptador. |
| CA16 | Pestañas Clases, Mensajes y Tareas: cabecera y estado vacío de marca «Próximamente» con entrada animada. | Test de pantalla. |
| CA17 | `npm run calidad` en verde (90 % en `domain`/`aplications` de `inicio`), `auditar-marca.mjs src` sin incumplimientos y `generar-tokens.mjs --comprobar` al día. | Local. |

## 4. Dominio (`src/modules/inicio/domain`)

- `entities/Inicio.entities.ts`
  - `IArgsResumenInicio { idEstudiante: string }`
  - `IResponsePlanEstudiante { plan: string | null; ciclo: { inicio: string; fin: string } | null; cancelacionesUsadas: number; cancelacionesMaximas: number }`
  - `IResponseSesionClase { id; fecha; hora; estado; cuentaComoTomada; inicioCiclo; finCiclo; fechaNueva; horaNueva; profe; enlaceZoom }`
  - `IResponseFranjaHorario { diaSemana; hora; duracionMin }`
  - `IResponseTarea { id; titulo; estado; venceEl }`
  - `IResponseMensaje { remitente; deEstudiante; texto; adjunto: 'imagen' | 'voz' | null; enviadoEl }`
  - `IResumenInicio`: secciones independientes `Seccion<T> = { ok: true; datos: T } | { ok: false; msg: string }`.
- `models/InicioRepository.ts` (puerto): `obtenerPlan`, `listarClases`, `listarHorario`,
  `listarTareas`, `contarNoLeidos`, `listarMensajes`.
- `validations/inicio.validations.ts` (puras, con `ahora` inyectado y zona `America/Bogota`, UTC−5
  sin horario de verano): `instanteDeClase`, `proximaClase`, `cuentaAtras`, `etiquetaDia`,
  `formatearHora`, `formatearFecha`, `rangoCiclo`, `nombrePlan`, `progresoCiclo`,
  `cancelacionesDisponibles`, `horasDeAviso`, `tareasPendientes`, `ultimoMensaje`, `inicialDe`.
- `inicio.reglas.ts`: espejo de `PLAN_RULES` de la web (`app/index.html` ~738: mínimo y nombre por
  plan). Es una constante duplicada más, como las que ya lista `app/CLAUDE.md`.

## 5. Archivos por capa

1. Dominio: entidades, puerto, reglas y validaciones.
2. Infraestructura: `infrastructure/leapInicio.tipos.ts`, `apiInicioRepository.ts` (mapeo y
   normalización) y `memoriaInicioRepository.ts` (para tests: devuelve vacío).
3. Casos de uso: `aplications/obtenerResumenInicio/obtenerResumenInicio.ts`.
4. Controller: `aplications/controllers/Inicio.controller.ts` (`useInicioController`: `_cargar`,
   `_refrescar`, `_abrirClase`, `_reagendar`).
5. Presentación: `presentation/screens/InicioEstudianteScreen.tsx`, componentes en
   `presentation/components/` y textos en `presentation/inicio.textos.ts`.
6. Composición: `src/app/navigation/{BarraPestanas,PestanasEstudiante,ContextoPestanas}.tsx`,
   `src/app/pestanas/` (rutas de las pestañas y pantallas «Próximamente»), `NavegadorRaiz.tsx`
   (elige el componente por rol) y `src/app/di/contenedor.ts` (`repositorios.inicio`).

La pantalla del módulo no importa el módulo `sesion` (regla de capas): `src/app` le pasa el usuario,
`alCerrarSesion` y `alVerSistemaDiseno` por props.

## 6. API (rama `feat/F1-02-seguridad-api` de Leap)

Todas con `Authorization: Bearer <token de la App>`. Permitidas por `PERMITIDAS_ESTUDIANTE` con la
regla de propiedad (`qs`/`param` = id del estudiante de la sesión).

| Sección | Endpoint | Campos |
|---|---|---|
| Cabecera: nombre | Sesión (login / `auth.php?action=me`) | `student.name` |
| Cabecera: plan y ciclo | `GET auth.php?action=me` | `student.pkg`, `student.cycle.start`, `student.cycle.end` |
| Próxima clase | `GET api.php?endpoint=class_sessions&student_id=<id>` | `id`, `scheduled_date`, `scheduled_time`, `status`, `new_date`, `new_time`, `teacher_name`, `teacher_zoom_url` |
| Próxima clase: duración | `GET api.php?endpoint=schedule&student_id=<id>` | `day_of_week`, `class_time`, `duration_minutes` |
| Ciclo | `class_sessions` (arriba) + `me` | `cycle_start`, `cycle_end`, `counts_as_taken`, `status` y `student.pkg` (mínimo del plan) |
| Cancelaciones | `GET auth.php?action=me` | `student.tokensUsed`, `student.tokensMax`, `student.pkg` |
| Tareas pendientes | `GET api.php?endpoint=tasks&student_id=<id>` | `id`, `title`, `status`, `due_date` |
| Mensajes: no leídos | `POST api.php?endpoint=chispa` `{action:'get_unread', studentId}` | `unread` |
| Mensajes: último | `POST api.php?endpoint=chispa` `{action:'get_thread', studentId}` | `sender`, `sender_name`, `message`, `image_data`, `voice_data`, `created_at` |

Reglas copiadas de la web (no hay endpoint que las dé):

- **Próxima clase**: `status='scheduled'` en `scheduled_date/time`, o `status='rescheduled'` en
  `new_date/new_time`; se muestra desde 50 min después del inicio hacia delante (la web acompaña la
  clase hasta el minuto 50).
- **Progreso del ciclo** (`StudentHome`, `index.html` ~2553): sesiones con
  `cycle_start ≤ hoy ≤ cycle_end`; tomadas = `counts_as_taken=1` sin los estados *no_impact*; total =
  mínimo del plan (`PLAN_RULES`), y en Power⚡ el total de sesiones del ciclo sin las *no_impact*.
- **Antelación**: 24 h en Flex y 12 h en el resto (`api.php` ~1760 y la web).

Vacíos honestos en el Docker local: `ana` no tiene `class_sessions` (el seed no las genera para el
ciclo actual), así que Próxima clase sale «Aún no tienes clases programadas» y el ciclo «0 de 8».

Sin cambios en el backend. Riesgo: `get_thread` devuelve el hilo completo (con imágenes en base64);
para el inicio bastaría el último mensaje (mejora futura del backend).

## 7. Pasos nativos

Ninguno.

## 8. Plan de pruebas

- Dominio: tabla de casos de cuenta atrás, días, horas, próxima clase (scheduled, rescheduled,
  pasada, en curso), progreso (planes normales, Power, desconocido), cancelaciones, tareas, mensajes.
- Adaptador con un `ClienteApi` falso: rutas, parámetros, mapeo, respuestas no válidas y errores.
- Caso de uso con repositorio falso: secciones independientes y error total.
- Controller: carga, error, reintentar, refrescar, abrir Zoom (éxito y fallo), reagendar.
- Pantalla: cabecera, hoja del avatar, tarjetas, vacíos, error y reduce-motion.
- Barra: pestañas, `selected`, cambio de pestaña, insignia; hook de scroll.
- `NavegadorRaiz`: el estudiante entra a las pestañas; «Cerrar sesión» desde la hoja.

## 9. Riesgos y preguntas abiertas

- El saludo usa el nombre completo de la sesión («Hola, Ana Torres»), como pide la tarjeta.
- `PLAN_RULES` queda duplicado también en la App (la web tiene Power⚡ con mínimo 8 y el PHP 20; se
  sigue a la web, que es lo que ve hoy el estudiante).
- `created_at` de los mensajes se muestra tal cual llega (hora del servidor).
- iOS sin verificar (sin Mac).

## 10. Commits previstos

1. `docs(f1-05): plan del inicio del estudiante y la barra de pestañas`
2. `feat(inicio): dominio del inicio del estudiante`
3. `feat(inicio): adaptador HTTP del inicio con la API de Leap`
4. `feat(inicio): caso de uso y controller del inicio`
5. `feat(shared): íconos de pestañas, token velo y ocultar la barra con el scroll`
6. `feat(app): barra de pestañas animada como la de Livic`
7. `feat(inicio): pantalla de inicio del estudiante`
8. `feat(app): pestañas del estudiante en el navegador raíz`
9. `test(...)`: pruebas por capa.
