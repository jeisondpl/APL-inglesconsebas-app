# Plan · F1-01b · Sistema de diseño, splash e ícono (Dirección A)

> Redactado por el agente **planificador** el 2026-11-09 en la rama `feat/F1-01b-sistema-diseno-marca`.
> Estado: **APROBADO por el usuario el 2026-11-09, con las decisiones de la sección 0.**

## 0. Decisiones del usuario (prevalecen sobre el resto del documento)

1. **Plan aprobado.**
2. **P1 · Tema: se sigue al sistema.** `PREFERENCIA_TEMA_POR_DEFECTO = 'sistema'`. Si `useColorScheme()` devuelve `null`, se usa oscuro. CA4 se ajusta a esto: «por defecto sigue al sistema».
3. **P2 · Splash claro y oscuro, sin licencia de pago.** No se usa la opción `--dark-*` ni `--license-key` del CLI de bootsplash, porque esa parte es de pago. La alternativa gratuita funciona así:
   - **Ejecución.** Se mantiene `react-native-bootsplash` 7.3.5, que tiene licencia MIT, para mostrar y ocultar el splash (`BootTheme`, `RNBootSplash.init`, `hide`).
   - **Generación.** Los recursos del splash los crea un script propio, `scripts/generar-splash.mjs`, con sharp y a partir de `logo.json`. Sustituye al script `marca:splash` del CLI y genera las dos variantes que traen los sistemas operativos:
     - **Android:**
       - `drawable-*/bootsplash_logo.png`, con el cuadrado Grafito #0D131C, borde #263140 y burbuja #86EF86;
       - `drawable-night-*/bootsplash_logo.png`, idéntico al anterior;
       - `values/colors.xml`, con `bootsplash_background` en Niebla #F0F4F0;
       - `values-night/colors.xml`, con #05070B;
       - en la variante clara, el logo va en un cuadrado blanco #FFFFFF con borde #DBE5DB y burbuja #1F6B1F.

       Android elige la variante según el modo del sistema, sin código.
     - **iOS:** `Colors.xcassets` con `BootSplashBackground` (apariencias Any = Niebla, Dark = Noche), la imagen `BootSplashLogo` con sus dos apariencias y el `BootSplash.storyboard` que las referencia.
   - **CA9 cambia:** el splash se verifica en los dos modos del sistema, con modo oscuro activado y desactivado en el moto g77.
   - El constructor comprueba en el README de bootsplash qué nombres de recurso y estilos espera en ejecución (`bootsplash_background`, `bootsplash_logo`, `BootTheme`), y los respeta.
4. **P3.** Se mantiene: la continuación animada del splash queda fuera de alcance.
5. **P5 · Onboarding.** Se crea una tarjeta pendiente en el tablero, fuera del contrato. No forma parte de esta feature.

## Definition of Ready: se cumple con tres salvedades

- **Código de tablero.** La feature es F1-01b. Cierra los ítems 1.2 y 1.10 de F1-01, que en el contrato están en `build-contrato-app-movil.js:543` y `:551`.
- **Criterios verificables.** Todos tienen un test o un paso manual, en el moto g77 o en un emulador.
- **Dependencias.** No hay API. Las nativas son bootsplash y svg (§ 7). F1-01 ya está en `main`.
- **Pendiente:** la aprobación del usuario.

**Salvedades:**
1. **Logo y nombre provisionales.** La lámina llama al logo «LOGO PROVISIONAL», y el nombre visible sigue abierto. No bloquea: logo, ícono y splash salen de una sola fuente (`assets/marca/logo.json`) mediante scripts reproducibles.
2. **Seis colores derivados.** El tema claro necesita 6 colores que la lámina no trae: las insignias de peligro y aviso, y el campo de texto. Se derivan de la paleta, se marcan como derivados y se validan por contraste.
3. **P1 se decide antes de construir.** El tema por defecto es una sola constante.

## 1. Resumen

Esta feature monta la identidad de la **Dirección A · Evolución**, elegida por Sebastián el 2026-11-09:
- tokens semánticos para los temas claro y oscuro, con el oscuro como principal;
- tipografías Sora y DM Sans;
- componentes base accesibles;
- logo vectorial en pantalla;
- splash nativo;
- ícono adaptativo, monocromo y legacy en Android, y AppIcon en iOS;
- una pantalla escaparate del sistema de diseño.

