import { useMemo } from 'react';

import type { ITema } from './temas';
import { useTema } from './TemaProvider';

/**
 * Estilos que dependen del tema. `fabrica` debe declararse fuera del componente (estable): se
 * vuelve a llamar solo cuando cambia el tema.
 *
 * ```ts
 * const crearEstilos = (tema: ITema) => StyleSheet.create({ caja: { backgroundColor: tema.colores.fondo } });
 * const estilos = useEstilos(crearEstilos);
 * ```
 */
export function useEstilos<T>(fabrica: (tema: ITema) => T): T {
  const { tema } = useTema();
  return useMemo(() => fabrica(tema), [fabrica, tema]);
}
