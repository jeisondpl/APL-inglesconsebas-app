export interface IEstadoConexion {
  /** La última petición no llegó al servidor (sin red o tiempo agotado). */
  sinConexion: boolean;
  /** Mientras no hay conexión, lo que se ve salió de la caché local, no del servidor. */
  mostrandoGuardado: boolean;
}

/** Estado de la conexión con Leap, deducido de las peticiones (sin librería nativa). */
export interface EstadoConexion {
  obtener(): IEstadoConexion;
  /** Una petición llegó al servidor: hay conexión. */
  marcarEnLinea(): void;
  /** Una petición no llegó al servidor. */
  marcarSinConexion(): void;
  /** Se respondió con lo guardado porque no hay conexión. */
  marcarGuardado(): void;
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}

const EN_LINEA: IEstadoConexion = {
  sinConexion: false,
  mostrandoGuardado: false,
};

/** Store en memoria, sin React; React lo lee con useSyncExternalStore. */
export function crearEstadoConexion(): EstadoConexion {
  let estado = EN_LINEA;
  const oyentes = new Set<() => void>();
  const poner = (nuevo: IEstadoConexion) => {
    if (
      nuevo.sinConexion === estado.sinConexion &&
      nuevo.mostrandoGuardado === estado.mostrandoGuardado
    ) {
      return;
    }
    estado = nuevo;
    oyentes.forEach(oyente => oyente());
  };
  return {
    obtener: () => estado,
    marcarEnLinea: () => poner(EN_LINEA),
    marcarSinConexion: () =>
      poner({ sinConexion: true, mostrandoGuardado: estado.mostrandoGuardado }),
    marcarGuardado: () => poner({ sinConexion: true, mostrandoGuardado: true }),
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
