# pruebas.md · F1-04 · Rediseño animado de splash, onboarding y login

> Tester, 2026-11-17, rama `feat/F1-04-rediseno-animado` (constructor de `ffb89e9` a `b9af6cc`).
> Commit de tests: `1e5030f test(f1-04): splash que nunca se cuelga, sacudida del PIN, marca y
> reduce-motion`.

**Importante:** la verificación en el teléfono **no se hizo**: por instrucción no se tocaron Metro
(:8081) ni el dispositivo. Los pasos manuales para el moto g77 quedan en la sección 4.

Los casos se diseñaron a partir de CA1–CA22 del `plan.md`. Los tests del constructor se dejaron
como estaban. Los casos nuevos van en tres archivos `*.tester.test.tsx`, con 43 tests:

| Archivo | Tests | Qué refuerza |
|---|---|---|
| `src/app/splash/__tests__/SplashAnimado.tester.test.tsx` | 11 | CA7, CA8 y CA9: el splash se va siempre (restauración que llega durante el tope, que tarda más que el tope, que falla, bandera que no carga nunca, reduce-motion con tope); `alTerminar` que cambia de identidad; `listo` que vuelve a `false` durante la salida; una sola salida; toques bloqueados hasta la salida; colores por token |
| `src/modules/sesion/__tests__/LoginAnimado.tester.test.tsx` | 10 | CA16, CA18 y CA19 en el flujo real del controller: sacudida solo con un PIN errado nuevo; áreas táctiles; tarjeta y saludo con el teclado; reduce-motion |
| `src/shared/movimiento/__tests__/movimiento.tester.test.tsx` | 22 | CA4, CA5 y CA14: análisis estático de todo lo que toca F1-04, fronteras del kit, token `halo` y contraste sobre el halo, reduce-motion de punta a punta en onboarding y login |

### Técnicas que cambian respecto a los tests del constructor

- **CA18 (sacudida) en el flujo real.** El test del constructor monta `PuntosPin` suelto y le
  cambia `conError` a mano. El nuevo monta `LoginScreen` con el repositorio en memoria y escribe un
  PIN errado (`ana` + `9999`). Cuenta las llamadas a `withSequence` con **5** argumentos, que son
  los golpes de la sacudida. El pop de los puntos usa 3 y la carga 2, así que no se confunden. Hay
  cuatro escenarios:
  - PIN errado → 1 sacudida;
  - «Volver al usuario» y reentrar → 0;
  - escribir tras el error → 0, y un segundo PIN errado → 1;
  - un error de validación del usuario → 0.
- **CA8 (tope) con el reloj por pasos.** El temporizador del tope se programa en un efecto que
  depende del estado que pone el del mínimo. Un solo `advanceTimersByTime` gigante dentro de un
  `act` no deja correr ese efecto y el splash parece colgado, pero es un artefacto de la prueba. Los
  tests nuevos avanzan el reloj en pasos de 50 ms, cada uno en su `act`, como pasa en el
  dispositivo, con un margen de un paso.
- **Restauración «que falla».** El `SecureStoragePort` nunca rechaza: el adaptador Keychain
  devuelve `null` si falla. Así que el fallo se prueba como `null` inmediato, que lleva a la
  bienvenida tras el mínimo, y como lectura que tarda 6 s. En ese caso el splash sale por el tope y
  el login aparece al terminar la lectura. Un `leer` que rechace rompería el contrato del puerto. Al
  probarlo, deja una promesa sin manejar y `NavegadorRaiz` en `null`, que es lo mismo que pasaba
  antes de F1-04.
- **Contraste del halo.** Las opacidades del halo y del isotipo se leen con una expresión regular de
  `FondoMarca.tsx`, así que si cambian, el test las sigue. Se componen sobre `fondo` y se mide
  `relacionContraste` con `texto` y `textoSecundario`.
- **`interpolate` del mock.** El mock oficial de Reanimated lo deja vacío. Para el teclado (CA16) se
  sustituye por una interpolación lineal con recorte, como en `IndicadorPaginas.test.tsx`.

## 1. Matriz criterio → prueba

