**RECHAZADO**

# aprobacion.md · F1-03 · Login, sesión y navegación

> Aprobador, 2026-11-17, rama `feat/F1-03-login-sesion`. Revisé `git diff main...HEAD`: 17 commits y 66 archivos. Volví a correr `npm run calidad` y salió con **exit 0**:
> - `tsc`, ESLint (con boundaries) y Prettier limpios;
> - Jest: 28 suites y 538 tests en verde;
> - cobertura global 99,02 %; `sesion/domain` y `sesion/aplications` al 100 %; controllers al 98,86 %.

Rechazo por **un solo bloqueante**. Es una carrera en el arranque: la validación de la sesión guardada puede volver a escribir una sesión ya cerrada, o pisar la de otro usuario. El resto de la feature está bien construido y bien probado.

## 1. Checklist

| # | Punto | | Evidencia |
|---|---|---|---|
| 1 | Capas | ✔ | `domain` solo importa de sí mismo. Los casos de uso son funciones que reciben repo, almacén y estado por parámetro. `LoginScreen` solo usa `useLoginController`. Keychain y Linking se usan solo por `SecureStoragePort` y `EnlacesPort`. Boundaries pasa. |
| 2 | Convenciones | ✔ | `IArgsIniciarSesion`, `IResponse*`, `SesionRepository`, `use*Controller` y métodos con `_`. Imports con `@/`. No hay `any`: el grep de `: any` y `as any` fuera de tests no da nada. |
| 3 | Criterios | ✔ | CA1–CA17 implementados y con test (tabla de abajo). `arrancarSesionUseCase` no figura en el plan, pero solo saca a una función la lógica de `useArranqueSesion` y está documentado en `CLAUDE.md`. No es alcance de más. |
| 4 | Seguridad | ✘ | El token solo va por `SecureStoragePort`, el PIN no se guarda y no hay `console.*`. Pero tras un logout la sesión puede **volver a escribirse en el almacén**, o la de un usuario puede pisar la de otro (bloqueante B1). |
| 5 | Errores | ✔ | Los adaptadores nunca lanzan: dan `respuestaError` con `msg`, y Keychain devuelve null o false. El fallo de WhatsApp sale con `notify.error`. Los errores del login van en línea con `role="alert"`. |
| 6 | Accesibilidad e i18n | ✔ | Teclas, botones y enlace tienen rol y etiqueta. Teclas de al menos 64 dp, `toqueMinimo` en el resto. Los puntos se anuncian como «PIN: n de 4 dígitos». Los textos están en `sesion.textos.ts`, `sesion.mensajes.ts` e `inicio.textos.ts`. No hay hex en la presentación. |
| 7 | Tests | ✔ | Casos de uso con repo falso y caminos de error: 401, 429, red, corrupto, vencido y `guardar` que falla. Controller con `renderHook`. La pantalla usa el controller real con `MemoriaSesionRepository`, como fija el plan en §8. El tester solo tocó tests (`e54d960`). |
| 8 | Nativo | ✔ | `react-native-keychain` 11.0.0 fijada, sin permisos nuevos. El `pod install` pendiente está documentado en el README y en `CLAUDE.md`. |
| 9 | API | ✔ | Solo usa `role`, `token`, `expiresAt`, `renewAfter` y `id`/`name`/`username`. El tester lo contrastó con curl contra la rama F1-02. |

## 2. Criterios

