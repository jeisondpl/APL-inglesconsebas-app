# Arquitectura — App móvil Inglés con Sebas (React Native CLI 0.88.1)

App móvil con **Arquitectura Hexagonal (Ports & Adapters) + Screaming Architecture + Vertical Slice**, en **React Native CLI (bare, sin Expo)** y TypeScript estricto.

Sirve de referencia para el equipo y de contexto para asistentes de IA.

> La versión 0.88.1 es la elegida para el proyecto. Antes de usar una API nueva, confírmala, junto con sus requisitos (Node, JDK, Xcode, Gradle, CocoaPods), en las release notes oficiales de React Native.

> **Diferencia con la propuesta firmada.** La propuesta comercial (`../docs/propuestas/02-propuesta-app-movil.md`) promete Expo, EAS Build sin Mac propio y Expo Updates. El proyecto usa React Native CLI puro por decisión técnica del 2026-11-09. Eso tiene dos consecuencias:
> - Los builds de iOS necesitan un Mac o integración continua. Se puede usar EAS Build sobre un proyecto bare.
> - Las actualizaciones ligeras sin pasar por las tiendas hay que montarlas aparte, por ejemplo con `expo-updates` en modo bare o EAS Update. Se decide en F4.

---

## 0. Datos del proyecto

| Campo | Valor |
|---|---|
| Nombre de la app | Inglés con Sebas. Es provisional y lo decide el brief de marca: «Leap», «Inglés con Sebas» u otro. Solo cambia el nombre visible. |
| Identificador Android (`applicationId`) | `com.inglesconsebas.app`. Permanente. |
| Bundle ID iOS | `com.inglesconsebas.app`. Permanente. |
| Nombre interno RN / AppRegistry | `InglesConSebas` |
| Dominios de negocio (módulos) | `sesion`, `cuenta`, `inicio`, `alertas`, `clases`, `mensajes`, `tareas`, `notificaciones` |
| API backend (URL por entorno) | dev: `http://10.0.2.2:8080/api` desde el emulador Android, o `http://localhost:8080/api` en iOS. Es el Docker de Leap. staging: no existe todavía. prod: `https://app.inglesconsebas.com/api`. |
| SDK nativos a integrar | Almacenamiento seguro (Keychain/Keystore), biometría, push (FCM/APNs), grabación y reproducción de audio, selector de imágenes, conectividad |
| Idioma de UI | `es-CO` |
| Roles de usuario | `estudiante`, `profe`, `admin` |

Backend: la API PHP de Leap, en `../app/api/` dentro de este mismo directorio padre. Hoy no tiene tokens ni sesiones. Las tarjetas F1-02 y APP del tablero añaden la sesión por token, el PIN no expuesto, el límite de intentos y el registro de dispositivos, y van **antes** que el móvil (sección 15).

---

## 1. Rol y principios

Actúa como arquitecto de software móvil senior. Responde y comenta en **español**. Los identificadores de código siguen las convenciones de la sección 6.

Principios innegociables:

1. **Screaming**: la estructura de carpetas expresa el negocio (`modules/clases/`), nunca la tecnología (`screens/` o `services/` globales).
2. **Vertical Slice**: cada módulo es autónomo y contiene todas sus capas. Un módulo no importa los internos de otro. Se comunican por un puerto o por un caso de uso expuesto explícitamente.
3. **Hexagonal / inversión de dependencias**: las dependencias apuntan hacia adentro. `domain` no importa nada de `aplications`, `infrastructure` ni `presentation`.
4. **Un caso de uso por operación**, en su propio archivo, como función pura. No conoce React, HTTP ni módulos nativos.
5. **Los casos de uso reciben el repositorio por parámetro**. Nunca lo instancian.
6. **Compartido mínimo** en `shared/`: cliente HTTP, tema y utilidades. Nada de lógica de negocio.
7. **Todo SDK nativo se envuelve en un puerto y un adaptador**. El dominio nunca depende de la librería concreta.

Regla de dependencia:

