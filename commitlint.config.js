// Conventional Commits en español (docs/CALIDAD.md). Se añade el tipo «merge» que usa el desplegador.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'merge',
      ],
    ],
    // Los asuntos en español pueden empezar con siglas o nombres propios (API, PIN, Leap).
    'subject-case': [0],
  },
};