| CA | Pruebas automáticas (todas en verde) | Manual |
|---|---|---|
| CA1 Reanimated y worklets exactos, plugin al final | Revisión: `package.json` fija `react-native-reanimated` `4.7.1` y `react-native-worklets` `0.13.1` (sin `^`). En `compatibility.json`, la 4.7.x es compatible con RN 0.86–0.88 y con worklets 0.13.x. `react-native-worklets/plugin` es el último plugin de `babel.config.js` | — |
| CA2 Mocks oficiales y tests anteriores en verde | `jest.setup.ts` usa `react-native-reanimated/mock` y `react-native-worklets/src/mock`, y `jest.config.js` el resolver oficial. La puerta pasa con 47 suites y 765 tests (sección 2) | — |
| CA3 APK de debug y arranque sin crash | No automatizable | **M0 pendiente** |
| CA4 Kit en `shared/movimiento` con `index.ts` | Constructor: exportación desde el index. `…tester`: cada archivo del kit solo importa de `react`, `react-native`, reanimated, svg, `@/shared/…`, archivos hermanos y `assets/marca/logo.json`. `eslint .` (boundaries) en verde | — |
| CA5 Todo el kit respeta reduce-motion | Constructor: `Revelar`, `useSacudida`, `Boton`, `FondoMarca` y `PulsoCarga` con `useReducedMotion → true`. `…tester`: onboarding (claro y oscuro) y login completos con reduce-motion → **0** `withRepeat` y **0** `withSpring`; login → 0 sacudidas, también con un PIN errado. Splash con reduce-motion → sin resortes ni bucles (constructor). Ver **H3**: el parallax y el teclado no miran reduce-motion | M9 |
| CA6 `Boton` escala a 0.97 | Constructor: `withSpring(0.97)` al presionar y a 1 al soltar; con reduce-motion no escala pero sí baja la opacidad; tests de componentes de `Boton` en verde (alto 48, colores y roles) | — |
| CA7 Splash idéntico al nativo; oculta el bootsplash sin fundido; coreografía | Constructor: fondo `#000000`/`#FFFFFF`, logo de 160, eslogan de 7 palabras, `ocultar({fundido:false})` una vez. `…tester`: el fondo y el anillo salen de los tokens (`fondo` y `halo`) en los dos temas | **M1** (corte invisible) |
| CA8 Mínimo 1900 + restauración, tope 1200, reduce-motion 600 | Constructor: mínimo, espera, tope, reduce-motion y desmontaje. `…tester`, siempre con una sola salida: restauración durante el tope, sin segunda salida por el tope pendiente; reduce-motion sin restauración (sale tras 600 + 1200 + salida); `listo` que vuelve a `false` durante la salida (la salida sigue); `alTerminar` nuevo (se llama al último); peor caso total < 3.6 s | M1 |
| CA9 `NavegadorRaiz` conserva su contrato; navegación bajo el splash | Constructor: login montado debajo y splash fuera tras el mínimo; los tests de `NavegadorRaiz` de F1-03 y EXT-01 siguen en verde. `…tester`: Keychain que falla (`null`) → bienvenida tras el mínimo; restauración de 6 s → el splash sale por el tope, `NavegadorRaiz` no pinta mientras tanto y el login aparece al acabar; bandera que nunca carga → sale por el tope | M1 |
| CA10 `Animated.FlatList` con `scrollX`; `testID`, `onMomentumScrollEnd` y `scrollToIndex` | Tests de EXT-01 del onboarding (constructor y tester) en verde, sin cambios | M2 |
| CA11 Halo con el scroll, parallax y micro-animaciones O2–O4 | Solo visual. `…tester`: con reduce-motion, ningún bucle de las ilustraciones (`useBucleIlustracion` queda en reposo) | **M2** |
| CA12 Indicador interpolado 8→22 y color | Constructor (`IndicadorPaginas.test.tsx`): mitad de camino, parado, sin progreso y capas `pista`/`marca`. Tests de EXT-01: `marca-activa` y «Paso N de 4» | M2 |
| CA13 «Siguiente»→«Comenzar», atrás que aparece, «Omitir» con escala, entrada de O1 | Tests de pantalla de EXT-01 (botones, roles, «Comenzar» en O4, atrás) en verde. El atrás se oculta al lector en O1 | **M3** |
| CA14 Sin hex; colores nuevos como tokens | `onboarding.estatico*.test.ts` (EXT-01). `…tester` en todo lo que toca F1-04 (`shared/movimiento`, `app/splash`, presentación de onboarding y sesión, `Boton` y `Campo`): sin hex, `rgb()/rgba()/hsl()`, colores con nombre ni `fontWeight`. `fill`/`stroke` literales solo `none` o `url(#…)`. `halo` existe en los dos temas y es `paleta.verde`. Auditoría de marca: 0 hallazgos de marca (sección 2) | M7 |
| CA15 Hero, tarjeta anclada, `BotonTema` y entradas | Constructor: logo `header`, «Hola de nuevo» en Nohemi y subtítulo. `…tester`: áreas táctiles del paso usuario en claro y oscuro, `BotonTema` incluido (44) | **M4** |
| CA16 Tarjeta con el teclado; hero que se va; logo que viaja | `…tester`, con el teclado de 300: la tarjeta sube `-300`, el saludo queda en opacidad 0 y el logo no salta mientras no está medido. El viaje del logo depende de `onLayout` (b9af6cc) y el mock de Reanimated recrea los valores compartidos en cada render, así que no se puede medir en Jest | **M5** |
| CA17 Usuario ↔ PIN con deslizamiento según la dirección | No automatizable (`FadeInRight`/`FadeInLeft` son animaciones de layout; el mock no las ejecuta) | **M6** |
| CA18 Pop; sacudida y rojo 300 ms con un error nuevo | Constructor: `PuntosPin` aislado (pop, sacudida, rojo 300 ms, mismo error, reduce-motion). `…tester` en el flujo real: 1 sacudida y 4 `punto-error` en `peligro` con un PIN errado; **0** al volver al usuario y reentrar; **0** al escribir tras el error; 1 con el segundo PIN errado; 0 con un error de validación del usuario | **M6** |
| CA19 Teclas con escala y destello, `minHeight ≥ 64` | Tests de `LoginScreen` de F1-03 en verde. `…tester`: las 12 teclas tienen `minHeight` y `minWidth` ≥ 64, y el resto de lo pulsable del paso PIN (volver, ayuda) ≥ 44 | M6 |
| CA20 `PulsoCarga` con «Verificando tu PIN» | Constructor: `progressbar` ocupado con su etiqueta; test de F1-03 «Verificando tu PIN» en verde | M6 |
| CA21 `Campo`: borde a `marca` y de 1 a 2 px en 150 ms | Constructor: `onFocus`/`onBlur` reenviados y `withTiming(…, {duration: 150})` | **M4** |
| CA22 `npm run calidad` en verde con los umbrales | Sección 2 | CI del PR |

