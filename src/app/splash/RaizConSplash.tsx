import { useCallback, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBanderaOnboarding, useSesionActiva } from '@/app/di';
import { NavegadorRaiz } from '@/app/navigation';

import { SplashAnimado } from './SplashAnimado';

/**
 * Raíz de la app con el splash animado encima (F1-04). La navegación se monta debajo desde el primer
 * render, con su contrato de siempre (no pinta mientras restaura y oculta el splash nativo una vez);
 * el splash JS la tapa hasta que se cumplen el mínimo y la restauración, y luego se desmonta.
 */
export function RaizConSplash() {
  const sesion = useSesionActiva();
  const bandera = useBanderaOnboarding();
  const estadoSesion = useSyncExternalStore(sesion.suscribir, sesion.obtener);
  const estadoBandera = useSyncExternalStore(
    bandera.suscribir,
    bandera.obtener,
  );
  const listo =
    estadoSesion.tipo !== 'restaurando' && estadoBandera.tipo !== 'cargando';
  const [conSplash, setConSplash] = useState(true);
  const alTerminar = useCallback(() => setConSplash(false), []);

  return (
    <View style={estilos.raiz}>
      <NavegadorRaiz />
      {conSplash ? (
        <SplashAnimado listo={listo} alTerminar={alTerminar} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({ raiz: { flex: 1 } });
