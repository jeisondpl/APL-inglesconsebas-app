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

## Fuera de alcance

Cancelar, reagendar, autoagendar Flex y el evento de Google (2.2 a 2.4). La pantalla no ofrece
acciones que no existen.
