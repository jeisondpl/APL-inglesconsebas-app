// Kit de movimiento compartido (F1-04). Solo depende de `shared`; lo usan las pantallas de los
// módulos y la composición de `src/app`. Todo respeta `useReducedMotion()`.
export { FondoMarca, type IPropsFondoMarca } from './FondoMarca';
export {
  DESPLAZAMIENTO_ENTRADA,
  duraciones,
  ESCALA_HALO,
  ESCALA_LOGO_CARGA,
  ESCALA_PRESION,
  GOLPES_SACUDIDA,
  resortes,
} from './movimiento.tokens';
export { PulsoCarga, type IPropsPulsoCarga } from './PulsoCarga';
export { Revelar, type IPropsRevelar } from './Revelar';
export { usePresionEscala, type IPresionEscala } from './usePresionEscala';
export { useSacudida, type ISacudida } from './useSacudida';
