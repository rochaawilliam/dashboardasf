export function sanitizeError(error: any): string {
  if (import.meta.env.DEV) {
    console.error('Database error:', error);
  }

  const errorStr = String(error?.message || error);
  const errorCode = error?.code;

  const patterns: Record<string, string> = {
    '23505': 'Este registro já existe.',
    'duplicate key': 'Este registro já existe.',
    '23503': 'Operação não permitida devido a dados relacionados.',
    '23502': 'Campos obrigatórios não foram preenchidos.',
    '23514': 'Valor fornecido está fora dos limites permitidos.',
    'violates check constraint': 'Valor fornecido está fora dos limites permitidos.',
    '42501': 'Você não tem permissão para esta operação.',
    'violates row-level security': 'Você não tem permissão para esta operação.',
    'permission denied': 'Você não tem permissão para esta operação.',
    'invalid input syntax': 'Formato de dados inválido.',
    'Invalid login credentials': 'E-mail ou senha inválidos.',
    'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este e-mail já está cadastrado.',
  };

  for (const [pattern, message] of Object.entries(patterns)) {
    if (errorStr.includes(pattern) || errorCode === pattern) {
      return message;
    }
  }

  return 'Ocorreu um erro. Por favor, tente novamente ou contate o suporte.';
}
