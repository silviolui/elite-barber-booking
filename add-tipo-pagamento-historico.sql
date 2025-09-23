-- Adicionar coluna tipo_pagamento na tabela historico
ALTER TABLE public.historico 
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(50);

-- Comentário descrevendo a coluna
COMMENT ON COLUMN public.historico.tipo_pagamento IS 'Tipo de pagamento utilizado (PIX, Cartão de Crédito, Cartão de Débito, Dinheiro)';

-- Verificar a estrutura atualizada da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'historico' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
