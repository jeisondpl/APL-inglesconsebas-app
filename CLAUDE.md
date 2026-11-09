# APL-inglesconsebas-app

App móvil de la academia *Inglés con Sebas* para estudiantes, profes y admin. Usa React Native CLI 0.88.1 en modo bare, sin Expo, con TypeScript estricto. Identificador `com.inglesconsebas.app` en Android e iOS. Es permanente y no se cambia. Nombre interno `InglesConSebas`.

**Antes de escribir código, lee [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).** Define capas, convenciones, el flujo de trabajo y que todo módulo nuevo se propone primero para aprobación.

- **Backend**: la API PHP de Leap, en `../app/api/`. Hay que leer `../app/CLAUDE.md` para entender el dominio: ciclos, tokens y `class_sessions.status`. La lógica de negocio vive allí. La app no la duplica, solo la consume.
- **Contrato y alcance**: `../docs/propuestas/02-propuesta-app-movil.md`, fases F1 a F4.
- **Seguimiento**: el tablero «App móvil · Inglés con Sebas» de APL-Tareas (#4 en https://tareas.demojd.online), por el MCP `apl-tareas`.
- **Repo**: `origin` = https://github.com/jeisondpl/APL-inglesconsebas-app.git, rama `main`.
- **Verificar**: `npx tsc --noEmit`, `npm run lint` y `npm test`. Android se compila con `npm run android`. iOS solo compila en macOS o en CI.
- Todo en español: código, comentarios e interfaz. Los identificadores siguen la sección 6 de la guía.
