// F1-06: pantalla de login con el paso del código por correo y «Continuar con Google», con el
// controller real y el repositorio en memoria.
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import {
  CODIGO_MEMORIA,
  crearMemoriaSesionRepository,
  tokenGoogleMemoria,
  USUARIOS_SEED,
} from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { LoginScreen } from '@/modules/sesion/presentation/screens/LoginScreen';
import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const USUARIOS = USUARIOS_SEED.map(u =>
  u.usuario === 'ana' ? { ...u, correo: 'ana@example.com' } : u,
);

async function montar(
  opciones: { repo?: SesionRepository; google?: GoogleSignInPort } = {},
) {
  const dependencias = crearDependenciasDePrueba({
    estadoInicial: { tipo: 'sinSesion' },
    repo: opciones.repo ?? crearMemoriaSesionRepository({ usuarios: USUARIOS }),
    google: opciones.google,
  });
  await render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
  return dependencias;
}

const boton = (nombre: string | RegExp) =>
  screen.getByRole('button', { name: nombre });

async function teclear(digitos: string) {
  for (const d of digitos) {
    await fireEvent.press(boton(`Dígito ${d}`));
  }
}

async function entrarConPin(usuario = 'ana', pin = '1234') {
  await fireEvent.changeText(screen.getByLabelText('Usuario'), usuario);
  await fireEvent.press(boton('Continuar'));
  await teclear(pin);
}

const googleFalso = (idToken: string): GoogleSignInPort => ({
  disponible: true,
  obtenerIdToken: jest.fn(() => Promise.resolve({ tipo: 'ok', idToken })),
  cerrarSesion: jest.fn(() => Promise.resolve()),
});

describe('login · código por correo (F1-06)', () => {
  it('sin correo: el PIN entra directo, como antes', async () => {
    const dependencias = await montar();
    await entrarConPin('luis');
    expect(dependencias.sesionActiva.obtener().tipo).toBe('autenticado');
    expect(screen.queryByText('Revisa tu correo')).toBeNull();
  });

  it('con correo: pide el código, muestra el correo enmascarado y entra con el código bueno', async () => {
    const dependencias = await montar();
    await entrarConPin();
    expect(screen.getByText('Revisa tu correo')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Te enviamos un código de 6 dígitos a an***@example.com.',
      ),
    ).toBeOnTheScreen();
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
    expect(screen.getByLabelText('Código: 0 de 6 dígitos')).toBeOnTheScreen();
    await teclear(CODIGO_MEMORIA);
    expect(dependencias.sesionActiva.obtener()).toMatchObject({
      tipo: 'autenticado',
      sesion: { usuario: { usuario: 'ana' } },
    });
  });

  it('código malo: error en el paso, los puntos se vacían y se puede reintentar', async () => {
    const dependencias = await montar();
    await entrarConPin();
    await teclear('000000');
    expect(screen.getByText('Código incorrecto.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Código: 0 de 6 dígitos')).toBeOnTheScreen();
    await teclear(CODIGO_MEMORIA);
    expect(dependencias.sesionActiva.obtener().tipo).toBe('autenticado');
  });

  it('reenviar: espera la cuenta atrás y luego avisa del código nuevo', async () => {
    // Cuenta atrás de 1 s (Leap da 60) para probarla con el reloj real.
    const base = crearMemoriaSesionRepository({ usuarios: USUARIOS });
    const repo: SesionRepository = {
      ...base,
      iniciarSesion: async args => {
        const r = await base.iniciarSesion(args);
        return r.response && 'requiereCodigo' in r.response
          ? { ...r, response: { ...r.response, reenviarEnSeg: 1 } }
          : r;
      },
    };
    await montar({ repo });
    await entrarConPin();
    const reenviar = () => screen.getByTestId('reenviar-codigo');
    expect(screen.getByText('Reenviar código en 1 s')).toBeOnTheScreen();
    expect(reenviar()).toBeDisabled();
    expect(
      await screen.findByText('Reenviar código', {}, { timeout: 3000 }),
    ).toBeOnTheScreen();
    expect(reenviar()).toBeEnabled();
    await fireEvent.press(reenviar());
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Te enviamos un código nuevo' }),
    );
    expect(screen.getByText('Reenviar código en 60 s')).toBeOnTheScreen();
  });

  it('desafío vencido (410): vuelve al usuario con el mensaje', async () => {
    const base = crearMemoriaSesionRepository({ usuarios: USUARIOS });
    const repo: SesionRepository = {
      ...base,
      verificarCodigo: () =>
        Promise.resolve(
          respuestaError('El código venció. Vuelve a iniciar sesión.', 410),
        ),
    };
    await montar({ repo });
    await entrarConPin();
    await teclear(CODIGO_MEMORIA);
    expect(
      screen.getByText('El código venció. Vuelve a iniciar sesión.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Usuario')).toBeOnTheScreen();
  });

  it('volver al usuario desde el código olvida el desafío', async () => {
    await montar();
    await entrarConPin();
    await fireEvent.press(boton('Volver al usuario'));
    expect(screen.getByLabelText('Usuario')).toBeOnTheScreen();
    expect(screen.queryByText('Revisa tu correo')).toBeNull();
  });
});

describe('login · Continuar con Google (F1-06)', () => {
  it('sin Google configurado no se muestra el botón', async () => {
    await montar();
    expect(screen.queryByTestId('boton-google')).toBeNull();
  });

  it('con correo registrado entra sin pedir código', async () => {
    const google = googleFalso(tokenGoogleMemoria('ana'));
    const dependencias = await montar({ google });
    await fireEvent.press(boton('Continuar con Google'));
    expect(google.obtenerIdToken).toHaveBeenCalledTimes(1);
    expect(dependencias.sesionActiva.obtener()).toMatchObject({
      tipo: 'autenticado',
      sesion: { usuario: { usuario: 'ana' } },
    });
  });

  it('correo no registrado: muestra el error y no entra', async () => {
    const google = googleFalso(tokenGoogleMemoria('luis'));
    const dependencias = await montar({ google });
    await fireEvent.press(boton('Continuar con Google'));
    expect(
      await screen.findByText('Tu correo no está registrado en la academia.'),
    ).toBeOnTheScreen();
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
  });

  it('cancelar el selector no muestra nada', async () => {
    const google: GoogleSignInPort = {
      disponible: true,
      obtenerIdToken: () => Promise.resolve({ tipo: 'cancelado' }),
      cerrarSesion: () => Promise.resolve(),
    };
    await montar({ google });
    await fireEvent.press(boton('Continuar con Google'));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
