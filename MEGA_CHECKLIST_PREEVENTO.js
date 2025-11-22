// MEGA CHECKLIST PRÉ-EVENTO - CÓDIGO/API
// Execute isto no seu frontend (DevTools > Console)

console.clear();
console.log('🔍 MEGA CHECKLIST PRÉ-EVENTO - API/FRONTEND');
console.log('=' .repeat(60));

const checks = [];

// ========================================================
// 1. VERIFICAR AUTENTICAÇÃO
// ========================================================

async function checkAuth() {
  try {
    // Se usar Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Autenticado:', user.email);
      checks.push({ cat: 'AUTH', name: 'User autenticado', status: '✅', detail: user.email });
    } else {
      console.log('❌ NÃO autenticado');
      checks.push({ cat: 'AUTH', name: 'User autenticado', status: '❌', detail: 'none' });
    }
  } catch (e) {
    console.error('❌ Erro ao verificar auth:', e.message);
    checks.push({ cat: 'AUTH', name: 'Conexão Supabase', status: '❌', detail: e.message });
  }
}

// ========================================================
// 2. VERIFICAR CONEXÃO API
// ========================================================

async function checkAPI() {
  try {
    const response = await fetch('/api/quest-status', { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API /api/quest-status respondendo');
      checks.push({ cat: 'API', name: 'Endpoint /api/quest-status', status: '✅', detail: 'OK' });
    } else {
      console.log('❌ API respondendo com erro:', response.status);
      checks.push({ cat: 'API', name: 'Endpoint /api/quest-status', status: '❌', detail: response.status });
    }
  } catch (e) {
    console.log('❌ Erro ao conectar API:', e.message);
    checks.push({ cat: 'API', name: 'Conexão API', status: '❌', detail: e.message });
  }
}

// ========================================================
// 3. VERIFICAR REALTIME (Supabase subscriptions)
// ========================================================

async function checkRealtime() {
  try {
    // Tentar inscrever-se em mudanças
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, () => {})
      .subscribe();

    if (channel.state === 'SUBSCRIBED') {
      console.log('✅ Realtime funcionando');
      checks.push({ cat: 'REALTIME', name: 'Supabase realtime', status: '✅', detail: 'OK' });
    } else {
      console.log('⚠️ Realtime status:', channel.state);
      checks.push({ cat: 'REALTIME', name: 'Supabase realtime', status: '⚠️', detail: channel.state });
    }
    
    // Limpar
    supabase.removeChannel(channel);
  } catch (e) {
    console.log('❌ Erro ao verificar realtime:', e.message);
    checks.push({ cat: 'REALTIME', name: 'Supabase realtime', status: '❌', detail: e.message });
  }
}

// ========================================================
// 4. VERIFICAR PERMISOS DO USER
// ========================================================

async function checkPermissions() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = user.user_metadata?.role;
      console.log(`✅ Role do user: ${role}`);
      checks.push({ cat: 'PERMS', name: 'User role definido', status: '✅', detail: role });

      // Verificar se admin pode resetar sistema
      if (role === 'admin') {
        const response = await fetch('/api/admin/system-status', { method: 'GET' });
        if (response.ok) {
          console.log('✅ Admin pode acessar endpoints');
          checks.push({ cat: 'PERMS', name: 'Admin acesso endpoints', status: '✅', detail: 'OK' });
        } else {
          console.log('❌ Admin sem permissão endpoints');
          checks.push({ cat: 'PERMS', name: 'Admin acesso endpoints', status: '❌', detail: response.status });
        }
      }
    }
  } catch (e) {
    console.log('❌ Erro ao verificar perms:', e.message);
    checks.push({ cat: 'PERMS', name: 'Verificação perms', status: '❌', detail: e.message });
  }
}

// ========================================================
// 5. VERIFICAR CARREGAMENTO DE ASSETS
// ========================================================

async function checkAssets() {
  const assetChecks = [
    { name: 'Favicon', url: '/favicon.ico' },
    { name: 'Main CSS', url: '/styles/main.css' },
    { name: 'Main JS', url: '/scripts/main.js' },
  ];

  for (const asset of assetChecks) {
    try {
      const response = await fetch(asset.url, { method: 'HEAD' });
      if (response.ok || response.status === 200) {
        console.log(`✅ ${asset.name}: ${response.status}`);
        checks.push({ cat: 'ASSETS', name: asset.name, status: '✅', detail: response.status });
      } else {
        console.log(`❌ ${asset.name}: ${response.status}`);
        checks.push({ cat: 'ASSETS', name: asset.name, status: '❌', detail: response.status });
      }
    } catch (e) {
      console.log(`❌ ${asset.name}: ${e.message}`);
      checks.push({ cat: 'ASSETS', name: asset.name, status: '❌', detail: e.message });
    }
  }
}

// ========================================================
// 6. VERIFICAR LOCALSTORAGE/SESSÃO
// ========================================================

