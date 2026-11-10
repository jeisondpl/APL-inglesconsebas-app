// CA16: App monta con todos los providers. CA10: el host de toasts de la librería se renderiza,
// incluido el tipo `warning` que la librería no trae.
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import App from '@/app/App';
import { Providers } from '@/app/providers';
import { useRepository, type IDependencias } from '@/app/di';

// Host de toasts espía: guarda la config que recibe para poder renderizar el tipo `warning`.
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

beforeEach(() => ToastHost.mockClear());

describe('App (CA16)', () => {
  it('monta con todos los providers y muestra la pantalla de inicio provisional', async () => {
    await render(<App />);
    expect(
      screen.getByRole('header', { name: 'Inglés con Sebas' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Versión 0.1.0')).toBeOnTheScreen();
    // Entorno del mock global de react-native-config (CA17).
    expect(screen.getByText('Entorno: dev')).toBeOnTheScreen();
    expect(screen.getByText('Servidor: localhost:8080')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('renderiza el host de toasts con el tipo warning registrado (CA10)', async () => {
    await render(<App />);
    expect(ToastHost).toHaveBeenCalled();
    const props = ToastHost.mock.calls[0][0] as {
      config: Record<string, (p: object) => ReactNode>;
    };
    expect(typeof props.config.warning).toBe('function');
  });

  it('el tipo warning del host se pinta con el toast base de la librería (CA10)', async () => {
    await render(<App />);
    const { config } = ToastHost.mock.calls[0][0] as {
      config: Record<string, (p: object) => ReactNode>;
    };
    await render(
      <>
        {config.warning({
          text1: 'Cuidado',
          text2: 'Detalle del aviso',
          type: 'warning',
          position: 'top',
          isVisible: true,
          show: jest.fn(),
          hide: jest.fn(),
          onPress: jest.fn(),
          props: {},
        })}
      </>,
    );
    expect(screen.getByText('Cuidado')).toBeOnTheScreen();
    expect(screen.getByText('Detalle del aviso')).toBeOnTheScreen();
  });
});

describe('Providers (CA11, CA16)', () => {
  function Consumidor() {
    const repo = useRepository('clases' as never) as { nombre: string };
    return <Text>{repo.nombre}</Text>;
  }

  it('inyecta el contenedor recibido en dependencias', async () => {
    const dependencias = {
      repositorios: { clases: { nombre: 'repo falso' } },
      nativos: {},
      api: { get: jest.fn(), post: jest.fn() },
    } as unknown as IDependencias;
    await render(
      <Providers dependencias={dependencias}>
        <Consumidor />
      </Providers>,
    );
    expect(screen.getByText('repo falso')).toBeOnTheScreen();
  });

  it('un error dentro de los providers lo recoge el límite de errores', async () => {
    const errorConsola = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      await render(
        <Providers>
          <Consumidor />
        </Providers>,
      );
      expect(
        screen.getByRole('button', { name: 'Reintentar' }),
      ).toBeOnTheScreen();
    } finally {
      errorConsola.mockRestore();
    }
  });
});
