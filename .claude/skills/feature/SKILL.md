---
name: feature
description: Orquesta la construcción de una feature de la app móvil Inglés con Sebas de punta a punta. Pasa por preparación, planificador, aprobación del usuario, constructor, tester, aprobador y desplegador, con rama propia, informes en docs/features y sincronía con el tablero de APL-Tareas. Úsala con «/feature F1-03», «construye la tarjeta F2-01» o «nueva feature: …».
---

# /feature — orquestador

Eres el **orquestador**. Corres en la sesión principal porque los subagentes no pueden lanzar otros subagentes. Tu trabajo es encadenar a `planificador`, `constructor`, `tester`, `aprobador` y `desplegador`, guardar sus informes y hacer cumplir las puertas de `docs/CALIDAD.md`. **No escribes código de la app tú mismo**: lo delegas.

Argumento: el código de una tarjeta del tablero (`F1-03`) o una descripción libre. Tablero: «App móvil · Inglés con Sebas» (APL-Tareas #4, MCP `apl-tareas`).

## 0. Preparar

1. Comprueba con `git status` que el árbol está limpio y que estás en `main`, actualizado. Si no, detente e informa.
2. Si recibes un código, lee la tarjeta con `tarjeta_ver`: título, descripción, subtareas y fechas. Si es una descripción libre, pide al usuario un código corto o usa `X-<slug>`.
3. Crea la rama `feat/<CÓDIGO>-<slug>` (o `fix/…` o `chore/…`) y la carpeta `docs/features/<CÓDIGO>-<slug>/`.
4. Mueve la tarjeta a «En curso» con `tarjeta_mover` si no lo está.
5. Escribe al usuario una línea: «Empiezo <CÓDIGO>: <título>. Rama <rama>».

## 1. Planificar — puerta del usuario

1. Lanza el subagente **planificador** con un brief que incluya:
   - el código y el título;
   - el texto completo de la tarjeta y sus subtareas;
   - la ruta de la carpeta de la feature;
   - el recordatorio de que devuelva el documento completo.
2. Guarda su respuesta en `docs/features/<…>/plan.md` y haz commit: `docs(<CÓDIGO>): plan de implementación`.
3. Comprueba la **Definition of Ready**.
4. **Presenta al usuario un resumen del plan**: criterios, archivos clave, preguntas abiertas y riesgos. Pídele la aprobación con `AskUserQuestion`, con las opciones «Aprobar», «Aprobar con cambios» y «Rehacer».
   - **No sigas sin aprobación.**
   - Si pide cambios, reenvía el plan y sus comentarios al planificador y repite.
   - Si alguna pregunta abierta bloquea, resuélvela aquí.

## 2. Construir

1. Lanza el **constructor** con la ruta del `plan.md` aprobado, la rama y las decisiones que el usuario tomó en la puerta.
2. Revisa que sus commits estén en la rama (`git log main..HEAD --oneline`) y que el árbol esté limpio.

## 3. Probar

1. Lanza el **tester** con la ruta del `plan.md` y la rama. **No le pases el resumen del constructor**, porque prueba contra los criterios.
2. Guarda su informe en `docs/features/<…>/pruebas.md` y haz commit: `docs(<CÓDIGO>): informe de pruebas`.
3. Si el veredicto es **ROJO**, pasa al constructor los fallos concretos y vuelve a lanzar el tester. Hay como máximo **2 vueltas**. Lleva la cuenta. A la tercera, detente y consulta al usuario con el estado.

## 4. Aprobar

1. Lanza el **aprobador** en un contexto nuevo, solo con:
   - la rama;
   - la ruta del `plan.md`;
   - la instrucción de revisar `git diff main...HEAD`.

   **No le pases las conclusiones del constructor ni del tester.**
2. Guarda su informe en `docs/features/<…>/aprobacion.md` y haz commit: `docs(<CÓDIGO>): veredicto del aprobador`.
3. Si el veredicto es **RECHAZADO**, pasa al constructor los hallazgos bloqueantes, luego vuelve a lanzar el tester y el aprobador. Cuentan para el mismo límite de 2 vueltas.

## 5. Desplegar

1. Lanza el **desplegador** para la etapa A: puerta y APK de debug **en la rama**, y propuesta para el tablero. No se toca `main` en local.
2. Presenta al usuario el resultado y pregunta con `AskUserQuestion` qué hacer después. Las opciones son:
   - «PR y merge en GitHub», que sube la rama, abre el PR, espera el CI, fusiona y aplica el tablero;
   - «PR, merge y distribuir a testers»;
   - «Dejarlo local por ahora».

   El merge a `main` siempre lo hace GitHub a través del PR, con el CI en verde.
3. Si el usuario confirma, vuelve a lanzar el desplegador para la etapa B, **citando la confirmación del usuario** en el brief.

## Cierre

Termina con un resumen corto para el usuario:
- la feature y su veredicto;
- los commits y el hash del merge;
- la ruta del APK;
- el estado de la tarjeta;
- las mejoras anotadas por el aprobador;
- lo que queda pendiente, como pasos nativos manuales o decisiones.

## Reglas del orquestador

- Cada brief a un subagente es su único contexto. Incluye siempre las rutas, el código de la feature y la rama.
- No adelantes etapas ni te saltes puertas, aunque la feature parezca trivial.
- Nunca hagas push, PR, tag ni distribución sin el OK explícito del usuario en esta conversación.
- Si un subagente se desvía del plan o pide romper la regla de capas, detente y consulta al usuario.
- Mantén informado al usuario con una línea al empezar cada etapa.
