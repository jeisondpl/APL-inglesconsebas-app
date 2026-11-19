// F3-01 (3.3): adaptador de SelectorImagenPort con react-native-image-picker. Nunca rechaza.
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { crearImagePickerSelectorImagenAdapter } from '@/native/adapters/ImagePickerSelectorImagenAdapter';

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

const galeria = launchImageLibrary as jest.Mock;
const camara = launchCamera as jest.Mock;

describe('ImagePickerSelectorImagenAdapter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('galería: devuelve la foto como data URL y pide reducirla', async () => {
    galeria.mockResolvedValueOnce({
      assets: [{ base64: 'QUJD', type: 'image/png' }],
    });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toEqual({ tipo: 'ok', dataUrl: 'data:image/png;base64,QUJD' });
    expect(galeria.mock.calls[0][0]).toMatchObject({
      includeBase64: true,
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.7,
    });
  });

  it('cámara: usa launchCamera y asume jpeg si no hay tipo', async () => {
    camara.mockResolvedValueOnce({ assets: [{ base64: 'QUJD' }] });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('camara'),
    ).resolves.toEqual({ tipo: 'ok', dataUrl: 'data:image/jpeg;base64,QUJD' });
    expect(galeria).not.toHaveBeenCalled();
  });

  it('cancelar no es un error', async () => {
    galeria.mockResolvedValueOnce({ didCancel: true });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toEqual({ tipo: 'cancelado' });
  });

  it('un error del selector vuelve como error con mensaje', async () => {
    camara.mockResolvedValueOnce({ errorCode: 'permission' });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('camara'),
    ).resolves.toMatchObject({ tipo: 'error' });
    galeria.mockResolvedValueOnce({
      errorCode: 'others',
      errorMessage: 'Falló',
    });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toEqual({ tipo: 'error', msg: 'Falló' });
    galeria.mockResolvedValueOnce({ errorCode: 'others' });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toMatchObject({ tipo: 'error' });
  });

  it('sin base64 o con rechazo, devuelve error sin lanzar', async () => {
    galeria.mockResolvedValueOnce({ assets: [{}] });
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toMatchObject({ tipo: 'error' });
    galeria.mockRejectedValueOnce(new Error('boom'));
    await expect(
      crearImagePickerSelectorImagenAdapter().elegir('galeria'),
    ).resolves.toMatchObject({ tipo: 'error' });
  });
});
