# Inglés con Sebas · app móvil

App móvil de la academia *Inglés con Sebas* para estudiantes, profes y admin. React Native CLI 0.88.1 en modo bare (sin Expo), TypeScript estricto, identificador `com.inglesconsebas.app`.

- Arquitectura, capas y convenciones: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
- Cómo se construye y se aprueba cada feature: [`docs/CALIDAD.md`](docs/CALIDAD.md).
- Builds, firma y reparto a testers: [`docs/DISTRIBUCION.md`](docs/DISTRIBUCION.md).

## Puesta en marcha

Requisitos: Node ≥ 22.11, JDK y Android SDK (ver la guía [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)). iOS necesita macOS con Xcode y CocoaPods.

```sh
npm install
cp .env.example .env        # API_URL y APP_ENV; sin secretos, terminan dentro del APK
npm start                   # Metro
npm run android             # emulador o dispositivo Android
```

En iOS, la primera vez y tras cada dependencia nativa nueva: `bundle install` y `bundle exec pod install` dentro de `ios/`; luego `npm run ios`.

Comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm run calidad` | `tsc`, ESLint (regla de capas), Prettier y Jest con cobertura |
| `npm test` | Solo Jest |
| `npm run build:android:debug` | APK de debug con Gradle |
| `node scripts/build-apk.mjs` | APK local de respaldo (ver `docs/DISTRIBUCION.md`) |
| `python scripts/extraer-logo-kit.py` | Extrae el logo y el isotipo de los PDF del kit a `assets/marca/logo.json` (solo si cambia el kit) |
| `npm run marca:logo` · `marca:iconos` · `marca:splash` | Regeneran los SVG del logo, el ícono y el splash desde `assets/marca/logo.json` (ver «Sistema de diseño y marca») |

## Estructura base (F1-01)

```
index.js                      # AppRegistry → src/app/App
jest.setup.ts                 # mocks globales: react-native-config, safe-area-context, toast-message, bootsplash, keychain
src/
├── app/                      # composición: solo aquí se conecta todo
│   ├── App.tsx               # Providers + navegación raíz
│   ├── di/                   # contenedor: crearDependencias, DependenciasProvider, useRepository, useNative, useSesionActiva
│   ├── providers/            # SafeArea, tema, dependencias, LimiteDeErrores y host de toasts
│   ├── navigation/           # NavegadorRaiz: flujos Auth y App según la sesión, rutaInicioPorRol
│   ├── inicio/               # InicioProvisionalScreen de los tres roles (temporal)
│   └── escaparate/           # SistemaDisenoScreen: escaparate del sistema de diseño (F1-01b)
├── native/
│   ├── ports/                # SplashPort, SecureStoragePort, EnlacesPort
│   └── adapters/             # BootSplash, KeychainSecureStorage (react-native-keychain), LinkingEnlaces
├── modules/
│   └── sesion/               # login, sesión persistente y cierre de sesión (F1-03)
└── shared/
    ├── lib/                  # HttpResponse, api (cliente HTTP), entorno, notify, utils, textos
    ├── theme/                # paleta, temas claro/oscuro, tipografía, TemaProvider, useEstilos
    └── components/           # Texto, Boton, Campo, Tarjeta, Pantalla, LogoMarca, Marca, HostNotificaciones…
