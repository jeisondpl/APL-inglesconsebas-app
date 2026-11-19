# Manual de marca — lo que dice el kit oficial

Analizado el 2026-11-17 desde los archivos originales (no por su nombre). Herramienta: PyMuPDF 1.28
(texto, fuentes incrustadas, colores de los trazados y render de cada página).

## Inventario del kit

| Archivo (kit original) | Copia en la app | Contenido real |
|---|---|---|
| `MANUAL DE MARCA INGLES CON SEBAS.pdf` (11 p., 708×708 pt, Illustrator 24, 2025-05-20) | `assets/marca/kit/manual-de-marca.pdf` | Manual (ver por página abajo) |
| `INGLES CON SEBAS NEGRO .pdf` | `assets/marca/kit/ingles-con-sebas-negro.pdf` | Logo principal vectorial (fuente de `logo.json`) |
| `LOGO AI.pdf` (283×283 pt) / `LOGO AI.ai` | `assets/marca/kit/logo-principal.pdf` | Logo vectorial |
| `LOGO PRINCIPAL COLOR .ai` | — | Fuente Illustrator (no se usa en la app) |
| `PNGS/PNG LOGO PRINCIPAL ICS.png` (1140×580) | `assets/marca/kit/png/` | Logo **claro**: nombre y mano blancos, contorno gris → fondos oscuros |
| `PNGS/LOGO PRICIPAL OSCURO .png` (1047×533) | idem | Logo **oscuro**: nombre gris `#646A6C`, mano blanca con contorno gris → fondos claros |
| `PNGS/LOGO PARA FONDO VERDE OSCURO.png` (648×321) | idem | Nombre blanco + mano gris oscuro → fondos verdes/medios |
| `PNGS/LOGO CON COPY.png` (1121×568) | idem | Logo + lema «Aprender inglés; Nunca se sintió tan cercano.» |
| `PNGS/ISOLOGO CORPORATE / SELF / KIDS.png` (~1040², alfa) | idem | Isotipos de categoría |
| `TIPOGRAFIA COMPLEMENTARIA/Nohemi-ExtraLight.otf, Nohemi-Light.ttf, Nohemi-Medium.otf` | `assets/fuentes/Nohemi-Medium.otf` | Nohemi (Rajesh Rajput, freeware, sin modificar) |
| `PNGS/Zoom account invitation - ….pdf` | — | **No es de marca** (captura de un correo). Excluido: no copiar ni citar. |

Los nombres de archivo del kit tienen erratas («PRICIPAL», «COR.sai» no existe; el `.ai` se llama
`LOGO PRINCIPAL COLOR .ai`, con espacio final). Cítalos tal cual.

## El manual página a página

| Pág. | Qué muestra | Regla que se extrae |
|---|---|---|
| 1 | Fondo negro, lema en Nohemi Thin gris `#A5AFA5`: «Aprender inglés; / Nunca se sintió tan cercano.» Cuadro gris pequeño arriba a la derecha. | Voz: cercana, minimalista, mucho aire. El negro es fondo principal. |
| 2 | Fondo gris `#62696B`, lema en `#A5AFA5`: «Como un amigo, / Una clase, una conversación.» | Segundo lema oficial. Gris oscuro como fondo alterno. |
| 3 | Logo claro (nombre blanco, mano blanca, «con» y contorno gris) sobre negro. | Variante para fondos oscuros. |
| 4 | Logo gris `#62696B` con mano blanca y contorno gris sobre blanco. | Variante para fondos claros. |
| 5 | Logo sobre gris `#A5AFA5` (nombre blanco, mano gris oscuro) + lema pequeño. | Variante sobre gris oficial; el lema puede acompañar al logo debajo, centrado. |
| 6 | Logo sobre negro con retícula de construcción (guías horizontales por las líneas de texto y verticales en los bordes de la mano y del nombre). | Hay retícula, **pero sin medidas de zona de protección**. |
| 7 | «COLORES Y CODIGOS DE COLOR»: barra negro · gris · blanco · verde y fichas. | Paleta oficial (ver `colors.md`). |
| 8 | «TIPOGRAFIA COMPLEMENTARIA: NOHEMI THIN», alfabeto y lema. | Nohemi es la tipografía complementaria. |
| 9 | «ISOTIPO»: círculo negro, mano blanca, disco con «S», sombra elíptica gris `#999898`. | Isotipo = mano «OK» dentro de círculo con la «S». |
| 10 | «ISOTIPOS CATEGORIAS»: CORPORATE (negro), SELF (gris), KIDS (verde), cada uno con foto circular. | Una categoría = un color de círculo. Mano en contorno blanco. |
| 11 | Logo blanco sobre verde `#86EF86`. | Variante sobre verde (uso gráfico/grandes formatos). |

Fuentes incrustadas en el manual: `Nohemi-Thin` (textos), `AnjaElianeaccent-Nornal` (la «l» de
«Inglés» y la «S» del isotipo, **sin licencia para la app**: por eso se convierten a trazado),
`MyriadPro-Regular` (fichas de color, solo maquetación).

## Lo que el manual NO define (decisiones de adaptación de la app)

Zona de protección y tamaño mínimo del logo, colores de estado (error, aviso, info), superficies y
bordes, tipografía de cuerpo, escala tipográfica, radios, sombras, espaciado, iconografía, fotografía y
movimiento. Todo eso está en las otras referencias marcado como **derivado**, con su justificación.

## Conflictos detectados en el kit (se resuelven a favor del manual)

| # | Conflicto | Resolución en la app |
|---|---|---|
| C1 | `ISOLOGO KIDS.png` usa verde `#94C77D`; el manual (p. 7 y p. 10) usa `#86EF86`. | Se usa `#86EF86` (manual). El PNG no se usa en pantalla. |
| C2 | La p. 4 (logo sobre blanco) escribe «Ingles» **sin tilde**; p. 3, p. 5, p. 11 y los PNG dicen «Inglés». | Una sola geometría, con tilde, para los dos temas (de `ingles-con-sebas-negro.pdf`). |
| C3 | La barra de color de las pp. 7 y 10 pinta el blanco como `#F9F9F9`; la ficha dice `#FFFFFF`. | `#FFFFFF` (valor declarado en la ficha). |
| C4 | El manual nombra «Nohemi Thin», pero el kit trae ExtraLight, Light y Medium. | Thin no está disponible. La app usa Nohemi **Medium** para títulos (legibilidad en móvil). |
| C5 | El gris del logo en el manual es `#62696B`; los PNG rasterizados dan `#646A6C`. | `#62696B` (vectorial). |
| C6 | Isotipo p. 9: mano **blanca rellena** y sombra; p. 10 y PNG: mano en **contorno** blanco, sin sombra. | Se sigue p. 10/PNG (categorías), sin sombra. La versión p. 9 no se usa en la app. |
| C7 | CMYK del negro en la ficha: 91 79 62 97 (negro enriquecido de imprenta). | Irrelevante en pantalla: `#000000`. |

## Pendiente de confirmar con Sebastián

- Zona de protección y tamaño mínimo oficiales del logo (hoy: derivados, ver `logo-usage.md`).
- Si la tipografía de cuerpo DM Sans (decisión F1-01b, no está en el kit) queda aprobada.
- Qué categoría (Corporate / Self / Kids) corresponde a cada producto o grupo en la app.
- Licencia de la fuente del logo (Anja Eliane) si algún día se quisiera usar como texto (hoy no).
- Colores de estado (rojo, ámbar, azul info): derivados, sin aprobación de marca.
