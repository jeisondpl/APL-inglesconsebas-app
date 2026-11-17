# pruebas.md · F1-03 · Login, sesión y navegación

> Tester, 2026-11-16, rama `feat/F1-03-login-sesion`. Commit de tests: `e54d960 test(sesion): criterios CA1-CA16 del login, la sesión persistente y la navegación`.

**Importante:** la verificación en el moto g77 **no se hizo**. El teléfono no aparecía en `adb devices`, ni tras reiniciar el servidor adb ni tras esperar 5 minutos. Windows tampoco lo ve como dispositivo USB (`Get-PnpDevice` no lista ningún Motorola, ADB ni MTP), así que parece desconectado físicamente. Por eso tampoco quedó la app instalada con la sesión cerrada.

Lo que sí se hizo:
- Contrato del backend Docker comprobado con curl y SQL.
- APK de debug compilado con `.env.dispositivo`.
- Pasos manuales pendientes en la sección 5.

## 1. Matriz criterio → prueba

| CA | Pruebas automáticas (todas en verde) | Manual |
|---|---|---|
| CA1 Login por rol | `apiSesionRepository.test.ts`: cuerpo `{username, pin, client:'app', deviceLabel}`, «  ANA » → `ana`, mapeo de estudiante, profe (id numérico → texto) y admin (`{id:'admin', nombre:'Admin'}`). `NavegadorRaiz.test.tsx`: los 3 roles llevan a su inicio; login con el cliente HTTP real lleva a «Hola, Ana Torres». `etiquetaDispositivo.test.ts` | curl ✔ con los 3 roles (token, `expiresAt`, `renewAfter`). Teléfono **pendiente** |
| CA2 Paso usuario | `LoginScreen.test.tsx`: vacío o solo espacios → alerta «Ingresa tu usuario» y no avanza; con usuario → cabecera «PIN para ana»; el submit del teclado también continúa | — |
| CA3 Teclado | `LoginScreen` y `Login.controller`: puntos 0→4, el 5.º se ignora, Borrar, Confirmar deshabilitado con menos de 4, envío solo al 4.º y una vez, «Volver al usuario» conserva el usuario, el atrás de Android en el paso 2 vuelve y se consume (el oyente se quita al salir), lo que no es dígito se ignora | — |
| CA4 Errores | `LoginScreen` y `Login.controller`: 401, 429, sin red y tiempo agotado → `role=alert` junto a los puntos, PIN vacío, sigue en el paso 2 y se puede reintentar. Mientras se envía: indicador «Verificando tu PIN», las 12 teclas y «Volver» deshabilitados, sin doble envío. `apiSesionRepository`: 401/429/red/500 propagan `msg` y `code` | curl ✔ 401 «Usuario o PIN incorrecto». 6 fallos → 429 en el teléfono **pendiente** |
| CA5 Sin token | `apiSesionRepository`: sin token, sin `expiresAt`, cuerpo vacío, rol desconocido (3 variantes) y student sin datos → error legible, sin respuesta. `LoginScreen`: el mensaje se ve y no navega | — |
| CA6 Token solo en almacén seguro, PIN nunca | `casosDeUso` (JSON exacto). `NavegadorRaiz`: tras el login de meli, las claves son exactamente `version, token, expiraEn, renovarDesde, usuario`, sin «1111» ni `pin`. `sesion.seguridad.test.ts`: sin `console.` en sesión, adaptadores y contenedor; sin AsyncStorage en `package.json` ni en `src`; sin `pin` en los parámetros de navegación ni en ningún `guardar(...)`. `KeychainSecureStorageAdapter.test.ts`: servicio `com.inglesconsebas.app.<clave>`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, sin `accessControl`, errores → null/false | — |
| CA7 Sesión persistente | `NavegadorRaiz`: con sesión guardada entra directo al inicio, sin login, con un solo `me` y sin `iniciarSesion` ni `renovar`. La respuesta de `me` actualiza el nombre y `expiraEn` guardados. Con el cliente real, `me` va como `GET auth.php?action=me` con Bearer | curl ✔ `me` (también el del admin trae `admin{}`). Reabrir en el teléfono **pendiente** |
| CA8 Arranque sin red | `NavegadorRaiz`: sin red y vigente → entra y conserva el almacén. Vencida, corrupta o `version:2` → borra y va al login sin llamar a la red ni mostrar el aviso. Además `casosDeUso` | Modo avión **pendiente** |
| CA9 401 con sesión | `NavegadorRaiz` con el cliente real: `me` 401 → almacén borrado, login con «Tu sesión venció. Vuelve a iniciar sesión.». El 401 del propio login no muestra el aviso y el estado sigue en `{tipo:'sinSesion'}`. `LoginScreen`: el aviso solo sale con `vencida` (no sin motivo ni con `cerrada`). Además `DependenciasProvider` y `casosDeUso` | curl + SQL ✔: tras revocar, `me` → 401 `session_revoked`. En el teléfono **pendiente** |
| CA10 Renovación | `casosDeUso`: dos llamadas concurrentes → un `renew`; con red caída se conserva; con 401, error. `NavegadorRaiz`: con `renovarDesde` pasado → un `renovar` y el token y el `renovarDesde` nuevos guardados. `apiSesionRepository`: `POST ?action=renew` con Bearer y sin cuerpo | curl + SQL ✔: `renew` da token nuevo y la sesión anterior queda con `replaced_by` |
| CA11 Cerrar sesión | `NavegadorRaiz` con el cliente real: logout `POST ?action=logout` con Bearer y `{}`, almacén borrado, login sin aviso; sin red también cierra. `InicioProvisionalScreen`: pasa a `sinSesion/cerrada`. `casosDeUso`: límite de 3 s | curl + SQL ✔: `revoked_at` y `revoke_reason='logout'`. En el teléfono **pendiente** |
| CA12 Navegación | `NavegadorRaiz`: `restaurando` → nada y el splash sigue; el splash se oculta una vez; tras el login el flujo Auth se desmonta. `rutaInicioPorRol.test.ts`: 3 roles y `rutaInicialAuth() === 'Login'` | Atrás desde el inicio **pendiente** |
| CA13 Diseño en los dos temas | `LoginScreen` en oscuro y claro: logo (header «Inglés con Sebas»), 10 dígitos + Borrar + Confirmar, Confirmar con fondo `confirmar` = #86EF86 y trazo negro (0xFF000000), puntos llenos con `marca`, enlace de WhatsApp, «Volver al usuario», dominio al pie. El botón de tema alterna oscuro↔claro | Capturas con `cmd uimode night yes/no` **pendientes** |
| CA14 WhatsApp | `LoginScreen`: URL exacta `wa.me/573205571518?text=<P5 codificado>`, y si falla, toast de error. `LinkingEnlacesAdapter.test.ts`: si `openURL` rechaza → false; no usa `canOpenURL` | Abrir WhatsApp **pendiente** |
| CA15 Accesibilidad | `LoginScreen`: teclas con rol, etiqueta y `minHeight` ≥ 64; tema, Continuar, Volver y enlace ≥ 44; puntos anunciados como «PIN: n de 4 dígitos», sin los dígitos visibles | — |
| CA16 Inicio provisional | `InicioProvisionalScreen.test.tsx`: nombre, rol, versión, entorno, servidor y Cerrar sesión; «Ver sistema de diseño» con `__DEV__=true` y oculto con `false` | — |
| CA17 Puerta | `npm run calidad` en verde (sección 2) | `ENVFILE=.env.dispositivo node scripts/gradle.mjs app:assembleDebug` → BUILD SUCCESSFUL, `app-debug.apk` (165 MB) |

