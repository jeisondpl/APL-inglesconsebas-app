# pruebas.md · EXT-01 · Onboarding de bienvenida

> Tester, 2026-11-17, rama `feat/EXT-01-onboarding`. Commit de tests: `63bfb62 test(onboarding): criterios CA1-CA16 de la bienvenida con casos de error`.

**Importante:** la verificación en el teléfono **no se hizo**. `adb devices` sale vacío (el teléfono no está conectado). Los pasos manuales quedan en la sección 4, con los comandos exactos.

Los casos se diseñaron a partir de CA1–CA17 del `plan.md`. Los tests del constructor (marcados «El tester amplía los casos») se dejaron como estaban. Los casos nuevos van en cuatro archivos `*.tester.test.ts(x)`, con 71 tests:

| Archivo | Tests | Qué refuerza |
|---|---|---|
| `src/modules/onboarding/__tests__/OnboardingScreen.tester.test.tsx` | 26 | CA6, CA7, CA9, CA10, CA12, CA13 y CA14 en pantalla |
| `src/modules/onboarding/__tests__/Onboarding.controller.tester.test.tsx` | 15 | CA4, CA9, CA10 y CA11 en el controller y los casos de uso, con errores del almacén |
| `src/modules/onboarding/__tests__/onboarding.estatico.tester.test.ts` | 6 | CA13: colores fuera del hex (rgb/hsl, nombres CSS, literales en `fill`/`stroke`, estilos sin `tema.colores`) |
| `src/app/navigation/__tests__/NavegadorRaiz.onboarding.tester.test.tsx` | 24 | CA1, CA2, CA3, CA4, CA8, CA9, CA10 y CA11 en el arranque real |

### Técnicas que cambian respecto a los tests del constructor

- **CA12 (atrás de Android).** El test del constructor espiaba `BackHandler.addEventListener` y llamaba «al último oyente registrado». Es frágil: depende del orden de registro y no comprueba qué hace el sistema cuando nadie intercepta. Jest corre como iOS, donde `BackHandler` no hace nada. Por eso los tests nuevos cargan **la implementación real de Android** (`BackHandler.android.js`) con `jest.mock`. El atrás se pulsa como lo hace el sistema (`DeviceEventEmitter.emit('hardwareBackPress')`): todos los oyentes se recorren en orden inverso y, si ninguno devuelve `true`, se llama a `exitApp`, que está espiado. Así «en O1 sale de la app» es una afirmación directa (`exitApp` llamado una vez) y no un `false` devuelto por un oyente concreto.
- **CA2 (O1 no aparece en ningún render).** El test del constructor tomaba el árbol dos veces. El nuevo envuelve `OnboardingScreen` con un contador de renders (`jest.mock` sobre la pantalla real) y exige **0 renders**: con la bandera, con la lectura lenta y en un segundo arranque. Un caso de control comprueba que, sin bandera, el contador sí sube.
- **CA13 (tokens).** El test del constructor solo llamaba a la función pura `categoriaIsotipoPorModo`. Los nuevos miden lo que **se pinta**:
  - el ARGB de cada `fill`/`stroke` declarado de los SVG O2–O4 pertenece a `temas[modo].colores`. react-native-svg rellena `fill` negro por defecto, pero solo aplica las props de `propList`, así que solo se cuentan esas;
  - el círculo de los dos isotipos (cabecera y O1) es #86EF86 en oscuro y #000000 en claro;
  - el título es `Nohemi-Medium` con color `texto`;
  - el cuerpo es `DMSans-Regular` con color `textoSecundario`;
  - «Omitir» va en `textoSecundario`;
  - las marcas del indicador son `[marca, pista, pista, pista]`.

## 1. Matriz criterio → prueba

