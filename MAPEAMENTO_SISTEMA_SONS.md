# 🔊 Mapeamento do Sistema de Sons - Quest Progression

## Objetivo
Mapear EXATAMENTE qual som deve tocar em cada transição/momento do evento.

---

## 📋 Eventos e Sons Correspondentes

### 1️⃣ **INÍCIO DO EVENTO** (Fase 1, Quest 1.1 ativa)

**Som:** `event-start`
**Quando:** Fase === 1 AND Quest.order_index === 1 E quest fica active
**Localização Código:** CurrentQuestTimer.tsx linha 487-491
**Status:** ✅ Implementado

```
Situação: Usuário clica "Start Phase" em Control Panel
          └─ Fase 1 inicia
          └─ Quest 1.1 fica ACTIVE
          └─ Som toca: event-start (máxima prioridade)
```

---

### 2️⃣ **NOVA QUEST (Mesma Fase)**

**Exemplo:** Quest 1.1 fecha → Quest 1.2 abre

**Som:** `quest-start`
**Quando:** Nueva quest fica ACTIVE (order_index > 1) NA MESMA FASE
**Tipo:** Normal digital delivery (não é boss, não é muda de fase)
**Localização Código:** CurrentQuestTimer.tsx linha 501-504
**Status:** ✅ Implementado

```
Timeline:
T=02:00  Quest 1.1 fecha → advance-quest endpoint chamado
T=02:01  Quest 1.2 fica ACTIVE
         └─ Som toca: quest-start
```

---

### 3️⃣ **BOSS SPAWN** (Ordem 4 ou type presentation)

**Exemplo:** Quest 1.3 fecha → Quest 1.4 (BOSS) abre

**Som:** `boss-spawn` (toca 2x para efeito épico)
**Quando:** Nueva quest é BOSS (order_index === 4 OU deliverable_type === 'presentation')
**Características:** Toca 2 vezes com 2.5s de delay entre elas
**Localização Código:** CurrentQuestTimer.tsx linha 492-500
**Status:** ✅ Implementado

```
Timeline:
T=06:00  Quest 1.3 fecha → advance-quest endpoint chamado
T=06:01  Quest 1.4 (BOSS) fica ACTIVE
         └─ Som toca: boss-spawn
         └─ + 2.5s: toca boss-spawn novamente (efeito épico)
```

---

### 4️⃣ **MUDANÇA DE FASE** ⚠️ **NÃO IMPLEMENTADO**

**Exemplo:** Quest 1.4 (BOSS Fase 1) fecha → Quest 2.1 abre (Fase 2)

**Som:** `phase-start` (NÃO `quest-start`!)
**Quando:** Nueva quest tem phase_id DIFERENTE do anterior
**Tipo:** Mudança de fase (deve soar como transição épica)
**Status:** ❌ **FALTANDO IMPLEMENTAÇÃO**

```
Timeline:
T=08:00  Quest 1.4 (BOSS) fecha → advance-quest endpoint chamado
T=08:01  Event_config.current_phase muda de 1 para 2
T=08:02  Quest 2.1 fica ACTIVE
         └─ Som deve tocar: phase-start ❌ MAS NÃO TOCA ATUALMENTE!
         └─ Em vez disso: toca quest-start (ERRADO)
```

**Problema Atual:**
- CurrentQuestTimer não sabe qual era a fase anterior
- Logo não consegue detectar mudança de fase
- Toca quest-start em vez de phase-start

---

### 5️⃣ **MUDANÇA DE FASE + BOSS NO COMEÇO** (Fases 2-4)

**Exemplo:** Quest 1.4 fecha → Quest 2.1 abre (que é normal)
**Depois:** Quest 2.3 fecha → Quest 2.4 (BOSS) abre

**Padrão geral:**
- T=08:00-08:02: phase-start toca (mudança 1→2)
- T=08:00-08:24: Quest 2.1, 2.2, 2.3 (quest-start toca para cada)
- T=08:24: Quest 2.4 (BOSS) abre → boss-spawn toca

---

### 6️⃣ **FASE 5 ESPECIAL** (Sem Boss)

**Exemplo:** Quest 4.4 (BOSS) fecha → Quest 5.1 abre

**Som:** `phase-start` (Fase 5 começa)
**Depois:** Quest 5.1, 5.2, 5.3 progridem com quest-start
**Sem Boss:** Quest 5.3 é última, não há 5.4

```
Timeline Fase 5:
T=32:00  Quest 5.1 abre → phase-start toca (mudança 4→5)
T=34:00  Quest 5.1 fecha → Quest 5.2 abre → quest-start toca
T=36:00  Quest 5.2 fecha → Quest 5.3 abre → quest-start toca
T=38:00  Quest 5.3 fecha
         └─ Evaluation period inicia
         └─ Sem som de próxima quest (não há 5.4!)
```

---

## 🎯 Matriz de Decisão

