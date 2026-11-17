// Tester (F1-03): adaptador de SecureStoragePort con react-native-keychain (mock de jest.setup).
// CA6: el token va al almacén cifrado, con un servicio por clave, y el adaptador nunca lanza.
import * as Keychain from 'react-native-keychain';

import { crearKeychainSecureStorageAdapter } from '@/native/adapters/KeychainSecureStorageAdapter';

const mock = Keychain as unknown as Record<
  'setGenericPassword' | 'getGenericPassword' | 'resetGenericPassword',
  jest.Mock
>;

describe('KeychainSecureStorageAdapter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('guarda, lee y borra con el servicio com.inglesconsebas.app.<clave>', async () => {
    const almacen = crearKeychainSecureStorageAdapter();
    await expect(almacen.guardar('sesion', '{"a":1}')).resolves.toBe(true);
    expect(mock.setGenericPassword).toHaveBeenCalledWith('app', '{"a":1}', {
      service: 'com.inglesconsebas.app.sesion',
      accessible: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    });
    await expect(almacen.leer('sesion')).resolves.toBe('{"a":1}');
    expect(mock.getGenericPassword).toHaveBeenCalledWith({
      service: 'com.inglesconsebas.app.sesion',
    });
    await almacen.borrar('sesion');
    expect(mock.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.inglesconsebas.app.sesion',
    });
    await expect(almacen.leer('sesion')).resolves.toBeNull();
  });

  it('no usa accessControl (la biometría es el ítem 1.13)', async () => {
    await crearKeychainSecureStorageAdapter().guardar('x', 'y');
    const opciones = mock.setGenericPassword.mock.calls[0][2];
    expect(opciones).not.toHaveProperty('accessControl');
  });

  it('claves distintas no se pisan', async () => {
    const almacen = crearKeychainSecureStorageAdapter();
    await almacen.guardar('uno', '1');
    await almacen.guardar('dos', '2');
    await expect(almacen.leer('uno')).resolves.toBe('1');
    await expect(almacen.leer('dos')).resolves.toBe('2');
  });

  it('sin valor guardado, leer devuelve null', async () => {
    await expect(
      crearKeychainSecureStorageAdapter().leer('inexistente'),
    ).resolves.toBeNull();
  });

  it('si el módulo nativo rechaza: leer → null, guardar → false, borrar no lanza', async () => {
    const almacen = crearKeychainSecureStorageAdapter();
    mock.getGenericPassword.mockRejectedValueOnce(new Error('keystore'));
    mock.setGenericPassword.mockRejectedValueOnce(new Error('keystore'));
    mock.resetGenericPassword.mockRejectedValueOnce(new Error('keystore'));
    await expect(almacen.leer('sesion')).resolves.toBeNull();
    await expect(almacen.guardar('sesion', 'v')).resolves.toBe(false);
    await expect(almacen.borrar('sesion')).resolves.toBeUndefined();
  });

  it('si setGenericPassword devuelve false, guardar devuelve false', async () => {
    mock.setGenericPassword.mockResolvedValueOnce(false);
    await expect(
      crearKeychainSecureStorageAdapter().guardar('sesion', 'v'),
    ).resolves.toBe(false);
  });
});
