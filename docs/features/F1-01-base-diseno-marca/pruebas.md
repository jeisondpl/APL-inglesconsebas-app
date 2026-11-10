# Pruebas · F1-01 · Base técnica (alcance reducido, sección 0 del plan)

> Tester · 2026-11-09 · rama `feat/F1-01-base-diseno-marca`

**Veredicto: ROJO, solo por CA2.** Hay 120 tests y todos pasan. La cobertura global es del 100 % y la puerta en local está en verde. CA2 no se pudo comprobar porque no había ningún emulador ni dispositivo conectado. No hay fallos de código.

## 1. Matriz criterio → prueba

| CA | Archivo o verificación | Resultado |
|---|---|---|
| CA1 | `npm run calidad` | ✅ En verde en local. Cobertura: 100 % de líneas y 98,83 % de ramas. Los jobs del CI se verán en el PR. |
| CA2 | Paso manual (abajo) | ⏳ Pendiente: `adb devices` no devolvió ningún dispositivo. |
| CA3 | Imports con `@/` en todo el código, más un archivo temporal `src/shared/temporalCa3.ts` que importa `@/app/providers` | ✅ ESLint marca `boundaries/dependencies` («shared no puede importar de app») y sale con código 1. El archivo se borró. Metro se comprueba junto con CA2. |
| CA4–CA8 | — | Aplazado |
| CA9 | `src/shared/lib/__tests__/api.test.ts` (51 tests) | ✅ |
| CA10 | `notify.test.ts` y `src/app/__tests__/App.test.tsx` | ✅ |
| CA11 | `src/app/di/__tests__/DependenciasProvider.test.tsx` y `App.test.tsx` | ✅ |
| CA12, CA13 | — | Aplazado |
| CA14 | Revisión con grep | ✅ |
| CA15 | — | Aplazado |
| CA16 | `src/app/providers/__tests__/LimiteDeErrores.test.tsx` y `App.test.tsx` | ✅ |
| CA17 | `src/app/inicio/__tests__/InicioProvisionalScreen*.test.tsx` y `App.test.tsx` | ✅ |
| CA18 | `src/app/navigation/__tests__/NavegadorRaiz.test.tsx` | ✅ |
| — | `utils.test.ts` y `entorno.test.ts` | ✅ |

**Detalle de los casos**

- **CA9, `Authorization`**
  - Añade `Bearer` cuando hay token.
  - No lo añade si el token es `null`, si falta `obtenerToken` o si el token está vacío.
  - Si `obtenerToken` falla, de forma asíncrona o síncrona, la petición sale sin token.
- **CA9, 401**
  - Llama a `alNoAutorizado` exactamente una vez y devuelve `{error, msg, code:401}`.
  - Funciona igual con el cuerpo vacío o con un cuerpo que no es JSON.
  - Con 200, 403 o 500 no llama a `alNoAutorizado`.
  - Sin `alNoAutorizado` no lanza.
- **CA9, errores de Leap**
  - `{error:"…"}` con estado 4xx o 5xx se convierte en `msg` y `code`.
  - Si el error no es válido, se usa un mensaje según el estado.
  - Un 502 que devuelve HTML se resuelve como error de servidor.
- **CA9, fallo de red**
  - Si `fetch` rechaza o lanza, devuelve código 0.
  - Si falla la lectura del cuerpo, devuelve error y no lanza.
- **CA9, tiempo límite** (con temporizadores falsos)
  - A los 14 999 ms todavía no hay resultado.
  - A los 15 000 ms devuelve código 0, el mensaje de tiempo agotado y la petición queda abortada.
  - Respeta `tiempoLimiteMs`.
  - No quedan temporizadores pendientes.
- **CA9, respuestas 2xx**
  - Funcionan 200, 201 y 204 con el cuerpo vacío.
  - Un 200 que no es JSON devuelve `respuestaInvalida` con código 200.
  - Un `{error}` con estado 200 se trata como éxito. Así queda documentado el riesgo R8.
- **CA9, URL**
  - Construye bien la query, omitiendo los `undefined`, codificando los valores y uniendo con `&` cuando ya hay `?`.
  - No duplica barras.
  - En los POST envía JSON con `Content-Type`. Sin cuerpo, no envía ni el body ni la cabecera.
