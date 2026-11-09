# Calidad — cómo se construye cada feature

Cada punto de la app se construye como una **feature**, en su propia rama, con el flujo `/feature`. La skill `.claude/skills/feature/SKILL.md` encadena cinco roles con funciones separadas:

| Rol | Quién | Puede escribir | Entrega |
|---|---|---|---|
| Orquestador | La sesión principal, con la skill `/feature` | Ramas, carpeta de la feature y tablero | El flujo completo y los informes guardados |
| Planificador | Subagente `planificador` | No, solo lectura | `docs/features/<CÓDIGO>-<slug>/plan.md` |
| Constructor | Subagente `constructor` | Código de `src/`, nativo y configuración | Commits por capa |
| Tester | Subagente `tester` | Solo tests (`__tests__/`, `*.test.ts(x)`) | Tests y `pruebas.md` |
| Aprobador | Subagente `aprobador` | No, solo lectura | Veredicto en `aprobacion.md` |
| Desplegador | Subagente `desplegador` | Git (merge, tag, push con OK) y tablero | `main` actualizado, APK y PR |

La regla de oro es que **quien construye no aprueba**. El tester prueba contra los criterios del plan, no contra el código. El aprobador no puede modificar lo que juzga.

## Definition of Ready (antes de construir)

- [ ] La feature tiene código de tablero (F1-01, F2-03…) o una descripción escrita del usuario.
- [ ] Los criterios de aceptación son **verificables**, sea por un test o por un paso manual concreto.
- [ ] Las dependencias están identificadas: endpoints de la API de Leap, SDK nativos y otras features.
- [ ] Si la API todavía no existe, se usa un adaptador en memoria del mismo puerto.
- [ ] `plan.md` está **aprobado por el usuario**. Sin esto no se escribe código.

## Definition of Done (antes de hacer el merge)

- [ ] La puerta automática está en verde: `npm run calidad`.
- [ ] Todos los criterios de aceptación del plan están cubiertos por tests o tienen verificación manual documentada en `pruebas.md`.
- [ ] El aprobador dio el veredicto **APROBADO** y quedó en `aprobacion.md`.
- [ ] Si el módulo, el permiso, la variable o el paso nativo son nuevos, están documentados en `CLAUDE.md` o en el README.
- [ ] Cada variable de entorno nueva está en `.env.example`.
- [ ] La tarjeta del tablero está actualizada: subtareas, comentario con commit y PR, y columna.

## Puerta automática

`npm run calidad` ejecuta, en orden, y se corta con el primer fallo:

1. `tsc --noEmit`: tipos estrictos.
2. `eslint .`: incluye `eslint-plugin-boundaries`, que impone la regla de capas de `docs/ARQUITECTURA.md`.
3. `prettier --check`: el formato.
4. `jest --coverage`: con estos umbrales de cobertura.
   - 90 % en `src/modules/*/domain` y `src/modules/*/aplications`.
   - 70 % global.

El build de Android (`npm run build:android:debug`) es parte de la puerta del desplegador. En los PR lo corre el CI (`.github/workflows/calidad.yml`).

## Checklist del aprobador

1. **Capas**
   - `domain` no importa de otras capas.
   - Los casos de uso son funciones puras que reciben el repositorio.
   - Las pantallas solo usan su controller.
   - Los SDK se usan solo a través de un puerto.
2. **Convenciones**: los nombres siguen la sección 6 de la guía (`IArgs*`, `IResponse*`, `<Modulo>Repository`, `use<Modulo>Controller`, métodos con `_`) y los imports usan el alias `@/`.
3. **Criterios**: cada criterio de `plan.md` está implementado y probado. No hay alcance de más sin acordar.
4. **Seguridad**
   - El token solo va por `SecureStoragePort`.
   - No hay secretos en el repo ni en logs.
   - El 401 limpia la sesión.
   - El PIN no se guarda en claro.
5. **Errores**: los adaptadores devuelven `HttpResponse` con `error: true` y un `msg` legible, sin lanzar excepciones crudas. El feedback de las mutaciones va por `notify`.
6. **Accesibilidad e i18n**
   - Los elementos interactivos tienen `accessibilityLabel` y `accessibilityRole`.
   - Las áreas táctiles miden al menos 44 pt.
   - Los textos están centralizados.
7. **Tests**: hay casos de uso con un repositorio falso, el controller y la pantalla con el controller mockeado. Se prueban también los casos de error, no solo el camino feliz.
8. **Nativo**: los permisos son solo los necesarios, con textos en español. Los pasos manuales están documentados.
9. **Compatibilidad con la API**: no se depende de campos que la API de Leap no devuelve. Los cambios de API van antes que el móvil.

El veredicto es **APROBADO** o **RECHAZADO**. Los hallazgos citan `archivo:línea` y se clasifican:
- **bloqueante**: impide el merge;
- **mejora**: se puede dejar para después, anotada.

Basta un hallazgo bloqueante para rechazar.

## Vueltas y escalado

Si el tester o el aprobador rechazan, el orquestador devuelve al constructor **los hallazgos concretos**. Hay como máximo **2 vueltas** por feature. A la tercera, el flujo se detiene y consulta al usuario.

## Commits y ramas

- Las ramas salen de `main`: `feat/<CÓDIGO>-<slug>`, `fix/…`, `chore/…`, `docs/…` o `refactor/…`.
- Los commits siguen **Conventional Commits en español** (`feat(sesion): login con usuario y PIN`). commitlint los valida.
- Hay un commit por cada cambio coherente. Nunca hay push directo ni force-push a `main`. El push y el PR van siempre con el OK del usuario.

## Trazabilidad

El código de la tarjeta, por ejemplo `F1-03`, aparece en:
- el nombre de la rama;
- el ámbito o el cuerpo de los commits;
- la carpeta `docs/features/F1-03-…/`;
- el título del PR;
- el comentario que el desplegador deja en la tarjeta del tablero, en APL-Tareas tablero #4.

Así cualquier cambio se puede seguir desde el tablero hasta el código y de vuelta.
