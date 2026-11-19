# Componentes

Catálogo vivo: `src/shared/components` (barrel `index.ts`) y `src/shared/movimiento` (F1-04, en curso).
Escaparate: `src/app/escaparate/SistemaDisenoScreen.tsx` (solo `__DEV__`, desde el inicio provisional).
Antes de crear algo, busca aquí. Si un patrón de abajo dice «a construir», constrúyelo **en
`src/shared/components`** con tokens, añádelo al barrel, a sus tests y al escaparate.

## Existentes

| Componente | Props clave | Reglas de marca |
|---|---|---|
| `Texto` | `variante`, `color` (token) | Única puerta a la tipografía |
| `Boton` | `variante: primario \| secundario \| peligro`, `cargando`, `deshabilitado` | Alto 48, radio 16, `boton` Nohemi. Primario = relleno `marca` + `sobreMarca` (verde+negro en oscuro). Uno por vista |
| `Campo` | `etiqueta`, `valor`, `alCambiar`, `error` | Radio 16, fondo `campoFondo`, borde → `peligro` con error, placeholder `textoTenue` |
| `Tarjeta` | `variante: normal \| destacada`, `onPress` | `superficie` + `borde`, radio 20; destacada = `destacado` + `bordeDestacado`, radio 26 |
| `Insignia` | `tono: exito \| aviso \| peligro \| neutra \| contador` | Píldora, `insignia` DM Sans SemiBold |
| `AvisoEnLinea` | `tono: error \| aviso \| exito \| info`, `accion` | Error de carga persistente / validación de bloque |
| `Cargando` | `texto` | Indicador con color `marca` |
| `Pantalla` | `desplazable`, `bordes` | Safe area edge-to-edge (targetSdk 36), fondo `fondo` |
| `HostNotificaciones` + `notify` | `success/error/warning/info/fromError` | Toast `superficie` con borde izquierdo del tono; título Nohemi |
| `Marca` | `ancho`, `esEncabezado` | Logo principal (ver `logo-usage.md`) |
| `LogoMarca` | `tamano`, `categoria`, `etiqueta` | Isotipo |
| `FondoMarca`, `Revelar`, `PulsoCarga`, `usePresionEscala`, `useSacudida` | — | Movimiento (F1-04, commit `8563b52` en `feat/F1-04-rediseno-animado`, aún sin merge a `main` al 2026-11-17) |

## Patrones a construir (reglas para cuando se necesiten)

**Botón terciario / enlace.** Variante nueva `terciario` de `Boton` (no componente aparte): sin
relleno ni borde, texto `marca`, alto mínimo 44. Para «Omitir», «Ver todo».

**Selector / segmentado.** Fondo `superficieAlterna`, radio `boton`; opción activa `marca` +
`sobreMarca`; ≥ 44 de alto por opción; `accessibilityRole="tab"` y `accessibilityState.selected`.

**Encabezado (native-stack).** Ya tematizado por `src/app/navigation/temaNavegacion.ts`: `card` =
`superficie`, `primary` = `marca`, fuentes `bold`/`heavy` = Nohemi Medium (con `fontWeight: '400'`, la
única excepción permitida: lo exige el tipo de React Navigation y evita la negrita sintética). No se
crea un header propio; si hace falta quitar la sombra, `headerShadowVisible: false` en las opciones.

**Tabs inferiores (por rol).** Fondo `superficie`, borde superior `borde`, ícono+texto activo `marca`,
inactivo `textoSecundario`, etiqueta en `detalle`. Máximo 5 pestañas. Respeta `insets.bottom`.

**Modal / bottom sheet.** Superficie `superficie`, radio superior `heroe` (26), velo negro al 60 %
(derivado), asa `pista` 36×4. Confirmaciones destructivas: título `h2`, botón `peligro` + secundario.

**Progreso.** Pista `pista`, relleno `marca`, alto 8, radio `pildora`; texto del porcentaje `detalle`.
Para el saldo de tokens/clases del ciclo, anillo con el mismo par de colores.

**Estado vacío.** Isotipo (`LogoMarca` 64, categoría visible en el tema) o ilustración con tokens,
`titulo` + `cuerpo` en `textoSecundario`, una acción `secundario`. Tono cercano («Aún no tienes
clases esta semana»).

**Estado de error.** `AvisoEnLinea tono="error"` con «Reintentar». Nunca pantalla roja completa.

**Listas.** `FlatList` con `keyExtractor` estable; fila mínima 56, separador `borde` 1 px o tarjetas
con `espaciado.m` entre ellas. Título `titulo`, meta `detalle`, estado con `Insignia`.

**Calendario / agenda.** Día seleccionado = círculo `marca` + `sobreMarca`; hoy = borde `marca`; días
con clase = punto `acento` (oscuro) / `marca` (claro); fines de semana `textoSecundario`. Estados de
clase (`class_sessions.status`) mapeados a `Insignia`: programada → `exito`, reagendada → `aviso`,
cancelada → `peligro`, dictada → `neutra`.

**Tarjeta de clase.** `Tarjeta` (`destacada` para la próxima): `etiqueta` con el día, `h2` con la hora,
`cuerpo` con profe/tema, `Insignia` de estado, botón primario solo si hay acción (entrar, reagendar).

**Perfil.** Avatar circular con inicial en Nohemi sobre `destacado` (no se usa el isotipo como avatar
personal), nombre `h2`, rol como `Insignia neutra`, filas de ajustes como lista.

**Dashboard.** Saludo `h1`, tarjeta héroe con lo siguiente que el usuario debe hacer, luego KPI en
tarjetas `normal` en rejilla de 2 columnas (valor `h2`, rótulo `etiqueta`), luego listas.

## Antiduplicación

- Variación visual = prop/variante del componente existente.
- Composición de pantalla = en el módulo (`modules/<m>/presentation/components`) usando lo compartido.
- Si dos módulos repiten el mismo bloque, súbelo a `src/shared/components`.
- Los colores de un componente nuevo se resuelven con `useEstilos(crearEstilos)` (fábrica fuera del
  componente) y tokens.