function checkStorage() {
  try {
    const hasLocalStorage = !!window.localStorage;
    console.log(`✅ LocalStorage: ${hasLocalStorage}`);
    checks.push({ cat: 'STORAGE', name: 'LocalStorage disponível', status: hasLocalStorage ? '✅' : '❌', detail: 'OK' });

    const hasSessionStorage = !!window.sessionStorage;
    console.log(`✅ SessionStorage: ${hasSessionStorage}`);
    checks.push({ cat: 'STORAGE', name: 'SessionStorage disponível', status: hasSessionStorage ? '✅' : '❌', detail: 'OK' });

    // Verificar cookies
    const hasCookies = document.cookie.length > 0;
    console.log(`✅ Cookies: ${hasCookies}`);
    checks.push({ cat: 'STORAGE', name: 'Cookies habilitados', status: hasCookies ? '✅' : '⚠️', detail: document.cookie.length });
  } catch (e) {
    console.log('❌ Erro ao verificar storage:', e.message);
    checks.push({ cat: 'STORAGE', name: 'Storage check', status: '❌', detail: e.message });
  }
}

// ========================================================
// 7. VERIFICAR PERFORMANCE
// ========================================================

async function checkPerformance() {
  try {
    const perfData = performance.getEntriesByType('navigation')[0];
    const loadTime = perfData?.loadEventEnd - perfData?.loadEventStart;
    const timeToFirstByte = perfData?.responseEnd - perfData?.requestStart;
    
    console.log(`✅ Load time: ${loadTime}ms`);
    checks.push({ cat: 'PERF', name: 'Load time', status: '✅', detail: `${loadTime}ms` });
    
    console.log(`✅ Time to first byte: ${timeToFirstByte}ms`);
    checks.push({ cat: 'PERF', name: 'Time to first byte', status: timeToFirstByte < 1000 ? '✅' : '⚠️', detail: `${timeToFirstByte}ms` });
  } catch (e) {
    console.log('⚠️ Erro ao verificar performance:', e.message);
  }
}

// ========================================================
// 8. VERIFICAR ÁUDIO/VIDEO
// ========================================================

function checkMediaSupport() {
  const audio = new Audio();
  const canPlayMP3 = audio.canPlayType('audio/mpeg') !== '';
  const canPlayWAV = audio.canPlayType('audio/wav') !== '';
  
  console.log(`✅ Suporta MP3: ${canPlayMP3}`);
  checks.push({ cat: 'MEDIA', name: 'Audio MP3 suportado', status: canPlayMP3 ? '✅' : '❌', detail: 'OK' });
  
  console.log(`✅ Suporta WAV: ${canPlayWAV}`);
  checks.push({ cat: 'MEDIA', name: 'Audio WAV suportado', status: canPlayWAV ? '✅' : '❌', detail: 'OK' });
}

// ========================================================
// 9. VERIFICAR NOTIFICAÇÕES
// ========================================================

function checkNotifications() {
  if ('Notification' in window) {
    console.log(`✅ Notifications suportadas: ${Notification.permission}`);
    checks.push({ cat: 'NOTIF', name: 'Notifications API', status: '✅', detail: Notification.permission });
  } else {
    console.log('❌ Notifications NÃO suportadas');
    checks.push({ cat: 'NOTIF', name: 'Notifications API', status: '❌', detail: 'not supported' });
  }
}

// ========================================================
// RUN ALL CHECKS
// ========================================================

async function runAllChecks() {
  console.log('\n🔄 Executando todos os checks...\n');
  
  await checkAuth();
  await checkAPI();
  await checkRealtime();
  await checkPermissions();
  await checkAssets();
  checkStorage();
  await checkPerformance();
  checkMediaSupport();
  checkNotifications();

  // ========================================================
  // RESULTADO FINAL
  // ========================================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(60));

  const grouped = {};
  checks.forEach(c => {
    if (!grouped[c.cat]) grouped[c.cat] = [];
    grouped[c.cat].push(c);
  });

  Object.entries(grouped).forEach(([cat, items]) => {
    console.group(`${cat} (${items.length} checks)`);
    items.forEach(item => {
      console.log(`${item.status} ${item.name}: ${item.detail}`);
    });
    console.groupEnd();
  });

  const total = checks.length;
  const passed = checks.filter(c => c.status === '✅').length;
  const warnings = checks.filter(c => c.status === '⚠️').length;
  const failed = checks.filter(c => c.status === '❌').length;

  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${passed}/${total} checks passaram`);
  if (warnings > 0) console.log(`⚠️ ${warnings} warnings`);
  if (failed > 0) console.log(`❌ ${failed} FALHARAM - REVISAR!`);
  console.log('='.repeat(60));

  if (failed === 0 && warnings === 0) {
    console.log('\n🟢 TUDO OK! PRONTO PARA EVENTO!\n');
  } else if (failed === 0) {
    console.log('\n🟡 TUDO OK, MAS REVISAR OS WARNINGS\n');
  } else {
    console.log('\n🔴 PROBLEMAS CRÍTICOS ENCONTRADOS!\n');
  }
}

// EXECUTAR
await runAllChecks();
