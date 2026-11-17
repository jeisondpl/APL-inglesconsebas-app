**APROBADO**

# aprobacion.md · F1-03 · Login, sesión y navegación (vuelta 2)

> Aprobador, 2026-11-17, rama `feat/F1-03-login-sesion`. Revisé el `git diff main...HEAD` completo (30 commits) y, con más detalle, las correcciones posteriores al veredicto anterior (`07a8712..HEAD`): 22 archivos, +1115 / −36. Volví a correr `npm run calidad` y salió con **exit 0**:
> - `tsc`, ESLint (con boundaries) y Prettier limpios.
> - Jest: 29 suites y 566 tests en verde.
> - Cobertura global: 99,05 % en statements y 96,41 % en branches.
> - `sesion/domain` y todas las carpetas de `sesion/aplications` al 100 %; `controllers` al 98,91 %.
> - No hay ningún `it.failing`, `it.skip`, `it.only` ni `xit` en `src`.

El bloqueante B1 está resuelto en el código y tiene tests que lo distinguen del comportamiento anterior. También quedó cerrado el resto de B1 que encontró el tester (V1-F1). Las mejoras M1, M2, M3, M5 y M6 están hechas. Sigue pendiente M4, la verificación en el dispositivo, y anoto dos mejoras nuevas que no bloquean.

## 1. Checklist

| # | Punto | | Evidencia |
|---|---|---|---|
| 1 | Capas | ✔ | `SesionActiva` (el puerto, en domain) gana `iniciarCierre` y `esVigente`, sin importar de otras capas. Los casos de uso reciben `sigueVigente` por parámetro, sin depender de React. Boundaries pasa. |
| 2 | Convenciones | ✔ | Nombres en español, imports con `@/`, métodos del controller con `_` y sin `any`. Commits Conventional en español, uno por hallazgo (B1, M1, M2+M3, M5, M6, V1-F1). |
| 3 | Criterios | ✔ | CA1–CA17 siguen implementados y con test. Las correcciones no amplían el alcance: solo cierran las carreras de B1 y aplican las mejoras de la vuelta 1. |
| 4 | Seguridad | ✔ | Un `me` o `renew` tardío ya no vuelve a escribir una sesión cerrada ni pisa la de otro usuario (B1 resuelto). Un 401 solo invalida la sesión con la que salió la petición. El token solo va por `SecureStoragePort`, el PIN no se guarda y no hay `console.*`. |
| 5 | Errores | ✔ | Un resultado descartado devuelve `respuestaError(mensajesSesion.sesionCambio)`, con el texto centralizado en `sesion.mensajes.ts:9`. Los adaptadores siguen sin lanzar. |
| 6 | Accesibilidad e i18n | ✔ | Sin cambios en roles ni etiquetas. `PasoUsuario` y `PasoPin` ya usan `tema.espaciado`: `l` = 16 y `xxl` = 24, los mismos valores que antes. |
| 7 | Tests | ✔ | `carrerasSesion.test.tsx` tiene 17 casos con los controllers reales y el cliente HTTP real con fetch diferido. Hay unitarios de `iniciarCierre` y `esVigente` en `casosDeUso.test.ts:312-330`. El tester hizo una prueba de mutación: anulando `iniciarCierre` fallan 3 casos. El tester solo tocó tests y `pruebas.md` (`4e9871e`, `0e2ff9f`, `40c776e`, `e735d45`, `abeb0e8`, `24aadc6`). |
| 8 | Nativo | ✔ | Se quitó la línea en blanco de `android/app/build.gradle`. No hay dependencias ni permisos nuevos. |
| 9 | API | ✔ | No cambia el contrato con `auth.php`. `alNoAutorizado` recibe el `bearer` con el que salió la petición (`src/shared/lib/api.ts:148`). |

## 2. Criterios

