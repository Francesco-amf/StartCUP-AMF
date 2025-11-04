# 🆘 SISTEMA DE CHAMADA PAGA DE MENTORES - GUIA DE IMPLEMENTAÇÃO

## 📋 **O QUE FOI CRIADO**

### **1. SQL (`CREATE_MENTOR_REQUEST_SYSTEM.sql`)** ✅
- ✅ Tabela `mentor_requests` para registrar solicitações
- ✅ Função `calculate_mentor_request_cost()` - calcula custo progressivo
- ✅ Função `is_mentor_online()` - verifica disponibilidade
- ✅ Função `request_mentor()` - cria solicitação e deduz coins
- ✅ RLS policies para segurança
- ✅ Índices para performance

### **2. Frontend (`MentorRequestButton.tsx`)** ✅
- ✅ Componente modal para selecionar mentor
- ✅ Lista de mentores online com badges
- ✅ Campo para descrever dúvida (opcional)
- ✅ Validação de saldo de AMF Coins
- ✅ Feedback visual de sucesso/erro

### **3. API Routes** ✅
- ✅ `/api/mentor/calculate-cost` - calcula custo da próxima chamada
- ✅ `/api/mentor/request` - cria solicitação e deduz coins

---

## 🚀 **PASSOS PARA IMPLEMENTAR**

### **PASSO 1: Executar SQL no Supabase** 🗄️

1. Abra **Supabase Dashboard** → **SQL Editor**
2. Execute o arquivo `CREATE_MENTOR_REQUEST_SYSTEM.sql` completo
3. Verifique se tabelas e funções foram criadas:
   ```sql
   -- Verificar tabela
   SELECT * FROM mentor_requests LIMIT 1;
   
   -- Testar função de custo
   SELECT calculate_mentor_request_cost('00000000-0000-0000-0000-000000000000'::uuid, 1);
   ```

### **PASSO 2: Ajustar dedução de AMF Coins** ⚠️

**IMPORTANTE:** A função `request_mentor()` no SQL precisa ser ajustada para deduzir coins corretamente.

Atualmente a função tem este placeholder (linhas 124-131):
```sql
-- 6. Deduzir coins da equipe
-- IMPORTANTE: Ajustar conforme sua estrutura de pontuação
UPDATE teams SET updated_at = NOW() WHERE id = p_team_id;

-- Você precisará implementar a dedução de coins conforme sua estrutura
-- Por exemplo, se tiver uma tabela de transações:
-- INSERT INTO coin_transactions (team_id, amount, type, description)
-- VALUES (p_team_id, -v_cost, 'mentor_request', 'Solicitação de mentoria');
```

**Você precisa decidir como deduzir coins:**

**Opção A: Se coins estão em `live_ranking` (view):**
- Coins são calculados dinamicamente, então você precisa criar uma tabela de **ajustes**:
  ```sql
  CREATE TABLE coin_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    amount INTEGER, -- negativo para dedução
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  -- Inserir dedução
  INSERT INTO coin_adjustments (team_id, amount, reason)
  VALUES (p_team_id, -v_cost, 'Solicitação de mentoria');
  
  -- Atualizar live_ranking view para incluir ajustes
  ```

**Opção B: Se coins estão em campo direto na tabela `teams`:**
  ```sql
  UPDATE teams 
  SET coins = coins - v_cost
  WHERE id = p_team_id;
  ```

**👉 Escolha a opção que se encaixa na sua estrutura e atualize a função!**

### **PASSO 3: Adicionar campo `is_online` (Opcional)** 🟢

Se você quer filtrar apenas mentores online, adicione campo na tabela `teams`:

```sql
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Ou se mentores estão em tabela separada 'evaluators':
ALTER TABLE evaluators ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
```

Depois, ajuste a função `is_mentor_online()` no SQL (linhas 70-94) para usar este campo.

### **PASSO 4: Integrar componente no dashboard** 🎨

Adicione o `MentorRequestButton` no dashboard das equipes:

```tsx
// Exemplo: src/app/(team)/dashboard/page.tsx

import MentorRequestButton from '@/components/MentorRequestButton'

// Dentro do componente da página:
const [teamCoins, setTeamCoins] = useState(0)
const [currentPhase, setCurrentPhase] = useState(0)

// Buscar dados da equipe...
useEffect(() => {
  // Buscar coins e fase atual
  const fetchTeamData = async () => {
    const { data: ranking } = await supabase
      .from('live_ranking')
      .select('total_points')
      .eq('team_id', teamId)
      .single()
    
    setTeamCoins(ranking?.total_points || 0)
    
    const { data: eventConfig } = await supabase
      .from('event_config')
      .select('current_phase')
      .single()
    
    setCurrentPhase(eventConfig?.current_phase || 0)
  }
  
  fetchTeamData()
}, [])

// No JSX:
<MentorRequestButton 
  currentPhase={currentPhase} 
  teamCoins={teamCoins} 
/>
```

