# Plan · F1-01 · Proyecto base, sistema de diseño y marca

> Redactado por el agente **planificador** el 2026-11-09. Estado: **pendiente de aprobación del usuario.**
>
> **Definition of Ready: se cumple con salvedades.**
> - **El ítem 1.3 no se puede cerrar todavía.** Depende de las cuentas de Apple Developer y de Google Play de organización, que necesitan el D-U-N-S y son trámite del cliente (contrato, `build-contrato-app-movil.js:370`). La feature deja preparado el repo y una lista de pasos manuales (P1).
> - **El manual de marca aún no existe.** El brief tiene dos direcciones provisionales. No bloquea: el ítem 1.2 del contrato (`build-contrato-app-movil.js:543`) admite construir el sistema de diseño sobre la identidad visual vigente, que es la de Leap. Los tokens quedan aislados para cambiarlos cuando se apruebe el manual.

## 1. Resumen

Monta la base técnica y visual sobre la que se construirán todas las demás features. No tiene lógica de negocio, sirve a todos los roles y pertenece a la fase F1 · Base y núcleo.

| Ítem | Qué pide el contrato | Cómo se cubre |
|---|---|---|
| **1.1** | Proyecto Expo con EAS Build | Se usa React Native CLI 0.88.1 bare (ver `docs/ARQUITECTURA.md`). El proyecto ya existe, el CI corre en cada PR (`calidad.yml`) y la distribución está montada (`android-distribuir.yml`). Esta feature añade la estructura de `src/`. **iOS queda pendiente** hasta tener Mac o runner macOS (F4). |
| **1.2** | Sistema de diseño móvil | Tokens claro y oscuro tomados de Leap y de la Dirección A del brief, que coinciden. Tipografías Sora y DM Sans, como en Leap. Componentes base y una pantalla escaparate. |
| **1.3** | Configurar la app en Apple y Google | Los identificadores `com.inglesconsebas.app` ya están fijados y la firma Android está documentada. Se ajusta `Info.plist`, se fija la versión y se escribe la lista de pasos manuales. **Las cuentas son trámite del cliente.** |
| **1.10** | Splash e ícono con la marca | Splash nativo con `react-native-bootsplash`. Ícono adaptativo y legacy en Android, y AppIcon en iOS, generados por script a partir del isologo vigente de Leap. |

Fechas: inicio el 2026-11-09, compromiso el 2026-11-20.

## 2. Alcance

**Entra:**
- **Alias `@/`**: configurado en tsconfig y babel (`babel-plugin-module-resolver`), y resuelto en ESLint y Jest.
- **`src/app/`**:
  - `App.tsx`;
  - providers: SafeArea, tema, dependencias y límite de errores;
  - navegación raíz con React Navigation native-stack;
  - inyección de dependencias con `useRepository` y `useNative`.
- **`src/shared/lib/`**: `HttpResponse`, `api.ts` (Bearer opcional y gancho de 401), `entorno.ts`, `notify.ts`, `utils.ts` y `textos.ts`.
- **`src/shared/theme/`**:
  - tokens de color, tipografía, espaciado, radios y tamaño táctil;
  - temas claro y oscuro con las mismas claves;
  - `TemaProvider`, `useTema` y `useEstilos`;
  - comprobación de contraste WCAG.
- **`src/shared/components/`**: `Texto`, `Boton`, `Campo`, `Tarjeta`, `Pantalla`, `Insignia`, `Cargando`, `AvisoEnLinea` y `HostNotificaciones`.
- **Fuentes**: Sora SemiBold y Bold, DM Sans Regular y Medium, enlazadas en Android e iOS.
- **Splash**: `SplashPort` con el adaptador `BootSplashAdapter`. El splash nativo es el isologo verde sobre `#05070B` y se oculta con fundido en el `onReady` de la navegación.
- **Ícono**: lo genera `scripts/generar-iconos.mjs` con `sharp`, de forma reproducible.
- **Pantalla escaparate** del sistema de diseño (`src/app/escaparate/`), como ruta inicial provisional.
- **Limpieza de la plantilla**: se retiran `App.tsx` y `__tests__/App.test.tsx` de la raíz y la dependencia `@react-native/new-app-screen`.
- **Ajustes de tienda (1.3)**: `CFBundleDevelopmentRegion=es`, se quita el permiso de ubicación vacío, `MARKETING_VERSION=0.1.0` y la lista de pasos en `docs/DISTRIBUCION.md`.
- **Documentación**: README y `CLAUDE.md`.

