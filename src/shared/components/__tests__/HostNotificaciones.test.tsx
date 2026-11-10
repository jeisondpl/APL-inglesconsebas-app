// CA8: HostNotificaciones registra success, error, warning e info con fondo `superficie` y el
// acento de su tipo; título en `texto` con Nohemi-Medium (marca oficial, § 0.6) y detalle en `textoSecundario` con
// DMSans, en los dos temas. El host está dentro de los providers y sigue al tema.
import { act, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ToastConfigParams } from 'react-native-toast-message';

import { Providers } from '@/app/providers';
import {
  configuracionNotificaciones,
  HostNotificaciones,
} from '@/shared/components';
import type { TipoAviso } from '@/shared/lib/notify';
import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  useTema,
  type IColoresTema,
  type IContextoTema,
} from '@/shared/theme';

// Host espía: guarda la config que recibe. BaseToast sigue siendo el real.
jest.mock('react-native-toast-message', () => {
  const real = jest.requireActual('react-native-toast-message');
  const Toast = Object.assign(
    jest.fn(() => null),
    { show: jest.fn(), hide: jest.fn() },
  );
  return { ...real, __esModule: true, default: Toast };
});

const ToastHost = jest.requireMock('react-native-toast-message')
  .default as jest.Mock;

type Config = Record<TipoAviso, (p: ToastConfigParams<unknown>) => ReactNode>;

const ultimaConfig = () =>
  ToastHost.mock.calls[ToastHost.mock.calls.length - 1][0].config as Config;

const parametros = (tipo: TipoAviso): ToastConfigParams<unknown> => ({
  type: tipo,
  text1: 'Clase reagendada',
  text2: 'Lun 28 sep · 6:00 p. m.',
  position: 'top',
  isVisible: true,
  visibilityTime: 4000,
  show: jest.fn(),
  hide: jest.fn(),
  onPress: jest.fn(),
  props: {},
});

const ACENTOS: [TipoAviso, keyof IColoresTema][] = [
  ['success', 'marca'],
  ['error', 'peligro'],
  ['warning', 'aviso'],
  ['info', 'info'],
];

/** Primer ancestro del elemento cuyo estilo define `clave`. */
function ancestroConEstilo(
  elemento: { parent: unknown; props: { style?: unknown } } | null,
  clave: string,
) {
  let actual = elemento;
  while (actual) {
    const estilo = StyleSheet.flatten(actual.props.style as never) ?? {};
    if (clave in estilo) {
      return estilo as Record<string, unknown>;
    }
    actual = actual.parent as typeof actual;
  }
  throw new Error(`Ningún ancestro define ${clave}`);
}

beforeEach(() => ToastHost.mockClear());

describe.each([
  ['oscuro', temaOscuro],
  ['claro', temaClaro],
] as const)('configuracionNotificaciones en el tema %s (CA8)', (_m, tema) => {
  it('registra exactamente los cuatro tipos de notify', () => {
    expect(Object.keys(configuracionNotificaciones(tema)).sort()).toEqual([
      'error',
      'info',
      'success',
      'warning',
    ]);
  });

  it.each(ACENTOS)(
    '%s: fondo superficie, acento %s, título y detalle con los tokens',
    async (tipo, acento) => {
      const config = configuracionNotificaciones(tema) as Config;
      await render(<>{config[tipo](parametros(tipo))}</>);

      const titulo = screen.getByText('Clase reagendada');
      expect(titulo).toHaveStyle({
        color: tema.colores.texto,
        fontFamily: 'Nohemi-Medium',
      });
      expect(screen.getByText('Lun 28 sep · 6:00 p. m.')).toHaveStyle({
        color: tema.colores.textoSecundario,
        fontFamily: 'DMSans-Regular',
      });
      const contenedor = ancestroConEstilo(titulo as never, 'borderLeftColor');
      expect(contenedor.borderLeftColor).toBe(tema.colores[acento]);
      expect(contenedor.backgroundColor).toBe(tema.colores.superficie);
      expect(contenedor.borderColor).toBe(tema.colores.borde);
    },
  );
});

describe('HostNotificaciones (CA8)', () => {
  it('pasa al host la config del tema y la recalcula al cambiar de tema', async () => {
    let contexto: IContextoTema | undefined;
    function Capturar() {
      contexto = useTema();
      return null;
    }
    await render(
      <TemaProvider preferenciaInicial="oscuro">
        <Capturar />
        <HostNotificaciones />
      </TemaProvider>,
    );
    const oscura = ultimaConfig();
    await render(<>{oscura.success(parametros('success'))}</>);
    expect(screen.getByText('Clase reagendada')).toHaveStyle({
      color: temaOscuro.colores.texto,
    });

    await act(() => contexto!.establecerPreferencia('claro'));
    const clara = ultimaConfig();
    expect(clara).not.toBe(oscura);
    await render(<>{clara.success(parametros('success'))}</>);
    expect(screen.getByText('Clase reagendada')).toHaveStyle({
      color: temaClaro.colores.texto,
    });
  });

  it('Providers monta el host dentro del tema, junto al contenido', async () => {
    await render(
      <Providers preferenciaTema="claro">
        <Text>Contenido</Text>
      </Providers>,
    );
    expect(screen.getByText('Contenido')).toBeOnTheScreen();
    expect(ToastHost).toHaveBeenCalled();
    const config = ultimaConfig();
    expect(Object.keys(config).sort()).toEqual([
      'error',
      'info',
      'success',
      'warning',
    ]);
    await render(<>{config.error(parametros('error'))}</>);
    const contenedor = ancestroConEstilo(
      screen.getByText('Clase reagendada') as never,
      'borderLeftColor',
    );
    expect(contenedor.borderLeftColor).toBe(temaClaro.colores.peligro);
  });

  it('fuera de TemaProvider lanza el error descriptivo de useTema', async () => {
    const errorConsola = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      await expect(render(<HostNotificaciones />)).rejects.toThrow(
        /useTema se usó fuera de <TemaProvider>/,
      );
    } finally {
      errorConsola.mockRestore();
    }
  });
});