Además, migra a los tokens lo que hoy usa `DefaultTheme` y `DarkTheme`: la navegación, `LimiteDeErrores`, `InicioProvisionalScreen` y el host de toasts.

Con esto se cierran los ítems 1.2 y 1.10. F1-01 queda completa salvo el ítem 1.3, que sigue bloqueado por el D-U-N-S.

**Qué cambia respecto al plan de F1-01** (`docs/features/F1-01-base-diseno-marca/plan.md`):
- **Logo.** Pasa a ser un SVG vectorial: el path de la burbuja más la «S» en Sora 800. Deja de usarse el PNG `ISOLOGO_GREEN`, y con eso desaparece el riesgo R2.
- **Tokens.** Ahora salen de la lámina y de las pantallas A-M*, no de Leap.
- **Tipografía.** Se añade DM Sans SemiBold.
- **Escaparate.** Se abre desde un botón del inicio provisional. El inicio sigue siendo la ruta inicial, así que CA17 se mantiene.
- **Dependencia nueva.** Entra `react-native-svg` para dibujar el logo.

## 2. Alcance

**Entra:**
- **`src/shared/theme/`**:
  - `paleta`, con los nombres de la lámina;
  - `temaOscuro` y `temaClaro`, con las mismas claves;
  - tipografía, espaciado, radios y tamaño mínimo de toque;
  - `TemaProvider`, `useTema`, `useEstilos` y `relacionContraste`.
- **`src/shared/components/`**: `Texto`, `Boton`, `Campo`, `Tarjeta`, `Pantalla`, `Insignia`, `Cargando`, `AvisoEnLinea`, `LogoMarca` (SVG), `Marca` (logo más el wordmark) y `HostNotificaciones` (toasts con el tema).
- **Logo vectorial.** `scripts/generar-logo.mjs` convierte la «S» en path con opentype.js y Sora ExtraBold. La única fuente de verdad es `assets/marca/logo.json`.
- **Fuentes.** Sora SemiBold y Bold, y DM Sans Regular, Medium y SemiBold, enlazadas en Android e iOS.
- **Splash nativo** con `react-native-bootsplash`:
  - el logo va en un cuadrado redondeado sobre Noche #05070B;
  - se oculta con fundido en el `onReady` de la navegación, a través de `SplashPort` y `BootSplashAdapter`.
- **Ícono.** `scripts/generar-iconos.mjs`, con sharp, genera:
  - en Android: legacy, redondo, adaptativo y monocromo;
  - en iOS: el AppIcon;
  - un PNG de 512 px para Play.
- **Migración a tokens:**
  - `temaNavegacion(tema)`, con colores y fuentes;
  - `LimiteDeErrores`;
  - `InicioProvisionalScreen`;
  - `App.tsx` y `Providers.tsx`, con el host de toasts dentro del tema.
- **Escaparate** (`src/app/escaparate/`):
  - se abre desde el inicio provisional;
  - tiene un selector de tema que no se guarda.
- **Documentación.**

**No entra:**
- **Continuación animada del splash en JS**, con el wordmark y el eslogan:
  - suma más de 1 s a cada arranque en frío;
  - el eslogan no está decidido;
  - el contrato no la pide;
  - puede añadirse después con `useHideAnimation` sin rehacer nada.
- **Onboarding (O1–O4).** No está en el contrato F1.
- **Login.** Va en la feature de sesión.
- **Pestañas y navegación por rol.** Llegan con los módulos.
- **Guardar la preferencia de tema.** Va en el ítem 1.14.
- **Flavors.**
- **Splash claro.** Necesita licencia de pago (P2).
- **Build y `pod install` de iOS** (R4).
- **Cambios en `../app/`.**

## 3. Criterios de aceptación

