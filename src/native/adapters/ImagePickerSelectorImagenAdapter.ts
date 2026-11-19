import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type ImageLibraryOptions,
} from 'react-native-image-picker';

import type {
  OrigenImagen,
  ResultadoImagen,
  SelectorImagenPort,
} from '@/native/ports/SelectorImagenPort';

/** Lado mayor y calidad con los que se reduce la foto antes de enviarla (Leap admite ~2 MB). */
export const LADO_MAXIMO_IMAGEN = 1280;
export const CALIDAD_IMAGEN = 0.7;

const OPCIONES: ImageLibraryOptions = {
  mediaType: 'photo',
  selectionLimit: 1,
  includeBase64: true,
  maxWidth: LADO_MAXIMO_IMAGEN,
  maxHeight: LADO_MAXIMO_IMAGEN,
  quality: CALIDAD_IMAGEN,
};

function resultadoDe(r: ImagePickerResponse): ResultadoImagen {
  if (r.didCancel) {
    return { tipo: 'cancelado' };
  }
  if (r.errorCode) {
    return {
      tipo: 'error',
      msg:
        r.errorCode === 'permission'
          ? 'Falta el permiso para usar la cámara o las fotos.'
          : r.errorMessage ?? 'No se pudo abrir la foto.',
    };
  }
  const foto = r.assets?.[0];
  if (!foto?.base64) {
    return { tipo: 'error', msg: 'No se pudo leer la foto.' };
  }
  return {
    tipo: 'ok',
    dataUrl: `data:${foto.type ?? 'image/jpeg'};base64,${foto.base64}`,
  };
}

/** Adaptador de SelectorImagenPort con react-native-image-picker (galería sin permisos; cámara por intent). */
export function crearImagePickerSelectorImagenAdapter(): SelectorImagenPort {
  return {
    async elegir(origen: OrigenImagen) {
      try {
        const r = await (origen === 'camara'
          ? launchCamera(OPCIONES)
          : launchImageLibrary(OPCIONES));
        return resultadoDe(r);
      } catch {
        return { tipo: 'error', msg: 'No se pudo abrir la foto.' };
      }
    },
  };
}