- **CA10**
  - Los cuatro tipos de `notify` llaman a `Toast.show` con el tipo y los textos.
  - `fromError` funciona con un `HttpResponse`, un `Error` y valores desconocidos.
  - El host pinta el tipo `warning`.
- **CA11**
  - `useRepository` y `useNative` usan el valor inyectado.
  - Si falta una clave o falta el provider, el error es descriptivo.
  - `crearDependencias()` apunta a `API_URL` y no envía Bearer.
  - Un 401 del cliente real no lanza.
- **CA14**
  - `android/app/build.gradle:120,122` (`namespace` y `applicationId`).
  - `project.pbxproj:279,308` (`PRODUCT_BUNDLE_IDENTIFIER`) y `:273,302` (`MARKETING_VERSION = 0.1.0`).
  - `Info.plist:7-8`: `CFBundleDevelopmentRegion=es`, sin `NS*UsageDescription` y sin cadenas vacías.
  - `docs/DISTRIBUCION.md:90-116`: cuentas de tienda.
- **CA16**
  - El fallback muestra un header, el mensaje y el botón «Reintentar» con role, label, hint y `minHeight` ≥ 44.
  - Llama a `alCapturar`.
  - Al reintentar, vuelve a montar el contenido; si el error persiste, muestra otra vez el fallback.
  - Usa los colores de DarkTheme o DefaultTheme.
  - `App` monta sin errores, y un error dentro de `Providers` lo captura el límite.
- **CA17**
  - Muestra «Inglés con Sebas», «Versión 0.1.0», «Entorno: prod» y «Servidor: app.inglesconsebas.com» con una configuración `prod`.
  - Con el mock global muestra `dev` y `localhost:8080`.
  - Si la URL no tiene esquema, la muestra tal cual.
- **CA18**
  - `temaNavegacion` devuelve el tema correcto para `dark`, `light` y `null`.
  - El color del título sigue el tema.
  - La ruta inicial es la de inicio, sin cabecera.

## Paso manual de CA2

1. Arranca un emulador con API ≥ 30 o conecta un dispositivo. Comprueba que aparece en `adb devices`.
2. En otra terminal, levanta Metro con `npx react-native start`.
3. Compila con `node scripts/gradle.mjs assembleDebug -q`.
4. Instala y abre la app:
   ```
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   adb reverse tcp:8081 tcp:8081
   adb shell monkey -p com.inglesconsebas.app 1
   ```
5. Comprueba lo siguiente:
   - no aparece pantalla roja ni pantalla en blanco;
   - se ven «Inglés con Sebas», «Versión 0.1.0», «Entorno: dev» y «Servidor: <host>»;
   - `adb logcat -d | grep -i FATAL` no devuelve nada.
6. Guarda la captura con `adb exec-out screencap -p > docs/features/F1-01-base-diseno-marca/ca2.png`.

## 2. Puerta de calidad

| Paso | Resultado |
|---|---|
| `tsc --noEmit` | 0 errores |
| `eslint .` | 0 errores. Hay 4 avisos en `coverage/lcov-report/*.js` (ver O1). |
| `prettier --check .` | Todo con formato correcto |
| `jest --coverage` | 10 suites y 120 tests, todos en verde |

Cobertura:

| Carpeta | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| Global (umbral 70) | 100 | 98,83 | 100 | 100 |
| app, app/di, app/inicio, app/navigation | 100 | 100 | 100 | 100 |
| app/providers | 100 | 75 | 100 | 100 |
| shared/lib | 100 | 100 | 100 | 100 |

La única rama sin cubrir es `LimiteDeErrores.tsx:84`, la opacidad del botón al pulsarlo. Es cosmética.

## 3. Observaciones (no bloquean)

- **O1. ESLint recorre `coverage/`.** No hay `.eslintignore`. Después de pasar `jest --coverage` aparecen 4 avisos. Hoy no rompe nada, pero rompería la puerta si se añade `--max-warnings=0`. Arreglo: añadir `coverage/` a `ignorePatterns` en `.eslintrc.js`.
- **O2. `accessibilityRole="alert"` sin `accessible`.** En `src/app/providers/LimiteDeErrores.tsx:64-66` el rol no se expone: `getByRole('alert')` no lo encuentra, e iOS lo ignora en un contenedor no accesible.

## Commits del tester

- `8b36558` test(api): cliente HTTP, notify, utils y entorno
- `aa6a7d3` test(app): DI, navegación raíz, inicio provisional, límite de errores y App
