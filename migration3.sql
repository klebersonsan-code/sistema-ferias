-- Migration 3: Add the observation column for when the employee requests an adjustment
ALTER TABLE ferias ADD COLUMN IF NOT EXISTS observacao_colaborador text;
