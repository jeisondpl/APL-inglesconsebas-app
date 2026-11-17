/**
 * Tipos crudos de auth.php de Leap (rama F1-02). Solo se tipan los campos que usa la App: el resto
 * (pkg, tokensUsed, cycle, email, diag…) se ignora.
 */
export type RolLeap = 'admin' | 'teacher' | 'student';

export interface ILeapPersona {
  id: string | number;
  name: string;
  username?: string;
}

/** POST auth.php (login). El admin solo trae `role`. Sin F1-02 no hay `token`. */
export interface ILeapLogin {
  role: RolLeap;
  teacher?: ILeapPersona;
  student?: ILeapPersona;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: string;
  renewAfter?: string | null;
}

/** GET auth.php?action=me. */
export interface ILeapMe {
  role: RolLeap;
  expiresAt?: string;
  teacher?: ILeapPersona;
  student?: ILeapPersona;
  admin?: ILeapPersona;
}

/** POST auth.php?action=renew. */
export interface ILeapRenovacion {
  token?: string;
  expiresAt?: string;
  renewAfter?: string | null;
}