| CA | Implementación | Test |
|---|---|---|
| CA1 | `infrastructure/apiSesionRepository.ts:89-118`, `app/navigation/rutaInicioPorRol.ts` | `apiSesionRepository.test.ts`, `NavegadorRaiz.test.tsx` |
| CA2 | `Login.controller.ts:79-88`, `PasoUsuario.tsx` | `LoginScreen.test.tsx` |
| CA3 | `Login.controller.ts:90-127`, `TecladoPin.tsx`, `LoginScreen.tsx:36-50` (atrás de Android) | `LoginScreen.test.tsx`, `Login.controller.test.tsx` |
| CA4 | `Login.controller.ts:52-72`, `PasoPin.tsx:66-90` | `Login.controller.test.tsx`, `LoginScreen.test.tsx` |
| CA5 | `apiSesionRepository.ts:101-108` | `apiSesionRepository.test.ts` |
| CA6 | `sesion.validations.ts:64-82`, `iniciarSesion.ts:39-43`, `KeychainSecureStorageAdapter.ts` | `casosDeUso.test.ts`, `sesion.seguridad.test.ts`, `KeychainSecureStorageAdapter.test.ts` |
| CA7 | `arrancarSesion.ts`, `validarSesion.ts` | `NavegadorRaiz.test.tsx`, `casosDeUso.test.ts` |
| CA8 | `restaurarSesion.ts`, `sesion.validations.ts:49-52, 91-117` | `casosDeUso.test.ts`, `NavegadorRaiz.test.tsx` |
| CA9 | `invalidarSesion.ts`, `contenedor.ts:44-51` | `casosDeUso.test.ts`, `DependenciasProvider.test.tsx`, `NavegadorRaiz.test.tsx` |
| CA10 | `renovarSesion.ts:39-49` | `casosDeUso.test.ts` (concurrencia), `NavegadorRaiz.test.tsx` |
| CA11 | `cerrarSesion.ts`, `Sesion.controller.ts:57-61` | `casosDeUso.test.ts` (límite de 3 s), `NavegadorRaiz.test.tsx`, `InicioProvisionalScreen.test.tsx` |
| CA12 | `NavegadorRaiz.tsx:36-77`, `presentation/navigation.tsx` | `NavegadorRaiz.test.tsx`, `rutaInicioPorRol.test.ts` |
| CA13 | `LoginScreen.tsx`, `TecladoPin.tsx`, `temas.ts` (`confirmar`/`sobreConfirmar`) | `LoginScreen.test.tsx` (los dos temas) |
| CA14 | `Login.controller.ts:129-134`, `sesion.validations.ts:120-124`, `LinkingEnlacesAdapter.ts` | `Login.controller.test.tsx`, `LoginScreen.test.tsx`, `LinkingEnlacesAdapter.test.ts` |
| CA15 | `TecladoPin.tsx`, `PuntosPin.tsx`, `BotonTema.tsx`, `PasoPin.tsx` | `LoginScreen.test.tsx` |
| CA16 | `InicioProvisionalScreen.tsx` | `InicioProvisionalScreen.test.tsx` |
| CA17 | — | `npm run calidad` en verde (lo comprobé). El APK de debug compiló según `pruebas.md`. |

## 3. Hallazgos

### B1 · **bloqueante** · una validación que llega tarde vuelve a escribir la sesión o pone la de otro usuario

**Dónde:**
- `src/modules/sesion/aplications/arrancarSesion/arrancarSesion.ts:37-52`
- `src/modules/sesion/aplications/validarSesion/validarSesion.ts:34`
- `src/modules/sesion/aplications/renovarSesion/renovarSesion.ts:31`

**Problema.** `arrancarSesionUseCase` publica la sesión guardada y lanza `me` en segundo plano. El cliente espera hasta 15 s. Si mientras tanto la persona cierra sesión (eso tarda como mucho 3 s y borra el almacén), pasa esto:

1. `validarSesionUseCase` hace igualmente `almacen.guardar(CLAVE_SESION, …)` (línea 34). La sesión cerrada **vuelve al almacén**, y lo mismo pasa con `renovar` (línea 31). En el siguiente arranque se restaura una sesión revocada: `me` da 401 y sale «Tu sesión venció» en lugar del login limpio. Eso incumple CA11 («borra el almacén»).
2. Si después del logout alguien entra con **otro usuario**:
   - la respuesta tardía de `me` de la sesión anterior pisa en el almacén la sesión nueva;
   - la guarda de la línea 50 solo mira `tipo === 'autenticado'`, no qué sesión es, así que hace `establecer` con la **sesión del usuario anterior**.

   La segunda persona termina dentro con la cuenta de la primera. Es poco probable (hace falta una red lenta), pero es un fallo de integridad de la sesión en un teléfono compartido.