```

- **Alias `@/` → `src/`.** Está en `tsconfig.json` (`paths`, sin `baseUrl`), `babel.config.js` (`babel-plugin-module-resolver`, para Metro) y `jest.config.js` (`moduleNameMapper`). ESLint lo resuelve con `eslint-import-resolver-typescript`, así que `eslint-plugin-boundaries` sigue aplicando la regla de capas a los imports con alias. Si se cambia el alias, hay que tocar los tres archivos.
- **Cliente HTTP** (`src/shared/lib/api.ts`). `crearClienteApi` habla con la API de Leap (solo GET y POST, rutas `?endpoint=&action=`), añade `Authorization: Bearer` si `obtenerToken` devuelve un token, llama a `alNoAutorizado` ante un 401 y **nunca lanza**: todo sale como `HttpResponse`. Los fallos de red y el tiempo agotado (15 s) devuelven `code: 0`. El contenedor (`src/app/di/contenedor.ts`) le pasa el token de `sesionActiva` y, ante un 401 con sesión, la invalida (F1-03).
- **Entorno** (`src/shared/lib/entorno.ts`). `leerEntorno(config)` valida `API_URL` y `APP_ENV` (`dev`, `staging` o `prod`) y la constante `entorno` lo lee de `react-native-config`.
- **Toasts**: siempre con `notify` (`success`, `error`, `warning`, `info`, `fromError`). Por debajo está `react-native-toast-message`; su host es `HostNotificaciones` (`src/shared/components`), con los colores del tema, dentro de `Providers`.
- **Navegación**: `@react-navigation/native-stack` sobre `react-native-screens`, con `temaNavegacion(tema)` construido desde los tokens.

### Pantalla de inicio provisional

`src/app/inicio/InicioProvisionalScreen.tsx` es el inicio de los tres roles (`InicioEstudiante`, `InicioProfe` e `InicioAdmin`) hasta que llegue el inicio real (ítem 1.17). Saluda por el nombre, muestra el rol, la versión (`package.json`), el entorno (`APP_ENV` y el host de `API_URL`) y el botón «Cerrar sesión». «Ver sistema de diseño» solo aparece en desarrollo (`__DEV__`).

## Sistema de diseño y marca (F1-01b)

Kit de marca **oficial** de Sebastián (2026-11-10), guardado en `assets/marca/kit/`: manual de marca (PDF de 11 páginas), los PDF vectoriales del logo y los PNG de referencia. Todo lo visual sale de una sola fuente y se regenera con los scripts. Sebastián va migrando la marca a «Leap»: si cambia, se reemplaza el kit y se regenera.

- **Tokens** (`src/shared/theme`): `paleta` con los cuatro colores oficiales (blanco #FFFFFF, negro #000000, verde #86EF86 y gris #A5AFA5, manual p. 7), el gris del logo sobre blanco (#62696B, p. 4) y los derivados que el kit no define (verde para fondo claro, estados), y `temaOscuro`/`temaClaro` con las mismas claves semánticas (`fondo`, `superficie`, `texto`, `marca`, `peligro`…). Las pantallas usan `useTema()` y `useEstilos(fabrica)`, nunca hex sueltos. `TemaProvider` sigue al sistema (`PREFERENCIA_TEMA_POR_DEFECTO = 'sistema'`; sin dato, oscuro). La preferencia aún no se guarda (ítem 1.14).
- **Componentes** (`src/shared/components`): `Texto`, `Boton`, `Campo`, `Tarjeta`, `Pantalla`, `Insignia`, `Cargando`, `AvisoEnLinea`, `LogoMarca`, `Marca` y `HostNotificaciones`. El escaparate (`src/app/escaparate`) los muestra todos.
- **Fuentes** (`assets/fuentes`; licencias en `assets/licencias`): **Nohemi Medium** en títulos y botones (tipografía complementaria del kit; Thin y ExtraLight no se usan por legibilidad) y DM Sans Regular, Medium y SemiBold (OFL) en el cuerpo. La licencia de Nohemi no venía en el kit: se copió de la tabla «name» del propio archivo (freeware de Rajesh Rajput, uso personal y comercial, sin modificar los archivos). **Regla de nombres**: el archivo se llama exactamente como el nombre PostScript de la fuente (`Nohemi-Medium.otf` → `fontFamily: 'Nohemi-Medium'`), porque Android busca por archivo e iOS por PostScript. No se usa `fontWeight`. Una fuente nueva se copia ahí y se enlaza con `npx react-native-asset`.
- **Logo**: `assets/marca/logo.json` es la única fuente de verdad del logo en pantalla, del ícono y del splash. Contiene, como trazados vectoriales sacados de los PDF del kit, el **logo principal** (mano «OK» + «Inglés con sebas»; componente `Marca`, claro sobre negro y gris sobre blanco según el tema) y el **isotipo** (la mano en el círculo con la «S»; componente `LogoMarca`, categorías Corporate, Self y Kids). La «l» de «Inglés» y la «S» del isotipo son texto en el PDF y se convierten a trazado: no hay `<text>`.

### Regenerar logo, ícono y splash

En este orden, y después revisar el diff y compilar:

```sh
python scripts/extraer-logo-kit.py   # solo si cambia el kit: PDF de assets/marca/kit → logo.json (PyMuPDF)
npm run marca:logo     # SVG de referencia: logo-oscuro, logo-claro e isotipo-corporate/self/kids
npm run marca:iconos   # isotipo: mipmap-* (legacy, adaptativo y monocromo), AppIcon de iOS e icono-play-512.png
npm run marca:splash   # logo principal: splash claro (gris sobre blanco) y oscuro (claro sobre negro)
```

Todos son idempotentes: si nada cambió, no escriben y `git status` queda limpio. El splash no usa el CLI de react-native-bootsplash (su modo oscuro es de pago): lo genera `scripts/generar-splash.mjs` con los nombres que la librería espera en ejecución.

**Salida generada, no editar a mano** (el CI no ejecuta los scripts, por eso se versiona):
- `assets/marca/logo.json`, `logo-*.svg`, `isotipo-*.svg` e `icono-play-512.png`;
- Android: `res/mipmap-*/ic_launcher*.png`, `res/mipmap-anydpi-v26/`, `res/values/ic_launcher_background.xml`, `res/drawable-*/bootsplash_logo.png`, `res/drawable-night-*/bootsplash_logo.png`, `res/values/colors.xml` y `res/values-night/colors.xml`;
- iOS: `Images.xcassets/AppIcon.appiconset/`, `Images.xcassets/BootSplashLogo.imageset/`, `Colors.xcassets/` y `BootSplash.storyboard`.

## Sesión (F1-03)

Login con usuario y PIN de 4 dígitos en dos pasos, sesión persistente y cierre de sesión, contra `auth.php` de Leap con la sesión por token de **F1-02**. Hasta que F1-02 esté desplegada, **solo funciona contra el Docker local**: el `auth.php` de producción responde sin token y la App muestra «El servidor todavía no admite la sesión de la App».

- El token se guarda con `SecureStoragePort` (Keychain en iOS, Keystore en Android) en la clave `sesion`. El PIN nunca se guarda.
- Al arrancar, la sesión guardada y vigente entra sin PIN (también sin red); en segundo plano se valida con `me` y, si toca, se renueva con `renew`. Un 401 la borra y vuelve al login con el aviso «Tu sesión venció».
- «Cerrar sesión» avisa al servidor (`logout`, espera como mucho 3 s) y borra la sesión, también sin red.

Usuarios de prueba del Docker (`../docker/db/02-seed.sql`): `yggodguz`/`2905` (admin), `meli`/`1111` y `caro`/`2222` (profes), y `ana`, `luis` y `sofia` con `1234` (estudiantes).

### Probar en un teléfono por USB

1. Levantar Leap en `../`: `docker compose up -d --build`. El árbol de `../app` debe estar en la rama `feat/F1-02-seguridad-api` (o en `main` cuando F1-02 se fusione). Comprobación: `curl -X POST localhost:8080/api/auth.php -d '{"username":"ana","pin":"1234","client":"app"}'` devuelve `token`.
2. Conectar el teléfono con la depuración USB activada y ejecutar `adb devices` y luego `adb reverse tcp:8080 tcp:8080`. El `reverse` se repite cada vez que se reconecta el cable.
3. Crear `.env.dispositivo` (lo ignora `.env.*` en `.gitignore`) con `API_URL=http://localhost:8080/api` y `APP_ENV=dev`.
4. Compilar con ese archivo:
   - PowerShell: `$env:ENVFILE='.env.dispositivo'; npm run android`;
   - Git Bash: `ENVFILE=.env.dispositivo npm run android`.

   `react-native-config` lo incrusta en el build: cambiar de archivo exige recompilar el nativo. HTTP en claro solo se permite en debug.