**No entra:**
- Sesión: `SecureStoragePort`, keychain, módulo `sesion` y navegación Auth/App. Va en una feature posterior a F1-02. `api.ts` queda preparado mediante `obtenerToken` y `alNoAutorizado` inyectados.
- Guardar la preferencia de tema. Va en perfil (1.14).
- Animación del splash.
- Modal de confirmación destructiva. Va en F2.
- Flavors y schemes por entorno. Irán en un `chore` aparte.
- Cuentas, certificados, ficha de tienda, Play App Signing y TestFlight. Son del cliente y de F4.
- Build de iOS.
- Módulos de negocio.
- Cambios en `../app/`.

## 3. Criterios de aceptación

| CA | Criterio | Verificación |
|---|---|---|
| CA1 (1.1) | `npm run calidad` pasa en verde, con cobertura global ≥ 70 %. En el PR pasan los dos jobs de `calidad.yml`. | CI y ejecución local |
| CA2 (1.1) | El APK de debug arranca en un emulador Android sin pantalla roja ni en blanco y muestra el escaparate. | Manual, con captura en `pruebas.md` |
| CA3 | `@/` resuelve en `tsc`, Metro, Jest y ESLint. Un archivo temporal en `shared/` que importe `@/app/...` hace fallar `boundaries/dependencies`. | Puerta de calidad y paso manual |
| CA4 (1.2) | `temaClaro` y `temaOscuro` tienen las mismas claves. Los valores de marca coinciden con la tabla de § 4. | Test |
| CA5 (1.2) | Contraste ≥ 4.5:1 en `texto`/`fondo`, `texto`/`superficieSolida`, `textoSecundario`/`fondo`, `sobreMarca`/`marca`, `peligro`/`fondo` y `aviso`/`fondo`. Contraste ≥ 3:1 en `textoTenue`/`fondo`. En los dos temas. | Test con `relacionContraste()` |
| CA6 (1.2) | `TemaProvider` sigue el esquema del sistema, con oscuro si no hay dato. `establecerPreferencia` cambia el tema. | Test |
| CA7 (1.2) | Cada componente se renderiza en los dos temas y es accesible. **Boton**: role, label, state disabled y busy, alto ≥ 44, y no llama a `onPress` si está deshabilitado o cargando. **Campo**: etiqueta y error con `role=alert`. **Tarjeta** pulsable con role button. **Texto** con la familia y el tamaño de su variante. | Tests con RNTL |
| CA8 (1.2) | En Android, los títulos y botones salen en Sora y el cuerpo en DM Sans. | Captura manual. iOS queda pendiente |
| CA9 | `api.ts`: añade el Bearer si hay token y no lo añade si no hay. Ante un 401 llama a `alNoAutorizado` una vez. Mapea el `{error}` de Leap (`config.php:40`). Gestiona los fallos de red (code 0), el timeout, los cuerpos que no son JSON, los 2xx y los params en la query. **Nunca lanza.** | Tests con `fetch` falso |
| CA10 | `notify.*` llama a la librería de toasts con el tipo correcto. `fromError` saca un mensaje legible de un `HttpResponse`, un `Error` o un valor desconocido. El host usa los colores del tema. | Tests |
| CA11 | `useRepository` y `useNative` devuelven lo que está registrado, y dan un error descriptivo si falta la clave o el provider. Los tests pueden sustituir el contenedor con `valor`. | Tests |
| CA12 (1.10) | Arranque en frío en Android API 35 y API 30: aparece el splash (isologo sobre `#05070B`, sin destello blanco) y se oculta con fundido. `SplashPort.ocultar()` se llama exactamente una vez en `onReady`. | Manual y test con un puerto falso |
| CA13 (1.10) | El ícono es adaptativo en API ≥ 26 y legacy en API 24 y 25. `generar-iconos.mjs` es idempotente. Genera los 9 PNG de iOS más `Contents.json`, con el de 1024 px sin canal alfa. | Manual y salida del script |
| CA14 (1.3) | Los identificadores son `com.inglesconsebas.app`. `Info.plist` tiene `CFBundleDevelopmentRegion=es` y ningún permiso vacío. `MARKETING_VERSION=0.1.0`. Los pasos de tienda están en `docs/DISTRIBUCION.md`. | Grep y revisión |
| CA15 | El escaparate muestra la paleta, la tipografía, los botones en todos sus estados, un campo con error, tarjetas, insignias, el aviso, el indicador de carga, el selector de tema y un botón por cada tipo de `notify`. Los textos salen de `escaparate.textos.ts`. | Test y paso manual |
| CA16 | `LimiteDeErrores` muestra el fallback y «Reintentar» vuelve a montar la pantalla. `App` monta con todos los providers. | Tests |