```
presentation → aplications → domain ← infrastructure
                              ↑
                        solo interfaces
```

---

## 2. Estructura del repositorio

```
/
├── android/                  # proyecto Gradle nativo (versionado)
├── ios/                      # proyecto Xcode + Podfile (versionado)
├── index.js                  # AppRegistry
├── app.json
├── metro.config.js
├── babel.config.js
├── tsconfig.json
├── .env.example              # variables por entorno (sin secretos)
├── .eslintrc.js / .prettierrc
├── jest.config.js
└── src/
    ├── app/                  # composición de la app
    │   ├── App.tsx
    │   ├── providers/        # tema, sesión, query client, toasts
    │   ├── navigation/       # navegador raíz + composición de navegadores de módulo
    │   └── di/               # contenedor: instancia repositorios/adaptadores
    ├── shared/
    │   ├── lib/
    │   │   ├── api.ts            # cliente HTTP + interceptor JWT + manejo 401
    │   │   ├── HttpResponse.ts   # tipo unificado entre capas
    │   │   ├── notify.ts         # fachada única de toasts
    │   │   └── utils.ts
    │   ├── theme/            # tokens (colores, tipografía, espaciado), modo claro/oscuro
    │   ├── components/       # UI genérica sin lógica de negocio (Button, Card, Modal...)
    │   ├── hooks/
    │   └── types/
    ├── native/               # adaptadores de SDK/módulos nativos
    │   ├── ports/            # PushPort, BiometricsPort, SecureStoragePort...
    │   └── adapters/         # implementación con la librería concreta
    └── modules/
        └── <modulo>/
            ├── domain/
            │   ├── entities/      # <Modulo>.entities.ts   (IArgs* / IResponse*)
            │   ├── models/        # <Modulo>Repository.ts  (PUERTO)
            │   └── validations/   # <modulo>.validations.ts (reglas puras)
            ├── aplications/
            │   ├── controllers/   # <Modulo>.controller.ts (hook)
            │   └── <accion>/<accion>.ts   # un caso de uso por operación
            ├── infrastructure/
            │   └── api<Modulo>Repository.ts   # ADAPTADOR (HTTP u otro origen)
            ├── presentation/
            │   ├── screens/       # <Modulo>Screen.tsx
            │   ├── components/    # componentes propios del módulo
            │   └── navigation.tsx # navegador/rutas del módulo
            └── __tests__/
```

El nombre `aplications` es la convención elegida para el proyecto. Se mantiene así en todos los módulos.

---

## 3. Flujo de datos

```
<Modulo>Screen
  └─► use<Modulo>Controller()              ← hook (capa aplicación)
        └─► <accion>UseCase(repo, args)    ← caso de uso puro
              └─► repo.<metodo>(args)      ← PUERTO (interfaz)
                    └─► Api<Modulo>Repository   ← ADAPTADOR
                          └─► apiClient.get/post/patch/delete
                                └─► API REST
```

Respuesta unificada entre capas:

```ts
export interface HttpResponse<T> {
  error: boolean;
  response?: T;
  msg?: string;
  code?: number;
}
```

La infraestructura transforma la respuesta cruda (HTTP, nativa o local) a `HttpResponse<T>`. También captura y normaliza los errores antes de entregarlos al caso de uso.

---

## 4. Responsabilidades por capa

- **`presentation/screens/<Modulo>Screen.tsx`**
  - Representa una pantalla completa: layout, listas, formularios y feedback visual.
  - Consume solo el controller hook. **No llama a HTTP, a repositorios ni a módulos nativos.**
  - El feedback de las mutaciones usa `notify`.
- **`aplications/controllers/<Modulo>.controller.ts`**
  - Es el hook `use<Modulo>Controller`.
  - Gestiona el estado local (`items`, `selected`, `loading`, `error`), obtiene el repositorio del contenedor de dependencias (`useRepository`) e invoca los casos de uso.
  - Sus métodos llevan el prefijo `_`: `_list`, `_get`, `_create`, `_update`, `_delete`.