**Archivos nuevos:**
- `src/modules/sesion/__tests__/apiSesionRepository.test.ts`
- `src/modules/sesion/__tests__/LoginScreen.test.tsx`
- `src/modules/sesion/__tests__/sesion.seguridad.test.ts`
- `src/native/adapters/__tests__/KeychainSecureStorageAdapter.test.ts`
- `src/native/adapters/__tests__/LinkingEnlacesAdapter.test.ts`
- `src/app/di/__tests__/etiquetaDispositivo.test.ts`
- `src/app/navigation/__tests__/rutaInicioPorRol.test.ts`

**Archivos ampliados:**
- `src/modules/sesion/__tests__/Login.controller.test.tsx`
- `src/app/navigation/__tests__/NavegadorRaiz.test.tsx`
- `src/app/inicio/__tests__/InicioProvisionalScreen.test.tsx`

## 2. Puerta automática (`npm run calidad`, exit 0)

- `tsc --noEmit`: sin errores.
- `eslint .`: sin problemas (incluye boundaries).
- `prettier --check`: «All matched files use Prettier code style!».
- `jest --coverage`: **28 suites, 538 tests, todos en verde** (antes: 21 suites y 438 tests).

| Carpeta | Stmts | Branch | Umbral |
|---|---|---|---|
| Global | 99,02 | 96,3 | 70 ✔ |
| `modules/sesion/domain` (+ `validations`) | 100 | 100 | 90 ✔ |
| `modules/sesion/aplications` (casos de uso) | 100 | 100 | 90 ✔ |
| `modules/sesion/aplications/controllers` | 98,86 | 94,44 | 90 ✔ |
| `modules/sesion/infrastructure` | 96,93 (antes 51) | 91,3 | — |
| `native/adapters` | 100 (antes 73,9) | 100 | — |

