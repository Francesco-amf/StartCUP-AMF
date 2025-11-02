-- Criar equipes para os avaliadores se não existirem
INSERT INTO teams (email, name, course, members)
VALUES
  ('avaliador1@test.com', 'Avaliador 1', 'Avaliação', '[]'::jsonb),
  ('avaliador2@test.com', 'Avaliador 2', 'Avaliação', '[]'::jsonb),
  ('avaliador3@test.com', 'Avaliador 3', 'Avaliação', '[]'::jsonb)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    course = EXCLUDED.course,
    members = EXCLUDED.members;

-- Verificar se as equipes foram criadas
SELECT id, email, name, course FROM teams WHERE email LIKE 'avaliador%';
