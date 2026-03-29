-- Criação da tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL, -- Vinculado à matrícula do colaborador (como na tabela ferias)
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da função de trigger
CREATE OR REPLACE FUNCTION notify_period_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se ocorreu alguma alteração nas datas
    IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio OR OLD.data_fim IS DISTINCT FROM NEW.data_fim THEN
        INSERT INTO notifications (user_id, message)
        VALUES (
            NEW.matricula,
            'Atenção: Seu período de férias foi alterado. Novo período: ' || TO_CHAR(NEW.data_inicio, 'DD/MM/YYYY') || ' até ' || TO_CHAR(NEW.data_fim, 'DD/MM/YYYY') || '.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação do trigger
DROP TRIGGER IF EXISTS trigger_notify_period_change ON ferias;
CREATE TRIGGER trigger_notify_period_change
AFTER UPDATE ON ferias
FOR EACH ROW
EXECUTE FUNCTION notify_period_change();
