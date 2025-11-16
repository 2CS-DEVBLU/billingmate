-- Add policy allowing admins to update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (is_admin());

-- Add policy allowing admins to delete profiles
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (is_admin());
