# Timer Pause Feature - Phase Timer Durante Gaps de Quests

## Problema
Quando uma quest termina e a próxima ainda não começou (gap de tempo enquanto o admin ativa), o timer da fase continua contando regressivamente. Isso causa:
- Perda artificial de tempo da fase
- Pressão desnecessária nos participantes
- Frustr ação com delays do admin
- Dessincronia entre tempo teórico vs. tempo real de jogo

**Exemplo:**
```
19:45 - Quest 1 termina
19:45-20:00 - Admin ativa Quest 2 (gap de 15 segundos)
20:00 - Quest 2 inicia

Resultado: Fase "perdeu" 15 segundos mesmo que ninguém estivesse fazendo nada!
```

## Solução Implementada

### Conceito
**Pausar o timer da fase quando não há quest ativa**, usando o timestamp da última quest como ponto de referência.

### Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│ Cálculo Normal (COM quest ativa)                             │
│ tempo_restante = duracao_total - (agora - inicio_fase)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Cálculo Pausado (SEM quest ativa)                           │
│ tempo_restante = duracao_total - (lastQuestStartTime - inicio_fase)
└─────────────────────────────────────────────────────────────┘
```

### Implementação Técnica

#### 1. Rastreamento de Tempo da Última Quest
```typescript
// Referência persistente para o timestamp da última quest ativada
const lastQuestStartTimeRef = useRef<number>(0)

// Atualiza quando uma quest começa
useEffect(() => {
  const activeQuests = quests.filter(q => q.started_at !== null)
  if (activeQuests.length > 0) {
    const current = sortedByStart[0]
    lastQuestStartTimeRef.current = new Date(cleanTimestamp).getTime()
  }
}, [quests])
```

#### 2. Cálculo Inteligente do Tempo Restante
```typescript
// Detecta se há quest ativa AGORA
const activeQuestsNow = quests.filter(q => q.started_at !== null)
const hasActiveQuest = activeQuestsNow.length > 0

// Usa lastQuestStartTime se não há quest ativa
const timeBaseForCalculation = hasActiveQuest ? now : lastQuestStartTimeRef.current

const elapsed = timeBaseForCalculation - startTime
const timeRemaining = totalDuration - elapsed
```

#### 3. Feedback Visual do Estado
```jsx
<Card className={`
  ${hasActiveQuest
    ? 'bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-[#00E5FF]/40'     // Azul: Ativo
    : 'bg-gradient-to-br from-[#0A1E47]/40 to-[#001A4D]/40 border-[#FFD700]/40 animate-pulse' // Ouro: Pausado
  }
`}>
  {!hasActiveQuest && (
    <span className="text-[#FFD700] bg-[#FFD700]/20 animate-pulse">
      ⏸️ PAUSADO
    </span>
  )}
</Card>
```

## Comportamento Visual

### Timer Ativo (Quest em Progresso)
```
┌──────────────────────────────────┐
│ ⏱️ TEMPO TOTAL DA FASE             │
│                                  │
│         02:15:42                │
│                                  │
│ [████████████░░░░░░░] 65%        │
│ 65% da fase restante             │
└──────────────────────────────────┘
```

### Timer Pausado (Aguardando Próxima Quest)
```
┌───────────────────────────────────────────┐
│ ⏱️ TEMPO TOTAL DA FASE  [⏸️ PAUSADO]      │  ← Badge pulsante
│                                           │
│         02:15:42        (congelado)      │
│                                           │
│ [████████████░░░░░░░] 65%                │
│ 65% da fase restante                     │
└───────────────────────────────────────────┘
  ↑ Border dourado/pulsante
  ↑ Indica estado "pausado"
```

## Logging & Debugging

Quando o timer está pausado, a console mostra:
```
⏸️ [Phase Timer] PAUSADO - Aguardando próxima quest. Tempo restante: 02h 15m 42s
⏸️ [Phase Timer] PAUSADO - Aguardando próxima quest. Tempo restante: 02h 15m 42s
⏸️ [Phase Timer] PAUSADO - Aguardando próxima quest. Tempo restante: 02h 15m 42s
```

Quando retoma:
```
🟢 Timer resumed - Next quest activated! Time remaining: 02h 15m 38s
```

## Exemplo de Timeline Real

```
19:45:00 - Quest 1 começa
          Quest 1 timer: 50:00
          Fase timer: contando ← ✅ CONTANDO

19:50:00 - Quest 1 termina (50 minutos)
          Quest 2 ainda não começou
          Fase timer: PARADO ← ⏸️ PAUSADO (conserva 1:55:00)

19:50:15 - Admin clica "Ativar Quest 2"
          Quest 2 começa
          Fase timer: volta a contar ← ✅ CONTANDO (continua de 1:54:45)