```
if (quest ativada) {
  if (phase 1 AND quest.order_index 1) {
    // INÍCIO DO EVENTO
    toca('event-start')  ✅ Implementado
  }
  else if (isBoss) {
    // BOSS (order 4 ou type presentation)
    toca('boss-spawn')   ✅ Implementado
    toca('boss-spawn')   // 2x com delay
  }
  else if (phase MUDOU comparado ao anterior) {
    // MUDANÇA DE FASE (não primeira quest de fase 1)
    toca('phase-start')  ❌ NÃO IMPLEMENTADO
  }
  else {
    // NOVA QUEST NA MESMA FASE (normal)
    toca('quest-start')  ✅ Implementado
  }
}
```

---

## 🔧 O Que Precisa Ser Implementado

### 1. Rastrear fase anterior
CurrentQuestTimer precisa lembrar qual era a fase antes para detectar mudança:

```typescript
const previousPhaseRef = useRef<number | null>(null)
```

### 2. Detectar mudança de fase
```typescript
const phaseChanged = previousPhaseRef.current !== null && previousPhaseRef.current !== phase
```

### 3. Tocar phase-start na mudança
```typescript
if (phaseChanged && !isFirstQuestOfPhase1) {
  play('phase-start')
}
```

### 4. Atualizar referência
```typescript
previousPhaseRef.current = phase
```

---

## 📍 Localização das Mudanças

**Arquivo:** `src/components/dashboard/CurrentQuestTimer.tsx`

**Seção:** useEffect que detecta nova quest (linha ~480)

**Lógica atual:**
```typescript
const isFirstQuestOfPhase1 = phase === 1 && currentQuest.order_index === 1
const isBoss = currentQuest.order_index === 4 || ...

if (isFirstQuestOfPhase1) {
  play('event-start')
} else if (isBoss) {
  play('boss-spawn')
  play('boss-spawn')  // 2x
} else {
  play('quest-start')
}
```

**Nova lógica:**
```typescript
const isFirstQuestOfPhase1 = phase === 1 && currentQuest.order_index === 1
const isBoss = currentQuest.order_index === 4 || ...
const phaseChanged = previousPhaseRef.current !== null && previousPhaseRef.current !== phase

if (isFirstQuestOfPhase1) {
  play('event-start')
} else if (isBoss) {
  play('boss-spawn')
  play('boss-spawn')  // 2x
} else if (phaseChanged) {
  play('phase-start')  // ← NOVA LINHA
} else {
  play('quest-start')
}
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar `previousPhaseRef` ao componente
- [ ] Implementar lógica de detecção `phaseChanged`
- [ ] Adicionar som `phase-start` na condição correta
- [ ] Atualizar `previousPhaseRef.current` após som
- [ ] Testar cada transição:
  - [ ] Fase 1 Quest 1 inicia → event-start
  - [ ] Fase 1 Quest 1 → Quest 2 → quest-start
  - [ ] Fase 1 Quest 3 → Quest 4 (BOSS) → boss-spawn
  - [ ] Fase 1 Quest 4 → Fase 2 Quest 1 → phase-start ✅
  - [ ] Fase 2 Quest 1 → Quest 2 → quest-start
  - [ ] Fase 2 Quest 3 → Quest 4 (BOSS) → boss-spawn
  - [ ] Fase 4 Quest 4 (BOSS) → Fase 5 Quest 1 → phase-start ✅
  - [ ] Fase 5 Quest 1 → Quest 2 → quest-start
  - [ ] Fase 5 Quest 3 fecha → evaluation period (sem som)

---

## 🎵 Sons Envolvidos

| Som | Prioridade | Volume | Duração | Quando Toca |
|-----|-----------|--------|---------|------------|
| `event-start` | 0 (máxima) | 1.0 | ~10s | Fase 1 Quest 1 inicia |
| `phase-start` | 0 (máxima) | 0.9 | ~10s | Mudança de fase |
| `quest-start` | 5 (média-baixa) | 0.85 | ~3s | Nova quest (normal) |
| `boss-spawn` | 2 (alta) | 1.0 | ~5s | Boss aparece (2x) |

---

## 📝 Notas Importantes

1. **event-start vs phase-start:**
   - `event-start`: Apenas quando Fase 1 Quest 1 inicia
   - `phase-start`: Toda mudança de fase (EXCETO evento start)

2. **Phase-start remove quest-start da fila:**
   - audioManager.ts linha 574 já trata isso
   - phase-start tem prioridade 0, quest-start tem prioridade 5
   - Se phase-start é enfileirado, quest-start é removido automaticamente

3. **Boss-spawn 2x:**
   - Boss-spawn deve tocar 2 vezes com ~2.5s entre elas
   - Efeito épico para dar drama ao aparecimento do boss
   - Já implementado no código atual

4. **Sem som ao terminar Fase 5 Quest 3:**
   - Não há próxima quest
   - Sistema vai para evaluation period
   - Nenhum som toca aqui (sem som)

---

## 🔗 Referências

- **CurrentQuestTimer.tsx:** src/components/dashboard/CurrentQuestTimer.tsx
- **audioManager.ts:** src/lib/audio/audioManager.ts (linha 574: filtro de transição)
- **AudioFileType:** audioManager.ts linha 22-43 (lista de sons disponíveis)
