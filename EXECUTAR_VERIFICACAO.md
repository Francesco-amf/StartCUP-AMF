# 🎯 EXECUTAR VERIFICAÇÃO DE ESTRUTURA

## Instruções Passo a Passo

### 1. Abra o Supabase SQL Editor
- Acesse https://app.supabase.com
- Vá para Project > SQL Editor

### 2. Execute o Script
- Copie TODO o conteúdo de `VERIFICAR_ESTRUTURA_COMPLETA.sql`
- Cole no SQL Editor
- Clique em "Execute"

### 3. Analise os Resultados

O script vai verificar 7 requisitos principais:

#### ✅ Requisito 1: FASES 1-4
- Esperado: 4 fases com 4 quests cada (16 total)

#### ✅ Requisito 2: Q1-Q3 (Fases 1-4)
- Esperado: 12 quests SEM late window

#### ✅ Requisito 3: Boss Tipo
- Esperado: 4 bosses com tipo 'presentation'

#### ✅ Requisito 4: Boss Duração
- Esperado: 4 bosses com 10 minutos exatos

#### ✅ Requisito 5: Fase 5
- Esperado: 3 quests

#### ✅ Requisito 6: Fase 5 Late Window
- Esperado: 3 quests COM late window

#### ✅ Requisito 7: Fase 5 SEM Boss
- Esperado: 0 bosses na Fase 5

## Estrutura Esperada

```
FASE 1 (Descoberta)
├─ Q1.1 (60 min) - SEM late
├─ Q1.2 (60 min) - SEM late
├─ Q1.3 (60 min) - SEM late
└─ Q1.4 BOSS (10 min) - Protegido

FASE 2 (Criação)
├─ Q2.1 (60 min) - SEM late
├─ Q2.2 (60 min) - SEM late
├─ Q2.3 (60 min) - SEM late
└─ Q2.4 BOSS (10 min) - Protegido

FASE 3 (Estratégia)
├─ Q3.1 (60 min) - SEM late
├─ Q3.2 (60 min) - SEM late
├─ Q3.3 (60 min) - SEM late
└─ Q3.4 BOSS (10 min) - Protegido

FASE 4 (Refinamento)
├─ Q4.1 (60 min) - SEM late
├─ Q4.2 (60 min) - SEM late
├─ Q4.3 (60 min) - SEM late
└─ Q4.4 BOSS (10 min) - Protegido

FASE 5 (Pitch Final)
├─ Q5.1 (60 min) COM late
├─ Q5.2 (60 min) COM late
└─ Q5.3 (60 min) COM late [+ 15 min final]

TOTAL: 12h 20min (12h quests + 20 min avaliação)
```

## Fluxo do Sistema

1. **Sistema roda AUTOMATICAMENTE**
   - Não precisa de intervenção manual
   - Late window NÃO afeta o cronograma do sistema

2. **Equipes com atraso**
   - Se entregam fora do horário = usam late window
   - Sistema segue normalmente (próxima quest já rodando)

3. **Boss (Fases 1-4)**
   - 10 minutos fixos
   - Protegido contra auto-ativação acidental

4. **Fase 5 (Pitch Final)**
   - Todas as quests com late window
   - Q5.3 + 15 min late + 20 min avaliação = FIM

5. **Event End Time**
   - event_end_time = NOW() + 12h 20min
   - Sistema encerra automaticamente

## O que Esperar dos Resultados

Se TUDO OK, você verá:
```
✅ FASES 1-4: 4 fases com 4 quests cada
✅ Q1-Q3 (Fases 1-4): SEM late window
✅ Boss (Fases 1-4): Tipo apresentação
✅ Boss (Fases 1-4): Duração 10 min
✅ Fase 5: 3 quests
✅ Fase 5: Todas COM late window
✅ Fase 5: SEM boss
```

Se ALGO DER ERRADO, avise qual requisito falhou! 🔴
