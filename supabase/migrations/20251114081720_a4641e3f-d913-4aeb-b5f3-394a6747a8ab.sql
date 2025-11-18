-- Add UPDATE policy for admins on submissions table
CREATE POLICY "Admins can update submissions"
ON public.submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);