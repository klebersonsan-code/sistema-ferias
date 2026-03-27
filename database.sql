-- Criação da tabela de férias
CREATE TABLE ferias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_colaborador text NOT NULL,
  matricula text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  coordenador text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (opcional, recomendado)
-- ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