| CA | Implementación | Test |
|---|---|---|
| CA1 | `infrastructure/apiSesionRepository.ts:89-118`, `app/navigation/rutaInicioPorRol.ts` | `apiSesionRepository.test.ts`, `NavegadorRaiz.test.tsx`, `carrerasSesion.test.tsx:569` |
| CA2 | `Login.controller.ts:88-97`, `PasoUsuario.tsx`, `LoginScreen.tsx:73` (`usuarioNormalizado`) | `LoginScreen.test.tsx` («  ANA » → «PIN para ana») |
| CA3 | `Login.controller.ts:108-136` (PIN en `ref`), `TecladoPin.tsx`, `LoginScreen.tsx:36-50` | `Login.controller.test.tsx` (2 y 4 toques en el mismo ciclo), `LoginScreen.test.tsx` |
| CA4 | `Login.controller.ts:61-81`, `PasoPin.tsx` | `Login.controller.test.tsx`, `LoginScreen.test.tsx` |
| CA5 | `apiSesionRepository.ts:101-108` | `apiSesionRepository.test.ts` |
| CA6 | `sesion.validations.ts:64-82`, `iniciarSesion.ts:39-43`, `KeychainSecureStorageAdapter.ts` | `casosDeUso.test.ts`, `sesion.seguridad.test.ts`, `KeychainSecureStorageAdapter.test.ts` |
| CA7 | `arrancarSesion.ts:37-61`, `validarSesion.ts:41-44` | `carrerasSesion.test.tsx:322` (`me` tardío pero vigente), `NavegadorRaiz.test.tsx`, `casosDeUso.test.ts` |
| CA8 | `restaurarSesion.ts`, `sesion.validations.ts:49-52, 91-117` | `casosDeUso.test.ts`, `NavegadorRaiz.test.tsx` |
| CA9 | `invalidarSesion.ts:12-25`, `contenedor.ts:48-50`, `api.ts:148` | `carrerasSesion.test.tsx:396-500`, `DependenciasProvider.test.tsx`, `api.test.ts` |
| CA10 | `renovarSesion.ts:24-58` | `casosDeUso.test.ts` (concurrencia), `carrerasSesion.test.tsx:137, 283` |
| CA11 | `cerrarSesion.ts`, `Sesion.controller.ts:57-64` (`iniciarCierre` antes del primer `await`) | `carrerasSesion.test.tsx:114-250, 502-568`, `NavegadorRaiz.test.tsx` |
| CA12 | `NavegadorRaiz.tsx:36-77`, `presentation/navigation.tsx` | `NavegadorRaiz.test.tsx`, `rutaInicioPorRol.test.ts` |
| CA13 | `LoginScreen.tsx`, `TecladoPin.tsx`, `temas.ts` | `LoginScreen.test.tsx` (los dos temas) |
| CA14 | `Login.controller.ts:138-143`, `LinkingEnlacesAdapter.ts` | `Login.controller.test.tsx`, `LinkingEnlacesAdapter.test.ts` |
| CA15 | `TecladoPin.tsx`, `PuntosPin.tsx`, `BotonTema.tsx`, `PasoPin.tsx` | `LoginScreen.test.tsx` |
| CA16 | `InicioProvisionalScreen.tsx` | `InicioProvisionalScreen.test.tsx` |
| CA17 | — | `npm run calidad` en verde (lo comprobé). El APK de debug compiló según `pruebas.md`. |

## 3. Estado de los hallazgos de la vuelta 1

| Hallazgo | Estado | Evidencia |
|---|---|---|
| **B1** (bloqueante) | ✔ resuelto | Ver el detalle debajo de esta tabla. |
| M1 · un 401 tardío invalida la sesión nueva | ✔ resuelto | `api.ts:148` pasa el `bearer` a `alNoAutorizado`. `invalidarSesion.ts:20-22` lo ignora si no coincide con `token()`; si es `null` tampoco actúa, así que el 401 del login no toca la sesión. Tests en `carrerasSesion.test.tsx:397, 450, 467`. |
| M2 · título del paso PIN | ✔ resuelto | `Login.controller.ts:148` expone `usuarioNormalizado`, y `LoginScreen.tsx:73` lo usa. |
| M3 · un toque rápido pierde un dígito | ✔ resuelto | `Login.controller.ts:55-59` guarda el PIN en una `ref`. `_pulsarDigito`, `_borrar` y `_confirmar` calculan sobre `pinActual.current` (líneas 113-134). |
| M4 · verificación manual en el moto g77 | ✘ pendiente | Sigue anotada abajo como mejora. |
| M5 · línea en blanco en `build.gradle` | ✔ resuelto | `6c06bb5`. |
| M6 · medidas fijas | ✔ resuelto | `PasoUsuario.tsx:11` y `PasoPin.tsx:29` usan `tema.espaciado`. |