## 4. Dominio, tipos compartidos y tokens

No se crea ningún módulo de negocio. Los tipos compartidos son estos:

```ts
// src/shared/lib/HttpResponse.ts
export interface HttpResponse<T> { error: boolean; response?: T; msg?: string; code?: number }
export const respuestaOk = <T>(response: T, code?: number): HttpResponse<T>;
export const respuestaError = <T = never>(msg: string, code?: number): HttpResponse<T>;

// src/shared/lib/api.ts — Leap solo acepta GET/POST (config.php:29) y enruta por ?endpoint=&action= (api.php:9,796)
export type ParametrosQuery = Record<string, string | number | boolean | undefined>;
export interface IOpcionesClienteApi {
  urlBase: string;
  obtenerToken?: () => Promise<string | null>;   // hasta el módulo sesion: () => Promise.resolve(null)
  alNoAutorizado?: () => void;                    // hasta el módulo sesion: no-op
  tiempoLimiteMs?: number;                        // 15000 por defecto
  fetchImpl?: typeof fetch;                       // inyectable en tests
}
export interface ClienteApi {
  get<T>(ruta: string, params?: ParametrosQuery): Promise<HttpResponse<T>>;
  post<T>(ruta: string, cuerpo?: unknown, params?: ParametrosQuery): Promise<HttpResponse<T>>;
}
export function crearClienteApi(opciones: IOpcionesClienteApi): ClienteApi;

// src/shared/lib/entorno.ts
export type EntornoApp = 'dev' | 'staging' | 'prod';
export interface IEntorno { apiUrl: string; appEnv: EntornoApp }
export function leerEntorno(config: Record<string, string | undefined>): IEntorno;
export const entorno: IEntorno;

// src/shared/lib/notify.ts
export const notify: { success; error; warning; info: (titulo: string, detalle?: string) => void;
                       fromError(err: unknown, titulo: string): void };

// src/shared/lib/utils.ts
export function construirQuery(params?: ParametrosQuery): string;
export function mensajeDeError(err: unknown, porDefecto: string): string;

// src/shared/theme
export type ModoTema = 'claro' | 'oscuro';
export type PreferenciaTema = ModoTema | 'sistema';
export interface IColoresTema { fondo; fondoElevado; superficie; superficieSolida; borde; bordeMarca; campoFondo;
  texto; textoSecundario; textoTenue; marca; marcaActiva; marcaSuave; sobreMarca;
  peligro; peligroSuave; aviso; avisoSuave; exito; info; infoSuave: string }
export interface ITema { modo: ModoTema; colores: IColoresTema; tipografia; espaciado; radios; toqueMinimo: 44 }
export function TemaProvider(p: { children; preferenciaInicial?: PreferenciaTema }): JSX.Element;
export function useTema(): { tema: ITema; preferencia: PreferenciaTema; establecerPreferencia(p: PreferenciaTema): void };
export function useEstilos<T>(fabrica: (tema: ITema) => T): T;
export function relacionContraste(a: string, b: string): number;

// src/native/ports/SplashPort.ts  ·  src/native/adapters/BootSplashAdapter.ts (nunca lanza)
export interface SplashPort { ocultar(opciones?: { fundido?: boolean }): Promise<void> }

// src/app/di
export interface IRepositorios {}
export interface INativos { splash: SplashPort }
export interface IDependencias { repositorios: IRepositorios; nativos: INativos; api: ClienteApi }
export function crearDependencias(): IDependencias;
export function DependenciasProvider(p: { valor?: IDependencias; children }): JSX.Element;
export function useRepository<K extends keyof IRepositorios>(clave: K): IRepositorios[K];
export function useNative<K extends keyof INativos>(clave: K): INativos[K];
```

