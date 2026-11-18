// F3-01 (3.2): adaptador de AudioPort con nitro-sound y blob-util. Nunca rechaza.
import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Sound from 'react-native-nitro-sound';

import { crearNitroSoundAudioAdapter } from '@/native/adapters/NitroSoundAudioAdapter';

jest.mock('react-native-nitro-sound', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn(),
    stopRecorder: jest.fn(),
    startPlayer: jest.fn(),
    stopPlayer: jest.fn(),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
  },
  AudioEncoderAndroidType: { AAC: 3 },
  OutputFormatAndroidType: { MPEG_4: 2 },
}));
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache' },
      readFile: jest.fn(),
      writeFile: jest.fn(),
      exists: jest.fn(),
      unlink: jest.fn(),
    },
  },
}));

const sonido = Sound as unknown as Record<string, jest.Mock>;
const fs = ReactNativeBlobUtil.fs as unknown as Record<string, jest.Mock>;

function conPermiso(resultado: string) {
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(resultado as never);
}

describe('NitroSoundAudioAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sonido.stopPlayer.mockResolvedValue('');
    fs.unlink.mockResolvedValue(undefined);
    Platform.OS = 'android';
  });
  afterEach(() => jest.restoreAllMocks());

  describe('grabar', () => {
    it('sin permiso de micrófono devuelve denegado y no graba', async () => {
      conPermiso('denied');
      const r = await crearNitroSoundAudioAdapter().empezarGrabacion(jest.fn());
      expect(r).toEqual({ tipo: 'denegado' });
      expect(sonido.startRecorder).not.toHaveBeenCalled();
    });

    it('con permiso graba en AAC mono y reporta el progreso', async () => {
      conPermiso('granted');
      sonido.startRecorder.mockResolvedValue('file:///cache/sound.mp4');
      const alProgreso = jest.fn();
      const r = await crearNitroSoundAudioAdapter().empezarGrabacion(
        alProgreso,
      );
      expect(r).toEqual({ tipo: 'ok' });
      expect(sonido.startRecorder.mock.calls[0][1]).toMatchObject({
        AudioChannels: 1,
        AudioEncodingBitRate: 48000,
      });
      sonido.addRecordBackListener.mock.calls[0][0]({ currentPosition: 1500 });
      expect(alProgreso).toHaveBeenCalledWith(1500);
    });

    it('en iOS no pide el permiso desde JS', async () => {
      Platform.OS = 'ios';
      const pedir = jest.spyOn(PermissionsAndroid, 'request');
      sonido.startRecorder.mockResolvedValue('/cache/sound.m4a');
      await crearNitroSoundAudioAdapter().empezarGrabacion(jest.fn());
      expect(pedir).not.toHaveBeenCalled();
    });

    it('si no puede empezar devuelve error', async () => {
      conPermiso('granted');
      sonido.startRecorder.mockRejectedValue(new Error('Micrófono ocupado'));
      await expect(
        crearNitroSoundAudioAdapter().empezarGrabacion(jest.fn()),
      ).resolves.toEqual({ tipo: 'error', msg: 'Micrófono ocupado' });
      sonido.startRecorder.mockRejectedValue('x');
      await expect(
        crearNitroSoundAudioAdapter().empezarGrabacion(jest.fn()),
      ).resolves.toMatchObject({ tipo: 'error' });
    });

    it('al terminar lee el archivo, lo borra y lo entrega como data URL', async () => {
      conPermiso('granted');
      sonido.startRecorder.mockResolvedValue('file:///cache/sound.mp4');
      sonido.stopRecorder.mockResolvedValue('file:///cache/sound.mp4');
      fs.readFile.mockResolvedValue('QUJD');
      const audio = crearNitroSoundAudioAdapter();
      await audio.empezarGrabacion(jest.fn());
      const r = await audio.terminarGrabacion();
      expect(r).toMatchObject({
        tipo: 'ok',
        dataUrl: 'data:audio/mp4;base64,QUJD',
      });
      expect(fs.readFile).toHaveBeenCalledWith('/cache/sound.mp4', 'base64');
      expect(fs.unlink).toHaveBeenCalledWith('/cache/sound.mp4');
    });

    it('si no puede leer la grabación devuelve error', async () => {
      sonido.stopRecorder.mockRejectedValue(new Error('Sin archivo'));
      await expect(
        crearNitroSoundAudioAdapter().terminarGrabacion(),
      ).resolves.toEqual({ tipo: 'error', msg: 'Sin archivo' });
    });

    it('cancelar descarta el archivo y tolera que no haya grabación', async () => {
      sonido.stopRecorder.mockResolvedValueOnce('/cache/sound.mp4');
      const audio = crearNitroSoundAudioAdapter();
      await audio.cancelarGrabacion();
      expect(fs.unlink).toHaveBeenCalledWith('/cache/sound.mp4');
      sonido.stopRecorder.mockRejectedValueOnce(new Error('nada'));
      await expect(audio.cancelarGrabacion()).resolves.toBeUndefined();
    });
  });

  describe('reproducir', () => {
    const opciones = () => ({
      clave: '7',
      alProgreso: jest.fn(),
      alTerminar: jest.fn(),
    });

    it('escribe la nota en caché una sola vez y la reproduce con progreso', async () => {
      fs.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const audio = crearNitroSoundAudioAdapter();
      const o = opciones();
      await expect(
        audio.reproducir('data:audio/mp4;base64,QUJD', o),
      ).resolves.toEqual({ tipo: 'ok' });
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/cache/voz-7.m4a',
        'QUJD',
        'base64',
      );
      expect(sonido.startPlayer).toHaveBeenCalledWith('/cache/voz-7.m4a');
      sonido.addPlayBackListener.mock.calls[0][0]({
        currentPosition: 500,
        duration: 2000,
      });
      expect(o.alProgreso).toHaveBeenCalledWith(500, 2000);
      await audio.reproducir('data:audio/mp4;base64,QUJD', opciones());
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('al terminar la nota avisa y suelta los oyentes', async () => {
      fs.exists.mockResolvedValue(true);
      const o = opciones();
      await crearNitroSoundAudioAdapter().reproducir(
        'data:audio/mp4;base64,QUJD',
        o,
      );
      sonido.addPlaybackEndListener.mock.calls[0][0]({});
      expect(o.alTerminar).toHaveBeenCalledTimes(1);
      expect(sonido.removePlayBackListener).toHaveBeenCalled();
    });

    it('al empezar otra nota, la anterior se da por terminada', async () => {
      fs.exists.mockResolvedValue(true);
      const audio = crearNitroSoundAudioAdapter();
      const primera = opciones();
      await audio.reproducir('data:audio/mp4;base64,QUJD', primera);
      await audio.reproducir('data:audio/mp4;base64,QUJD', opciones());
      expect(primera.alTerminar).toHaveBeenCalledTimes(1);
    });

    it('detener para y avisa; un fallo al reproducir devuelve error', async () => {
      fs.exists.mockResolvedValue(true);
      const audio = crearNitroSoundAudioAdapter();
      const o = opciones();
      await audio.reproducir('data:audio/mp4;base64,QUJD', o);
      await audio.detener();
      expect(o.alTerminar).toHaveBeenCalledTimes(1);
      sonido.startPlayer.mockRejectedValueOnce(new Error('Códec no soportado'));
      await expect(
        audio.reproducir('data:audio/mp4;base64,QUJD', opciones()),
      ).resolves.toEqual({ tipo: 'error', msg: 'Códec no soportado' });
    });
  });
});
