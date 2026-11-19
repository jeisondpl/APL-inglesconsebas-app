# Plan · F2-02 · Horario y asistencia del profe (tarjeta F2-02, ítems 2.5 y 2.6)

> **Aprobado (2026-11-18)** con las dos propuestas: una marca no se corrige desde la App y se puede
> marcar desde que empieza la clase.

## Alcance

- La pestaña **Clases** del profe deja de ser «Próximamente»: módulo nuevo `src/modules/agenda`
  (los módulos no se importan entre sí; lo que comparte con `inicio` y `clases` se duplica en infra o
  sube a `shared/lib`, como ya se hizo con `fechas`).
- **2.5 Horario**: selector Día | Semana.
  - **Día**: flechas para ir al día anterior o siguiente y «Hoy». Lista de sus clases por hora:
    estudiante, número de clase, estado y momento (Próxima, En curso, Sin marcar, Tomada, No asistió).
    La próxima o la que está en curso lleva «Abrir Zoom».
  - **Semana** (lunes a domingo): una fila por día con su cantidad de clases y cuántas faltan por
    marcar; tocar un día abre su vista Día.
- **2.6 Asistencia**: en cada clase programada que ya empezó, «Realizada» y «No asistió», con una
  hoja de confirmación. El servidor decide el resultado (estado, conteo del ciclo, espejo al
  compañero de grupo, bitácora): la App no calcula nada.
- El botón **«Marcar»** del inicio del profe (hoy avisa «Próximamente») usa la misma acción.
- Fuera de alcance: reporte de clase y notas (F3-xx), sustituciones, mover o cancelar clases como
  profe, y la vista del admin.

## API

| Qué | Llamada | Nota |
|---|---|---|
| Clases | `GET class_sessions&all_teacher=1` | Ya la usa el inicio del profe; la App filtra por profe efectivo y rango de fechas. |
| Nombres | `GET students&role=teacher` | `class_sessions` no trae el nombre del estudiante. |
| Marcar | `POST class_sessions {action:'update_status', id, status:'taken' \| 'no_show'}` | La misma acción de la web (`AsistenciasPendientes`). |

### Cambio en el backend (copia de desarrollo)

Hoy una sesión de profe puede mandar `update_status` con **cualquier** estado sobre **cualquier**
clase. Para que la App sea segura, en `seguridad.php` / `api.php`:

- el profe solo puede poner `taken` o `no_show`, y solo en clases suyas (`teacher_id` o
  `new_teacher_id` = su id);
- solo sobre clases `scheduled` o `rescheduled` que ya empezaron;
- el admin conserva todo lo que hoy puede.

Es una regla nueva (la web hoy no la tiene): hay que avisar a Sebas y portarla al Leap de Hostinger.

## Reglas de dominio (`agenda.validations.ts`)

- Fecha, hora y profe **efectivos** (`new_*` si existen), como el inicio.
- «Hoy» es la fecha de Bogotá (`hoyBogota`). La semana va de lunes a domingo.
- Se muestran `scheduled`, `taken`, `no_show` y `rescheduled*`; se excluyen cancelados, festivos,
  `to_reschedule`, `expired` y `medical_exception` (igual que el inicio).
- Momento: próxima antes de la hora; en curso 50 min; sin marcar después.
- Se puede marcar desde que empieza la clase (la App solo evita un botón inútil; Leap decide).

## Pruebas

- Dominio: rango de la semana, agrupación por día, momento, contadores «sin marcar».
- Controller: cambio de día y semana, marcar con éxito, error 409 (la clase cambió) que refresca,
  doble toque, desmontar a mitad.
- Pantalla (RNTL): vista Día y Semana, hoja de confirmación, avisos.
- Backend: curl contra Docker local — profe marca clase propia, ajena (rechaza), estado no permitido
  (rechaza), clase futura (rechaza).
- Puerta `npm run calidad` verde y prueba visual en el emulador.

## Riesgos

- `class_sessions&all_teacher=1` trae datos de todos los profes (ya señalado en F1-07): conviene
  filtrarlo por profe en el backend antes de producción.
- Marcar mal un estado cambia el conteo del ciclo del estudiante. Por eso la hoja de confirmación y
  la regla de no poder corregir (decisión 1).

## Decisiones tomadas

1. Una marca **no se corrige** desde la App: la corrige el admin en la web (el servidor responde `class_marked`).
2. Se puede marcar **desde que empieza** la clase (`class_not_started` antes de la hora).
