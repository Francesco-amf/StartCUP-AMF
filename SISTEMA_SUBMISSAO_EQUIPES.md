# 📋 Sistema de Submissão de Equipes - Comportamento Oficial

## 🎯 Regras de Progressão de Quests

### ⏰ Progressão Baseada em TEMPO, não em Submissão

O sistema está configurado para que a progressão entre quests aconteça **baseada no cronômetro**, não na velocidade de submissão das equipes.

---

## 📊 Comportamento Detalhado

### **Cenário 1: Equipe submete DENTRO do prazo**

```
Quest 1 ativa às 10:00 (prazo: 40 minutos)
  ↓
Equipe submete às 10:15 (15 min, muito rápido!)
  ↓
✅ Submissão salva com sucesso
✅ Sem penalidade
  ↓
⏳ Quest 1 continua ATIVA até 10:40 (prazo regular)
⏳ Timer continua contando
  ↓
10:40 - Prazo regular termina
  ↓
⏳ Janela de atraso de 15 min inicia (10:40 até 10:55)
  ↓
10:55 - Janela de atraso termina
  ↓
🚀 PhaseController detecta timeout automático
🚀 Quest 1 fecha (status='closed')
🚀 Quest 2 ativa (status='active', started_at=10:55)
  ↓
📱 Dashboard e página de submissão atualizam
📱 Equipes veem Quest 2 disponível
```

**Resultado:** Mesmo enviando em 15 minutos, a equipe espera até 10:55 para ver a próxima quest.

---

### **Cenário 2: Equipe submete ATRASADO (dentro de 15 min)**

```
Quest 1 ativa às 10:00 (prazo: 40 minutos)
  ↓
10:40 - Prazo regular termina
  ↓
⚠️ Timer mostra "Submissão Atrasada"
⚠️ Penalidades começam a acumular
  ↓
Equipe submete às 10:48 (8 minutos atrasado)
  ↓
✅ Submissão aceita com penalidade
✅ Penalidade aplicada: -10 pontos (5-10min = 10pts)
✅ Registro em `penalties` table
  ↓
⏳ Quest 1 continua ATIVA até 10:55 (deadline + 15min)
  ↓
10:55 - Janela de atraso termina
  ↓
🚀 PhaseController detecta timeout
🚀 Quest 1 fecha → Quest 2 ativa
```

**Resultado:** Equipe paga penalidade mas ainda espera até fim da janela (10:55).

---

### **Cenário 3: Equipe NÃO submete (timeout completo)**

```
Quest 1 ativa às 10:00 (prazo: 40 minutos)
  ↓
10:40 - Prazo regular termina
  ↓
⚠️ Timer mostra atraso crescente
⚠️ Penalidade aumenta: 5pts → 10pts → 15pts
  ↓
10:50 - Equipe ainda não submeteu (10min atrasado)
  ↓
10:55 - Janela de atraso termina (15min completos)
  ↓
🚫 Botão de submissão BLOQUEADO
🚫 Mensagem: "Prazo Encerrado"
  ↓
🚀 PhaseController detecta timeout
🚀 Quest 1 fecha SEM submissão
🚀 Quest 2 ativa
  ↓
📱 UI atualiza automaticamente
📱 Equipe vê Quest 2 disponível (perdeu Quest 1)
```

**Resultado:** Equipe perde a quest completamente, passa para próxima.

---

## 🔄 Transição de Fases

Quando a **última quest de uma fase** termina (deadline + 15min):

```
Fase 1, Quest 3 termina às 13:00
  ↓
🚀 PhaseController detecta fim da fase
🚀 event_config.current_phase = 2
🚀 Phase 2 timestamp atualizado
🚀 Fase 2, Quest 1 ativa automaticamente
  ↓
📱 Todas equipes veem Fase 2 começar
```

---

## ⚡ Componentes Responsáveis

### **1. PhaseController.tsx**
- Verifica timers a cada intervalo (useEffect)
- Calcula: `questEndTime = started_at + planned_deadline_minutes + late_submission_window_minutes`
- Se `now > questEndTime`: chama `/api/admin/advance-quest`
- Gerencia transições de quest e fase

