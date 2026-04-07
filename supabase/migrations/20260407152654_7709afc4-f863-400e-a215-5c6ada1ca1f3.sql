DROP POLICY "Clients can create tasks" ON public.tasks;
CREATE POLICY "Clients and admins can create tasks" ON public.tasks
  FOR INSERT TO public
  WITH CHECK (
    ((client_id = auth.uid()) AND is_client()) OR is_admin()
  );