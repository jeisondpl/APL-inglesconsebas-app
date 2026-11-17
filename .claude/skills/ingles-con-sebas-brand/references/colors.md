# Color

Código: `src/shared/theme/paleta.ts` (valores) → `src/shared/theme/temas.ts` (tokens semánticos).
Las pantallas solo usan tokens. Fijado por `src/shared/theme/__tests__/temas.test.ts`.

## Paleta oficial (manual p. 7)

| Nombre | HEX | RGB | CMYK | LAB | Uso de marca |
|---|---|---|---|---|---|
| Blanco | `#FFFFFF` | 255 255 255 | 0 0 0 0 | 100 0 0 | Fondo claro, nombre del logo sobre oscuro |
| Negro | `#000000` | 0 0 0 | 91 79 62 97 | 0 0 0 | Fondo principal, círculo Corporate |
| Verde | `#86EF86` | 134 239 134 | 49 0 64 0 | 86 -48 40 | Acento de marca, círculo Kids |
| Gris | `#A5AFA5` | 165 175 165 | 39 23 34 5 | 70 -6 3 | «con», contorno de la mano, lemas, círculo Self |

Complementario documentado: **gris del logo `#62696B`** (p. 2 como fondo, p. 4 como color del nombre
sobre blanco). En `paleta.grisLogo`.

## Contrastes clave (WCAG 2.x, calculados)

| Par | Ratio | Veredicto |
|---|---|---|
| Verde `#86EF86` sobre negro | 14.7 | AA ✔ — el verde es para fondos oscuros |
| Negro sobre verde | 14.7 | AA ✔ — texto/ícono sobre botón verde = negro |
| Verde sobre blanco | **1.43** | ✘ nunca como texto ni borde informativo en claro |
| Blanco sobre verde | **1.43** | ✘ solo el logo decorativo de p. 11 en formatos grandes |
| Gris `#A5AFA5` sobre negro | 9.28 | AA ✔ (texto secundario oscuro) |
| Gris `#A5AFA5` sobre blanco | **2.26** | ✘ como texto en claro → usar `#62696B` |
| Gris logo `#62696B` sobre blanco | 5.6 | AA ✔ |
| Negro sobre gris `#A5AFA5` | 9.28 | AA ✔ |

Regla práctica: **el verde oficial vive sobre negro**. En el tema claro, la «marca» es un verde
derivado más oscuro.

## Tokens semánticos (los dos temas tienen las mismas claves)

| Token | Oscuro | Claro | Origen / nota |
|---|---|---|---|
| `fondo` | `#000000` | `#FFFFFF` | oficial |
| `superficie` | `#0E1210` | `#FFFFFF` | derivado (en claro la tarjeta se separa por borde) |
| `superficieAlterna` | `#161B18` | `#F2F5F2` | derivado |
| `campoFondo` | `#0A0D0B` | `#FFFFFF` | derivado |
| `borde` | `#262D29` | `#DCE2DC` | derivado (separador, no informativo) |
| `bordeMarca` | `#2A5B37` | `#9FC5A0` | derivado (borde de botón secundario) |
| `pista` | `#1E2420` | `#E1E6E1` | derivado (fondo de barras de progreso) |
| `texto` | `#FFFFFF` | `#000000` | oficial — 21:1 |
| `textoSecundario` | `#A5AFA5` | `#62696B` | oficial — 9.28 / 5.6 |
| `textoTenue` | `#6F7A72` | `#7A857C` | derivado — 4.7 / 3.84 (solo texto grande, placeholders, metadatos no esenciales) |
| `marca` | `#86EF86` | `#1F6B1F` | oficial / derivado (6.6:1 en blanco) |
| `marcaActiva` | `#5DDB5D` | `#174F17` | derivado (pulsado/seleccionado) |
| `acento` | `#86EF86` | `#2D8A2D` | oficial / derivado — en claro 4.39: **no** para texto pequeño |
| `sobreMarca` | `#000000` | `#FFFFFF` | texto sobre `marca` |
| `destacado` / `bordeDestacado` | `#0F2A18` / `#1E4A2B` | `#E6F2E6` / `#C9E0C9` | derivado (tarjeta héroe) |
| `exitoSuave` / `sobreExitoSuave` | `#123122` / `#A6F3AE` | `#DCEDDC` / `#1C5E1C` | derivado |
| `peligro` | `#FF7B7B` | `#C13333` | derivado — 8.37 / 5.54 |
| `peligroSuave` / `sobrePeligroSuave` / `bordePeligro` | `#361316` / `#FFB4B4` / `#4A2226` | `#FBE4E4` / `#9B2C2C` / `#E7B3B3` | derivado |
| `aviso` | `#F5B84A` | `#9A6700` | derivado — 11.84 / 4.87 |
| `avisoSuave` / `sobreAvisoSuave` | `#33260F` / `#F5B84A` | `#F7ECD6` / `#7A5200` | derivado |
| `info` | `#60A5FA` | `#2563EB` | **provisional**: azul de `.btn-blue` de Leap; el kit no tiene azul |
| `confirmar` / `sobreConfirmar` | `#86EF86` / `#000000` | `#86EF86` / `#000000` | oficial en los dos temas (tecla ✓ del PIN, P8 de F1-03) |
| `halo` | `#86EF86` | `#86EF86` | oficial, solo con opacidad baja en `FondoMarca` (F1-04, **en curso**) |

## Reglas de uso

- Un color nuevo = un **token nuevo en los dos temas**, con comentario `// derivado` y el par de
  contraste comprobado (`scripts/contraste.mjs`). Nunca un hex en un componente.
- Estados interactivos: pulsado = `opacity 0.8` (o `usePresionEscala`); deshabilitado = `opacity 0.5`;
  seleccionado = `marcaActiva` o `destacado` + `bordeDestacado`.
- Semántica: `peligro` solo para errores/destructivo, `aviso` para pendiente/reagendo, `exito*` para
  confirmado, `info` para neutral informativo. No usar el verde de marca como «éxito» en el texto.
- Categorías (Corporate/Self/Kids): sus colores salen de `logo.json` (`colores.isotipo`), no del tema.
- Sombras: la marca no usa sombras ni degradados (manual plano). Elevación = `superficie` + `borde`.
  Excepción derivada: el halo radial de `FondoMarca` (F1-04).
