# Logo e isotipos

Referencia visual: `img/manual-paginas.png` (pp. 3–6, 9–11), `img/kit-pngs.png` (PNG del kit) y
`img/app-logos.png` (cómo los dibuja la app hoy, renderizado desde `assets/marca/logo.json`: coincide
con el kit).

## Piezas

| Pieza | Qué es | Componente | Fuente |
|---|---|---|---|
| Logo principal | Mano «OK» + «Inglés / con / sebas» apilado | `<Marca ancho esEncabezado>` | `ingles-con-sebas-negro.pdf` → `logo.json.logo` (viewBox 575×295, proporción ≈ 1.95:1) |
| Isotipo | Mano «OK» en contorno dentro de un círculo, disco blanco con «S» | `<LogoMarca tamano categoria etiqueta>` | Manual p. 9 → `logo.json.isotipo` |
| Logo con lema | Logo + «Aprender inglés; Nunca se sintió tan cercano.» | — (no existe; ver pendientes) | `PNGS/LOGO CON COPY.png`, manual p. 5 |

Capas vectoriales (no cambiar el orden): logo = `manoContorno`, `manoRelleno`, `nombre`, `con`;
isotipo = `circulo`, `manoContorno`, `manoRelleno` (pintado del color del círculo), `letra`.

## Variantes oficiales y cuándo usarlas

| Fondo | Variante | Colores | Manual | En la app |
|---|---|---|---|---|
| Negro / tema oscuro | Logo claro | nombre `#FFFFFF`, mano blanca, «con» y contorno `#A5AFA5` | p. 3 | `<Marca>` con tema oscuro ✔ |
| Blanco / tema claro | Logo gris | nombre `#62696B`, mano blanca, «con» y contorno `#A5AFA5` | p. 4 | `<Marca>` con tema claro ✔ |
| Gris `#A5AFA5` | Nombre blanco, mano gris oscuro | — | p. 5 | **no implementada** |
| Verde `#86EF86` | Todo blanco | contraste 1.43:1 | p. 11 | **no implementada**; solo piezas grandes/decorativas |
| Verde oscuro / medio | `LOGO PARA FONDO VERDE OSCURO.png` | nombre blanco, mano `#62696B` | (solo PNG) | no implementada |

`<Marca>` elige la variante por `tema.modo`; **solo va sobre `colores.fondo`** (negro o blanco). No lo
pongas sobre `superficie` verde, fotos o el halo sin comprobar. Para otro fondo, añade la variante a
`scripts/extraer-logo-kit.py` (colores de la página correspondiente del manual) y regenera; no se
recolorea en el componente.

## Isotipos de categoría (manual p. 10)

| Categoría | Círculo | Mano | «S» | Lectura probable (el manual solo da el nombre) |
|---|---|---|---|---|
| `corporate` | negro `#000000` | contorno blanco | gris `#A5AFA5` en disco blanco | Empresas / corporativo |
| `self` | gris `#A5AFA5` | contorno blanco | gris | Autoaprendizaje / adultos |
| `kids` | verde `#86EF86` | contorno blanco | verde | Niños |

La correspondencia exacta categoría ↔ producto de Leap no está definida en el kit: **confírmala** antes
de usar el isotipo como etiqueta de un curso o grupo. Por defecto la app usa `corporate` (ícono de la
app, carga). En el tema oscuro un círculo negro se funde con el fondo: el onboarding usa
`categoriaIsotipoPorModo(tema.modo)` (hoy en
`src/modules/onboarding/presentation/components/IlustracionBienvenida.tsx`) para elegir uno visible.
Otro módulo no puede importarla (regla de capas): si la necesitas, súbela a `src/shared/components`
junto a `LogoMarca` en vez de copiarla.

## Tamaños y espacio (derivados: el manual no da medidas)

- **Zona de protección** (derivada de la retícula p. 6): deja alrededor del logo al menos la altura de
  la palabra «con» (≈ 12 % del alto del logo); en `<Marca ancho={200}>` ≈ 12 dp, redondea a
  `espaciado.m`/`l`.
- **Mínimos**: logo principal ≥ 120 dp de ancho (por debajo «con» se vuelve ilegible); isotipo ≥ 24 dp
  (por debajo usa el isotipo sin texto alrededor y con `etiqueta`).
- Usos actuales: login e inicio `ancho={200}`, splash 160 dp, ícono = isotipo Corporate (fondo `#000000`,
  zona segura adaptativa de Android en `generar-iconos.mjs`).

## Prohibido (rompe la identidad)

- Redibujar, aproximar con `Text`/emoji 👌 o con un ícono genérico.
- Estirar (siempre proporcional: `<Marca>` calcula el alto), rotar, inclinar, recortar la mano.
- Cambiar colores fuera de las variantes, añadir sombras, contornos, degradados o efectos.
- Separar mano y nombre, reordenar «Inglés / con / sebas», escribirlo sin tilde.
- Usar la tipografía del logo (Anja Eliane) como texto: no tiene licencia; está convertida a trazado.
- Editar `logo.json`, los íconos o el splash a mano: se regeneran (`npm run marca:*`).

## Accesibilidad

`<Marca>` se anuncia como «Inglés con Sebas» (`textosComunes.marca.nombre`), como `header` con
`esEncabezado`. `<LogoMarca>` es decorativo salvo que reciba `etiqueta`.
