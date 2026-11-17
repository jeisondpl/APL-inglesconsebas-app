# Plan · F1-04 · Rediseño animado de splash, onboarding y login

> Plan aprobado por el usuario el 2026-11-17 (`/feature F1-04-rediseno-animado`), copiado aquí por el
> **constructor** en la rama `feat/F1-04-rediseno-animado` (sale de `main` en `eea6704`, que ya
> incluye F1-01b, F1-03 y EXT-01).
> Estado: APROBADO. Decisiones del usuario: **Reanimated 4** como motor y **fondo de marca
> animado** (sin fotos).

## 0. Definition of Ready: estado

| Punto | Estado |
|---|---|
| Código de tablero | ✔ F1-04 (descripción del usuario: «el login y el onboarding se ven muy básicos») |
| Criterios verificables | ✔ Sección 3: cada criterio tiene un test o un paso manual |
| Dependencias identificadas | ✔ Sin API. Nativo nuevo: `react-native-reanimated` 4 y `react-native-worklets` (nueva arquitectura, ya activa). Se reutilizan `react-native-svg` y `react-native-bootsplash`. |
| API inexistente → adaptador en memoria | No aplica: solo capa de presentación. |
| `plan.md` aprobado | ✔ 2026-11-17 |

## 1. Resumen

Hoy el splash es solo el nativo (bootsplash), el onboarding es un `FlatList` estático y el login es
un formulario plano (opacidad 0.7 al pulsar, sin transiciones). Se rediseñan las tres pantallas con
el estilo y las animaciones del login de **APL-Livic-movil** (Reanimated 3 allí; aquí Reanimated 4):
splash coreografiado, entradas escalonadas, tarjeta oscura anclada abajo, logo que viaja con el
teclado, sacudida en el error, escala al pulsar y overlay de carga que respira.

