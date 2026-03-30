INSERT INTO public.user_roles (user_id, role)
VALUES ('7cec140e-4337-41c1-aa2e-408290ea4b65', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;