# Distribución — cómo llega la app a los testers

La app Android se reparte a testers con **Firebase App Distribution**: cada tester recibe un correo con el enlace para instalar o actualizar. El proceso sigue el modelo de APL-Livic-movil, con estas mejoras:
- keystore de release real desde el primer build;
- grupos de testers;
- notas de versión desde los commits;
- AAB listo para Play;
- puerta de calidad antes de compilar.

iOS queda pendiente para F4: TestFlight necesita un Mac o un runner macOS.

## Flujo de una release

1. Las features se cierran con `/feature`. Llegan a `main` aprobadas y con la puerta automática en verde (`docs/CALIDAD.md`).
2. **Elegir cómo distribuir:**
   - **Build de prueba**: en GitHub, Actions → **«Android · APK a testers»** → *Run workflow*. Se elige la rama, se escriben las notas y los grupos (`equipo` por defecto).
   - **Entrega de fase**: se sube la versión en `package.json` (`npm version minor --no-git-tag-version`) y se hace el commit `chore: versión X.Y.Z`. Luego `git tag vX.Y.Z` y `git push origin vX.Y.Z`. El tag tiene que coincidir con `package.json`, o el workflow falla.
3. **El workflow** (`.github/workflows/android-distribuir.yml`, en `ubuntu-latest`) hace, en orden:
   1. comprueba los secrets;
   2. corre `npm ci` y `npm run calidad`;
   3. calcula la versión: `versionName` sale de `package.json` o del tag, y `versionCode` es el número de ejecución;
   4. escribe las notas;
   5. escribe `.env` con `API_URL`;
   6. decodifica la keystore;
   7. compila `assembleRelease` y `bundleRelease` solo para ARM;
   8. guarda el APK y el AAB como artefacto (30 días);
   9. distribuye el APK a los grupos;
   10. borra las credenciales;
   11. escribe un resumen.
4. **Los testers** reciben el correo de Firebase, instalan y la app usa la API de producción.
5. El desplegador deja en la tarjeta del tablero la versión, la build y el enlace a la ejecución.

Las notas de una release por tag agrupan los commits `feat`, `fix` y `perf` desde el tag anterior como «Novedades», «Correcciones» y «Rendimiento». Por eso importa que los mensajes de commit estén bien escritos.

## Secrets y variables del repo (GitHub → Settings → Secrets and variables → Actions)

| Nombre | Tipo | Contenido |
|---|---|---|
| `API_URL` | secret | URL de la API de producción, por ejemplo `https://app.inglesconsebas.com/api` |
| `FIREBASE_SERVICE_ACCOUNT` | secret | JSON de una cuenta de servicio con el rol **Firebase App Distribution Admin** |
| `ANDROID_KEYSTORE_BASE64` | secret | La keystore de release en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | secret | Contraseña del almacén |
| `ANDROID_KEY_ALIAS` | secret | Alias de la clave |
| `ANDROID_KEY_PASSWORD` | secret | Contraseña de la clave |
| `FIREBASE_APP_ID` | **variable** (no secreta) | ID de la app Android en Firebase (`1:…:android:…`) |

Si falta cualquiera de ellos, el workflow se detiene en el primer paso y dice cuál.

## Puesta en marcha (una sola vez)

1. **Firebase**:
   - crear el proyecto «Inglés con Sebas», que también se usará para las notificaciones push de F2;
   - añadir la app Android `com.inglesconsebas.app`;
   - en *App Distribution*, crear los grupos `equipo` y `sebastian` y dar de alta a los testers;
   - en Google Cloud → IAM, crear la cuenta de servicio con el rol App Distribution Admin y descargar su JSON.