## 2. Salida de la puerta automática

`npm run calidad`, salida con código 0:

- `tsc --noEmit`: sin errores.
- `eslint .`: sin errores ni avisos (incluye boundaries).
- `prettier --check .`: «All matched files use Prettier code style!».
- `jest --coverage`: **47 suites y 765 tests en verde**. Antes de este commit había 44 suites y 722
  tests.

| Carpeta | Stmts | Branch | Funcs | Lines | Umbral |
|---|---|---|---|---|---|
| Global | 97,93 | 96,82 | 95,54 | 98,05 | 70 ✔ |
| `modules/sesion/domain/validations` y `domain` | 100 | 100 | 100 | 100 | 90 ✔ |
| `modules/sesion/aplications` (casos de uso) | 100 | 100 | 100 | 100 | 90 ✔ |
| `modules/sesion/aplications/controllers` | 98,91 | 94,44 | 100 | 98,9 | 90 ✔ |
| `modules/onboarding/domain/validations` y `aplications` | 100 | 100 | 100 | 100 | 90 ✔ |
| `shared/movimiento` | 100 | 96,42 | 100 | 100 | — |
| `app/splash` | 100 | 100 | 100 | 100 | — |
| `shared/components` | 100 | 98,43 | 100 | 100 | — |
| `modules/onboarding/presentation/screens` | 97,56 | 90 | 92,3 | 97,43 | — |
| `modules/sesion/presentation/components` | 94,8 | 98,11 | 92,59 | 94,8 | — |
| `modules/sesion/presentation/screens` | 74,5 | 87,5 | 70 | 74 | — (ver O3) |

`domain/entities` y `domain/models` solo tienen tipos (0 sentencias): Jest los lista al 0 %, pero no
cuentan para el umbral.

Comprobaciones de la marca:

- `node .claude/skills/ingles-con-sebas-brand/scripts/auditar-marca.mjs src`: **0 de marca** y 1 de
  mejora. Es `LimiteDeErrores.tsx:129`, el radio 16, una excepción documentada en la skill y
  anterior a F1-04.
- `node .claude/skills/ingles-con-sebas-brand/scripts/generar-tokens.mjs --comprobar`:
  «design-tokens.json al día».
