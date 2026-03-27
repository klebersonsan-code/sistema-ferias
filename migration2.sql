-- 1. Remover a restrição antiga (se existir e foi criada com tamanho padrão pelo Postgres)
DO $$
BEGIN
  BEGIN
    ALTER TABLE ferias DROP CONSTRAINT ferias_status_check;
  EXCEPTION
    WHEN undefined_object THEN
      -- Se não existir a constraint ou o nome for diferente, será ignorado para evitar interromper o fluxo
  END;
END $$;

-- 2. Adicionar a nova coluna para Adiantamento de 13º
ALTER TABLE ferias ADD COLUMN IF NOT EXISTS adiantamento_decimo boolean DEFAULT false;