### **PASSO 5: Adicionar limpeza no RESET** 🧹

Adicione ao arquivo `RESET_SYSTEM_COMPLETO.sql`:

```sql
-- Após a seção de power_ups:

-- ========================================
-- X. DELETAR MENTOR REQUESTS
-- ========================================
BEGIN
  DELETE FROM mentor_requests;
  RAISE NOTICE '✅ Mentor requests deletadas';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE '⚠️ Tabela mentor_requests não existe';
END;
```

---

## 🧪 **TESTES**

### **Teste 1: Calcular custo progressivo**
```sql
-- Simular 5 chamadas e ver custos
DO $$
DECLARE
  team_id UUID := '00000000-0000-0000-0000-000000000000';
  phase INT := 1;
  cost INT;
BEGIN
  -- 1ª chamada (deve ser 5)
  SELECT calculate_mentor_request_cost(team_id, phase) INTO cost;
  RAISE NOTICE '1ª chamada: % coins', cost;
  
  -- Simular insert
  INSERT INTO mentor_requests (team_id, mentor_id, phase, amf_coins_cost, request_number)
  VALUES (team_id, team_id, phase, cost, 1);
  
  -- 2ª chamada (deve ser 10)
  SELECT calculate_mentor_request_cost(team_id, phase) INTO cost;
  RAISE NOTICE '2ª chamada: % coins', cost;
  
  -- Simular insert
  INSERT INTO mentor_requests (team_id, mentor_id, phase, amf_coins_cost, request_number)
  VALUES (team_id, team_id, phase, cost, 2);
  
  -- 3ª chamada (deve ser 20)
  SELECT calculate_mentor_request_cost(team_id, phase) INTO cost;
  RAISE NOTICE '3ª chamada: % coins', cost;
  
  -- Limpar teste
  DELETE FROM mentor_requests WHERE team_id = team_id;
END $$;
```

### **Teste 2: Frontend**
1. Abra dashboard da equipe
2. Clique em "🆘 Chamar Mentor"
3. Verificar se mentores aparecem
4. Verificar se custo está correto
5. Selecionar mentor e enviar
6. Verificar se coins foram deduzidos

### **Teste 3: API**
```bash
# Calcular custo
curl -X POST http://localhost:3000/api/mentor/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{"phase": 1}'

# Solicitar mentor
curl -X POST http://localhost:3000/api/mentor/request \
  -H "Content-Type: application/json" \
  -d '{"mentorId": "UUID_DO_MENTOR", "phase": 1, "notes": "Preciso de ajuda"}'
```

---

## 📊 **PROGRESSÃO DE CUSTOS**

| Chamada | Custo (AMF Coins) |
|---------|-------------------|
| 1ª      | 5                 |
| 2ª      | 10                |
| 3ª      | 20                |
| 4ª      | 35                |
| 5ª      | 55                |
| 6ª      | 80                |
| 7ª      | 110               |
| 8ª      | 145               |

**Fórmula:** `custo_atual + (5 × número_da_chamada)`

---

## 🎯 **FUNCIONALIDADES EXTRAS (Futuro)**

- [ ] Notificação push para mentores quando recebem solicitação
- [ ] Painel do mentor para aceitar/recusar solicitações
- [ ] Timer para mentoria (15min)
- [ ] Rating da mentoria pós-sessão
- [ ] Histórico de mentorias no dashboard
- [ ] Estatísticas: mentor mais solicitado, etc.

---

## ⚠️ **ATENÇÃO - CHECKLIST FINAL**

Antes de ir para produção:

- [ ] SQL executado no Supabase
- [ ] Dedução de coins implementada corretamente
- [ ] Campo `is_online` adicionado (se necessário)
- [ ] Componente integrado no dashboard
- [ ] Limpeza adicionada ao reset
- [ ] Testes realizados em ambiente de dev
- [ ] RLS policies verificadas
- [ ] Performance testada com múltiplas equipes

---

## 🆘 **TROUBLESHOOTING**

**Erro: "Função calculate_mentor_request_cost não existe"**
- Execute o SQL completo no Supabase SQL Editor

**Erro: "AMF Coins não foram deduzidos"**
- Verifique implementação da dedução na função `request_mentor()` (linhas 124-131)

**Mentores não aparecem na lista**
- Verifique se existem usuários com `course = 'Avaliação'` na tabela `teams`
- Se usar campo `is_online`, verifique se está `true`

**Custo aparece errado**
- Verifique se a chamada à API `/api/mentor/calculate-cost` está funcionando
- Teste a função SQL diretamente

---

**Criado em:** 04/11/2025  
**Autor:** AI Assistant  
**Status:** ✅ Pronto para implementação (com ajustes de dedução de coins)