| CA | Pruebas automáticas (todas en verde) | Manual |
|---|---|---|
| CA1 Sin bandera ni sesión → O1 | `NavegadorRaiz.onboarding.test.tsx` (constructor): O1 y sin «Inicia sesión». `…tester`: un valor guardado `''`, `'true'`, `'0'` o `'visto'` cuenta como sin bandera → O1. Control: el contador de renders sube | Paso M1 **pendiente** |
| CA2 Con bandera → login, O1 nunca se pinta | `…tester`: 0 renders de `OnboardingScreen` con la bandera, también con la lectura de la bandera diferida (árbol `null` mientras tanto). Splash ocultado 1 vez con `{fundido:true}` | Paso M5 **pendiente** |
| CA3 Con sesión → inicio | Constructor: ana sin bandera. `…tester`: profe (meli) sin bandera → «Hola, Meli», 0 renders de la bienvenida. Con sesión y bandera → inicio y **no** se vuelve a guardar la bandera. `rutaInicialRaiz.test.ts`: 3 roles × pendiente/visto | — |
| CA4 Sesión sin bandera → se guarda; al cerrar sesión, login | Constructor: ana → bandera `'1'` → «Cerrar sesión» → login. `…tester`: se guarda **una sola vez**. Tras cerrar sesión, un **segundo arranque con el mismo almacén** va al login con 0 renders de O1. Si guardar la bandera falla, cerrar sesión sigue llevando al login (bandera en memoria). Controller: si la sesión aparece después (`haySesion` false→true), la bandera se marca; sin sesión no se guarda nada | — |
| CA5 Textos exactos | `OnboardingScreen.test.tsx` y `PAGINAS_ONBOARDING`: 4 títulos en orden; recorrido con «Siguiente» y «Comenzar»; «Omitir» presente. `…tester`: cada título es el único header de su página | Comparación con el lienzo (M7) |
| CA6 «Siguiente» e indicador | Constructor: «Paso 1…4 de 4». `…tester`: `FlatList.scrollToIndex` llamado con `{index:1, animated:true}` y luego `{index:2,…}`; una sola marca activa, la de la página actual | — |
| CA7 Deslizar | Constructor: offset 2×ancho → «Paso 3 de 4». `…tester`: hacia la derecha (4→2→1); un offset a medias redondea (1,4 → «Paso 2») y uno fuera de rango se acota (9 → 4, −1 → 1) | Paso M2 **pendiente** |
| CA8 Comenzar/Omitir → login sin regreso | Constructor: Omitir en O2 y Comenzar en O4 → login, bandera guardada, la lista desmontada. `…tester`: tras los dos, **atrás de Android en el login llama a `exitApp`**, el login sigue y no hay renders nuevos de la bienvenida (no queda su oyente ni su ruta). «Omitir» funciona en las 4 páginas | Paso M4 **pendiente** |
| CA9 Doble pulsación → un guardado | Controller (constructor): dos `_terminar` seguidos. `…tester`: dos `_siguiente` en la última en el mismo tick; Omitir + Comenzar; doble pulsación **mientras el guardado está pendiente**; doble «Omitir» y doble «Comenzar» en la pantalla y en `NavegadorRaiz` → `guardar('hasSeenOnboarding')` una vez. «Siguiente» en O1–O3 y atrás no guardan | — |
| CA10 Fallo al guardar → se avanza; vuelve en el siguiente arranque | Constructor: caso de uso con `false` y segundo montaje tras Omitir → O1. `…tester`: lo mismo con «Comenzar». El oyente se avisa antes de que termine el guardado. Pulsar otra vez no reintenta. Con el guardado correcto, el segundo arranque va al login sin pintar O1 | Paso M6 **pendiente** |
| CA11 Splash espera a sesión **y** bandera, una vez | Constructor: bandera diferida → árbol vacío y splash sin ocultar. `…tester`: sesión diferida con la bandera ya leída; las dos diferidas en los dos órdenes; sesión guardada con la bandera diferida (no se pinta el inicio antes). El splash se oculta **1 sola vez** aunque luego se pase de la bienvenida al login o se cierre sesión | Paso M1 y M5 (sin destello) **pendientes** |
| CA12 Atrás: anterior en O2–O4, sale en O1 | `…tester`, con el BackHandler de Android: en O1 se llama a `exitApp` y sigue «Paso 1»; O3→O2→O1→sale; en O4 vuelve a O3 y el botón pasa a «Siguiente»; tras deslizar parte de la página deslizada; atrás no marca ni guarda la bandera; al desmontar se quita el oyente | Paso M3 **pendiente** |
| CA13 Claro/oscuro solo con tokens | `onboarding.estatico.test.ts` (constructor): sin hex en el módulo. `…estatico.tester`: sin `rgb()/hsl()`, sin colores con nombre, `fill`/`stroke` solo `{c.token}` o `"none"`, ilustraciones con `useTema()` y estilos de color solo con `tema.colores.*`. `…tester` de pantalla: colores SVG ∈ tokens del tema (oscuro y claro) y distintos entre temas; isotipo kids/corporate medido en el círculo; Nohemi y DM Sans; colores de texto e indicador por token | Paso M7 con `uimode night` **pendiente** |
| CA14 Accesibilidad | Constructor: roles y página no activa oculta. `…tester`: en cada una de las 4 páginas solo su título es `header`; «Omitir» y el botón principal con `minHeight`/`minWidth` ≥ 44; las 4 ilustraciones `accessible=false` y `no-hide-descendants`, ningún `image` accesible | TalkBack opcional en M3 |
| CA15 Configuración separada | `PAGINAS_ONBOARDING`: 4 entradas en orden, claves y títulos que salen de `textosOnboarding` | Revisión del aprobador |
| CA16 Sin dependencias ni almacén no cifrado | `git diff main -- package.json package-lock.json` sin cambios. La palabra solo aparece en `sesion.seguridad.test.ts` (el propio test). `onboarding.estatico.test.ts` y `sesion.seguridad.test.ts` en verde | — |
| CA17 Puerta en verde | `npm run calidad` sale con código 0 (sección 2) | CI del PR |

