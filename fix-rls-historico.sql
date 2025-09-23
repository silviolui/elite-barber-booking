-- Primeiro, adicionar a coluna tipo_pagamento se não existir
ALTER TABLE public.historico 
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(50);

-- Verificar policies atuais da tabela historico
SELECT * FROM pg_policies WHERE tablename = 'historico';

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own history" ON public.historico;
DROP POLICY IF EXISTS "Admins can view all history" ON public.historico;
DROP POLICY IF EXISTS "Users can insert own history" ON public.historico;
DROP POLICY IF EXISTS "Admins can insert all history" ON public.historico;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.historico;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.historico;

-- Desabilitar RLS temporariamente para debug
ALTER TABLE public.historico DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

-- Criar nova policy para admins poderem inserir qualquer registro
CREATE POLICY "Admin can insert all history" 
ON public.historico FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_usuarios au
    WHERE au.user_id = auth.uid()
  )
);

-- Criar nova policy para admins poderem ver todos os registros
CREATE POLICY "Admin can select all history" 
ON public.historico FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_usuarios au
    WHERE au.user_id = auth.uid()
  )
);

-- Criar policy para usuários verem apenas seu próprio histórico
CREATE POLICY "Users can select own history" 
ON public.historico FOR SELECT 
TO authenticated 
USING (usuario_id = auth.uid());

-- Verificar se as policies foram criadas
SELECT * FROM pg_policies WHERE tablename = 'historico';

-- Testar inserção direta para debug
-- INSERT INTO public.historico (
--   agendamento_id, usuario_id, profissional_id, unidade_id, servico_id,
--   data_agendamento, horario_inicio, horario_fim, status, valor_total,
--   tipo_pagamento, forma_pagamento, data_conclusao
-- ) VALUES (
--   999, 'test-user-id', 1, 1, 1,
--   '2024-01-15', '10:00', '10:30', 'concluido', 30.00,
--   'pix', 'pix', NOW()
-- );
