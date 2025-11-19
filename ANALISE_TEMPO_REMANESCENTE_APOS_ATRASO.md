# 🔍 ANÁLISE: Sistema de Tempo Remanescente Após Atraso

**Data:** 19 de Novembro de 2025  
**Status:** ⚠️ **PROBLEMA IDENTIFICADO - SISTEMA NÃO FUNCIONA COMO ESPERADO**

---

## 📋 COMPORTAMENTO ESPERADO (Seu Pedido)

### Cenário Ideal:

```
Quest 1.1 inicia: 13:30
Duração: 60 minutos
Janela de atraso: 15 minutos

EQUIPE A (no prazo):
- Submete em: 13:45 (15 min após início)
- Tempo usado: 15 minutos
- Quest 1.2 inicia para EQUIPE A: 13:45
- Tempo disponível para Quest 1.2: 50 minutos (duração original)
- Prazo Quest 1.2 para EQUIPE A: 14:35 (13:45 + 50 min)

EQUIPE B (atrasada):
- Submete em: 14:40 (70 min após início, 10 min de atraso)
- Tempo usado: 70 minutos
- Quest 1.2 inicia para EQUIPE B: 14:40
- Tempo disponível para Quest 1.2: 40 minutos (50 - 10 min de atraso)
- Prazo Quest 1.2 para EQUIPE B: 15:20 (14:40 + 40 min)
```

**Resumo:** Equipe que atrasa perde esse tempo na próxima quest.

---

## ❌ COMPORTAMENTO ATUAL DO SISTEMA

### Como funciona REALMENTE:

```
Quest 1.1 inicia: 13:30 (para TODAS as equipes)
Duração: 60 minutos
Janela de atraso: 15 minutos

EQUIPE A (no prazo):
- Submete em: 13:45 (15 min após início)
- Quest 1.2 NÃO inicia imediatamente
- Aguarda até Quest 1.1 expirar TOTALMENTE: 14:45 (13:30 + 60 + 15)
- Quest 1.2 inicia: 14:45 (para TODAS as equipes)
- Tempo disponível: 50 minutos
- Prazo Quest 1.2: 15:35 (14:45 + 50 min)

EQUIPE B (atrasada):
- Submete em: 14:40 (70 min após início, 10 min de atraso)
- Quest 1.2 inicia: 14:45 (MESMA HORA que Equipe A)
- Tempo disponível: 50 minutos (MESMA DURAÇÃO que Equipe A)
- Prazo Quest 1.2: 15:35 (MESMO PRAZO que Equipe A)
```

**Resumo:** TODAS as equipes avançam para a próxima quest NO MESMO MOMENTO, independente de quando submeteram.

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### **O sistema atual NÃO implementa "tempo remanescente individual por equipe"**

**Arquitetura do problema:**

1. **Quests são GLOBAIS, não por equipe**
   - `quests.started_at` é um timestamp ÚNICO
   - Todas as equipes veem a MESMA quest com o MESMO `started_at`
   - Não existe `quest_started_at_per_team`

2. **Avanço de quest é GLOBAL**
   - Função `/api/admin/advance-quest` **FECHA** a quest atual
   - Depois **INICIA** a próxima quest (com `NOW()` como `started_at`)
   - Isso acontece **UMA VEZ** para todas as equipes

3. **Cron `auto_start_next_quest` é GLOBAL**
   - Roda a cada 1 minuto
   - Verifica se quest atual expirou **TOTALMENTE** (prazo + 15 min janela)
   - Se sim, inicia próxima quest **PARA TODOS**

### Código que prova isso:

**Arquivo:** `src/app/api/admin/advance-quest/route.ts` (linha ~127)
```typescript
// Ativar próxima quest
const { error: startNextQuestError } = await supabaseAdmin
  .rpc('activate_quest', { 
    p_quest_id: nextQuest.id 
  })
```

**RPC `activate_quest`:**
```sql
UPDATE quests
SET status = 'active',
    started_at = NOW()  -- ❌ MESMO timestamp para TODAS as equipes
WHERE id = p_quest_id;
```

**Função `auto_start_next_quest()` (linha ~112):**
```sql
-- Iniciar próxima quest
UPDATE quests
SET started_at = NOW(),  -- ❌ GLOBAL
    status = 'active'
WHERE id = v_quest_to_start_id;
```

---

## 🎯 O QUE FUNCIONA ATUALMENTE

### Janela de Atraso (15 minutos):

