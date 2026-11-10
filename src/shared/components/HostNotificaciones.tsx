import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Toast, {
  BaseToast,
  type BaseToastProps,
  type ToastConfig,
} from 'react-native-toast-message';

import type { TipoAviso } from '@/shared/lib/notify';
import { useTema, type IColoresTema, type ITema } from '@/shared/theme';

/** Color de acento (borde izquierdo) de cada tipo de `notify`. */
const acentoPorTipo: Record<TipoAviso, keyof IColoresTema> = {
  success: 'marca',
  error: 'peligro',
  warning: 'aviso',
  info: 'info',
};

/** Configuración de los cuatro tipos con los colores y fuentes del tema. */
export function configuracionNotificaciones(tema: ITema): ToastConfig {
  const { colores, familias, radios } = tema;
  const estilos = StyleSheet.create({
    toast: {
      backgroundColor: colores.superficie,
      borderColor: colores.borde,
      borderWidth: 1,
      borderLeftWidth: 5,
      borderRadius: radios.boton,
      minHeight: 60,
      height: undefined,
      paddingVertical: 10,
    },
    contenido: { paddingHorizontal: 16 },
    titulo: {
      color: colores.texto,
      fontFamily: familias.nohemiMedium,
      fontWeight: 'normal',
      fontSize: 14,
      lineHeight: 18,
    },
    detalle: {
      color: colores.textoSecundario,
      fontFamily: familias.dmSansRegular,
      fontSize: 12,
      lineHeight: 16,
    },
  });
  const crear = (tipo: TipoAviso) =>
    function ToastDelTema(props: BaseToastProps) {
      return (
        <BaseToast
          {...props}
          style={[
            estilos.toast,
            { borderLeftColor: colores[acentoPorTipo[tipo]] },
          ]}
          contentContainerStyle={estilos.contenido}
          text1Style={estilos.titulo}
          text2Style={estilos.detalle}
          text1NumberOfLines={2}
          text2NumberOfLines={3}
        />
      );
    };
  return {
    success: crear('success'),
    error: crear('error'),
    warning: crear('warning'),
    info: crear('info'),
  };
}

/**
 * Host de los toasts de `notify`, con los colores del tema. Va dentro de TemaProvider y es, junto
 * con notify.ts, el único que importa react-native-toast-message. `notify` no cambia.
 */
export function HostNotificaciones() {
  const { tema } = useTema();
  const config = useMemo(() => configuracionNotificaciones(tema), [tema]);
  return <Toast config={config} />;
}
