// Constructor (EXT-01): funciones puras del dominio de la bienvenida. El tester amplía los casos.
import type { EstadoOnboarding } from '@/modules/onboarding/domain/entities/Onboarding.entities';
import {
  CLAVE_ONBOARDING_VISTO,
  debeMostrarOnboarding,
  onboardingVisto,
  paginaAnterior,
  paginaDesdeDesplazamiento,
  paginaSiguiente,
  TOTAL_PAGINAS_ONBOARDING,
  VALOR_ONBOARDING_VISTO,
} from '@/modules/onboarding/domain/validations/onboarding.validations';

describe('onboarding.validations', () => {
  it('constantes de la bandera y de las páginas', () => {
    expect(CLAVE_ONBOARDING_VISTO).toBe('hasSeenOnboarding');
    expect(VALOR_ONBOARDING_VISTO).toBe('1');
    expect(TOTAL_PAGINAS_ONBOARDING).toBe(4);
  });

  it('onboardingVisto solo acepta exactamente «1»', () => {
    expect(onboardingVisto('1')).toBe(true);
    expect(onboardingVisto(null)).toBe(false);
    expect(onboardingVisto('')).toBe(false);
    expect(onboardingVisto('true')).toBe(false);
  });

  it('paginaSiguiente y paginaAnterior en los bordes', () => {
    expect(paginaSiguiente(0, 4)).toBe(1);
    expect(paginaSiguiente(2, 4)).toBe(3);
    expect(paginaSiguiente(3, 4)).toBeNull();
    expect(paginaAnterior(0)).toBeNull();
    expect(paginaAnterior(3)).toBe(2);
  });

  it('paginaDesdeDesplazamiento redondea y acota', () => {
    expect(paginaDesdeDesplazamiento(0, 360, 4)).toBe(0);
    expect(paginaDesdeDesplazamiento(720, 360, 4)).toBe(2);
    expect(paginaDesdeDesplazamiento(530, 360, 4)).toBe(1);
    expect(paginaDesdeDesplazamiento(550, 360, 4)).toBe(2);
    expect(paginaDesdeDesplazamiento(-200, 360, 4)).toBe(0);
    expect(paginaDesdeDesplazamiento(5000, 360, 4)).toBe(3);
    expect(paginaDesdeDesplazamiento(720, 0, 4)).toBe(0);
    expect(paginaDesdeDesplazamiento(720, 360, 0)).toBe(0);
  });

  it('debeMostrarOnboarding: solo sin sesión y con la bandera pendiente', () => {
    const estados: EstadoOnboarding[] = [
      { tipo: 'cargando' },
      { tipo: 'pendiente' },
      { tipo: 'visto' },
    ];
    const resultado = estados.flatMap(e => [
      debeMostrarOnboarding(e, false),
      debeMostrarOnboarding(e, true),
    ]);
    expect(resultado).toEqual([false, false, true, false, false, false]);
  });
});
