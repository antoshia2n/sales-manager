-- ① まず既存テーブルを削除（Supabase SQL Editorで実行）
drop table if exists sm_sales;
drop table if exists sm_expenses;
drop table if exists sm_strategy;

-- ② 新しいテーブルを作成

-- 継続・分割の「契約」
create table sm_contracts (
  id              bigint primary key generated always as identity,
  name            text not null,
  business        text not null,
  type            text not null,   -- 'recurring' | 'installment'
  amount          integer not null,
  method          text not null,
  start_month_idx integer not null, -- 0〜11（1月=0）
  end_month_idx   integer,          -- 停止時に設定
  total_count     integer,          -- 分割の場合の回数
  note            text default '',
  status          text default 'active', -- 'active' | 'stopped'
  created_at      timestamptz default now()
);

-- 各月の入金予定（契約から自動生成）
create table sm_payments (
  id                  bigint primary key generated always as identity,
  contract_id         bigint references sm_contracts(id) on delete cascade,
  name                text not null,
  business            text not null,
  month_idx           integer not null,
  amount              integer not null,
  method              text not null,
  type                text not null,   -- '継続' | '分割'
  installment_no      integer,         -- 分割の何回目
  total_installments  integer,
  paid                boolean default false,
  created_at          timestamptz default now()
);

-- 単発売上
create table sm_singles (
  id         bigint primary key generated always as identity,
  month_idx  integer not null,
  name       text not null,
  business   text not null,
  amount     integer not null,
  method     text not null,
  note       text default '',
  created_at timestamptz default now()
);

-- 経費（月額固定）
create table sm_expenses (
  id         bigint primary key generated always as identity,
  category   text not null,
  name       text not null,
  amount     integer not null,
  note       text default '',
  created_at timestamptz default now()
);

-- 戦略メモ
create table sm_strategy (
  id         bigint primary key generated always as identity,
  key        text not null unique,
  value      text default '',
  updated_at timestamptz default now()
);
