// F1-03b (1.14): cambio de PIN y pantalla de perfil.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { abrirWebUseCase } from '@/modules/perfil/aplications/abrirWeb/abrirWeb';
import { cambiarPinUseCase } from '@/modules/perfil/aplications/cambiarPin/cambiarPin';
import {
  problemaDelPin,
  soloPin,
} from '@/modules/perfil/domain/perfil.dominio';
import {
  crearApiPerfilRepository,
  crearMemoriaPerfilRepository,
} from '@/modules/perfil/infrastructure/perfilRepositories';
import { PerfilScreen } from '@/modules/perfil/presentation/screens/PerfilScreen';
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

describe('reglas del PIN', () => {
  it('soloPin deja dígitos y corta a 4', () => {
    expect(soloPin('12a3-45')).toBe('1234');
    expect(soloPin('')).toBe('');
  });

  it('problemaDelPin da el primer problema', () => {
    expect(problemaDelPin('12', '5678', '5678')).toBe('actualIncompleto');
    expect(problemaDelPin('1234', '56', '56')).toBe('nuevoIncompleto');
    expect(problemaDelPin('1234', '1234', '1234')).toBe('igual');
    expect(problemaDelPin('1234', '5678', '5679')).toBe('noCoincide');
    expect(problemaDelPin('1234', '5678', '5678')).toBeNull();
  });
});

describe('cambiarPinUseCase', () => {
  it('valida antes de llamar a Leap', async () => {
    const repo = crearMemoriaPerfilRepository();
    const r = await cambiarPinUseCase(repo, {
      actual: '1234',
      nuevo: '5678',
      confirmar: '0000',
    });
    expect(r.msg).toMatch(/confirmación/);
    expect(repo.cambios).toEqual([]);
  });

  it('cambia el PIN y se puede volver a cambiar con el nuevo', async () => {
    const repo = crearMemoriaPerfilRepository();
    const args = { actual: '1234', nuevo: '5678', confirmar: '5678' };
    expect((await cambiarPinUseCase(repo, args)).error).toBe(false);
    // El actual ya no es 1234.
    expect((await cambiarPinUseCase(repo, args)).msg).toMatch(/no es correcto/);
    expect(repo.cambios).toEqual([{ actual: '1234', nuevo: '5678' }]);
  });

  it('un error sin mensaje se vuelve el genérico', async () => {
    const repo = crearMemoriaPerfilRepository({ falla: { msg: '' } });
    const r = await cambiarPinUseCase(repo, {
      actual: '1234',
      nuevo: '5678',
      confirmar: '5678',
    });
    expect(r.msg).toMatch(/inesperado/);
  });
});

describe('apiPerfilRepository', () => {
  it('manda change_pin con los dos PIN y devuelve el error de Leap', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk({ ok: true }))
      .mockResolvedValueOnce(respuestaError('Ese PIN ya está en uso.', 400))
      .mockResolvedValueOnce(respuestaError(undefined as never, 500));
    const repo = crearApiPerfilRepository({
      get: jest.fn(),
      post,
    } as unknown as ClienteApi);
    expect(
      (await repo.cambiarPin({ actual: '1234', nuevo: '5678' })).error,
    ).toBe(false);
    expect(post).toHaveBeenCalledWith(
      'auth.php',
      { currentPin: '1234', newPin: '5678' },
      { action: 'change_pin' },
    );
    expect(
      await repo.cambiarPin({ actual: '1234', nuevo: '5678' }),
    ).toMatchObject({ error: true, msg: 'Ese PIN ya está en uso.', code: 400 });
    expect(
      (await repo.cambiarPin({ actual: '1234', nuevo: '5678' })).msg,
    ).toMatch(/inesperado/);
  });
});

