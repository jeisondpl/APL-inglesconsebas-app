// Tester (F1-03): adaptador de EnlacesPort con Linking (CA14). Nunca rechaza.
import { Linking } from 'react-native';

import { crearLinkingEnlacesAdapter } from '@/native/adapters/LinkingEnlacesAdapter';

describe('LinkingEnlacesAdapter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('abre la URL y devuelve true', async () => {
    const abrir = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(undefined as never);
    await expect(
      crearLinkingEnlacesAdapter().abrir('https://wa.me/573205571518'),
    ).resolves.toBe(true);
    expect(abrir).toHaveBeenCalledWith('https://wa.me/573205571518');
  });

  it('si openURL rechaza (no hay app), devuelve false sin lanzar', async () => {
    jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('No Activity found'));
    await expect(
      crearLinkingEnlacesAdapter().abrir('https://wa.me/1'),
    ).resolves.toBe(false);
  });

  it('no consulta canOpenURL (no hace falta <queries> en Android)', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined as never);
    const consulta = jest.spyOn(Linking, 'canOpenURL');
    await crearLinkingEnlacesAdapter().abrir('https://wa.me/1');
    expect(consulta).not.toHaveBeenCalled();
  });
});
