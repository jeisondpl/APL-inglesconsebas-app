import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import type { IResponseConversacion } from '../../domain/entities/Mensajes.entities';
import { miReactor } from '../../domain/validations/mensajes.validations';
import { textosMensajes as textos } from '../mensajes.textos';
import { BandejaChat } from './BandejaChat';
import { HiloChat } from './HiloChat';

export interface IPropsMensajesScreen {
  /** Persona de la sesión (lo pasa la composición de `src/app`). */
  usuario: { id: string; nombre: string };
  rol: 'estudiante' | 'profe';
  /** Baja o actualiza la insignia de la pestaña. */
  alCambiarNoLeidos?: (n: number) => void;
}

/**
 * Pestaña Mensajes (F3-01). El estudiante ve su hilo directo; el profe ve la bandeja de sus
 * estudiantes y abre el hilo de uno (el atrás de Android lo cierra).
 */
export function MensajesScreen({
  usuario,
  rol,
  alCambiarNoLeidos,
}: IPropsMensajesScreen) {
  const [abierto, setAbierto] = useState<IResponseConversacion | null>(null);
  const yo = miReactor(rol, usuario.id, usuario.nombre);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }
    const suscripcion = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setAbierto(null);
        return true;
      },
    );
    return () => suscripcion.remove();
  }, [abierto]);

  const alAbrir = useCallback((c: IResponseConversacion) => setAbierto(c), []);
  const alVolver = useCallback(() => setAbierto(null), []);

  if (rol === 'estudiante') {
    return (
      <HiloChat
        idEstudiante={usuario.id}
        rol="estudiante"
        miReactor={yo}
        titulo={textos.titulo}
        subtitulo={textos.tituloEstudiante}
        alLeer={() => alCambiarNoLeidos?.(0)}
      />
    );
  }

  return abierto ? (
    <HiloChat
      key={abierto.idEstudiante}
      idEstudiante={abierto.idEstudiante}
      rol="profe"
      miReactor={yo}
      titulo={abierto.nombre}
      alVolver={alVolver}
    />
  ) : (
    <BandejaChat alAbrir={alAbrir} alCambiarNoLeidos={alCambiarNoLeidos} />
  );
}
