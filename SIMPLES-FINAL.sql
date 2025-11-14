-- Status de Áurea Forma
SELECT s.status, COUNT(*) FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
GROUP BY s.status;
