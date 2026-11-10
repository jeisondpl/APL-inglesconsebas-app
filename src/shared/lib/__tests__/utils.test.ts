import { respuestaError, respuestaOk } from '../HttpResponse';
import { construirQuery, mensajeDeError } from '../utils';

describe('HttpResponse', () => {
  it('respuestaOk marca error=false con el cuerpo y el código', () => {
    expect(respuestaOk({ a: 1 }, 200)).toEqual({
      error: false,
      response: { a: 1 },
      code: 200,
    });
  });

  it('respuestaOk sin código deja code sin definir', () => {
    expect(respuestaOk('x').code).toBeUndefined();
  });

  it('respuestaError marca error=true con mensaje y código, sin response', () => {
    const r = respuestaError('Falló', 500);
    expect(r).toEqual({ error: true, msg: 'Falló', code: 500 });
    expect(r.response).toBeUndefined();
  });
});

describe('construirQuery', () => {
  it('devuelve cadena vacía sin params', () => {
    expect(construirQuery()).toBe('');
    expect(construirQuery({})).toBe('');
  });

  it('omite los undefined', () => {
    expect(construirQuery({ a: undefined })).toBe('');
    expect(construirQuery({ a: 1, b: undefined })).toBe('?a=1');
  });

  it('convierte números y booleanos y conserva el orden', () => {
    expect(construirQuery({ endpoint: 'clases', id: 0, activo: false })).toBe(
      '?endpoint=clases&id=0&activo=false',
    );
  });

  it('codifica claves y valores', () => {
    expect(construirQuery({ 'cl ave': 'á&=?' })).toBe(
      '?cl%20ave=%C3%A1%26%3D%3F',
    );
  });

  it('mantiene las cadenas vacías', () => {
    expect(construirQuery({ q: '' })).toBe('?q=');
  });
});

describe('mensajeDeError', () => {
  const DEF = 'por defecto';

  it('usa el msg de un HttpResponse', () => {
    expect(mensajeDeError(respuestaError('Sin cupo', 409), DEF)).toBe(
      'Sin cupo',
    );
  });

  it('un HttpResponse sin msg o con msg en blanco da el mensaje por defecto', () => {
    expect(mensajeDeError({ error: true }, DEF)).toBe(DEF);
    expect(mensajeDeError({ error: true, msg: '  ' }, DEF)).toBe(DEF);
  });

  it('usa el message de un Error', () => {
    expect(mensajeDeError(new Error('Se rompió'), DEF)).toBe('Se rompió');
  });

  it('un Error sin mensaje da el mensaje por defecto', () => {
    expect(mensajeDeError(new Error(''), DEF)).toBe(DEF);
  });

  it('usa un texto no vacío tal cual', () => {
    expect(mensajeDeError('texto', DEF)).toBe('texto');
    expect(mensajeDeError('   ', DEF)).toBe(DEF);
  });

  it.each([undefined, null, 42, {}, { error: 'no booleano' }, []])(
    'con un valor desconocido (%p) da el mensaje por defecto',
    valor => {
      expect(mensajeDeError(valor, DEF)).toBe(DEF);
    },
  );
});