- `scripts/contraste.mjs`, con el halo compuesto sobre el fondo (halo al 0.32 en oscuro y al 0.4 en
  claro, más el isotipo `marca` al 0.07):

| Par | Oscuro | Claro |
|---|---|---|
| `texto` sobre el centro del halo | 8.27:1 AAA | 16.46:1 AAA |
| `textoSecundario` sobre el centro del halo | **3.65:1 ✘** | **4.39:1 ✘** |
| `textoTenue` sobre el centro del halo | 1.85:1 ✘ | 3.01:1 ✘ |
| `textoSecundario` en la parada 0.55 (opacidad / 4) | ≥ 4.5 ✔ (test) | ≥ 4.5 ✔ (test) |
| Eslogan del splash (`textoSecundario`, halo al 0.16) | 7.03:1 AAA | 5.25:1 AA |
| `halo` sobre `fondo` (anillo decorativo) | 14.7:1 | 1.43:1 (decorativo, al 0.35) |

## 3. Fallos encontrados

**Ningún bloqueante.**

### Hallazgos

- **H1 · Mayor · RESUELTO en `b9af6cc`.** El logo no viajaba con el teclado
  (`LoginScreen.tsx`, `medirLogo`, antes de `b9af6cc`). `onLayout` estaba en la vista hija de
  `Revelar`, así que `y` era siempre 0. Con la `Marca` de 200 (102,6 de alto), el destino era
  `-max(51,3 − 48, 0) ≈ −3 dp`. El logo solo se achicaba, y la tarjeta elevada lo tapaba en parte.
  Lo detecté durante la prueba y, al mismo tiempo, entró el commit `b9af6cc`, que mide hero, logo y
  tarjeta en el contenido. El nuevo cálculo no se puede ejercer en Jest (ver O3): queda para **M5**.
- **H2 · Menor · `textoSecundario` sobre el centro del halo no llega a AA**
  (`src/shared/movimiento/FondoMarca.tsx:43`, `OPACIDAD_HALO = { oscuro: 0.32, claro: 0.4 }`).
  - **Esperado:** texto normal ≥ 4.5:1 (marca § 2.6).
  - **Ocurre:** en el peor caso, el centro del halo con el isotipo encima, da 3.65:1 en oscuro y
    4.39:1 en claro (tabla de la sección 2).
  - **Dónde puede pasar:** en el login, el halo está centrado al 24 % del alto
    (`alturaHalo={0.24}`). En el paso PIN la tarjeta ocupa unos 660 dp, el hero se comprime y el
    subtítulo del hero (`textosSesion.hero.subtitulo`) puede caer cerca del centro del halo. Además, el
    halo respira hasta 1.08. En el onboarding, la descripción queda lejos del centro (≈ 0.66 del
    radio) y pasa.
  - **Reproducir:** M4 y M6 en oscuro, con una captura y un cuentagotas sobre el fondo detrás del
    subtítulo.
  - **Propuesta:** bajar la opacidad del centro (≈ 0.2 en oscuro) o alejar el halo del texto.
- **H3 · Menor · El parallax, el atrás que aparece y el hero con el teclado no miran
  reduce-motion.**
  - **Esperado:** con «Quitar animaciones», solo fundidos (plan § 2: «Reduce-motion en todo»;
    WCAG 2.3.3).
  - **Ocurre:** se siguen desplazando y escalando:
    - `src/modules/onboarding/presentation/components/PaginaOnboarding.tsx:91`
      (`estiloIlustracion`: translateX ±40 y escala 0.9→1) y `:109` (`estiloTexto`: desfase
      ±0.18·ancho);
    - `src/modules/onboarding/presentation/screens/OnboardingScreen.tsx:174` (`estiloBotonAtras`:
      translateX y escala 0.72→1);
    - `src/modules/sesion/presentation/screens/LoginScreen.tsx:185` (`estiloTextosHero`:
      translateY −46 y escala 0.95) y `:199` (`estiloLogo`).
  - **Matiz:** son movimientos que sigue el dedo o el teclado, no bucles autónomos. Que la tarjeta
    suba con el teclado es funcional y debe quedarse. CA5 (el kit) sí se cumple.
  - **Reproducir:** M9.
