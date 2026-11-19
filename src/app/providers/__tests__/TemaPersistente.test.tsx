// F1-03b (1.14): el tema elegido se recuerda entre arranques.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependenciasProvider } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import {
  CLAVE_PREFERENCIA_TEMA,
  TemaPersistente,
} from '@/app/providers/TemaPersistente';
import { TemaProvider, useTema } from '@/shared/theme';

function Estado() {
  const { preferencia, establecerPreferencia } = useTema();
  return (
    <>
      <Text testID="pref">{preferencia}</Text>
      <Text testID="cambiar" onPress={() => establecerPreferencia('claro')}>
        cambiar
      </Text>
    </>
  );
}

async function montar(guardado?: string) {
  const almacen = crearAlmacenEnMemoria(
    guardado ? { [CLAVE_PREFERENCIA_TEMA]: guardado } : {},
  );
  const dependencias = crearDependenciasDePrueba({ almacen });
  await render(
    <TemaProvider preferenciaInicial="sistema">
      <DependenciasProvider valor={dependencias}>
        <TemaPersistente />
        <Estado />
      </DependenciasProvider>
    </TemaProvider>,
  );
  return almacen;
}

describe('TemaPersistente', () => {
  it('lee la preferencia guardada al arrancar', async () => {
    await montar('oscuro');
    await waitFor(() =>
      expect(screen.getByTestId('pref')).toHaveTextContent('oscuro'),
    );
  });

  it('un valor guardado que no es válido se ignora y no se pisa', async () => {
    const almacen = await montar('rosa');
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('pref')).toHaveTextContent('sistema');
    expect(almacen.datos.get(CLAVE_PREFERENCIA_TEMA)).toBe('rosa');
  });

  it('guarda lo que la persona elige', async () => {
    const almacen = await montar();
    await act(async () => {
      await Promise.resolve();
    });
    await fireEvent.press(screen.getByTestId('cambiar'));
    await waitFor(() =>
      expect(almacen.datos.get(CLAVE_PREFERENCIA_TEMA)).toBe('claro'),
    );
  });
});
