# 🧪 Comandos de Teste para Console (F12)

Execute estes comandos na aba **Console** do DevTools para testar o sistema de áudio.

---

## 1️⃣ Verificar Configuração de Áudio

```javascript
// Mostrar configuração de som armazenada
console.log('Configuração de som:', localStorage.getItem('soundConfig'))

// Esperado: {"volume": 0.7, "enabled": true}
// Se "enabled" é false, os sons estão desabilitados!
```

---

## 2️⃣ Habilitar Sons (Se Desabilitados)

```javascript
// Se soundConfig.enabled é false, execute isto para habilitar:
localStorage.setItem('soundConfig', JSON.stringify({ volume: 0.7, enabled: true }))
console.log('✅ Sons habilitados!')

// Recarregue a página
location.reload()
```

---

## 3️⃣ Testar Áudio Manual (HTMLAudio)

```javascript
// Tocar event-start manualmente
const audio = new Audio('/sounds/event-start.mp3')
audio.volume = 0.7
audio.play()
  .then(() => console.log('✅ event-start.mp3 tocou!'))
  .catch(err => console.error('❌ Erro:', err.message))
```

**Você deve OUVIR o som event-start**

Se não ouve:
- Volume do navegador está muted? (clique no ícone de volume)
- Volume do computador está muted?
- Fones desconectados?

---

## 4️⃣ Testar Todos os Sons Principais

```javascript
// Função para testar um som
async function testSound(name) {
  console.log(`🎵 Tocando ${name}...`)
  const audio = new Audio(`/sounds/${name}.mp3`)
  audio.onerror = () => {
    console.log(`/sounds/${name}.mp3`)
    audio.src = `/sounds/${name}.wav`
  }
  audio.volume = 0.7
  await audio.play()
  console.log(`✅ ${name} tocou!`)
}

// Testar em sequência (espera cada som terminar)
async function testAllSounds() {
  await testSound('event-start')
  await new Promise(r => setTimeout(r, 3000)) // Espera 3s

  await testSound('quest-start')
  await new Promise(r => setTimeout(r, 2000))

  await testSound('boss-spawn')
  await new Promise(r => setTimeout(r, 2000))

  await testSound('phase-start')

  console.log('✅ Teste de sons completo!')
}

// Execute:
testAllSounds()
```

---

## 5️⃣ Verificar AudioContext State

```javascript
// Verificar estado do Web Audio API Context
const ctx = new (window.AudioContext || window.webkitAudioContext)()
console.log('AudioContext state:', ctx.state)

// Esperado: "running"
// Se "suspended": Context precisa de interação do usuário

// Se suspended, tentar retomar:
if (ctx.state === 'suspended') {
  ctx.resume().then(() => console.log('✅ AudioContext retomado!'))
}
```

---

## 6️⃣ Verificar Disponibilidade de Dispositivos de Áudio

```javascript
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log('Dispositivos de áudio disponíveis:')
    devices
      .filter(d => d.kind === 'audiooutput')
      .forEach(d => console.log(`  🔊 ${d.label || 'Speaker'}`))

    if (devices.filter(d => d.kind === 'audiooutput').length === 0) {
      console.warn('❌ Nenhum dispositivo de áudio detectado!')
    }
  })
```

---

## 7️⃣ Testar useSoundSystem Hook (Indiretamente)

```javascript
// Verificar se audioManager está acessível via devtools
// (Essa é uma forma de testar sem modificar código)

// Procure no console por estes logs quando uma quest começa:
// "📞 [useSoundSystem.play] Chamado com tipo: event-start"

// Se este log NÃO aparecer quando uma quest começa:
// - Hook não foi chamado
// - isFirstActivation ou isQuestChange são false
```

---

## 8️⃣ Monitorar Console em Tempo Real

```javascript
// Adicionar listener para novos logs
// Isto ajuda a ver logs em tempo real durante teste

// Chrome: Use "Preserve log" (checkbox no console)
// Firefox: Use "Persist logs" (checkbox no console)

// Depois, execute:
console.clear()
console.log('🔴 MONITORANDO LOGS... Inicie Fase 1 no Control Panel')
```