- **H4 · Menor · Los bucles de las ilustraciones corren en las 4 páginas a la vez**
  (`src/modules/onboarding/presentation/components/ilustraciones/animacion.ts:27`, `withRepeat` con
  `-1`).
  - **Ocurre:** el `FlatList` monta las 4 páginas, así que las micro-animaciones de O2–O4 giran
    también fuera de la pantalla mientras dura la bienvenida.
  - **No es una fuga:** `useSharedValue` de Reanimated 4.7.1 llama a `cancelAnimation` al
    desmontar (`node_modules/react-native-reanimated/src/hook/useSharedValue.ts`), y lo mismo vale
    para el halo de `FondoMarca`, el splash y `PulsoCarga`.
  - **Matiz:** `mobile-patterns.md` pide «nada en bucle salvo el halo y la carga», pero CA11 las
    pide explícitamente.
  - **Propuesta:** animar solo la página activa (`activa`) para ahorrar batería.
- **H5 · Menor · El fundido del splash con reduce-motion dura 340 ms**
  (`src/app/splash/SplashAnimado.tsx:241`). `mobile-patterns.md` fija que con reduce-motion «queda
  solo un fundido de 200 ms» (`duraciones.fundidoCorto`).
- **H6 · Mejora · Valores fuera de los tokens.**
  - `LoginScreen.tsx:79`: `saludo` con `fontSize: 34, lineHeight: 40` sueltos, fuera de las
    variantes de `Texto`.
  - `SplashAnimado.tsx:66`: `columnGap: tema.espaciado.xs + 1` (5), fuera de la escala de
    espaciado.

### Observaciones

- **O1 · Con una restauración colgada, tras el tope se ve el fondo del tema en blanco.**
  `NavegadorRaiz` devuelve `null` mientras restaura (contrato de CA9) hasta que termina la lectura.
  Antes de F1-04, el splash nativo se quedaba en pantalla. Ahora el JS sale a los ~3.6 s y queda el
  fondo liso. Está probado («si la restauración tarda más que el tope…»). Solo pasa si el Keychain
  tarda más de ~3.6 s.
- **O2 · Aviso intermitente de `act()`** en `src/modules/onboarding/__tests__/OnboardingScreen.tester.test.tsx`
  (EXT-01): «An update to VirtualizedList … not wrapped in act». Salió una vez con la suite
  completa en paralelo y no se reproduce suelto (3 de 3 limpias). No rompe la puerta.
- **O3 · La cobertura de `sesion/presentation/screens` baja al 74,5 %.** El cálculo del logo
  viajero (`b9af6cc`) usa medidas de `onLayout` guardadas en valores compartidos, y el mock oficial
  de Reanimated crea un `useSharedValue` nuevo en cada render, así que esas ramas no se ejecutan en
  Jest. No hay umbral por carpeta para la presentación; el global queda en 97,93 %.
- **O4 · Sin fugas de animaciones en bucle.** Todos los `withRepeat(…, -1)` (halo, deriva del
  isotipo, `PulsoCarga`, splash e ilustraciones) se cancelan al desmontar por el `cancelAnimation`
  de `useSharedValue`. Los `setTimeout` del splash (mínimo, tope y salida) y el rojo de `PuntosPin`
  se limpian en el desmontaje (probado: desmontar el splash antes de tiempo no llama a
  `alTerminar`).

## 4. Verificación manual pendiente (moto g77, por USB)

Preparación:

1. `ENVFILE=.env.dispositivo node scripts/gradle.mjs app:assembleDebug`.
2. `adb reverse tcp:8080 tcp:8080` y `adb reverse tcp:8081 tcp:8081`.
3. Metro con `--reset-cache`, porque cambió Babel.
4. Instalación limpia: `adb uninstall com.inglesconsebas.app` y luego instalar el APK.
5. Para grabar: `adb shell screenrecord /sdcard/f104.mp4` y luego `adb pull`.