2. **Keystore de release.** Se genera una sola vez y **nunca** va en el repo:

   ```
   keytool -genkeypair -v -storetype PKCS12 -keystore inglesconsebas-release.jks -alias inglesconsebas -keyalg RSA -keysize 2048 -validity 10000
   ```

   - **Guárdala fuera del repo**, con copia de respaldo y con sus contraseñas en un gestor de contraseñas.
   - **Si se pierde, no se puede actualizar la app publicada** en Google Play. Con Play App Signing, la clave de subida se puede reponer, pero hay que pedirlo a Google.
   - **Custodia**: la app es de Sebastián, así que la keystore y sus contraseñas se le entregan al cerrar el proyecto. Mientras tanto la custodia JEISON-DEV.
   - Para el secret: `base64 -w0 inglesconsebas-release.jks`, o en PowerShell `[Convert]::ToBase64String([IO.File]::ReadAllBytes('inglesconsebas-release.jks'))`.
3. **Firma en local** (opcional): crea `android/keystore.properties`, ignorado por git, con este contenido:

   ```
   storeFile=C:/ruta/fuera/del/repo/inglesconsebas-release.jks
   storePassword=…
   keyAlias=inglesconsebas
   keyPassword=…
   ```

4. **Cargar los secrets y la variable** de la tabla anterior en GitHub.
5. **Lanzar la primera ejecución manual** y comprobar que llega el correo de Firebase.

## Build local (respaldo)

```
node scripts/build-apk.mjs                         # dist/inglesconsebas-<versión>.apk, con .env
node scripts/build-apk.mjs --env=.env.production   # contra producción
node scripts/build-apk.mjs --aab                   # también el .aab
```

- Sin `keystore.properties` sale firmado con la keystore de **debug** y avisa. Ese APK sirve para pruebas internas, pero no para repartir: al pasar después a la firma real, habría que desinstalar la app.
- **Windows**: el `ninja` de CMake no soporta rutas de más de 260 caracteres. Por eso el script compila desde una unidad temporal (`subst`) que se retira al terminar. Si se queda colgada: `subst R: /D`.
- El APK local se sube a mano en Firebase Console → App Distribution.

## Cuentas de tienda (ítem 1.3)

**Estado:** el repositorio está listo; las cuentas están **bloqueadas por el D-U-N-S**, que es trámite del cliente.

Lo que ya está en el repo:
- identificador `com.inglesconsebas.app` en Android (`applicationId`) y en iOS (`PRODUCT_BUNDLE_IDENTIFIER`);
- `Info.plist` con `CFBundleDevelopmentRegion=es` y sin permisos vacíos (se quitó el de ubicación, que la app no usa);
- `MARKETING_VERSION=0.1.0` en iOS, igual que la versión de `package.json`;
- firma de release de Android documentada más arriba.

Pasos manuales, responsabilidad de Sebastián con apoyo de JEISON-DEV:

1. Conseguir el **D-U-N-S** de la academia. Apple y Google lo exigen para cuentas de organización.
2. **Apple Developer**, como organización:
   - darle a JEISON-DEV el rol Admin o App Manager;
   - crear el App ID `com.inglesconsebas.app` (Push se activa en F2);
   - crear la app en App Store Connect con idioma principal Español (México);
   - anotar el **Team ID**, que irá en `DEVELOPMENT_TEAM` del proyecto de Xcode;
   - preparar certificados y perfiles (F4);
   - generar la clave APNs `.p8` (F2).
3. **Google Play Console**, como organización:
   - darle acceso a JEISON-DEV;
   - crear la app;
   - activar **Play App Signing** con la keystore de release como clave de subida;
   - registrar los SHA-1 y SHA-256 en Firebase;
   - crear la pista de **prueba interna**.
4. Anotar en el acta el estado de las cuentas.

## Pendiente (F4)

- **iOS**: TestFlight con `xcodebuild` en un runner macOS, o con EAS Build sobre el proyecto bare.
- **Google Play**: subir el AAB, ficha de tienda, Play App Signing y prueba interna.
- **R8/ProGuard**: activar `minifyEnabled` en release con las reglas de los SDK, y probarlo en un build release.
- **Actualizaciones ligeras sin pasar por las tiendas**: valorar `expo-updates` en modo bare, que la propuesta comercial menciona.
