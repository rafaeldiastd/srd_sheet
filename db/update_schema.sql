-- Add missing columns to the sheets table
alter table public.sheets 
add column if not exists class text,
add column if not exists race text,
add column if not exists level integer default 1;
