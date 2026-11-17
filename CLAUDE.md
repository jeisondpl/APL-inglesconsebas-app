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

## Base técnica (F1-01)

- **Alias `@/` → `src/`**, definido en tres sitios que deben coincidir: `tsconfig.json` (`paths`), `babel.config.js` (`module-resolver`) y `jest.config.js` (`moduleNameMapper`). ESLint lo resuelve con `eslint-import-resolver-typescript`, así que la regla de capas también vigila los imports con alias.
- **Composición en `src/app/`**:
  - `App.tsx`: `Providers` + `NavegadorRaiz`;
  - `di/`: `crearDependencias()` es el único sitio donde se instancian el cliente HTTP, los repositorios y los adaptadores. Un módulo nuevo añade su puerto a `IRepositorios`; un SDK nuevo, el suyo a `INativos`. Se consumen con `useRepository` y `useNative`. En los tests, `DependenciasProvider valor={…}` (o `Providers dependencias={…}`) sustituye el contenedor;
  - `providers/`: SafeArea, `TemaProvider`, dependencias y `LimiteDeErrores`, con `HostNotificaciones` como hermano dentro del tema;
  - `navigation/`: native-stack con `temaNavegacion(tema)` desde los tokens y `RaizParamList` tipado globalmente; `onReady` oculta el splash;
  - `inicio/InicioProvisionalScreen.tsx`: inicio **provisional** de profe y admin (saludo, rol, versión, entorno y «Cerrar sesión»). El estudiante ya tiene el suyo (F1-05).
- **`src/shared/lib/`**: `HttpResponse`, `api.ts` (`crearClienteApi`, nunca lanza), `entorno.ts` (`leerEntorno` puro + `entorno`), `notify.ts` (única puerta a los toasts), `utils.ts` y `textos.ts`.
- **Tests**: `jest.setup.ts` mockea `react-native-config` (`API_URL` local y `APP_ENV=dev`), `react-native-safe-area-context`, `react-native-toast-message` (`Toast.show`/`hide` son `jest.fn`) y `react-native-bootsplash` (`hide` resuelve). `react-native-svg` se renderiza sin mock. Lo que use `useTema` se monta dentro de `TemaProvider` (o de `Providers`). `transformIgnorePatterns` incluye `react-native-*` y `@react-navigation`.
- **Pasos nativos hechos**: `MainActivity.kt` asigna `RNScreensFragmentFactory` antes de `super.onCreate` (react-native-screens). **Pendiente sin Mac**: `pod install` para `react-native-screens` y `react-native-safe-area-context` (y los de F1-01b), y versionar `Podfile.lock`.

## Sistema de diseño y marca (F1-01b)

- **Skill `ingles-con-sebas-brand`** (`.claude/skills/ingles-con-sebas-brand/`, 2026-11-17): reglas operativas de la marca (qué es oficial y qué derivado, conflictos del kit, tokens, logo, componentes, patrones móviles) y scripts `auditar-marca.mjs`, `contraste.mjs` y `generar-tokens.mjs`. Úsala para cualquier pantalla, componente o revisión visual.
- **Kit de marca oficial** de Sebastián (2026-11-10) en `assets/marca/kit/` (manual, PDF vectoriales y PNG). Sustituye a la exploración «Dirección A». Paleta oficial: #FFFFFF, #000000, #86EF86 y #A5AFA5; títulos en Nohemi Medium y cuerpo en DM Sans.
- **Tokens** en `src/shared/theme`: `temaOscuro`/`temaClaro` con las mismas claves semánticas; se consumen con `useTema()` y `useEstilos(fabrica)` (fábrica declarada fuera del componente). No se escriben hex en pantallas. `PREFERENCIA_TEMA_POR_DEFECTO = 'sistema'` (sin dato del sistema, oscuro); guardar la preferencia es el ítem 1.14.
- **Componentes** en `src/shared/components`. Solo `HostNotificaciones` y `notify.ts` importan `react-native-toast-message`. Escaparate en `src/app/escaparate`, abierto desde el inicio provisional (con la sesión, solo en `__DEV__`).
- **Fuentes** en `assets/fuentes` (licencias en `assets/licencias` para que `react-native-asset` no las copie; la de Nohemi está copiada del propio archivo porque el kit no la trae): el archivo se llama como su nombre PostScript y `fontFamily` usa ese nombre; nunca `fontWeight`. Se enlazan con `npx react-native-asset` (`react-native.config.js`).
- **Logo, ícono y splash** salen de `assets/marca/logo.json`, que extrae `python scripts/extraer-logo-kit.py` (PyMuPDF) de los PDF del kit: logo principal (`Marca`) e isotipo (`LogoMarca`). Luego `npm run marca:logo` → `marca:iconos` (isotipo) → `marca:splash` (logo principal), todos idempotentes. Su salida se versiona y no se edita a mano (lista en el README).
- **Splash**: `react-native-bootsplash` solo en ejecución (`BootTheme`, `RNBootSplash.init`, `initWithStoryboard`, `hide`). Los recursos claro y oscuro los genera `scripts/generar-splash.mjs`, no el CLI (su modo oscuro es de pago). Se oculta con `SplashPort` (`useNative('splash')`) en el `onReady` de la navegación.
- **Pasos nativos hechos**: Android `BootTheme`, la Activity con `@style/BootTheme` y `RNBootSplash.init` tras `RNScreensFragmentFactory`; iOS `SceneDelegate.customize`, `UILaunchStoryboardName=BootSplash`, `Colors.xcassets` y `BootSplash.storyboard` en el pbxproj y `UIAppFonts`. **Pendiente sin Mac**: `pod install` (bootsplash y svg), compilar iOS y versionar `Podfile.lock`.

