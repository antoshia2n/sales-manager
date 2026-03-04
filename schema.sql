-- Sales Manager スキーマ
-- 既存のSupabaseプロジェクトにそのまま実行してOK

create table sm_sales (
  id         bigint primary key generated always as identity,
  month      text not null,
  name       text not null,
  business   text not null,
  amount     integer not null,
  type       text not null,
  method     text not null,
  note       text default '',
  created_at timestamptz default now()
);

create table sm_expenses (
  id         bigint primary key generated always as identity,
  category   text not null,
  name       text not null,
  amount     integer not null,
  note       text default '',
  created_at timestamptz default now()
);

create table sm_strategy (
  id         bigint primary key generated always as identity,
  key        text not null unique,  -- 'kgi' | 'kpi' | 'annual' | '1月' ... '12月'
  value      text default '',
  updated_at timestamptz default now()
);
