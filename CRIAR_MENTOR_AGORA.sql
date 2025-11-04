-- ==========================================
-- ✅ ATIVAR JARDEL COMO MENTOR ONLINE
-- ==========================================

-- Ver status atual de todos os mentores
SELECT id, name, email, is_online 
FROM evaluators 
WHERE role = 'mentor'
ORDER BY name;

-- Ativar Jardel (Rhauani) como online
UPDATE evaluators 
SET is_online = true 
WHERE email = 'rhauani.fazul@amf.edu.br'
RETURNING id, name, email, is_online;

-- Confirmar apenas mentores online
SELECT id, name, email, specialty, is_online
FROM evaluators 
WHERE role = 'mentor' AND is_online = true;