## 2. Salida de la puerta automática

`npm run calidad`, salida con código 0:

- `tsc --noEmit`: sin errores.
- `eslint .`: sin errores ni avisos (incluye boundaries).
- `prettier --check .`: «All matched files use Prettier code style!».
- `jest --coverage`: **40 suites y 685 tests en verde**, sin `console.error`.

| Carpeta | Stmts | Branch | Funcs | Lines | Umbral |
|---|---|---|---|---|---|
| Global | 99,2 | 96,81 | 96,47 | 99,41 | 70 ✔ |
| `modules/onboarding/domain/validations` | 100 | 100 | 100 | 100 | 90 ✔ |
| `modules/onboarding/aplications` (todas las subcarpetas) | 100 | 100 | 100 | 100 | 90 ✔ |
| `modules/onboarding/presentation` (pantalla, componentes, ilustraciones) | 100 | 100 | 100 | 100 | — |
| `app/navigation` | 100 | 90 | 100 | 100 | — |

`domain/entities` y `domain/models` solo tienen tipos (0 sentencias): Jest los lista al 0 % pero no cuentan para el umbral.

## 3. Fallos encontrados

**Ningún bloqueante.** Todos los criterios se cumplen en lo automatizable.

Observaciones (mejoras, no bloquean):

- **O1 · El test CA12 del constructor es frágil** (`src/modules/onboarding/__tests__/OnboardingScreen.test.tsx:108-140`). Llama a `oyentes[oyentes.length - 1]` en vez de simular el despacho del sistema. Con otro oyente registrado después (otra pantalla en la pila, un modal) probaría el oyente equivocado. Además, «en O1 no intercepta» se reduce a que ese oyente devuelva `false`. Ahora lo cubre el test con el BackHandler de Android. Se puede borrar o dejar como redundante.
- **O2 · El test CA2 del constructor muestrea el árbol** (`src/app/navigation/__tests__/NavegadorRaiz.onboarding.test.tsx:74-84`): solo dos veces, así que no prueba «en ningún render». Ahora lo cubre el contador de renders.
- **O3 · `_terminar` y el arranque no capturan un `guardar` que rechace** (`src/modules/onboarding/aplications/controllers/Onboarding.controller.ts:49` y `:87`). La promesa queda sin `catch`. No incumple ningún criterio: el plan (§ 4.2) fija que el `SecureStoragePort` nunca rechaza, y el adaptador Keychain devuelve `false`/`null` (lo prueba F1-03). Solo importaría si un adaptador futuro rompiera el contrato.
- **O4 · En claro, el acento y la marca activa son verde bosque**, no el negro del lienzo. Es la desviación aceptada en P7 (contraste AA). Conviene que M7 la confirme visualmente para no reportarla como fallo.

