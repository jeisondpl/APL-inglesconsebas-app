// Constructor (EXT-01): store de la bandera y casos de uso de arranque y marcar visto.
// El tester amplía los casos.
import { crearAlmacenEnMemoria } from '@/app/di/dependenciasDePrueba';
import { arrancarOnboardingUseCase } from '@/modules/onboarding/aplications/arrancarOnboarding/arrancarOnboarding';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import { marcarOnboardingVistoUseCase } from '@/modules/onboarding/aplications/marcarOnboardingVisto/marcarOnboardingVisto';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

function almacenFalso(
  parcial: Partial<SecureStoragePort> = {},
): jest.Mocked<SecureStoragePort> {
  return {
    leer: jest.fn(async () => null),
    guardar: jest.fn(async () => true),
    borrar: jest.fn(async () => undefined),
    ...parcial,
  } as jest.Mocked<SecureStoragePort>;
}

describe('crearBanderaOnboarding', () => {
  it('empieza en cargando, avisa a los oyentes y permite desuscribirse', () => {
    const bandera = crearBanderaOnboarding();
    expect(bandera.obtener()).toEqual({ tipo: 'cargando' });
    const oyente = jest.fn();
    const desuscribir = bandera.suscribir(oyente);
    bandera.establecer({ tipo: 'pendiente' });
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(bandera.obtener()).toEqual({ tipo: 'pendiente' });
    desuscribir();
    bandera.establecer({ tipo: 'visto' });
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it('acepta un estado inicial', () => {
    expect(crearBanderaOnboarding({ tipo: 'visto' }).obtener()).toEqual({
      tipo: 'visto',
    });
  });
});

describe('arrancarOnboardingUseCase', () => {
  it('sin bandera guardada → pendiente', async () => {
    const bandera = crearBanderaOnboarding();
    await arrancarOnboardingUseCase({
      almacen: crearAlmacenEnMemoria(),
      bandera,
    });
    expect(bandera.obtener()).toEqual({ tipo: 'pendiente' });
  });

  it('con la bandera guardada → visto', async () => {
    const bandera = crearBanderaOnboarding();
    await arrancarOnboardingUseCase({
      almacen: crearAlmacenEnMemoria({ hasSeenOnboarding: '1' }),
      bandera,
    });
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
  });

  it('si no está en cargando, no lee', async () => {
    const almacen = almacenFalso();
    const bandera = crearBanderaOnboarding({ tipo: 'pendiente' });
    await arrancarOnboardingUseCase({ almacen, bandera });
    expect(almacen.leer).not.toHaveBeenCalled();
    expect(bandera.obtener()).toEqual({ tipo: 'pendiente' });
  });

  it('si la lectura falla (null) → pendiente', async () => {
    const almacen = almacenFalso({ leer: jest.fn(async () => null) });
    const bandera = crearBanderaOnboarding();
    await arrancarOnboardingUseCase({ almacen, bandera });
    expect(almacen.leer).toHaveBeenCalledWith('hasSeenOnboarding');
    expect(bandera.obtener()).toEqual({ tipo: 'pendiente' });
  });

  it('si se marcó visto mientras se leía, no lo pisa', async () => {
    let resolver: (v: string | null) => void = () => {};
    const almacen = almacenFalso({
      leer: jest.fn(
        () =>
          new Promise<string | null>(r => {
            resolver = r;
          }),
      ),
    });
    const bandera = crearBanderaOnboarding();
    const lectura = arrancarOnboardingUseCase({ almacen, bandera });
    bandera.establecer({ tipo: 'visto' });
    resolver(null);
    await lectura;
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
  });
});

describe('marcarOnboardingVistoUseCase', () => {
  it('queda en visto antes de resolver el guardado y guarda «1»', async () => {
    const almacen = crearAlmacenEnMemoria();
    const bandera = crearBanderaOnboarding({ tipo: 'pendiente' });
    const promesa = marcarOnboardingVistoUseCase(almacen, bandera);
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
    expect(await promesa).toBe(true);
    expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
  });

  it('si guardar falla devuelve false y sigue en visto (CA10)', async () => {
    const almacen = almacenFalso({ guardar: jest.fn(async () => false) });
    const bandera = crearBanderaOnboarding({ tipo: 'pendiente' });
    expect(await marcarOnboardingVistoUseCase(almacen, bandera)).toBe(false);
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
  });

  it('es idempotente: con visto guarda igualmente y no avisa a los oyentes', async () => {
    const almacen = almacenFalso();
    const bandera = crearBanderaOnboarding({ tipo: 'visto' });
    const oyente = jest.fn();
    bandera.suscribir(oyente);
    expect(await marcarOnboardingVistoUseCase(almacen, bandera)).toBe(true);
    expect(almacen.guardar).toHaveBeenCalledWith('hasSeenOnboarding', '1');
    expect(oyente).not.toHaveBeenCalled();
  });
});
