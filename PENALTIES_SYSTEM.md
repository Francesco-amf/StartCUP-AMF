# 🚨 Sistema de Penalidades - Documentação Completa

## Visão Geral

O sistema de penalidades permite que **admins** e **avaliadores** atribuam penalidades às equipes por infrações durante o evento. As penalidades são deduzidas dos pontos das equipes e exibidas em tempo real na live dashboard.

---

## 📋 Tipos de Penalidades

| Tipo | Ícone | Nome | Intervalo | Quando Aplicar |
|------|-------|------|-----------|-----------------|
| `plagio` | ⚠️ | Plágio | -50 a -100 pts | Uso de conteúdo de terceiros |
| `desorganizacao` | 📌 | Desorganização | -10 a -30 pts | Entrega desorganizada |
| `desrespeito` | 🚫 | Desrespeito às Regras | -20 a -50 pts | Violação de regras do evento |
| `ausencia` | ❌ | Ausência | -30 a -100 pts | Não comparecimento obrigatório |
| `atraso` | ⏰ | Atraso na Entrega | -5 a -20 pts | Submissão após prazo |

---

## 🗄️ Database Schema

### Tabela: `penalties`

```sql
CREATE TABLE penalties (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL,              -- Equipe que recebeu a penalidade
  penalty_type VARCHAR(50) NOT NULL,  -- Tipo de penalidade (plagio, etc)
  points_deduction INTEGER NOT NULL,  -- Pontos a deduzir
  reason TEXT,                         -- Motivo detalhado
  phase_applied INTEGER,               -- Fase em que foi aplicada
  assigned_by_admin BOOLEAN,           -- True se foi admin, false se foi avaliador
  assigned_by_evaluator_id UUID,       -- ID do avaliador (se não admin)
  assigned_at TIMESTAMP,               -- Quando foi atribuída
  created_at TIMESTAMP
);
```

### Setup SQL

Para criar a tabela no Supabase, execute o arquivo:
```
create-penalties-system.sql
```

---

## 🔌 API Endpoints

### 1. Admin Atribui Penalidade

**Endpoint:** `POST /api/admin/assign-penalty`

**Autenticação:** Admin apenas

**Body:**
```json
{
  "teamId": "uuid-da-equipe",
  "penaltyType": "plagio",
  "pointsDeduction": 75,
  "reason": "Cópia de código da internet"
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "Penalidade aplicada à Equipe Alpha: -75 pontos",
  "penalty": { ... }
}
```

**Resposta (Erro):**
```json
{
  "error": "Dados de penalidade inválidos"
}
```

---

### 2. Avaliador Atribui Penalidade

**Endpoint:** `POST /api/evaluator/assign-penalty`

**Autenticação:** Avaliador autenticado

**Body:**
```json
{
  "teamId": "uuid-da-equipe",
  "penaltyType": "desorganizacao",
  "pointsDeduction": 20,
  "reason": "Arquivo solicitado com formatação inadequada"
}
```

**Resposta:** Igual ao endpoint do admin

---

## 🎨 Componentes Frontend

### 1. PenaltyAssigner (Admin)

**Local:** `src/components/admin/PenaltyAssigner.tsx`

**Props:** Nenhuma

**Features:**
- Dropdown de seleção de equipes
- Botões para selecionar tipo de penalidade
- Slider para ajustar quantidade de pontos
- Campo de motivo (opcional)
- Feedback de sucesso/erro

**Uso:**
```tsx
import PenaltyAssigner from '@/components/admin/PenaltyAssigner'

export default function ControlPanel() {
  return <PenaltyAssigner />
}
```

---

### 2. EvaluatorPenaltyAssigner (Avaliadores)

**Local:** `src/components/evaluator/EvaluatorPenaltyAssigner.tsx`

**Props:** Nenhuma

**Diferenças do Admin:**
- Campo de motivo é **obrigatório**
- Exibe informações de como usar
- Usa cores diferentes (laranja)

**Uso:**
```tsx
import EvaluatorPenaltyAssigner from '@/components/evaluator/EvaluatorPenaltyAssigner'

export default function EvaluatorPanel() {
  return <EvaluatorPenaltyAssigner />
}
```

---

### 3. LivePenaltiesStatus (Live Dashboard)

**Local:** `src/components/dashboard/LivePenaltiesStatus.tsx`

**Features:**
- Exibe últimas 10 penalidades aplicadas
- Atualiza a cada 5 segundos em tempo real
- Mostra equipe, tipo, pontos e motivo
- Indica se foi admin ou avaliador
- Muito Aria-labels para acessibilidade

**Integração automática na live dashboard** ✅

---

## 📊 Integração no Ranking

As penalidades são automaticamente deduzidas do ranking:

1. **Hook:** `usePenalties()` em `src/lib/hooks/usePenalties.ts`
2. **Uso:** Importado no `RankingBoard.tsx`
3. **Display:** Badge com "⚖️ -XX pts" aparece ao lado de cada equipe

```tsx
const { getPenalty } = usePenalties()
const penalty = getPenalty(team.team_id) // Retorna total deduzido
```

---

## 🔄 Fluxo Completo