✅ **Funciona CORRETAMENTE para:**
- Permitir submissão após deadline regular
- Aplicar penalidades progressivas (5, 10, 15 pontos)
- Bloquear submissões após janela expirar

### Sistema de Penalidades:

✅ **Funciona CORRETAMENTE:**
```
Quest 1.1 deadline: 14:30
Janela de atraso: até 14:45

Equipe submete em:
- 14:33 → Penalidade: -5 pontos
- 14:38 → Penalidade: -10 pontos
- 14:43 → Penalidade: -15 pontos
- 14:46 → BLOQUEADO
```

### Período de Avaliação Final (20 minutos):

✅ **Funciona CORRETAMENTE:**
- Após última quest da Fase 5
- 20 minutos adicionais (15 late submission + 5 avaliação)
- Countdown de 60 segundos antes de encerrar

---

## ❌ O QUE NÃO FUNCIONA

### Tempo Remanescente Individual:

❌ **NÃO implementado:**
- Equipes que atrasam **NÃO** perdem tempo na próxima quest
- Todas as equipes têm o **MESMO prazo** para cada quest
- Não existe lógica de "quest duration - late minutes"

### Exemplo Real:

```
Quest 1.1:
- Duração: 60 min
- Inicia: 13:30
- Deadline: 14:30
- Late window: até 14:45

Equipe A submete: 13:50 (20 min, no prazo)
Equipe B submete: 14:40 (70 min, 10 min de atraso, -10 pontos)

Quest 1.2 inicia: 14:45 (para AMBAS)
Quest 1.2 duração: 50 min (para AMBAS)
Quest 1.2 deadline: 15:35 (para AMBAS)

❌ Equipe B NÃO tem prazo reduzido
✅ Equipe B só perde 10 pontos de penalidade
```

---

## 🏗️ ARQUITETURA NECESSÁRIA PARA IMPLEMENTAR

Para implementar "tempo remanescente individual", seria necessário:

### **Opção 1: Quest Instances por Equipe**

```sql
CREATE TABLE team_quest_instances (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  quest_id UUID REFERENCES quests(id),
  started_at TIMESTAMP,
  deadline_at TIMESTAMP,  -- Calculado: started_at + (duration - late_minutes)
  late_minutes INTEGER DEFAULT 0,
  status VARCHAR
);
```

**Fluxo:**
1. Equipe A submete Quest 1.1 em 15 min (no prazo)
   - Criar `team_quest_instances` para Equipe A:
     - `quest_id`: Quest 1.2
     - `started_at`: 13:45
     - `deadline_at`: 14:35 (13:45 + 50 min)

2. Equipe B submete Quest 1.1 em 70 min (10 min atraso)
   - Criar `team_quest_instances` para Equipe B:
     - `quest_id`: Quest 1.2
     - `started_at`: 14:40
     - `deadline_at`: 15:20 (14:40 + 40 min)
     - `late_minutes_carried`: 10

---

### **Opção 2: Tabela de Progresso por Equipe**

```sql
CREATE TABLE team_quest_progress (
  team_id UUID,
  quest_id UUID,
  activated_at TIMESTAMP,
  custom_deadline_minutes INTEGER,  -- Duração ajustada
  accumulated_late_minutes INTEGER DEFAULT 0,
  PRIMARY KEY (team_id, quest_id)
);
```

**Lógica:**
```typescript
// Quando equipe submete com atraso
const lateMinutes = calculateLateMinutes(submission)
const nextQuestDuration = 50 // duração original
const adjustedDuration = Math.max(0, nextQuestDuration - lateMinutes)

await supabase
  .from('team_quest_progress')
  .insert({
    team_id: teamId,
    quest_id: nextQuestId,
    activated_at: NOW(),
    custom_deadline_minutes: adjustedDuration
  })
```

---

### **Opção 3: Modificar Sistema Atual (Mais Simples)**

**Adicionar lógica na API de submissão:**

```typescript
// /api/submissions/create (após submissão com atraso)
if (isLate && lateMinutes > 0) {
  // Buscar próxima quest
  const nextQuest = await getNextQuest(currentQuestId)
  
  // Reduzir duração da próxima quest APENAS para esta equipe
  await supabase
    .from('team_custom_deadlines')
    .insert({
      team_id: teamId,
      quest_id: nextQuest.id,
      penalty_minutes: lateMinutes,
      adjusted_deadline_minutes: nextQuest.planned_deadline_minutes - lateMinutes
    })
}

// Componente SubmissionDeadlineStatus.tsx
// Buscar deadline customizado para a equipe
const customDeadline = await supabase
  .from('team_custom_deadlines')
  .select('adjusted_deadline_minutes')
  .eq('team_id', teamId)
  .eq('quest_id', questId)
  .single()

const effectiveDeadline = customDeadline 
  ? customDeadline.adjusted_deadline_minutes 
  : quest.planned_deadline_minutes
```

