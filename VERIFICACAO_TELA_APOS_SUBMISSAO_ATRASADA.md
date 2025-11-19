# 🔍 VERIFICAÇÃO: O Que a Equipe Vê Após Submissão Atrasada

**Cenário:** Equipe atrasa 10 minutos, próxima quest tem 40 minutos de duração

---

## 📊 FLUXO ATUAL DO SISTEMA

### **Quest 1.1:**
- Duração: 60 minutos
- Inicia: 14:00
- Deadline: 15:00
- Late window: até 15:15

### **Equipe Submete Atrasada:**
- Submete em: **15:10** (10 minutos de atraso)
- Penalidade: **-10 pontos** ✅
- Status: Submissão aceita com penalidade

---

## 🖥️ O QUE A EQUIPE VÊ NA TELA APÓS SUBMETER

### **Mensagem Exibida (SubmissionWrapper.tsx linha 258-270):**

```tsx
{waitingForDeadline && (
  <div className="...">
    <h3>⏳ Quest Submetida com Sucesso!</h3>
    <p>
      Você completou "{waitingForDeadline.questName}" 
      dentro do prazo. Parabéns!
    </p>
    <p>
      🕐 A próxima quest será liberada em aproximadamente 
      <span>{waitingForDeadline.minutesRemaining} minuto(s)</span>, 
      quando o prazo atual expirar.
    </p>
  </div>
)}
```

### **Cálculo do Timer (linha 233-239):**

```typescript
const regularEndMs = start.getTime() + planned * 60_000
const remaining = Math.max(0, Math.ceil((regularEndMs - Date.now()) / 60_000))

waitingForDeadline = {
  questName: prevQuest.name,
  minutesRemaining: remaining  // ❌ Tempo até deadline REGULAR (não late window)
}
```

---

## ⏰ EXEMPLO CONCRETO

### **Situação:**
```
Quest 1.1 iniciou: 14:00
Quest 1.1 deadline: 15:00 (60 min)
Quest 1.1 late window: até 15:15 (+ 15 min)

Equipe submete: 15:10 (10 min de atraso)
Agora são: 15:10
```

### **Cálculo do Timer:**
```typescript
regularEndMs = 14:00 + 60 min = 15:00
remaining = Math.ceil((15:00 - 15:10) / 60_000)
remaining = Math.ceil(-10 minutos / 60_000)
remaining = Math.max(0, -0.17)
remaining = 0 minutos ❌
```

---

## 🚨 O QUE A EQUIPE VÊ (NA PRÁTICA)

### **Cenário 1: Submissão Atrasada (depois do deadline regular)**

**Mensagem:**
```
⏳ Quest Submetida com Sucesso!

Você completou "Quest 1.1" dentro do prazo. Parabéns!

🕐 A próxima quest será liberada em aproximadamente 0 minuto(s), 
quando o prazo atual expirar.
```

**Comportamento:**
- Timer mostra **0 minutos** ❌
- Equipe vê mensagem confusa ("dentro do prazo" mas teve penalidade)
- Próxima quest **NÃO aparece imediatamente**
- Equipe precisa aguardar até **15:15** (fim da late window)

---

### **Cenário 2: Quando Late Window Expira (15:15)**

**Sistema executa:**
1. Cron `auto_start_next_quest` detecta expiração
2. Inicia Quest 1.2 com `started_at = 15:15`
3. Quest 1.2 aparece para **TODAS as equipes**

**Equipe vê:**
```
📋 Quest 1.2 - A Persona Secreta

⏰ Tempo restante para o prazo: 40 minutos (+ 15 min janela = 55 min total)
```

---

## ❌ PROBLEMA IDENTIFICADO

### **1. Mensagem Enganosa**

**Linha 264 do SubmissionWrapper.tsx:**
```tsx
<p>
  Você completou "{waitingForDeadline.questName}" 
  dentro do prazo. Parabéns!  // ❌ MENTIRA se submeteu atrasado!
</p>
```

