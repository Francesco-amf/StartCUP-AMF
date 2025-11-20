-- ============================================================================
-- FIX: Permitir avaliadores criarem submissions para Boss Battles
-- ============================================================================
-- PROBLEMA: Avaliadores não conseguem criar submissions para Boss porque
--           a RLS policy só permite que teams criem submissions
-- SOLUÇÃO: Adicionar policy para avaliadores criarem submissions
-- ============================================================================

-- Adicionar policy para permitir avaliadores criarem submissions
CREATE POLICY "Allow evaluators to create submissions" ON submissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evaluators
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
  )
);

-- Nota: Esta policy permite que avaliadores criem submissions para Boss Battles
-- onde a apresentação é presencial e não há entrega digital prévia
