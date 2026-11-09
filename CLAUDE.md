# APL-inglesconsebas-app

App móvil de la academia *Inglés con Sebas* para estudiantes, profes y admin. Usa React Native CLI 0.88.1 en modo bare, sin Expo, con TypeScript estricto. Identificador `com.inglesconsebas.app` en Android e iOS. Es permanente y no se cambia. Nombre interno `InglesConSebas`.

**Antes de escribir código, lee [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)**: capas, convenciones y la regla de proponer antes de implementar.

## Cómo se trabaja: `/feature`

Cada punto de la app se construye con la skill **`/feature <código de tarjeta>`** (`.claude/skills/feature/SKILL.md`). Encadena a cinco subagentes de `.claude/agents/` con funciones separadas. Las reglas y las puertas están en [`docs/CALIDAD.md`](docs/CALIDAD.md).

1. **planificador**: solo lectura. Escribe `docs/features/<CÓDIGO>-<slug>/plan.md`. **El usuario lo aprueba** antes de construir.
2. **constructor**: implementa capa por capa, con un commit por paso.
3. **tester**: prueba contra los criterios del plan, solo toca tests, y escribe `pruebas.md`.
4. **aprobador**: revisión independiente de solo lectura. Escribe `aprobacion.md` con APROBADO o RECHAZADO.
5. **desplegador**:
   - con el veredicto APROBADO, hace el merge `--no-ff` a `main`, compila el APK de debug y actualiza el tablero;
   - solo con el OK del usuario hace push, abre el PR o distribuye.

Hay un máximo de 2 vueltas de corrección por feature. Después se consulta al usuario.

## Puerta automática y git

- **`npm run calidad`**: `tsc`, ESLint (con **eslint-plugin-boundaries**, que hace fallar el lint si se rompe la regla de capas), Prettier y Jest con cobertura. Los umbrales son 90 % en `domain` y `aplications` de cada módulo y 70 % global. Se calculan por carpeta en `jest.config.js`.
- **Ganchos** (husky):
  - `pre-commit`: lint-staged (Prettier y ESLint de lo que se commitea);
  - `commit-msg`: commitlint, con Conventional Commits en español. El cuerpo admite como máximo 100 caracteres por línea. El tipo `merge` es para el desplegador.
- **Ramas**:
  - salen de `main` como `feat/<CÓDIGO>-<slug>`, `fix/…` o `chore/…`;
  - hay un commit por cada cambio coherente;
  - nunca hay push directo ni force-push a `main`;
  - el push y el PR van siempre con el OK del usuario.
- **CI** (`.github/workflows/calidad.yml`): la puerta automática y el build de debug en cada PR.

## Distribución

Ver [`docs/DISTRIBUCION.md`](docs/DISTRIBUCION.md).

- El workflow **«Android · APK a testers»** (`.github/workflows/android-distribuir.yml`) se lanza a mano o con un tag `vX.Y.Z`. Compila el APK y el AAB de release firmados con la keystore real y los reparte por **Firebase App Distribution**.
- La versión está en `package.json`. El CI pasa `versionCode` y `versionName` a Gradle con `-PversionCodeOverride` y `-PversionNameOverride`.
- La keystore de release **nunca** va en el repo. En CI llega por secrets y en local por `android/keystore.properties`. Sin ella, el release local se firma con la de debug y el del CI falla.
- `node scripts/build-apk.mjs` es el respaldo local. En Windows compila desde una unidad `subst` temporal, porque el `ninja` de CMake no soporta rutas de más de 260 caracteres. Por eso `metro.config.js` vigila también la ruta real.
- `react-native-config` lee `.env` (copiar de `.env.example`). Toda variable nueva va en `.env.example`. Nada secreto, porque termina dentro del APK.

## Contexto

- **Backend**: la API PHP de Leap, en `../app/api/`. Para el dominio (ciclos, tokens, `class_sessions.status`) hay que leer `../app/CLAUDE.md`. La app no duplica la lógica de negocio, solo la consume.
- **Contrato y alcance**: `../docs/propuestas/02-propuesta-app-movil.md`, fases F1 a F4. Dice Expo, pero se decidió React Native CLI puro. Ver la nota en `docs/ARQUITECTURA.md`.
- **Seguimiento**: el tablero «App móvil · Inglés con Sebas» de APL-Tareas (#4 en https://tareas.demojd.online), por el MCP `apl-tareas`.
- **Repo**: `origin` = https://github.com/jeisondpl/APL-inglesconsebas-app.git, rama `main`.
- **Compilar**:
  - `npm run build:android:debug` en cualquier sistema;
  - `npm run android` en un emulador o dispositivo;
  - iOS solo en macOS o en CI.
- Todo en español: código, comentarios e interfaz. Los identificadores siguen la sección 6 de la guía.