```
Admin/Avaliador
    ↓
[Seleciona Equipe]
    ↓
[Escolhe Tipo de Penalidade]
    ↓
[Ajusta Pontos (slider)]
    ↓
[Adiciona Motivo]
    ↓
[Clica "Atribuir Penalidade"]
    ↓
Envia POST para /api/admin/assign-penalty
    ↓
API valida dados
    ↓
Insere em tabela 'penalties'
    ↓
✅ Feedback de sucesso
    ↓
Live Dashboard atualiza em tempo real
    ↓
Ranking recalculado com dedução
```

---

## ⚠️ Validações

### Admin Endpoint
- ✅ Verifica se usuário é admin
- ✅ Valida tipo de penalidade
- ✅ Valida intervalo de pontos (0-100)
- ✅ Verifica se equipe existe
- ✅ Usa service_role para garantir acesso

### Evaluator Endpoint
- ✅ Verifica se usuário é avaliador
- ✅ Valida tipo de penalidade
- ✅ Valida intervalo de pontos
- ✅ Verifica se equipe existe
- ✅ Registra qual avaliador atribuiu

---

## 📱 Interface do Admin

```
⚖️ Atribuir Penalidade
┌─────────────────────────────────┐
│ Equipe                          │
│ [Dropdown com lista de equipes] │
├─────────────────────────────────┤
│ Tipo de Penalidade              │
│ [⚠️ Plágio] [📌 Desorg] [🚫 Desc]
│ [❌ Ausência] [⏰ Atraso]        │
├─────────────────────────────────┤
│ Dedução de Pontos: 75 pontos    │
│ [======●========] 50 -------- 100│
├─────────────────────────────────┤
│ Motivo (Opcional)               │
│ [Textarea para descrição]       │
├─────────────────────────────────┤
│ [⚖️ Atribuir Penalidade]         │
└─────────────────────────────────┘
```

---

## 📱 Interface do Avaliador

Idêntica ao admin, mas:
- Campo de motivo é **obrigatório**
- Mensagem "ℹ️ Como Usar" no topo
- Cores em laranja (#FF3D00)

---

## 📺 Live Dashboard

Na sidebar direita, há um card mostrando:

```
⚖️ Penalidades Aplicadas
Últimas penalidades do evento

⚠️ Equipe Alpha           -75pts
   Plágio
   Cópia de código...
   👤 Admin

📌 Equipe Beta           -20pts
   Desorganização
   Arquivo desorganizado
   👨‍🏫 João Silva

Total: 2 penalidades aplicadas
```

Atualiza em tempo real a cada 5 segundos.

---

## 🔗 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `create-penalties-system.sql` | Migration SQL para criar tabela |
| `src/app/api/admin/assign-penalty/route.ts` | API admin |
| `src/app/api/evaluator/assign-penalty/route.ts` | API avaliadores |
| `src/components/admin/PenaltyAssigner.tsx` | UI admin |
| `src/components/evaluator/EvaluatorPenaltyAssigner.tsx` | UI avaliadores |
| `src/components/dashboard/LivePenaltiesStatus.tsx` | Display live dashboard |
| `src/lib/hooks/usePenalties.ts` | Hook para ranking |

---

## 🚀 Como Usar

### Step 1: Criar Tabela no Supabase

1. Abra Supabase Dashboard
2. SQL Editor > New Query
3. Copie conteúdo de `create-penalties-system.sql`
4. Clique Run

### Step 2: Integrar no Admin Panel

```tsx
import PenaltyAssigner from '@/components/admin/PenaltyAssigner'

export default function ControlPanel() {
  return (
    <div>
      {/* Outros componentes */}
      <PenaltyAssigner />
    </div>
  )
}
```

### Step 3: Integrar no Evaluator Panel

```tsx
import EvaluatorPenaltyAssigner from '@/components/evaluator/EvaluatorPenaltyAssigner'

export default function EvaluatorDashboard() {
  return (
    <div>
      {/* Outros componentes */}
      <EvaluatorPenaltyAssigner />
    </div>
  )
}
```

### Step 4: Live Dashboard

Já está automaticamente integrado em `/live-dashboard` ✅

---

## 📊 Exemplo de Uso

### Admin aplica penalidade por plágio:
```
1. Equipe selecionada: "Tech Legends"
2. Tipo: Plágio
3. Pontos: 85
4. Motivo: "Código idêntico ao projeto X da internet"
5. Clica "Atribuir"
→ Deduz 85 pontos de "Tech Legends"
→ Exibe no live dashboard
→ Badge "⚖️ -85pts" aparece no ranking
```

---

## ✅ Build Status

```
✓ Compiled successfully in 3.1s
✓ No TypeScript errors
✓ All components working
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se a tabela foi criada no Supabase
2. Verifique RLS policies na tabela `penalties`
3. Confira se o usuário é realmente admin/avaliador
4. Cheque console do navegador (F12) para erros

---

## 🎯 Próximos Passos Sugeridos

- [ ] Adicionar filtros de penalidades por tipo
- [ ] Adicionar relatório de penalidades por equipe
- [ ] Permitir remoção de penalidades
- [ ] Adicionar limite de penalidades por avaliador
- [ ] Notificações push quando penalidade é aplicada

---

**Sistema de Penalidades v1.0** ✅
Criado: 2025-11-01
