# Layout y experiencia móvil

Todo lo de este archivo es **extensión funcional** del sistema de diseño (el manual no habla de
pantallas). Se apoya en el carácter del manual: fondos planos negro/blanco, mucho espacio vacío,
composición centrada, un solo acento verde.

## Principios visuales derivados del manual

1. **Aire antes que adorno.** Las páginas del manual son un logo o una frase sobre un plano liso. En la
   app: pocas piezas por pantalla, márgenes generosos, sin sombras, sin degradados (salvo el halo de
   `FondoMarca`), sin texturas.
2. **El verde es un acento, no un fondo.** Úsalo para la acción principal, el estado activo y el halo.
   Pantallas completas en verde solo para momentos de marca (p. 11): splash alternativo, celebración.
3. **Oscuro es la cara de la marca.** Login, onboarding y splash se diseñan primero en oscuro; el claro
   debe funcionar igual de bien (los tests fijan AA en los dos).
4. **Cercanía.** Textos de tú, frases cortas, lema oficial donde haya un momento de bienvenida.

## Espaciado y retícula

- Escala `tema.espaciado`: `xs 4 · s 8 · m 12 · l 16 · xl 20 · xxl 24 · xxxl 32`. Nada fuera de ella.
- Margen lateral de pantalla `xl` (20); entre bloques `xxl` (24); dentro de tarjeta `l` (16); entre
  elementos relacionados `s`/`m`.
- Una columna en teléfono. Rejillas de 2 columnas solo para KPI/accesos. En tablet (≥ 600 dp) limita el
  ancho del contenido a ~560 dp centrado en vez de estirar.

## Radios y bordes

`radios`: `icono 12 · boton 16 · campo 16 · tarjeta 20 · heroe 26 · pildora 999`. Bordes de 1 px
(`borde`), 1.5 px en botón secundario/peligro, 2 px en foco de campo (F1-04).

## Densidad y jerarquía

- Un `h1` por pantalla; la acción principal visible sin desplazar.
- Máximo un botón primario; el resto secundario/terciario.
- Información del rol primero (estudiante: próxima clase y saldo; profe: clases del día; admin: alertas).

## Safe areas y pantallas

- Siempre `<Pantalla>` (edge-to-edge, targetSdk 36): `bordes` para excluir el inferior cuando hay tabs.
- Probar en pantalla pequeña (360×640 dp) y con notch/isla; nada fijo en px absolutos.
- Teclado: formularios dentro de `Pantalla desplazable`; el botón de enviar no queda tapado.

## Accesibilidad táctil

- Área mínima `tema.toqueMinimo` (44); botones de 48 de alto; filas de lista ≥ 56.
- 8 dp mínimo entre objetivos táctiles contiguos.
- Todo pulsable con `accessibilityRole` y `accessibilityLabel` (textos centralizados), estados con
  `accessibilityState`. Errores de validación se anuncian (`accessibilityRole="alert"` en `Campo`).
- No transmitir información solo por color: estado de clase = color + texto de la `Insignia`.

## Movimiento (F1-04, `src/shared/movimiento`)

- Tokens en `movimiento.tokens.ts`: entrada 420 ms con resorte suave (`damping 16, stiffness 140`),
  desplazamiento 20 dp; presión escala 0.97; sacudida de error 5 golpes de 55 ms; halo respira 1.08 en
  1600 ms.
- Reanimated 4; todo respeta `useReducedMotion()` (queda solo un fundido de 200 ms).
- Movimiento con propósito: entrada de bloques, feedback de pulsación, error de PIN, carga. Nada en
  bucle salvo el halo y la carga.

## Android e iOS

- Fuentes: el archivo se llama como su nombre PostScript (Android busca por archivo, iOS por
  PostScript); en iOS también en `UIAppFonts`.
- Splash: `react-native-bootsplash` con recursos generados (claro y oscuro); ícono = isotipo Corporate.
- Barra de estado: contenido claro en tema oscuro y oscuro en claro.
- iOS no está verificado en dispositivo (no hay Mac: `pod install` pendiente). Cualquier cambio visual
  se valida en Android y se marca iOS como pendiente.

## Imágenes y fotografía

El manual (p. 10) usa fotos circulares de personas reales junto a cada categoría. Si la app usa
fotografía: recorte circular, personas en contexto de aprendizaje, sin filtros de color. No hay banco
de imágenes en el kit: no inventar ni generar fotos; pedirlas.
