// Constructor (F1-03): pasos, teclado, envío al 4.º dígito, errores y ayuda por WhatsApp del
// controller de login (CA2-CA4, CA14). El tester amplía los casos.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { useLoginController } from '@/modules/sesion/aplications/controllers/Login.controller';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { mensajesSesion } from '@/modules/sesion/domain/sesion.mensajes';
import { crearMemoriaSesionRepository } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

async function montar(dependencias = crearDependenciasDePrueba()) {
  const r = await renderHook(() => useLoginController(), {
    wrapper: envoltorio(dependencias),
  });
  return { ...r, dependencias };
}

const pulsar = async (
  result: { current: ReturnType<typeof useLoginController> },
  digitos: string,
) => {
  for (const d of digitos) {
    await act(async () => result.current._pulsarDigito(d));
  }
};

beforeEach(() => (Toast.show as jest.Mock).mockClear());

describe('useLoginController', () => {
  it('con el usuario vacío no avanza y muestra el error', async () => {
    const { result } = await montar();
    await act(async () => result.current._continuar());
    expect(result.current.paso).toBe('usuario');
    expect(result.current.error).toBe(mensajesSesion.usuarioVacio);
    await act(async () => result.current._cambiarUsuario('ana'));
    expect(result.current.error).toBeNull();
    await act(async () => result.current._continuar());
    expect(result.current.paso).toBe('pin');
  });

  it('el teclado llena hasta 4, borra y vuelve al usuario vaciando el PIN', async () => {
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      iniciarSesion: jest.fn(() => new Promise(() => {})),
    };
    const { result } = await montar(crearDependenciasDePrueba({ repo }));
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '12');
    await act(async () => result.current._borrar());
    expect(result.current.pin).toBe('1');
    await act(async () => result.current._confirmar());
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
    await act(async () => result.current._volverAlUsuario());
    expect(result.current).toMatchObject({
      paso: 'usuario',
      pin: '',
      usuario: 'ana',
    });
  });

  it('al 4.º dígito envía una sola vez y bloquea el teclado mientras espera', async () => {
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      iniciarSesion: jest.fn(() => new Promise(() => {})),
    };
    const { result } = await montar(crearDependenciasDePrueba({ repo }));
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '1234');
    expect(result.current.cargando).toBe(true);
    await pulsar(result, '5');
    await act(async () => result.current._confirmar());
    await act(async () => result.current._borrar());
    await act(async () => result.current._volverAlUsuario());
    expect(repo.iniciarSesion).toHaveBeenCalledTimes(1);
    expect(result.current.paso).toBe('pin');
  });

  it('con credenciales malas muestra el error, vacía el PIN y sigue en el paso 2', async () => {
    const { result, dependencias } = await montar();
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '0000');
    expect(result.current).toMatchObject({
      paso: 'pin',
      pin: '',
      cargando: false,
      error: 'Usuario o PIN incorrecto',
    });
    expect(dependencias.sesionActiva.obtener().tipo).not.toBe('autenticado');
  });

  it('con el PIN correcto entra (Confirmar también envía)', async () => {
    const { result, dependencias } = await montar();
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '1234');
    expect(dependencias.sesionActiva.obtener().tipo).toBe('autenticado');
    expect(result.current.pin).toBe('');
  });

  // Tester (F1-03): errores del login (CA4) y PIN fuera del estado (CA6).
  it.each([
    ['429', 'Demasiados intentos. Intenta de nuevo en 15 minutos.', 429],
    ['sin red', textosComunes.errores.red, 0],
    ['tiempo agotado', textosComunes.errores.tiempoAgotado, 0],
  ])(
    '%s: muestra el mensaje, vacía el PIN y sigue en el paso 2',
    async (_caso, msg, code) => {
      const repo: SesionRepository = {
        ...crearMemoriaSesionRepository(),
        iniciarSesion: jest.fn(() =>
          Promise.resolve(respuestaError(msg, code)),
        ),
      };
      const { result, dependencias } = await montar(
        crearDependenciasDePrueba({ repo }),
      );
      await act(async () => result.current._cambiarUsuario('ana'));
      await act(async () => result.current._continuar());
      await pulsar(result, '1234');
      expect(result.current).toMatchObject({
        paso: 'pin',
        pin: '',
        cargando: false,
        error: msg,
      });
      expect(dependencias.sesionActiva.obtener().tipo).not.toBe('autenticado');
      // Tras el error se puede volver a intentar.
      await pulsar(result, '1');
      expect(result.current.pin).toBe('1');
      expect(result.current.error).toBeNull();
    },
  );

  it('si el almacén seguro no guarda (P9), muestra el error y no entra', async () => {
    const almacen = {
      leer: () => Promise.resolve(null),
      guardar: () => Promise.resolve(false),
      borrar: () => Promise.resolve(),
    };
    const { result, dependencias } = await montar(
      crearDependenciasDePrueba({ almacen }),
    );
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '1234');
    expect(result.current.error).toBe(mensajesSesion.noSeGuardo);
    expect(dependencias.sesionActiva.obtener().tipo).not.toBe('autenticado');
  });

  it('con el usuario solo de espacios no avanza', async () => {
    const { result } = await montar();
    await act(async () => result.current._cambiarUsuario('   '));
    await act(async () => result.current._continuar());
    expect(result.current.paso).toBe('usuario');
    expect(result.current.error).toBe(mensajesSesion.usuarioVacio);
  });

  it('Confirmar con 4 dígitos envía si el envío automático no ocurrió', async () => {
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      iniciarSesion: jest.fn(() => new Promise(() => {})),
    };
    const { result } = await montar(crearDependenciasDePrueba({ repo }));
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, '1234');
    await act(async () => result.current._confirmar());
    // El guard evita el segundo envío aunque se pulse Confirmar.
    expect(repo.iniciarSesion).toHaveBeenCalledTimes(1);
  });

  it('ignora lo que no es un dígito', async () => {
    const { result } = await montar();
    await act(async () => result.current._cambiarUsuario('ana'));
    await act(async () => result.current._continuar());
    await pulsar(result, 'a');
    expect(result.current.pin).toBe('');
  });

  it('expone el motivo vencida del 401', async () => {
    const { result } = await montar(
      crearDependenciasDePrueba({
        estadoInicial: { tipo: 'sinSesion', motivo: 'vencida' },
      }),
    );
    expect(result.current.motivoAviso).toBe('vencida');
  });

  it.each([
    [true, 0],
    [false, 1],
  ])(
    'la ayuda abre WhatsApp (abierto=%p → %p toasts de error)',
    async (abierto, toasts) => {
      const enlaces = { abrir: jest.fn(() => Promise.resolve(abierto)) };
      const { result } = await montar(crearDependenciasDePrueba({ enlaces }));
      await act(() => result.current._abrirAyudaPin());
      expect(enlaces.abrir).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/wa\.me\/573205571518\?text=/),
      );
      expect(Toast.show).toHaveBeenCalledTimes(toasts);
    },
  );
});