## Sesión (F1-03)

- **Módulo `src/modules/sesion`**: login en dos pasos (usuario y teclado de PIN 3×4, envío al 4.º dígito), sesión persistente y cierre de sesión contra `auth.php`. Usa la rama F1-02 del backend. En producción todavía no existe, y el login da el error «El servidor todavía no admite la sesión de la App».
- **`sesionActiva`** (`IDependencias.sesionActiva`, hook `useSesionActiva`) es el estado en memoria: `restaurando` → `sinSesion` (motivo `cerrada` o `vencida`) o `autenticado`. El cliente HTTP lee de ahí el token. Su `alNoAutorizado` llama a `invalidarSesionUseCase`, que solo actúa con sesión: el 401 del login no la toca.
- **Almacén**: `SecureStoragePort` (`useNative('almacenSeguro')`) con `react-native-keychain` 11.0.0 y el servicio `com.inglesconsebas.app.<clave>`. La sesión va en la clave `sesion` como JSON `{version:1, token, expiraEn, renovarDesde, usuario}`. Nunca se usa AsyncStorage ni se guarda el PIN. `EnlacesPort` (`useNative('enlaces')`) abre WhatsApp con `Linking`.
- **Arranque**: `useArranqueSesion()` en `NavegadorRaiz` ejecuta `arrancarSesionUseCase` una vez: restaurar → publicar → `me` → `renew` si toca. Con `restaurando`, el navegador devuelve `null` y el splash sigue. Los flujos se eligen por estado, sin `navigate` imperativo:
  - Auth, con `rutaInicialAuth()` (desde EXT-01, a través de `rutaInicialRaiz`);
  - App, con `rutaInicioPorRol(rol)`.
- **Tests**: `crearDependenciasDePrueba()` (`src/app/di/dependenciasDePrueba.ts`) da un contenedor sin red ni nativos: `crearMemoriaSesionRepository` (usuarios del seed; `tokenMemoria('ana')` sirve para sesiones guardadas), un almacén en memoria y splash y enlaces falsos. `jest.setup.ts` mockea `react-native-keychain` con un `Map`.
- **Fuera de alcance** (F1-03b): biometría (1.13), perfil, cambio de PIN y guardar el tema (1.14), sin conexión (1.15), abrir en la web (1.16) y validar al volver a primer plano.
- **Probar en el teléfono por USB**: `.env.dispositivo` + `adb reverse tcp:8080 tcp:8080` (pasos en el README). **Pendiente sin Mac**: `pod install` de `react-native-keychain`.

## Animaciones (F1-04)

- **Reanimated 4**: `react-native-reanimated` 4.7.1 y `react-native-worklets` 0.13.1 (versión exacta,
  compatibles con RN 0.86–0.88). `react-native-worklets/plugin` es el último plugin de
  `babel.config.js`: tras cambiar Babel, Metro se reinicia con `--reset-cache`.
- **Tests**: `jest.setup.ts` usa los mocks oficiales de reanimated y worklets. Las animaciones
  resuelven al instante y `Animated.View` es un `View`; `useReducedMotion` devuelve `false` (se
  espía para probar reduce-motion).
- **Pendiente sin Mac**: `pod install` de reanimated y worklets.

## Onboarding (EXT-01)