El test `casosDeUso.test.ts:359-375` («si la sesión se cerró mientras validaba, no la reabre») solo comprueba el estado en memoria. No mira el almacén ni el caso de otro usuario, así que la regresión pasa en verde.

**Corrección esperada:**
- Antes de cada `guardar` de `validar`/`renovar` y antes del `establecer` final, comprobar que la sesión activa **sigue siendo la misma**, por ejemplo con `sesionActiva.token() === guardada.token`, y si no, descartar el resultado. Se puede hacer pasando una guarda a los casos de uso o moviendo el guardado a `arrancarSesionUseCase`, después de la comprobación.
- Añadir dos tests:
  - un logout durante `me` deja el almacén vacío;
  - un login de otro usuario durante `me` no cambia ni el almacén ni el estado.

### M1 · mejora · un 401 tardío de un token viejo invalida la sesión nueva

**Dónde:** `src/app/di/contenedor.ts:48-50`

**Problema.** Tiene la misma raíz que B1. `alNoAutorizado` no sabe con qué token salió la petición. Si el `me` del token anterior vuelve con 401 cuando ya hay otra sesión autenticada, `invalidarSesionUseCase` borra la sesión nueva y muestra «Tu sesión venció».

**Corrección.** Que el cliente pase a `alNoAutorizado` el token con el que salió la petición, y que `invalidarSesionUseCase` solo actúe si coincide con `sesionActiva.token()`. Se puede dejar para F1-03b si B1 se resuelve descartando resultados.

### M2 · mejora · el título del paso 2 no muestra el usuario normalizado

**Dónde:** `src/modules/sesion/presentation/screens/LoginScreen.tsx:73`

**Problema.** Usa `login.usuario.trim()`: si se escribe «ANA» sale «PIN para ANA», aunque se envía `ana`. El tester ya lo anotó.

**Corrección.** Usar `normalizarUsuario` del dominio, por ejemplo exponiendo `usuarioNormalizado` desde el controller.

### M3 · mejora · un toque rápido puede perder un dígito

**Dónde:** `src/modules/sesion/aplications/controllers/Login.controller.ts:99-115`

**Problema.** `_pulsarDigito` calcula sobre el `pin` del cierre. Dos toques antes de que se vuelva a renderizar pueden perder un dígito. `_borrar` ya usa la actualización funcional.

**Corrección.** Guardar el PIN también en un `ref`, o calcular el nuevo valor dentro de `setPin(actual => …)` y disparar el envío desde ahí.

### M4 · mejora · la verificación manual en el moto g77 está pendiente

**Dónde:** `docs/features/F1-03-login-sesion/pruebas.md:5, §5`

**Problema.** La verificación manual no se hizo porque el teléfono no estaba conectado. No bloquea, porque cada CA tiene un test automático en verde. Pero el plan pide capturas y pruebas de CA1, CA4, CA7–CA9 y CA11–CA14 en el dispositivo.

**Corrección.** Hacer los 10 pasos de §5 antes de la demo del hito H-S2 (2026-11-20) y guardar las capturas en `capturas/`.

### M5 · mejora · líneas en blanco de más en `build.gradle`

**Dónde:** `android/app/build.gradle:165-168`

**Problema.** El comentario de la dependencia nativa (requisito de ARQUITECTURA §10) deja dos líneas en blanco seguidas dentro de `dependencies`.

**Corrección.** Quitar una línea en blanco.

### M6 · mejora · medidas fijas en lugar de tokens

**Dónde:** `src/modules/sesion/presentation/components/PasoUsuario.tsx:9` (`gap: 16`) y `PasoPin.tsx:29` (`minHeight: 24`)

**Problema.** Son medidas escritas a mano, en lugar de los tokens de `tema.espaciado`, que sí usan el resto de componentes del módulo.

**Corrección.** Usar `useEstilos` con `tema.espaciado`.

---

**Para la vuelta 2:** con B1 corregido y sus dos tests en verde, la feature queda en condiciones de aprobarse. Las mejoras M1–M6 se pueden anotar en la tarjeta para después.
