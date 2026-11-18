# Plan · F3-01 · Chat estudiante–profe (tarjeta F3-01, ítems 3.1 a 3.6)

> **Decisiones del usuario (2026-11-18):** alcance **todo F3-01**; API con **endpoints nuevos
> incrementales** (la web no cambia); el estudiante escribe a **sus profes** y el profe ve **solo a
> sus estudiantes** (el admin sigue desde la web).

## Cómo funciona hoy (web, endpoint `chispa`)

- Un hilo **por estudiante** en `chispa_messages` (`sender` student|teacher|admin, `message`,
  `image_data` y `voice_data` en base64 dentro de la fila, `is_read`, `read_by_teacher`,
  `read_by_admin`, `reactions` JSON, `is_edited`).
- La web trae el hilo **completo** cada 2 s, con todo el base64: inviable en móvil.
- La web manda `sender`/`senderName` en el cuerpo: el servidor no los verifica (solo el estudiante
  queda amarrado a su propio id en `seguridad.php`).

## Principio

El servidor decide: el remitente sale de la **sesión**, no del cuerpo; los límites de tamaño, la
propiedad del hilo y el «leído» los resuelve Leap. La App solo muestra y envía.

## API nueva (`app/api/mensajes.php`, copia de desarrollo)

| Llamada | Quién | Qué hace |
|---|---|---|
| `GET messages_since&student_id&after_id` | estudiante (su hilo) / profe (sus estudiantes) | Mensajes con `id > after_id`, **sin** base64: trae `tieneImagen`/`tieneVoz` y `leido`. Sin `after_id`: los últimos 50. Es el sondeo liviano (3.6). |
| `GET message_media&id` | idem | El base64 de un mensaje (imagen o voz), bajo demanda y con propiedad. |
| `POST chat:app_send {studentId, message?, imageData?, voiceData?}` | idem | Inserta con remitente y nombre de la sesión. Límites: texto 2000, imagen ≈ 1,5 MB, voz ≈ 2 MB. Debe traer algo. |
| `POST chat:app_mark_read {studentId}` | idem | Marca como leídos los mensajes del otro lado (`read_by_teacher` para el profe, `is_read` para el estudiante). |
| `POST chat:app_react {id, emoji}` | idem | Pone o quita (mismo emoji) la reacción del usuario de la sesión. |
| `GET chat_inbox` | profe | Una fila por estudiante suyo con conversación: último mensaje, hora y no leídos (3.5). |

Todas se registran en `seguridad.php`. Profe → solo estudiantes suyos (`students.teacher_id` o
`student_teachers`). **Pendiente: portarlo al Leap de Hostinger.**

## Entregas (una por commit, cada una probada)

1. **Backend** `mensajes.php` + permisos + pruebas con curl (propiedad, límites, remitente, leído).
2. **3.1 texto** + **3.6 incremental**: módulo `src/modules/mensajes` (hexagonal), pestaña Mensajes
   del estudiante y del profe con hilo, envío, sondeo cada ~4 s solo con la pantalla activa.
3. **3.4 leído y reacciones**: marca «Visto», reacciones por pulsación larga.
4. **3.5 bandeja del profe**: lista de conversaciones con no leídos y contador en la pestaña.
5. **3.3 imágenes**: elegir de galería (permiso nativo), reducir antes de enviar, ver a pantalla completa.
6. **3.2 voz**: grabar (permiso de micrófono), enviar, reproducir con progreso.

Las entregas 5 y 6 añaden librerías **nativas** (selector de imágenes y audio): hay que recompilar
Android y declarar permisos; se decide la librería concreta antes de instalarla.

## Reglas de dominio (`mensajes.validations.ts`)

- Orden por `id`; agrupar por día; «Hoy»/«Ayer»; el texto se recorta y no se envía vacío.
- Estado propio del mensaje: enviando → enviado → visto; falla de envío con reintento.
- No leídos del hilo: mensajes del otro lado con `id` mayor al último leído.

## Pruebas

- Dominio y casos de uso (cobertura 90 %), controller (sondeo, envío optimista, error y reintento,
  desmontar), pantallas (RNTL), backend por curl, puerta `npm run calidad`, emulador con dos
  sesiones (Ana ↔ Meli).

## Riesgos

- Base64 grande en la tabla: por eso la lista no lo trae y se pide aparte.
- El hilo es compartido con el admin de la web: lo que escribe el admin aparece al estudiante (se
  muestra como «Inglés con Sebas»).
- Sin notificaciones push todavía (F3-03): el sondeo solo corre con la App abierta.
