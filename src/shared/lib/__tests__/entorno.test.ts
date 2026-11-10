import { entorno, leerEntorno } from '../entorno';

describe('leerEntorno', () => {
  it('devuelve apiUrl y appEnv válidos', () => {
    expect(
      leerEntorno({
        API_URL: 'https://app.inglesconsebas.com/api',
        APP_ENV: 'prod',
      }),
    ).toEqual({ apiUrl: 'https://app.inglesconsebas.com/api', appEnv: 'prod' });
  });

  it('quita espacios y barras finales de API_URL', () => {
    expect(
      leerEntorno({ API_URL: '  http://h:8080/api//  ', APP_ENV: 'staging' }),
    ).toEqual({ apiUrl: 'http://h:8080/api', appEnv: 'staging' });
  });

  it('usa dev si falta APP_ENV o está en blanco', () => {
    expect(leerEntorno({ API_URL: 'http://h' }).appEnv).toBe('dev');
    expect(leerEntorno({ API_URL: 'http://h', APP_ENV: '  ' }).appEnv).toBe(
      'dev',
    );
  });

  it('acepta APP_ENV con espacios alrededor', () => {
    expect(leerEntorno({ API_URL: 'http://h', APP_ENV: ' prod ' }).appEnv).toBe(
      'prod',
    );
  });

  it.each([{}, { API_URL: '' }, { API_URL: '   ' }])(
    'lanza un error descriptivo si falta API_URL (%p)',
    config => {
      expect(() => leerEntorno(config)).toThrow(/API_URL/);
    },
  );

  it('lanza un error descriptivo si APP_ENV no es válido', () => {
    expect(() =>
      leerEntorno({ API_URL: 'http://h', APP_ENV: 'produccion' }),
    ).toThrow(/APP_ENV inválido: «produccion».*dev, staging, prod/);
  });
});

describe('entorno', () => {
  it('se lee de react-native-config', () => {
    // Valores del mock global de jest.setup.ts.
    expect(entorno).toEqual({
      apiUrl: 'http://localhost:8080/api',
      appEnv: 'dev',
    });
  });
});