| CA | Criterio | Verificación |
|---|---|---|
| CA1 | `npm run calidad` en verde, con cobertura global ≥ 70 %. En el PR pasan los dos jobs de `calidad.yml`, incluido el build de Android con las dependencias nativas nuevas. | CI y ejecución local |
| CA2 | `temaOscuro` y `temaClaro` tienen exactamente las mismas claves en `colores`, `tipografia`, `espaciado` y `radios`. Cada color con nombre en la lámina coincide con su hex de § 4. Por ejemplo: `marca` #86EF86/#1F6B1F, `fondo` #05070B/#F0F4F0, `superficie` #0D131C/#FFFFFF, `sobreMarca` #04230D/#FFFFFF. | `temas.test.ts` |
| CA3 | En los dos temas, contraste ≥ 4.5:1 en: `texto`/`fondo`, `texto`/`superficie`, `textoSecundario`/`fondo`, `textoSecundario`/`superficie`, `sobreMarca`/`marca`, `marca`/`fondo`, `peligro`/`superficie`, `aviso`/`superficie`, `sobreExitoSuave`/`exitoSuave`, `sobrePeligroSuave`/`peligroSuave`, `sobreAvisoSuave`/`avisoSuave` y `texto`/`campoFondo`. Contraste ≥ 3:1 en `textoTenue`/`fondo` y `aviso`/`fondo`. `relacionContraste('#000','#fff')` da ≈ 21, y un color inválido lanza un error descriptivo. | `temas.test.ts` |
| CA4 | `TemaProvider` arranca con `PREFERENCIA_TEMA_POR_DEFECTO` (P1). Con `'sistema'` sigue a `useColorScheme()`, y si es `null` usa oscuro. `establecerPreferencia` cambia el tema y vuelve a pintar. `useTema` fuera del provider lanza un error descriptivo. `useEstilos` recalcula al cambiar de tema. | `TemaProvider.test.tsx` |
| CA5 | Todos los componentes se pintan en los dos temas y son accesibles (detalle debajo de la tabla). | Tests con RNTL |
| CA6 | En el moto g77, los títulos y botones salen en Sora y el cuerpo en DM Sans, sin caer a Roboto. | Captura manual. iOS queda pendiente |
| CA7 | `temaNavegacion(tema)` devuelve un `Theme` con `dark`, colores y `fonts` tomados de los tokens: `primary`=`marca`, `background`=`fondo`, `card`=`superficie`, `text`=`texto`, `border`=`borde`, `notification`=`marca`. Lo usa `NavegadorRaiz`. La StatusBar es clara en el tema oscuro y oscura en el claro. `LimiteDeErrores` pinta con los tokens y conserva CA16. `InicioProvisionalScreen` usa `Pantalla`, `Marca` y `Texto`, y conserva CA17. | Tests actualizados |
| CA8 | `HostNotificaciones` registra success, error, warning e info, todos con fondo `superficie` y el color de acento de su tipo. El título va en `texto` con Sora-SemiBold y el detalle en `textoSecundario` con DMSans, en los dos temas. `notify` no cambia. | `HostNotificaciones.test.tsx` y `App.test.tsx` |
| CA9 | Arranque en frío en el moto g77 (Android 16) y en un emulador con API 30. Aparece el splash: un cuadrado Grafito de 120 dp, con radio 26 y borde #263140, y la burbuja verde sobre #05070B. No hay destello blanco ni recorte por la máscara de Android 12+. Se oculta con fundido cuando la navegación está lista. `SplashPort.ocultar` se llama exactamente una vez, en `onReady`. `BootSplashAdapter` nunca lanza. | Manual, más tests con un puerto falso |
| CA10 | En el moto g77 el ícono es adaptativo, sin recortes, y monocromo si los íconos temáticos están activos. En API 24 y 25 se usa el legacy. Ejecutar `generar-iconos.mjs` dos veces deja el `git status` limpio. Genera los 9 PNG de iOS más `Contents.json`. El de 1024 px no tiene canal alfa: el propio script lo comprueba y falla si lo tiene. | Manual y salida del script |
| CA11 | El logo es 100 % vectorial. `assets/marca/logo.json` y los SVG generados no contienen `<text`. La «S» generada coincide con la de la lámina al superponerla. `LogoMarca` pinta la burbuja en `marca`, y la «S» en `fondo` en el tema oscuro y en #FFFFFF en el claro. | Grep, comparación visual y test |
| CA12 | El escaparate muestra paleta, tipografía, botones en todos sus estados, campo con y sin error, tarjetas, insignias, aviso, carga, `LogoMarca` y `Marca`. Incluye el selector de tema (Sistema, Claro, Oscuro) y un botón por cada tipo de `notify`. Se abre desde «Ver sistema de diseño». Sus textos están en `escaparate.textos.ts`. | Test y paso manual |
| CA13 | README y `CLAUDE.md` documentan el sistema de diseño, las fuentes y su regla de nombres, cómo regenerar logo, splash e ícono, y qué archivos son salida generada. | Revisión |