- **`aplications/<accion>/<accion>.ts`**
  - Casos de uso como funciones puras: `(repository, args) => Promise<HttpResponse<T>>`.
  - Sin React, HTTP ni librerías nativas.
- **`domain/entities`**
  - Interfaces de TypeScript sin lógica ni imports externos.
  - Las entradas se llaman `IArgs*` y las salidas `IResponse*`.
- **`domain/models/<Modulo>Repository.ts`**
  - El puerto: el contrato de **qué** puede hacer el repositorio.
- **`infrastructure/api<Modulo>Repository.ts`**
  - El adaptador. Contiene toda la lógica HTTP: rutas, parámetros, transformación y normalización de errores.
  - Puede tener también una implementación en memoria o local del mismo puerto.
- **`native/ports` y `native/adapters`**
  - El puerto describe la capacidad en términos del negocio, por ejemplo `BiometricsPort.authenticate()`.
  - El adaptador usa la librería concreta y se registra en `app/di`.
  - En los tests se sustituye por un falso.

## 5. Inyección de dependencias (`app/di`)

- Hay un único punto donde se instancian los repositorios y los adaptadores nativos. Se exponen con `useRepository` y `useNative`.
- Nadie hace `new Api...Repository()` fuera de ese contenedor.
- Cambiar de backend o de SDK, o usar mocks, se hace cambiando el registro en `di`.

## 6. Convenciones

| Elemento | Convención |
|---|---|
| Entradas del dominio | `IArgsCancelarClase`, `IArgsListClases` |
| Salidas del dominio | `IResponseClase` |
| Puerto | `ClasesRepository` (en `domain/models/`) |
| Adaptador | `ApiClasesRepository` |
| Caso de uso | `listClasesUseCase`, `cancelarClaseUseCase` |
| Controller hook | `useClasesController` |
| Métodos del controller | prefijo `_` (`_list`, `_cancelar`) |
| Pantallas | `ClasesScreen.tsx` |
| Archivos de módulo | `<Modulo>.entities.ts`, `<Modulo>.controller.ts` |
| Alias de imports | `@/` → `src/` (configurado en `tsconfig` y `babel`) |
| TypeScript | `strict: true`; sin `any` salvo justificación comentada |

## 7. Navegación

- Se usa **React Navigation**. Cada módulo tiene su navegador en `presentation/navigation.tsx`, y se componen en `app/navigation/`.
- Las rutas van tipadas (`ParamList`), y también `useNavigation` y `useRoute`.
- La navegación se dispara desde pantallas o controllers, **nunca desde un caso de uso**.
- El navegador raíz decide entre el flujo `Auth` y el flujo `App` según la sesión. Dentro de `App`, elige por rol: estudiante, profe o admin.

## 8. Transversales

- **Sesión**
  - El token se guarda con `SecureStoragePort`, que usa Keychain o Keystore. **Nunca** en AsyncStorage.
  - `shared/lib/api.ts` añade `Authorization: Bearer <token>`. Ante un 401, limpia la sesión y vuelve al login.
  - Los permisos se validan en el backend. En el cliente solo se oculta la interfaz.
- **`notify`**
  - Es la fachada única de toasts: `success`, `error`, `warning`, `info` y `fromError(err, titulo)`. Las vistas no importan la librería directamente.
  - El toast es para el resultado de las mutaciones. Los errores de carga persistentes van inline, la validación junto al campo y las confirmaciones destructivas en un modal.
- **Errores**
  - Los adaptadores devuelven `error: true` con un `msg` legible. No lanzan excepciones crudas.
  - Hay un manejador global de errores no controlados.
- **Tema**
  - Los tokens viven en `shared/theme/` y salen del manual de marca. Hay modo claro y oscuro.
- **Sin conexión**
  - La caché local de la última información es otro adaptador del mismo puerto, por ejemplo `LocalInicioRepository`.
- **Accesibilidad e i18n**
  - Los elementos interactivos llevan `accessibilityLabel` y `accessibilityRole`. Las áreas táctiles miden al menos 44 pt.
  - Los textos de la interfaz están centralizados.

