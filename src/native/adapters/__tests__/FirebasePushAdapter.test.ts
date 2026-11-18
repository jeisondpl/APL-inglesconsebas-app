// F2-03: adaptador de PushPort con @react-native-firebase/messaging. Nunca rechaza.
import {
  getInitialNotification,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import {
  avisoDe,
  crearFirebasePushAdapter,
} from '@/native/adapters/FirebasePushAdapter';

const pedirPermisoIos = requestPermission as jest.Mock;
const token = getToken as jest.Mock;
const refrescar = onTokenRefresh as jest.Mock;
const abierta = onNotificationOpenedApp as jest.Mock;
const inicial = getInitialNotification as jest.Mock;

function plataforma(os: 'android' | 'ios', version: number | string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  Object.defineProperty(Platform, 'Version', {
    value: version,
    configurable: true,
  });
}

describe('avisoDe', () => {
  it('lee tipo e id (texto) del data del push', () => {
    expect(avisoDe({ data: { tipo: 'clase_reagendada', id: '12' } })).toEqual({
      tipo: 'clase_reagendada',
      id: 12,
    });
  });
  it('sin id válido, id nulo; sin tipo, ningún aviso', () => {
    expect(avisoDe({ data: { tipo: 'x', id: 'abc' } })).toEqual({
      tipo: 'x',
      id: null,
    });
    expect(avisoDe({ data: {} })).toBeNull();
    expect(avisoDe(null)).toBeNull();
  });
});

describe('FirebasePushAdapter.registrar', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    token.mockReset();
    pedirPermisoIos.mockReset();
    plataforma('android', 34);
  });

  it('Android 13+: pide POST_NOTIFICATIONS y devuelve el token', async () => {
    const pedir = jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue('granted');
    token.mockResolvedValueOnce('TOKEN');
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'ok',
      token: 'TOKEN',
      plataforma: 'android',
    });
    expect(pedir).toHaveBeenCalledWith('android.permission.POST_NOTIFICATIONS');
  });

  it('Android 13+: permiso negado → denegado, sin pedir token', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('denied');
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'denegado',
    });
    expect(token).not.toHaveBeenCalled();
  });

  it('Android 12 o menos: no pide permiso', async () => {
    plataforma('android', 31);
    const pedir = jest.spyOn(PermissionsAndroid, 'request');
    token.mockResolvedValueOnce('T');
    await crearFirebasePushAdapter().registrar();
    expect(pedir).not.toHaveBeenCalled();
  });

  it('iOS: pide permiso por Firebase', async () => {
    plataforma('ios', '18.0');
    pedirPermisoIos.mockResolvedValueOnce(1);
    token.mockResolvedValueOnce('TI');
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'ok',
      token: 'TI',
      plataforma: 'ios',
    });
    pedirPermisoIos.mockResolvedValueOnce(0);
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'denegado',
    });
  });

  it('sin Firebase (lanza) o sin token → no_disponible', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
    token.mockRejectedValueOnce(new Error('No Firebase App'));
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'no_disponible',
    });
    token.mockResolvedValueOnce('');
    await expect(crearFirebasePushAdapter().registrar()).resolves.toEqual({
      tipo: 'no_disponible',
    });
  });
});

describe('FirebasePushAdapter · escuchas', () => {
  beforeEach(() => {
    refrescar.mockClear();
    abierta.mockClear();
    inicial.mockClear();
    plataforma('android', 34);
  });

  it('alRenovarToken entrega el token y la plataforma', () => {
    const escuchar = jest.fn();
    crearFirebasePushAdapter().alRenovarToken(escuchar);
    refrescar.mock.calls[0][1]('NUEVO');
    expect(escuchar).toHaveBeenCalledWith('NUEVO', 'android');
  });

  it('alAbrirAviso entrega el que abrió la app y los que se tocan después', async () => {
    const escuchar = jest.fn();
    inicial.mockResolvedValueOnce({
      data: { tipo: 'clase_recordatorio', id: '3' },
    });
    crearFirebasePushAdapter().alAbrirAviso(escuchar);
    await Promise.resolve();
    await Promise.resolve();
    abierta.mock.calls[0][1]({ data: { tipo: 'mensaje_nuevo' } });
    abierta.mock.calls[0][1]({ data: {} });
    expect(escuchar.mock.calls).toEqual([
      [{ tipo: 'clase_recordatorio', id: 3 }],
      [{ tipo: 'mensaje_nuevo', id: null }],
    ]);
  });

  it('si Firebase lanza, las escuchas son inofensivas', () => {
    refrescar.mockImplementationOnce(() => {
      throw new Error('x');
    });
    inicial.mockImplementationOnce(() => {
      throw new Error('x');
    });
    const a = crearFirebasePushAdapter();
    expect(() => a.alRenovarToken(jest.fn())()).not.toThrow();
    expect(() => a.alAbrirAviso(jest.fn())()).not.toThrow();
  });
});
