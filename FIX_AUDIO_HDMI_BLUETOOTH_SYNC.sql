-- PROBLEMA IDENTIFICADO: Áudio Bluetooth + Projetor HDMI
-- ========================================================

-- Causa: Latência de Bluetooth vs Latência de HDMI
-- HDMI: ~50ms de processamento
-- Bluetooth: ~100-300ms de latência

-- RESULTADO: Áudio sai ATRASADO porque Bluetooth é mais lento que HDMI

-- ========================================================
-- SOLUÇÕES (em ordem de facilidade)
-- ========================================================

-- 1. MELHOR SOLUÇÃO: Usar caixa de som conectada ao PROJETOR (não ao notebook)
--    ✅ Sincroniza automaticamente
--    ✅ Sem Bluetooth latency
--    ✅ Audio sai junto com vídeo no HDMI
--    COMO: Projetor HDMI-IN → Caixa de som AUX (saída de áudio do projetor)

-- 2. SEGUNDA OPÇÃO: Usar caixa de som Bluetooth do NOTEBOOK (não transmitir)
--    ⚠️ Notebook fica com som local
--    ⚠️ Projetor sem som
--    ✅ Mas áudio fica sincronizado (sempre no Bluetooth do notebook)

-- 3. TERCEIRA OPÇÃO: Reduzir latência Bluetooth (workaround)
--    - Desabilitar outras conexões Bluetooth
--    - Aumentar qualidade de áudio: 320kbps, codec AAC/aptX
--    - Aproximar caixa do notebook

-- 4. FORÇAR SINCRONIZAÇÃO POR SOFTWARE (complexo)
--    - Medir latência Bluetooth em tempo real
--    - Adicionar delay artificial ao áudio de HDMI
--    - NÃO RECOMENDADO para event ao vivo

-- ========================================================
-- DIAGNÓSTICO: Qual é a latência Bluetooth?
-- ========================================================

-- Para medir (no notebook, F12 > Console):
/*
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
console.log('Output latency:', audioContext.outputLatency * 1000, 'ms');
console.log('Base latency:', audioContext.baseLatency * 1000, 'ms');

// Se > 200ms = Bluetooth com problema
*/

-- ========================================================
-- TESTE RÁPIDO
-- ========================================================

-- 1. Reproduza um beep/click no notebook
-- 2. Veja quando sai na caixa Bluetooth
-- 3. Compare com quando bate no projetor (vídeo)

-- Se caixa toca DEPOIS da imagem aparecer no projetor:
-- → Bluetooth está atrasado (latência típica 100-300ms)

-- ========================================================
-- RECOMENDAÇÃO PARA EVENTO
-- ========================================================

-- 🎯 MELHOR SETUP:
-- Notebook → [HDMI físico] → Projetor
-- Projetor → [AUX ou HDMI-ARC] → Caixa de Som
--
-- Audio sai junto com o vídeo, ZERO latência

-- ⚠️ PROBLEMA COM HDMI-ARC:
-- Alguns projetores não têm áudio out
-- SOLUÇÃO: Usar splitter HDMI com extrator de áudio
-- 
-- Notebook → HDMI Splitter → [HDMI 1] Projetor
--                          → [HDMI 2] Extrator Audio
--                                      → Caixa Bluetooth

-- ========================================================
-- CÓDIGO PARA SINCRONIZAR MANUALMENTE (se necessário)
-- ========================================================

/*
// Detectar latência Bluetooth
const getBluetoothLatency = async () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Bluetooth latency = outputLatency + baseLatency
  const totalLatency = (audioContext.outputLatency + audioContext.baseLatency) * 1000;
  
  console.log(`Bluetooth Latency: ${totalLatency}ms`);
  
  // Se > 150ms, considerar alternativa
  if (totalLatency > 150) {
    console.warn('⚠️ Bluetooth latency ALTA! Considerar usar caixa no projetor');
    return 'HIGH_LATENCY';
  } else if (totalLatency > 80) {
    console.warn('⚠️ Bluetooth latency MÉDIA - pode causar dessincronização');
    return 'MEDIUM_LATENCY';
  } else {
    console.log('✅ Bluetooth latency OK');
    return 'OK';
  }
};

// Chamar no início da apresentação
await getBluetoothLatency();
*/

-- ========================================================
-- PARA O SEU CASO ESPECÍFICO
-- ========================================================

-- Você tá ouvindo LENTO no projetor porque:
-- 1. Imagem sai via HDMI (rápido)
-- 2. Áudio sai via Bluetooth (lento)
-- 3. Resultado: Áudio DEIxa para trás

-- RECOMENDAÇÃO URGENTE:
-- Se possível, conecte a caixa de som na SAÍDA DE ÁUDIO DO PROJETOR
-- Aí áudio + vídeo saem sincronizados no HDMI

-- Se projetor não tiver áudio out:
-- Use HDMI splitter com extrator de áudio
-- (Custa ~R$50-100, muito vale à pena)