**Detalle de B1:**
- **La guarda.** `arrancarSesion.ts:39` define `sigueVigente = () => sesionActiva.esVigente(guardada.token)`. Se comprueba justo antes de cada `guardar` (`validarSesion.ts:41`, `renovarSesion.ts:39`) y antes del `establecer` final (`arrancarSesion.ts:59`).
- **La marca de cierre (V1-F1).** `esVigente` (`sesionActiva.ts:22-25`) exige token igual y además que no haya un cierre en curso. `Sesion.controller.ts:60` llama a `iniciarCierre()` antes del primer `await`, y `token()` sigue dando el Bearer del logout.
- **Los dos tests que pedía la vuelta 1:**
  - logout durante `me`: el almacén queda vacío (`carrerasSesion.test.tsx:114`, más las variantes 137, 172 y 212 con el borrado del Keychain cruzado);
  - login de otro usuario durante `me` o `renew`: no cambia ni el almacén ni el estado (líneas 250 y 283).

## 4. Hallazgos nuevos

### M7 · mejora · un 401 durante el cierre pasa un momento por «vencida» y abre una ventana de unos 3 s

**Dónde:** `src/modules/sesion/aplications/invalidarSesion/invalidarSesion.ts:17-23`, junto con `Sesion.controller.ts:60-63`.

**Problema.** `invalidarSesionUseCase` no mira la marca `cerrando`. Si durante el logout (hasta 3 s) llega un 401 con el token activo, sea del propio logout o de un `me`, ocurre esto:
1. El estado pasa a `sinSesion/vencida`. El navegador cambia al login con el aviso «Tu sesión venció».
2. Cuando termina el cierre, el estado pasa a `cerrada`.

El test `carrerasSesion.test.tsx:552` solo comprueba el estado final. Durante esa ventana se ve un aviso que no corresponde. Además, si alguien llegara a entrar con otro usuario antes de que acabe el cierre, el `borrar` y el `establecer(cerrada)` del cierre anterior le cerrarían la sesión nueva. Es un fallo seguro (expulsa, no da acceso) y poco probable, por eso no bloquea.

**Corrección.** Que `invalidarSesionUseCase` no haga nada mientras haya un cierre en curso, usando `esVigente(tokenPeticion)` en lugar de comparar con `token()`. Y que `_cerrarSesion` solo haga el `establecer(cerrada)` si nadie autenticó otra sesión mientras tanto.

### M8 · mejora · el renovador compartido usa la guarda del primer llamante

**Dónde:** `src/modules/sesion/aplications/renovarSesion/renovarSesion.ts:52-58`.

**Problema.** Con una renovación ya en vuelo, una segunda llamada recibe esa misma promesa y su `sigueVigente` se descarta. Hoy el único llamante es `arrancarSesionUseCase`, así que no hay fallo. Pero el plan deja para F1-03b la validación al volver a primer plano, que reutilizará este renovador.

**Corrección.** Cuando se añada un segundo llamante, que cada uno vuelva a comprobar su propia guarda al recibir el resultado. O documentar en el JSDoc que la guarda es la del primero.

### M4 · mejora (sigue de la vuelta 1) · la verificación manual en el moto g77 está pendiente

**Dónde:** `docs/features/F1-03-login-sesion/pruebas.md`, §5. La vuelta 1 y la vuelta 2 dicen las dos que el teléfono estaba desconectado.

**Problema.** El plan pide capturas y pruebas de CA1, CA4, CA7–CA9 y CA11–CA14 en el dispositivo. No bloquea, porque cada CA tiene un test automático en verde.

**Corrección.** Hacer los 10 pasos de §5 antes de la demo del hito H-S2 (2026-11-20) y guardar las capturas en `capturas/`.

---

**Veredicto:** ningún bloqueante abierto. La feature queda **APROBADA** para el merge. Las mejoras M4, M7 y M8 hay que anotarlas en la tarjeta: M4 antes de la demo de H-S2, M7 y M8 para F1-03b.

---

## Historial · vuelta 1

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