**Detalle de CA5:**
- **Boton:** variantes primario, secundario y peligro. Tiene role, label y los estados disabled y busy, con alto ≥ 48. No llama a `onPress` si está deshabilitado o cargando.
- **Campo:** la etiqueta está asociada, el error usa `role=alert` y el borde se pone en `peligro`.
- **Tarjeta:** variantes normal y destacada. Si es pulsable, tiene role button.
- **Insignia:** tonos exito, aviso, peligro, neutra y contador.
- **Texto:** cada variante usa su familia y su tamaño.
- **LogoMarca:** con etiqueta tiene role image; sin etiqueta queda oculto a la accesibilidad.
- **Marca:** se lee como «Inglés con Sebas».
- **Pantalla:** aplica los insets y el fondo.

## 4. Tipos y tokens

```ts
// src/native/ports/SplashPort.ts
export interface SplashPort { ocultar(opciones?: { fundido?: boolean }): Promise<void> }
// src/native/adapters/BootSplashAdapter.ts — envuelve BootSplash.hide({ fade }); nunca lanza
export function crearBootSplashAdapter(): SplashPort;
// src/app/di/contenedor.ts
export interface INativos { splash: SplashPort }

// src/shared/theme
export type ModoTema = 'claro' | 'oscuro';
export type PreferenciaTema = ModoTema | 'sistema';
export const PREFERENCIA_TEMA_POR_DEFECTO: PreferenciaTema; // P1
export interface IColoresTema {
  fondo; superficie; superficieAlterna; campoFondo; borde; bordeMarca; pista;
  texto; textoSecundario; textoTenue;
  marca; marcaActiva; acento; sobreMarca;
  destacado; bordeDestacado;
  exitoSuave; sobreExitoSuave;
  peligro; peligroSuave; sobrePeligroSuave; bordePeligro;
  aviso; avisoSuave; sobreAvisoSuave;
  info: string;
}
export type VarianteTexto = 'h1' | 'h2' | 'titulo' | 'subtitulo' | 'cuerpo' | 'cuerpoFuerte'
  | 'boton' | 'detalle' | 'etiqueta' | 'insignia';
export interface ITema {
  modo: ModoTema; colores: IColoresTema;
  tipografia: Record<VarianteTexto, { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }>;
  familias: { soraSemiBold; soraBold; dmSansRegular; dmSansMedium; dmSansSemiBold: string };
  espaciado: { xs: 4; s: 8; m: 12; l: 16; xl: 20; xxl: 24; xxxl: 32 };
  radios: { icono: 12; boton: 16; campo: 16; tarjeta: 20; heroe: 26; pildora: 999 };
  toqueMinimo: 44;
}
export function TemaProvider(p: { children: ReactNode; preferenciaInicial?: PreferenciaTema }): JSX.Element;
export function useTema(): { tema: ITema; preferencia: PreferenciaTema; establecerPreferencia(p: PreferenciaTema): void };
export function useEstilos<T>(fabrica: (tema: ITema) => T): T;
export function relacionContraste(a: string, b: string): number;
// src/app/navigation/temaNavegacion.ts (cambia la firma)
export function temaNavegacion(tema: ITema): Theme;
// assets/marca/logo.json (generado por scripts/generar-logo.mjs)
{ "viewBox": "0 0 48 48", "burbuja": "M10 4h28c4.4 0 …Z", "letra": "<path d de la S>", "colores": { … } }
```

### Tokens semánticos

