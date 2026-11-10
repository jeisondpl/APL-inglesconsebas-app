// CA10: notify.* llama a la librería de toasts con el tipo correcto y fromError saca un mensaje
// legible de un HttpResponse, un Error o un valor desconocido.
import Toast from 'react-native-toast-message';

import { respuestaError } from '../HttpResponse';
import { notify } from '../notify';
import { textosComunes } from '../textos';

const show = Toast.show as jest.Mock;

beforeEach(() => show.mockClear());

describe('notify (CA10)', () => {
  it.each(['success', 'error', 'warning', 'info'] as const)(
    'notify.%s muestra un toast de ese tipo con título y detalle',
    tipo => {
      notify[tipo]('Título', 'Detalle');
      expect(show).toHaveBeenCalledTimes(1);
      expect(show).toHaveBeenCalledWith({
        type: tipo,
        text1: 'Título',
        text2: 'Detalle',
      });
    },
  );

  it('el detalle es opcional', () => {
    notify.info('Solo título');
    expect(show).toHaveBeenCalledWith({
      type: 'info',
      text1: 'Solo título',
      text2: undefined,
    });
  });
});

describe('notify.fromError (CA10)', () => {
  it('con un HttpResponse muestra su msg como detalle de un toast de error', () => {
    notify.fromError(respuestaError('Sin cupo en la clase', 409), 'No se pudo');
    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'No se pudo',
      text2: 'Sin cupo en la clase',
    });
  });

  it('con un Error muestra su message', () => {
    notify.fromError(new Error('Falló algo'), 'Error');
    expect(show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Error',
      text2: 'Falló algo',
    });
  });

  it.each([undefined, null, 42, { raro: true }])(
    'con un valor desconocido (%p) usa el mensaje genérico',
    valor => {
      notify.fromError(valor, 'Error');
      expect(show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error',
        text2: textosComunes.errores.desconocido,
      });
    },
  );
});
