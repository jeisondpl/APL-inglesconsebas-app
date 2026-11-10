**APROBADO**

# Aprobación · F1-01b · Sistema de diseño, splash e ícono (kit de marca oficial)

> Aprobador · 2026-11-10 · rama `feat/F1-01b-sistema-diseno-marca` · de `026e1ef` a `fc7f000` (23 commits, 151 archivos).
>
> **Referencia de la revisión.** Se juzga contra la § 0 del plan y, dentro de ella, contra la § 0.6 (kit oficial). El cuerpo del plan todavía describe la «Dirección A», y eso no cuenta como hallazgo.
>
> **Comprobaciones propias** (en una copia temporal):
> - revisión de `git diff develop...HEAD`;
> - comparación con el kit rasterizado;
> - nueva extracción del logo, que sale idéntica byte a byte;
> - idempotencia de los generadores.

## Verificación manual pendiente (M1–M6)

**No bloquea el veredicto de código.** Es una comprobación previa a la entrega. Los tests ya cubren nombres de recursos, densidades, el círculo de Android 12+, la zona segura del ícono adaptativo, el 1024 sin alfa, las familias tipográficas y `onReady`.

**Condiciones antes del merge o la entrega:**
1. Hacer M1, M2, M4 y M6 en el moto g77, y M3 y M5 en emuladores.
2. Que `npm run build:android:debug` o el job de Android del CI pasen en verde. Entran dos dependencias nativas nuevas.
3. Confirmar la licencia de Nohemi antes de publicar en las tiendas (hallazgo 1).

Si algo de esto falla, la feature vuelve al constructor.

## Checklist

1. ✔ **Capas.**
   - boundaries da 0 errores.
   - El splash solo se usa a través de `SplashPort` → `BootSplashAdapter`, que se registra en DI y se consume con `useNative('splash')`.
   - Solo `HostNotificaciones` y `notify.ts` importan toast-message.
2. ✔ **Convenciones.** Se usan los prefijos `I*` y el alias `@/`. `logo.json` se importa con ruta relativa porque está fuera de `src/`, igual que `package.json`.
3. ✔ **Criterios.** Todos los de la § 0.6 están implementados, sin alcance de más. Ya no quedan Sora, la burbuja, opentype.js ni `fuentes-origen`, salvo un comentario (hallazgo 3).
4. ✔ **Seguridad.** No hay secretos. El PDF de Zoom, que tiene datos personales, quedó excluido.
5. ✔ **Errores.**
   - `BootSplashAdapter.ocultar` nunca lanza (`BootSplashAdapter.ts:12-16`).
   - `relacionContraste` y `useTema` dan errores descriptivos.
6. ✔ **Accesibilidad e i18n.**
   - Todo lo pulsable tiene role y label, con un tamaño mínimo de 48 o 44 y sus estados.
   - `Campo` usa `role=alert`.
   - `LogoMarca` es decorativo o `image`.
   - Los textos están en `*.textos.ts` y no hay hex sueltos.
   - Queda una mejora con `radiogroup` (hallazgo 4).
7. ✔ **Tests.**
   - Cubren los casos de error.
   - Los commits `test(...)` (`7adb59a`, `acb43a8`, `5ef742b`) solo tocan `__tests__/`.
   - Los ajustes de tests que hizo el constructor (`11d3b37`, `c56f017`, `3edc0b0`) están justificados en sus commits.
8. ✔ **Nativo.**
   - No hay permisos nuevos.
   - En Android, `BootTheme`, la Activity, `RNBootSplash.init` después de `RNScreensFragmentFactory`, `values` y `values-night`, `drawable-*` y `drawable-night-*`, y el ícono adaptativo con monochrome.
   - En iOS, `customize`/`initWithStoryboard`, el storyboard, `Colors.xcassets` y `BootSplashLogo` con Any/Dark, `UIAppFonts` y un `pbxproj` coherente.
   - Queda pendiente `pod install` y compilar en iOS (R4).
9. ✔ **API.** No aplica.

## Criterios → implementación → test

