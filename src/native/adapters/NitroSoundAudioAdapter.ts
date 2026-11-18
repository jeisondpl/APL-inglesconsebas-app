import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Sound, {
  AudioEncoderAndroidType,
  OutputFormatAndroidType,
  type AudioSet,
} from 'react-native-nitro-sound';

import type {
  AudioPort,
  IOpcionesReproduccion,
  ResultadoGrabacion,
  ResultadoInicioGrabacion,
  ResultadoReproduccion,
} from '@/native/ports/AudioPort';

/** AAC mono a 48 kbps: una nota de 2 minutos pesa ~700 KB, bajo el tope de Leap (3 000 000 caracteres). */
const AJUSTES: AudioSet = {
  AudioChannels: 1,
  AudioSamplingRate: 22050,
  AudioEncodingBitRate: 48000,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AVFormatIDKeyIOS: 'aac',
  AVNumberOfChannelsKeyIOS: 1,
  AVSampleRateKeyIOS: 22050,
};

const MIME = 'audio/mp4';
const PREFIJO = `data:${MIME};base64,`;

const sinEsquema = (ruta: string) => ruta.replace(/^file:\/\//, '');

async function permisoDeMicrofono(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS lo pide solo al empezar a grabar (NSMicrophoneUsageDescription).
    return true;
  }
  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

const mensajeDe = (e: unknown, porDefecto: string) =>
  e instanceof Error && e.message ? e.message : porDefecto;

/** Adaptador de AudioPort con react-native-nitro-sound y react-native-blob-util (archivos de caché). */
export function crearNitroSoundAudioAdapter(): AudioPort {
  let inicioMs = 0;
  let terminarActual: (() => void) | null = null;

  const soltarReproduccion = () => {
    Sound.removePlayBackListener();
    Sound.removePlaybackEndListener();
    const t = terminarActual;
    terminarActual = null;
    t?.();
  };

  return {
    async empezarGrabacion(alProgreso): Promise<ResultadoInicioGrabacion> {
      try {
        if (!(await permisoDeMicrofono())) {
          return { tipo: 'denegado' };
        }
        await Sound.stopPlayer().catch(() => undefined);
        soltarReproduccion();
        Sound.addRecordBackListener(m => alProgreso(m.currentPosition));
        inicioMs = Date.now();
        await Sound.startRecorder(undefined, AJUSTES, false);
        return { tipo: 'ok' };
      } catch (e) {
        Sound.removeRecordBackListener();
        return {
          tipo: 'error',
          msg: mensajeDe(e, 'No se pudo empezar a grabar.'),
        };
      }
    },

    async terminarGrabacion(): Promise<ResultadoGrabacion> {
      try {
        const ruta = sinEsquema(await Sound.stopRecorder());
        Sound.removeRecordBackListener();
        const base64 = await ReactNativeBlobUtil.fs.readFile(ruta, 'base64');
        await ReactNativeBlobUtil.fs.unlink(ruta).catch(() => undefined);
        return {
          tipo: 'ok',
          dataUrl: `${PREFIJO}${base64}`,
          duracionMs: Date.now() - inicioMs,
        };
      } catch (e) {
        Sound.removeRecordBackListener();
        return {
          tipo: 'error',
          msg: mensajeDe(e, 'No se pudo guardar la nota de voz.'),
        };
      }
    },

    async cancelarGrabacion() {
      try {
        const ruta = sinEsquema(await Sound.stopRecorder());
        await ReactNativeBlobUtil.fs.unlink(ruta).catch(() => undefined);
      } catch {
        // Nada que descartar.
      }
      Sound.removeRecordBackListener();
    },

    async reproducir(
      dataUrl: string,
      { clave, alProgreso, alTerminar }: IOpcionesReproduccion,
    ): Promise<ResultadoReproduccion> {
      try {
        await Sound.stopPlayer().catch(() => undefined);
        soltarReproduccion();
        const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        const ruta = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/voz-${clave}.m4a`;
        if (!(await ReactNativeBlobUtil.fs.exists(ruta))) {
          await ReactNativeBlobUtil.fs.writeFile(ruta, base64, 'base64');
        }
        terminarActual = alTerminar;
        Sound.addPlayBackListener(m =>
          alProgreso(m.currentPosition, m.duration),
        );
        Sound.addPlaybackEndListener(() => {
          Sound.stopPlayer().catch(() => undefined);
          soltarReproduccion();
        });
        await Sound.startPlayer(ruta);
        return { tipo: 'ok' };
      } catch (e) {
        soltarReproduccion();
        return {
          tipo: 'error',
          msg: mensajeDe(e, 'No se pudo reproducir la nota de voz.'),
        };
      }
    },

    async detener() {
      await Sound.stopPlayer().catch(() => undefined);
      soltarReproduccion();
    },
  };
}