Fondo de marca animado y sin fotos: halo verde (#86EF86) que respira, isotipo grande difuminado y
gradiente SVG hacia el fondo del tema.

**Controladores y casos de uso no cambian**: todo es capa de presentación, `src/shared` y `src/app`.

## 2. Alcance

**Entra**

- Fase 0: Reanimated 4 + worklets, plugin de Babel, mock de Jest, APK que arranca.
- Fase 1: kit de movimiento compartido en `src/shared/movimiento/` y press-scale en `Boton`.
- Fase 2: splash animado en JS que continúa al nativo sin corte.
- Fase 3: onboarding animado (scroll compartido, parallax, indicador interpolado, micro-animaciones
  en las ilustraciones, botón atrás que aparece con el scroll).
- Fase 4: login rediseñado (hero + tarjeta anclada, teclado, transición usuario ↔ PIN, pop y
  sacudida de los puntos, teclas con escala y destello, overlay de carga, foco animado en `Campo`).
- Reduce-motion en todo: con «Quitar animaciones» activo, solo fundidos cortos.

**No entra**

- Cambios en controladores, casos de uso, dominio, API o navegación por estado.
- Fotos o vídeo de fondo.
- Animaciones del inicio provisional o del escaparate.
- iOS: queda pendiente el `pod install` (sin Mac), como en las features anteriores.

## 3. Criterios de aceptación

| # | Criterio | Cómo se verifica |
|---|---|---|
| CA1 | `react-native-reanimated` y `react-native-worklets` instalados con versión exacta y compatible con RN 0.88.1; `react-native-worklets/plugin` es el último plugin de `babel.config.js`. | `package.json`, `babel.config.js`; `compatibility.json` del paquete. |
| CA2 | Jest usa los mocks oficiales de reanimated y worklets; todos los tests existentes siguen en verde. | `npm run calidad`. |
| CA3 | El APK de debug compila (`ENVFILE=.env.dispositivo node scripts/gradle.mjs app:assembleDebug`) y la app arranca sin crash con la nueva arquitectura. | Build local + `adb logcat` en el dispositivo. |
| CA4 | El kit `src/shared/movimiento/` solo importa de `shared` y se exporta por un `index.ts`: tokens de movimiento, `Revelar`, `usePresionEscala`, `useSacudida`, `FondoMarca` y `PulsoCarga`. | ESLint (boundaries) y tests del kit. |
| CA5 | Todo el kit respeta `useReducedMotion()`: con reduce-motion no hay desplazamientos ni escalas, solo fundidos cortos. | Tests del kit con `useReducedMotion` → `true`. |
| CA6 | `Boton` escala a 0.97 al presionar, sin perder `minHeight ≥ 44`, colores, roles ni props. | Test de componentes; tests existentes de `Boton`. |
| CA7 | El splash JS arranca idéntico al nativo (fondo `#FFFFFF` en claro, `#000000` en oscuro, logo de 160 dp centrado), oculta el bootsplash sin fundido al montarse y ejecuta la coreografía de Livic: halo, anillo, logo con spring, eslogan «Aprender inglés; nunca se sintió tan cercano.» palabra por palabra y salida con el logo a 1.12 y fundido. | Test del splash; prueba manual (corte invisible). |
| CA8 | El splash JS llama a `alTerminar` solo tras la duración mínima (1900 ms) **y** la restauración de sesión y bandera, con un tope de 1200 ms de espera extra; con reduce-motion, el mínimo es 600 ms y solo hay fundido. | Test con fake timers. |
| CA9 | `NavegadorRaiz` conserva su contrato (no pinta mientras restaura, oculta el splash nativo una sola vez); la navegación se monta debajo del splash JS. | Tests existentes de `NavegadorRaiz` sin cambios. |
| CA10 | Onboarding: `Animated.FlatList` con `useAnimatedScrollHandler` y `scrollX` compartido; se conservan `testID lista-onboarding`, `onMomentumScrollEnd` y `scrollToIndex`. | Tests existentes del onboarding. |
| CA11 | Onboarding: `FondoMarca` detrás de las páginas con el halo que se desplaza con el scroll; parallax de la ilustración (translateX ±40, escala 0.9→1, opacidad) y desfase del texto; micro-animaciones en O2–O4 (tarjeta que flota, burbujas escalonadas, check que se dibuja). | Prueba manual en el dispositivo. |
| CA12 | `IndicadorPaginas`: ancho 8→22 y color interpolados con `scrollX`; se mantienen `marca-activa`, «Paso N de 4» y los colores por token. | Tests existentes + test nuevo del indicador. |
| CA13 | Onboarding: «Siguiente» → «Comenzar» con fundido cruzado; botón atrás que aparece con el scroll (patrón `backReveal`); «Omitir» con press-scale; entrada inicial de O1 escalonada. | Tests de pantalla (botones y roles); manual. |
| CA14 | Ningún color hex en `src/modules/**` ni en las pantallas; los colores nuevos (halo, borde translúcido de la tarjeta) son tokens de `temas.ts` en claro y oscuro. | `onboarding.estatico*.test.ts`; test de tokens. |
| CA15 | Login: `FondoMarca` a pantalla completa, hero (logo `Marca` + «Hola de nuevo» en Nohemi + subtítulo), tarjeta oscura anclada abajo (radio 28, borde 1.5 px de marca translúcido, asa 44×4) con `PasoUsuario`/`PasoPin`, y `BotonTema` arriba a la derecha. Entradas escalonadas con `Revelar`. | Test de pantalla (textos, roles); manual. |
| CA16 | Login: la tarjeta sube con el teclado (`useAnimatedKeyboard`), el texto del hero se desvanece y el logo viaja arriba al centro a escala 0.75. | Manual en el dispositivo. |
| CA17 | Login: transición usuario ↔ PIN con deslizamiento horizontal y fundido según la dirección. | Manual. |
| CA18 | `PuntosPin`: pop al llenarse; en error (transición de `error` null → texto con `paso==='pin'`) sacudida de los puntos y puntos en rojo 300 ms. | Test de `PuntosPin`/login; manual. |
| CA19 | `TecladoPin`: press-scale y destello por tecla, con `minHeight ≥ 64`, colores y etiquetas intactos en el `Pressable`. | Tests existentes de `LoginScreen`. |
| CA20 | `PulsoCarga` sobre la tarjeta mientras `cargando`, con la etiqueta «Verificando tu PIN». | Test existente («Verificando tu PIN»). |
| CA21 | `Campo`: el borde pasa a `marca` y de 1 a 2 px al enfocar (150 ms). | Test de componentes; manual. |
| CA22 | `npm run calidad` en verde con los umbrales (70 % global, 90 % en `domain`/`aplications`). | CI y local. |

## 4. Fases y archivos

### Fase 0 · Infraestructura de animación

- Instalar `react-native-reanimated@4.x` + `react-native-worklets` (versión compatible con RN
  0.88.1 según `compatibility.json`), con `--save-exact`.
- `babel.config.js`: `'react-native-worklets/plugin'` al final.
- `jest.setup.ts`: mocks oficiales (`react-native-reanimated/mock`, `react-native-worklets/src/mock`).
  `transformIgnorePatterns` ya cubre `react-native-*`.
- Recompilar con `node scripts/gradle.mjs app:assembleDebug` y comprobar el arranque.
- Documentar la dependencia en `docs/ARQUITECTURA.md` y `CLAUDE.md` (pod install pendiente sin Mac).

### Fase 1 · Kit de movimiento compartido (`src/shared/movimiento/`)

Solo importa de `shared`. Todo respeta `useReducedMotion()`.

- `movimiento.tokens.ts`: duraciones y springs de Livic (entrada 420 ms, spring
  `{damping:16, stiffness:140}`, press `{damping:14, stiffness:220}`, shake 5×55 ms…).
- `Revelar.tsx`: opacidad + translateY 20→0 con `retraso` (como `Reveal` de Livic).
- `usePresionEscala.ts`: escala 0.97 con spring al presionar.
- `useSacudida.ts`: sacudida horizontal (-8, 8, -6, 6, 0).
- `FondoMarca.tsx`: fondo del tema, halo verde que respira 1↔1.08 (1600 ms), isotipo grande al
  6–8 % de opacidad con deriva lenta, gradiente SVG hacia el fondo. Colores solo de tokens.
- `PulsoCarga.tsx`: overlay de carga (logo que respira 1↔1.06 + anillo que gira 1100 ms).
- `Boton`: press-scale manteniendo `minHeight ≥ 44`, colores y props.

### Fase 2 · Splash animado en JS

- `src/app/splash/SplashAnimado.tsx`: arranca idéntico al bootsplash y ejecuta la coreografía de
  `SplashScreen.tsx` de Livic (halo 0→0.16 + escala 0.55→1 y respira, anillo con delay 420 ms, logo
  spring 0.85→1, eslogan palabra por palabra con delay 620 + i·80, salida logo →1.12 y fundido).
- Mínimo 1900 ms y espera a `restaurando`/`cargando` (tope 1200 ms extra). Reduce-motion: 600 ms,
  solo fundido.
- Composición en `src/app`: el splash JS se pinta encima de `NavegadorRaiz` y oculta el bootsplash sin
  fundido al montarse.

### Fase 3 · Onboarding (`src/modules/onboarding/presentation/`)

- `Animated.FlatList` + `useAnimatedScrollHandler` → `scrollX`.
- `FondoMarca` detrás; halo interpolado con `scrollX`.
- `PaginaOnboarding`: parallax de la ilustración y desfase del texto.
- Ilustraciones O2–O4 con micro-animaciones (`Animated.createAnimatedComponent` sobre
  `react-native-svg`).
- `IndicadorPaginas` interpolado; botón «Siguiente»/«Comenzar» con fundido cruzado; atrás que aparece
  con el scroll; «Omitir» con press-scale; entrada de O1 escalonada (100/250/380/600 ms).

### Fase 4 · Login (`src/modules/sesion/presentation/`)

- Hero + tarjeta oscura anclada con `FondoMarca`; `BotonTema` arriba a la derecha.
- `Revelar` escalonado (hero 0, textos 90, tarjeta 200 ms).
- `useAnimatedKeyboard`: la tarjeta sube, el hero se desvanece y el logo viaja (versión simplificada
  del `logoSlot` medido de Livic).
- Transición usuario ↔ PIN; `PuntosPin` con pop, sacudida y rojo; `TecladoPin` con escala y destello
  en una capa interna; `PulsoCarga` mientras `cargando`; `Campo` con borde animado al enfocar.
- Textos nuevos en `sesion.textos.ts` («Hola de nuevo» y subtítulo).

## 5. Riesgos

- **R1 · Reanimated 4 exige la nueva arquitectura.** Ya está activa (Fabric). Si el build falla, se
  revisan las versiones de `compatibility.json`.
- **R2 · Metro con caché vieja.** Al cambiar Babel hay que reiniciar Metro con `--reset-cache`.
- **R3 · Tests que leen estilos planos.** Los estilos animados van en capas internas para no romper
  `estiloPlano` de los tests de F1-03 y EXT-01.
- **R4 · Éxito del login.** La navegación cambia por estado en cuanto la sesión pasa a
  `autenticado`; el pulso de salida es tan corto como permita ese cambio.
- **R5 · iOS.** `pod install` de reanimated y worklets pendiente sin Mac.

## 6. Commits previstos

1. `docs(F1-04): plan de implementación aprobado`
2. `build(f1-04): reanimated 4 y worklets`
3. `feat(f1-04): kit de movimiento compartido`
4. `feat(f1-04): splash animado`
5. `feat(f1-04): onboarding animado`
6. `feat(f1-04): login rediseñado con animaciones`

Después, en sus etapas: `test(F1-04)` y `pruebas.md` del tester, `aprobacion.md` y el merge.

## 7. Verificación

1. `npm run calidad` en verde.
2. Tests nuevos: kit de movimiento (reduce-motion, sacudida, press-scale), splash (`alTerminar` tras
   el mínimo y la restauración), indicador, ningún hex en módulos.
3. APK: `ENVFILE=.env.dispositivo node scripts/gradle.mjs app:assembleDebug`, `adb reverse`
   8080/8081, instalación limpia en el moto g77.
4. Manual: splash (< 2.5 s, sin corte), onboarding deslizando lento, login (entrada, teclado, PIN
   errado, carga, éxito), claro/oscuro, «Quitar animaciones» en Android, fluidez a 60 fps.
5. Vídeo de pantalla (`adb shell screenrecord`) para enseñar a Sebas.
