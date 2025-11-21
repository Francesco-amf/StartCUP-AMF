-- Adicionar Jessica Baratto na tabela evaluators

INSERT INTO evaluators (id, name, email, specialty, is_online, role)
VALUES (
    'c7512b27-7639-4808-92d8-064e9ea660f1',
    'Jessica Baratto',
    'jessica.baratto@startcup-amf.com',
    'Avaliadora',
    false,
    'evaluator'
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    specialty = EXCLUDED.specialty,
    role = EXCLUDED.role;

-- Verificar
SELECT id, name, email, specialty, is_online, role, created_at
FROM evaluators
WHERE email = 'jessica.baratto@startcup-amf.com';
