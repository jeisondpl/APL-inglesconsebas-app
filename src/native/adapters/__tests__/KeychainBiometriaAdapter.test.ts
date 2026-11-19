// F1-03b (1.13): desbloqueo biométrico con react-native-keychain. Nunca rechaza.
import * as Keychain from 'react-native-keychain';

import { crearKeychainBiometriaAdapter } from '@/native/adapters/KeychainBiometriaAdapter';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'Unlocked' },
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BioOrPass' },
  getSupportedBiometryType: jest.fn(),
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const k = Keychain as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  [
    'getSupportedBiometryType',
    'setGenericPassword',
    'getGenericPassword',
    'resetGenericPassword',
  ].forEach(n => k[n].mockReset());
});

describe('KeychainBiometriaAdapter', () => {
  it('disponible según el tipo de biometría del equipo; un fallo es «no»', async () => {
    const a = crearKeychainBiometriaAdapter();
    k.getSupportedBiometryType.mockResolvedValueOnce('Fingerprint');
    await expect(a.disponible()).resolves.toBe(true);
    k.getSupportedBiometryType.mockResolvedValueOnce(null);
    await expect(a.disponible()).resolves.toBe(false);
    k.getSupportedBiometryType.mockRejectedValueOnce(new Error('x'));
    await expect(a.disponible()).resolves.toBe(false);
  });

  it('activar guarda el marcador protegido y comprueba la verificación', async () => {
    k.getSupportedBiometryType.mockResolvedValue('Fingerprint');
    k.setGenericPassword.mockResolvedValue({ service: 's' });
    k.getGenericPassword.mockResolvedValue({ password: '1' });
    await expect(crearKeychainBiometriaAdapter().activar()).resolves.toEqual({
      tipo: 'ok',
    });
    expect(k.setGenericPassword.mock.calls[0][2]).toMatchObject({
      service: 'com.inglesconsebas.app.biometria',
      accessControl: 'BioOrPass',
    });
    expect(
      k.getGenericPassword.mock.calls[0][0].authenticationPrompt,
    ).toBeTruthy();
  });

  it('activar sin biometría, o si falla guardar o verificar, no se activa', async () => {
    const a = crearKeychainBiometriaAdapter();
    k.getSupportedBiometryType.mockResolvedValueOnce(null);
    await expect(a.activar()).resolves.toEqual({ tipo: 'no_disponible' });
    k.getSupportedBiometryType.mockResolvedValue('Fingerprint');
    k.setGenericPassword.mockResolvedValueOnce(false);
    await expect(a.activar()).resolves.toEqual({ tipo: 'cancelado' });
    k.setGenericPassword.mockRejectedValueOnce(new Error('x'));
    await expect(a.activar()).resolves.toEqual({ tipo: 'cancelado' });
    k.setGenericPassword.mockResolvedValueOnce({ service: 's' });
    k.getGenericPassword.mockResolvedValueOnce(false);
    await expect(a.activar()).resolves.toEqual({ tipo: 'cancelado' });
  });

  it('autenticar: ok si lee el marcador; cancelado si no o si cancelan', async () => {
    const a = crearKeychainBiometriaAdapter();
    k.getGenericPassword.mockResolvedValueOnce({ password: '1' });
    await expect(a.autenticar()).resolves.toEqual({ tipo: 'ok' });
    k.getGenericPassword.mockResolvedValueOnce(false);
    await expect(a.autenticar()).resolves.toEqual({ tipo: 'cancelado' });
    k.getGenericPassword.mockRejectedValueOnce(new Error('cancel'));
    await expect(a.autenticar()).resolves.toEqual({ tipo: 'cancelado' });
  });

  it('desactivar borra el marcador y no rechaza si falla', async () => {
    const a = crearKeychainBiometriaAdapter();
    await a.desactivar();
    expect(k.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.inglesconsebas.app.biometria',
    });
    k.resetGenericPassword.mockRejectedValueOnce(new Error('x'));
    await expect(a.desactivar()).resolves.toBeUndefined();
  });
});
