# 🪙 Contador de AMF Coins com Histórico Detalhado

## 📋 Visão Geral

Nova funcionalidade que exibe um histórico completo de todas as transações de AMF Coins da equipe, incluindo:
- ✅ **Ganhos** de submissions avaliadas
- ⚠️ **Perdas** por penalidades
- 🆘 **Gastos** com chamadas de mentoria
- 🎁 **Bônus** e outros ajustes

## 🎯 Características

### Interface Visual

- **Cartão Destacado**: Design com gradiente dourado destacando AMF Coins
- **Saldo Atual**: Valor total sempre visível no topo
- **Histórico Expansível**: Botão para mostrar/ocultar detalhes
- **Timeline Reversa**: Transações mais recentes primeiro
- **Saldo Progressivo**: Cada transação mostra o saldo acumulado

### Categorias de Transações

#### 1. **Submissions Avaliadas** (Verde/Positivo)
- Ícone: ✅
- Descrição: "Quest avaliada: [Nome da Quest]"
- Valor: +X AMF Coins
- Data: Timestamp da criação da submission

#### 2. **Penalidades** (Vermelho/Negativo)
- Ícone: ⚠️
- Tipos reconhecidos:
  - `plagiarism` → "Plágio"
  - `late_submission` → "Entrega Atrasada"
  - `inappropriate_behavior` → "Comportamento Inadequado"
  - `rule_violation` → "Violação de Regras"
- Descrição: Motivo opcional
- Valor: -X AMF Coins

#### 3. **Ajustes de Coins** (Verde/Vermelho)
- **Chamada de Mentor** 🆘 (Negativo)
  - `reason = 'mentor_request'`
  - Custo progressivo: 5, 10, 20, 35, 55...
- **Bônus** 🎁 (Positivo)
  - `reason = 'bonus'`
  - Admin pode dar bônus especiais
- **Devolução** ↩️ (Positivo)
  - `reason = 'penalty_refund'`
  - Reversão de penalidades

### Estatísticas Resumidas

No final do histórico:
- **Total Ganho**: Soma de todos os valores positivos (verde)
- **Total Perdido**: Soma de todos os valores negativos (vermelho)

## 📂 Arquivos Criados/Modificados

### Novo Componente

**`src/components/team/AMFCoinsHistory.tsx`** (281 linhas)
- Componente React Client Component
- Integração com Supabase
- UI responsiva e interativa
- Lógica de cálculo de saldo progressivo

### Modificações

**`src/app/(team)/dashboard/page.tsx`**
- Import do novo componente
- Adicionado ao Accordion como primeira seção
- Props: `teamId` e `currentTotalCoins`

## 🔗 Dependências de Dados

### Tabelas Consultadas

1. **`coin_adjustments`**
   ```sql
   SELECT * FROM coin_adjustments 
   WHERE team_id = ? 
   ORDER BY created_at DESC
   ```
   - Campos: `id`, `amount`, `reason`, `created_at`, `reference_id`

2. **`submissions`** (apenas avaliadas)
   ```sql
   SELECT s.*, q.name 
   FROM submissions s
   LEFT JOIN quests q ON s.quest_id = q.id
   WHERE s.team_id = ? AND s.status = 'evaluated'
   ORDER BY s.created_at DESC
   ```
   - Campos: `quest_id`, `final_points`, `status`, `created_at`
   - Join: `quests.name`

3. **`penalties`**
   ```sql
   SELECT * FROM penalties 
   WHERE team_id = ? 
   ORDER BY created_at DESC
   ```
   - Campos: `penalty_type`, `points_deduction`, `reason`, `created_at`

## 🎨 Design System

### Cores

- **Dourado** (`#FFD700`): Tema principal para AMF Coins
- **Verde** (`green-400/500`): Ganhos/valores positivos
- **Vermelho** (`red-400/500`): Perdas/valores negativos
- **Fundo**: Gradiente azul escuro (consistente com dashboard)

### Layout

```
┌─────────────────────────────────────────┐
│ 🪙 Histórico de AMF Coins  │ Saldo: 150 │
│ Ganhos, perdas e saldo atual            │
├─────────────────────────────────────────┤
│      📜 Ver Histórico Detalhado         │
├─────────────────────────────────────────┤
│ [Quando expandido:]                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Quest avaliada: Quest 1          │ │
│ │ 05/11/2025, 14:30                   │ │
│ │                         +50  [150]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🆘 Chamada de Mentor                │ │
│ │ 05/11/2025, 14:00                   │ │
│ │                         -10  [100]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────────┬───────────────────┐   │
│ │ Total Ganho   │ Total Perdido    │   │
│ │    +200       │     -50          │   │
│ └───────────────┴───────────────────┘   │
└─────────────────────────────────────────┘
```

## 🚀 Como Usar

### Para Equipes

1. **Acessar Dashboard**: Logar como equipe
2. **Expandir Seção**: Clicar no Accordion "🪙 Histórico de AMF Coins"
3. **Ver Detalhes**: Clicar em "📜 Ver Histórico Detalhado"
4. **Analisar**: Rolar pelo histórico cronológico
5. **Verificar Resumo**: Ver totais no final