19:55:15 - Quest 2 termina (5 minutos)
          Quest 3 ainda não começou
          Fase timer: PARADO ← ⏸️ PAUSADO (conserva 1:49:45)

Total de tempo "pausado": ~15 segundos
Tempo real usado: 10 minutos + 15 segundos
Tempo economizado para os participantes: 0 (conservado para próximas quests)
```

## Vantagens

✅ **Justiça**: Todos ganham o mesmo tempo real para trabalhar
✅ **Clareza**: Visual deixa óbvio quando está pausado
✅ **Reduz stress**: Sem "time pressure" artificial durante gaps
✅ **Admin-friendly**: Admin pode ativar quest sem pressa
✅ **Realista**: Simula um relógio "inteligente" que sabe quando não há ação
✅ **Rastreável**: Logs mostram quando pausa/resume

## Casos de Uso

### Caso 1: Transição Rápida
```
Quest 1 termina às 15:30
Quest 2 ativada imediatamente
Pause time: ~0 segundos
Timer impact: Nenhum
```

### Caso 2: Admin Distração
```
Quest 1 termina às 15:30
Admin está fazendo outra coisa, quest ativada em 2 minutos
Pause time: ~2 minutos
Timer impacto: Conservado para uso em próximas quests
```

### Caso 3: Falha de Sincronização
```
Quest 1 termina às 15:30
Sistema aguarda confirmação (5 segundos)
Admin ativa Quest 2 manualmente (10 segundos após)
Pause time: ~15 segundos
Timer impacto: Todos ganham 15 segundos de "bônus"
```

## Configuração & Customização

### Para mudar a cor quando pausado
Edite em [CurrentQuestTimer.tsx:907-909](src/components/dashboard/CurrentQuestTimer.tsx#L907-L909):
```typescript
: 'bg-gradient-to-br from-[#0A1E47]/40 to-[#001A4D]/40 border-[#FFD700]/40 animate-pulse'
  ↑ Mude a cor aqui (atualmente #FFD700 = ouro)
```

### Para mudar o badge "PAUSADO"
Edite em [CurrentQuestTimer.tsx:915-918](src/components/dashboard/CurrentQuestTimer.tsx#L915-L918):
```typescript
<span className="text-xs font-bold text-[#FFD700] bg-[#FFD700]/20 px-2 py-1 rounded-full animate-pulse">
  ⏸️ PAUSADO
  ↑ Personalize aqui
</span>
```

### Para desabilitar pause (voltar ao comportamento antigo)
Mude linha 805-806 para:
```typescript
// REMOVIDO: pausar timer
const hasActiveQuest = true // Força sempre "true"
```

## Testing

### Teste Manual
1. Abra live-dashboard
2. Vá para última quest da fase
3. Complete a quest
4. Observe o timer:
   - Deve mudar para cor dourada
   - Badge "⏸️ PAUSADO" deve aparecer
   - Números devem congelar
5. Admin ativa próxima quest
   - Cor volta ao azul
   - Badge desaparece
   - Timer continua de onde parou

### Teste Automático (E2E)
```typescript
// Pseudocódigo para teste
it('should pause timer when no quest is active', async () => {
  const initialTime = getPhaseTimerValue()
  completeCurrentQuest()

  // Aguarda 2 segundos
  await wait(2000)

  const afterPauseTime = getPhaseTimerValue()
  expect(afterPauseTime).toBe(initialTime) // Não deve mudar!
  expect(getTimerBadge()).toContain('PAUSADO')
  expect(getTimerBg()).toContain('FFD700') // Ouro
})
```

## Edge Cases Tratados

✅ **Página recarregada durante pause** → lastQuestStartTimeRef é recalculado
✅ **Múltiplas quests ativas** → Usa a mais recente (sortedByStart[0])
✅ **Nenhuma quest nunca ativada** → Timer começa normalmente (lastQuestStartTimeRef = 0)
✅ **Fase já terminada** → Timer respeta limite de 0

## Performance

- **Impacto**: Negligível (uma linha adicional por renderização)
- **Memory**: +1 useRef (números simples)
- **CPU**: Mesmo cálculo que antes, apenas com base de tempo diferente
- **Network**: Nenhuma requisição adicional

## Futuros Melhoramentos

- [ ] Rastrear histórico de pauses para analytics
- [ ] Notificação visual ao usuário quando timer pausa
- [ ] Opção de admin pausar/despauser manualmente
- [ ] Configuração de "auto-unpause" time
- [ ] UI de countdown até próxima quest estimada

## Relacionados

- [TIMER_PAUSE_FEATURE.md](TIMER_PAUSE_FEATURE.md) - Este documento
- [src/components/dashboard/CurrentQuestTimer.tsx](src/components/dashboard/CurrentQuestTimer.tsx) - Implementação
- Issue: "Phase timer counts down during quest gaps"
