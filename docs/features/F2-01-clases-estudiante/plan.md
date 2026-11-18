# Plan · F2-01 · Clases del estudiante (tarjeta F2-01)

> Se construye por partes. Esta entrega es **2.1: historial de clases del ciclo con su estado**
> (solo lectura). Cancelar (2.2), reagendar (2.3) y Flex (2.4) mutan datos con reglas delicadas de
> tokens y ventanas: van en entregas aparte, cada una con su plan y su OK.

## Alcance de esta entrega (2.1)

- La pestaña **Clases** del estudiante deja de ser «Próximamente»: módulo `src/modules/clases`.
- Selector de ciclo (flechas): abre en el ciclo actual (el que contiene hoy) y permite ver los
  anteriores. Resumen del ciclo: tomadas, programadas, por reagendar y canceladas.
- Lista del ciclo por fecha: día, hora, número de clase, profe y estado. La **próxima** clase va
  destacada con «Ir a mi clase» (Zoom). Una reagendada se muestra en su fecha nueva y dice cuándo era.
- Profe y admin no cambian: su pestaña Clases sigue «Próximamente» (F2-02 para el profe).

## API

`GET api.php?endpoint=class_sessions&student_id=<id>`: lectura que `PERMITIDAS_ESTUDIANTE` deja hacer
al estudiante con su propio id. Devuelve el historial completo (hasta 2000 filas) con
`cycle_start`/`cycle_end`; la App agrupa por ciclo.

## Reglas de dominio (`clases.validations.ts`)

- **Fecha efectiva**: en `rescheduled*` con `new_date`, mandan `new_date`/`new_time`.
- **Estados**: vocabulario de `SESSION_STATUS_DISPLAY` de la web en español; un estado desconocido se
  muestra tal cual (no se esconde una clase).
- **Tomadas**: `counts_as_taken` sin los estados *no_impact*, igual que el progreso del inicio.
- **Próxima**: la primera `scheduled`/`rescheduled` que no pasó; sigue siéndolo 50 min tras empezar.
- Las fechas y horas son de Bogotá (`shared/lib/fechas`, ahora compartido con el inicio).

## Entrega 2.2: cancelar una clase

La web decidía el resultado de cancelar en el navegador y el servidor lo validaba solo en parte (un
cliente modificado podía cancelar sin costo). Decisión acordada con el usuario: **el servidor decide**.

- Leap (copia de desarrollo, `app/api/cancelacion.php`): `cancel_preview` (qué pasaría) y
  `student_cancel` (cancela con el estado y el costo que calcula el servidor, vía `update_status`).
  Mismas ramas y orden que `CancelModal`; rechaza lo no cancelable. **Pendiente: portarlo al Leap de
  Hostinger** antes de producción.
- App: botón «Cancelar clase» en las clases programadas que no han empezado; hoja inferior con el
  texto del escenario, opciones (reagendar o soltar) si Leap las ofrece, y confirmación. La App no
  calcula estado ni tokens; muestra el `finalStatus` real.
- **Power cobra un solo token.** La web hoy cobra doble en la cancelación tardía (<12 h): el
  servidor ya descuenta y la web llama además a `deduct_token`. Avisar a Sebas.
- Escoger el nuevo espacio tras «reagendar» (2.3) y agendar otra clase en Flex (2.4) aún no están:
  la hoja lo dice con honestidad («por ahora, desde la web»).
- No se envía el mensaje automático de `chispa` que manda la web al cancelar (el servidor no lo hace).

## Fuera de alcance

Reagendar, autoagendar Flex y el evento de Google (2.2 a 2.4). La pantalla no ofrece
acciones que no existen.