| CA | Implementación | Test |
|---|---|---|
| CA1 | `package.json` | `npm run calidad` en verde; el job de Android se verá en el PR |
| CA2 | `paleta.ts` (#FFFFFF, #000000, #86EF86, #A5AFA5, `grisLogo` #62696B de la p. 4 y los derivados) y `temas.ts` | `temas.test.ts` |
| CA3 | `temas.ts` y `contraste.ts` | `temas.test.ts` (12 pares ≥ 4.5 y 2 pares ≥ 3, más entradas inválidas) |
| CA4 | `TemaProvider.tsx` y `useEstilos.ts` | `TemaProvider.test.tsx` |
| CA5 | `src/shared/components/*.tsx` | `componentes.test.tsx` y `LogoMarca.test.tsx` |
| CA6 | `tipografia.ts`. Nombres PostScript verificados: `Nohemi-Medium` y `DMSans-*` | `temas.test.ts`. Pendiente: M1 |
| CA7 | `temaNavegacion.ts`, `NavegadorRaiz.tsx`, `LimiteDeErrores.tsx` e `InicioProvisionalScreen.tsx` | Sus tests |
| CA8 | `HostNotificaciones.tsx` y `Providers.tsx` | `HostNotificaciones.test.tsx` |
| CA9 | `SplashPort.ts`, `BootSplashAdapter.ts`, `NavegadorRaiz.tsx:24-29`, `generar-splash.mjs` y los recursos nativos | `BootSplashAdapter.test.ts`, `NavegadorRaiz.test.tsx` y `recursosMarca.test.ts`. Pendientes: M2 y M3 |
| CA10 | `generar-iconos.mjs` (comprueba que no haya alfa, `:184-187`), `mipmap-*`, `AppIcon` y el ícono de Play de 512 | `recursosMarca.test.ts`; idempotencia verificada. Pendientes: M4 y M5 |
| CA11 | `extraer-logo-kit.py` → `logo.json`; `LogoMarca` y `Marca` | `LogoMarca.test.tsx`. Ningún `<text`; la nueva extracción sale idéntica; las copias del kit coinciden con el original; colores de las pp. 3 y 4 verificados |
| CA12 | `SistemaDisenoScreen.tsx` y `escaparate.textos.ts` | `SistemaDisenoScreen.test.tsx` y `NavegadorRaiz.test.tsx`. Pendiente: M6 |
| CA13 | README y `CLAUDE.md` | Revisión ✔ |

## Hallazgos (ninguno bloqueante)

1. **Mejora · riesgo legal, antes de publicar** (`assets/licencias/LICENCIA-Nohemi.txt:9-10`).
   - La licencia de Nohemi dice «freeware… personal and commercial projects. The typeface files may not be modified». No autoriza de forma expresa redistribuir el archivo dentro del APK o el IPA.
   - Hay que confirmarlo por escrito con Sebastián, con quien diseñó el kit o con el autor, Rajesh Rajput.
   - Si no se confirma, se vuelve a DM Sans en los títulos cambiando solo `tipografia.ts`.
   - DM Sans es OFL 1.1, así que no tiene este problema.
2. **Mejora · iOS** (`project.pbxproj:35-38` e `Info.plist:31`). `react-native-asset` escribió referencias con `fileEncoding = undefined` y similares, y borró un comentario de `NSAllowsArbitraryLoads`. Hay que normalizarlo en Xcode cuando haya un Mac.
3. **Mejora** (`react-native.config.js:1`). El comentario todavía menciona Sora.
4. **Mejora** (`SistemaDisenoScreen.tsx:128`). El `radiogroup` no se anuncia como grupo.
5. **Mejora** (`SistemaDisenoScreen.tsx:257`). El aviso de tono `aviso` usa las claves `infoTitulo` e `infoMensaje`.
6. **Proceso.** El historial conserva los commits de la Dirección A que después se revierten. El desplegador decide si hace squash o merge normal. El estado final es correcto.
7. **Observación de marca.** La p. 4 del manual dice «Ingles» y la p. 3 y el PDF vectorial dicen «Inglés». Se usa «Inglés». Hay que confirmarlo con Sebastián.

## Puerta automática

```
tsc --noEmit OK · eslint . OK · prettier --check OK
jest --coverage  18 suites · 374 tests en verde
All files  Stmts 100 · Branch 97.6 · Funcs 94.39 · Lines 100   (umbral global 70 %)
```