5. El emulador sigue con `.env` (`10.0.2.2`). Con `adb reverse`, `localhost` también funciona en el emulador.
6. Detrás de `adb reverse` todas las pruebas comparten IP y, por tanto, el límite de 30 fallos por IP en 15 min. Para desbloquear, en Adminer (:8081): `DELETE FROM auth_login_attempts;`.
7. Para revocar una sesión y ver el aviso de sesión vencida: `UPDATE auth_sessions SET revoked_at=NOW() WHERE client='app';` y reabrir la app.

## Dependencias nativas

| Paquete | Por qué | Pasos manuales |
|---|---|---|
| `react-native-config` | Variables de `.env` | Recompilar tras cambiar `.env` |
| `react-native-safe-area-context` | Insets (edge-to-edge obligatorio con targetSdk 36) | Ninguno (autolinking) |
| `react-native-screens` | Pantallas nativas de native-stack | Android: `RNScreensFragmentFactory` en `MainActivity.kt` (hecho). iOS: `pod install` |
| `react-native-bootsplash` 7.3.5 (MIT) | Splash nativo; se oculta en el `onReady` de la navegación vía `SplashPort` | Android: `BootTheme` en `styles.xml`, la Activity con `@style/BootTheme` y `RNBootSplash.init` en `MainActivity.kt` (hecho). iOS: `customize` en `SceneDelegate.swift` y `UILaunchStoryboardName=BootSplash` (hecho, sin compilar); `pod install` |
| `react-native-svg` 15.16.1 | `LogoMarca` | iOS: `pod install` |
| `react-native-keychain` 11.0.0 (MIT) | Guarda el token de sesión en Keychain (iOS) y Android Keystore detrás de `SecureStoragePort`. Sin permisos | Android: ninguno (autolinking; `allowBackup="false"` ya está). iOS: `pod install` (pendiente sin Mac). En iOS el Keychain sobrevive a la desinstalación |

Dependencias de desarrollo de los scripts de marca: `sharp` (rasterizar) y `react-native-asset` (enlazar fuentes). La extracción del kit usa Python con PyMuPDF (`pip install pymupdf`), solo en local.
