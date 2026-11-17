# Plan · F1-03 · Login, sesión y navegación

> Redactado por el agente **planificador** el 2026-11-16 en la rama `feat/F1-03-login-sesion` (sale de `main` en `febe7c6`).
> Tarjeta: tablero «App móvil · Inglés con Sebas» (APL-Tareas #4), Anexo 1, ítems 1.11 a 1.16. Fechas: del 2026-11-16 al 2026-11-27. El hito **H-S2** («versión instalable con splash y login») vence el **2026-11-20**.
> Estado: APROBADO por el usuario el 2026-11-16 (pidió ejecutar todas las fases sin detenerse; se adoptan las opciones por defecto de P1–P9).

## 0. Definition of Ready: estado

| Punto | Estado |
|---|---|
| Código de tablero | ✔ F1-03 |
| Criterios verificables | ✔ Sección 3: cada uno tiene un test o un paso manual |
| Dependencias identificadas | ⚠ **Backend F1-02.** El login con token, `me`, `renew` y `logout` solo existen en la rama `feat/F1-02-seguridad-api` del repo web (33 commits sobre `main`, sin desplegar). Su `aprobacion.md` sigue en «RECHAZADO (vuelta 1)», con commits posteriores de la vuelta 2. En local funciona, porque el Docker monta el árbol de `../app`, que hoy está en esa rama. En **producción no existe**, así que ver R1 y P1. Nativo: `react-native-keychain` (nuevo). Feature siguiente: EXT-01 (onboarding), que se engancha aquí. |
| API inexistente → adaptador en memoria | La API existe en código. Además, `MemoriaSesionRepository` implementa el mismo puerto para los tests de pantalla y del flujo. |
| `plan.md` aprobado | Pendiente |

La feature **cumple la DoR para construir y verificar en local**. Distribuir a testers contra producción **no** es posible hasta que F1-02 esté desplegada (P1).

---

## 1. Resumen

La feature resuelve tres cosas para los tres roles (estudiante, profe y admin), dentro de la fase F1 del contrato (sección 4 de `02-propuesta-app-movil.md`, «login con usuario y PIN, sesión persistente»):

- **1.11**: entrar con usuario y PIN de 4 dígitos.
- **1.12**: no volver a pedir el PIN mientras la sesión del servidor siga viva. Para la App son 30 días de inactividad y 90 días de tope absoluto (`seguridad.php:17-20`).
- **Flujo de navegación**: splash → (onboarding, cuando exista) → login → inicio provisional según el rol, con **cerrar sesión**.

También cablea lo que F1-01 dejó pendiente en `src/app/di/contenedor.ts`:
- `obtenerToken` lee el token de la sesión activa;
- `alNoAutorizado` limpia la sesión y vuelve al login.

## 2. Alcance

**Entra**
- El módulo `sesion` completo: dominio, infraestructura, casos de uso, controllers y pantalla de login.
- Los puertos nativos nuevos:
  - `SecureStoragePort`, con su adaptador de `react-native-keychain`;
  - `EnlacesPort`, con su adaptador de `Linking`, para el enlace de WhatsApp. Lo reutilizará el ítem 1.16.
- Login en dos pasos, según el lienzo aprobado:
  - paso 1: usuario;
  - paso 2: «PIN para <usuario>», con 4 puntos y un teclado 3×4;
  - botón para volver al usuario, enlace de WhatsApp, dominio al pie y botón de tema.
- Sesión persistente en el almacén seguro.
  - Al arrancar: se restaura la sesión guardada, se valida con `me`, se renueva con `renew` si toca, y un 401 la limpia.
- Navegación con dos flujos, `Auth` y `App`:
  - en `Auth` queda el punto de enganche del onboarding;
  - en `App` se elige la ruta de inicio por rol.
- Cerrar sesión: `logout` en el servidor y borrado local, también sin red.
- El inicio provisional pasa a mostrar el nombre y el rol y a tener «Cerrar sesión». El escaparate solo se ve en `__DEV__`.
- Documentación para probar en el moto g77 por USB.

**No entra.** Pendiente para **F1-03b**:
- **1.13** Desbloqueo con huella o Face ID.
- **1.14** Perfil, cambio de PIN y **guardar la preferencia de tema**. Aquí el botón de tema solo alterna en memoria.
- **1.15** Pantalla sin conexión y caché local. Aquí solo se tolera arrancar sin red con la sesión guardada (CA8).
- **1.16** Abrir en la web con la sesión iniciada. Además depende del backend **F1-02B** (traspaso de sesión).
- Volver a validar o renovar al pasar la app a primer plano (AppState). Solo se hace al arrancar.
- Registro de dispositivo push y `pushToken` en el logout (ítem 2.10).
- El onboarding en sí (EXT-01).

## 3. Criterios de aceptación

Los usuarios de prueba vienen de `../docker/db/02-seed.sql` y `../README.md`:
- admin `yggodguz`/`2905`;
- profe `meli`/`1111`;
- estudiante `ana`/`1234`.

| CA | Criterio | Verificación |
|---|---|---|
| CA1 | **Login por rol.** Con `ana`/`1234` la app llega a `InicioEstudiante` y muestra «Ana Torres». Con `meli`/`1111` llega a `InicioProfe`. Con `yggodguz`/`2905` llega a `InicioAdmin` (nombre «Admin»). La petición es `POST auth.php` con `{username, pin, client:'app', deviceLabel}`. El `username` va recortado y en minúsculas: «  ANA » se envía como `ana`. | Test del adaptador con `fetchImpl` falso y test del flujo con `MemoriaSesionRepository`. Manual en el moto g77 con los 3 roles. |
| CA2 | **Paso usuario.** Con el campo vacío, «Continuar» muestra «Ingresa tu usuario» junto al campo y no avanza. Con usuario, pasa al paso 2 con el título «PIN para ana». | Test de pantalla |
| CA3 | **Teclado de PIN.** Cada dígito llena un punto, hasta 4. El 5.º se ignora. «Borrar» quita el último. «Confirmar» solo está activo con 4 dígitos. Al 4.º dígito se envía solo (como la web, P2). «Volver al usuario» vacía el PIN y vuelve al paso 1 con el usuario escrito. El botón atrás de Android en el paso 2 hace lo mismo. | Test de pantalla y del controller |
| CA4 | **Errores del login.** Se muestran junto a los puntos (`accessibilityRole="alert"`), el PIN se vacía y la app sigue en el paso 2. El 401 muestra el mensaje del servidor («Usuario o PIN incorrecto»). El 429 muestra el mensaje del servidor con los minutos. Sin red o con tiempo agotado se muestran los textos de `textosComunes.errores`. Mientras se envía, el teclado está deshabilitado, hay indicador de carga y no hay envíos dobles. | Tests del controller y de la pantalla. Manual: 6 fallos de `ana` → 429. |
| CA5 | **Respuesta sin token.** Es el `auth.php` de producción sin F1-02. Da un error legible («El servidor todavía no admite la sesión de la App»), no guarda nada y no navega. Lo mismo pasa con un `role` desconocido. | Test del adaptador |
| CA6 | **El token solo va por `SecureStoragePort`.** Tras el login se llama `guardar('sesion', json)` con exactamente `{version:1, token, expiraEn, renovarDesde, usuario:{id, nombre, usuario, rol}}`. **El PIN nunca se guarda ni se registra:** el JSON no tiene clave `pin`, el PIN no está en los parámetros de navegación, el estado del controller lo vacía tras cada intento y no hay `console.*` en el módulo. No se añade AsyncStorage. | Test con almacén falso espía. Grep de `console.` y de `pin` en la persistencia. Revisión de `package.json`. |
| CA7 | **Sesión persistente.** Con una sesión guardada y vigente, la app arranca sin pedir el PIN: el splash da paso al inicio del rol. Hace un único `GET auth.php?action=me` con `Authorization: Bearer`, y su respuesta actualiza el nombre y `expiraEn` guardados. | Test del flujo. Manual: login, cerrar la app desde recientes y reabrir; al día siguiente, reabrir. |
| CA8 | **Arranque sin red.** Si la sesión guardada no está vencida (`expiraEn` > ahora), la app entra con los datos guardados y no pide el PIN. Si `expiraEn` ya pasó, se borra el almacén y se va al login sin llamar a la red. Si el JSON guardado está corrupto, se borra y se va al login. | Tests de casos de uso. Manual con el modo avión. |
| CA9 | **401 con sesión.** Un 401 en cualquier petición con sesión activa borra el almacén y lleva al login. El login muestra el aviso en línea «Tu sesión venció. Vuelve a iniciar sesión.». Un 401 del propio login (credenciales) **no** dispara limpieza ni aviso. | Test de `invalidarSesionUseCase` y del contenedor. Manual: `UPDATE auth_sessions SET revoked_at=NOW()` en Adminer y reabrir la app. |
| CA10 | **Renovación.** Si al arrancar ahora ≥ `renovarDesde`, se llama `POST auth.php?action=renew` **una sola vez**, aunque se pida dos veces a la vez, y se guarda el token nuevo con su `renovarDesde`. Si el `renew` falla por red, se conserva el token actual. Si da 401, se invalida (CA9). | Test del caso de uso con repo falso y dos llamadas concurrentes. Manual: poner en el JSON un `renovarDesde` pasado no es práctico, así que se verifica por test y con SQL (`auth_sessions.replaced_by`). |
| CA11 | **Cerrar sesión.** «Cerrar sesión» en el inicio envía `POST auth.php?action=logout` con Bearer, borra el almacén y lleva al login (paso usuario vacío). Sin red también cierra: la espera por el servidor dura como mucho 3 s. Después, la sesión queda con `revoked_at` en `auth_sessions`. | Tests del caso de uso y de la pantalla. Manual + SQL. |
| CA12 | **Navegación.** El splash nativo sigue visible hasta que termina la restauración, y luego se oculta una sola vez (`onReady`). Sin sesión se muestra el flujo `Auth`, cuya ruta inicial sale de `rutaInicialAuth()` (hoy `'Login'`; el punto de enganche de EXT-01). Con sesión se muestra `App`, con la ruta `rutaInicioPorRol(rol)`. Desde el inicio, el botón atrás no vuelve al login. | Test de `NavegadorRaiz` con dependencias falsas. Manual. |
| CA13 | **Diseño según el lienzo, en los dos temas.** Lleva arriba el logo oficial (`Marca`) y una tarjeta con los pasos. Los 4 puntos se rellenan con `marca`. El teclado es 3×4: 1–9, borrar, 0 y confirmar (fondo #86EF86 y check negro en los dos temas, con los tokens nuevos `confirmar`/`sobreConfirmar`, P8). Están el botón «Volver al usuario», el enlace «¿Olvidaste tu PIN? Escríbenos por WhatsApp» y el dominio `app.inglesconsebas.com` al pie. El botón de tema, arriba a la derecha, alterna entre oscuro y claro (sin guardar). No hay hex en la pantalla. | Tests de pantalla en los dos temas. Manual: captura en el moto g77 con el modo oscuro del sistema activado y desactivado. |
| CA14 | **Enlace de WhatsApp.** Llama `EnlacesPort.abrir('https://wa.me/573205571518?text=<mensaje codificado>')`. Si no se puede abrir, muestra `notify.error`. | Test del controller con un puerto falso. Manual: abre WhatsApp. |
| CA15 | **Accesibilidad e i18n.** Todas las teclas, botones y el enlace llevan `accessibilityRole` y `accessibilityLabel` («Dígito 1», «Borrar», «Confirmar PIN», «Cambiar a tema claro»). Las teclas miden ≥ 64 dp y el resto ≥ 44. Los puntos se anuncian como «PIN: 2 de 4 dígitos», nunca los dígitos. Los textos están en `*.textos.ts` y `sesion.mensajes.ts`. | Test de pantalla (`getByRole` / `getByLabelText`) |
| CA16 | **Inicio provisional.** Muestra el saludo con el nombre, el rol, la versión, el entorno y el servidor, y el botón «Cerrar sesión». «Ver sistema de diseño» solo aparece con `__DEV__`. | Test de pantalla |
| CA17 | **Puerta.** `npm run calidad` en verde, con ≥ 90 % en `src/modules/sesion/domain` y `aplications`. `npm run build:android:debug` compila con `react-native-keychain`. | CI / desplegador |

## 4. Dominio

### 4.1 Entidades: `src/modules/sesion/domain/entities/Sesion.entities.ts`

```ts
export type RolUsuario = 'estudiante' | 'profe' | 'admin';

export interface IArgsIniciarSesion { usuario: string; pin: string; }

export interface IResponseUsuario {
  id: string;          // students.id / teachers.id / 'admin'
  nombre: string;      // name ('Admin' para el admin)
  usuario: string;     // username
  rol: RolUsuario;
}

export interface IResponseSesion {
  token: string;
  expiraEn: string;            // ISO UTC (expiresAt)
  renovarDesde: string | null; // ISO UTC (renewAfter)
  usuario: IResponseUsuario;
}

/** Lo que se guarda en el almacén seguro (JSON). Nunca el PIN. */
export interface ISesionGuardada extends IResponseSesion { version: 1; }

export type MotivoSinSesion = 'cerrada' | 'vencida';
export type EstadoSesion =
  | { tipo: 'restaurando' }
  | { tipo: 'sinSesion'; motivo?: MotivoSinSesion }
  | { tipo: 'autenticado'; sesion: IResponseSesion };

/** Datos de validar con `me`: usuario al día y nueva expiración. */
export interface IResponseUsuarioActual { usuario: IResponseUsuario; expiraEn: string; }
/** Respuesta de renew. */
export interface IResponseRenovacion { token: string; expiraEn: string; renovarDesde: string | null; }
```

### 4.2 Puertos

`src/modules/sesion/domain/models/SesionRepository.ts` (remoto):
```ts
export interface SesionRepository {
  iniciarSesion(args: IArgsIniciarSesion): Promise<HttpResponse<IResponseSesion>>;
  obtenerUsuarioActual(): Promise<HttpResponse<IResponseUsuarioActual>>; // me (Bearer del cliente)
  renovar(): Promise<HttpResponse<IResponseRenovacion>>;                  // renew
  cerrarSesion(): Promise<HttpResponse<void>>;                            // logout, idempotente
}
```

`src/modules/sesion/domain/models/SesionActiva.ts` es el estado observable en memoria. Lo crea el contenedor y lo comparten el cliente HTTP y React:
```ts
export interface SesionActiva {
  obtener(): EstadoSesion;
  token(): string | null;                    // solo con 'autenticado'
  establecer(estado: EstadoSesion): void;
  suscribir(oyente: () => void): () => void; // para useSyncExternalStore
}
```

`src/native/ports/SecureStoragePort.ts` (nuevo, genérico):
```ts
/** Almacén cifrado del sistema (Keychain en iOS, Keystore en Android). Nunca rechaza. */
export interface SecureStoragePort {
  leer(clave: string): Promise<string | null>;       // null si no hay o si falla
  guardar(clave: string, valor: string): Promise<boolean>;
  borrar(clave: string): Promise<void>;
}
```

`src/native/ports/EnlacesPort.ts` (nuevo):
```ts
/** Abre una URL fuera de la app (navegador, WhatsApp). Nunca rechaza. */
export interface EnlacesPort { abrir(url: string): Promise<boolean>; }
```

### 4.3 Validaciones puras: `src/modules/sesion/domain/validations/sesion.validations.ts`

- `normalizarUsuario(texto): string`: `trim().toLowerCase()`, igual que `auth.php:125`.
- `validarUsuario(texto): string | null`: devuelve un mensaje si está vacío tras normalizar.
- `validarPin(pin): string | null`: exige `/^\d{4}$/`.
- `agregarDigito(pin, digito): string` y `quitarDigito(pin): string`: tope de 4.
- `sesionVencida(sesion, ahora: Date): boolean`: compara `expiraEn` con ahora.
- `debeRenovar(sesion, ahora: Date): boolean`: `renovarDesde !== null && ahora >= renovarDesde`.
- `serializarSesion(sesion): string` y `leerSesionGuardada(texto: string | null): ISesionGuardada | null`. La segunda valida la forma y la versión, y devuelve null si el JSON es inválido.
- `urlAyudaPin(): string`: arma la URL `wa.me` con el mensaje codificado.
- Constantes: `LONGITUD_PIN = 4`, `CLAVE_SESION = 'sesion'`, `LIMITE_CIERRE_REMOTO_MS = 3000`, `TELEFONO_WHATSAPP = '573205571518'`.

Los mensajes de dominio van en `src/modules/sesion/domain/sesion.mensajes.ts`: errores de validación, «respuesta sin token» y «rol no reconocido».

## 5. Archivos por capa, en orden de construcción

**Nativo (paso previo, porque los casos de uso usan los puertos)**
1. `package.json` + `package-lock.json`: `react-native-keychain` **11.0.0**, versión fijada.
2. `src/native/ports/SecureStoragePort.ts` y `src/native/ports/EnlacesPort.ts`.
3. `src/native/adapters/KeychainSecureStorageAdapter.ts`: `crearKeychainSecureStorageAdapter()`.
   - Cada clave usa un servicio propio: `com.inglesconsebas.app.<clave>`, con `setGenericPassword('app', valor, { service })`, `getGenericPassword({ service })` y `resetGenericPassword({ service })`.
   - Usa `accessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` y no pone `accessControl`, porque la biometría es el ítem 1.13.
   - Atrapa todos los errores: `leer` devuelve null, `guardar` devuelve false.
4. `src/native/adapters/LinkingEnlacesAdapter.ts`: `crearLinkingEnlacesAdapter()`, con `Linking.openURL` en try/catch. No usa `canOpenURL`, así que no hace falta `<queries>`.
5. `jest.setup.ts`: mock de `react-native-keychain` con un `Map` en memoria.

**Dominio**

6. `src/modules/sesion/domain/entities/Sesion.entities.ts`
7. `src/modules/sesion/domain/models/SesionRepository.ts` y `src/modules/sesion/domain/models/SesionActiva.ts`
8. `src/modules/sesion/domain/validations/sesion.validations.ts` y `src/modules/sesion/domain/sesion.mensajes.ts`

**Infraestructura**

9. `src/modules/sesion/infrastructure/leap.tipos.ts`: tipos crudos de `auth.php`:
   - `ILeapLogin`: `{role:'admin'|'teacher'|'student', teacher?, student?, token?, tokenType?, expiresIn?, expiresAt?, renewAfter?}`;
   - `ILeapMe`;
   - `ILeapRenovacion`.

   Solo se tipan los campos que se usan: `id`, `name` y `username`.
10. `src/modules/sesion/infrastructure/apiSesionRepository.ts`: `crearApiSesionRepository(api: ClienteApi, opciones: { etiquetaDispositivo: string }): SesionRepository`.
    - Rol: `student→estudiante`, `teacher→profe`, `admin→admin`. Con el admin, el login no trae datos, así que usa `{id:'admin', nombre:'Admin', usuario: <usuario enviado>}`.
    - Sin `token`, o con un rol desconocido, devuelve `respuestaError` con el mensaje del dominio (CA5).
11. `src/modules/sesion/infrastructure/memoriaSesionRepository.ts`: `crearMemoriaSesionRepository(usuarios?)`. Implementa el mismo puerto con los usuarios del seed. Lo usan los tests de flujo y pantalla.

**Casos de uso** (funciones puras que reciben repo, almacén y estado por parámetro)

12. `src/modules/sesion/aplications/iniciarSesion/iniciarSesion.ts`: `iniciarSesionUseCase(repo, almacen, args)`.
    - Valida y normaliza.
    - Llama `repo.iniciarSesion`.
    - Llama `almacen.guardar(CLAVE_SESION, serializar)`. Si falla, devuelve el error «No se pudo guardar la sesión en este teléfono».
    - Devuelve `HttpResponse<IResponseSesion>`. No conoce el PIN más allá de la llamada.
13. `src/modules/sesion/aplications/restaurarSesion/restaurarSesion.ts`: `restaurarSesionUseCase(almacen, ahora)`.
    - Lee y parsea la sesión guardada.
    - Si está corrupta o vencida, la borra y devuelve null.
14. `src/modules/sesion/aplications/validarSesion/validarSesion.ts`: `validarSesionUseCase(repo, almacen, sesion)`.
    - Llama `me`.
    - Si responde 200, fusiona el usuario y `expiraEn` y guarda.
    - Si falla por red o 5xx, devuelve la sesión tal cual (`error:false`).
    - Si da 401, devuelve el error, porque la limpieza la hace `alNoAutorizado`.
15. `src/modules/sesion/aplications/renovarSesion/renovarSesion.ts`: `crearRenovadorSesion()` devuelve `renovar(repo, almacen, sesion)`. Comparte la promesa en vuelo para que solo haya un `renew` a la vez (CA10). Guarda el token nuevo.
16. `src/modules/sesion/aplications/cerrarSesion/cerrarSesion.ts`: `cerrarSesionUseCase(repo, almacen, limiteMs = LIMITE_CIERRE_REMOTO_MS)`. Hace `Promise.race(repo.cerrarSesion(), espera(limiteMs))`, luego `almacen.borrar`, y siempre devuelve `error:false`.
17. `src/modules/sesion/aplications/invalidarSesion/invalidarSesion.ts`: `invalidarSesionUseCase(almacen, sesionActiva)`. Solo actúa si el estado es `autenticado`: borra el almacén y pasa a `{tipo:'sinSesion', motivo:'vencida'}`.
18. `src/modules/sesion/aplications/sesionActiva.ts`: `crearSesionActiva(inicial = {tipo:'restaurando'}): SesionActiva`. Es un store sin React.

**Controllers**

19. `src/modules/sesion/aplications/controllers/Sesion.controller.ts`
    - `useSesionController()` devuelve `{ estado, usuario, _iniciarSesion(args), _cerrarSesion() }`. Usa `useSyncExternalStore` sobre `useSesionActiva()`, `useRepository('sesion')` y `useNative('almacenSeguro')`.
    - `useArranqueSesion()` se ejecuta una vez: restaurar → `establecer` → en segundo plano validar y, si toca, renovar.
20. `src/modules/sesion/aplications/controllers/Login.controller.ts`
    - `useLoginController()` devuelve `{ paso, usuario, pin, error, cargando, motivoAviso, _cambiarUsuario, _continuar, _volverAlUsuario, _pulsarDigito, _borrar, _confirmar, _abrirAyudaPin }`.
    - Envía solo al 4.º dígito, con un guard contra el doble envío.
    - Vacía el PIN tras cada intento.
    - El estado del paso vive en el controller, no en la navegación.

**Tema (pequeño ajuste compartido)**

21. `src/shared/theme/temas.ts`: tokens `confirmar` (`paleta.verde`) y `sobreConfirmar` (`paleta.negro`) en los dos temas, con la interfaz `IColoresTema` actualizada (P8).

**Presentación**

22. `src/modules/sesion/presentation/sesion.textos.ts`: títulos, «PIN para ${usuario}», etiquetas de accesibilidad, enlace, dominio del pie, aviso de sesión vencida y mensaje de WhatsApp.
23. `src/modules/sesion/presentation/components/PuntosPin.tsx`, `TecladoPin.tsx`, `BotonTema.tsx` (íconos con `react-native-svg`), `PasoUsuario.tsx` y `PasoPin.tsx`.
24. `src/modules/sesion/presentation/screens/LoginScreen.tsx`
    - Monta `Pantalla desplazable`, `BotonTema`, `Marca`, `Tarjeta` con el paso activo, `AvisoEnLinea` si `motivo==='vencida'` y el pie.
    - Usa `BackHandler` con `useFocusEffect` en el paso PIN.
25. `src/modules/sesion/presentation/navigation.tsx`: `AuthParamList = { Login: undefined }`, `rutaInicialAuth(): keyof AuthParamList` (hoy `'Login'`; EXT-01 añadirá `'Onboarding'` y su condición) y `pantallasAuth(Pila)`, que registra las pantallas del flujo dentro del navegador raíz.

**Navegación y composición (`src/app`)**

26. `src/app/navigation/tipos.ts`: `RaizParamList = AuthParamList & AppParamList`, con `AppParamList = { InicioEstudiante; InicioProfe; InicioAdmin; SistemaDiseno }`.
27. `src/app/navigation/rutaInicioPorRol.ts`: `rutaInicioPorRol(rol: RolUsuario): 'InicioEstudiante' | 'InicioProfe' | 'InicioAdmin'`.
28. `src/app/navigation/NavegadorRaiz.tsx`
    - Llama `useArranqueSesion()`.
    - Con `restaurando` devuelve `null`, así que el splash sigue.
    - Si no, monta el `NavigationContainer` y pinta los grupos de pantallas según el estado (patrón de flujo de autenticación de React Navigation, sin `navigate` imperativo).
    - `onReady` oculta el splash como hoy.
29. `src/app/inicio/InicioProvisionalScreen.tsx` + `inicio.textos.ts`
    - Recibe el rol de la ruta y muestra saludo, rol y datos.
    - El botón «Cerrar sesión» llama `_cerrarSesion`.
    - El escaparate solo se ve con `__DEV__`.

**DI**

30. `src/app/di/etiquetaDispositivo.ts`: `etiquetaDispositivo(info = Platform)`, que es pura y probable. Da `"<Brand> <Model> · Android <Release>"` o `"iOS <Version>"`, con un máximo de 100 caracteres.
31. `src/app/di/contenedor.ts`
    - Añade `IRepositorios.sesion: SesionRepository`, `INativos.almacenSeguro: SecureStoragePort` e `INativos.enlaces: EnlacesPort`, e `IDependencias.sesionActiva: SesionActiva`.
    - Orden de creación: almacén → `sesionActiva` → `api` (`obtenerToken: () => Promise.resolve(sesionActiva.token())`, `alNoAutorizado: () => void invalidarSesionUseCase(almacen, sesionActiva)`) → `crearApiSesionRepository(api, { etiquetaDispositivo: etiquetaDispositivo() })`.
32. `src/app/di/DependenciasProvider.tsx` + `index.ts`: hook `useSesionActiva()`.

**Documentación y configuración**

33. `README.md`
    - Dependencia nativa (qué hace, sin permisos, `pod install` pendiente).
    - Sección «Probar en un teléfono por USB» (sección 7).
    - Usuarios de prueba.
34. `CLAUDE.md`: sección «Sesión (F1-03)». Sustituye la línea «Sesión pendiente» y la de la ruta inicial provisional.
35. `.env.example`: **solo un comentario** con la variante para dispositivo físico. Los valores no cambian.

**Tests existentes afectados**

`src/app/navigation/__tests__/NavegadorRaiz.test.tsx`, `src/app/__tests__/App.test.tsx` y `src/app/inicio/__tests__/*` montan el contenedor real y una ruta inicial que deja de existir. Hay que adaptarlos con `DependenciasProvider valor={…}`, usando `crearMemoriaSesionRepository`, un almacén falso y `crearSesionActiva`.

## 6. API

Toda la API está en `../app/api/auth.php`, en el código actual de la rama `feat/F1-02-seguridad-api`. `config.php:26-32` permite `Authorization` y expone `Retry-After`. Los errores salen por `denegar()` (`seguridad.php:32`) con la forma `{error, code}`. El cliente ya extrae `error` como `msg` y deja el estado HTTP en `code`.

| Uso | Método y ruta | Entrada | Respuesta 2xx (campos que se usan) | Errores |
|---|---|---|---|---|
| Login | `POST auth.php` (`:116-266`) | `{username, pin, client:'app', deviceLabel}` | `role`; `teacher{id,name,username}` o `student{id,name,username}` (el admin solo trae `role`); `token` (64 hex), `expiresAt`, `renewAfter` (`seguridad.php:202-214`) | 400 `bad_request` · 401 `invalid_credentials` «Usuario o PIN incorrecto» (`:233`) · 429 `too_many_attempts` con mensaje en minutos y `retryAfter` (`:136-141`) |
| Validar | `GET auth.php?action=me` (`:89-112`) | Bearer | `role`, `expiresAt`, `student`/`teacher`/`admin{id,name,username}`. Se ignoran `diag` y los demás campos | 401 `session_missing/invalid/expired/revoked` |
| Renovar | `POST auth.php?action=renew` (`:67-70`, `renovarSesion` en `seguridad.php:245`) | Bearer, sin cuerpo | `token`, `expiresAt`, `renewAfter` | 401 `session_revoked` |
| Cerrar | `POST auth.php?action=logout` (`:72-87`) | Bearer, `{}` | `{ok:true}`, idempotente | — |

**Datos útiles del servidor**

- Vida de la sesión de la App: 30 días de inactividad deslizante (cada petición la renueva), 90 días de tope absoluto y `renewAfter` a las 24 h (`seguridad.php:17-20`).
- Límites de intentos en 15 min (`:352-356`):
  - 5 por usuario+IP;
  - 20 por usuario;
  - 30 por IP.

**No se depende de** `pkg`, `tokensUsed`, `cycle`, `email` ni `canEditTopics`. Los usará el inicio real (1.17).

**Cambios de backend:** ninguno en esta feature. El requisito es que F1-02 esté **aprobada y desplegada** antes de distribuir a testers contra producción (P1). El `auth.php` de `main` (y de producción) responde al login sin `token`, y la App lo trata como error legible (CA5).

## 7. Pasos nativos

**Dependencia: `react-native-keychain@11.0.0`** (MIT, publicada el 2026-11-06, `peerDependencies react-native >=0.82`, TurboModule con codegen `RNKeychainSpec`).
- **Por qué esta:** guarda el token en Keychain (iOS) y en Android Keystore (AES-GCM) detrás de un solo API, y está mantenida. Las otras opciones se descartan:
  - `react-native-encrypted-storage` no se actualiza desde 2022;
  - `expo-secure-store` exige el runtime de Expo modules;
  - un TurboModule propio es más trabajo y más riesgo.
- Si la 11.0.0 falla al compilar con RN 0.88.1, el respaldo es la `10.0.0` (P6).

**Android**
- Autolinking: no hay que tocar Gradle a mano. Hay que comprobar que `minSdk 24` cumple con el mínimo de la librería.
- **Sin permisos nuevos.**
- `allowBackup="false"` ya está en el manifiesto. Evita restaurar datos cifrados con una clave del Keystore que no viaja en el respaldo.
- Compilar con `npm run build:android:debug` o `node scripts/build-apk.mjs`. El codegen añade rutas de CMake, y la unidad `subst` del script evita el límite de 260 caracteres (R3).

**iOS (pendiente sin Mac)**
- Falta `pod install` y versionar `Podfile.lock`.
- No necesita textos en `Info.plist`: `NSFaceIDUsageDescription` llega con el ítem 1.13.
- No necesita la capability Keychain Sharing.
- Ojo: el Keychain de iOS **sobrevive a la desinstalación** (R7).

**`EnlacesPort`**: usa `Linking` del core. Sin pasos nativos ni `<queries>`, porque no se usa `canOpenURL`.

**Probar en el moto g77 por USB** (va al README)
1. Levantar Leap en `../`: `docker compose up -d --build`. El árbol de `../app` debe estar en la rama `feat/F1-02-seguridad-api`, o en `main` cuando F1-02 se fusione. Comprobación: `curl -X POST localhost:8080/api/auth.php -d '{"username":"ana","pin":"1234","client":"app"}'` devuelve `token`.
2. Conectar el teléfono con la depuración USB y ejecutar `adb devices` y luego `adb reverse tcp:8080 tcp:8080`. Hay que repetir el `reverse` cada vez que se reconecta el cable.
3. Crear `.env.dispositivo` (ya lo ignora `.env.*` en `.gitignore`) con `API_URL=http://localhost:8080/api` y `APP_ENV=dev`.
4. Compilar con ese archivo:
   - PowerShell: `$env:ENVFILE='.env.dispositivo'; npm run android`;
   - Git Bash: `ENVFILE=.env.dispositivo npm run android`.

   `react-native-config` lo incrusta en el build, así que cambiar de archivo exige recompilar el nativo. HTTP en claro solo se permite en debug: el plugin de Gradle de RN pone `usesCleartextTraffic=true` en debug.
5. El emulador sigue con `.env` (`10.0.2.2`). Con `adb reverse`, `localhost` también funciona en el emulador.
6. Usuarios: `yggodguz/2905` (admin), `meli/1111` y `caro/2222` (profes), `ana`, `luis` y `sofia` con `1234` (estudiantes).
7. Detrás de `adb reverse`, todas las pruebas comparten la IP de la pasarela de Docker y, por tanto, el límite de 30 fallos por IP. Para desbloquear, ejecutar en Adminer (:8081) `DELETE FROM auth_login_attempts;`.
8. Para revocar una sesión (CA9): `UPDATE auth_sessions SET revoked_at=NOW() WHERE client='app';`.

## 8. Plan de pruebas

| CA | Archivo | Qué se prueba | Doble |
|---|---|---|---|
| CA1, CA5 | `src/modules/sesion/__tests__/apiSesionRepository.test.ts` | Cuerpo y URL del login con `client:'app'`. Mapeo de los 3 roles (admin sin datos). Sin `token` → error. Rol desconocido → error. `me`, `renew` y `logout` con su ruta y método. 401/429 propagan `msg` y `code` | `crearClienteApi` con `fetchImpl` falso |
| CA2-CA4, CA6 | `__tests__/iniciarSesion.test.ts` | Validación de usuario vacío y PIN ≠ 4 dígitos sin llamar al repo. Normalización. Guarda el JSON exacto sin `pin`. Fallo de `guardar` → error. Error del repo → no guarda | Repo falso y almacén espía |
| CA7, CA8 | `__tests__/restaurarSesion.test.ts`, `validarSesion.test.ts` | Sin dato, corrupto o vencido → null y borrado. Vigente → sesión. `me` 200 → fusiona y guarda. Red/5xx → conserva. 401 → error | Falsos |
| CA10 | `__tests__/renovarSesion.test.ts` | `debeRenovar`. Dos llamadas concurrentes → `repo.renovar` una vez. Guarda el token nuevo. Red → conserva | Repo falso con promesa diferida |
| CA11 | `__tests__/cerrarSesion.test.ts` | Llama a logout y luego borra. Logout colgado → borra a los 3 s (temporizadores falsos de Jest). Error → borra igual | Falsos |
| CA9 | `__tests__/invalidarSesion.test.ts` + `src/app/di/__tests__/contenedor.test.ts` | Solo actúa con `autenticado`. Un 401 del cliente en el login (sin sesión) no cambia el estado. Con sesión pasa a `sinSesion/vencida` y borra | Almacén falso, `fetchImpl` falso |
| — | `__tests__/sesion.validations.test.ts`, `sesionActiva.test.ts` | Todas las funciones puras (dígitos, tope, fechas, serialización, URL de WhatsApp) y suscripción y desuscripción del store | — |
| CA3, CA4, CA14 | `__tests__/Login.controller.test.ts` | Pasos, envío al 4.º dígito, guard de doble envío, PIN vacío tras un error, `_abrirAyudaPin` con `EnlacesPort` falso (true/false → `notify.error`) | `renderHook` con `DependenciasProvider` falso |
| CA2-CA4, CA13, CA15 | `__tests__/LoginScreen.test.tsx` | Render en los dos temas (puntos, 12 teclas, confirmar con `confirmar`/`sobreConfirmar`, pie, enlace). Roles y etiquetas. Aviso de sesión vencida. Botón de tema alterna `tema.modo`. Error con `role="alert"` | Controller real + `MemoriaSesionRepository` |
| CA1, CA7, CA11, CA12 | `src/app/navigation/__tests__/NavegadorRaiz.test.tsx` (adaptado) | `restaurando` → nada y splash sin ocultar. Sin sesión → Login. Login de `ana` → `InicioEstudiante`; `meli` → `InicioProfe`; admin → `InicioAdmin`. Sesión guardada → inicio directo y `me` una vez. «Cerrar sesión» → Login. `ocultar` se llama una vez | Contenedor falso completo |
| CA16 | `src/app/inicio/__tests__/InicioProvisionalScreen.test.tsx` (adaptado) | Nombre, rol, cerrar sesión, escaparate según `__DEV__` | Contenedor falso |
| — | `src/native/adapters/__tests__/KeychainSecureStorageAdapter.test.ts`, `LinkingEnlacesAdapter.test.ts` | Servicio por clave, errores atrapados (null/false), `openURL` que rechaza → false | Mock de keychain y `Linking` del preset |
| — | `src/app/di/__tests__/etiquetaDispositivo.test.ts` | Android con y sin modelo, iOS, corte a 100 | — |
| CA6 | Revisión | Grep de `console.` en `src/modules/sesion` y de `AsyncStorage` en el repo | — |
| CA1, CA4, CA7-CA9, CA11, CA13, CA14 | `pruebas.md` (manual en el moto g77) | Los 3 roles, 429, reabrir sin PIN, modo avión, revocación por SQL, logout con SQL, capturas en los dos modos, WhatsApp | Docker local + `adb reverse` |
| CA17 | CI / desplegador | `npm run calidad` y `build:android:debug` | — |

## 9. Riesgos y preguntas abiertas

**Riesgos**
- **R1 · F1-02 no está en producción.** También está sin aprobar: el último veredicto es RECHAZADO en la vuelta 1, con la vuelta 2 en curso. Hasta su despliegue, el login solo funciona contra el Docker local. Un APK de release apuntando a producción mostrará el error de CA5.
- **R2 · Hito H-S2 (2026-11-20, 4 días).** Es ajustado para 17 CA más la dependencia nativa. Mitigación: el orden de los commits deja login y navegación funcionando primero, y la renovación y los pulidos después.
- **R3 · Compilación en Windows.** El codegen del TurboModule de keychain alarga las rutas de CMake. Se usa `scripts/build-apk.mjs` (subst).
- **R4 · `react-native-keychain` 11.0.0 tiene 10 días.** Puede traer fallos. Respaldo: la 10.0.0.
- **R5 · Hostinger y la cabecera `Authorization`.** Ya es el R2 de F1-02. Si en producción `me` da 401 con un token válido, hay que añadir una línea al `.htaccess`. No afecta a la App.
- **R6 · iOS sin probar.** No hay Mac: faltan `pod install` y compilar.
- **R7 · El Keychain de iOS sobrevive a la desinstalación.** Al reinstalar, la sesión anterior se restaura si sigue viva. Es aceptable, porque `me` la valida. Borrar en la primera ejecución exigiría un almacén no seguro que hoy no existe.
- **R8 · Tope absoluto de 90 días.** A los 90 días se vuelve a pedir el PIN aunque se use a diario. Es una decisión de F1-02 (P3) y cumple el criterio «una semana sin PIN».
- **R9 · Límite por IP compartido en las pruebas.** Con `adb reverse` todas las pruebas comparten IP. Se limpia con SQL (sección 7).
- **R10 · Tests existentes.** Hay tests que dependen de la ruta `InicioProvisional` y del contenedor real. Se adaptan en el mismo cambio para no romper la puerta.

**Preguntas.** Cada una lleva su opción por defecto para no detener el flujo.
- **P1 (bloquea la distribución, no la construcción).** ¿Qué se entrega en H-S2 si F1-02 no está desplegada el 2026-11-20? **Por defecto:**
  - se construye y se verifica contra el Docker local;
  - el hito se cumple con el APK de debug en el moto g77 (vía `adb reverse`) y una demo;
  - el APK de release a testers (Firebase) espera al despliegue de F1-02 en producción.
- **P2.** ¿Se envía solo al 4.º dígito, como la web (`index.html:1583`)? **Por defecto sí.** El botón confirmar se mantiene.
- **P3.** ¿Se pide confirmación al cerrar sesión? **Por defecto no.** La web tampoco la pide.
- **P4.** ¿Se pone el enlace «¿Olvidaste tu usuario?» en el paso 1, como la web (`:1636`)? **Por defecto no.** Solo va el del PIN, según el lienzo.
- **P5.** ¿Qué texto lleva el mensaje de WhatsApp? **Por defecto,** el mismo de la web: «Hi Inglés con Sebas's Team! I've forgotten my PIN, could you pls help me with that?» (`index.html:1657`).
- **P6.** ¿`react-native-keychain` 11.0.0 o 10.0.0? **Por defecto 11.0.0**, con la 10.0.0 de respaldo si no compila.
- **P7.** ¿Se valida y se renueva solo al arrancar? **Por defecto sí.** Hacerlo al volver a primer plano queda para F1-03b o 1.15.
- **P8.** ¿Tokens nuevos `confirmar`/`sobreConfirmar` (verde oficial y negro en los dos temas) o reutilizar `marca`? Con `marca`, en el tema claro sería verde bosque con blanco y no cumpliría «#86EF86 con check negro». **Por defecto, tokens nuevos.**
- **P9.** ¿Qué pasa si el teléfono no puede guardar en el almacén seguro? **Por defecto,** el login falla con un mensaje claro y no se entra con una sesión que no se pueda recordar.

## 10. Commits previstos

1. `chore(native): react-native-keychain 11.0.0 para guardar el token en el almacén seguro (F1-03)`
2. `feat(native): SecureStoragePort con Keychain/Keystore y EnlacesPort con Linking`
3. `feat(sesion): entidades, puertos y validaciones del dominio de sesión`
4. `feat(sesion): adaptador de auth.php (login, me, renew, logout) y repositorio en memoria`
5. `feat(sesion): casos de uso iniciar, restaurar, validar, renovar, cerrar e invalidar sesión`
6. `feat(sesion): estado de sesión activa y controllers de sesión y login`
7. `feat(ui): tokens confirmar y sobreConfirmar para el teclado de PIN`
8. `feat(sesion): pantalla de login con usuario, teclado de PIN, WhatsApp y cambio de tema`
9. `feat(app): navegación splash, login e inicio por rol con cerrar sesión`
10. `feat(app): el cliente HTTP usa el token de la sesión y el 401 la limpia`
11. `test(app): navegador, inicio y contenedor con la sesión` (adaptación de los tests existentes que haga falta para la puerta)
12. `docs(F1-03): dependencia nativa, prueba en dispositivo por USB y sesión en CLAUDE.md`

## 11. Decisiones de la puerta

Aprobadas por el usuario el 2026-11-16. Se adoptan las opciones por defecto de la sección 9:

- **P1 · Entrega de H-S2.** Se construye y se verifica contra el Docker local. El hito se cumple con el APK de debug en el moto g77 (vía `adb reverse`) y una demo. El APK de release a testers (Firebase) espera al despliegue de F1-02 en producción.
- **P2 · Envío automático.** El PIN se envía solo al 4.º dígito, como la web. El botón confirmar se mantiene.
- **P3 · Cerrar sesión.** Sin confirmación.
- **P4 · Enlace «¿Olvidaste tu usuario?».** No se pone. Solo va el enlace del PIN, según el lienzo.
- **P5 · Mensaje de WhatsApp.** El mismo de la web: «Hi Inglés con Sebas's Team! I've forgotten my PIN, could you pls help me with that?».
- **P6 · Versión de la librería.** `react-native-keychain` 11.0.0, con la 10.0.0 de respaldo si no compila.
- **P7 · Validar y renovar.** Solo al arrancar. Hacerlo al volver a primer plano queda para F1-03b o 1.15.
- **P8 · Tokens del teclado.** Tokens nuevos `confirmar` (verde oficial) y `sobreConfirmar` (negro) en los dos temas.
- **P9 · Fallo del almacén seguro.** El login falla con un mensaje claro y no se entra con una sesión que no se pueda recordar.