## 9. React Native

1. La arquitectura nueva (Fabric y TurboModules) y Hermes están activados.
2. Los módulos nativos propios son TurboModules con spec tipada (Codegen).
3. Las listas usan `FlatList` o `FlashList` con un `keyExtractor` estable. `useCallback` y `useMemo` se usan donde aporten.
4. Hay tres entornos, `dev`, `staging` y `prod`, con variables propias y flavors o schemes nativos.
5. Toda variable de entorno nueva se agrega a `.env.example` en el mismo cambio.

## 10. Android

- Las versiones van fijadas, sin rangos flotantes: compileSdk, targetSdk, minSdk, Kotlin y AGP.
- Hay tres flavors, `dev`, `staging` y `prod`, con `applicationIdSuffix`.
- La firma usa un `keystore.properties` **fuera del repo**. R8 está activado con reglas de ProGuard.
- Cada dependencia nativa lleva un comentario que explica por qué está. Los permisos son solo los necesarios.

## 11. iOS

- El `Podfile` fija la versión mínima de iOS. `use_frameworks!` solo se usa si un SDK lo exige, y se documenta cuál.
- Hay schemes con `.xcconfig` por entorno. Después de `pod install` se versiona `Podfile.lock`.
- Los permisos van en `Info.plist`, con textos en español. Las capabilities se declaran explícitamente.

## 12. Integrar un SDK nativo

1. Definir el puerto en `src/native/ports/`.
2. Instalar el SDK y configurar Gradle, Pods, `Info.plist` y `AppDelegate`.
3. Implementar el adaptador en `src/native/adapters/` y registrarlo en `app/di`.
4. Consumirlo por el puerto, con un falso para los tests.
5. Probarlo en las dos plataformas y en un build release.
6. Documentarlo en el README: qué hace, qué permisos pide y qué pasos manuales necesita.

## 13. Agregar un módulo

1. Entidades.
2. Puerto.
3. Adaptador.
4. Casos de uso.
5. Controller.
6. Pantallas y `navigation.tsx`.
7. Registro en `di` y en `app/navigation`.
8. `notify` en las mutaciones.
9. Tests del caso de uso con un repositorio falso, y de la pantalla con el controller mockeado.

## 14. Calidad

- Se prueba con Jest y React Native Testing Library. Las pruebas de punta a punta son opcionales, con Detox o Maestro.
- Antes de cada PR deben pasar `tsc --noEmit`, ESLint, Prettier y `jest`.
- La regla de dependencias se vigila con lint, mediante `eslint-plugin-boundaries` o `import/no-restricted-paths`.

## 15. Flujo de trabajo y entrega

- **Git**
  - Cada cambio sale de `main` en una rama: `feat/…`, `fix/…`, `chore/…`, `docs/…` o `refactor/…`.
  - Los commits siguen Conventional Commits y entran por PR.
  - Nunca se hace push directo ni force-push a `main`.
- **Integración continua**
  - Tipa, lintea, testea y firma los builds: AAB en Android y archive en iOS.
- **Versionado**
  - `versionName` y `versionCode` en Android van sincronizados con `CFBundleShortVersionString` y `CFBundleVersion` en iOS.
- **Orden de los cambios**
  - Primero base de datos, luego API, luego web y al final **móvil**.
  - La API se mantiene compatible hacia atrás, porque las versiones publicadas en las tiendas no se actualizan al instante.
- **Distribución**
  - Primero TestFlight y Play Internal Testing, y después producción por etapas.

## 16. Forma de trabajo con el asistente

1. Proponer primero el árbol de carpetas, los puertos y las entidades de los módulos, para su aprobación.
2. Implementar módulo por módulo y completo: dominio, infraestructura, casos de uso, controller, pantalla, navegación, registro en DI y tests.
3. No mezclar capas. Si una necesidad parece exigirlo, detenerse y consultar.
4. Entregar cada módulo con un resumen de los archivos creados, las decisiones y los pasos nativos manuales.
