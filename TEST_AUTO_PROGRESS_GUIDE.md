# 🧪 GUIA DE TESTE AUTOMÁTICO COMPLETO

## O que este sistema faz?

Simula o **evento inteiro** automaticamente em velocidade acelerada:
- ✅ Inicia o evento
- ✅ Ativa cada fase sequencialmente (1 → 2 → 3 → 4 → 5)
- ✅ Para cada fase, percorre todas as 4 quests (1 → 2 → 3 → BOSS 🔥)
- ✅ Avança automaticamente quando cada quest termina
- ✅ Permite visualizar em tempo real nas páginas do sistema

---

## 🚀 PASSO A PASSO (SUPER SIMPLES)

### 1️⃣ Iniciar o servidor

```powershell
cd C:\Users\symbi\Desktop\startcup-amf\startcup-amf
npm run dev
```

Aguarde: `✓ Ready in 2s`

---

### 2️⃣ Abrir a página de teste

No navegador, acesse:

```
http://localhost:3000/test/auto-progress
```

Você verá uma interface visual com controles.

---

### 3️⃣ Preparar as abas para visualizar

**ANTES de iniciar**, abra estas páginas em **NOVAS ABAS** (Ctrl+Click):

- 📊 **Live Dashboard**: http://localhost:3000/live-dashboard
- 📝 **Submissão**: http://localhost:3000/equipes/submissao
- 🎛️ **Painel Controle**: http://localhost:3000/control-panel

Organize as abas lado a lado para ver tudo ao mesmo tempo.

---

### 4️⃣ Iniciar o teste

Na página de teste (`/test/auto-progress`):

1. Escolha a velocidade:
   - **🏃 Fast (30s/quest)** ← Recomendado para testes rápidos
   - **⚡ Turbo (10s/quest)** ← Muito rápido, para ver apenas se funciona
   - **🐌 Real** ← Usa tempos reais (60min, 50min, etc.)

2. Clique em **"▶️ Iniciar Progressão"**

3. **DEIXE A PÁGINA ABERTA** para ver o progresso

---

### 5️⃣ O que vai acontecer?

A página de teste mostra:
- ✅ Fase atual (1/5, 2/5, etc.)
- ✅ Quest atual (1/4, 2/4, 3/4, 4/4)
- ✅ Tempo restante da quest (contagem regressiva)
- ✅ Última ação executada
- ✅ Barras de progresso visuais

**Nas outras abas abertas**, você verá:

#### 📊 Live Dashboard:
- Quest atual mudando a cada 30s (ou 10s em turbo)
- Timer contando regressivamente
- Quando chegar no BOSS (quest 4/4):
  - Fundo muda para **VERMELHO** 🔥
  - Aparece badge **"🔥 BOSS"**
  - Label muda para **"🎤 BOSS (4/4)"**

#### 📝 Página de Submissão:
- Quest atual mudando automaticamente
- Formulário aparecendo/desaparecendo
- Quando chegar no BOSS:
  - Aparece o **BossQuestCard** (fundo vermelho degradê)
  - Mensagem: "Não há submissão digital"
  - Timer de 10 minutos

#### 🎛️ Painel de Controle:
- Fase atual mudando
- Status das quests atualizando

---

### 6️⃣ Controles durante o teste

Na página `/test/auto-progress`:

- **⏸️ Parar**: Interrompe a progressão
- **🔄 Atualizar Status**: Recarrega o estado atual
- Botões de atalho para abrir páginas

---

## ⚡ Velocidades Explicadas

| Velocidade | Duração/Quest | Fase Completa | Evento Completo |
|------------|---------------|---------------|-----------------|
| **Fast** 🏃 | 30 segundos | ~2 minutos | ~10 minutos |
| **Turbo** ⚡ | 10 segundos | ~40 segundos | ~3-4 minutos |
| **Real** 🐌 | Tempo real (30-60min) | ~2.5 horas | ~12 horas |

---

## ✅ O que testar?

### Quest Regular (1, 2, 3):
- ✅ Formulário de submissão aparece?
- ✅ Timer funciona corretamente?
- ✅ Live Dashboard mostra fundo azul/roxo?
- ✅ Avança automaticamente para próxima quest?

### Quest BOSS (4):
- ✅ Fundo do Live Dashboard fica **VERMELHO**?
- ✅ Aparece badge **🔥 BOSS**?
- ✅ Label muda para **"🎤 BOSS (4/4)"**?
- ✅ BossQuestCard aparece na página de submissão?
- ✅ Timer mostra 10 minutos (ou 30s/10s em modo acelerado)?
- ✅ Mensagem "Não há submissão digital" aparece?

### Mudança de Fase:
- ✅ Após BOSS da Fase 1, avança para Fase 2?
- ✅ Quests da nova fase aparecem corretamente?
- ✅ Status das fases muda (Fase 1 completed → Fase 2 in_progress)?

---

## 🔄 Resetar e Testar Novamente

Para recomeçar do zero:

1. Clique em **"⏸️ Parar"** (se estiver rodando)
2. Clique em **"▶️ Iniciar Progressão"** novamente
   - O sistema reseta tudo automaticamente antes de iniciar

---

## 🐛 Resolução de Problemas

### "Estado não atualiza"
→ Clique em "🔄 Atualizar Status"

### "Páginas não mostram mudanças"
→ Dê refresh (F5) nas abas do Live Dashboard e Submissão

### "Progressão parou sozinha"
→ Verifique o console do navegador (F12) para erros

### "BOSS não aparece"
→ Certifique-se de ter executado `CREATE_BOSS_QUESTS.sql` no Supabase primeiro

---

## 📊 Exemplo de Fluxo Completo

```
🚀 Evento iniciado
├─ 📍 FASE 1: Ideação
│   ├─ Quest 1/4: Conhecendo o Terreno (30s)
│   ├─ Quest 2/4: A Persona Secreta (30s)
│   ├─ Quest 3/4: Construindo Pontes (30s)
│   └─ 🔥 Quest 4/4: BOSS 1 - Defesa do Problema (30s)
│
├─ 📍 FASE 2: Prototipação
│   ├─ Quest 1/4: ... (30s)
│   ├─ Quest 2/4: ... (30s)
│   ├─ Quest 3/4: ... (30s)
│   └─ 🔥 Quest 4/4: BOSS 2 - Demo do Protótipo (30s)
│
├─ 📍 FASE 3: Modelo de Negócio
│   └─ ... (mesmo padrão)
│
├─ 📍 FASE 4: Validação
│   └─ ... (mesmo padrão)
│
└─ 📍 FASE 5: Apresentação Final
    └─ 🔥 Quest 4/4: BOSS FINAL - Pitch Oficial (30s)

✅ Evento completo!
```

---

## 🎯 Checklist de Teste

- [ ] Servidor rodando (`npm run dev`)
- [ ] Página `/test/auto-progress` aberta
- [ ] Live Dashboard aberto em outra aba
- [ ] Página de Submissão aberta em outra aba
- [ ] BOSS quests criadas no Supabase
- [ ] Velocidade escolhida (Fast recomendado)
- [ ] Progressão iniciada
- [ ] BOSS aparece com visual vermelho
- [ ] Mudanças de fase funcionam
- [ ] Timer funciona corretamente

---

## 💡 Dica Final

Para o melhor teste visual:

1. Use **2 monitores** (ou divida a tela)
2. Monitor 1: Página de teste (`/test/auto-progress`)
3. Monitor 2: Live Dashboard + Submissão (lado a lado)
4. Escolha **Fast (30s)** para ver tudo sem pressa
5. Observe as mudanças acontecendo automaticamente! 🎬