### **2. SubmissionDeadlineStatus.tsx**
- Mostra timer em tempo real
- Calcula status: `isOnTime`, `isLate`, `isBlocked`
- Exibe penalidades antes da submissão
- Bloqueia UI quando `now > deadline + 15min`

### **3. /api/submissions/create**
- Valida submissão via `validate_submission_allowed()`
- Aplica penalidade se `late_minutes > 0`
- **NÃO avança quest** (espera timeout)
- Retorna sucesso com detalhes de penalidade

### **4. /api/admin/advance-quest**
- Fecha quest atual (`status='closed'`)
- Encontra próxima quest ou próxima fase
- Ativa nova quest (`status='active', started_at=NOW()`)
- Atualiza `event_config.current_phase` se necessário

---

## 🎮 Vantagens do Sistema Atual

### ✅ **Justiça entre equipes**
- Todas equipes têm o mesmo tempo total
- Equipe rápida não ganha vantagem extra
- Cronômetro oficial sincronizado

### ✅ **Controle do evento**
- Admin sabe exatamente quando cada fase termina
- Previsibilidade para planejamento
- Avaliadores sabem quando esperar submissões

### ✅ **Menos pressão nas equipes**
- Equipes podem revisar trabalho após submeter
- Tempo para reflexão e melhorias
- Não penaliza quem termina rápido

---

## 🛠️ Como Funciona Tecnicamente

### **Timer Automático (PhaseController)**

```tsx
useEffect(() => {
  // Busca quest ativa
  const activeQuest = allQuests.find(q => q.status === 'active');
  
  // Calcula fim da quest (deadline + late window)
  const questEndTime = new Date(
    questStartTime.getTime() + 
    (planned_deadline_minutes + late_submission_window_minutes) * 60 * 1000
  );
  
  // Se passou do prazo, avança automaticamente
  if (now > questEndTime) {
    fetch('/api/admin/advance-quest', {
      method: 'POST',
      body: JSON.stringify({ questId: activeQuest.id })
    });
  }
}, [eventConfig, allQuests]);
```

### **Validação de Submissão (PostgreSQL)**

```sql
CREATE FUNCTION validate_submission_allowed(team_id, quest_id)
RETURNS TABLE (
  is_allowed boolean,
  late_minutes_calculated integer,
  penalty_calculated integer
)
AS $$
  -- Calcula tempo decorrido desde started_at
  -- Se dentro do prazo: allowed=true, penalty=0
  -- Se 0-5min atrasado: allowed=true, penalty=5
  -- Se 5-10min atrasado: allowed=true, penalty=10
  -- Se 10-15min atrasado: allowed=true, penalty=15
  -- Se >15min atrasado: allowed=FALSE
$$;
```

---

## 📝 Resumo Visual

```
LINHA DO TEMPO (Quest com prazo de 40min):

00:00 ────────────────────────────────────── 40:00 ─────────── 55:00
  │                                              │               │
  │        PRAZO REGULAR (SEM PENALIDADE)        │  LATE WINDOW  │
  │                                              │   (15 MIN)    │
  │                                              │               │
  └─ Quest ATIVA                                 └─ Atraso       └─ BLOQUEIO
     Submissão OK (0 pts perdidos)                  começa          Submissão
                                                    (5/10/15pts)    IMPOSSÍVEL

                                                                    Quest FECHA
                                                                    Próxima ATIVA
```

---

## ✅ Confirmação Final

**O sistema está configurado para:**
- ✅ Aceitar submissões dentro do prazo (sem penalidade)
- ✅ Aceitar submissões atrasadas até 15min (com penalidade progressiva)
- ✅ Bloquear submissões após 15min de atraso
- ✅ Avançar automaticamente quando `deadline + 15min` expira
- ✅ **NÃO** avançar imediatamente após submissão
- ✅ Manter todas equipes no mesmo cronômetro oficial

**Equipes NÃO podem "pular" para frente enviando rápido.**
**Todas seguem o cronômetro sincronizado do evento.**
