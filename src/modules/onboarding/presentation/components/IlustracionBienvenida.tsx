import { LogoMarca, type CategoriaIsotipo } from '@/shared/components';
import { useTema, type ModoTema } from '@/shared/theme';

/**
 * Categoría del isotipo según el modo, por la nota del lienzo principal: «el verde en modo oscuro
 * y el negro en modo claro». La reutiliza la cabecera de la bienvenida.
 */
export function categoriaIsotipoPorModo(modo: ModoTema): CategoriaIsotipo {
  return modo === 'oscuro' ? 'kids' : 'corporate';
}

/** O1: el isotipo oficial a 190, decorativo (sin etiqueta queda oculto al lector). */
export function IlustracionBienvenida() {
  const { tema } = useTema();
  return (
    <LogoMarca
      testID="ilustracion-bienvenida"
      tamano={190}
      categoria={categoriaIsotipoPorModo(tema.modo)}
    />
  );
}
