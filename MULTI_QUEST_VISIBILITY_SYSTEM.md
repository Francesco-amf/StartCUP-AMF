# 🎯 Sistema de Múltiplas Quests Visíveis

## 💡 Conceito

**Após o prazo regular de uma quest, a próxima quest já aparece para TODAS as equipes, MAS:**
- Equipes que **submeteram no prazo** → veem apenas a próxima quest (antiga some)
- Equipes **atrasadas** → veem AMBAS as quests (antiga em modo atraso + próxima bloqueada)

---

## 📊 Fluxo Visual

### **Cenário 1: Equipe que submeteu NO PRAZO**

```
Quest 1 (40min de prazo)

10:00 ────────────────────── 10:40 ────────── 10:55
  │                             │               │
  │   TRABALHA NA QUEST 1       │               │
  │                             │               │
10:25 - Equipe submete ✅       │               │
  │                             │               │
  │   VÊ: Quest 1 (✅ submetida)│               │
  │                             ▼               │
  │                      PRAZO REGULAR          │
  │                         TERMINA             │
  │                             │               │
  │                      🚀 Quest 2 APARECE     │
  │                             │               │
  │   VÊ: Quest 2 (disponível)  │               │
  │   Quest 1 SOME (já submetida)│              │
  │                             │               │
  │   TRABALHA NA QUEST 2       │               │
  └─────────────────────────────┴───────────────┘
```

**Dashboard da equipe:**
```
[10:00-10:24] 📝 Quest 1 - Formulário de submissão
[10:25-10:39] ✅ Quest 1 - "Entrega em análise"
[10:40-...]   📝 Quest 2 - Formulário de submissão (nova quest ativa)
```

---

### **Cenário 2: Equipe ATRASADA**

```
Quest 1 (40min de prazo + 15min late window)

10:00 ────────────────────── 10:40 ────────── 10:55
  │                             │               │
  │   TRABALHA NA QUEST 1       │   LATE        │
  │                             │   WINDOW      │
  │                             ▼               │
  │                      PRAZO REGULAR          │
  │                         TERMINA             │
  │                             │               │
  │                      🚀 Quest 2 APARECE     │
  │                      ⚠️ Quest 1 ATRASO      │
  │                             │               │
  │   VÊ: Quest 1 (🚨 atrasada, pode submeter)  │
  │       Quest 2 (🔒 bloqueada, próxima)       │
  │                             │               │
10:48 - Equipe submete Quest 1 ✅ (8min atraso) │
  │                             │               │
  │   VÊ: Quest 2 (disponível)  │               │
  │   Quest 1 SOME (submetida)  │               │
  │                             │               │
  │   TRABALHA NA QUEST 2       │               │
  └─────────────────────────────┴───────────────┘
```

**Dashboard da equipe atrasada:**
```
[10:00-10:39] 📝 Quest 1 - Formulário de submissão

[10:40-10:47] 🚨 Quest 1 - Formulário com ALERTA DE ATRASO
              🔒 Quest 2 - Card "PRÓXIMA" (bloqueada)
              
[10:48-10:54] 📝 Quest 2 - Formulário de submissão
              Quest 1 SOME (já submetida com penalidade)
```

---

### **Cenário 3: Equipe NÃO submete (timeout)**

```
Quest 1 (40min + 15min late window)

10:00 ────────────────────── 10:40 ────────── 10:55
  │                             │               │
  │   TRABALHA NA QUEST 1       │   LATE        │
  │                             │   WINDOW      │
  │                             ▼               │
  │                      Quest 2 APARECE        │
  │                      Quest 1 ATRASO         │
  │                             │               │
  │   VÊ: Quest 1 (🚨 atrasada) │               │
  │       Quest 2 (🔒 bloqueada)│               │
  │                             │               │
  │   CONTINUA SEM SUBMETER...  │               │
  │                             │               ▼
  │                             │        LATE WINDOW
  │                             │          EXPIRA
  │                             │               │
  │                             │        🚀 PhaseController
  │                             │           avança Quest
  │   VÊ: Quest 2 (disponível)  │               │
  │   Quest 1 SOME (bloqueada)  │               │
  └─────────────────────────────┴───────────────┘
```

**Dashboard da equipe que não submeteu:**
```
[10:00-10:39] 📝 Quest 1 - Formulário de submissão

[10:40-10:54] 🚨 Quest 1 - Formulário com ALERTA
              🔒 Quest 2 - Card "PRÓXIMA"
              
[10:55-...]   📝 Quest 2 - Formulário de submissão
              Quest 1 SOME (perdida/bloqueada)
```

---

## 🎨 Interface do Usuário

### **Quest Normal (dentro do prazo)**
```tsx
┌───────────────────────────────────────────┐
│ 📝 Quest 1: Descoberta do Problema        │
│                                           │
│ ⏱️ Tempo restante: 15:32                  │
│ 💎 Pontuação máxima: 50 pontos            │
│                                           │
│ [Formulário de submissão]                 │
│ [Botão: Enviar Entrega]                   │
└───────────────────────────────────────────┘
```

