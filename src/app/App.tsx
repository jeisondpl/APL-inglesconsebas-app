import { NavegadorRaiz } from '@/app/navigation';
import { Providers } from '@/app/providers';

/** Raíz de la app: providers (con el host de toasts del tema) y navegador raíz. */
export default function App() {
  return (
    <Providers>
      <NavegadorRaiz />
    </Providers>
  );
}
