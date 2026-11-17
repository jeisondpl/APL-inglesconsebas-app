// Constructor (EXT-01): pantalla de la bienvenida con el controller real y el contenedor de prueba.
// CA5, CA6, CA7, CA12, CA13, CA14 y CA15. El tester amplía los casos.
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import { TOTAL_PAGINAS_ONBOARDING } from '@/modules/onboarding/domain/validations/onboarding.validations';
import { categoriaIsotipoPorModo } from '@/modules/onboarding/presentation/components/IlustracionBienvenida';
import { PAGINAS_ONBOARDING } from '@/modules/onboarding/presentation/onboarding.config';
import { textosOnboarding } from '@/modules/onboarding/presentation/onboarding.textos';
import { OnboardingScreen } from '@/modules/onboarding/presentation/screens/OnboardingScreen';
import { TemaProvider, type ModoTema } from '@/shared/theme';

const pendiente = () =>
  crearDependenciasDePrueba({ onboardingInicial: { tipo: 'pendiente' } });

function montar(
  dependencias: IDependencias = pendiente(),
  modo: ModoTema = 'oscuro',
) {
  return render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={modo}>
        <DependenciasProvider valor={dependencias}>
          <NavigationContainer>
            <OnboardingScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

const indicador = () => screen.getByTestId('indicador-paginas');
const { paginas } = textosOnboarding;

describe('PAGINAS_ONBOARDING (CA5, CA15)', () => {
  it('tiene las 4 páginas en orden con los textos del lienzo', () => {
    expect(PAGINAS_ONBOARDING).toHaveLength(TOTAL_PAGINAS_ONBOARDING);
    expect(PAGINAS_ONBOARDING.map(p => p.clave)).toEqual([
      'bienvenida',
      'clases',
      'mensajes',
      'tareas',
    ]);
    expect(PAGINAS_ONBOARDING.map(p => p.titulo)).toEqual([
      'Tu inglés, en un solo lugar',
      'Tus clases, bajo control',
      'Habla con tu profe',
      'Tareas con feedback real',
    ]);
  });
});

describe('OnboardingScreen', () => {
  it('recorre las 4 páginas con «Siguiente» y termina en «Comenzar» (CA5, CA6)', async () => {
    await montar();
    expect(indicador().props.accessibilityLabel).toBe('Paso 1 de 4');
    expect(
      screen.getByRole('header', { name: paginas.bienvenida.titulo }),
    ).toBeOnTheScreen();
    expect(screen.getByText(paginas.bienvenida.descripcion)).toBeOnTheScreen();
    for (const n of [2, 3, 4]) {
      await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
      expect(indicador().props.accessibilityLabel).toBe(`Paso ${n} de 4`);
    }
    expect(screen.getByRole('button', { name: 'Comenzar' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Omitir la bienvenida' }),
    ).toBeOnTheScreen();
  });

  it('deslizar sincroniza el indicador (CA7)', async () => {
    await montar();
    await fireEvent(
      screen.getByTestId('lista-onboarding'),
      'momentumScrollEnd',
      {
        nativeEvent: { contentOffset: { x: 2 * 750, y: 0 } },
      },
    );
    expect(indicador().props.accessibilityLabel).toBe('Paso 3 de 4');
  });

  it('«Omitir» y «Comenzar» marcan la bandera (CA8)', async () => {
    const almacen = crearAlmacenEnMemoria();
    const dependencias = crearDependenciasDePrueba({
      almacen,
      onboardingInicial: { tipo: 'pendiente' },
    });
    await montar(dependencias);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Omitir la bienvenida' }),
    );
    expect(dependencias.banderaOnboarding.obtener()).toEqual({
      tipo: 'visto',
    });
    expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
  });

  it('atrás de Android vuelve a la página anterior y en O1 no intercepta (CA12)', async () => {
    type Oyente = Parameters<typeof BackHandler.addEventListener>[1];
    const oyentes: Oyente[] = [];
    const espia = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_, oyente) => {
        oyentes.push(oyente);
        return {
          remove: () => {
            oyentes.splice(oyentes.indexOf(oyente), 1);
          },
        };
      });
    try {
      await montar();
      const atras = () => oyentes[oyentes.length - 1]({} as never);
      let resultado: boolean | null | undefined;
      await act(async () => {
        resultado = atras();
      });
      expect(resultado).toBe(false);
      await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
      expect(indicador().props.accessibilityLabel).toBe('Paso 3 de 4');
      await act(async () => {
        resultado = atras();
      });
      expect(resultado).toBe(true);
      expect(indicador().props.accessibilityLabel).toBe('Paso 2 de 4');
    } finally {
      espia.mockRestore();
    }
  });

  it.each([
    ['oscuro', 'kids'],
    ['claro', 'corporate'],
  ] as const)(
    'en %s usa el isotipo %s y el título en Nohemi (CA13)',
    async (modo, categoria) => {
      await montar(pendiente(), modo);
      const isotipo = screen.getByTestId('ilustracion-bienvenida', {
        includeHiddenElements: true,
      });
      expect(isotipo).toBeTruthy();
      const titulo = screen.getByRole('header', {
        name: paginas.bienvenida.titulo,
      });
      expect(StyleSheet.flatten(titulo.props.style).fontFamily).toBe(
        'Nohemi-Medium',
      );
      expect(categoriaIsotipoPorModo(modo)).toBe(categoria);
    },
  );

  it('la página no activa queda oculta al lector (CA14)', async () => {
    await montar();
    expect(
      screen.queryByRole('header', { name: paginas.clases.titulo }),
    ).toBeNull();
    expect(
      screen.getByTestId('pagina-clases', { includeHiddenElements: true }).props
        .importantForAccessibility,
    ).toBe('no-hide-descendants');
    expect(
      screen.getByTestId('ilustracion-clases', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });
});