---

## 📊 COMPARAÇÃO: Atual vs Esperado

| Aspecto | Sistema Atual | Sistema Esperado |
|---------|--------------|------------------|
| **Janela de Atraso (15 min)** | ✅ Funciona | ✅ Mantém |
| **Penalidades Progressivas** | ✅ Funciona (-5, -10, -15 pts) | ✅ Mantém |
| **Tempo Remanescente Individual** | ❌ NÃO existe | ⚠️ Precisa implementar |
| **Quest Global** | ✅ Todas equipes mesma quest | ⚠️ Manter, mas com deadline individual |
| **Próxima Quest Inicia** | Quando deadline + 15 min expira | Quando equipe submete (individual) |
| **Deadline Próxima Quest** | Mesmo para todas equipes | Reduzido pelo atraso |

---

## 🎯 COMPORTAMENTO ATUAL É CORRETO?

### **SIM** para:
✅ Janela de atraso de 15 minutos (compensação)  
✅ Penalidades progressivas  
✅ Bloqueio após janela expirar  
✅ Período de avaliação de 20 minutos no final  

### **NÃO** para:
❌ Tempo remanescente individual por equipe  
❌ Equipe atrasada perde tempo na próxima quest  

---

## 🔧 DECISÃO NECESSÁRIA

Você precisa decidir:

### **Opção A: Manter Sistema Atual**
- Janela de 15 min compensa atrasos
- Penalidades (-5/-10/-15) punem atrasos
- Todas equipes avançam juntas
- **Mais simples de administrar**
- **Justo:** Late window já é a compensação

### **Opção B: Implementar Tempo Remanescente**
- Criar `team_quest_instances` ou `team_custom_deadlines`
- Calcular deadline individual por equipe
- Equipe atrasada perde minutos na próxima quest
- **Mais complexo de implementar**
- **Pode ser injusto:** Dupla penalidade (pontos + tempo)

---

## 💡 RECOMENDAÇÃO

**Mantenha o sistema atual (Opção A)**

**Motivo:**
1. A janela de 15 minutos **JÁ É** a compensação para atrasos
2. Penalidades de pontos **JÁ** punem equipes lentas
3. Implementar tempo remanescente individual seria:
   - **Complexo** (requer nova tabela + lógica)
   - **Dupla penalidade** (pontos + tempo)
   - **Difícil de administrar** (prazos diferentes por equipe)

**O que você TEM:**
- Equipe atrasa → perde pontos (-5/-10/-15)
- Equipe tem 15 min extras → chance de recuperar
- Todas avançam juntas → administração simples

**O que você QUER:**
- Equipe atrasa → perde tempo na próxima quest
- Isso seria ALÉM da penalidade de pontos

**Pergunta:** Você quer penalizar DUAS VEZES (pontos + tempo)?

---

## 🚀 SE QUISER IMPLEMENTAR (Opção B)

Eu posso criar:

1. **Nova tabela:** `team_custom_deadlines`
2. **Modificar:** `/api/submissions/create` para calcular tempo remanescente
3. **Modificar:** `SubmissionDeadlineStatus.tsx` para usar deadline individual
4. **Modificar:** Validação de submissão para checar deadline individual

**Tempo estimado:** 2-3 horas de desenvolvimento + testes

---

## ❓ PRÓXIMOS PASSOS

**Me confirme:**

1. **Você quer manter sistema atual** (janela de 15 min + penalidades)?
   - **OU**
2. **Você quer implementar tempo remanescente individual** (mais complexo)?

Se escolher (2), preciso saber:
- ✅ Tempo remanescente SE SOMA com janela de 15 min?
  - Ex: Equipe atrasa 10 min, próxima quest tem 40 min + 15 min janela?
- ✅ Ou janela de 15 min é FIXA para todos?
  - Ex: Equipe atrasa 10 min, próxima quest tem 40 min + 15 min fixo = 55 min total?

---

**RESUMO EXECUTIVO:**

❌ **Sistema atual NÃO implementa tempo remanescente individual**  
✅ **Sistema atual implementa janela de atraso (15 min) + penalidades**  
⚠️ **Para implementar tempo remanescente, precisa refatoração significativa**  

**Aguardo sua decisão!**