**Deveria mostrar:**
```tsx
<p>
  Você completou "{waitingForDeadline.questName}" 
  {isLate ? 'com atraso (penalidade aplicada)' : 'dentro do prazo. Parabéns!'}
</p>
```

---

### **2. Timer Mostra 0 Minutos**

**Problema:** Cálculo usa `regularEndMs` (deadline sem late window)

```typescript
// ATUAL (ERRADO para submissão atrasada):
const regularEndMs = start.getTime() + planned * 60_000  // 15:00
const remaining = Math.ceil((regularEndMs - Date.now()) / 60_000)  // 15:00 - 15:10 = -10 min → 0

// DEVERIA SER (para submissão atrasada):
const lateWindowEndMs = start.getTime() + (planned + lateWindow) * 60_000  // 15:15
const remaining = Math.ceil((lateWindowEndMs - Date.now()) / 60_000)  // 15:15 - 15:10 = 5 min ✅
```

---

### **3. Tempo Remanescente NÃO É Individual**

**O que você QUER:**
```
Equipe atrasou 10 min → Próxima quest tem 30 min (40 - 10)
```

**O que REALMENTE acontece:**
```
Equipe atrasou 10 min → Próxima quest tem 40 min (IGUAL para todos)
```

**Motivo:**
- Quest 1.2 inicia às **15:15** (mesma hora para todos)
- `quests.planned_deadline_minutes` = **40** (global)
- Deadline = 15:15 + 40 = **15:55** (igual para todos)

---

## 🎯 RESPOSTA À SUA PERGUNTA

### **"O que a equipe vê quando submete atrasada?"**

**AGORA (15:10):**
```
✅ Entrega enviada com sucesso! 
⚠️ Submissão atrasada: 10 minutos
💰 Penalidade: -10 AMF Coins

⏳ Quest Submetida com Sucesso!
Você completou "Quest 1.1" dentro do prazo. Parabéns!  ❌ MENSAGEM ERRADA

🕐 A próxima quest será liberada em aproximadamente 0 minuto(s),  ❌ TIMER ERRADO
quando o prazo atual expirar.
```

**DEPOIS (15:15 - quando late window expira):**
```
📋 Quest 1.2 - A Persona Secreta

⏰ Tempo restante para o prazo: 40 minutos (+ 15 min janela = 55 min total)
                                ^^^^ 40 minutos PARA TODOS (não 30)
```

---

## ✅ CONCLUSÃO

### **Sobre Tempo Remanescente Individual:**

**❌ NÃO EXISTE** no sistema atual:
- Quest 1.2 inicia no **MESMO momento** para todos (15:15)
- Quest 1.2 tem **MESMA duração** para todos (40 min)
- Quest 1.2 expira no **MESMO momento** para todos (15:55)

**✅ O QUE FUNCIONA:**
- Penalidade de pontos (-10 coins)
- Janela de 15 min para submeter atrasado
- Timer até próxima quest (mas com bugs visuais)

---

## 🐛 BUGS ENCONTRADOS

1. **Mensagem "dentro do prazo"** quando teve penalidade ❌
2. **Timer mostra 0 minutos** para submissões atrasadas ❌
3. **Próxima quest tem duração fixa** (não reduzida pelo atraso) ✅ (esperado)

---

## 🔧 CORREÇÕES NECESSÁRIAS (Se Quiser)

### **Bug 1 e 2: Mensagem e Timer Errados**

Posso corrigir para mostrar:
```
⏳ Entrega Atrasada Aceita!
Você completou "Quest 1.1" com 10 minutos de atraso.
Penalidade: -10 AMF Coins

🕐 A próxima quest será liberada em 5 minuto(s), 
quando a janela de atraso expirar.
```

### **Tempo Remanescente Individual**

Isso requer **refatoração complexa** (tabela nova, lógica por equipe, etc.)

---

**Quer que eu corrija os bugs de mensagem/timer?** Ou está OK assim?
