INSERT INTO permissions (id, name, page_allow, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'MANAGE_COURSES', '["/admin/courses/**"]', now(), now()),
  (gen_random_uuid(), 'MANAGE_PAYMENTS', '["/admin/payments/**"]', now(), now()),
  (gen_random_uuid(), 'MANAGE_ROLES', '["/admin/roles/**"]', now(), now()),
  (gen_random_uuid(), 'MANAGE_NOTIFICATIONS', '["/admin/notifications/**"]', now(), now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
