**APROBADO**

# aprobacion.md · EXT-01 · Onboarding de bienvenida

> Aprobador, 2026-11-17, rama `feat/EXT-01-onboarding` (revisado hasta `e56e04e`). Revisión de solo lectura de `git diff main...HEAD` contra `plan.md`, `docs/ARQUITECTURA.md` y la checklist de `docs/CALIDAD.md`.

## Puerta automática

`npm run calidad` vuelto a ejecutar por el aprobador: **código de salida 0**.

- `tsc --noEmit`, `eslint .` (con boundaries) y `prettier --check`: sin errores.
- Jest: **40 suites y 685 tests en verde**, sin `console.error` ni avisos de `act`.
- Cobertura: global 99,2 / 96,81 / 96,47 / 99,41. `onboarding/domain/validations` y todas las carpetas de `onboarding/aplications` al 100 % (umbral 90 %). `domain/entities` y `domain/models` solo tienen tipos.
- `git diff main...HEAD -- package.json package-lock.json` vacío: no hay dependencias nuevas.

## Commits

Hay 10 commits en el orden del plan (§ 10), en Conventional Commits y uno por cambio coherente: plan, dominio, casos de uso, DI, controller, pantallas, navegación, docs, tests del tester y `pruebas.md`. El commit del tester (`63bfb62`) solo añade cuatro archivos `*.tester.test.ts(x)` y `e56e04e` solo añade `pruebas.md`: **el tester no tocó código de producción**.

## Checklist

| # | Punto | | Evidencia |
|---|---|---|---|
| 1 | Capas | ✔ | `domain` solo importa de `domain` (`onboarding.validations.ts:1`, `BanderaOnboarding.ts:1`). Los casos de uso son funciones que reciben el almacén y la bandera por parámetro (`arrancarOnboarding.ts:13`, `marcarOnboardingVisto.ts:15`). `OnboardingScreen` solo usa `useOnboardingController` para la lógica. El Keychain se usa por `SecureStoragePort` (`useNative('almacenSeguro')`). No hay imports entre `sesion` y `onboarding`: la composición vive en `src/app/navigation/rutaInicialRaiz.ts`. Boundaries en verde. |
| 2 | Convenciones | ✔ | `useOnboardingController`, `IOnboardingController` con métodos `_siguiente`, `_anterior`, `_alDesplazar` y `_terminar`, `*UseCase`, `Onboarding.entities.ts`, `OnboardingScreen.tsx`. Los imports entre carpetas usan `@/`. No hay `any` ni `eslint-disable` en el diff. |
| 3 | Criterios | ✔ | CA1–CA17 implementados y probados (tabla siguiente). No hay alcance de más: lo único fuera del paso 23 del plan es el ajuste de `carrerasSesion.test.tsx`, que obliga el tipo `IDependencias` (mejora M6). |
| 4 | Seguridad | ✔ | No toca el token, el PIN ni el 401. La bandera va en `SecureStoragePort`, nunca en el almacén no cifrado: `sesion.seguridad.test.ts` y `onboarding.estatico.test.ts` en verde. No hay secretos ni logs. |
| 5 | Errores | ✔ | No hay adaptador nuevo. Si leer falla, el puerto devuelve `null` → `pendiente` (`arrancarOnboarding.ts:22-27`). Si guardar falla, se avanza en silencio (P8, CA10). No hay mutación pedida por el usuario que necesite `notify`. |
| 6 | Accesibilidad e i18n | ✔ | «Omitir» es un `Pressable` con `accessibilityRole="button"`, etiqueta «Omitir la bienvenida» y `minHeight`/`minWidth = tema.toqueMinimo` (`OnboardingScreen.tsx:39-45`, `:107-118`). `Boton` pone rol y etiqueta. El título es `header` (`PaginaOnboarding.tsx:51`). Las ilustraciones son decorativas (`comun.ts:7-11`) y las páginas inactivas quedan ocultas (`PaginaOnboarding.tsx:47-48`). Todos los textos están en `onboarding.textos.ts`. |
| 7 | Tests | ✔ | Casos de uso con almacén en memoria y almacén falso (`casosDeUso.test.ts`), controller con `renderHook` y el contenedor de prueba, y pantalla y navegador. Hay casos de error: guardar devuelve `false`, valores guardados inválidos, lecturas diferidas en los dos órdenes, doble pulsación con el guardado pendiente y atrás con el `BackHandler` real de Android. |
| 8 | Nativo | ✔ | Sin permisos, dependencias ni pasos nativos nuevos (plan § 7). R1 (iOS conserva el Keychain) está documentado en `CLAUDE.md`. |
| 9 | Compatibilidad con la API | ✔ | La feature no consume API. |

## Criterios

