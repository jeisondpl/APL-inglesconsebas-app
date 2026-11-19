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
- No se envía el mensaje automático de `chispa` que manda la web al cancelar (el servidor no lo hace).

## 2.3 Reagendar (escoger espacio)

- Backend (`app/api/reagendar.php`, solo en la copia de desarrollo): `reschedule_slots {id}` devuelve
  los espacios ya filtrados (profes excluidas del estudiante, exclusivas como LeShaun solo si las
  tiene, horario habitual, cruces a menos de 1 h con otra clase, anticipación 6 h / 12 h en Power,
  plazo `expires_at`) y `student_reschedule {id,date,time,teacherId}` exige que el espacio esté en
  esa lista, crea el evento como la web y ejecuta con `set_reschedule_date` (que repite sus reglas).
  Solo clases `to_reschedule`; en grupo responde `en_grupo` (queda para la web). En desarrollo
  (`LEAP_SIN_INTEGRACIONES=1`) los espacios se inventan. **Pendiente: portarlo al Leap de
  Hostinger** y probar contra Google Calendar real.
- App: botón «Escoger nuevo espacio» en las clases «Por reagendar»; hoja con el plazo, los espacios
  por día (su profe primero) y confirmación. Un 409 (espacio ocupado) deja el error visible y vuelve
  a leer las clases.
- No se envían los mensajes de `chispa` ni el aviso al admin (`todos`) que manda la web.

## 2.4 Agendar una clase (Flex)

- Backend (`app/api/flex.php`, solo en la copia de desarrollo): `flex_estado {studentId}` (liviano:
  cuántas clases le quedan en el ciclo en curso, fin del ciclo, pago pendiente), `flex_slots` (lo
  mismo + espacios filtrados: profes excluidas o exclusivas, desde 6 h, sin pasar el fin del ciclo,
  sin repetir fecha y hora) y `student_flex_book {studentId,date,time,teacherId}`, que exige que el
  espacio esté en esa lista, crea el evento y deja que `add_manual` inserte la clase. Solo planes
  `Flex*`; el resto recibe `no_flex` y la App no muestra la tarjeta. **Pendiente: portarlo al Leap de
  Hostinger.**
- App: tarjeta «Agendar una clase» (cuántas quedan, aviso si el ciclo termina en ≤ 7 días, motivo si
  no puede) y la misma hoja de espacios que reagendar, en modo `agendar`. Los estados `no_flex`,
  `pago_pendiente`, `sin_cupo` y `sin_ciclo` los decide Leap.
- No se envían el mensaje de `chispa` ni el aviso al admin (`todos`) que manda la web.

## Fuera de alcance

Reagendar, autoagendar Flex y el evento de Google (2.2 a 2.4). La pantalla no ofrece
acciones que no existen.
