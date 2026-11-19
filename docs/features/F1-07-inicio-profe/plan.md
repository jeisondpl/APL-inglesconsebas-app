# Plan · F1-07 · Inicio del profe (tarjeta F1-04, ítem 1.18)

> Construido directamente a pedido del usuario («avancemos») mientras Sebas resuelve los accesos de
> F1-06; este documento deja las decisiones por escrito.

## Alcance

- Con sesión de profe, la ruta `InicioProfe` monta `PestanasProfe`: las mismas cuatro pestañas que el
  estudiante. Clases, Mensajes y Tareas son `PantallaProximamente` con textos del profe.
- Inicio (`InicioProfeScreen`, módulo `inicio`):
  1. **Clase destacada**: la que está en curso o, si no, la siguiente de hoy, con «Abrir Zoom».
  2. **Clases de hoy**: hora, estudiante, número de clase y momento (Próxima, En curso, Sin marcar,
     Tomada, No asistió).
  3. **Asistencias por marcar**, con 3 y «Y N más». «Marcar» avisa «Próximamente» (F2-02).
  4. **Tareas por revisar** (`ready_review`): lleva a la pestaña Tareas.
  5. **Mensajes sin leer**: lleva a Mensajes y alimenta la insignia.
- Fuera de alcance: marcar asistencia, ver o revisar tareas y el chat (F2-02, F3-01, F3-02). El
  inicio del admin (1.19) sigue provisional.

## API (lecturas permitidas a la sesión de profe, `seguridad.php`)

| Sección | Llamada | Nota |
|---|---|---|
| Clases de hoy | `GET class_sessions&all_teacher=1` | Trae todo desde hace 60 días: filtra el dominio. |
| Nombres | `GET students&role=teacher` | `class_sessions` no trae el nombre del estudiante. |
| Asistencias | `POST class_sessions {action:'pending_attendance', teacherId}` | `teacherId` debe ser el de la sesión (si no, 403 `not_owner`). |
| Revisar | `GET tasks&teacher_id` | Se filtra `ready_review`. |
| Mensajes | `POST chispa {action:'get_unread', role:'teacher', teacherId}` | `total`. |

## Reglas de dominio (`inicioProfe.validations.ts`)

- Fecha, hora y profe **efectivos**: `new_date ?? scheduled_date`, `new_time ?? scheduled_time` y
  `new_teacher_id ?? teacher_id`, como la web.
- «Hoy» es la fecha de Bogotá (`hoyBogota`), no la del teléfono ni UTC.
- Estados del día: `scheduled`, `taken`, `no_show` y `rescheduled*`. Se excluyen los cancelados,
  los festivos, `to_reschedule`, `expired` y `medical_exception`.
- Momento: tomada o no asistió según el estado. Si sigue programada: próxima antes de la hora, en
  curso durante 50 min (`DURACION_CLASE_MIN`, la duración por defecto de Leap) y sin marcar después.

## Riesgos

- `class_sessions&all_teacher=1` y `students` traen los datos de todos los profes. Es lo que ya hace
  la web, pero conviene un filtro por profe en el backend antes de producción (seguimiento en F1-02).
