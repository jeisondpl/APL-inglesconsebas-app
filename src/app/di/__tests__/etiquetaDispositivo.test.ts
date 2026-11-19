// Tester (F1-03): etiqueta del dispositivo que viaja en el login (deviceLabel, CA1).
import { etiquetaDispositivo } from '@/app/di/etiquetaDispositivo';

describe('etiquetaDispositivo', () => {
  it('Android con marca y modelo', () => {
    expect(
      etiquetaDispositivo({
        OS: 'android',
        Version: 34,
        constants: { Brand: 'motorola', Model: 'moto g77', Release: '14' },
      }),
    ).toBe('motorola moto g77 · Android 14');
  });

  it('Android sin modelo ni release usa solo el sistema con Version', () => {
    expect(etiquetaDispositivo({ OS: 'android', Version: 34 })).toBe(
      'Android 34',
    );
    expect(
      etiquetaDispositivo({
        OS: 'android',
        Version: 34,
        constants: { Brand: '', Release: '13' },
      }),
    ).toBe('Android 13');
  });

  it('iOS', () => {
    expect(etiquetaDispositivo({ OS: 'ios', Version: '18.1' })).toBe(
      'iOS 18.1',
    );
  });

  it('otro sistema', () => {
    expect(etiquetaDispositivo({ OS: 'web', Version: 1 })).toBe('web 1');
  });

  it('corta a 100 caracteres', () => {
    const etiqueta = etiquetaDispositivo({
      OS: 'android',
      Version: 34,
      constants: {
        Brand: 'x'.repeat(80),
        Model: 'y'.repeat(80),
        Release: '14',
      },
    });
    expect(etiqueta).toHaveLength(100);
  });

  it('sin argumentos usa Platform y no pasa de 100', () => {
    const etiqueta = etiquetaDispositivo();
    expect(etiqueta.length).toBeGreaterThan(0);
    expect(etiqueta.length).toBeLessThanOrEqual(100);
  });
});