---

## 9️⃣ Testar Prioridade de Sons

```javascript
// A fila de sons respeita prioridades:
// 0 = máxima (event-start, phase-start, boss-spawn)
// 5 = média-baixa (quest-start)

// Quando phase-start toca, quest-start deve ser removida da fila

// Procure por este log no console:
// "🔥 [EnqueueSound] Som de transição (phase-start) detectado! Removidas X instância(s) de quest-start."

// Se este log aparecer: Sistema de prioridade funciona ✅
```

---

## 🔟 Verificar Arquivo Carregado Corretamente

```javascript
// Verificar se arquivo MP3/WAV está sendo carregado
fetch('/sounds/event-start.mp3')
  .then(res => {
    console.log(`✅ event-start.mp3 respondeu: ${res.status}`)
    console.log(`   Content-Type: ${res.headers.get('content-type')}`)
    console.log(`   Content-Length: ${res.headers.get('content-length')} bytes`)
  })
  .catch(err => console.error('❌ Erro ao buscar evento-start.mp3:', err))
```

---

## 📋 Sequência Completa de Testes

Execute na seguinte ordem:

```javascript
// 1. Verificar configuração
localStorage.getItem('soundConfig')

// 2. Testar AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)()
ctx.state

// 3. Testar uma música simples
new Audio('/sounds/event-start.mp3').play()

// 4. Verificar arquivo HTTP
fetch('/sounds/event-start.mp3').then(r => console.log(r.status))

// 5. Verificar dispositivos de áudio
navigator.mediaDevices.enumerateDevices().then(d => {
  console.log('Speakers:', d.filter(x => x.kind === 'audiooutput').length)
})
```

Se todos os testes acima funcionam:
- ✅ Configuração OK
- ✅ AudioContext OK
- ✅ Arquivo pode tocar
- ✅ Arquivo está em HTTP
- ✅ Dispositivo de áudio OK

Se CurrentQuestTimer logs aparecem MAS som não toca:
→ Problema deve estar em useSoundSystem ou audioManager

---

## 🎯 Teste Interativo Completo

1. Copie e cole no console:

```javascript
console.log('=== TESTE COMPLETO DE ÁUDIO ===')

// Etapa 1: Config
const config = JSON.parse(localStorage.getItem('soundConfig') || '{}')
console.log('1. Configuração:', config.enabled ? '✅ Habilitada' : '❌ Desabilitada')

// Etapa 2: AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)()
console.log('2. AudioContext:', ctx.state === 'running' ? '✅ Running' : '⚠️ ' + ctx.state)

// Etapa 3: Volume do Navegador
const audio = document.querySelector('audio')
console.log('3. Volume do navegador:', audio?.volume ?? 'N/A')

// Etapa 4: Reproduzir Som
console.log('4. Tocando sound test...')
const test = new Audio('/sounds/quest-start.mp3')
test.volume = 0.7
test.play()
  .then(() => console.log('   ✅ Som tocou!'))
  .catch(e => console.error('   ❌ Erro:', e.message))

console.log('=== FIM DO TESTE ===')
```

2. Clique Enter
3. **Você DEVE ouvir quest-start.mp3**

---

## 🚨 Se Nada Funcionar

Faça um "hard refresh":
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

Isto limpa cache e força recarregar JavaScript.

---

## 📊 Seu Checklist

Execute cada comando e anote o resultado:

- [ ] `localStorage.getItem('soundConfig')` → {"volume": 0.7, "enabled": true}
- [ ] `new (window.AudioContext || window.webkitAudioContext)().state` → "running"
- [ ] `new Audio('/sounds/event-start.mp3').play()` → 🔊 Sound plays
- [ ] `navigator.mediaDevices.enumerateDevices()` → 1+ audiooutput devices
- [ ] `fetch('/sounds/event-start.mp3')` → 200 OK

Se TODOS acima funcionam, o problema é específico de CurrentQuestTimer ou useSoundSystem.

---

**Próximo passo:** Envie os resultados destes testes para análise
