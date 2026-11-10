import Toast, { BaseToast, type ToastConfig } from 'react-native-toast-message';

import { NavegadorRaiz } from '@/app/navigation';
import { Providers } from '@/app/providers';

/**
 * Host de los toasts de `notify`: el componente de la librería, sin estilos de marca. La librería
 * no trae el tipo `warning`, así que se registra con su toast base.
 */
const configuracionToasts: ToastConfig = {
  warning: props => <BaseToast {...props} />,
};

export default function App() {
  return (
    <>
      <Providers>
        <NavegadorRaiz />
      </Providers>
      <Toast config={configuracionToasts} />
    </>
  );
}
