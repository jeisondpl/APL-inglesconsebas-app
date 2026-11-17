import { Providers } from '@/app/providers';
import { RaizConSplash } from '@/app/splash';

/**
 * Raíz de la app: providers (con el host de toasts del tema) y el navegador raíz con el splash
 * animado encima (F1-04).
 */
export default function App() {
  return (
    <Providers>
      <RaizConSplash />
    </Providers>
  );
}