| Token | Oscuro | Claro | Origen |
|---|---|---|---|
| `fondo` | #05070B | #F0F4F0 | Noche / Niebla |
| `superficie` | #0D131C | #FFFFFF | Grafito, tarjetas, pestañas |
| `superficieAlterna` | #121B27 | #F4F8F4 | Tarjeta de la lámina, teclas del PIN |
| `campoFondo` | #0A0F16 | #FFFFFF *(derivado)* | Campo de texto de la lámina |
| `borde` | #1F2A38 | #DBE5DB | Bordes de tarjetas y paneles |
| `bordeMarca` | #2A5B37 | #9FC5A0 | Botón secundario |
| `pista` | #1B2533 | #DCE6DC | Fondo de la barra de progreso |
| `texto` | #F2F6FF | #0D1A0D | Texto claro / Tinta |
| `textoSecundario` | #9AA6BB | #54665A | Subtítulos |
| `textoTenue` | #5A6B84 | #6B7C6F | Pie de página y chevrons (R7) |
| `marca` | #86EF86 | #1F6B1F | Verde marca / Verde bosque |
| `marcaActiva` | #5DDB5D | #174F17 | Verde profundo / hover |
| `acento` | #86EF86 | #2D8A2D | Verde medio |
| `sobreMarca` | #04230D | #FFFFFF | Texto del botón primario |
| `destacado` / `bordeDestacado` | #0F2A18 / #1E4A2B | #E2EFE2 / #C9E0C9 | Héroe «Próxima clase» |
| `exitoSuave` / `sobreExitoSuave` | #123122 / #A6F3AE | #DCEDDC / #1C5E1C | Insignia «Programada» |
| `peligro` | #FF7B7B | #C13333 | Rojo aviso |
| `peligroSuave` / `sobrePeligroSuave` / `bordePeligro` | #361316 / #FFB4B4 / #4A2226 | #FBE4E4 / #9B2C2C / #E7B3B3 *(derivados)* | Cancelar en M3 |
| `aviso` | #F5B84A | #9A6700 | Ámbar |
| `avisoSuave` / `sobreAvisoSuave` | #33260F / #F5B84A | #F7ECD6 / #7A5200 *(derivados)* | Reagendo en M3 |
| `info` | #60A5FA | #2563EB | `.btn-blue` de Leap (provisional) |

**Constantes solo para los scripts** (en `logo.json`, dentro de `colores`):
- Cuadrado del splash: #0D131C con borde #263140.
- Variante clara del cuadrado: #FFFFFF con borde #DBE5DB.
- «S» clara: #FFFFFF.
- Fondo del ícono: #05070B.

**Contrastes WCAG medidos:**

| Par | Oscuro | Claro |
|---|---|---|
| `texto`/`fondo` | 18.6 | 16.2 |
| `textoSecundario`/`fondo` | 8.2 | 5.52 |
| `textoTenue`/`fondo` | 3.72 | 3.99 |
| `sobreMarca`/`marca` | 11.75 | 6.60 |
| `sobreExitoSuave`/`exitoSuave` | 10.8 | — |
| `sobrePeligroSuave`/`peligroSuave` | 9.9 | 6.21 |
| `peligro`/`superficie` | — | 5.54 |
| `aviso`/`superficie` | — | 4.87 |
| `aviso`/`fondo` | — | 4.38 |
| `sobreAvisoSuave`/`avisoSuave` | — | 5.91 |

**Tipografía:**

| Variante | Fuente | Tamaño/interlineado |
|---|---|---|
| `h1` | Sora-Bold | 28/34 |
| `h2` | Sora-Bold | 20/26 |
| `titulo` | Sora-Bold | 17/22 |
| `subtitulo` | Sora-SemiBold | 15/20 |
| `cuerpo` | DMSans-Regular | 15/22 |
| `cuerpoFuerte` | DMSans-SemiBold | 13.5/18 |
| `boton` | Sora-SemiBold | 14/18 |
| `detalle` | DMSans-Regular | 12/16 |
| `etiqueta` | Sora-Bold | 10/14, espaciado 2, mayúsculas |
| `insignia` | DMSans-SemiBold | 11/14 |

No se usa `fontWeight` con estas fuentes. Radios: 16 en botones y campos, 20 en tarjetas, 26 en héroes, 12 en íconos y 999 en píldoras.

## 5. Archivos por capa, en orden

0. **Dependencias y configuración**
   - `package.json`: las dependencias de § 7 y los scripts `marca:logo`, `marca:iconos` y `marca:splash` (`react-native-bootsplash generate assets/marca/splash-logo.svg --platforms=android,ios --background=05070B --logo-width=120 --assets-output=assets/bootsplash`).
   - `jest.setup.ts`: mock de bootsplash (`hide`, `isVisible` y `useHideAnimation`). Mock de react-native-svg solo si RNTL no lo renderiza (R5).
   - `.prettierignore`: añadir `assets/bootsplash/`.
   - `react-native.config.js`: `{ assets: ['./assets/fuentes'] }`.
