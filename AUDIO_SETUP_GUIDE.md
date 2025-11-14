# 🔊 Guia de Setup - Sistema de Sons

## ⚠️ IMPORTANTE: Autorização de Áudio

Os sons no navegador modernos (Chrome, Firefox, Safari, Edge) têm uma **política de autoplay** de segurança.

### Problema
Ao abrir o navegador, os sons não tocam automaticamente. Isso é uma decisão de segurança do navegador para evitar que websites toquem áudio sem permissão.

### Solução: 3 Passos Simples

#### 1️⃣ **Abrir Live Dashboard**
```
http://localhost:3000/live-dashboard
```

#### 2️⃣ **Procurar pelo Banner de Autorização**
Na parte superior da página, você verá:

```
🔇 ⚠️ Para ouvir sons, clique em qualquer lugar da página
  Isso é uma política de segurança do navegador para evitar áudio indesejado
```

#### 3️⃣ **Clicar na Página (Qualquer Lugar)**
- Clique no banner
- Clique na página
- Digite algo (pressione uma tecla)
- Toque na tela (se mobile)

Após qualquer um desses, o banner muda para:

```
🔊 ✅ Áudio autorizado - Sons estão ativos!
```

---

## ✅ Depois que Autorizar

Agora os sons devem tocar:

- **Fase 1 Quest 1 inicia** → `event-start` toca
- **Quest normal** → `quest-start` toca
- **Quest 4 (BOSS)** → `boss-spawn` toca 2x
- **Mudança de fase** → `phase-start` toca

---

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Banner
O banner deve mostrar 🔊 (alto-falante) com mensagem verde:
```
✅ Áudio autorizado - Sons estão ativos!
```

### 2. Verificar Console (F12)
Procure por logs como:

```
📞 [useSoundSystem.play] Chamado com tipo: event-start
✅ Áudio pré-carregado: event-start
📀 Reproduzindo: event-start
▶️ Tentativa 1/3 de tocar: event-start
✅ Som tocando com sucesso: event-start
✅ Áudio terminado: event-start
```

### 3. Ouvir o Som
Você deve ouvir o som saindo dos alto-falantes/fones.

---

## 🐛 Troubleshooting

### Problema: Banner ainda mostra 🔇 (mudo)

**Solução:**
1. Certifique-se de que está clicando na página principal
2. Tente pressionar uma tecla (KeyDown)
3. Recarregue a página (F5) e tente novamente

### Problema: Não ouve nada mesmo após autorizar

**Checklist:**
- ✅ Banner mostra 🔊 (verde)
- ✅ Volume do navegador está ligado (não muted)
- ✅ Volume do computador está ligado
- ✅ Fones/alto-falantes estão plugados e ligados

**Se ainda não funcionar:**
1. Abrir Dev Tools (F12)
2. Ir para **Console**
3. Digitar: `navigator.mediaDevices.enumerateDevices()` e pressionar Enter
4. Verificar se há dispositivos de áudio listados

### Problema: Console mostra "NotAllowedError"

**Significa:** Áudio ainda não foi autorizado
**Solução:** Clique na página ou toque na tela

### Problema: Console mostra "Autoplay bloqueado"

**Significa:** Navegador específico tem política mais restritiva
**Solução:**
1. Permitir autoplay para este site nas configurações do navegador
2. Ou clicar no site antes de o som tocar

---

## 🎵 Sons Disponíveis

| Som | Quando Toca | Arquivo |
|-----|------------|---------|
| `event-start` | Fase 1 Quest 1 inicia | event-start.mp3 |
| `quest-start` | Quest normal inicia | quest-start.mp3 |
| `boss-spawn` | Quest 4 (boss) inicia | boss-spawn.wav |
| `phase-start` | Muda de fase | phase-start.mp3 |
| `quest-complete` | Quest completada | quest-complete.mp3 |
| `game-over` | Game over | game-over.mp3 |
| `winner-music` | Winner revelation | winner-music.mp3 |

---

## 🔧 Configurações de Áudio

### Volume
Você pode controlar o volume no componente SoundControlPanel (se disponível).

### Desabilitar Todos os Sons
Se os sons estiverem incomodando, você pode desabilitá-los via:
1. SoundControlPanel (se disponível)
2. Local Storage: `localStorage.setItem('soundConfig', JSON.stringify({ volume: 0.7, enabled: false }))`

---

## 📝 Código do Banner

O componente `AudioAuthorizationBanner.tsx` mostra:
```
🔇 ANTES de autorizar   → Aviso em amarelo
🔊 DEPOIS de autorizar  → Confirmação em verde
```

O banner é automático e desaparece após autorizar.

---

## 🚀 Teste Completo

1. Abrir `http://localhost:3000/live-dashboard`
2. Ver banner 🔇
3. Clicar em qualquer lugar
4. Banner muda para 🔊
5. Iniciar fase no Control Panel
6. Ouvir `event-start`
7. Avançar quests
8. Ouvir `quest-start`, `boss-spawn`, `phase-start`

---

## ✨ Resumo

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Abrir live-dashboard | Banner 🔇 aparece |
| 2 | Clicar na página | Banner muda para 🔊 |
| 3 | Iniciar evento | Sons começam a tocar |

**Não funciona?** → Recarregue a página (F5) e tente novamente

---

## 📞 Contato

Se os sons ainda não funcionar:
1. Verificar console (F12) para mensagens de erro
2. Confirmar que arquivos estão em `/public/sounds`
3. Confirmar que navegador permite áudio
4. Tentar em outro navegador para descartar problema específico

---

## 🎯 Comportamento Esperado Durante Teste

```
[00:00] Autorizar áudio (clicar na página)
       ↓
[00:00] Iniciar Fase 1 no Control Panel
       ↓
[00:00] event-start toca (som épico de evento start)
       ↓
[00:02] Quest 1.2 inicia
       ↓
[00:02] quest-start toca (som normal de nova quest)
       ↓
[00:04] Quest 1.3 inicia
       ↓
[00:04] quest-start toca
       ↓
[00:06] Quest 1.4 (BOSS) inicia
       ↓
[00:06] boss-spawn toca 2x (som épico de boss)
       ↓
[00:08] Quest 2.1 inicia (MUDANÇA DE FASE 1→2)
       ↓
[00:08] phase-start toca (som épico de transição de fase) ← NOVO!
       ↓
... continua...
```

---

## 🟢 Status

✅ Sistema de sons implementado
✅ Autorização de áudio automática
✅ Banner visual de status
✅ Console logs detalhados
✅ Todos os arquivos de áudio presentes

🚀 **Pronto para usar!**