## 4. Verificación manual pendiente (teléfono por USB)

`adb devices` sale vacío, así que nada de esto se ejecutó. Preparación: `npm run android` (o instalar el APK de debug) con el teléfono conectado y la depuración USB activa.

| Paso | Cómo | Resultado esperado |
|---|---|---|
| M1 · Instalación limpia | `adb uninstall com.inglesconsebas.app`, instalar y abrir | Splash → O1 con fundido, **sin destello del login** entre medias |
| M2 · Deslizar | En O1 deslizar a la izquierda hasta O4 y volver a la derecha hasta O1 | Cada gesto cambia una página entera; el indicador y el botón («Siguiente»/«Comenzar») siguen la página |
| M3 · Atrás | Ir a O3 y pulsar atrás (botón o gesto) dos veces; luego otra vez en O1 | O3 → O2 → O1; en O1 la app se cierra (pasa a segundo plano) |
| M4 · Omitir | Reabrir (sigue en O1), «Omitir»; en el login, pulsar atrás | Login (animación de avance); atrás **sale de la app**, no vuelve a la bienvenida |
| M4b · Comenzar | `adb shell pm clear com.inglesconsebas.app`, abrir, llegar a O4 y pulsar «Comenzar» (probar doble toque rápido) | Login una sola vez, sin doble transición |
| M5 · Reabrir | Cerrar la app desde recientes y abrirla otra vez | Splash → login directamente, **sin destello de O1** |
| M6 · Borrar datos | `adb shell pm clear com.inglesconsebas.app` y abrir | Vuelve O1 |
| M7 · Claro y oscuro | `adb shell cmd uimode night yes`, abrir y capturar O1–O4 (`adb exec-out screencap -p > O1-dark.png`…); luego `adb shell cmd uimode night no` y capturar en claro | Comparar con el lienzo `E:\DATA\PROYECTOS\INGLES-REBRANDING\output\canvas-live\project\A-O1-Dark.dc.html` … `A-O4-Light.dc.html`: isotipo verde en oscuro y negro en claro, títulos en Nohemi, cuerpo en DM Sans, «28»/«LUN» de O2 con su fuente (R5), sin colores fuera de la paleta. En claro, acento verde bosque (P7) |
| M8 · Sesión sin bandera (CA4) | Instalar el APK de `main` (F1-03, sin bienvenida) e iniciar sesión (backend local con `adb reverse tcp:8080 tcp:8080`, ver el README). Instalar encima el de esta rama **sin desinstalar** (`adb install -r`) y abrir; luego «Cerrar sesión» | Abre en el inicio, sin O1; cerrar sesión lleva al login, no a la bienvenida |

## 5. Veredicto

**VERDE** en lo automatizable. La puerta pasa, la cobertura supera los umbrales (100 % en `onboarding/domain/validations` y `onboarding/aplications`) y cada criterio CA1–CA17 tiene pruebas automáticas que pasan, con casos de error. No hay fallos bloqueantes.

La verificación en el teléfono (sección 4) **sigue pendiente** porque no está conectado. Sobre todo M1/M5 (sin destello), M3/M4 (atrás real del sistema) y M7 (comparación visual con el lienzo). Conviene hacerla antes de distribuir el APK.