**Bearer y 401.** `crearDependencias()` crea el cliente con `obtenerToken = () => null` y un `alNoAutorizado` vacío. La feature de sesión solo cambiará esas dos funciones en el contenedor. `api.ts` no conoce la sesión.

`SecureStoragePort` no se crea ahora porque no tendría quién lo use. Se creará en la feature de sesión, junto con la biometría.

**Tokens provisionales.** Son la identidad vigente de Leap (`../app/index.html:16-64`), que coincide con la Dirección A del brief:

| Token | Oscuro | Claro | Origen |
|---|---|---|---|
| `fondo` | `#05070B` | `#F0F4F0` | `--bg0` / Noche, Niebla |
| `fondoElevado` | `#0A0F18` | `#FFFFFF` | `--bg2` |
| `superficieSolida` | `#0D131C` | `#FFFFFF` | Grafito |
| `superficie` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.03)` | `--surface` |
| `borde` / `bordeMarca` | `rgba(255,255,255,0.08)` / `rgba(134,239,134,0.2)` | `rgba(0,0,0,0.08)` / `rgba(56,160,56,0.3)` | `--stroke*` |
| `campoFondo` | `rgba(0,0,0,0.3)` | `rgba(255,255,255,0.8)` | `--inputBg` |
| `texto` / `textoSecundario` / `textoTenue` | `#F2F6FF` / `#C6D0E2` / `#7A8BA8` | `#0D1A0D` / `#2D4A2D` / `#5A7A5A` | `--text*` |
| `marca` / `marcaActiva` | `#86EF86` / `#5DDB5D` | `#1F6B1F` / `#2D8A2D` | brief A § 3.2 |
| `sobreMarca` | `#031A03` | `#FFFFFF` | `.btn-primary` |
| `peligro` | `#FF7B7B` | `#C13333` | Rojo aviso |
| `aviso` | `#F5B84A` | `#9A6700` | Ámbar |
| `exito` | = `marca` | = `marca` | — |
| `info` | `#60A5FA` | `#2563EB` (provisional) | `.btn-blue` |

Más tokens:
- **Radios**: botón 16, tarjeta 20 y héroe 26.
- **Tipografía**: h1 28, h2 20, cuerpo 15 y detalle 12.
- **Familias**: Sora-Bold, Sora-SemiBold, DMSans-Regular y DMSans-Medium. No se usa `fontWeight` con fuentes propias.
- **Espaciado**: 4, 8, 12, 16, 20, 24 y 32.
- **Toque mínimo**: 44.

## 5. Archivos por capa, en orden

0. **Configuración**
   - `tsconfig.json`: `paths @/* → ./src/*` (sin `baseUrl`, que está obsoleto en TS 6).
   - `babel.config.js`: `module-resolver`.
   - `jest.config.js`: `transformIgnorePatterns` incluye `@react-navigation`, que solo publica ESM. Se añade `setupFilesAfterEnv`.
   - `jest.setup.ts`: mocks de `react-native-config`, bootsplash, safe-area y toast.
   - `package.json`, `react-native.config.js` (`assets: ['./assets/fuentes']`) e `index.js`, que pasa a apuntar a `src/app/App`.
   - Se borran `App.tsx` y `__tests__/App.test.tsx` de la raíz.
