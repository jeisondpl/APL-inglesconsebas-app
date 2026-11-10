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

## Estructura base (F1-01)

```
index.js                      # AppRegistry → src/app/App
jest.setup.ts                 # mocks globales: react-native-config, safe-area-context, toast-message
src/
├── app/                      # composición: solo aquí se conecta todo
│   ├── App.tsx               # Providers + navegación raíz + host de toasts
│   ├── di/                   # contenedor: crearDependencias, DependenciasProvider, useRepository, useNative
│   ├── providers/            # SafeArea, dependencias y LimiteDeErrores
│   ├── navigation/           # NavegadorRaiz (native-stack), RaizParamList, tema de navegación
│   └── inicio/               # InicioProvisionalScreen (temporal)
└── shared/
    └── lib/                  # HttpResponse, api (cliente HTTP), entorno, notify, utils, textos
```

- **Alias `@/` → `src/`.** Está en `tsconfig.json` (`paths`, sin `baseUrl`), `babel.config.js` (`babel-plugin-module-resolver`, para Metro) y `jest.config.js` (`moduleNameMapper`). ESLint lo resuelve con `eslint-import-resolver-typescript`, así que `eslint-plugin-boundaries` sigue aplicando la regla de capas a los imports con alias. Si se cambia el alias, hay que tocar los tres archivos.
- **Cliente HTTP** (`src/shared/lib/api.ts`). `crearClienteApi` habla con la API de Leap (solo GET y POST, rutas `?endpoint=&action=`), añade `Authorization: Bearer` si `obtenerToken` devuelve un token, llama a `alNoAutorizado` ante un 401 y **nunca lanza**: todo sale como `HttpResponse`. Los fallos de red y el tiempo agotado (15 s) devuelven `code: 0`. El contenedor (`src/app/di/contenedor.ts`) lo crea sin sesión; la feature de sesión solo cambiará esas dos funciones.
- **Entorno** (`src/shared/lib/entorno.ts`). `leerEntorno(config)` valida `API_URL` y `APP_ENV` (`dev`, `staging` o `prod`) y la constante `entorno` lo lee de `react-native-config`.
- **Toasts**: siempre con `notify` (`success`, `error`, `warning`, `info`, `fromError`). Por debajo está `react-native-toast-message`; su host va al final de `App.tsx`, sin estilos de marca.
- **Navegación**: `@react-navigation/native-stack` sobre `react-native-screens`. Usa `DefaultTheme` o `DarkTheme` según el esquema del sistema hasta que exista el tema de marca.

### Pantalla de inicio provisional

`src/app/inicio/InicioProvisionalScreen.tsx` es la ruta inicial mientras no exista la feature de sesión. Con primitivas de React Native, muestra el nombre de la app (`app.json`), la versión (`package.json`) y el entorno (`APP_ENV` y el host de `API_URL`). Sirve para comprobar en un build de testers qué versión y qué servidor llevan. La sustituye la feature de sesión.

### Pendiente del sistema de diseño

El tema (tokens claro y oscuro), los componentes de `src/shared/components/`, las fuentes, el splash y el ícono **esperan al manual de marca** y van en una feature posterior. Hasta entonces no se usan colores ni tipografías de marca.

## Dependencias nativas

| Paquete | Por qué | Pasos manuales |
|---|---|---|
| `react-native-config` | Variables de `.env` | Recompilar tras cambiar `.env` |
| `react-native-safe-area-context` | Insets (edge-to-edge obligatorio con targetSdk 36) | Ninguno (autolinking) |
| `react-native-screens` | Pantallas nativas de native-stack | Android: `RNScreensFragmentFactory` en `MainActivity.kt` (hecho). iOS: `pod install` |