| CA | Implementación | Test |
|---|---|---|
| CA1 | `rutaInicialRaiz.ts:26-28`, `NavegadorRaiz.tsx:75-76` | `NavegadorRaiz.onboarding.test.tsx`, `…onboarding.tester.test.tsx` |
| CA2 | `rutaInicialRaiz.ts:29`, `NavegadorRaiz.tsx:45-47` | `…onboarding.tester.test.tsx` (contador de renders de `OnboardingScreen` = 0) |
| CA3 | `rutaInicialRaiz.ts:23-25`, `NavegadorRaiz.tsx:49-52`, `:61` | `NavegadorRaiz.onboarding.test.tsx`, `rutaInicialRaiz.test.ts`, `…tester` (profe) |
| CA4 | `Onboarding.controller.ts:47-51` | `NavegadorRaiz.onboarding.test.tsx`, `Onboarding.controller.tester.test.tsx`, `…onboarding.tester.test.tsx` |
| CA5 | `onboarding.textos.ts`, `onboarding.config.ts:37-46` | `OnboardingScreen.test.tsx` |
| CA6 | `Onboarding.controller.ts:90-97`, `OnboardingScreen.tsx:66-68`, `IndicadorPaginas.tsx:33-49` | `OnboardingScreen.test.tsx`, `OnboardingScreen.tester.test.tsx` (`scrollToIndex`) |
| CA7 | `onboarding.validations.ts:24-35`, `OnboardingScreen.tsx:81-87` | `onboarding.validations.test.ts`, `OnboardingScreen.test.tsx`, `…tester` |
| CA8 | `NavegadorRaiz.tsx:61-85` (grupo por estado y `animationTypeForReplace: 'push'`) | `NavegadorRaiz.onboarding.test.tsx`, `…tester` (atrás en el login → `exitApp`) |
| CA9 | `Onboarding.controller.ts:81-89` (candado `useRef`) | `Onboarding.controller.test.tsx`, `…controller.tester.test.tsx`, `…onboarding.tester.test.tsx` |
| CA10 | `marcarOnboardingVisto.ts:16-22` | `casosDeUso.test.ts`, `NavegadorRaiz.onboarding.test.tsx` (segundo montaje → O1) |
| CA11 | `NavegadorRaiz.tsx:45-47` y `onReady` ya existente | `NavegadorRaiz.onboarding.test.tsx`, `…tester` (las dos lecturas diferidas en los dos órdenes; splash 1 vez con `{ fundido: true }`) |
| CA12 | `OnboardingScreen.tsx:71-79`, `Onboarding.controller.ts:99-106` | `OnboardingScreen.tester.test.tsx` (`BackHandler.android` real) |
| CA13 | Ilustraciones con `tema.colores.*`; `IlustracionBienvenida.tsx:7-9` | `onboarding.estatico.test.ts`, `…estatico.tester.test.ts`, `OnboardingScreen.tester.test.tsx` (ARGB pintado ∈ tokens) |
| CA14 | Ver el punto 6 de la checklist | `OnboardingScreen.test.tsx`, `…tester` |
| CA15 | `onboarding.config.ts` separado de `OnboardingScreen` | Revisado por el aprobador ✔; test del arreglo en `OnboardingScreen.test.tsx` |
| CA16 | Sin cambios en `package.json` | `sesion.seguridad.test.ts`, `onboarding.estatico.test.ts` |
| CA17 | — | `npm run calidad` en verde (arriba) |

## Hallazgos

**Bloqueantes: ninguno.**

**Mejoras** (no bloquean; quedan anotadas):

- **M1 · mejora** — `src/modules/onboarding/aplications/controllers/Onboarding.controller.ts:44`, `:49` y `:87`. Las promesas de `arrancarOnboardingUseCase` y `marcarOnboardingVistoUseCase` quedan sueltas, sin `catch`. Hoy no hay fallo, porque `SecureStoragePort` nunca rechaza por contrato (plan § 4.2). Pero si un adaptador futuro rompiera ese contrato, `arrancar` dejaría la bandera en `cargando` y el splash colgado. **Corrección:** marcar las llamadas con `void` y un `.catch` que, en el arranque, ponga `pendiente`, o bien envolver el `await` del caso de uso en `try/catch`.
- **M2 · mejora** — `src/app/navigation/NavegadorRaiz.tsx:48-52`. La ruta de inicio por rol se calcula dos veces: dentro de `rutaInicialRaiz` y otra vez en local para elegir el grupo. Las dos fuentes coinciden hoy, pero podrían divergir. **Corrección:** elegir el grupo a partir de `rutaInicial` (o hacer que `rutaInicialRaiz` devuelva también el flujo) para tener una sola fuente.
- **M3 · mejora** — `src/modules/onboarding/__tests__/OnboardingScreen.test.tsx:123`. El test de CA12 del constructor invoca «el último oyente registrado» de `BackHandler`. Es frágil y ya es redundante con el test del tester, que usa el `BackHandler` real de Android (O1 de `pruebas.md`). **Corrección:** borrarlo o reescribirlo con el despacho real.
- **M4 · mejora** — `src/app/navigation/__tests__/NavegadorRaiz.onboarding.test.tsx:62-84`. El test de CA2 del constructor solo muestrea el árbol dos veces, así que no prueba «en ningún render». Lo cubre ya el contador de renders del tester (O2 de `pruebas.md`). **Corrección:** dejar solo el del contador o marcarlo como redundante.
- **M5 · mejora** — `docs/features/EXT-01-onboarding/pruebas.md:80-94`. La verificación manual en el teléfono (M1–M8) no se hizo porque no había dispositivo conectado. No bloquea el merge, porque todos los CA tienen prueba automática en verde. Sí hay que hacerla **antes de distribuir el APK**: sobre todo M1/M5 (sin destello), M3/M4 (atrás real), M7 (comparación con el lienzo y R5, fuentes dentro del SVG) y M8 (sesión de F1-03 sin bandera). **Corrección:** ejecutar la sección 4 de `pruebas.md` y anotar el resultado.
- **M6 · mejora** — `src/modules/sesion/__tests__/carrerasSesion.test.tsx:18`. Este ajuste no figura en el paso 23 del plan. Es necesario, porque `IDependencias` exige ahora `banderaOnboarding`, y está anotado en la cabecera. Pero el import de `@/modules/onboarding/…` quedó después de uno de `@/modules/sesion/…`, fuera del orden alfabético del resto del archivo. **Corrección:** moverlo encima de los imports de `sesion` en el próximo cambio que toque el archivo.