1. **`src/shared/lib/`**: `HttpResponse.ts`, `textos.ts`, `utils.ts`, `entorno.ts`, `api.ts` y `notify.ts`.
2. **`src/shared/theme/`**: `tokens.ts`, `temas.ts`, `contraste.ts`, `TemaProvider.tsx`, `useEstilos.ts` e `index.ts`.
3. **`src/shared/components/`**: `Texto`, `Boton`, `Campo`, `Tarjeta`, `Pantalla` (SafeArea, StatusBar según el tema, edge-to-edge), `Insignia`, `Cargando`, `AvisoEnLinea`, `HostNotificaciones` e `index.ts`.
4. **Marca y fuentes**
   - `assets/marca/isologo.png`, extraído de `ISOLOGO_GREEN` (`../app/index.html:426`, PNG de 965×965). Hay que confirmarlo visualmente; si no sirve, se usa `LOGO_ICS`.
   - `assets/fuentes/*.ttf`, estáticas de Google Fonts con licencia OFL. El nombre del archivo debe coincidir con el nombre PostScript.
   - `npx react-native-asset` para enlazarlas.
   - `scripts/generar-iconos.mjs`, que genera los mipmaps legacy y adaptativos (con capa monochrome) y el AppIcon de iOS. El de 1024 px va sin alfa.
   - `react-native-bootsplash generate assets/marca/isologo.png --platforms=android,ios --background=05070B --logo-width=120 --assets-output=assets/bootsplash`.
5. **Nativo**
   - `SplashPort.ts` y `BootSplashAdapter.ts`.
   - `MainActivity.kt`: `RNScreensFragmentFactory` y `RNBootSplash.init(this, R.style.BootTheme)`.
   - `styles.xml` con `BootTheme` y `AndroidManifest.xml`.
   - `SceneDelegate.swift`: `customize(rootView)` con `RNBootSplash.initWithStoryboard`.
   - `Info.plist`: `UILaunchStoryboardName=BootSplash`, `es`, sin el permiso de ubicación y con `UIAppFonts`.
   - `project.pbxproj`: `MARKETING_VERSION 0.1.0`.
6. **`src/app/`**: `di/contenedor.ts`, `di/DependenciasProvider.tsx`, `di/index.ts`, `providers/LimiteDeErrores.tsx`, `providers/Providers.tsx` y `App.tsx`, con el host de notificaciones al final.
7. **Escaparate**: `src/app/escaparate/escaparate.textos.ts` y `SistemaDisenoScreen.tsx`.
   - Sirve para verificar el 1.2 en un dispositivo y en el build que reciben los testers.
   - Vive en `src/app` porque no es negocio.
   - Es la ruta inicial solo hasta la feature de sesión, que lo dejará únicamente en `__DEV__`.
8. **Navegación**: `navigation/tipos.ts` (`RaizParamList` y `RootParamList` global), `temaNavegacion.ts` y `NavegadorRaiz.tsx` (native-stack, con `onReady` que oculta el splash).
9. **Documentación**: README (sistema de diseño, fuentes, splash, ícono y origen del isologo), `docs/DISTRIBUCION.md` (cuentas de tienda, 1.3) y `CLAUDE.md`.

## 6. API

- **No se consume ningún endpoint.** El cliente se adapta a la forma de Leap:
  - los errores llegan como `{"error":"<msg>"}` con un estado HTTP ≠ 2xx (`config.php:40-42`);
  - en el éxito, el JSON va tal cual (`:34-38`);
  - solo admite GET y POST (`:29`).
- **No hay cambios en el backend.** Dos notas para F1-02:
  - `Access-Control-Allow-Headers` (`config.php:30`) no incluye `Authorization`. No afecta a la app nativa, pero sí a la web si usa Bearer.
  - Conviene un código que distinga la sesión caducada.

## 7. Pasos nativos

**Dependencias** (versiones comprobadas el 2026-11-09):

