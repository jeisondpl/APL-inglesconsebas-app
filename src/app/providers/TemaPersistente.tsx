import { useEffect, useRef } from 'react';

import { useNative } from '@/app/di';
import { useTema, type PreferenciaTema } from '@/shared/theme';

/** Clave del almacén donde se recuerda la preferencia de tema (F1-03b, 1.14). */
export const CLAVE_PREFERENCIA_TEMA = 'themePreference';

const VALIDAS: readonly PreferenciaTema[] = ['sistema', 'claro', 'oscuro'];

const esPreferencia = (v: string | null): v is PreferenciaTema =>
  v !== null && VALIDAS.includes(v as PreferenciaTema);

/**
 * Recuerda el tema elegido entre arranques: al montarse lee la preferencia guardada y, cuando la
 * persona la cambia, la guarda. No pinta nada. Vive dentro de las dependencias porque usa el
 * almacén; si leer falla se queda con la preferencia de arranque.
 */
export function TemaPersistente() {
  const almacen = useNative('almacenSeguro');
  const { preferencia, establecerPreferencia } = useTema();
  // No guarda hasta haber leído: así el valor por defecto no pisa lo que había guardado.
  const leido = useRef(false);

  useEffect(() => {
    let vivo = true;
    almacen.leer(CLAVE_PREFERENCIA_TEMA).then(v => {
      if (!vivo) {
        return;
      }
      if (esPreferencia(v)) {
        establecerPreferencia(v);
      }
      leido.current = true;
    });
    return () => {
      vivo = false;
    };
    // Solo al montar: leer una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen]);

  useEffect(() => {
    if (leido.current) {
      almacen.guardar(CLAVE_PREFERENCIA_TEMA, preferencia);
    }
  }, [almacen, preferencia]);

  return null;
}
