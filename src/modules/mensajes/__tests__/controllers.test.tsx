// F3-01: controllers del chat probados sin pantalla (ramas que la UI no alcanza).
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  INTERVALO_BANDEJA_MS,
  useBandejaController,
} from '@/modules/mensajes/aplications/controllers/Bandeja.controller';
import {
  INTERVALO_SONDEO_HILO_MS,
  useHiloController,
} from '@/modules/mensajes/aplications/controllers/Hilo.controller';
import type { IResponseMensaje } from '@/modules/mensajes/domain/entities/Mensajes.entities';
import type { MensajesRepository } from '@/modules/mensajes/domain/models/MensajesRepository';
import { textoDeError } from '@/modules/mensajes/domain/validations/mensajes.validations';
import { crearMemoriaMensajesRepository } from '@/modules/mensajes/infrastructure/memoriaMensajesRepository';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

const msg = (m: Partial<IResponseMensaje>): IResponseMensaje => ({
  id: 1,
  idEstudiante: 'e1',
  remitente: 'teacher',
  nombre: 'Meli',
  texto: 'Hola',
  tieneImagen: false,
  tieneVoz: false,
  leido: false,
  editado: false,
  reacciones: {},
  creado: '2026-11-17 09:30:00',
  mio: false,
  ...m,
});

const envoltorio = (repo: MensajesRepository) => {
  const dependencias = crearDependenciasDePrueba({ mensajes: repo });
  return ({ children }: { children: ReactNode }) => (
    <DependenciasProvider valor={dependencias}>{children}</DependenciasProvider>
  );
};

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

const montarHilo = (
  repo: MensajesRepository,
  opciones: Partial<Parameters<typeof useHiloController>[0]> = {},
) =>
  renderHook(
    () =>
      useHiloController({ idEstudiante: 'e1', rol: 'estudiante', ...opciones }),
    { wrapper: envoltorio(repo) },
  );

describe('textoDeError', () => {
  it('usa el mensaje o el genérico', () => {
    expect(textoDeError('Sin red')).toBe('Sin red');
    expect(textoDeError()).toBeTruthy();
  });
});

describe('useHiloController', () => {
  it('no envía una caja vacía ni reacciona sin mensaje elegido', async () => {
    const repo = crearMemoriaMensajesRepository([msg({ id: 1 })]);
    const enviar = jest.spyOn(repo, 'enviar');
    const reaccionar = jest.spyOn(repo, 'reaccionar');
    const { result } = await montarHilo(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._enviar());
    await act(async () => result.current._reaccionar('👍'));
    await act(async () => result.current._reintentar(99));
    await act(async () => result.current._abrirReacciones(-1));
    expect(enviar).not.toHaveBeenCalled();
    expect(reaccionar).not.toHaveBeenCalled();
    expect(result.current.seleccion).toBeNull();
  });

  it('con activo false no sondea', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const { result } = await montarHilo(crearMemoriaMensajesRepository(), {
      activo: false,
    });
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(
      intervalo.mock.calls.some(([, ms]) => ms === INTERVALO_SONDEO_HILO_MS),
    ).toBe(false);
  });

  it('al marcar leído solo cambian los mensajes del otro lado', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, mio: false, leido: false }),
      msg({ id: 2, mio: true, leido: false, remitente: 'student' }),
    ]);
    const { result } = await montarHilo(repo);
    await waitFor(() =>
      expect(result.current.mensajes.find(m => m.id === 1)?.leido).toBe(true),
    );
    expect(result.current.mensajes.find(m => m.id === 2)?.leido).toBe(false);
  });

  it('con dos envíos a la vez, el que falla no toca al que sigue pendiente (y el profe escribe como teacher)', async () => {
    const repo = crearMemoriaMensajesRepository([], { rol: 'teacher' });
    let soltar: () => void = () => undefined;
    jest
      .spyOn(repo, 'enviar')
      .mockImplementationOnce(
        () =>
          new Promise(resolver => {
            soltar = () => resolver(respuestaOk(msg({ id: 1, mio: true })));
          }),
      )
      .mockResolvedValueOnce(respuestaError('Sin conexión', 0));
    const { result } = await montarHilo(repo, { rol: 'profe' });
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._cambiarTexto('uno'));
    await act(async () => {
      result.current._enviar();
    });
    await act(async () => result.current._cambiarTexto('dos'));
    await act(async () => result.current._enviar());
    expect(result.current.mensajes.map(m => [m.texto, m.envio])).toEqual([
      ['uno', 'enviando'],
      ['dos', 'fallido'],
    ]);
    expect(result.current.mensajes[0].remitente).toBe('teacher');
    await act(async () => soltar());
    // «uno» ya está en el servidor; «dos» sigue en pantalla como fallido, al final.
    expect(result.current.mensajes.map(m => [m.texto, m.envio])).toEqual([
      ['Hola', 'enviado'],
      ['dos', 'fallido'],
    ]);
  });

  it('al desmontar con una reacción a mitad no se actualiza nada', async () => {
    const repo = crearMemoriaMensajesRepository([msg({ id: 1 })]);
    let soltar: () => void = () => undefined;
    jest.spyOn(repo, 'reaccionar').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaError('No', 500));
        }),
    );
    const { result, unmount } = await montarHilo(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._abrirReacciones(1));
    await act(async () => {
      result.current._reaccionar('👍');
    });
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('useBandejaController', () => {
  const bandeja = (noLeidos: number) =>
    respuestaOk({ conversaciones: [], noLeidos });

  it('con los valores por defecto carga y sondea cada 10 s', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const repo = crearMemoriaMensajesRepository([], { rol: 'teacher' });
    const { result } = await renderHook(() => useBandejaController(), {
      wrapper: envoltorio(repo),
    });
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(
      intervalo.mock.calls.some(([, ms]) => ms === INTERVALO_BANDEJA_MS),
    ).toBe(true);
  });

  it('con activo false no sondea y un refresco con éxito deja de refrescar', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    const repo = crearMemoriaMensajesRepository([], { rol: 'teacher' });
    jest.spyOn(repo, 'bandeja').mockResolvedValue(bandeja(3));
    const avisar = jest.fn();
    const { result } = await renderHook(
      () => useBandejaController({ activo: false, alCambiarNoLeidos: avisar }),
      { wrapper: envoltorio(repo) },
    );
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(avisar).toHaveBeenCalledWith(3);
    await act(async () => result.current._refrescar());
    expect(result.current.refrescando).toBe(false);
    expect(
      intervalo.mock.calls.some(([, ms]) => ms === INTERVALO_BANDEJA_MS),
    ).toBe(false);
  });
});
