// CA9: BootSplashAdapter envuelve BootSplash.hide({ fade }) y nunca lanza ni rechaza.
import BootSplash from 'react-native-bootsplash';

import { crearDependencias } from '@/app/di';
import { crearBootSplashAdapter } from '@/native/adapters/BootSplashAdapter';

const hide = BootSplash.hide as jest.Mock;

beforeEach(() => {
  hide.mockReset();
  hide.mockResolvedValue(undefined);
});

describe('BootSplashAdapter (CA9)', () => {
  it.each([
    [{ fundido: true }, true],
    [{ fundido: false }, false],
    [{}, false],
    [undefined, false],
  ])('ocultar(%p) llama a hide con fade %p', async (opciones, fade) => {
    await crearBootSplashAdapter().ocultar(opciones);
    expect(hide).toHaveBeenCalledTimes(1);
    expect(hide).toHaveBeenCalledWith({ fade });
  });

  it('si hide rechaza, ocultar resuelve sin error', async () => {
    hide.mockRejectedValue(new Error('Módulo nativo no disponible'));
    await expect(
      crearBootSplashAdapter().ocultar({ fundido: true }),
    ).resolves.toBeUndefined();
  });

  it('si hide lanza de forma síncrona, ocultar resuelve sin error', async () => {
    hide.mockImplementation(() => {
      throw new Error('RNBootSplash is null');
    });
    await expect(crearBootSplashAdapter().ocultar()).resolves.toBeUndefined();
  });

  it('el contenedor real registra el adaptador como nativos.splash', async () => {
    const { nativos } = crearDependencias();
    await nativos.splash.ocultar({ fundido: true });
    expect(hide).toHaveBeenCalledWith({ fade: true });
  });
});
