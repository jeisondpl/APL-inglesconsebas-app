# Tipografía

Código: `src/shared/theme/tipografia.ts` (`familias`, `tipografia`), componente `<Texto variante color>`.

## Familias

| Familia | Archivo (`assets/fuentes`) | Origen | Uso |
|---|---|---|---|
| Nohemi Medium | `Nohemi-Medium.otf` | **Kit oficial** (tipografía complementaria, p. 8) | Títulos, botones, etiquetas |
| DM Sans Regular / Medium / SemiBold | `DMSans-*.ttf` | **Derivado** (F1-01b): el kit no trae fuente de cuerpo | Cuerpo, detalle, insignias |
| Nohemi ExtraLight / Light | solo en el kit | Oficial, **no integradas** | Candidatas para lemas grandes (pendiente) |
| Nohemi Thin | no está en el kit | Nombrada en el manual (pp. 1, 2, 5, 8) | No disponible (conflicto C4) |
| Anja Eliane | incrustada en el PDF | Letra del logo | **Nunca** como texto (sin licencia) |

Licencias en `assets/licencias/` (fuera de `assets/fuentes` para que `react-native-asset` no las copie):
Nohemi es freeware personal/comercial y **no se puede modificar** el archivo (no subsetting ni
renombrar el interior); DM Sans es OFL.

## Escala (tokens `tipografia`)

| Variante | Familia | Tamaño / interlínea | Uso |
|---|---|---|---|
| `h1` | Nohemi Medium | 28 / 34 | Título de pantalla (uno por vista) |
| `h2` | Nohemi Medium | 20 / 26 | Título de bloque o tarjeta héroe |
| `titulo` | Nohemi Medium | 17 / 22 | Título de tarjeta, fila de lista |
| `subtitulo` | Nohemi Medium | 15 / 20 | Subtítulo, cabecera de sección |
| `cuerpo` | DM Sans Regular | 15 / 22 | Texto general |
| `cuerpoFuerte` | DM Sans SemiBold | 13.5 / 18 | Dato destacado dentro de cuerpo |
| `boton` | Nohemi Medium | 14 / 18 | Etiqueta de botón |
| `detalle` | DM Sans Regular | 12 / 16 | Metadatos, ayudas, pie |
| `etiqueta` | Nohemi Medium | 10 / 14, `letterSpacing 2`, MAYÚSCULAS | Sobretítulo («PRÓXIMA CLASE») — eco de los rótulos del manual («ISOTIPOS CATEGORIAS») |
| `insignia` | DM Sans SemiBold | 11 / 14 | Texto de `<Insignia>` |

La escala y la elección DM Sans son **adaptación móvil**, no regla del manual. El manual usa Nohemi
en peso fino, grande, con mucho aire y en minúsculas de frase (p. 1, 2, 8): úsalo como tono, no como
especificación de UI (los pesos finos bajo 20 px no son legibles en pantalla).

## Reglas

1. Siempre `<Texto variante=…>`; `<Text>` de react-native solo dentro de `src/shared/components`.
2. `fontFamily` = nombre PostScript = nombre del archivo; **nunca `fontWeight`/`fontStyle`** (Android
   cae a Roboto). Un peso nuevo = archivo nuevo en `assets/fuentes` + `npx react-native-asset` +
   entrada en `familias` + `UIAppFonts` (iOS).
3. No crear tamaños sueltos: si hace falta uno, se añade una variante en `tipografia.ts`.
4. Escalado dinámico: respeta `allowFontScaling` (por defecto); diseña para que el contenido se
   reorganice hasta 1.3× sin cortar. Usa `numberOfLines` solo en títulos de listas.
5. Tono de texto (manual): frases cortas, cercanas, en español de tú, con la marca «Inglés con Sebas»
   (I y S mayúsculas en texto corrido; el logo escribe «sebas» en minúscula).
6. Lemas oficiales (texto literal, no reinterpretar): «Aprender inglés; Nunca se sintió tan cercano.»
   y «Como un amigo, Una clase, una conversación.»
