# Pruebas · F1-01b · Sistema de diseño, splash e ícono (kit de marca oficial)

> Tester · 2026-11-10 · rama `feat/F1-01b-sistema-diseno-marca` hasta `5ef742b`.
> Prevalece la sección 0.6 del plan:
> - kit oficial;
> - paleta #FFFFFF / #000000 / #86EF86 / #A5AFA5;
> - Nohemi Medium en los títulos y DM Sans en el cuerpo;
> - splash claro y oscuro con el logo principal;
> - ícono con el isotipo.

**Veredicto: VERDE en todo lo que se puede automatizar.**
- La puerta pasa: 374 tests y cobertura global de 100 % en líneas, 97,6 % en ramas y 94,39 % en funciones.
- Las verificaciones en el moto g77 (M1, M2, M4 y M6) quedan pendientes porque el teléfono no estaba conectado.
- También quedan pendientes las de los emuladores con API 30 y API 24/25 (M3 y M5).

## 1. Matriz criterio → prueba

| CA | Prueba o paso manual | Resultado |
|---|---|---|
| CA1 | `npm run calidad` con cobertura global ≥ 70 % | ✅ en local. El CI se verá en el PR |
| CA2 | `src/shared/theme/__tests__/temas.test.ts`: mismas claves recursivas en los dos temas; los 4 hex oficiales en `paleta`; tokens del kit (`fondo`, `texto`, `textoSecundario`, `marca`, `sobreMarca`, `superficie` y `campoFondo`); que no quede ningún hex de la Dirección A; formato #RRGGBB; tipografía, espaciado, radios y toque mínimo 44 | ✅ |
| CA3 | `temas.test.ts`: 12 pares ≥ 4.5 y 2 pares ≥ 3 en los dos temas. `relacionContraste` con referencias WCAG ±0.1 y 7 entradas inválidas que deben lanzar error | ✅ todos los pares cumplen con la paleta oficial |
| CA4 | `src/shared/theme/__tests__/TemaProvider.test.tsx`: arranca en `'sistema'`; maneja dark, light, null y undefined (null cae en oscuro); preferencias fijas; repinta cuando cambia el sistema; `establecerPreferencia`; error fuera del provider; `useEstilos` memoiza | ✅ |
| CA5 | `src/shared/components/__tests__/componentes.test.tsx` y `LogoMarca.test.tsx`, en los dos temas: Boton (3 variantes, alto mínimo 48, role, label, hint, disabled, busy); Campo (etiqueta asociada, `role=alert` y borde `peligro` con error); Tarjeta (radios 20 y 26, pulsable); Insignia (5 tonos); Texto (10 variantes sin `fontWeight`); Cargando; AvisoEnLinea (4 tonos); Pantalla (insets y StatusBar); Marca (imagen y encabezado «Inglés con Sebas»); LogoMarca (con etiqueta o decorativo) | ✅ |
| CA6 | Familias tipográficas automatizadas en `temas.test.ts`: no quedan Sora, Thin ni ExtraLight | ⏳ falta comprobarlo en el dispositivo (M1). iOS pendiente |
| CA7 | `NavegadorRaiz.test.tsx`: `temaNavegacion` asigna 6 colores y las fuentes (DMSans y Nohemi, `fontWeight` '400') en los dos temas; StatusBar `light-content` o `dark-content`. CA16 y CA17 siguen en verde | ✅ |
| CA8 | `HostNotificaciones.test.tsx`: 4 tipos con fondo `superficie`, `borde` y su color de acento; título en Nohemi-Medium y detalle en DMSans-Regular; se recalcula al cambiar de tema; va dentro de `Providers` | ✅ |
| CA9 | `BootSplashAdapter.test.ts` (`fade`, rechazo y excepción síncrona sin lanzar) · `NavegadorRaiz.test.tsx` (`onReady` llama a `ocultar({fundido:true})` una sola vez) · `src/native/__tests__/recursosMarca.test.ts` (colores claro/oscuro, `BootTheme`, `drawable-*` y `drawable-night-*` en 5 densidades dentro del círculo de 192 dp de Android 12+, logo según el tema, colorset y imageset de iOS, storyboard, `Info.plist`) | ✅ automático. ⏳ arranque en frío en el moto g77 (M2) y en API 30 (M3) |
| CA10 | `recursosMarca.test.ts`: íconos adaptativos con monochrome y fondo #000000; legacy en 5 densidades; foreground y monochrome dentro de la zona segura de 66 dp; monocromo blanco; `Contents.json` con 9 casillas que existen y tienen el tamaño correcto; 1024 y Play 512 sin alfa. Los scripts son idempotentes | ✅ automático. ⏳ launcher (M4) y API 24/25 (M5) |
| CA11 | `LogoMarca.test.tsx`: ningún `<text` en `logo.json` ni en los 5 SVG; todas las capas son trazados; colores del manual (pp. 3, 4 y 10); el kit está en el repo. Comparación visual con el PDF (§ 3) | ✅ |
| CA12 | `src/app/escaparate/__tests__/SistemaDisenoScreen.test.tsx`: 11 secciones; paleta del tema activo; 10 variantes de texto; botones en sus 5 estados; campo; tarjetas; insignias; avisos; carga; isotipo y logos; 4 toasts; selector de tema accesible. `NavegadorRaiz.test.tsx`: «Ver sistema de diseño» abre el escaparate al primer toque | ✅ automático. ⏳ en el dispositivo (M6) |
| CA13 | Revisión del README y de `CLAUDE.md`: kit, paleta, Nohemi con su licencia, regla de nombres PostScript, orden de regeneración y salida generada | ✅ |