| Paquete | Versión | Tipo | Para qué |
|---|---|---|---|
| `@react-navigation/native` | 7.5.1 | dep | Navegación |
| `@react-navigation/native-stack` | 7.21.0 | dep | Stack nativo |
| `react-native-screens` | 4.30.1 | dep nativa | Peer de native-stack (riesgo R3) |
| `react-native-bootsplash` | 7.3.5 | dep nativa | Splash (Android 12+ y storyboard en iOS) |
| `react-native-toast-message` | 2.5.2 | dep JS | Motor de toasts tras `notify` |
| `react-native-safe-area-context` | 5.11.1 | se fija la versión (hoy `^5.5.2`) | — |
| `babel-plugin-module-resolver` | 5.0.3 | dev | Alias `@/` |
| `sharp` | 0.35.5 | dev | Generador de íconos |
| `react-native-asset` | 2.3.0 | dev | Enlazar las fuentes |
| `@react-native/new-app-screen` | — | se quita | Era de la plantilla |

**Android.** Ver § 5. No hay permisos nuevos ni cambios en Gradle, porque el autolinking se encarga.

**iOS.** Ver § 5. `pod install` queda pendiente hasta tener Mac o runner (R4).

**Cuentas de tienda (1.3).** Pasos manuales, responsabilidad de Sebastián con apoyo de JEISON-DEV:
1. Conseguir el **D-U-N-S**.
2. **Apple Developer**, como organización:
   - darle a JEISON-DEV el rol Admin o App Manager;
   - crear el App ID `com.inglesconsebas.app` (Push se activa en F2);
   - crear la app en App Store Connect en Español (México);
   - anotar el Team ID para `DEVELOPMENT_TEAM`;
   - preparar certificados y perfiles (F4);
   - generar la clave APNs `.p8` (F2).
3. **Google Play Console**, como organización:
   - darle acceso a JEISON-DEV;
   - crear la app;
   - activar Play App Signing con la keystore de release como clave de subida;
   - registrar los SHA-1 y SHA-256 en Firebase;
   - crear la pista de prueba interna.
4. Anotar en el acta el estado de las cuentas.

## 8. Plan de pruebas

| CA | Archivo de test | Casos |
|---|---|---|
| CA1, CA2 | — | CI y paso manual en `pruebas.md` |
| CA3 | todos importan con `@/` | Archivo temporal que viola la regla de capas, más la salida de ESLint |
| CA4, CA5 | `src/shared/theme/__tests__/temas.test.ts` | Mismas claves, pares de contraste en los dos temas, `relacionContraste('#000','#fff') ≈ 21` y color inválido |
| CA6 | `src/shared/theme/__tests__/TemaProvider.test.tsx` | `dark`, `light` y `null`; `establecerPreferencia`; `sistema`; uso fuera del provider; `useEstilos` |
| CA7 | `src/shared/components/__tests__/*.test.tsx` | Los dos temas; Boton (`onPress`, deshabilitado, cargando, state, alto ≥ 44, variantes); Campo (error con `alert` o sin él); Tarjeta (role); AvisoEnLinea (reintentar); Texto (familia y tamaño) |
| CA9 | `src/shared/lib/__tests__/api.test.ts` | Casos a–i: 401 una sola vez, timeout con temporizadores falsos, rechazo de `fetch`, `obtenerToken` que lanza |
| — | `src/shared/lib/__tests__/{HttpResponse,utils,entorno}.test.ts` | Query, mensajes de error, entorno inválido |
| CA10 | `notify.test.ts`, `HostNotificaciones.test.tsx` | Tipo y textos de cada aviso, `fromError` con 3 entradas, el host en los dos temas |
| CA11 | `src/app/di/__tests__/DependenciasProvider.test.tsx` | Valor falso, clave ausente, sin provider, `crearDependencias()` |
| CA12 | `BootSplashAdapter.test.ts`, `NavegadorRaiz.test.tsx` | `hide({fade:true})`, rechazo sin lanzar, `ocultar` una vez en `onReady` |
| CA13, CA14 | — | Paso manual, salida del script, grep |
| CA15 | `src/app/escaparate/__tests__/SistemaDisenoScreen.test.tsx` | Todas las secciones, selector de tema, botones de `notify` |
| CA16 | `LimiteDeErrores.test.tsx`, `src/app/__tests__/App.test.tsx` | Fallback, reintentar, `App` monta |