### **Quest em Atraso (late window ativa)**
```tsx
┌───────────────────────────────────────────┐
│ ⚠️ ATENÇÃO: Você está na janela de atraso!│
│ Submissões feitas agora receberão         │
│ penalidade de pontos.                     │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│ 🚨 Quest 1: Descoberta do Problema        │
│                                           │
│ ⏰ Atraso: 8 minutos                      │
│ 💰 Penalidade: -10 pontos                 │
│                                           │
│ [Formulário de submissão]                 │
│ [Botão: Enviar Entrega (com penalidade)]  │
└───────────────────────────────────────────┘
```

### **Próxima Quest (bloqueada temporariamente)**
```tsx
┌───────────────────────────────────────────┐
│                        🔜 PRÓXIMA          │
│ 🎯 Quest 2: Criação da Solução            │
│                                           │
│ Esta quest será liberada automaticamente  │
│ quando a quest anterior for finalizada.   │
│                                           │
│ 💎 Pontuação máxima: 75 pontos            │
└───────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### **SubmissionWrapper.tsx - Lógica de Visibilidade**

```tsx
// Calcula quais quests devem aparecer
const availableQuests = sortedQuests.map((quest, index) => {
  const alreadySubmitted = submittedQuestIds.includes(quest.id);
  
  // Calcular deadlines
  const regularDeadlinePassed = now > (started_at + planned_deadline);
  const lateWindowExpired = now > (started_at + planned_deadline + late_window);
  
  let shouldShow = false;
  let isInLateWindow = false;
  let isNextAvailable = false;
  
  if (alreadySubmitted) {
    // Já submeteu → NÃO MOSTRA
    shouldShow = false;
  } else if (quest.status === 'active') {
    if (lateWindowExpired) {
      // Janela expirou → NÃO MOSTRA
      shouldShow = false;
    } else if (regularDeadlinePassed) {
      // Prazo regular passou mas janela ainda aberta → MOSTRA EM MODO ATRASO
      shouldShow = true;
      isInLateWindow = true;
    } else {
      // Dentro do prazo → MOSTRA NORMALMENTE
      shouldShow = true;
    }
  } else if (quest.status === 'pending') {
    // Verifica se é a próxima depois de uma quest com prazo regular passado
    const previousQuest = sortedQuests[index - 1];
    if (previousQuest.regularDeadlinePassed) {
      // MOSTRA COMO PRÓXIMA (bloqueada)
      shouldShow = true;
      isNextAvailable = true;
    }
  }
  
  return { ...quest, shouldShow, isInLateWindow, isNextAvailable };
});
```

### **PhaseController.tsx - Avanço Automático**

```tsx
// Avança apenas quando late window EXPIRAR
const finalDeadline = started_at + planned_deadline + late_window;

if (now > finalDeadline) {
  // Fecha quest atual
  // Ativa próxima quest
  // Quest anterior SOME da UI de todas equipes
}
```

---

## ✅ Vantagens do Sistema

1. **Transparência:** Equipes veem o que vem a seguir
2. **Incentivo:** Submeter no prazo = vê próxima quest mais cedo
3. **Justiça:** Equipes atrasadas ainda têm sua janela de 15min
4. **Sincronização:** Quest só muda oficialmente quando late window expira
5. **Flexibilidade:** Cada equipe vê interface personalizada baseada em seu status

---

## 🎮 Exemplo Completo: 3 Equipes

### **Quest 1 (40min de prazo)**

```
10:00 - Quest 1 ativa para TODOS

EQUIPE A:
  10:20 - Submete ✅
  10:40 - VÊ Quest 2 (Quest 1 some)
  
EQUIPE B:
  10:35 - Submete ✅
  10:40 - VÊ Quest 2 (Quest 1 some)
  
EQUIPE C:
  10:40 - Prazo regular termina (ainda não submeteu)
  10:40 - VÊ Quest 1 (🚨 atraso) + Quest 2 (🔒 bloqueada)
  10:48 - Submete Quest 1 (-10pts penalidade)
  10:48 - Quest 1 some, Quest 2 disponível
  
10:55 - Late window expira
      - PhaseController fecha Quest 1 oficialmente
      - Quest 2 torna-se oficialmente ativa
```

---

## 📝 Checklist de Comportamentos

- ✅ Quest submetida NO PRAZO → some da lista imediatamente
- ✅ Quest submetida ATRASADA → some após submissão
- ✅ Prazo regular termina → próxima quest aparece como "PRÓXIMA"
- ✅ Equipe atrasada → vê quest antiga EM ATRASO + próxima BLOQUEADA
- ✅ Equipe no prazo → vê apenas próxima quest (antiga some)
- ✅ Late window expira → quest antiga SOME para TODOS
- ✅ PhaseController avança → próxima quest fica oficialmente ativa

---

## 🚀 Status

✅ **Implementado e pronto para uso**
✅ **Sem necessidade de SQL adicional**
✅ **Lógica 100% frontend (SubmissionWrapper)**
✅ **Sincronização automática (PhaseController)**

**O sistema está completo e funcional!** 🎉