## 3. Fallos encontrados

Ningún fallo funcional contra los criterios. Dos observaciones de **mejora**, no bloqueantes:

- **`LoginScreen.tsx`**: el título del paso 2 usa `login.usuario.trim()` sin pasarlo a minúsculas. Si se escribe «ANA», sale «PIN para ANA», aunque se envía `ana`. El ejemplo de CA2 («PIN para ana») escribe «ana», así que se cumple; sería más coherente mostrar el usuario ya normalizado.
- **Backend (no es de la App)**: después de `renew`, el token anterior sigue respondiendo a `me` durante un tiempo. Parece una gracia de rotación de F1-02. No afecta a la App, que guarda el nuevo.

## 4. Verificación del backend local (curl y SQL sobre `u450750870_leap`)

- Login `ana`/`meli`/`yggodguz` con `client:'app'` → `role`, `token` de 64 hex, `expiresAt` a 30 días y `renewAfter` a 24 h. El admin solo trae `role` más el token, como supone el adaptador.
- `luis`/`9999` → 401 `{"error":"Usuario o PIN incorrecto","code":"invalid_credentials"}`.
- `me` con Bearer → 200 con `student{...}` o `admin{id,name,username}`.
- `renew` → token nuevo, con `replaced_by` en la fila anterior.
- `logout` → `{ok:true}`. Después `me` da 401 `session_revoked` y la fila queda con `revoke_reason='logout'`.
- `deviceLabel` se guarda en `auth_sessions.user_agent` (no hay columna `device_label`).
- Las sesiones que abrí con curl (ids 477–481) quedaron revocadas con `revoke_reason='tester'`. No toqué `auth_login_attempts` (16 filas).

## 5. Pasos manuales pendientes en el moto g77

Con el teléfono conectado: `adb reverse tcp:8081 tcp:8081`, `adb reverse tcp:8080 tcp:8080`, `ENVFILE=.env.dispositivo node scripts/gradle.mjs app:installDebug` y `adb shell am start -n com.inglesconsebas.app/.MainActivity`. Las capturas van en `docs/features/F1-03-login-sesion/capturas/`.

1. **CA1**: `ana`/`1234` → «Hola, Ana Torres · Rol: Estudiante». Repetir con `meli`/`1111` (Profe) y `yggodguz`/`2905` (Admin).
2. **CA4**: `ana` con PIN `0000` → «Usuario o PIN incorrecto» y los puntos vacíos. Con 6 fallos → mensaje del 429. Después: `DELETE FROM auth_login_attempts;`.
3. **CA7**: con sesión iniciada, cerrar desde recientes y reabrir → inicio sin pedir PIN.
4. **CA8**: modo avión y reabrir → entra igual.
5. **CA9**: `UPDATE auth_sessions SET revoked_at=NOW() WHERE client='app' AND revoked_at IS NULL;` y reabrir → login con «Tu sesión venció…».
6. **CA11**: «Cerrar sesión» → login vacío. Por SQL, la última sesión debe tener `revoke_reason='logout'`.
7. **CA12**: botón atrás desde el inicio → no vuelve al login.
8. **CA13**: capturas con `adb shell cmd uimode night yes` y luego `no`.
9. **CA14**: el enlace abre WhatsApp.
10. Al final, cerrar sesión y dejar la app instalada.

## 6. Veredicto

**VERDE** en lo automatizable: la puerta pasa, la cobertura supera los umbrales, cada criterio CA1–CA17 tiene al menos una prueba automática que pasa, y no hay fallos bloqueantes. Lo que el plan pedía comprobar a mano en el moto g77 (sección 5) **sigue pendiente** porque el teléfono no está conectado al PC. Conviene hacerlo antes de la demo del hito H-S2.

---

## Vuelta 1

> Tester, 2026-11-17. Vuelvo a probar sobre `d15840d`, con las correcciones del constructor `360ca03..d15840d`: B1, M1 (401 por token), M2 (título normalizado), M3 (toques rápidos) y tokens de espaciado. El teléfono sigue desconectado, así que no hay prueba manual.

Commits de tests de esta vuelta:
- `4e9871e test(sesion): carreras del arranque con logout, otro login y 401 tardío (vuelta 1)`;
- `0e2ff9f test(sesion): quita el toque rápido de pantalla que solapaba act (cubierto en el controller)`.

### V1.1 Pruebas nuevas

Archivo `src/modules/sesion/__tests__/carrerasSesion.test.tsx`. Usa los controllers reales (`useArranqueSesion` + `useSesionController`), con `me` y `renew` diferidos que el test resuelve en el orden que quiere.

