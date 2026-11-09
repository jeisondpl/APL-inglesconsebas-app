// Regla de capas de docs/ARQUITECTURA.md impuesta con eslint-plugin-boundaries (política por defecto: prohibir).
//   presentation → aplications → domain ← infrastructure   (siempre dentro del MISMO módulo)
//   Entre módulos no hay imports directos; shared/ y native/ports son comunes; app/ compone todo.
const mismoModulo = {
  captured: { modulo: '{{ from.element.captured.modulo }}' },
};
const capa = (type, extra = {}) => ({ element: { type, ...extra } });

module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['boundaries'],
  settings: {
    'import/resolver': { typescript: { alwaysTryTypes: true }, node: true },
    'boundaries/elements': [
      { type: 'app', pattern: 'src/app' },
      { type: 'shared', pattern: 'src/shared' },
      { type: 'native-port', pattern: 'src/native/ports' },
      { type: 'native-adapter', pattern: 'src/native/adapters' },
      { type: 'domain', pattern: 'src/modules/*/domain', capture: ['modulo'] },
      {
        type: 'aplications',
        pattern: 'src/modules/*/aplications',
        capture: ['modulo'],
      },
      {
        type: 'infrastructure',
        pattern: 'src/modules/*/infrastructure',
        capture: ['modulo'],
      },
      {
        type: 'presentation',
        pattern: 'src/modules/*/presentation',
        capture: ['modulo'],
      },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
      rules: {
        'boundaries/dependencies': [
          2,
          {
            default: 'disallow',
            message:
              'Regla de capas (docs/ARQUITECTURA.md): {{ from.element.types.[0] }} no puede importar de {{ to.element.types.[0] }}',
            policies: [
              // El dominio solo conoce su propio dominio, los tipos compartidos (HttpResponse) y los puertos nativos.
              {
                from: capa('domain'),
                allow: {
                  to: [
                    capa('domain', mismoModulo),
                    capa('shared'),
                    capa('native-port'),
                  ],
                },
              },
              // Casos de uso y controllers: su dominio, lo compartido, puertos nativos y el contenedor (useRepository).
              {
                from: capa('aplications'),
                allow: {
                  to: [
                    capa('aplications', mismoModulo),
                    capa('domain', mismoModulo),
                    capa('shared'),
                    capa('native-port'),
                    capa('app'),
                  ],
                },
              },
              // Adaptadores: implementan el puerto de su dominio con el cliente HTTP compartido.
              {
                from: capa('infrastructure'),
                allow: {
                  to: [
                    capa('infrastructure', mismoModulo),
                    capa('domain', mismoModulo),
                    capa('shared'),
                  ],
                },
              },
              // Pantallas: su controller, los tipos de su dominio y la UI compartida. Nunca infraestructura ni nativo.
              {
                from: capa('presentation'),
                allow: {
                  to: [
                    capa('presentation', mismoModulo),
                    capa('aplications', mismoModulo),
                    capa('domain', mismoModulo),
                    capa('shared'),
                  ],
                },
              },
              {
                from: capa('native-port'),
                allow: { to: [capa('native-port'), capa('shared')] },
              },
              {
                from: capa('native-adapter'),
                allow: {
                  to: [
                    capa('native-adapter'),
                    capa('native-port'),
                    capa('shared'),
                  ],
                },
              },
              { from: capa('shared'), allow: { to: capa('shared') } },
              // La composición (DI, navegación raíz, providers) puede ver todo.
              {
                from: capa('app'),
                allow: {
                  to: [
                    capa('app'),
                    capa('shared'),
                    capa('native-port'),
                    capa('native-adapter'),
                    capa('domain'),
                    capa('aplications'),
                    capa('infrastructure'),
                    capa('presentation'),
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  ],
};
