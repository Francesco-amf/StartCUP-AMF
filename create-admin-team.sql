-- Criar equipe para admin@test.com se não existir
INSERT INTO teams (email, name, course, members)
VALUES ('admin@test.com', 'Admin Team', 'Administration', '[]'::jsonb)
ON CONFLICT (email) DO UPDATE SET name = 'Admin Team', course = 'Administration', members = '[]'::jsonb;

-- Verificar se a equipe foi criada
SELECT id, email, name, course, members FROM teams WHERE email = 'admin@test.com';