1. **Logo vectorial**
   - `assets/marca/fuentes-origen/Sora-ExtraBold.ttf` y `OFL.txt`, que solo se usan para vectorizar.
   - `scripts/generar-logo.mjs`, con opentype.js:
     - obtiene la «S» con `getPath('S', x, 27.5, 19)` y la centra como hace `text-anchor="middle"`;
     - escribe `logo.json`, `logo-oscuro.svg`, `logo-claro.svg` y `splash-logo.svg` (lienzo de 120×120, `rect` con `rx` 26, relleno #0D131C, borde #263140 y burbuja de 66 px);
     - es idempotente y no genera `<text>`.
   - **Por qué se vectoriza la «S».** sharp rasteriza con librsvg, que busca la fuente por fontconfig. Sora no está instalada en Windows ni en CI, así que la «S» saldría en otra fuente o no saldría. Se convierte una vez y se versiona el resultado.
2. **Tema**: `src/shared/theme/{paleta,temas,tipografia,contraste}.ts`, `TemaProvider.tsx`, `useEstilos.ts` e `index.ts`.
3. **Fuentes**
   - `assets/fuentes/` lleva 5 TTF estáticos con licencia OFL.
   - El nombre de cada archivo es su nombre PostScript, leído con opentype.js (R6).
   - Se enlazan con `npx react-native-asset`.
4. **Componentes** (`src/shared/components/`)
   - `Texto`, `Boton`, `Campo` y `Tarjeta`.
   - `Pantalla`: SafeAreaView, StatusBar y fondo (R8).
   - `Insignia`, `Cargando` y `AvisoEnLinea`.
   - `LogoMarca`: `Svg` con 2 `Path` de `logo.json`.
   - `Marca`: sus textos van en `textosComunes.marca`.
   - `HostNotificaciones`: `Toast` con `BaseToast`/`ErrorToast` con el tema. Sustituye a `configuracionToasts` de `App.tsx`, y solo él y `notify.ts` importan la librería.
   - `componentes.textos.ts` e `index.ts`.
5. **Nativo**
   - `SplashPort.ts` y `BootSplashAdapter.ts`.
   - `npm run marca:splash`, que genera:
     - en Android: `drawable-*/bootsplash_logo.png`, `colors.xml` y `BootTheme`;
     - en iOS: `BootSplash.storyboard`, `Colors.xcassets` y `BootSplashLogo-*`.
   - **El constructor revisa el diff** y completa a mano lo que falte:
     - `styles.xml`: `BootTheme` con parent `Theme.BootSplash` y `postBootSplashTheme=@style/AppTheme`;
     - `AndroidManifest.xml`: la Activity con `@style/BootTheme`.
   - `MainActivity.kt`: `RNBootSplash.init(this, R.style.BootTheme)` va después de `fragmentFactory = RNScreensFragmentFactory()` y antes de `super.onCreate`. Es la variante del README para react-native-screens ≥ 4.16.
   - `SceneDelegate.swift`: `customize(rootView)` con `RNBootSplash.initWithStoryboard("BootSplash", rootView:)`. Es la variante del README para RN ≥ 0.88.
   - `Info.plist`: `UILaunchStoryboardName=BootSplash`. Se elimina `LaunchScreen.storyboard`.
   - `scripts/generar-iconos.mjs` (sharp, desde `logo.json`) genera:
     - **Android legacy:** `ic_launcher` e `ic_launcher_round` en 5 densidades (48–192 px), con fondo #05070B y burbuja al 56 %.
     - **Android adaptativo:** `mipmap-anydpi-v26/ic_launcher(_round).xml` (background #05070B, foreground y monochrome), `ic_launcher_foreground.png` (108–432 px, burbuja de unos 60 dp dentro de la zona segura de 66 dp), `ic_launcher_monochrome.png` (silueta blanca con la «S» calada, `evenodd`) y `values/ic_launcher_background.xml`.
     - **iOS:** 9 PNG más `Contents.json`. El de 1024 px se aplana sobre #05070B con `removeAlpha`, y el script verifica que no tenga alfa.
     - **Play:** `assets/marca/icono-play-512.png`.
6. **`src/app/`**
   - `contenedor.ts`: `INativos { splash }` y `crearDependencias()` con `crearBootSplashAdapter()`.
   - `Providers.tsx`: SafeArea → Tema → Dependencias → `LimiteDeErrores{children}`, con `HostNotificaciones` como hermano.
   - `LimiteDeErrores.tsx`: usa `useTema()`, pero sigue con primitivas.
   - `App.tsx`: se quitan `Toast` y `BaseToast`.
7. **Navegación**
   - `temaNavegacion(tema: ITema)`, con `fonts` de DM Sans y Sora.
   - `tipos.ts`: añadir `SistemaDiseno: undefined`.
   - `NavegadorRaiz.tsx`:
     - usa `useTema()` en lugar de `useColorScheme()`;
     - `onReady` llama a `splash.ocultar({ fundido: true })` mediante `useNative('splash')`;
     - añade la ruta `SistemaDiseno`.
8. **Pantallas**
   - `InicioProvisionalScreen` pasa a usar `Pantalla`, `Marca` y `Texto`, con los mismos datos de CA17. Suma un `Boton` secundario «Ver sistema de diseño».
   - `escaparate/escaparate.textos.ts` y `SistemaDisenoScreen.tsx`. Cuando exista la sesión, solo se mostrará en `__DEV__`.
9. **Documentación**
   - README: sistema de diseño, fuentes, el orden de regeneración `marca:logo` → `marca:iconos` → `marca:splash` y licencias.
   - `CLAUDE.md`: sección «Sistema de diseño y marca (F1-01b)». Se quita la frase «esperan al manual de marca».

## 6. API

Ninguna.

## 7. Pasos nativos

Versiones comprobadas con `npm view` el 2026-11-09:

| Paquete | Versión | Tipo | Compatibilidad | Para qué |
|---|---|---|---|---|
| `react-native-bootsplash` | 7.3.5 | Dependencia nativa | Peers `*`; el README cubre RN ≥ 0.88 y screens ≥ 4.16 | Splash y CLI `generate` |
| `react-native-svg` | 15.16.1 | Dependencia nativa | ≥ 15.16.0 exige RN ≥ 0.80. Respaldo: 15.16.0 | `LogoMarca` e íconos futuros |
| `sharp` | 0.35.5 | Dev | Node ≥ 20.9; bootsplash ya la trae | `generar-iconos.mjs` |
| `opentype.js` | 2.0.0 | Dev | — | Vectorizar la «S» |
| `react-native-asset` | 2.3.0 | Dev | — | Enlazar las fuentes |

Se descartan `react-native-svg-transformer` y `@resvg/resvg-js`.

- **Android.** No hay permisos nuevos ni cambios en Gradle. Cambian `MainActivity.kt`, `styles.xml`, `AndroidManifest.xml`, `colors.xml`, `ic_launcher_background.xml`, `mipmap-*`, `drawable-*` y `assets/fonts`. Con minSdk 24 se mantienen los íconos legacy.
- **iOS** (revisado por diff, sin compilar). Cambian `SceneDelegate.swift`, `Info.plist`, `BootSplash.storyboard`, `Colors.xcassets`, `AppIcon` y `pbxproj`. Queda pendiente `pod install` y versionar `Podfile.lock`.
- No hay variables de entorno nuevas.

## 8. Plan de pruebas

| CA | Archivo | Casos |
|---|---|---|
| CA2, CA3 | `src/shared/theme/__tests__/temas.test.ts` | Claves (recursivo), hex de la lámina, pares de contraste en los dos temas, `relacionContraste` con #000/#fff, con #fff corto y con un valor inválido |
| CA4 | `src/shared/theme/__tests__/TemaProvider.test.tsx` | Valor por defecto, `sistema` con dark/light/null, `establecerPreferencia`, uso fuera del provider, `useEstilos` |
| CA5 | `src/shared/components/__tests__/*.test.tsx` | Los dos temas; Boton (onPress, deshabilitado, cargando, state, alto ≥ 48, variantes); Campo; Tarjeta; AvisoEnLinea; LogoMarca (2 Path con los `d` de `logo.json`, colores, decorativo frente a etiquetado) |
| CA7 | Tests de `NavegadorRaiz`, `LimiteDeErrores` e `InicioProvisionalScreen` | `temaNavegacion` con los dos temas, título con `colores.texto`, fallback con los tokens, inicio que conserva CA17 y navega a `SistemaDiseno` |
| CA8 | `HostNotificaciones.test.tsx` y `App.test.tsx` | 4 tipos con el acento y el fondo de cada tema; el host está dentro de los providers |
| CA9 | `BootSplashAdapter.test.ts` y `NavegadorRaiz.test.tsx` | `hide` con fade `true` y `false`, rechazo sin lanzar, `onReady` llama a `ocultar` una sola vez. Arranque en frío manual |
| CA10, CA11 | `LogoMarca.test.tsx` y comprobaciones manuales | Salida de los scripts, `git status` limpio tras la segunda ejecución, `grep -r "<text"`, comparación visual |
| CA12 | `src/app/escaparate/__tests__/SistemaDisenoScreen.test.tsx` | Secciones, selector de tema, botones de `notify`, navegación desde el inicio |
| CA1, CA6, CA13 | — | CI, captura de las fuentes, revisión de la documentación |

**Tests existentes que se rompen.** `NavegadorRaiz`, `LimiteDeErrores` y `App` comprueban colores de `DarkTheme` y `DefaultTheme`, y la configuración de toasts. El constructor ajusta **solo esas aserciones** en el commit de la migración, para que la puerta siga en verde, y lo anota en el commit. El tester amplía después.

Cobertura global ≥ 70 %. Los scripts `.mjs` quedan fuera.

## 9. Riesgos y preguntas abiertas

**Preguntas:**
- **P1 · Tema por defecto.** Recomendación: `'oscuro'` fijo hasta el ítem 1.14, con `'sistema'` disponible en la API y en el escaparate. Motivos:
  - la lámina declara el oscuro como principal;
  - el splash solo puede ser oscuro (P2);
  - sin persistencia, la elección del usuario se perdería al reiniciar.

  La alternativa es seguir al sistema.
- **P2 · Splash claro.** Necesita la licencia de pago de bootsplash. Recomendación: aceptar el splash siempre oscuro.
- **P3 · Continuación animada y eslogan.** Queda fuera de alcance. La lámina propone «Tu inglés, todos los días.» y «Habla desde la primera clase.».
- **P4 · Nombre y logo provisionales.** Se sigue con «Inglés con Sebas». Si cambia, se regenera con los scripts.
- **P5 · Onboarding (O1–O4).** ¿Se crea una tarjeta en el tablero para una feature futura?

**Riesgos:**
- **R1 · Fidelidad de la «S».** Se valida superponiéndola a la lámina (CA11).
- **R2 · Máscara de Android 12+.** Según el cálculo cabe, pero se comprueba en el moto g77.
- **R3 · react-native-svg 15.16.1 es muy reciente.** Respaldos: la 15.16.0, o PNG del logo a @1x, @2x y @3x mostrados con `Image`.
- **R4 · iOS sin verificar.** Se revisa por diff. Opcional: un job `macos-latest`.
- **R5 · Jest y react-native-svg.** Si hace falta, se mockea en `jest.setup.ts`.
- **R6 · Nombres de las fuentes.** El nombre de archivo debe coincidir con el PostScript. Se verifica en Android.
- **R7 · Grises de la lámina en el tema claro.** #8A9A8E y #93A497 dan menos de 3:1, así que `textoTenue` pasa a ser #6B7C6F. `aviso` claro sobre `fondo` da 4.38, así que solo se usa en texto grande o en íconos.
- **R8 · Edge-to-edge** con targetSdk 36. `Pantalla` aplica los insets.
- **R9 · Archivos generados versionados.** El CI no ejecuta los scripts, así que su salida va al repo. El README advierte que no se editan a mano.

## 10. Commits previstos (todos con `Refs: F1-01b`)

**Constructor:**
1. `build: dependencias de splash, svg y generadores de marca con versiones fijas`
2. `feat(marca): logo vectorial con la S convertida a trazado y script generar-logo`
3. `feat(tema): tokens claro y oscuro de la Dirección A, TemaProvider y useEstilos`
4. `feat(tema): fuentes Sora y DM Sans enlazadas en Android e iOS`
5. `feat(ui): componentes base, LogoMarca y Marca del sistema de diseño`
6. `feat(ui): host de notificaciones con los colores del tema`
7. `refactor(app): navegación, límite de errores e inicio provisional sobre los tokens`
8. `feat(nativo): puerto SplashPort y splash nativo con react-native-bootsplash`
9. `feat(marca): ícono adaptativo, monocromo y legacy en Android y AppIcon de iOS`
10. `feat(app): escaparate del sistema de diseño accesible desde el inicio provisional`
11. `docs: sistema de diseño, regeneración de logo, ícono y splash`

**Tester:**

12. `test(tema): temas, contraste y TemaProvider`
13. `test(ui): componentes base, logo y host de notificaciones`
14. `test(app): splash, navegación con tema, límite de errores, inicio y escaparate`

**Tablero:** F1-01 queda con 1.2 y 1.10 hechos. 1.3 sigue bloqueado por el D-U-N-S.
