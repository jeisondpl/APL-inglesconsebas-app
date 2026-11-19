// F2-03 (2.7–2.9): registro del dispositivo push y destino de los avisos que se tocan.
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { useNotificaciones } from '@/modules/notificaciones/aplications/controllers/Notificaciones.controller';
import { registrarDispositivoUseCase } from '@/modules/notificaciones/aplications/registrar/registrar';
import { destinoDeAviso } from '@/modules/notificaciones/domain/notificaciones.reglas';
import { crearApiNotificacionesRepository } from '@/modules/notificaciones/infrastructure/apiNotificacionesRepository';
import { crearMemoriaNotificacionesRepository } from '@/modules/notificaciones/infrastructure/memoriaNotificacionesRepository';
import type { IAvisoAbierto, PushPort } from '@/native/ports/PushPort';
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

function pushFalso(r: Awaited<ReturnType<PushPort['registrar']>>) {
  const oyentes: {
    token?: (t: string, p: 'android' | 'ios') => void;
    aviso?: (a: IAvisoAbierto) => void;
  } = {};
  const dejarToken = jest.fn();
  const dejarAviso = jest.fn();
  const push: PushPort = {
    registrar: jest.fn().mockResolvedValue(r),
    alRenovarToken: jest.fn(escuchar => {
      oyentes.token = escuchar;
      return dejarToken;
    }),
    alAbrirAviso: jest.fn(escuchar => {
      oyentes.aviso = escuchar;
      return dejarAviso;
    }),
  };
  return { push, oyentes, dejarToken, dejarAviso };
}

describe('destinoDeAviso', () => {
  it.each([
    ['clase_recordatorio', 'clases'],
    ['clase_reagendada', 'clases'],
    ['clase_sustitucion', 'clases'],
    ['mensaje_nuevo', 'mensajes'],
    ['tarea_nueva', 'tareas'],
    ['feedback_nuevo', null],
    ['', null],
  ])('«%s» lleva a %s', (tipo, esperado) => {
    expect(destinoDeAviso(tipo)).toBe(esperado);
  });
});

describe('registrarDispositivoUseCase', () => {
  it('con permiso y token lo registra en Leap', async () => {
    const repo = crearMemoriaNotificacionesRepository();
    const { push } = pushFalso({ tipo: 'ok', token: 'T1', plataforma: 'ios' });
    await expect(registrarDispositivoUseCase(push, repo)).resolves.toBe(
      'registrado',
    );
    expect(repo.registrados).toEqual([{ token: 'T1', plataforma: 'ios' }]);
  });

  it.each(['denegado', 'no_disponible'] as const)(
    'si el push responde «%s» no llama a Leap',
    async tipo => {
      const repo = crearMemoriaNotificacionesRepository();
      const { push } = pushFalso({ tipo });
      await expect(registrarDispositivoUseCase(push, repo)).resolves.toBe(tipo);
      expect(repo.registrados).toEqual([]);
    },
  );

  it('si Leap falla devuelve «error» sin lanzar', async () => {
    const repo = crearMemoriaNotificacionesRepository({ msg: 'sin red' });
    const { push } = pushFalso({
      tipo: 'ok',
      token: 'T1',
      plataforma: 'android',
    });
    await expect(registrarDispositivoUseCase(push, repo)).resolves.toBe(
      'error',
    );
  });
});

describe('apiNotificacionesRepository', () => {
  it('manda `devices` register con el token, la plataforma y la etiqueta', async () => {
    const post = jest.fn().mockResolvedValue(respuestaOk({ ok: true }));
    const api = { get: jest.fn(), post } as unknown as ClienteApi;
    const r = await crearApiNotificacionesRepository(api, {
      etiquetaDispositivo: 'Moto g77 · Android 15',
    }).registrarDispositivo({ token: 'T1', plataforma: 'android' });
    expect(r.error).toBe(false);
    expect(post).toHaveBeenCalledWith(
      'api.php',
      {
        action: 'register',
        pushToken: 'T1',
        platform: 'android',
        provider: 'fcm',
        deviceLabel: 'Moto g77 · Android 15',
      },
      { endpoint: 'devices' },
    );
  });

  it('un error de Leap vuelve como error con su mensaje', async () => {
    const api = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue(respuestaError('caído', 500)),
    } as unknown as ClienteApi;
    const r = await crearApiNotificacionesRepository(api, {
      etiquetaDispositivo: 'x',
    }).registrarDispositivo({ token: 'T1', plataforma: 'android' });
    expect(r).toMatchObject({ error: true, msg: 'caído', code: 500 });
  });
});

describe('useNotificaciones', () => {
  function Sonda({ irA }: { irA: (d: string) => void }) {
    useNotificaciones(irA);
    return <Text>listo</Text>;
  }

  async function montar(irA: (d: string) => void, push: PushPort) {
    const notificaciones = crearMemoriaNotificacionesRepository();
    const dependencias = crearDependenciasDePrueba({ push, notificaciones });
    const r = await render(
      <DependenciasProvider valor={dependencias}>
        <Sonda irA={irA} />
      </DependenciasProvider>,
    );
    await screen.findByText('listo');
    return { notificaciones, ...r };
  }

  it('registra el dispositivo al montarse', async () => {
    const { push } = pushFalso({
      tipo: 'ok',
      token: 'T1',
      plataforma: 'android',
    });
    const { notificaciones } = await montar(jest.fn(), push);
    await waitFor(() =>
      expect(notificaciones.registrados).toEqual([
        { token: 'T1', plataforma: 'android' },
      ]),
    );
  });

  it('un token rotado se vuelve a registrar', async () => {
    const f = pushFalso({ tipo: 'ok', token: 'T1', plataforma: 'android' });
    const { notificaciones } = await montar(jest.fn(), f.push);
    await waitFor(() => expect(notificaciones.registrados).toHaveLength(1));
    f.oyentes.token?.('T2', 'android');
    await waitFor(() =>
      expect(notificaciones.registrados[1]).toEqual({
        token: 'T2',
        plataforma: 'android',
      }),
    );
  });

  it('tocar un aviso de clase lleva a Clases; uno desconocido no mueve nada', async () => {
    const irA = jest.fn();
    const f = pushFalso({ tipo: 'no_disponible' });
    await montar(irA, f.push);
    f.oyentes.aviso?.({ tipo: 'clase_recordatorio', id: 7 });
    f.oyentes.aviso?.({ tipo: 'algo_futuro', id: null });
    expect(irA).toHaveBeenCalledTimes(1);
    expect(irA).toHaveBeenCalledWith('clases');
  });

  it('al desmontar deja de escuchar', async () => {
    const f = pushFalso({ tipo: 'no_disponible' });
    const { unmount } = await montar(jest.fn(), f.push);
    await unmount();
    expect(f.dejarToken).toHaveBeenCalled();
    expect(f.dejarAviso).toHaveBeenCalled();
  });
});
