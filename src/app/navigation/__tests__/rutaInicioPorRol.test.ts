// Tester (F1-03): rutas iniciales de cada flujo (CA12).
import { rutaInicioPorRol } from '@/app/navigation/rutaInicioPorRol';
import { rutaInicialAuth } from '@/modules/sesion/presentation/navigation';

describe('rutas iniciales (CA12)', () => {
  it.each([
    ['estudiante', 'InicioEstudiante'],
    ['profe', 'InicioProfe'],
    ['admin', 'InicioAdmin'],
  ] as const)('rol %s → %s', (rol, ruta) => {
    expect(rutaInicioPorRol(rol)).toBe(ruta);
  });

  it('el flujo Auth arranca hoy en Login (enganche de EXT-01)', () => {
    expect(rutaInicialAuth()).toBe('Login');
  });
});
