import type { EstadoOnboarding } from '../entities/Onboarding.entities';

/** Clave de la bandera en el almacén seguro (servicio `com.inglesconsebas.app.hasSeenOnboarding`). */
export const CLAVE_ONBOARDING_VISTO = 'hasSeenOnboarding';
export const VALOR_ONBOARDING_VISTO = '1';
export const TOTAL_PAGINAS_ONBOARDING = 4;

/** `true` solo si el texto guardado es exactamente VALOR_ONBOARDING_VISTO. */
export function onboardingVisto(texto: string | null): boolean {
  return texto === VALOR_ONBOARDING_VISTO;
}

/** Índice siguiente, o `null` si `indice` es la última página (toca terminar). */
export function paginaSiguiente(indice: number, total: number): number | null {
  return indice + 1 < total ? indice + 1 : null;
}

/** Índice anterior, o `null` en la primera página (atrás no se intercepta). */
export function paginaAnterior(indice: number): number | null {
  return indice > 0 ? indice - 1 : null;
}

/** Página según el desplazamiento horizontal: redondea y acota a [0, total-1]; con ancho ≤ 0, 0. */
export function paginaDesdeDesplazamiento(
  x: number,
  ancho: number,
  total: number,
): number {
  if (ancho <= 0 || total <= 0) {
    return 0;
  }
  const pagina = Math.round(x / ancho);
  return Math.min(Math.max(pagina, 0), total - 1);
}

/** Decide si se muestra la bienvenida: solo sin sesión y con la bandera pendiente. */
export function debeMostrarOnboarding(
  estado: EstadoOnboarding,
  haySesion: boolean,
): boolean {
  return !haySesion && estado.tipo === 'pendiente';
}