Cobertura: global ≥ 70 %. No hay carpetas `domain` ni `aplications`, así que el umbral del 90 % no aplica.

## 9. Riesgos y preguntas abiertas

**Preguntas:**
- **P1 · Ítem 1.3.** Se hace el merge con 1.1, 1.2 y 1.10 hechos. La subtarea 1.3 queda abierta con un comentario: «bloqueada por el D-U-N-S».
- **P2 · Identidad provisional.** Se usan los tokens de Leap, la Dirección A y `ISOLOGO_GREEN` hasta que exista el manual. Si se elige la Dirección B, cambian tokens y fuentes y se vuelven a ejecutar los generadores.
- **P3 · Nombre visible.** «Inglés con Sebas», hasta la sesión de marca.
- **P4 · Escaparate.** Es la ruta inicial en los builds de testers hasta la feature de sesión.
- **P5 · Toasts.** Se usará `react-native-toast-message`, que es solo JS. La alternativa es un toast propio.

**Riesgos:**
- **R1 · Contrato.** La cláusula 0.5 promete Expo, EAS y Expo Router. Conviene que Sebastián acepte por escrito el cambio a React Native CLI antes de entregar F1.
- **R2 · Calidad del ícono.** El isologo mide 965 px y hay que escalarlo a 1024. Es provisional hasta tener el logo vectorial.
- **R3 · `react-native-screens@4.30.1`.** Se probó con RN 0.87 RC. Si falla, se usa una nightly 4.31 o `@react-navigation/stack`.
- **R4 · iOS sin verificar.** Lo que haga falta en iOS se revisa por diff, y la prueba real queda para F4. Opcional: un job `macos-latest` solo de compilación.
- **R5 · Splash en modo claro.** El splash es oscuro siempre, porque las opciones `--dark-*` de bootsplash son de pago.
- **R6 · Nombres de las fuentes.** DM Sans puede llegar como `DMSans_18pt-*`. Hay que comprobar el nombre del archivo en Android y el PostScript en iOS.
- **R7 · Edge-to-edge.** Es obligatorio con targetSdk 36. `Pantalla` tiene que aplicar los insets.
- **R8 · Errores con estado 200.** Algunos endpoints pueden devolver `{error}` con un 200. Se revisa por endpoint en cada feature.

## 10. Commits previstos (todos con `Refs: F1-01`)

**Constructor:**
1. `build: alias @/ hacia src en tsconfig, babel y jest`
2. `build: dependencias de navegación, splash y toasts con versiones fijas`
3. `feat(tema): tokens claro y oscuro de la identidad vigente, TemaProvider y useEstilos`
4. `feat(tema): fuentes Sora y DM Sans enlazadas en Android e iOS`
5. `feat(ui): componentes base del sistema de diseño`
6. `feat(api): HttpResponse, entorno y cliente HTTP con Bearer y manejo del 401`
7. `feat(ui): fachada notify y host de notificaciones con el tema`
8. `feat(nativo): puerto SplashPort y splash nativo con react-native-bootsplash`
9. `feat(marca): ícono de la app en Android e iOS generado desde el isologo`
10. `feat(app): composición en src/app con providers, DI, navegación raíz y límite de errores`
11. `feat(app): pantalla escaparate del sistema de diseño como ruta inicial provisional`
12. `chore(ios): región es, versión 0.1.0 y limpieza de permisos de Info.plist`
13. `docs: sistema de diseño, splash e ícono, y pasos de tiendas del ítem 1.3`

**Tester:**

14. `test(tema): temas, contraste y TemaProvider`
15. `test(ui): componentes base y host de notificaciones`
16. `test(api): cliente HTTP, notify, utils y entorno`
17. `test(app): DI, splash, navegación raíz, escaparate y límite de errores`