### Para Administradores

**Adicionar Bônus Manual:**
```sql
INSERT INTO coin_adjustments (team_id, amount, reason)
VALUES (
  'uuid-da-equipe',
  50,  -- Bônus de 50 coins
  'bonus'
);
```

**Reverter Penalidade:**
```sql
INSERT INTO coin_adjustments (team_id, amount, reason)
VALUES (
  'uuid-da-equipe',
  15,  -- Devolver coins da penalidade
  'penalty_refund'
);
```

## 🔍 Lógica de Cálculo

### Saldo Progressivo (Running Balance)

O componente calcula o saldo acumulado de forma reversa:

```typescript
// 1. Inverter array (mais antigo primeiro)
const reversed = [...allTransactions].reverse()

// 2. Calcular saldo acumulado
let runningBalance = 0
reversed.forEach(transaction => {
  runningBalance += transaction.amount
  transaction.balance = runningBalance
})

// 3. Re-inverter para exibir (mais recente primeiro)
return reversed.reverse()
```

**Exemplo:**
```
Data       | Descrição         | Valor | Saldo
-----------|-------------------|-------|------
05/11 10h  | Quest avaliada    | +100  | 100
05/11 11h  | Chamada mentor    | -5    | 95
05/11 12h  | Quest avaliada    | +50   | 145
05/11 13h  | Penalidade        | -15   | 130
                                Saldo Final: 130
```

### Integração com `live_ranking`

O saldo atual (`currentTotalCoins`) vem do cálculo da view:

```sql
CREATE VIEW live_ranking AS
SELECT
  ...
  COALESCE(SUM(s.final_points), 0)    -- Submissions
    - COALESCE(SUM(p.points_deduction), 0)  -- Penalidades
    + COALESCE(SUM(ca.amount), 0)     -- Ajustes (coin_adjustments)
  as total_points
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
```

## ⚙️ Configuração

### RLS (Row Level Security)

As políticas já existentes garantem segurança:

**`coin_adjustments`:**
```sql
-- Equipes só veem seus próprios ajustes
CREATE POLICY "Teams can view their own coin adjustments" 
  ON coin_adjustments FOR SELECT 
  TO authenticated 
  USING (
    team_id = (SELECT id FROM teams WHERE email = auth.jwt()->>'email')
    OR EXISTS (SELECT 1 FROM teams WHERE email = auth.jwt()->>'email' AND course = 'Administration')
  );
```

## 🧪 Testes

### Cenário 1: Histórico Vazio
- **Estado**: Equipe nova sem transações
- **Exibição**: "📭 Nenhuma transação ainda"

### Cenário 2: Somente Submissions
- **Estado**: 3 quests avaliadas (50, 75, 100 coins)
- **Exibição**: 3 entradas verdes com saldo progressivo (50 → 125 → 225)
- **Resumo**: Total Ganho: +225, Total Perdido: 0

### Cenário 3: Transações Mistas
- **Estado**: 
  - Quest 1: +100 coins
  - Mentor: -5 coins
  - Quest 2: +50 coins
  - Penalidade: -15 coins
- **Exibição**: 4 entradas (2 verdes, 2 vermelhas)
- **Saldo Final**: 130 coins
- **Resumo**: Total Ganho: +150, Total Perdido: -20

## 📱 Responsividade

- **Mobile** (< 640px): Layout vertical compacto, texto menor
- **Tablet** (640px - 1024px): Layout padrão
- **Desktop** (> 1024px): Padding aumentado, texto maior

## 🎯 Próximas Melhorias (Opcional)

- [ ] Filtros por tipo de transação
- [ ] Exportar histórico em CSV
- [ ] Gráfico de linha mostrando evolução temporal
- [ ] Comparação com média das outras equipes
- [ ] Notificações de mudanças significativas
- [ ] Paginação para históricos muito longos

## 📊 Métricas de Performance

- **Queries**: 3 SELECT (coin_adjustments, submissions, penalties)
- **Renderização**: Client-side (dados carregados sob demanda)
- **Lazy Loading**: Dados só carregados quando usuário expande
- **Cache**: Supabase gerencia cache automaticamente

## ✅ Checklist de Implementação

- [x] Criar componente `AMFCoinsHistory.tsx`
- [x] Integrar no dashboard da equipe
- [x] Consultar `coin_adjustments`, `submissions`, `penalties`
- [x] Implementar cálculo de saldo progressivo
- [x] Design visual com cores diferenciadas
- [x] Estatísticas resumidas
- [x] Formatação de datas em português
- [x] Loading state e empty state
- [x] Responsividade mobile
- [x] Verificação de erros TypeScript

---

**Status**: ✅ **Implementação Completa**  
**Arquivos**: 2 modificados, 1 criado  
**Linhas de Código**: ~280 linhas  
**Pronto para Produção**: Sim
