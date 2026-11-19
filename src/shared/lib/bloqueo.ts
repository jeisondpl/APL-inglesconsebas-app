export interface IEstadoBloqueo {
  /** La persona activó el desbloqueo con huella o rostro. */
  activo: boolean;
  /** Ahora mismo la app está tapada hasta que se verifique. */
  bloqueada: boolean;
}

/** Estado del desbloqueo biométrico, en memoria y compartido entre el perfil y el navegador. */
export interface Bloqueo {
  obtener(): IEstadoBloqueo;
  /** Arranque en frío: si estaba activo, empieza bloqueada. */
  cargar(activo: boolean): void;
  /** La persona lo activó o desactivó (activar no bloquea ahora). */
  establecerActivo(activo: boolean): void;
  bloquear(): void;
  desbloquear(): void;
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}

/** Clave del almacén seguro donde se recuerda que el desbloqueo biométrico está activo. */
export const CLAVE_BLOQUEO_BIOMETRICO = 'biometricLock';

const LIBRE: IEstadoBloqueo = { activo: false, bloqueada: false };

export function crearBloqueo(): Bloqueo {
  let estado = LIBRE;
  const oyentes = new Set<() => void>();
  const poner = (nuevo: IEstadoBloqueo) => {
    if (
      nuevo.activo === estado.activo &&
      nuevo.bloqueada === estado.bloqueada
    ) {
      return;
    }
    estado = nuevo;
    oyentes.forEach(oyente => oyente());
  };
  return {
    obtener: () => estado,
    cargar: activo => poner({ activo, bloqueada: activo }),
    establecerActivo: activo => poner({ activo, bloqueada: false }),
    // Solo se bloquea lo que está activo.
    bloquear: () => poner({ ...estado, bloqueada: estado.activo }),
    desbloquear: () => poner({ ...estado, bloqueada: false }),
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
