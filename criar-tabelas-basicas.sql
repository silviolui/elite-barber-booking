-- CRIAR TABELAS BÁSICAS SE NÃO EXISTIREM
-- Execute se o diagnóstico mostrar que as tabelas não existem

-- 1. CRIAR TABELA UNIDADES
CREATE TABLE IF NOT EXISTS public.unidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA PROFISSIONAIS  
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    unidade_id UUID REFERENCES unidades(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA SERVIÇOS
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    duracao INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA AGENDAMENTOS  
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID,
    profissional_id UUID REFERENCES profissionais(id),
    unidade_id UUID REFERENCES unidades(id), 
    data_agendamento DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    preco_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERIR DADOS DE TESTE
INSERT INTO unidades (id, nome, endereco) VALUES 
('c64e6922-fa59-4941-9925-2e52bf583443', 'BookIA - Boulevard Shopping Camaçari', 'Boulevard Shopping Camaçari')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profissionais (nome, unidade_id) VALUES 
('Carlos Silva', 'c64e6922-fa59-4941-9925-2e52bf583443')
ON CONFLICT DO NOTHING;

INSERT INTO servicos (nome, preco) VALUES 
('Corte Masculino', 25.00),
('Barba', 15.00)
ON CONFLICT DO NOTHING;

-- 6. DESABILITAR RLS
ALTER TABLE unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais DISABLE ROW LEVEL SECURITY; 
ALTER TABLE servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

SELECT 'Tabelas criadas e RLS desabilitado!' as status;
