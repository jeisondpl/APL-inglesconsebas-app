// Constructor (EXT-01): ruta inicial del navegador raíz según la sesión y la bandera de la
// bienvenida. El tester amplía los casos.
import { rutaInicialRaiz } from '@/app/navigation/rutaInicialRaiz';
import type { RolUsuario } from '@/modules/sesion/domain/entities/Sesion.entities';

const autenticado = (rol: RolUsuario) =>
  ({
    tipo: 'autenticado',
    sesion: {
      token: 't',
      expiraEn: '2099-01-01T00:00:00Z',
      renovarDesde: null,
      usuario: { id: '1', nombre: 'X', usuario: 'x', rol },
    },
  } as const);

describe('rutaInicialRaiz', () => {
  it.each([
    [{ tipo: 'sinSesion' } as const],
    [{ tipo: 'sinSesion', motivo: 'cerrada' } as const],
    [{ tipo: 'sinSesion', motivo: 'vencida' } as const],
  ])('sin sesión (%j) y bandera pendiente → Onboarding', estadoSesion => {
    expect(
      rutaInicialRaiz({ estadoSesion, onboarding: { tipo: 'pendiente' } }),
    ).toBe('Onboarding');
  });

  it('sin sesión y bandera vista → Login', () => {
    expect(
      rutaInicialRaiz({
        estadoSesion: { tipo: 'sinSesion' },
        onboarding: { tipo: 'visto' },
      }),
    ).toBe('Login');
  });

  it.each([
    ['estudiante', 'InicioEstudiante'],
    ['profe', 'InicioProfe'],
    ['admin', 'InicioAdmin'],
  ] as const)('con sesión de %s → %s, con o sin bandera', (rol, ruta) => {
    for (const tipo of ['pendiente', 'visto'] as const) {
      expect(
        rutaInicialRaiz({
          estadoSesion: autenticado(rol),
          onboarding: { tipo },
        }),
      ).toBe(ruta);
    }
  });
});
