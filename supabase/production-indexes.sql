-- ============================================================
-- TAJ ERP — Production indexes for hot query paths
-- Run in Supabase → SQL Editor
-- Safe to re-run (IF NOT EXISTS)
-- ============================================================

create index if not exists attendance_employee_id_idx
  on attendance (employee_id);

create index if not exists attendance_created_at_idx
  on attendance (created_at desc);

create index if not exists tasks_assigned_to_idx
  on tasks (assigned_to);

create index if not exists tasks_status_idx
  on tasks (status);

create index if not exists orders_assigned_to_idx
  on orders (assigned_to);

create index if not exists orders_status_idx
  on orders (status);

create index if not exists orders_created_at_idx
  on orders (created_at desc);

create index if not exists salary_payments_employee_id_idx
  on salary_payments (employee_id);

create index if not exists salary_payments_month_year_idx
  on salary_payments (month, year);

create index if not exists salary_payments_employee_month_year_idx
  on salary_payments (employee_id, month, year);

create index if not exists employees_approval_status_idx
  on employees (approval_status);

create index if not exists employees_status_idx
  on employees (status);

create index if not exists employees_role_idx
  on employees (role);

create index if not exists calls_called_by_idx
  on calls (called_by);

create index if not exists calls_called_to_idx
  on calls (called_to);

create index if not exists wallet_transactions_from_employee_idx
  on wallet_transactions (from_employee_id);

create index if not exists wallet_transactions_created_by_idx
  on wallet_transactions (created_by);

create index if not exists wallet_transactions_created_at_idx
  on wallet_transactions (created_at desc);

create index if not exists shopkeepers_employee_id_idx
  on shopkeepers (employee_id);

create index if not exists shopkeepers_qr_token_idx
  on shopkeepers (qr_token);
