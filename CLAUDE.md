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
   - con el veredicto APROBADO, verifica la rama (puerta y APK de debug);
   - con el OK del usuario, abre el PR, espera el CI, fusiona en `develop` desde GitHub (nunca en local) y actualiza el tablero;
   - solo con el OK del usuario hace push, abre el PR o distribuye.

Hay un máximo de 2 vueltas de corrección por feature. Después se consulta al usuario.

## Puerta automática y git

- **`npm run calidad`**: `tsc`, ESLint (con **eslint-plugin-boundaries**, que hace fallar el lint si se rompe la regla de capas), Prettier y Jest con cobertura. Los umbrales son 90 % en `domain` y `aplications` de cada módulo y 70 % global. Se calculan por carpeta en `jest.config.js`.
- **Ganchos** (husky):
  - `pre-commit`: lint-staged (Prettier y ESLint de lo que se commitea);
  - `commit-msg`: commitlint, con Conventional Commits en español. El cuerpo admite como máximo 100 caracteres por línea. El tipo `merge` es para el desplegador.
- **Ramas**:
  - salen de `develop` como `feat/<CÓDIGO>-<slug>`, `fix/…` o `chore/…`;
  - hay un commit por cada cambio coherente;
  - nunca hay push directo ni force-push a `main` ni a `develop`; `main` (producción) solo recibe `develop` en cada entrega de fase, con el acta de Sebastián;
  - el push y el PR van siempre con el OK del usuario.
- **CI** (`.github/workflows/calidad.yml`): la puerta automática y el build de debug en cada PR.

## Distribución

Ver [`docs/DISTRIBUCION.md`](docs/DISTRIBUCION.md).

- El workflow **«Android · APK a testers»** (`.github/workflows/android-distribuir.yml`) se lanza a mano o con un tag `vX.Y.Z`. Compila el APK y el AAB de release firmados con la keystore real y los reparte por **Firebase App Distribution**.
- La versión está en `package.json`. El CI pasa `versionCode` y `versionName` a Gradle con `-PversionCodeOverride` y `-PversionNameOverride`.
- La keystore de release **nunca** va en el repo. En CI llega por secrets y en local por `android/keystore.properties`. Sin ella, el release local se firma con la de debug y el del CI falla.
- `node scripts/build-apk.mjs` es el respaldo local. En Windows compila desde una unidad `subst` temporal, porque el `ninja` de CMake no soporta rutas de más de 260 caracteres. Por eso `metro.config.js` vigila también la ruta real.
- `react-native-config` lee `.env` (copiar de `.env.example`). Toda variable nueva va en `.env.example`. Nada secreto, porque termina dentro del APK.

## Base técnica (F1-01)

- **Alias `@/` → `src/`**, definido en tres sitios que deben coincidir: `tsconfig.json` (`paths`), `babel.config.js` (`module-resolver`) y `jest.config.js` (`moduleNameMapper`). ESLint lo resuelve con `eslint-import-resolver-typescript`, así que la regla de capas también vigila los imports con alias.
- **Composición en `src/app/`**:
  - `App.tsx`: `Providers` + `NavegadorRaiz` + el host `Toast` al final;
  - `di/`: `crearDependencias()` es el único sitio donde se instancian el cliente HTTP, los repositorios y los adaptadores. Un módulo nuevo añade su puerto a `IRepositorios`; un SDK nuevo, el suyo a `INativos`. Se consumen con `useRepository` y `useNative`. En los tests, `DependenciasProvider valor={…}` (o `Providers dependencias={…}`) sustituye el contenedor;
  - `providers/`: SafeArea, dependencias y `LimiteDeErrores`;
  - `navigation/`: native-stack con `DefaultTheme`/`DarkTheme` según el sistema y `RaizParamList` tipado globalmente;
  - `inicio/InicioProvisionalScreen.tsx`: ruta inicial **provisional** (nombre, versión y entorno). La sustituye la feature de sesión.
- **`src/shared/lib/`**: `HttpResponse`, `api.ts` (`crearClienteApi`, nunca lanza), `entorno.ts` (`leerEntorno` puro + `entorno`), `notify.ts` (única puerta a los toasts), `utils.ts` y `textos.ts`.
- **Sesión pendiente**: el cliente HTTP sale del contenedor con `obtenerToken = () => null` y un `alNoAutorizado` vacío. La feature de sesión solo cambia esas dos funciones.
- **Tema, componentes, fuentes, splash e ícono** esperan al manual de marca. No se inventan colores ni tipografías de marca.
- **Tests**: `jest.setup.ts` mockea `react-native-config` (`API_URL` local y `APP_ENV=dev`), `react-native-safe-area-context` y `react-native-toast-message` (`Toast.show`/`hide` son `jest.fn`). `transformIgnorePatterns` incluye `react-native-*` y `@react-navigation`.
- **Pasos nativos hechos**: `MainActivity.kt` asigna `RNScreensFragmentFactory` antes de `super.onCreate` (react-native-screens). **Pendiente sin Mac**: `pod install` para `react-native-screens` y `react-native-safe-area-context`, y versionar `Podfile.lock`.

## Contexto

- **Backend**: la API PHP de Leap, en `../app/api/`. Para el dominio (ciclos, tokens, `class_sessions.status`) hay que leer `../app/CLAUDE.md`. La app no duplica la lógica de negocio, solo la consume.
- **Contrato y alcance**: `../docs/propuestas/02-propuesta-app-movil.md`, fases F1 a F4. Dice Expo, pero se decidió React Native CLI puro. Ver la nota en `docs/ARQUITECTURA.md`.
- **Seguimiento**: el tablero «App móvil · Inglés con Sebas» de APL-Tareas (#4 en https://tareas.demojd.online), por el MCP `apl-tareas`.
- **Repo**: `origin` = https://github.com/jeisondpl/APL-inglesconsebas-app.git. Ramas: `develop` (desarrollo, base de las features) y `main` (producción).
- **Compilar**:
  - `npm run build:android:debug` en cualquier sistema;
  - `npm run android` en un emulador o dispositivo;
  - iOS solo en macOS o en CI.
- Todo en español: código, comentarios e interfaz. Los identificadores siguen la sección 6 de la guía.
