# Plan · EXT-01 · Onboarding de bienvenida

> Redactado por el agente **planificador** el 2026-11-17 en la rama `feat/EXT-01-onboarding` (sale de `main` en `1c87174`, que ya incluye F1-01b y F1-03).
> Tarjeta: tablero «App móvil · Inglés con Sebas» (APL-Tareas #4). Va **sin costo en la Fase 1**, aunque no figura en el Anexo 1 del contrato. Se acordó en la reunión del 2026-11-10.
> Estado: APROBADO por el usuario el 2026-11-17 (pidió ejecutar todas las fases; se adoptan las opciones por defecto).

## 0. Definition of Ready: estado

| Punto | Estado |
|---|---|
| Código de tablero | ✔ EXT-01 |
| Criterios verificables | ✔ Sección 3: cada criterio tiene un test o un paso manual |
| Dependencias identificadas | ✔ Sin API. Nativo: ninguno nuevo; se reutilizan `react-native-keychain` (F1-03) y `react-native-svg` (F1-01b). Features: F1-03 (punto de enganche `rutaInicialAuth()`, `NavegadorRaiz`, `SecureStoragePort`) y F1-01b (tokens, `LogoMarca`, `Boton`, `Pantalla`, `Texto`). |
| API inexistente → adaptador en memoria | No aplica: no hay backend. En los tests, el almacén en memoria de `crearDependenciasDePrueba()`. |
| `plan.md` aprobado | ✔ 2026-11-17, con las opciones por defecto (sección 11) |

La subtarea 1 de la tarjeta («Decidir con Sebastián si se incluye») **no es trabajo de código**: quedó acordada en la reunión del 2026-11-10. El desplegador la marca en el tablero citando esa reunión.

---

## 1. Resumen

La primera vez que se abre la app, después del splash, se muestra una bienvenida de 4 pantallas (O1–O4): presentación, clases, mensajes y tareas. Se pasa con «Siguiente» o deslizando, y se sale con «Comenzar» en la última o con «Omitir» en cualquiera.

- Al terminar u omitir se guarda la bandera `hasSeenOnboarding` en almacenamiento persistente.
- Con la bandera guardada, el arranque va **del splash directo al login**.
- Desde el login no se puede volver a la bienvenida.
- Si hay sesión guardada, la bienvenida no se muestra y se va directo al inicio.

La ve cualquiera que abra la app sin sesión (los tres roles: antes del login el rol no se conoce). Fase 1, fuera del Anexo 1, sin costo (acuerdo del 2026-11-10).

## 2. Alcance

**Entra**

- Módulo nuevo `src/modules/onboarding`: dominio, casos de uso, controller, pantalla y navegación.
- La pantalla `OnboardingScreen` con las 4 páginas en un `FlatList` horizontal paginado: deslizar, «Siguiente», «Omitir», «Comenzar», indicador de páginas y botón atrás de Android.
- Las ilustraciones O2–O4 en SVG (`react-native-svg`) con tokens del tema. En O1 va el isotipo oficial (`LogoMarca`).
- Tema claro y oscuro solo con los tokens de `src/shared/theme`. Ningún hex en el módulo.
- La configuración de páginas (textos e ilustraciones) en un arreglo separado del componente, como pide la nota del lienzo.
- La bandera persistente con el `SecureStoragePort` existente (clave propia). Sin dependencias nuevas.
- La lectura de la bandera dentro del arranque, para que el splash no parpadee.
- La integración en `NavegadorRaiz` y el registro de la bandera en el contenedor de DI.
- La documentación en `CLAUDE.md` y `docs/ARQUITECTURA.md` (módulo nuevo).

**No entra**

- Volver a ver la bienvenida desde el perfil o los ajustes (no está pedido).
- La bienvenida distinta por rol.
- Animaciones de entrada de las ilustraciones y el paso automático del splash a los 2 s del brief (el splash ya existe y se oculta en `onReady`).
- Analítica de «omitió en la página N».
- Cambios en el backend: no hay API.
- Ítems de F1-03b (biometría, perfil, tema guardado…).

## 3. Criterios de aceptación

| # | Criterio | Cómo se verifica |
|---|---|---|
| CA1 | Sin bandera y sin sesión guardada, el arranque pasa del splash a la página **O1**. El login no se monta. | Test de `NavegadorRaiz` con el almacén vacío: se ve el título de O1 y no «Inicia sesión». |
| CA2 | Con la bandera `hasSeenOnboarding` guardada y sin sesión, el arranque va directo al **login**. La bienvenida no llega a renderizarse en ningún momento. | Test de `NavegadorRaiz` con `{ hasSeenOnboarding: '1' }`: se ve «Inicia sesión» y en ningún render aparece texto de O1. |
| CA3 | Con sesión guardada (con o sin bandera), el arranque va directo al **inicio** del rol, nunca a la bienvenida. | Test de `NavegadorRaiz` con la sesión de «ana» sin bandera: inicio provisional y ningún texto de O1. |
| CA4 | Si al arrancar había sesión y no bandera, la bandera se guarda. Después de **cerrar sesión** se llega al login, no a la bienvenida. | Test de `NavegadorRaiz`: sesión de «ana» → el almacén acaba con `hasSeenOnboarding = '1'` → «Cerrar sesión» → «Inicia sesión», sin O1. |
| CA5 | Textos exactos del lienzo: O1 «Tu inglés, en un solo lugar» / «Clases, tareas y mensajes de Inglés con Sebas, ahora en tu teléfono.»; O2 «Tus clases, bajo control» / «Consulta tu próxima clase y cancela o reagenda desde el teléfono, sin enredos.»; O3 «Habla con tu profe» / «Chatea con tu profe y envíale notas de voz e imágenes cuando quieras.»; O4 «Tareas con feedback real» / «Entrega tus Extra Tasks en la app y recibe el feedback de tu profe.». Botones «Siguiente» (O1–O3), «Comenzar» (O4) y «Omitir» (todas). | Test de pantalla que recorre las 4 páginas y compara con `textosOnboarding`. Test del arreglo `PAGINAS_ONBOARDING`: 4 entradas, en ese orden. |
| CA6 | «Siguiente» avanza una página. El indicador marca la página actual y anuncia «Paso N de 4». | Test de pantalla: pulsar «Siguiente» cambia la etiqueta del indicador de «Paso 1 de 4» a «Paso 2 de 4» y llama a `scrollToIndex`. |
| CA7 | Deslizar a la izquierda o a la derecha cambia de página, y el indicador se sincroniza. | Test de pantalla: `momentumScrollEnd` con `contentOffset.x = 2 × ancho` → «Paso 3 de 4». Manual en el dispositivo. |
| CA8 | «Comenzar» (O4) y «Omitir» (cualquier página) guardan `hasSeenOnboarding = '1'` y llevan al login **reemplazando** la ruta: el login no tiene regreso a la bienvenida (ni con atrás de Android ni con gesto). | Test de `NavegadorRaiz`: «Omitir» en O2 → «Inicia sesión», almacén con la bandera, O1–O4 desmontadas (la ruta `Onboarding` ya no existe en el navegador). Ídem con «Comenzar» en O4. Manual: atrás en el login sale de la app. |
| CA9 | Una pulsación doble en «Omitir» o «Comenzar» guarda la bandera una sola vez. | Test del controller: dos `_terminar()` seguidos → `guardar` llamado 1 vez. |
| CA10 | Si guardar la bandera falla, se avanza igual al login. En el siguiente arranque la bienvenida vuelve a mostrarse. | Test del caso de uso con un almacén cuyo `guardar` devuelve `false`: la bandera en memoria pasa a `visto`. Test de `NavegadorRaiz`: segundo montaje con el mismo almacén → O1. |
| CA11 | El splash nativo no se oculta, y nada se pinta, hasta que se hayan leído la sesión **y** la bandera. Se oculta una sola vez, con fundido. | Test de `NavegadorRaiz` con un almacén cuyo `leer('hasSeenOnboarding')` está diferido: `splash.ocultar` no se llama y el árbol está vacío. Al resolver se llama una vez con `{ fundido: true }`. |
| CA12 | Atrás de Android en O2–O4 vuelve a la página anterior. En O1 no lo intercepta (sale de la app). | Test de pantalla con `BackHandler` mockeado: en O3 devuelve `true` y se pasa a «Paso 2 de 4»; en O1 no hay suscripción activa o devuelve `false`. |
| CA13 | Claro y oscuro: se usan solo los tokens de `src/shared/theme` y no hay hex en `src/modules/onboarding`. El isotipo es la categoría `kids` (verde) en oscuro y `corporate` (negro) en claro. Títulos en Nohemi (`Texto` `h1`) y cuerpo en DM Sans (`cuerpo`). | Test estático: ningún `/#[0-9a-fA-F]{3,8}\b/` en el módulo. Test de pantalla con `preferenciaInicial` `oscuro` y `claro`: la categoría del isotipo y el `fontFamily` del título. Manual: capturas en los dos temas comparadas con el lienzo. |
| CA14 | Accesibilidad. «Omitir», «Siguiente» y «Comenzar» tienen `accessibilityRole="button"`, etiqueta y área ≥ 44 pt. El título de cada página es `header`. Las ilustraciones son decorativas y están ocultas al lector. Las páginas fuera de pantalla quedan ocultas al lector. | Test de pantalla: `getByRole('button', { name })`, `getByRole('header', { name: título actual })` y la página 2 no accesible mientras se ve la 1. |
| CA15 | Textos e ilustraciones viven en un arreglo de configuración (`PAGINAS_ONBOARDING`) separado del componente, y los textos en `onboarding.textos.ts`. | Revisión del aprobador y test del arreglo (CA5). |
| CA16 | No se añade ninguna dependencia. No aparece la palabra «AsyncStorage» en `src/` (ni en comentarios). El test `sesion.seguridad.test.ts` de F1-03 sigue en verde. | `npm run calidad` y `git diff main -- package.json` sin cambios en las dependencias. |
| CA17 | La puerta automática está en verde: `npm run calidad`, con el 90 % en `src/modules/onboarding/{domain,aplications}`. | CI y en local. |

## 4. Dominio

### 4.1 Entidades: `src/modules/onboarding/domain/entities/Onboarding.entities.ts`

```ts
/** cargando: aún no se leyó la bandera; pendiente: no la hay; visto: guardada o recién marcada. */
export type EstadoOnboarding =
  | { tipo: 'cargando' }
  | { tipo: 'pendiente' }
  | { tipo: 'visto' };
```

No hay `IArgs*` ni `IResponse*` de red: la feature no consume API.

### 4.2 Puertos

- **Repositorio de módulo: no se crea.** Como en `restaurarSesionUseCase` (F1-03), los casos de uso reciben el `SecureStoragePort` por parámetro. Un `OnboardingRepository` solo envolvería dos llamadas a `leer` y `guardar`. Además, la regla de capas no deja a `infrastructure` importar `native/ports`, así que el adaptador no podría tipar el almacén. `IRepositorios` no cambia.
- **Puerto nativo reutilizado:** `SecureStoragePort` (`src/native/ports/SecureStoragePort.ts`), con la clave propia `hasSeenOnboarding`. El adaptador Keychain la guarda en el servicio `com.inglesconsebas.app.hasSeenOnboarding`. El puerto nunca rechaza: si `leer` falla devuelve `null`, y eso se toma como pendiente (se muestra la bienvenida, el arranque no se cuelga).
- **Modelo de estado en memoria (nuevo):** `src/modules/onboarding/domain/models/BanderaOnboarding.ts`. Va en paralelo a `SesionActiva`: lo comparten el navegador raíz y la pantalla, para que terminar la bienvenida cambie el flujo por estado, sin `navigate` imperativo.

```ts
export interface BanderaOnboarding {
  obtener(): EstadoOnboarding;
  establecer(estado: EstadoOnboarding): void;
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}
```

**Por qué no AsyncStorage ni otra dependencia.** El test de F1-03 `sesion.seguridad.test.ts` prohíbe `async-storage` en `package.json` y la cadena `AsyncStorage` en todo `src/`. La bandera no es un secreto, pero el almacén seguro ya existe, ya está mockeado en Jest y en los tests (almacén en memoria) y no añade pasos nativos. El costo de escribir 1 byte en Keychain/Keystore una vez es despreciable. La única diferencia de comportamiento está en la sección 9 (R1).

### 4.3 Validaciones puras: `src/modules/onboarding/domain/validations/onboarding.validations.ts`

```ts
export const CLAVE_ONBOARDING_VISTO = 'hasSeenOnboarding';
export const VALOR_ONBOARDING_VISTO = '1';
export const TOTAL_PAGINAS_ONBOARDING = 4;

/** `true` solo si el texto guardado es exactamente VALOR_ONBOARDING_VISTO. */
export function onboardingVisto(texto: string | null): boolean;
/** Índice siguiente, o `null` si `indice` es la última página (toca terminar). */
export function paginaSiguiente(indice: number, total: number): number | null;
/** Índice anterior, o `null` en la primera página (atrás no se intercepta). */
export function paginaAnterior(indice: number): number | null;
/** Página según el desplazamiento horizontal: redondea y acota a [0, total-1]; con ancho ≤ 0, 0. */
export function paginaDesdeDesplazamiento(x: number, ancho: number, total: number): number;
/** Decide si se muestra la bienvenida: solo sin sesión y con la bandera pendiente. */
export function debeMostrarOnboarding(estado: EstadoOnboarding, haySesion: boolean): boolean;
```

## 5. Archivos por capa, en orden de construcción

Leyenda: **C** crear y **M** modificar.

### Dominio

1. **C** `src/modules/onboarding/domain/entities/Onboarding.entities.ts`: `EstadoOnboarding`.
2. **C** `src/modules/onboarding/domain/models/BanderaOnboarding.ts`: la interfaz de la sección 4.2.
3. **C** `src/modules/onboarding/domain/validations/onboarding.validations.ts`: las constantes y funciones de la sección 4.3.

### Infraestructura

Ninguna. El adaptador es el `KeychainSecureStorageAdapter` existente, sin cambios.

### Casos de uso (`src/modules/onboarding/aplications/`)

4. **C** `banderaOnboarding.ts`: `crearBanderaOnboarding(inicial: EstadoOnboarding = { tipo: 'cargando' }): BanderaOnboarding`. Es un store sin React, como `crearSesionActiva`.
5. **C** `arrancarOnboarding/arrancarOnboarding.ts`:
   ```ts
   export function arrancarOnboardingUseCase(args: {
     almacen: SecureStoragePort;
     bandera: BanderaOnboarding;
   }): Promise<void>;
   ```
   Solo actúa si el estado es `cargando`. Lee `CLAVE_ONBOARDING_VISTO` y establece `visto` o `pendiente`.
6. **C** `marcarOnboardingVisto/marcarOnboardingVisto.ts`:
   ```ts
   export function marcarOnboardingVistoUseCase(
     almacen: SecureStoragePort,
     bandera: BanderaOnboarding,
   ): Promise<boolean>;
   ```
   Establece `visto` **antes** del `await`, para que la interfaz avance al instante, y luego guarda `VALOR_ONBOARDING_VISTO`. Devuelve lo que devuelva `guardar` (CA10). Si ya estaba `visto` y no viene de `pendiente`, guarda igualmente: es idempotente.

### Controller

7. **C** `src/modules/onboarding/aplications/controllers/Onboarding.controller.ts`:
   ```ts
   /** Lee la bandera al arrancar, una vez. Con sesión y bandera pendiente, la marca (CA4). */
   export function useArranqueOnboarding(haySesion: boolean): EstadoOnboarding;

   export interface IOnboardingController {
     indice: number;
     total: number;
     esUltima: boolean;
     /** Avanza o, en la última página, termina. */
     _siguiente(): void;
     /** Página anterior; `false` en la primera (atrás de Android no se intercepta). */
     _anterior(): boolean;
     /** Sincroniza el índice tras deslizar. */
     _alDesplazar(x: number, ancho: number): void;
     /** Omitir o Comenzar: marca visto una sola vez (CA9). */
     _terminar(): void;
   }
   export function useOnboardingController(): IOnboardingController;
   ```
   - El estado se lee con `useSyncExternalStore(bandera.suscribir, bandera.obtener)`.
   - Obtiene el almacén con `useNative('almacenSeguro')` y la bandera con `useBanderaOnboarding()`.
   - El candado de `_terminar` va en un `useRef`.
   - `haySesion` es un booleano primitivo para no importar nada del módulo `sesion`: la regla de capas prohíbe imports entre módulos.

### Pantalla (`src/modules/onboarding/presentation/`)

8. **C** `onboarding.textos.ts`: `textosOnboarding` con los textos de CA5 (título y descripción por página, `siguiente: 'Siguiente'`, `comenzar: 'Comenzar'`, `omitir: 'Omitir'`, `omitirEtiqueta: 'Omitir la bienvenida'` y `paso: (n, total) => \`Paso ${n} de ${total}\``).
9. **C** `components/ilustraciones/IlustracionClases.tsx`, `IlustracionMensajes.tsx` e `IlustracionTareas.tsx`:
   - Son SVG de 240×190 que copian la geometría del lienzo (O2, O3 y O4).
   - Los colores salen de `useTema()`, según la tabla de colores de abajo. El «28» y el «LUN» usan `tema.familias.nohemiMedium` y `tema.familias.dmSansRegular`.
   - Son decorativas: `accessible={false}` y ocultas al lector, igual que `LogoMarca` sin etiqueta.
10. **C** `components/IlustracionBienvenida.tsx`: `LogoMarca` de 190, con `categoria` según `tema.modo` (`oscuro` → `kids` y `claro` → `corporate`, según la nota del lienzo principal: «el verde en modo oscuro y el negro en modo claro»). La función pura `categoriaIsotipoPorModo(modo)` vive en este archivo y la reutiliza la cabecera.
11. **C** `onboarding.config.ts`:
    ```ts
    export interface IPaginaOnboarding {
      clave: 'bienvenida' | 'clases' | 'mensajes' | 'tareas';
      titulo: string;
      descripcion: string;
      Ilustracion: ComponentType;
    }
    export const PAGINAS_ONBOARDING: readonly IPaginaOnboarding[];
    ```
    Cumple la nota del lienzo: los textos y las ilustraciones van en un arreglo separado del componente. Un test comprueba que `PAGINAS_ONBOARDING.length === TOTAL_PAGINAS_ONBOARDING`.
12. **C** `components/PaginaOnboarding.tsx`: ilustración, título (`Texto variante="h1"`, `accessibilityRole="header"`, centrado) y descripción (`cuerpo`, `textoSecundario`, máx. ~300 dp). Recibe `activa: boolean`; si es `false`, pone `accessibilityElementsHidden` e `importantForAccessibility="no-hide-descendants"` (CA14).
13. **C** `components/IndicadorPaginas.tsx`: 4 marcas (la activa de 22×8 con `radios.pildora` y color `marca`; las otras de 8×8 en `pista`). Es un solo elemento accesible con la etiqueta `textosOnboarding.paso(n, 4)`.
14. **C** `screens/OnboardingScreen.tsx`:
    - Va dentro de `Pantalla` con un `style` sin padding horizontal, para que las páginas ocupen el ancho.
    - Cabecera: `LogoMarca` de 34 y «Omitir» (`Pressable` con texto `textoSecundario` y `minHeight`/`minWidth` = `tema.toqueMinimo`).
    - `FlatList` horizontal con `pagingEnabled`, `showsHorizontalScrollIndicator={false}`, `getItemLayout` con el `width` de `useWindowDimensions()`, `keyExtractor` = `clave` y `onMomentumScrollEnd` → `_alDesplazar`.
    - Pie: `IndicadorPaginas` y `Boton` primario («Siguiente» o, en la última, «Comenzar»).
    - Un `useEffect` sobre `indice` llama a `listaRef.current?.scrollToIndex({ index, animated: true })`.
    - `useFocusEffect` + `BackHandler` como en `LoginScreen`: solo intercepta si `_anterior()` devuelve `true` (CA12).

#### Colores: del lienzo a los tokens

| Elemento | Lienzo oscuro / claro | Token |
|---|---|---|
| Fondo | #000000 / #F4F5F4 | `fondo` (lo pone `Pantalla`) |
| Título | #FFFFFF / #000000 | `texto` |
| Descripción y «Omitir» | #A5AFA5 / #5C645C | `textoSecundario` |
| Marca del indicador activa | #86EF86 / #000000 | `marca` |
| Marcas inactivas | #343A34 / #CDD2CD | `pista` |
| Botón | #86EF86 con texto negro | `Boton` primario (`marca`/`sobreMarca`) |
| Tarjeta de la ilustración | #171A17 con borde #262A26 / #FFFFFF con borde #DDE1DD | `superficie` + `borde` |
| Acento (banda del calendario, play, micro, check, ondas reproducidas) | #86EF86 / #000000 | `marca`, con el icono en `sobreMarca` |
| Ondas sin reproducir | #5E665E / #A5AFA5 | `textoTenue` |
| Pines del calendario y líneas de la hoja | #343A34 / #CDD2CD–#DDE1DD | `pista` |
| Burbuja y círculo verde suave | #123122 con trazo #A6F3AE / #DDF9DD con trazo #1C5E1C | `exitoSuave` + `sobreExitoSuave` |
| Círculo de cancelar | #361316 con trazo #FF7B7B / #F7E2E2 con trazo #A32B2B | `peligroSuave` + `peligro` |

En claro, `marca` es el verde bosque derivado y no el negro del lienzo. Además, el botón primario sale en verde bosque con texto blanco, no en el verde oficial con texto negro. Es la misma desviación que ya acepta el login de F1-03, por contraste AA (ver P7).

### Navegación

15. **C** `src/modules/onboarding/presentation/navigation.tsx`:
    ```ts
    export type OnboardingParamList = { Onboarding: undefined };
    export interface IPilaOnboarding {
      Screen: ComponentType<{ name: keyof OnboardingParamList; component: ComponentType }>;
    }
    export function pantallasOnboarding(Pila: IPilaOnboarding): JSX.Element;
    ```
    Es el mismo patrón que `pantallasAuth`.
16. **M** `src/app/navigation/tipos.ts`: `RaizParamList = AuthParamList & OnboardingParamList & AppParamList`.
17. **C** `src/app/navigation/rutaInicialRaiz.ts`: es una función pura, hermana de `rutaInicioPorRol`.
    ```ts
    export function rutaInicialRaiz(args: {
      estadoSesion: EstadoSesion;      // ya no 'restaurando'
      onboarding: EstadoOnboarding;    // ya no 'cargando'
    }): keyof RaizParamList;
    ```
    Devuelve, en este orden:
    - `rutaInicioPorRol(rol)` si hay sesión;
    - `'Onboarding'` si `debeMostrarOnboarding(...)`;
    - `rutaInicialAuth()`, el punto de enganche de F1-03, que se usa tal cual.
18. **M** `src/app/navigation/NavegadorRaiz.tsx`:
    - `const onboarding = useArranqueOnboarding(estado.tipo === 'autenticado')`.
    - Devuelve `null` mientras `estado.tipo === 'restaurando' || onboarding.tipo === 'cargando'`. Así el splash sigue y no hay parpadeo (CA11): las dos lecturas del almacén corren en paralelo desde el primer render.
    - Tres grupos excluyentes, por estado:
      - App si hay sesión;
      - `pantallasOnboarding(Pila)` si toca la bienvenida;
      - si no, `pantallasAuth(Pila)`.
    - Al marcar `visto`, el grupo Onboarding desaparece y React Navigation monta `Login` como única ruta. Equivale a reemplazar la ruta, sin historial hacia atrás (CA8).
    - En `Login` se pasa `options={{ animationTypeForReplace: 'push' }}` desde el grupo Auth (ver R3).
19. **M** `src/modules/sesion/presentation/navigation.tsx`: solo los comentarios. «EXT-01 añadirá `Onboarding`» pasa a explicar que la bienvenida es un módulo propio y que el navegador raíz decide con `rutaInicialRaiz`. **No** se cambian `AuthParamList` ni la firma de `rutaInicialAuth()`, y `Login: undefined` debe seguir literal, porque lo exige el test de F1-03.

### DI

20. **M** `src/app/di/contenedor.ts`: `IDependencias.banderaOnboarding: BanderaOnboarding` y, en `crearDependencias()`, `crearBanderaOnboarding()` (empieza en `cargando`).
21. **M** `src/app/di/DependenciasProvider.tsx`: `useBanderaOnboarding()`, que lanza un error claro si falta, como `useSesionActiva`. **M** `src/app/di/index.ts`: lo exporta.
22. **M** `src/app/di/dependenciasDePrueba.ts`: la opción `onboardingInicial?: EstadoOnboarding`, que por defecto es `{ tipo: 'visto' }`. Así los tests de F1-03, que esperan el login con el almacén vacío, siguen igual. Los de EXT-01 pasan `{ tipo: 'cargando' }` para ejercer la lectura real.
23. **M**, ajustes mínimos de tests existentes (el constructor los anota en la cabecera, como en F1-01b y F1-03):
    - `src/app/navigation/__tests__/NavegadorRaiz.test.tsx`: `contenedorConApi` arma `IDependencias` a mano. Añade `banderaOnboarding: crearBanderaOnboarding({ tipo: 'visto' })`.
    - `src/app/__tests__/App.test.tsx`: con el contenedor real y el Keychain mockeado vacío, la app ahora arranca en O1. El test «sin sesión guardada, muestra el login» pasa a «sin sesión ni bandera, muestra la bienvenida» y comprueba que «Omitir» lleva al login.

### Documentación

24. **M** `CLAUDE.md`: la sección «Onboarding (EXT-01)», con el módulo, la clave `hasSeenOnboarding` en el almacén seguro, el orden del arranque y la opción `onboardingInicial` de los tests.
25. **M** `docs/ARQUITECTURA.md` § 0: añade `onboarding` a los módulos.

## 6. API

**Ninguna.** La feature no consume endpoints de `../app/api/` ni requiere cambios en el backend.

## 7. Pasos nativos

**Ninguno.** No hay dependencias nuevas, ni Gradle, ni Pods, ni permisos, ni textos de `Info.plist`. `react-native-keychain` y `react-native-svg` ya están enlazados, y las fuentes ya las enlazó F1-01b. Sigue pendiente, sin Mac, el `pod install` heredado.

## 8. Plan de pruebas

| Archivo de test | Qué cubre | Con qué |
|---|---|---|
| `src/modules/onboarding/__tests__/onboarding.validations.test.ts` | `onboardingVisto` (`'1'`, `null`, `''`, `'true'`); `paginaSiguiente` y `paginaAnterior` en los bordes; `paginaDesdeDesplazamiento` (redondeo, negativos, mayor que el total, ancho 0); `debeMostrarOnboarding` (las 6 combinaciones). | Puro |
| `src/modules/onboarding/__tests__/casosDeUso.test.ts` | `crearBanderaOnboarding` (suscribir, establecer y desuscribir). `arrancarOnboardingUseCase`: sin bandera → `pendiente`; con ella → `visto`; si no está en `cargando`, no lee; si `leer` devuelve `null` por un fallo → `pendiente`. `marcarOnboardingVistoUseCase`: queda `visto` antes de resolver el guardado; si guarda bien → `true` y el almacén tiene `'1'`; si `guardar` devuelve `false` → `false` y sigue `visto` (CA10). | `crearAlmacenEnMemoria` y un almacén falso con `jest.fn` |
| `src/modules/onboarding/__tests__/Onboarding.controller.test.tsx` | `useArranqueOnboarding` lee una sola vez; con `haySesion` y `pendiente` marca visto (CA4). `useOnboardingController`: `_siguiente`, `_anterior` y `_alDesplazar`; `_siguiente` en la última → terminar; `_terminar` doble → un solo `guardar` (CA9). | `renderHook` con `DependenciasProvider valor={crearDependenciasDePrueba({ onboardingInicial })}` |
| `src/modules/onboarding/__tests__/OnboardingScreen.test.tsx` | CA5 (textos de las 4 páginas y botones), CA6, CA7 (`fireEvent(lista, 'momentumScrollEnd', …)`), CA12 (`BackHandler`), CA13 (isotipo y `fontFamily` en claro y oscuro), CA14 (roles, etiquetas y página no activa oculta) y CA15 (el arreglo de 4 en orden). | `Providers` con el contenedor de prueba; `TemaProvider preferenciaInicial` `oscuro` y `claro` |
| `src/modules/onboarding/__tests__/onboarding.estatico.test.ts` | CA13: ningún hex en `src/modules/onboarding`. CA16: ninguna cadena `AsyncStorage` en el módulo (la cubre también el test de F1-03). | `fs`, como en `sesion.seguridad.test.ts` |
| `src/app/navigation/__tests__/rutaInicialRaiz.test.ts` | Las combinaciones de sesión (sin sesión con o sin motivo, autenticado por rol) × bandera (`pendiente` o `visto`). | Puro |
| `src/app/navigation/__tests__/NavegadorRaiz.onboarding.test.tsx` | CA1, CA2 (O1 no aparece en ningún render: se espía `PAGINAS_ONBOARDING` o se busca el título tras cada `act`), CA3, CA4 (cerrar sesión → login), CA8 (Omitir en O2 y Comenzar en O4 → login y almacén con la bandera; la bienvenida ya no está montada), CA10 (segundo montaje tras un guardado fallido → O1) y CA11 (un almacén con `leer` diferido para la clave `hasSeenOnboarding`: árbol vacío y splash sin ocultar hasta resolver; luego una sola llamada con `{ fundido: true }`). | `crearDependenciasDePrueba({ onboardingInicial: { tipo: 'cargando' }, almacenInicial, splash })` |
| Existentes | `sesion.seguridad.test.ts` (CA16), `NavegadorRaiz.test.tsx` y `App.test.tsx` con los ajustes del paso 23. | — |

**Manual (en `pruebas.md`), en un Android por USB, en claro y oscuro:**

1. Instalación limpia → splash → O1, sin un destello del login.
2. Deslizar ida y vuelta.
3. Atrás en O3 → O2; atrás en O1 → sale.
4. «Omitir» → login; atrás en el login → sale de la app.
5. Cerrar y reabrir → splash → login, sin un destello de O1.
6. Borrar los datos de la app → vuelve O1.
7. Comparar las capturas O1–O4 con el lienzo (`A-O*-Dark/Light`).

## 9. Riesgos y preguntas abiertas

**Riesgos**

- **R1 · iOS conserva el Keychain al desinstalar.** En iOS, la bandera (y la sesión de F1-03) sobreviven a una reinstalación, así que la bienvenida no vuelve a salir. En Android, desinstalar o borrar los datos la borra. Se acepta: la bienvenida no aporta información crítica. Si se quisiera, F1-03b puede limpiar el Keychain en la primera ejecución tras instalar.
- **R2 · El test de F1-03 busca la cadena `AsyncStorage` en todo `src/`.** No se puede escribir ni en un comentario. El constructor lo tiene presente; CA16 lo vigila.
- **R3 · Cambio de grupo en el stack.** Al desaparecer `Onboarding`, React Navigation anima la transición como un «pop» por defecto. Con `animationTypeForReplace: 'push'` en `Login` se ve como un avance. Si molesta, se acepta sin animación.
- **R4 · `FlatList` paginado y ancho variable.** Con una rotación o con pantalla dividida, el offset podría quedar entre páginas. Lo mitigan `getItemLayout` con `useWindowDimensions` y un `scrollToIndex` al cambiar el ancho. La app hoy no fija la orientación; no se cambia aquí.
- **R5 · Fuentes dentro de `react-native-svg`.** El «28» y el «LUN» usan `fontFamily` en `<Text>` de SVG. En Android depende de que la fuente esté en `assets/fonts`, cosa que ya hace `react-native-asset`. Si en el dispositivo no se aplica, se dibujan con `Texto` superpuesto sobre el SVG, sin cambiar el plan.
- **R6 · Tests existentes.** El contenedor de prueba arranca en `visto` por defecto. Si un test futuro olvida pasar `cargando`, no ejercerá la lectura. Lo documentan `CLAUDE.md` y el JSDoc de la opción.
- **R7 · Usuarios con una build de F1-03 cuya sesión venció.** Al actualizar, no tienen bandera ni sesión vigente, así que verán la bienvenida una vez. Solo afecta a los testers.

**Preguntas abiertas** (cada una con su opción por defecto, adoptada en la sección 11)

- **P1 · Título de O1.** El lienzo oscuro dice «Tu inglés, en un solo lugar» y el claro «Tu academia, en tu bolsillo». Son las opciones 1 y 2 del brief de marca (§ 6), y la elección quedó pendiente.
- **P2 · Texto del botón final.** La tarjeta dice «Empezar»; el lienzo y el brief dicen «Comenzar».
- **P3 · Dónde vive la bienvenida.** Puede ser un módulo propio `onboarding` o una pantalla más dentro de `sesion`.
- **P4 · Almacén de la bandera.** Puede ser el `SecureStoragePort` existente o una dependencia nueva de almacenamiento simple, como MMKV.
- **P5 · Cómo se «reemplaza la ruta».** Puede ser por estado (desaparece el grupo) o con `navigation.replace('Login')`.
- **P6 · Sesión guardada sin bandera.** ¿Se marca la bandera para que cerrar sesión no lleve a la bienvenida?
- **P7 · Colores en claro.** El lienzo pinta en negro el acento y la marca activa del indicador, y el botón en verde oficial con texto negro.
- **P8 · Si falla guardar la bandera.** ¿Se avisa o se avanza en silencio?
- **P9 · «Omitir» en O4 y atrás de Android.**
- **P10 · Bienvenida por rol.**
- **P11 · Mecanismo de deslizar.**

## 10. Commits previstos

En Conventional Commits en español, con un cuerpo de ≤ 100 caracteres por línea:

1. `feat(onboarding): dominio de la bienvenida y bandera hasSeenOnboarding`: entidades, modelo `BanderaOnboarding` y validaciones, con sus tests puros.
2. `feat(onboarding): casos de uso de arranque y marcar visto`: `banderaOnboarding.ts`, `arrancarOnboarding` y `marcarOnboardingVisto`, con sus tests.
3. `feat(di): registra la bandera del onboarding en el contenedor`: `contenedor.ts`, `DependenciasProvider`, `index.ts` y `dependenciasDePrueba.ts`, más el ajuste de `contenedorConApi`.
4. `feat(onboarding): controller de páginas y del arranque`: `Onboarding.controller.ts` y su test.
5. `feat(onboarding): pantallas O1–O4 con ilustraciones SVG en claro y oscuro`: textos, configuración, ilustraciones, componentes, `OnboardingScreen` y `navigation.tsx`, con los tests de pantalla y el estático.
6. `feat(navegacion): el arranque muestra la bienvenida solo la primera vez`: `rutaInicialRaiz`, `tipos.ts`, `NavegadorRaiz` y los comentarios de `sesion/presentation/navigation.tsx`, con los tests de navegación y el ajuste de `App.test.tsx`.
7. `docs(EXT-01): módulo onboarding en CLAUDE.md y ARQUITECTURA`.

Después, en sus etapas: `test(EXT-01): …` del tester, con `pruebas.md`; `docs(EXT-01): veredicto del aprobador`; y el `merge:` del desplegador.

## 11. Decisiones de la puerta

Aprobado por el usuario el 2026-11-17: pidió ejecutar todas las fases sin detenerse, así que se adopta la opción por defecto de cada pregunta.

| Pregunta | Decisión adoptada (por defecto) |
|---|---|
| **P1 · Título de O1** | **Opción 1: «Tu inglés, en un solo lugar»**, igual en los dos temas: es la del lienzo oscuro y la primera del brief. Está en `textosOnboarding`, así que cambiarla es una línea. Se informa a Sebastián al entregar. |
| **P2 · Botón final** | **«Comenzar»**, como en el lienzo aprobado y el brief. «Empezar» de la tarjeta se toma como paráfrasis. |
| **P3 · Ubicación** | **Módulo propio `src/modules/onboarding`.** La composición va en `src/app/navigation` (`rutaInicialRaiz`), y `rutaInicialAuth()` de F1-03 se usa tal cual como rama «sin bienvenida». `sesion` no importa nada de `onboarding` ni al revés. |
| **P4 · Almacén** | **`SecureStoragePort` con la clave `hasSeenOnboarding` y el valor `'1'`.** Sin dependencias nuevas; compatible con `sesion.seguridad.test.ts`. Se acepta R1 (iOS conserva la bandera al reinstalar). |
| **P5 · Reemplazo de la ruta** | **Por estado.** `marcarOnboardingVistoUseCase` pone la bandera en `visto`, el grupo `Onboarding` desaparece y queda `Login` como única ruta. Es el mismo patrón sin `navigate` imperativo de F1-03 y deja el mismo resultado que `replace`: no hay regreso. |
| **P6 · Sesión sin bandera** | **Sí se marca** (y se guarda) al detectar sesión con la bandera pendiente, para que cerrar sesión lleve al login y no a la bienvenida (CA4). |
| **P7 · Colores en claro** | **Solo tokens existentes**: el acento y la marca activa en `marca` (verde bosque en claro) y el botón con el `Boton` primario. Es la misma desviación AA que el login de F1-03. Isotipo `kids` en oscuro y `corporate` en claro, según la nota del lienzo principal. No se crean tokens nuevos. |
| **P8 · Fallo al guardar** | **Se avanza en silencio** al login, con la bandera en memoria. En el siguiente arranque la bienvenida vuelve a mostrarse (CA10). Sin toast: no es una mutación que el usuario haya pedido. |
| **P9 · Omitir en O4 / atrás** | **«Omitir» visible en las 4 páginas**, como en el lienzo. Atrás de Android: página anterior en O2–O4; en O1 no se intercepta y sale de la app. |
| **P10 · Por rol** | **La misma bienvenida para todos**: antes del login el rol no se conoce. Los textos son los aprobados en el lienzo. |
| **P11 · Deslizar** | **`FlatList` horizontal con `pagingEnabled`**, sin `react-native-pager-view` ni `gesture-handler`. El gesto lo da el scroll nativo. |
