-- Atualização da função de trigger para usar uma mensagem amigável e dinâmica
CREATE OR REPLACE FUNCTION notify_period_change()
RETURNS TRIGGER AS $$
DECLARE
    primeiro_nome text;
    mes_ferias text;
BEGIN
    -- Captura apenas o primeiro nome do colaborador
    primeiro_nome := split_part(NEW.nome_colaborador, ' ', 1);

    -- Converte o mês numérico para o nome por extenso em português
    CASE EXTRACT(MONTH FROM NEW.data_inicio)
        WHEN 1 THEN mes_ferias := 'Janeiro';
        WHEN 2 THEN mes_ferias := 'Fevereiro';
        WHEN 3 THEN mes_ferias := 'Março';
        WHEN 4 THEN mes_ferias := 'Abril';
        WHEN 5 THEN mes_ferias := 'Maio';
        WHEN 6 THEN mes_ferias := 'Junho';
        WHEN 7 THEN mes_ferias := 'Julho';
        WHEN 8 THEN mes_ferias := 'Agosto';
        WHEN 9 THEN mes_ferias := 'Setembro';
        WHEN 10 THEN mes_ferias := 'Outubro';
        WHEN 11 THEN mes_ferias := 'Novembro';
        WHEN 12 THEN mes_ferias := 'Dezembro';
        ELSE mes_ferias := 'um novo período';
    END CASE;

    -- Verifica se ocorreu alguma alteração nas datas
    IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio OR OLD.data_fim IS DISTINCT FROM NEW.data_fim THEN
        INSERT INTO notifications (user_id, message)
        VALUES (
            NEW.matricula,
            primeiro_nome || ', seu período de férias de ' || mes_ferias || ' foi atualizado! Clique para conferir.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
