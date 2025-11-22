# Diagnóstico: Áudio Dessincronizado Entre Dispositivos

## Cenário
- **PC Principal** (seu): Som toca NORMAL ✅
- **Notebook Telão** (outro): Som LENTO ou FALHA ❌

## Possíveis Causas

### 1. **Latência na Stream de Áudio (Mais Provável)**
```
PC Principal              Notebook Telão
    ↓                          ↓
LOCAL AudioContext        STREAM AudioContext
    ↓                          ↓
   IMEDIATO              +200-500ms de latência
```

**Problema**: Dois AudioContexts diferentes = tempos diferentes

**Solução**:
- Se for **mesma página em abas**: Browser reutiliza 1 AudioContext
- Se for **URLs diferentes**: São 2 AudioContexts = DESSINCRONIZAM
- Se for **stream de áudio compartilhada**: Verificar bitrate/codec

### 2. **Conexão de Internet Fraca**
- Telão conectado em WiFi ruim?
- Stream chegando com buffer insuficiente?
- Áudio comprimido causando dropouts?

**Sintoma**: "Lento ou às vezes falha" = típico de conexão instável

### 3. **Decode de Áudio Lento no Notebook**
- Notebook com specs menores?
- AudioContext com sample rate diferente?
- Codec não otimizado?

## Perguntas Diagnósticas

1. **Como o áudio sai do PC Principal?**
   - 🔊 Alto-falante local?
   - 📡 Stream enviada para telão (ex: WebRTC, HLS)?
   - 📺 Tela espelhada (HDMI/Miracast)?

2. **O que vocês estão fazendo?**
   - Vendo a mesma página em 2 browsers?
   - Telão recebe stream de áudio via API?
   - É apresentação ao vivo com áudio compartilhado?

3. **Características da falha**:
   - ⏱️ Delay aumenta com o tempo?
   - 🔇 Áudio congela/pausa?
   - 📊 Volume baixo/entrecortado?

## Possíveis Soluções

### Se for BROWSER (mesma página):
```javascript
// ERRADO: 2 AudioContexts
PC:     new AudioContext()
Telão:  new AudioContext()  // ← Dessincroniza!

// CORRETO: 1 AudioContext compartilhado
// Usar Shared Audio Buffer ou Web Audio API com sincronização
```

### Se for STREAM DE ÁUDIO:
```javascript
// Verificar:
- Bitrate: 128kbps ou mais?
- Codec: MP3, AAC, Opus?
- Buffer size: 2-4 segundos?
- Latência inicial aceitável?

// Se telão recebe via HTTP:
fetch('/audio-stream')
  .then(r => r.arrayBuffer())
  .then(buffer => audioContext.decodeAudioData(buffer))
  // ↑ Isso é SÍNCRONO com o PC? Verificar!
```

### Se for DISPLAY COMPARTILHADA:
```
Se telão vê via HDMI/Miracast/AirPlay:
- Latência típica: 50-200ms
- Causa: Processamento de vídeo
- Solução: Aceitar delay natural ou usar áudio separado
```

## Recomendações Imediatas

1. **Verificar conexão Telão**:
   ```powershell
   # No notebook telão, abrir DevTools (F12)
   # Console > navigator.connection
   # Ver: downlink, rtt, effectiveType
   ```

2. **Testar AudioContext**:
   ```javascript
   console.log('AudioContext state:', audioContext.state);
   console.log('Sample rate:', audioContext.sampleRate);
   console.log('Output latency:', audioContext.outputLatency);
   ```

3. **Aumentar buffer se for stream**:
   - Se usando Web Audio: aumentar buffer size
   - Se usando \<audio\> tag: pré-carregar mais

4. **Sincronizar manualmente** (se necessário):
   ```javascript
   // Enviar timestamp do PC para Telão
   const syncTimestamp = Date.now();
   // Telão recebe e faz: playTime = syncTimestamp + latency
   ```

---

## Preciso de mais info!

Para diagnosticar melhor, responda:
- 📺 Como a imagem/áudio chega no telão?
- 🖥️ Telão está conectado em WiFi ou Ethernet?
- 📱 Vocês estão vendo a mesma página ou páginas diferentes?
- ⏱️ Qual é o delay aprox (em segundos)?