| Caso | CA | Resultado |
|---|---|---|
| (a) Logout completo mientras `me` está en vuelo → al llegar `me` el almacén sigue vacío y el estado en `sinSesion` | CA7, CA11 | ✔ |
| (a) Logout mientras `renew` está en vuelo → el token renovado no vuelve al almacén | CA10, CA11 | ✔ |
| (a) `me` llega durante un borrado lento que se aplica **al terminar** | CA11 | ✔ |
| (a) `me` llega durante el borrado del Keychain, que se aplica **al empezar** (orden nativo real) | CA11 | **✘ FALLO V1-F1** (marcado `it.failing`) |
| (b) Logout + login de meli mientras está en vuelo el `me` de ana → almacén y estado siguen siendo de meli | CA7, B1 | ✔ |
| (b) Lo mismo con un `renew` tardío de ana | CA10, B1 | ✔ |
| `me` tardío pero vigente → sí actualiza el nombre en el almacén y en el estado | CA7 | ✔ |
| 401 tardío del `me` con `token-ana` cuando ya está autenticada meli (cliente HTTP real) → meli sigue y su almacén está intacto | CA9 | ✔ |
| 401 con el token activo → `sinSesion/vencida` y almacén borrado | CA9 | ✔ |
| `invalidarSesionUseCase`: con un token distinto o `null` no hace nada; con el token activo invalida | CA9 | ✔ |

Archivo `LoginScreen.test.tsx`: con «  ANA » el título es «PIN para ana», y al volver se conserva «  ANA » (CA2, M2) ✔.

Toques rápidos (CA3, M3): ya están cubiertos en `Login.controller.test.tsx` por el constructor, con 2 y con 4 toques en el mismo ciclo. Revisado ✔. Mi variante de pantalla generaba avisos de `act()` solapados y la quité.

Los tests de la vuelta 0 (CA1–CA16) siguen en verde con el código nuevo.

### V1.2 Puerta automática

`npm run calidad` → exit 0:
- `tsc`, `eslint` y `prettier` sin errores;
- **29 suites, 558 tests**, sin `console.error` en la salida;
- cobertura global de 99,04 % en statements y 96,16 % en branches;
- `sesion/domain` y `sesion/aplications` al 100 %, y `controllers` al 98,9 %.

### V1.3 Fallo

**V1-F1 · bloqueante (resto de B1): un `me` o `renew` que llega mientras se borra el almacén del logout vuelve a escribir la sesión cerrada.**

- **Dónde:** `src/modules/sesion/aplications/controllers/Sesion.controller.ts:59-60` (`await cerrarSesionUseCase(...)` y, solo después, `establecer({tipo:'sinSesion'})`), junto con `arrancarSesion.ts:38` (`sigueVigente` solo compara el token).
- **Por qué pasa:** durante todo el cierre (logout de hasta 3 s y luego `almacen.borrar`) la sesión sigue `autenticado` con el mismo token. Por eso `sigueVigente()` es `true` y `validarSesion.ts:44` (o `renovarSesion`) llama a `guardar`.
  - Si `guardar` llega **antes** de `borrar`, no hay problema: el borrado lo limpia.
  - Si llega **mientras** `borrar` está en curso, el `resetGenericPassword` del Keychain ya se aplicó en el hilo nativo y el `setGenericPassword` posterior vuelve a escribir la sesión de ana.
- **Qué se espera:** tras «Cerrar sesión», el almacén queda vacío (CA11, y el caso (a) pedido en esta vuelta).
- **Qué ocurre:** el estado queda en `sinSesion/cerrada`, pero el almacén conserva la sesión de ana. En el siguiente arranque se restaura una sesión revocada: con red sale «Tu sesión venció»; sin red se **entra** con una sesión cerrada.
- **Reproducción:** `carrerasSesion.test.tsx`, caso «(a) me llega mientras el Keychain borra…». Hoy es `it.failing` para no romper la puerta; cuando se corrija, fallará, y hay que cambiarlo a `it`.
- **Alcance:** la ventana es corta (lo que tarda la llamada nativa de borrado), pero es real, y es justo la carrera que B1 pedía cerrar.
- **Corrección posible (decide el constructor):** que el cierre deje de ser «vigente» antes de borrar. Por ejemplo:
  - capturar el token, pasar a `sinSesion/cerrada` (o marcar «cerrando») y luego hacer logout y borrar;
  - o que `sigueVigente` también compruebe una marca de cierre.

### V1.4 Veredicto (vuelta 1)

**ROJO.** Hay un bloqueante: **V1-F1**. El resto de correcciones está verificado con tests propios:
- logout durante `me`/`renew` con el borrado ya terminado;
- login de otro usuario durante `me`/`renew` de la sesión anterior;
- 401 tardío con token viejo;
- título normalizado;
- toques rápidos.

La verificación manual en el moto g77 sigue pendiente (teléfono desconectado).