- **Módulo `src/modules/onboarding`**: bienvenida de 4 páginas (O1–O4) la primera vez que se abre la app sin sesión. `FlatList` horizontal paginado; «Siguiente», «Omitir» (en todas), «Comenzar» (O4) y atrás de Android (página anterior en O2–O4). Textos en `onboarding.textos.ts` e ilustraciones SVG con tokens del tema en el arreglo `PAGINAS_ONBOARDING` (`onboarding.config.ts`). Sin hex en el módulo.
- **Bandera**: `hasSeenOnboarding = '1'` en el `SecureStoragePort` (servicio `com.inglesconsebas.app.hasSeenOnboarding`). Sin dependencias nuevas y nunca el almacén no cifrado (lo vigila `sesion.seguridad.test.ts`, que prohíbe hasta la palabra en `src/`). En iOS el Keychain sobrevive a reinstalar (R1, aceptado).
- **Estado en memoria**: `banderaOnboarding` (`IDependencias.banderaOnboarding`, hook `useBanderaOnboarding`): `cargando` → `pendiente` o `visto`. Terminar u omitir la pone en `visto` antes de guardar; si guardar falla se avanza igual y en el siguiente arranque vuelve a salir.
- **Arranque**: `NavegadorRaiz` lee la sesión y la bandera en paralelo (`useArranqueSesion` y `useArranqueOnboarding`) y devuelve `null` hasta tener las dos, así que el splash sigue. `rutaInicialRaiz` elige: inicio del rol si hay sesión; `Onboarding` si la bandera está pendiente; si no, `rutaInicialAuth()`. Con sesión y sin bandera, la bandera se marca para que cerrar sesión lleve al login. Al terminar la bienvenida su grupo desaparece y queda `Login` como única ruta (sin regreso).
- **Tests**: `crearDependenciasDePrueba()` arranca la bandera en `visto` (los tests de F1-03 siguen yendo al login). Para ejercer la lectura real, pasa `onboardingInicial: { tipo: 'cargando' }`. Un contenedor armado a mano debe incluir `banderaOnboarding`.

## Inicio del estudiante y pestañas (F1-05)

- **Pestañas**: con sesión de estudiante, la ruta `InicioEstudiante` monta `PestanasEstudiante`
  (`src/app/navigation`): patrón `MainTabs` de Livic (estado de la pestaña activa + contexto
  `usePestanas().irAPestana`), sin `@react-navigation/bottom-tabs`. Profe y admin siguen en
  `InicioProvisionalScreen` (mismo nombre de ruta). Clases, Mensajes y Tareas son
  `PantallaProximamente` (`src/app/pestanas`).
- **`BarraPestanas`**: copia fiel de `LivicTabBar` con tokens (barra `superficie` + `borde`, círculo
  `marca` + ícono `sobreMarca`, inactivos `textoSecundario`). Se oculta con el teclado y con el
  scroll: las pantallas usan `useOcultarBarraAlDesplazar()` en un `Animated.ScrollView` y reservan
  `ESPACIO_BARRA_PESTANAS` abajo (`src/shared/movimiento/barraPestanas.tsx`, proveedor
  `ProveedorBarraPestanas`). Íconos de trazo 1.75 en `src/shared/iconos`.
- **Módulo `src/modules/inicio`**: lecturas que el estudiante puede hacer con su token (tabla
  sección → endpoint en `docs/features/F1-05-inicio-estudiante/plan.md`): `auth.php?action=me`,
  `class_sessions`, `schedule`, `tasks` y `chispa` (`get_unread`, `get_thread`). Cada sección es
  independiente: si una falla, solo esa muestra «Reintentar». Lo que no hay se dice («Aún no…»).
- **`inicio.reglas.ts`** es un espejo de `PLAN_RULES` de la web (mínimo por plan y nombre): otra
  constante duplicada a mano. Antelación de cancelación: 24 h en Flex, 12 h en el resto.
- La pantalla del módulo no importa `sesion`: `PestanasEstudiante` le pasa el usuario,
  `alCerrarSesion` y `alVerSistemaDiseno` (solo `__DEV__`). Se abren desde la hoja del avatar.
- **Token `velo`** (negro, con `OPACIDAD_VELO` 0.6) para hojas inferiores.
- **Tests**: `crearDependenciasDePrueba()` registra `crearMemoriaInicioRepository()` (vacío); pasa
  `inicio` para dar datos. Un contenedor armado a mano debe incluir `repositorios.inicio`. Al
  serializar el árbol con `JSON.stringify`, omite la prop `refreshControl` (es circular).

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
