// Constructor (F1-03): funciones puras del dominio de sesión. El tester amplía los casos.
import type { IResponseSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import { mensajesSesion } from '@/modules/sesion/domain/sesion.mensajes';
import {
  agregarDigito,
  debeRenovar,
  leerSesionGuardada,
  normalizarUsuario,
  quitarDigito,
  serializarSesion,
  sesionVencida,
  urlAyudaPin,
  validarPin,
  validarUsuario,
} from '@/modules/sesion/domain/validations/sesion.validations';

const sesion: IResponseSesion = {
  token: 'abc',
  expiraEn: '2026-12-01T00:00:00Z',
  renovarDesde: '2026-11-17T00:00:00Z',
  usuario: {
    id: 's1',
    nombre: 'Ana Torres',
    usuario: 'ana',
    rol: 'estudiante',
  },
};

describe('usuario y PIN', () => {
  it('normaliza el usuario como auth.php', () => {
    expect(normalizarUsuario('  ANA ')).toBe('ana');
  });

  it('valida el usuario vacío', () => {
    expect(validarUsuario('   ')).toBe(mensajesSesion.usuarioVacio);
    expect(validarUsuario('ana')).toBeNull();
  });

  it.each(['', '123', '12345', '12a4'])('el PIN %p no es válido', pin => {
    expect(validarPin(pin)).toBe(mensajesSesion.pinInvalido);
  });

  it('el PIN de 4 dígitos es válido', () => {
    expect(validarPin('0123')).toBeNull();
  });

  it('agrega dígitos hasta 4 e ignora lo que no es dígito', () => {
    expect(agregarDigito('12', '3')).toBe('123');
    expect(agregarDigito('1234', '5')).toBe('1234');
    expect(agregarDigito('12', 'x')).toBe('12');
    expect(quitarDigito('123')).toBe('12');
    expect(quitarDigito('')).toBe('');
  });
});

describe('fechas', () => {
  const antes = new Date('2026-11-16T00:00:00Z');
  const despues = new Date('2026-12-02T00:00:00Z');

  it('sesionVencida compara expiraEn con ahora', () => {
    expect(sesionVencida(sesion, antes)).toBe(false);
    expect(sesionVencida(sesion, despues)).toBe(true);
    expect(sesionVencida({ ...sesion, expiraEn: 'no-fecha' }, antes)).toBe(
      true,
    );
  });

  it('debeRenovar solo con renovarDesde pasado', () => {
    expect(debeRenovar(sesion, antes)).toBe(false);
    expect(debeRenovar(sesion, despues)).toBe(true);
    expect(debeRenovar({ ...sesion, renovarDesde: null }, despues)).toBe(false);
    expect(debeRenovar({ ...sesion, renovarDesde: 'x' }, despues)).toBe(false);
  });
});

describe('serialización', () => {
  it('guarda solo los campos conocidos con la versión, nunca el PIN', () => {
    const conPin = { ...sesion, pin: '1234' } as IResponseSesion;
    const json = JSON.parse(serializarSesion(conPin));
    expect(json).toEqual({ version: 1, ...sesion });
    expect(json).not.toHaveProperty('pin');
  });

  it('lee lo que guarda', () => {
    expect(leerSesionGuardada(serializarSesion(sesion))).toEqual({
      version: 1,
      ...sesion,
    });
  });

  it.each([
    null,
    '',
    'no es json',
    '42',
    JSON.stringify({ version: 2, ...sesion }),
    JSON.stringify({ version: 1, ...sesion, usuario: null }),
    JSON.stringify({ version: 1, ...sesion, token: '' }),
    JSON.stringify({ version: 1, ...sesion, renovarDesde: 3 }),
    JSON.stringify({
      version: 1,
      ...sesion,
      usuario: { ...sesion.usuario, rol: 'otro' },
    }),
  ])('devuelve null con %p', texto => {
    expect(leerSesionGuardada(texto)).toBeNull();
  });
});

it('urlAyudaPin arma el enlace de WhatsApp con el mensaje codificado', () => {
  expect(urlAyudaPin()).toBe(
    `https://wa.me/573205571518?text=${encodeURIComponent(
      mensajesSesion.ayudaPinWhatsApp,
    )}`,
  );
});