| Paso | Cómo | Resultado esperado |
|---|---|---|
| M0 · Arranque (CA3) | Abrir la app con `adb logcat *:E ReactNativeJS:V` | Sin crash ni errores de Reanimated o worklets |
| M1 · Splash (CA7, CA8) | Abrir en frío varias veces, en oscuro y en claro | El paso del splash nativo al JS **no se nota**: mismo fondo y logo de 160 en el mismo sitio. Después el halo crece, el anillo irradia una vez, el logo baja y rebota, y el eslogan entra palabra por palabra. Sale con el logo a 1.12 y un fundido. Dura **menos de 2.5 s** con el backend respondiendo |
| M2 · Onboarding (CA10–CA12) | `adb shell pm clear com.inglesconsebas.app`, abrir y deslizar **despacio** O1→O4 y vuelta | El halo se desplaza con el dedo. La ilustración hace parallax (±40, escala y opacidad) y el texto va desfasado. El indicador se estira de 8 a 22 sin saltos. O2: la tarjeta flota. O3: las burbujas entran escalonadas. O4: el check se dibuja. Fluidez a 60 fps |
| M3 · Botones del onboarding (CA13) | En O1, mirar la entrada. Deslizar a O2 y usar el atrás en pantalla. Llegar a O4. Mantener pulsado «Omitir» | La entrada de O1 va escalonada: logo, ilustración y título, texto, pie. El atrás aparece al deslizar desde O1 y no está en O1. «Siguiente» → «Comenzar» con fundido cruzado. «Omitir» se encoge al pulsarlo |
| M4 · Login (CA15, CA21, H2) | Entrar al login en oscuro, tocar el campo «Usuario» y alternar el tema con el botón de arriba a la derecha | Fondo con el halo que respira y el isotipo grande al fondo. Hero con logo, «Hola de nuevo» y subtítulo. Tarjeta abajo con radio 26, borde verde translúcido y asa. Las entradas van escalonadas. Al enfocar, el borde pasa a verde y a 2 px. **H2:** capturar y medir el contraste del subtítulo sobre el halo |
| M5 · Teclado (CA16, H1) | Con el campo enfocado, abrir y cerrar el teclado; repetir en el paso PIN si hay campo | La tarjeta sube pegada al teclado y no queda tapada. El saludo se desvanece. El **logo sigue visible**: viaja al hueco entre la barra y la tarjeta y se achica, sin quedar debajo de la tarjeta (fix `b9af6cc`). Al cerrar el teclado vuelve todo a su sitio |
| M6 · Usuario ↔ PIN y error de PIN (CA17–CA20) | Usuario `ana` → «Continuar». Escribir `9999`. Luego «Volver al usuario» y «Continuar» otra vez. Después `1234` (backend local) | El PIN entra desde la derecha y el usuario vuelve desde la izquierda. Cada punto hace pop. Al fallar, los puntos **se sacuden una vez** y se ven en rojo unos 300 ms. Al volver al usuario y reentrar **no** se sacuden. Las teclas se encogen y destellan. Mientras se verifica, el pulso de carga cubre la tarjeta con «Verificando tu PIN» |
| M7 · Claro y oscuro (CA14) | `adb shell cmd uimode night yes`, abrir y capturar splash, O1–O4, el usuario y el PIN. Repetir con `night no` | Las dos versiones se leen bien. En claro, el halo es un verde suave sobre blanco y el texto sigue legible. Ningún color fuera de la paleta o de los tokens |
| M8 · Áreas táctiles | Pulsar con el pulgar el botón de tema, «Omitir», el atrás, las teclas y «¿Olvidaste tu PIN?» | Ningún toque falla. Las teclas son grandes (≥ 64 dp) |
| M9 · «Quitar animaciones» (CA5, H3) | Ajustes → Accesibilidad → Color y movimiento → **Quitar animaciones**. Repetir M1, M2, M5 y M6 | Splash corto (~1 s) que solo funde, sin halo ni resortes. Halo e isotipo quietos y sin bucles en las ilustraciones. Sin sacudida ni pop: el error se ve en rojo. **H3:** anotar si el parallax del onboarding, el atrás y el hero con el teclado se siguen desplazando |

## 5. Veredicto

**VERDE.** La puerta pasa con 47 suites y 765 tests, y supera los umbrales. Cada criterio
automatizable tiene pruebas en verde, con escenarios de error. El splash se va siempre: tras el
mínimo, con la restauración, por el tope o con reduce-motion. La sacudida del PIN solo sale con un
error nuevo. No hay hex ni `fontWeight`. Las áreas táctiles cumplen y no hay fugas de bucles. No
hay hallazgos bloqueantes.

El único mayor (H1) ya está resuelto en `b9af6cc`. Quedan cuatro menores y una mejora, H2 a H6,
para que el usuario decida. H2 (contraste) y H3 (reduce-motion en el parallax) conviene mirarlos
en el dispositivo.

La verificación en el teléfono (sección 4) **sigue pendiente**. Sobre todo M0 (CA3), M1 (corte
invisible), M5 (logo con el teclado) y M9 (reduce-motion). Conviene hacerla antes de distribuir el
APK.
