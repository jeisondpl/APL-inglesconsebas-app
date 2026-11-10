**APROBADO**

# Aprobación · F1-01 · Base técnica (alcance reducido, sección 0 del plan)

> Aprobador · 2026-11-09 · rama `feat/F1-01-base-diseno-marca` · revisión de `git diff main...HEAD` (15 commits) y nueva ejecución de `npm run calidad`.

## Puerta automática

`npm run calidad` sale con código 0:

| Paso | Resultado |
|---|---|
| `tsc` | Sin errores |
| `eslint` | Sin errores ni avisos |
| `prettier` | Todo con el formato correcto |
| `jest` | 10 suites y 120 tests, todos en verde |
| Cobertura | 100 % de sentencias, 98,83 % de ramas, 100 % de funciones y 100 % de líneas (umbral: 70) |

## Checklist

1. ✔ **Capas.**
   - `shared/lib` no importa de `app`.
   - `contenedor.ts` es el único sitio que crea el cliente.
   - El lint de capas está verificado con CA3.
2. ✔ **Convenciones.** Los imports usan `@/` y las interfaces llevan el prefijo `I*`.
3. ✔ **Criterios.**
   - Todos los aplicables tienen implementación y test. CA2 es manual.
   - No hay alcance de más, ni dependencias fuera de la sección 0.
4. ✔ **Seguridad.**
   - No hay secretos.
   - El Bearer va inyectado.
   - El almacenamiento seguro y la limpieza ante 401 quedan para la feature de sesión, que tiene el gancho `alNoAutorizado`.
5. ✔ **Errores.**
   - `api.ts` nunca lanza: devuelve siempre `HttpResponse`, con textos centralizados.
   - El timeout usa `AbortController`.
   - `notify` es la única fachada de avisos.
6. ✔ **Accesibilidad e i18n.**
   - «Reintentar» tiene role, label, hint y un tamaño mínimo de 44×44.
   - El fallback se anuncia con `accessible`, `alert` y `liveRegion`, y el botón queda fuera del grupo.
   - El título de inicio es un header.
   - Los textos están centralizados.
   - No hay colores de marca inventados.
7. ✔ **Tests.**
   - Cubren los errores: 401 una sola vez, `{error}` de Leap, HTML en un 502, `fetch` que rechaza o lanza, fallo al leer el cuerpo, timeout, 200 que no es JSON, `obtenerToken` que falla, entorno inválido, DI sin clave o sin provider, y error persistente.
   - Los commits `test(...)` solo tocan `__tests__/`.
8. ✔ **Nativo.**
   - `MainActivity.kt` asigna `RNScreensFragmentFactory` antes de `super.onCreate`.
   - `Info.plist` queda en `es` y sin el permiso vacío.
   - `pbxproj` tiene `MARKETING_VERSION 0.1.0` y `developmentRegion es`.
   - No hay permisos nuevos.
   - `pod install` está documentado como pendiente.
9. ✔ **API.**
   - Solo usa GET y POST, enruta por query y mapea el `{error}` de `config.php`.
   - El caso R8 está documentado con un test.

## Criterios → implementación → test

| CA | Implementación | Test |
|---|---|---|
| CA1 | `package.json` (`calidad`), `jest.config.js` | `npm run calidad` en verde. CI en el PR |
| CA2 | `index.js` → `src/app/App.tsx` → `NavegadorRaiz` → `InicioProvisionalScreen` | Manual. **Hecho por el orquestador en un moto g77 con Android 16** ([`ca2.png`](ca2.png)) |
| CA3 | `tsconfig` (`paths`), `babel` (`module-resolver`), `jest` (`moduleNameMapper`), ESLint con el resolver TS | Puerta, archivo temporal en `shared` y Metro en el dispositivo |
| CA9 | `src/shared/lib/api.ts`, `HttpResponse.ts`, `utils.ts`, `textos.ts` | `api.test.ts` (51) y `utils.test.ts` |
| CA10 | `src/shared/lib/notify.ts` y el host en `src/app/App.tsx` | `notify.test.ts` y `App.test.tsx` |
| CA11 | `src/app/di/contenedor.ts` y `DependenciasProvider.tsx` | `DependenciasProvider.test.tsx` y `App.test.tsx` |
| CA14 | `Info.plist`, `project.pbxproj`, `docs/DISTRIBUCION.md` y `build.gradle` | Diff y grep |
| CA16 | `LimiteDeErrores.tsx`, `Providers.tsx` y `App.tsx` | `LimiteDeErrores.test.tsx` y `App.test.tsx` |
| CA17 | `InicioProvisionalScreen.tsx`, `inicio.textos.ts` y `entorno.ts` | `InicioProvisionalScreen*.test.tsx` y `entorno.test.ts` |
| CA18 | `temaNavegacion.ts` y `NavegadorRaiz.tsx` | `NavegadorRaiz.test.tsx` |
| CA4–8, 12, 13, 15 | — | Aplazados por decisión del usuario |

**CA2.** No bloquea el veredicto sobre el código, pero era obligatorio antes de entregar. *Nota del orquestador:* ya está hecho, ver `pruebas.md`.

## Hallazgos

Ninguno es bloqueante. Estas son las mejoras que quedan anotadas:

1. **`src/shared/lib/api.ts:145`.** Si el `alNoAutorizado` inyectado lanza, el catch exterior convierte el 401 en `code: 0` con el texto «sin conexión».
   - Corrección: envolver la llamada en su propio try/catch y añadir un test.
2. **`src/shared/lib/api.ts:150`.** Si `respuesta.text()` falla, se devuelve un error de red con `code: 0` aunque el estado HTTP ya se conoce.
   - Corrección: devolver el mensaje según el estado, con ese estado.
3. **`src/shared/lib/entorno.ts:39`.** `leerEntorno(Config)` se evalúa al importar. Con un `.env` mal configurado, la app cae antes de que monte el límite de errores.
   - Corrección: documentarlo, o validarlo en el CI antes del build.
4. **Commit `4a9058a`.** Mezcla el cambio de `MainActivity.kt` con el de dependencias, aunque el commit lo justifica.
   - En adelante, los cambios nativos van en un commit propio (`chore(android)`).
5. **Commits `59b60ba` y `b1393b9`.** No tienen línea en blanco entre `Refs` y `Co-Authored-By`. Es cosmético.

**Pendientes ajenos al código:**
- `pod install` y `Podfile.lock`, cuando haya un Mac.
- Jobs del CI en el PR.
- Tablero: 1.1 hecho, 1.3 parcial (bloqueado por el D-U-N-S), y 1.2 y 1.10 aplazados.
