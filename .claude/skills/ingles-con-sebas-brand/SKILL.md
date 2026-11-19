---
name: ingles-con-sebas-brand
description: Identidad visual oficial de Inglés con Sebas (kit de marca de Sebastián, 2026-11-10) convertida en reglas operativas para la app React Native. Paleta oficial (#FFFFFF, #000000, #86EF86, #A5AFA5), Nohemi + DM Sans, logo principal e isotipos Corporate / Self / Kids, tokens semánticos claro/oscuro, componentes de src/shared y patrones móviles. Úsala SIEMPRE que se cree, modifique, rediseñe, revise o audite una pantalla, componente, navegación, estilo, color, tipografía, ícono, splash, ilustración o recurso gráfico de Inglés con Sebas, o cuando pidan «respetar la marca», «auditar la interfaz», «corregir inconsistencias visuales», «tema claro/oscuro» o «usar el logo / isotipo».
---

# Marca Inglés con Sebas — guía operativa

Fuente de verdad: el kit oficial, versionado en `assets/marca/kit/` (`manual-de-marca.pdf`, 11 páginas;
`ingles-con-sebas-negro.pdf`; `logo-principal.pdf`) y el original en
`E:\DATA\PROYECTOS\INGLES-REBRANDING\KIT DE MARCA - INGLES CON SEBAS-20261110T151059Z-1-001\`.
La implementación ya existe (F1-01b) y es fiel al kit: **esta skill se usa para aplicarla, no para rehacerla**.

## 1. Qué leer según la tarea

| Tarea | Lee primero |
|---|---|
| Pantalla nueva o rediseño | `references/mobile-patterns.md` → `references/components.md` |
| Color, fondo, estado, contraste | `references/colors.md` (+ `design-tokens.json`) |
| Texto, títulos, fuentes | `references/typography.md` |
| Logo, isotipo, splash, ícono, avatar de categoría | `references/logo-usage.md` |
| Duda sobre qué dice el manual / conflictos del kit | `references/brand-guidelines.md` |
| Auditar algo ya hecho | § 4 de este archivo + `scripts/auditar-marca.mjs` |

Mira `references/img/manual-paginas.png` (las 11 páginas del manual) y `references/img/kit-pngs.png`
(los PNG del kit) cuando necesites el referente visual; no hace falta volver a abrir el PDF.

## 2. Reglas que nunca se rompen

1. **Oficial vs derivado.** Solo son de marca: blanco `#FFFFFF`, negro `#000000`, verde `#86EF86`,
   gris `#A5AFA5` (manual p. 7) y el gris del logo sobre blanco `#62696B` (p. 4). Todo lo demás
   (superficies, estados, verde bosque del tema claro…) es **derivado funcional**: se documenta como tal,
   nunca se presenta como regla de marca.
2. **Cero hex en pantallas ni módulos.** Los colores salen de `useTema().tema.colores.<token>` o de
   `<Texto color="token">`. La paleta (`paleta.ts`) solo la consume `temas.ts`. Si falta un token, se
   añade en `temas.ts` **en los dos temas** con comentario `// derivado` y su contraste.
3. **El logo no se redibuja.** El logo principal (`<Marca>`) y el isotipo (`<LogoMarca>`) se dibujan
   con los trazados de `assets/marca/logo.json`, extraídos del PDF vectorial por
   `scripts/extraer-logo-kit.py`. Prohibido: aproximarlo con texto o íconos, deformarlo, recolorearlo
   fuera de las variantes, ponerle sombras/contornos, rotarlo o recortar la mano. `logo.json`, el ícono
   y el splash son salida generada: no se editan a mano.
4. **Tipografía por archivo, no por peso.** `fontFamily` = nombre PostScript (`Nohemi-Medium`,
   `DMSans-Regular`, `DMSans-Medium`, `DMSans-SemiBold`); **nunca `fontWeight`** con estas fuentes. El
   texto va con `<Texto variante=…>`, no con `<Text>` de react-native.
5. **Un solo sistema.** Antes de crear un componente, busca en `src/shared/components` y
   `src/shared/movimiento`. Se extiende por props/variantes; no se crea un `BotonVerde` paralelo.
6. **Accesibilidad mínima.** Texto normal ≥ 4.5:1, texto grande y bordes de control ≥ 3:1, áreas
   táctiles ≥ `tema.toqueMinimo` (44), `accessibilityRole`/`accessibilityLabel` en todo lo pulsable,
   animaciones que respetan `useReducedMotion()`.
7. **Dos temas siempre.** Toda pantalla se comprueba en claro y oscuro (`PREFERENCIA_TEMA_POR_DEFECTO
   = 'sistema'`, oscuro si el sistema no informa). El oscuro es el tema «insignia» de la marca (p. 1, 3, 6).
8. **Fuera de alcance.** Esta skill no toca reglas de negocio, auth, API ni navegación: solo identidad
   visual y UI.

## 3. Cómo diseñar una pantalla nueva

1. Envuelve en `<Pantalla>` (safe area edge-to-edge) con `desplazable` si el contenido puede crecer.
2. Jerarquía: un `h1` (o la `<Marca>` en pantallas de entrada), `h2` por bloque, `etiqueta` para
   sobretítulos en mayúsculas, `cuerpo` para el resto. Máximo un botón `primario` por vista.
3. Bloques en `<Tarjeta>`; el dato más importante del rol (p. ej. «Próxima clase») en
   `<Tarjeta variante="destacada">`.
4. Espaciado solo con `tema.espaciado` (4 · 8 · 12 · 16 · 20 · 24 · 32); margen lateral `xl` (20).
5. Estados: carga con `<Cargando>`/`<PulsoCarga>`, error de carga inline con `<AvisoEnLinea tono="error"
   accion={{ titulo: 'Reintentar', … }}>`, vacío con texto `textoSecundario` + acción, resultado de
   mutación con `notify.*` (nunca `Toast` directo).
6. Entradas con `<Revelar>` y presión con `usePresionEscala` (kit `src/shared/movimiento`, F1-04).
7. Textos en `<pantalla>.textos.ts`, nunca literales en el JSX.
8. Añade la variante nueva al escaparate (`src/app/escaparate/SistemaDisenoScreen.tsx`) si creaste o
   ampliaste un componente compartido.
9. Pasa la § 4 antes de dar por terminado.

## 4. Lista de revisión (auditar una interfaz)

Ejecuta primero `node .claude/skills/ingles-con-sebas-brand/scripts/auditar-marca.mjs [ruta]` (sin
dependencias; por defecto `src/`). Señala hex sueltos, `fontWeight`, `<Text>` crudo, `Toast` directo,
`rgba(` y colores con nombre. Luego revisa a mano:

- [ ] Colores solo por token; ningún verde oficial `#86EF86` como texto sobre blanco (1.43:1).
- [ ] Logo/isotipo con `<Marca>`/`<LogoMarca>`, variante correcta para el fondo (`logo-usage.md`).
- [ ] Títulos en Nohemi Medium, cuerpo en DM Sans, sin `fontWeight`.
- [ ] Radios del tema (`radios.boton` 16, `tarjeta` 20, `heroe` 26); nada de radios sueltos.
- [ ] Claro y oscuro revisados; contrastes según `colors.md` (usa `scripts/contraste.mjs`).
- [ ] Áreas táctiles ≥ 44, roles y etiquetas accesibles, `reduce motion` respetado.
- [ ] Sin componentes duplicados; textos centralizados.

Excepciones conocidas y justificadas (no son incumplimientos):
- `src/app/providers/LimiteDeErrores.tsx`: el respaldo ante un error no usa los componentes
  compartidos (podrían ser los que fallaron); repite a mano los valores de los tokens (radio 16, alto
  48) y toma los colores de `useTema()`.
- `fontWeight: '400'` / `'normal'` junto a una `fontFamily` de marca (navegación, toasts): neutraliza
  la negrita sintética de Android; está permitido.

Cada hallazgo se reporta con: archivo:línea, regla rota (cita a la referencia o página del manual),
corrección propuesta. Distingue **incumplimiento de marca** (rompe una regla oficial) de **mejora**
(decisión derivada).

## 5. Utilidades

- `node scripts/contraste.mjs '#86EF86' '#FFFFFF'` → relación WCAG y si pasa AA / AA grande.
- `node scripts/auditar-marca.mjs src/modules/agenda` → hallazgos por archivo.
- `node scripts/generar-tokens.mjs [--comprobar]` → regenera (o verifica) `references/design-tokens.json`
  desde `src/shared/theme` y `logo.json`. Ejecútalo tras tocar `paleta.ts`, `temas.ts` o `tipografia.ts`.
- `npm run calidad` en la raíz de la app: la puerta del proyecto (tsc, ESLint, Prettier, Jest). El test
  `src/shared/theme/__tests__/temas.test.ts` ya fija la paleta oficial y los contrastes AA.

## 6. Mantener la skill

Si llega una versión nueva del kit: cópiala a `assets/marca/kit/`, re-ejecuta
`python scripts/extraer-logo-kit.py` y `npm run marca:logo && npm run marca:iconos && npm run marca:splash`,
compara la paleta de la p. 7 con `paleta.ts` y actualiza `brand-guidelines.md` (tabla de conflictos),
`colors.md` y `design-tokens.json`. Regenera `references/img/*.png` con PyMuPDF (no hay poppler).