### Pasos manuales pendientes

**Preparación:**
1. `adb -s ZY22MJNXBD reverse tcp:8081 tcp:8081`
2. `node scripts/gradle.mjs assembleDebug -q`
3. `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
4. Anotar el modo noche original con `adb shell cmd uimode night`.

Para cada arranque en frío:

```
adb shell am force-stop com.inglesconsebas.app
adb shell monkey -p com.inglesconsebas.app -c android.intent.category.LAUNCHER 1
```

Las capturas van en `capturas/`.

- **M1 (CA6):** los títulos y botones se ven en Nohemi y el cuerpo en DM Sans, no en Roboto.
- **M2 (CA9):**
  - Con `cmd uimode night yes`, logo claro sobre negro.
  - Con `night no`, logo gris sobre blanco.
  - En ambos casos, sin destello, sin recorte y con fundido.
  - Al terminar, restaurar el modo original.
- **M3 (CA9):** lo mismo en un emulador con API 30.
- **M4 (CA10):** con `KEYCODE_HOME`, comprobar el isotipo adaptativo en el launcher. Con los íconos temáticos activados, debe verse la silueta monocroma.
- **M5 (CA10):** en API 24 o 25 se usa el ícono legacy.
- **M6 (CA12):** con `uiautomator dump` e `input tap`, el primer toque en «Ver sistema de diseño» abre el escaparate. Probar también el selector de tema y los 4 toasts.

## 2. Puerta automática

```
tsc --noEmit            OK
eslint .                OK (0 errores, 0 avisos)
prettier --check        All matched files use Prettier code style!
jest --coverage         Test Suites: 18 passed · Tests: 374 passed
```

| Carpeta | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| **Global** (umbral 70) | **100** | **97.6** | **94.39** | **100** |
| app, app/di, app/inicio, shared/lib, shared/theme | 100 | 100 | 100 | 100 |
| app/escaparate | 100 | 100 | 66.66 | 100 |
| app/navigation | 100 | 75 | 100 | 100 |
| app/providers | 100 | 75 | 100 | 100 |
| native/adapters | 100 | 100 | 100 | 100 |
| shared/components | 100 | 96.55 | 100 | 100 |

**Lo que queda sin cubrir:**
- el estilo `pressed` de `Pressable`;
- la segunda llamada a `onReady`;
- los `onPress={() => {}}` vacíos del escaparate.

## 3. Hallazgos (ninguno bloqueante)

1. **Mejora: el `radiogroup` no se expone.** El contenedor con `accessibilityRole="radiogroup"` (`src/app/escaparate/SistemaDisenoScreen.tsx:128`) no es accesible. Las opciones sí son radios con `checked`.
2. **Observación: dos casillas de iOS comparten PNG.** AppIcon de iOS tiene 9 casillas y 8 PNG, porque 40@3x y 60@2x usan `icono-120.png`. Es válido.
3. **Observación: comparación del logo con el kit (CA11).** Rasterizado con PyMuPDF y sharp.
   - **Logo principal:** proporción 1.968 frente a 1.982 e IoU 0.908. La diferencia sale de las guías del PDF y de bordes de 1 px.
   - **Isotipo:** IoU 0.976 en el contorno y la moneda, y 0.80 en la «S» pequeña, por el antialiasing.
   - **Categorías:** Self y Kids coinciden con la p. 10.
   - **Tilde:** la p. 4 del manual escribe «Ingles» sin tilde, y el logo extraído, igual que la p. 3, dice «Inglés». **Hay que confirmarlo con Sebastián.**
4. **Riesgo: licencia de Nohemi.** `assets/licencias/LICENCIA-Nohemi.txt` la declara freeware de uso personal y comercial, sin modificar los archivos. Se incrusta sin modificar, así que es compatible, pero no es OFL. **Hay que confirmarlo antes de publicar.**
5. **Documental: plan desactualizado.** El cuerpo del plan (§ 1-10) todavía describe la Dirección A, aunque prevalece la § 0.6.

## Commits del tester

- `7adb59a` test(tema): paleta oficial, contraste y TemaProvider
- `acb43a8` test(ui): componentes base, logo oficial y host de notificaciones
- `5ef742b` test(app): splash, navegación con tema, escaparate y recursos nativos de marca