describe('PerfilScreen', () => {
  async function montar(
    repo = crearMemoriaPerfilRepository(),
    alVolver = jest.fn(),
  ) {
    const dependencias = crearDependenciasDePrueba({ perfil: repo });
    const Envoltorio = ({ children }: { children: ReactNode }) => (
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            {children}
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>
    );
    await render(
      <Envoltorio>
        <PerfilScreen
          usuario={{ nombre: 'Ana Torres', usuario: 'ana', rol: 'estudiante' }}
          alVolver={alVolver}
        />
      </Envoltorio>,
    );
    return { repo, alVolver };
  }

  const llenar = async (a: string, n: string, c: string) => {
    await fireEvent.changeText(screen.getByTestId('perfil-pin-actual'), a);
    await fireEvent.changeText(screen.getByTestId('perfil-pin-nuevo'), n);
    await fireEvent.changeText(screen.getByTestId('perfil-pin-confirmar'), c);
  };

  beforeEach(() => (Toast.show as jest.Mock).mockClear());

  it('muestra quién eres y vuelve', async () => {
    const { alVolver } = await montar();
    expect(await screen.findByText('Ana Torres')).toBeOnTheScreen();
    expect(screen.getByText('Estudiante · usuario ana')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('perfil-volver'));
    expect(alVolver).toHaveBeenCalled();
  });

  it('cambia el PIN, avisa y vacía los campos', async () => {
    const { repo } = await montar();
    await llenar('1234', '5678', '5678');
    await fireEvent.press(screen.getByTestId('perfil-pin-enviar'));
    await waitFor(() => expect(repo.cambios).toHaveLength(1));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'PIN cambiado' }),
    );
    expect(screen.getByTestId('perfil-pin-actual').props.value).toBe('');
    expect(screen.queryByTestId('perfil-pin-error')).toBeNull();
  });

  it('los campos solo aceptan dígitos', async () => {
    await montar();
    await fireEvent.changeText(
      screen.getByTestId('perfil-pin-nuevo'),
      '5a6b78x9',
    );
    expect(screen.getByTestId('perfil-pin-nuevo').props.value).toBe('5678');
  });

  it('una confirmación distinta se explica junto al formulario', async () => {
    const { repo } = await montar();
    await llenar('1234', '5678', '5670');
    await fireEvent.press(screen.getByTestId('perfil-pin-enviar'));
    expect(await screen.findByTestId('perfil-pin-error')).toBeOnTheScreen();
    expect(
      screen.getByText('La confirmación no coincide con el PIN nuevo.'),
    ).toBeOnTheScreen();
    expect(repo.cambios).toEqual([]);
    // Al volver a escribir, el aviso se quita.
    await fireEvent.changeText(
      screen.getByTestId('perfil-pin-confirmar'),
      '5678',
    );
    expect(screen.queryByTestId('perfil-pin-error')).toBeNull();
  });

  it('si Leap rechaza el PIN actual, lo dice y conserva lo escrito', async () => {
    await montar(crearMemoriaPerfilRepository({ pinActual: '9999' }));
    await llenar('1234', '5678', '5678');
    await fireEvent.press(screen.getByTestId('perfil-pin-enviar'));
    expect(
      await screen.findByText('El PIN actual no es correcto.'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('perfil-pin-actual').props.value).toBe('1234');
  });

  it('«Abrir en la web» abre el navegador con el código', async () => {
    const abrir = jest.fn().mockResolvedValue(true);
    const repo = crearMemoriaPerfilRepository();
    const dependencias = crearDependenciasDePrueba({
      perfil: repo,
      enlaces: { abrir },
    });
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <PerfilScreen
              usuario={{ nombre: 'Ana', usuario: 'ana', rol: 'estudiante' }}
              alVolver={jest.fn()}
            />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByTestId('perfil-web-abrir'));
    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(1));
    expect(abrir.mock.calls[0][0]).toMatch(/\/\?app_code=CODIGO-MEMORIA$/);
  });

  it('si no se puede abrir la web, avisa', async () => {
    const repo = crearMemoriaPerfilRepository({
      falla: { msg: 'Inicia sesión de nuevo' },
    });
    const dependencias = crearDependenciasDePrueba({ perfil: repo });
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <PerfilScreen
              usuario={{ nombre: 'Ana', usuario: 'ana', rol: 'estudiante' }}
              alVolver={jest.fn()}
            />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByTestId('perfil-web-abrir'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: 'Inicia sesión de nuevo' }),
      ),
    );
  });

  it('con el tema se puede elegir sistema, claro u oscuro', async () => {
    await montar();
    expect(await screen.findByTestId('perfil-tema-oscuro')).toBeChecked();
    await fireEvent.press(screen.getByTestId('perfil-tema-claro'));
    expect(screen.getByTestId('perfil-tema-claro')).toBeChecked();
    expect(screen.getByTestId('perfil-tema-oscuro')).not.toBeChecked();
    await fireEvent.press(screen.getByTestId('perfil-tema-sistema'));
    expect(screen.getByTestId('perfil-tema-sistema')).toBeChecked();
  });

  it('un doble toque envía una sola vez, y si se sale a medias no se actualiza', async () => {
    const repo = crearMemoriaPerfilRepository();
    let soltar: (r: unknown) => void = () => undefined;
    jest
      .spyOn(repo, 'cambiarPin')
      .mockImplementation(() => new Promise(r => (soltar = r)) as never);
    const dependencias = crearDependenciasDePrueba({ perfil: repo });
    const vista = await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <PerfilScreen
              usuario={{ nombre: 'Ana', usuario: 'ana', rol: 'estudiante' }}
              alVolver={jest.fn()}
            />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    await llenar('1234', '5678', '5678');
    await fireEvent.press(screen.getByTestId('perfil-pin-enviar'));
    await fireEvent.press(screen.getByTestId('perfil-pin-enviar'));
    expect(repo.cambiarPin).toHaveBeenCalledTimes(1);
    await vista.unmount();
    await act(async () => soltar({ error: false }));
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('abrir la web con la sesión (1.16)', () => {
  it('pide el código y abre el navegador con él', async () => {
    const repo = crearMemoriaPerfilRepository();
    const abrir = jest.fn().mockResolvedValue(true);
    const r = await abrirWebUseCase(repo, { abrir }, 'https://app.x.com');
    expect(r.error).toBe(false);
    expect(abrir).toHaveBeenCalledWith(
      'https://app.x.com/?app_code=CODIGO-MEMORIA',
    );
    expect(repo.codigosPedidos).toBe(1);
  });

  it('el código se codifica en la URL', async () => {
    const repo = crearMemoriaPerfilRepository();
    jest
      .spyOn(repo, 'codigoWeb')
      .mockResolvedValue(respuestaOk({ codigo: 'a b&c' }));
    const abrir = jest.fn().mockResolvedValue(true);
    await abrirWebUseCase(repo, { abrir }, 'https://x');
    expect(abrir).toHaveBeenCalledWith('https://x/?app_code=a%20b%26c');
  });

  it('si Leap falla o no hay navegador, lo dice y no abre nada', async () => {
    const abrir = jest.fn().mockResolvedValue(true);
    const falla = await abrirWebUseCase(
      crearMemoriaPerfilRepository({ falla: { msg: 'sin sesión', code: 401 } }),
      { abrir },
      'https://x',
    );
    expect(falla).toMatchObject({ error: true, msg: 'sin sesión' });
    expect(abrir).not.toHaveBeenCalled();
    const sinMsg = await abrirWebUseCase(
      crearMemoriaPerfilRepository({ falla: { msg: '' } }),
      { abrir },
      'https://x',
    );
    expect(sinMsg.msg).toMatch(/inesperado/);
    const sinNav = await abrirWebUseCase(
      crearMemoriaPerfilRepository(),
      { abrir: jest.fn().mockResolvedValue(false) },
      'https://x',
    );
    expect(sinNav.msg).toMatch(/navegador/);
  });

  it('el adaptador API pide web_code y valida la respuesta', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk({ code: 'ABC', expiresIn: 60 }))
      .mockResolvedValueOnce(respuestaOk({}))
      .mockResolvedValueOnce(respuestaError('Inicia sesión', 401))
      .mockResolvedValueOnce(respuestaError(undefined as never, 500));
    const repo = crearApiPerfilRepository({
      get: jest.fn(),
      post,
    } as unknown as ClienteApi);
    expect((await repo.codigoWeb()).response).toEqual({ codigo: 'ABC' });
    expect(post).toHaveBeenCalledWith('auth.php', {}, { action: 'web_code' });
    expect((await repo.codigoWeb()).msg).toMatch(/formato/);
    expect((await repo.codigoWeb()).msg).toBe('Inicia sesión');
    expect((await repo.codigoWeb()).msg).toMatch(/inesperado/);
  });
});
