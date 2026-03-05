// @ts-nocheck
"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from "recharts"
import {
  TrendingUp, Receipt, CreditCard, Plus, X, RefreshCw,
  ChevronRight, ChevronLeft, Check, BarChart2, Activity,
  FileText, Target, Users, Briefcase, BookOpen, AlertCircle,
  CheckSquare, Pause, Play, Trash2, Calendar
} from "lucide-react"
import type { Contract, Payment, SingleSale, Expense, StrategyEntry } from "@/lib/types"

/* ─── Design Tokens ─────────────────────────── */
const C = {
  bg:"#F7F5F0", panel:"#FFFFFF", panel2:"#EEEBE6",
  border:"#E2DDD6", hover:"#E8E4DD",
  text:"#1C1917", sub:"#6B6560", muted:"#A8A39C",
  primary:"#6C8EF5", success:"#4ECBA0", warn:"#F5A623", danger:"#E05C5C",
}
const MONO = "'DM Mono','JetBrains Mono',monospace"
const FONT = "'Noto Sans JP','Hiragino Sans',sans-serif"

/* ─── Constants ─────────────────────────────── */
const BUSINESSES  = ["しあらぼ","CW案件","教材販売","その他"]
const BIZ_COLOR   = {"しあらぼ":C.primary,"CW案件":"#4ECBA0","教材販売":"#F5A623","その他":"#A8A39C"}
const BIZ_ICON    = {"しあらぼ":Users,"CW案件":Briefcase,"教材販売":BookOpen,"その他":BarChart2}
const BIZ_TARGET  = {"しあらぼ":75,"CW案件":65,"教材販売":80,"その他":60}
const PAY_METHODS = ["振込","クレカ","その他"]
const MONTHS      = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
const EXP_CATS    = ["ツール","固定費","ライフライン","外注費","その他"]

// 現在月（0-index）。本番では new Date().getMonth() に変更してください
const CURRENT_M = new Date().getMonth()

/* ─── Helpers ───────────────────────────────── */
const fmtY = n => "¥" + Math.abs(Math.round(n)).toLocaleString()
const fmtM = n => {
  const a = Math.abs(n)
  if (a >= 1000000) return (a/10000).toFixed(0)+"万"
  if (a >= 10000)   return (a/10000).toFixed(1)+"万"
  return a.toLocaleString()
}
const chip = (color, label) => (
  <span style={{ display:"inline-block", background:color+"18", color,
    border:`1px solid ${color}33`, borderRadius:4, padding:"2px 7px",
    fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>
)
const badge = (color, label) => (
  <span style={{ display:"inline-flex", alignItems:"center",
    background:color+"15", color, border:`1px solid ${color}30`,
    borderRadius:12, padding:"3px 9px", fontSize:11, fontWeight:700 }}>{label}</span>
)

/* ─── Strategy helper ───────────────────────── */
const strategyToState = (entries) => {
  const base = { kgi:"", kpi:"", annual:"", months:Object.fromEntries(MONTHS.map(m=>[m,""])) }
  entries.forEach(({ key, value }) => {
    if (["kgi","kpi","annual"].includes(key)) base[key] = value
    else if (MONTHS.includes(key)) base.months[key] = value
  })
  return base
}

/* ─── Tooltip Components ────────────────────── */
const SalesTooltip = ({ active, payload, label, expMo }) => {
  if (!active || !payload?.length) return null
  const confirmed   = payload.find(p=>p.dataKey==="確定売上")?.value || 0
  const uncollected = payload.find(p=>p.dataKey==="未収金")?.value || 0
  const 利益 = confirmed - expMo
  const isRed = 利益 < 0
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px",
      fontSize:12, boxShadow:"0 6px 24px rgba(0,0,0,0.12)", minWidth:210 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>{label}</div>
      {[
        { label:"確定売上",  val:confirmed,    color:C.primary },
        { label:"未収金",    val:uncollected,  color:C.warn    },
        { label:"経費（月）", val:expMo,       color:C.danger  },
      ].map(({label:l,val,color}) => (
        <div key={l} style={{ display:"flex", justifyContent:"space-between", gap:20, marginBottom:4 }}>
          <span style={{ color:C.muted }}>{l}</span>
          <span style={{ fontFamily:MONO, fontWeight:700, color }}>¥{val.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:6, marginTop:6, display:"flex", justifyContent:"space-between" }}>
        <span style={{ color:C.muted }}>利益</span>
        <span style={{ fontFamily:MONO, fontWeight:800, color:isRed?C.danger:C.success }}>
          {isRed?"-":""}¥{Math.abs(利益).toLocaleString()}
        </span>
      </div>
      {uncollected > 0 && (
        <div style={{ marginTop:8, background:C.warn+"12", border:`1px solid ${C.warn}33`, borderRadius:6, padding:"6px 9px" }}>
          <span style={{ fontSize:11, color:C.warn }}>未収 ¥{uncollected.toLocaleString()} が含まれていません</span>
        </div>
      )}
      {isRed && (
        <div style={{ marginTop:6, background:C.danger+"12", border:`1px solid ${C.danger}33`, borderRadius:6, padding:"6px 9px" }}>
          <span style={{ fontSize:11, color:C.danger }}>赤字 — 黒字化には +¥{Math.abs(利益).toLocaleString()} 必要</span>
        </div>
      )}
    </div>
  )
}

const ProfitTooltip = ({ active, payload, label, target=300000 }) => {
  if (!active || !payload?.length) return null
  const 利益 = payload[0]?.value || 0
  const isRed = 利益 < 0
  const toTarget = target - 利益
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px",
      fontSize:12, boxShadow:"0 6px 24px rgba(0,0,0,0.12)", minWidth:190 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>{label}</div>
      <div style={{ display:"flex", justifyContent:"space-between", gap:24, marginBottom:10 }}>
        <span style={{ color:C.muted }}>利益</span>
        <span style={{ fontFamily:MONO, fontWeight:800, fontSize:15, color:isRed?C.danger:C.success }}>
          {isRed?"-":""}¥{Math.abs(利益).toLocaleString()}
        </span>
      </div>
      {isRed ? (
        <div style={{ background:C.danger+"12", border:`1px solid ${C.danger}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.danger, fontWeight:700, marginBottom:2 }}>赤字アラート</div>
          <div style={{ fontSize:11, color:C.danger }}>目標まで <strong>¥{toTarget.toLocaleString()}</strong> 不足</div>
        </div>
      ) : toTarget > 0 ? (
        <div style={{ background:C.warn+"12", border:`1px solid ${C.warn}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.warn }}>目標まであと <strong>¥{toTarget.toLocaleString()}</strong></div>
        </div>
      ) : (
        <div style={{ background:C.success+"12", border:`1px solid ${C.success}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.success, fontWeight:700 }}>目標利益 達成</div>
        </div>
      )}
    </div>
  )
}

/* ─── UI Primitives ─────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
    padding:"18px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>
    {children}
  </div>
)
const SL = ({ Icon, children }) => (
  <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, fontWeight:700,
    color:C.muted, letterSpacing:1.5, marginBottom:14 }}>
    <Icon size={13} strokeWidth={1.5} color={C.muted} />
    {String(children).toUpperCase()}
  </div>
)
const Btn = ({ onClick, children, color, disabled, small, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:"flex", alignItems:"center", gap:5,
    background:color||C.primary, color:"#fff", border:"none",
    borderRadius:8, padding:small?"6px 12px":"8px 18px",
    fontSize:small?12:13, fontWeight:700, cursor:disabled?"default":"pointer",
    fontFamily:FONT, transition:"all 0.15s", opacity:disabled?0.4:1, ...style,
  }}>{children}</button>
)
const GhostBtn = ({ onClick, children, small }) => (
  <button onClick={onClick} style={{
    display:"flex", alignItems:"center", gap:5,
    background:"none", border:`1px solid ${C.border}`, borderRadius:8,
    padding:small?"6px 12px":"8px 16px", fontSize:small?12:13,
    color:C.sub, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
  }}>{children}</button>
)
const TH = ({ children }) => (
  <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1 }}>{String(children).toUpperCase()}</div>
)
const Progress = ({ paid, total, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <div style={{ flex:1, height:6, background:C.panel2, borderRadius:3, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${total>0?paid/total*100:0}%`, background:color, borderRadius:3, transition:"width 0.3s" }} />
    </div>
    <span style={{ fontSize:11, fontFamily:MONO, color:C.sub, whiteSpace:"nowrap" }}>{paid}/{total}</span>
  </div>
)

/* ─── Main Component ─────────────────────────── */
export default function SalesManager({
  initialContracts,
  initialPayments,
  initialSingles,
  initialExpenses,
  initialStrategy,
}) {
  const [tab, setTab]                 = useState("dashboard")
  const [contracts, setContracts]     = useState(initialContracts)
  const [payments, setPayments]       = useState(initialPayments)
  const [singles, setSingles]         = useState(initialSingles)
  const [expenses, setExpenses]       = useState(initialExpenses)
  const [strategy, setStrategy]       = useState(() => strategyToState(initialStrategy))
  const [wizard, setWizard]           = useState(null)
  const [activeMonth, setActiveMonth] = useState(null)
  const [expandedContract, setExpandedContract] = useState(null)
  const [saving, setSaving]           = useState(false)

  /* ─ Derived ─ */
  // 月額固定経費と単発経費を分離
  const recurringExps   = useMemo(() => expenses.filter(e => e.is_recurring !== false), [expenses])
  const oneTimeExps     = useMemo(() => expenses.filter(e => e.is_recurring === false),  [expenses])
  const totalExpMo      = useMemo(() => recurringExps.reduce((a,e)=>a+e.amount,0), [recurringExps])
  const oneTimeExpTotal = useMemo(() => oneTimeExps.reduce((a,e)=>a+e.amount,0),   [oneTimeExps])
  const totalExpAnnual  = totalExpMo * 12 + oneTimeExpTotal

  const paidRev = useMemo(() =>
    payments.filter(p=>p.paid).reduce((a,p)=>a+p.amount,0) +
    singles.reduce((a,s)=>a+s.amount,0),
  [payments, singles])

  const uncollectedPayments = useMemo(() =>
    payments.filter(p => !p.paid && p.month_idx <= CURRENT_M),
  [payments])
  const uncollectedTotal = useMemo(() =>
    uncollectedPayments.reduce((a,p)=>a+p.amount,0),
  [uncollectedPayments])

  // 見込み売上 = 確定 + 未収 + 今後の予定入金
  const futurePayments  = useMemo(() =>
    payments.filter(p => !p.paid && p.month_idx > CURRENT_M).reduce((a,p)=>a+p.amount,0),
  [payments])
  const projectedRev    = paidRev + uncollectedTotal + futurePayments
  const projectedProfit = projectedRev - totalExpAnnual

  const totalProfit = paidRev - totalExpAnnual
  const profitRate  = paidRev > 0 ? totalProfit / paidRev * 100 : 0

  const bizData = useMemo(() => BUSINESSES.map(biz => {
    const rev = payments.filter(p=>p.business===biz&&p.paid).reduce((a,p)=>a+p.amount,0) +
                singles.filter(s=>s.business===biz).reduce((a,s)=>a+s.amount,0)
    const share  = paidRev > 0 ? rev/paidRev : 0
    const alloc  = totalExpAnnual * share
    const margin = rev > 0 ? Math.round((rev-alloc)/rev*100) : 0
    const target = BIZ_TARGET[biz]
    return { biz, rev, share:Math.round(share*100), margin, target, gap:margin-target }
  }), [payments, singles, paidRev, totalExpAnnual])

  const monthlyChartData = useMemo(() => MONTHS.map((m, idx) => ({
    month: m,
    確定売上: payments.filter(p=>p.month_idx===idx&&p.paid).reduce((a,p)=>a+p.amount,0) +
             singles.filter(s=>s.month_idx===idx).reduce((a,s)=>a+s.amount,0),
    未収金: payments.filter(p=>p.month_idx===idx&&!p.paid&&idx<=CURRENT_M).reduce((a,p)=>a+p.amount,0),
    目標: 1200000,
  })), [payments, singles])

  const profitTrend = useMemo(() => MONTHS.map((m, idx) => ({
    month: m,
    利益: (payments.filter(p=>p.month_idx===idx&&p.paid).reduce((a,p)=>a+p.amount,0) +
           singles.filter(s=>s.month_idx===idx).reduce((a,s)=>a+s.amount,0)) - totalExpMo,
  })), [payments, singles, totalExpMo])

  const finMonthData = useMemo(() => MONTHS.map((m, idx) => {
    const rev    = payments.filter(p=>p.month_idx===idx&&p.paid).reduce((a,p)=>a+p.amount,0) +
                   singles.filter(s=>s.month_idx===idx).reduce((a,s)=>a+s.amount,0)
    const uncol  = payments.filter(p=>p.month_idx===idx&&!p.paid&&idx<=CURRENT_M).reduce((a,p)=>a+p.amount,0)
    const profit = rev - totalExpMo
    const byBiz  = BUSINESSES.map(biz => ({
      biz,
      v: payments.filter(p=>p.month_idx===idx&&p.business===biz&&p.paid).reduce((a,p)=>a+p.amount,0) +
         singles.filter(s=>s.month_idx===idx&&s.business===biz).reduce((a,s)=>a+s.amount,0)
    }))
    const entries = [
      ...payments.filter(p=>p.month_idx===idx),
      ...singles.filter(s=>s.month_idx===idx).map(s=>({...s, type:"単発", paid:true})),
    ]
    return { month:m, monthIdx:idx, rev, uncol, exp:totalExpMo, profit, byBiz, entries }
  }), [payments, singles, totalExpMo])

  /* ─ API Actions ─ */
  const togglePaid = async (paymentId) => {
    const p = payments.find(x=>x.id===paymentId)
    if (!p) return
    setPayments(prev => prev.map(x => x.id===paymentId ? {...x, paid:!x.paid} : x))
    await fetch(`/api/sm-payments/${paymentId}`, {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ paid: !p.paid }),
    })
  }

  const markAllMonthPaid = async (monthIdx) => {
    setPayments(prev => prev.map(p =>
      p.month_idx===monthIdx && !p.paid && monthIdx<=CURRENT_M ? {...p, paid:true} : p
    ))
    await fetch("/api/sm-payments/bulk", {
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"mark_month_paid", month_idx:monthIdx }),
    })
  }

  const stopContract = async (id) => {
    setContracts(prev => prev.map(c => c.id===id ? {...c, status:"stopped", end_month_idx:CURRENT_M} : c))
    setPayments(prev => prev.filter(p => !(p.contract_id===id && p.month_idx > CURRENT_M)))
    await fetch(`/api/sm-contracts/${id}`, {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status:"stopped", end_month_idx:CURRENT_M }),
    })
    await fetch("/api/sm-payments/bulk", {
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"delete_future", contract_id:id, from_month_idx:CURRENT_M }),
    })
  }

  const resumeContract = async (id) => {
    const c = contracts.find(x=>x.id===id)
    if (!c) return
    setContracts(prev => prev.map(x => x.id===id ? {...x, status:"active", end_month_idx:null} : x))
    await fetch(`/api/sm-contracts/${id}`, {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status:"active", end_month_idx:null }),
    })
    // 今月〜12月の予定を再生成
    const newRows = []
    for (let m = CURRENT_M; m <= 11; m++) {
      newRows.push({ contract_id:c.id, name:c.name, business:c.business,
        month_idx:m, amount:c.amount, method:c.method, type:"継続", paid:false })
    }
    const res = await fetch("/api/sm-payments", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(newRows),
    })
    const created = await res.json()
    setPayments(prev => [...prev, ...created])
  }

  const deleteContract = async (id) => {
    setContracts(prev => prev.filter(c=>c.id!==id))
    setPayments(prev => prev.filter(p => !(p.contract_id===id && !p.paid && p.month_idx >= CURRENT_M)))
    await fetch(`/api/sm-contracts/${id}`, { method:"DELETE" })
    // cascade で payments も削除される
  }

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e=>e.id!==id))
    await fetch(`/api/sm-expenses/${id}`, { method:"DELETE" })
  }

  const saveStrategy = async (key, value) => {
    await fetch("/api/sm-strategy", {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ key, value }),
    })
  }

  /* ─ Wizard ─ */
  const openWizard = (type) => setWizard({
    wizType: type, step:1,
    form: type==="recurring"
      ? { name:"", business:"しあらぼ", amount:"", method:"振込", startMonthIdx:CURRENT_M, note:"" }
      : type==="installment"
      ? { name:"", business:"しあらぼ", amount:"", method:"振込", startMonthIdx:CURRENT_M,
          manageBy:"count", totalCount:"4", endMonthIdx:String(CURRENT_M+3), note:"" }
      : type==="single"
      ? { monthIdx:CURRENT_M, name:"", business:"CW案件", amount:"", method:"振込", note:"" }
      : { category:"ツール", name:"", amount:"", note:"", isRecurring:true, monthIdx:CURRENT_M }
  })
  const updateForm = (k,v) => setWizard(w=>({...w, form:{...w.form,[k]:v}}))

  const saveWizard = async () => {
    setSaving(true)
    const f = wizard.form

    if (wizard.wizType==="recurring") {
      const contractRes = await fetch("/api/sm-contracts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          name:f.name, business:f.business, type:"recurring",
          amount:Number(f.amount), method:f.method,
          start_month_idx:Number(f.startMonthIdx), note:f.note, status:"active",
        }),
      })
      const newContract = await contractRes.json()
      setContracts(prev=>[...prev, newContract])

      const rows = []
      for (let m = newContract.start_month_idx; m <= CURRENT_M; m++) {
        rows.push({ contract_id:newContract.id, name:newContract.name, business:newContract.business,
          month_idx:m, amount:newContract.amount, method:newContract.method,
          type:"継続", paid:m < CURRENT_M })
      }
      if (rows.length > 0) {
        const pRes = await fetch("/api/sm-payments", {
          method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(rows),
        })
        const newPays = await pRes.json()
        setPayments(prev=>[...prev, ...newPays])
      }

    } else if (wizard.wizType==="installment") {
      const count = f.manageBy==="count"
        ? Number(f.totalCount)
        : Number(f.endMonthIdx) - Number(f.startMonthIdx) + 1
      const contractRes = await fetch("/api/sm-contracts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          name:f.name, business:f.business, type:"installment",
          amount:Number(f.amount), method:f.method,
          start_month_idx:Number(f.startMonthIdx), total_count:count, note:f.note, status:"active",
        }),
      })
      const newContract = await contractRes.json()
      setContracts(prev=>[...prev, newContract])

      const rows = []
      for (let i=0; i<count; i++) {
        const m = newContract.start_month_idx + i
        if (m > 11) break
        rows.push({ contract_id:newContract.id, name:newContract.name, business:newContract.business,
          month_idx:m, amount:newContract.amount, method:newContract.method, type:"分割",
          installment_no:i+1, total_installments:count, paid:m < CURRENT_M })
      }
      const pRes = await fetch("/api/sm-payments", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(rows),
      })
      const newPays = await pRes.json()
      setPayments(prev=>[...prev, ...newPays])

    } else if (wizard.wizType==="single") {
      const res = await fetch("/api/sm-singles", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...f, month_idx:Number(f.monthIdx), amount:Number(f.amount) }),
      })
      const row = await res.json()
      setSingles(prev=>[...prev, row])

    } else {
      const isRecurring = f.isRecurring !== false
      const res = await fetch("/api/sm-expenses", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          ...f,
          amount: Number(f.amount),
          is_recurring: isRecurring,
          month_idx: isRecurring ? null : Number(f.monthIdx),
        }),
      })
      const row = await res.json()
      setExpenses(prev=>[...prev, row])
    }

    setSaving(false)
    setWizard(null)
  }

  const TABS = [
    { id:"dashboard", label:"ダッシュボード",    Icon:BarChart2  },
    { id:"fin",       label:"売上 / 利益",        Icon:TrendingUp },
    { id:"contracts", label:"契約 & 未収金",      Icon:RefreshCw  },
    { id:"expenses",  label:"経費",               Icon:Receipt    },
    { id:"strategy",  label:"戦略",               Icon:Target     },
  ]

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:FONT }}>

      {/* Header */}
      <header style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, padding:"14px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:3, color:C.muted, fontWeight:700, marginBottom:2 }}>COMPANY SALES MANAGER 2026</div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.5 }}>経営ダッシュボード</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {uncollectedTotal > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:7, background:C.warn+"12",
              border:`1px solid ${C.warn}33`, borderRadius:8, padding:"8px 14px" }}>
              <AlertCircle size={13} color={C.warn} strokeWidth={1.5} />
              <span style={{ fontSize:12, fontWeight:700, color:C.warn, fontFamily:MONO }}>
                未収金 ¥{fmtM(uncollectedTotal)}
              </span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:7, background:C.panel2,
            border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px" }}>
            <TrendingUp size={13} color={profitRate>=0?C.success:C.danger} strokeWidth={1.5} />
            <span style={{ fontSize:12, fontWeight:700, color:profitRate>=0?C.success:C.danger, fontFamily:MONO }}>
              利益率 {profitRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ display:"flex", padding:"0 32px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab===id
          return (
            <button key={id} onClick={()=>setTab(id)} style={{
              display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
              color:active?C.primary:C.sub, padding:"12px 18px", fontSize:13,
              fontWeight:active?700:400, fontFamily:FONT,
              borderBottom:active?`2px solid ${C.primary}`:"2px solid transparent",
              cursor:"pointer", transition:"all 0.15s", position:"relative",
            }}>
              <Icon size={14} strokeWidth={1.5} />{label}
              {id==="contracts" && uncollectedTotal>0 && (
                <span style={{ position:"absolute", top:8, right:6, width:6, height:6,
                  borderRadius:"50%", background:C.warn }} />
              )}
            </button>
          )
        })}
      </nav>

      <main style={{ padding:"24px 32px", maxWidth:920, margin:"0 auto" }}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                { label:"確定売上（年）",   value:"¥"+fmtM(paidRev),         sub:"入金済みのみ",       color:C.primary, Icon:TrendingUp },
                { label:"見込み売上（年）",  value:"¥"+fmtM(projectedRev),      sub:"未収+将来分含む",    color:C.primary, Icon:TrendingUp },
                { label:"未収金",          value:"¥"+fmtM(uncollectedTotal), sub:`${uncollectedPayments.length}件 未入金`, color:C.warn, Icon:AlertCircle },
                { label:"年間純利益（確定）", value:(totalProfit<0?"-":"")+"¥"+fmtM(totalProfit), sub:totalProfit>=0?"黒字":"赤字", color:totalProfit>=0?C.success:C.danger, Icon:Activity },
                { label:"見込み利益（年）",  value:(projectedProfit<0?"-":"")+"¥"+fmtM(projectedProfit), sub:projectedProfit>=0?"黒字見込み":"赤字見込み", color:projectedProfit>=0?C.success:C.danger, Icon:Activity },
                { label:"継続収入（月額）", value:fmtY(contracts.filter(c=>c.type==="recurring"&&c.status==="active").reduce((a,c)=>a+c.amount,0)), sub:`${contracts.filter(c=>c.type==="recurring"&&c.status==="active").length}件継続中`, color:C.success, Icon:RefreshCw },
              ].map((k,i) => (
                <Card key={i} style={{ borderTop:`2px solid ${k.color}`, padding:"14px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                    <k.Icon size={11} color={C.muted} strokeWidth={1.5} />
                    <span style={{ fontSize:10, color:C.muted, letterSpacing:1.5, fontWeight:600 }}>{k.label.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:k.color, fontFamily:MONO, letterSpacing:-0.5 }}>{k.value}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{k.sub}</div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <SL Icon={BarChart2}>月別売上（確定 + 未収）</SL>
                <div style={{ display:"flex", gap:12, fontSize:11, color:C.muted }}>
                  {[{c:C.primary,l:"確定"},{c:C.warn,l:"未収"}].map(({c,l})=>(
                    <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={monthlyChartData} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>"¥"+fmtM(v)} />
                  <Tooltip content={<SalesTooltip expMo={totalExpMo} />} />
                  <Bar dataKey="確定売上" fill={C.primary} radius={[3,3,0,0]} stackId="a" />
                  <Bar dataKey="未収金" fill={C.warn} radius={[3,3,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SL Icon={Activity}>月別利益推移（確定ベース）</SL>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>(v>=0?"¥":"-¥")+fmtM(Math.abs(v))} />
                  <Tooltip content={<ProfitTooltip target={300000} />} />
                  <Line type="monotone" dataKey="利益" stroke={C.warn} strokeWidth={2.5}
                    dot={{ fill:C.warn, r:3, strokeWidth:0 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Card>
                <SL Icon={BarChart2}>事業別 確定売上</SL>
                {bizData.map(({ biz, rev, share }) => {
                  const Icon = BIZ_ICON[biz]
                  return (
                    <div key={biz} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <Icon size={12} color={BIZ_COLOR[biz]} strokeWidth={1.5} />
                          <span style={{ fontSize:12, fontWeight:700 }}>{biz}</span>
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, fontFamily:MONO, color:BIZ_COLOR[biz] }}>¥{fmtM(rev)}</span>
                      </div>
                      <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${share}%`, background:BIZ_COLOR[biz], borderRadius:3 }} />
                      </div>
                    </div>
                  )
                })}
              </Card>
              <Card>
                <SL Icon={Target}>事業別 利益率ギャップ</SL>
                {bizData.map(({ biz, margin, target, gap }) => (
                  <div key={biz} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:700 }}>{biz}</span>
                      <span style={{ fontSize:13, fontWeight:800, fontFamily:MONO, color:gap>=0?C.success:C.danger }}>
                        {margin}% <span style={{ fontSize:10 }}>({gap>=0?"+":""}{gap}%)</span>
                      </span>
                    </div>
                    <div style={{ position:"relative", height:8, background:C.panel2, borderRadius:4 }}>
                      <div style={{ position:"absolute", height:"100%", width:`${Math.min(100,Math.max(0,margin))}%`, background:BIZ_COLOR[biz]+"99", borderRadius:4 }} />
                      <div style={{ position:"absolute", top:-3, height:14, width:2, background:C.sub, left:`${Math.min(98,target)}%`, borderRadius:2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:11, color:C.muted }}>縦線＝目標利益率</div>
              </Card>
            </div>
          </div>
        )}

        {/* ══ FIN ══ */}
        {tab==="fin" && (
          <div>
            <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
              {[{label:"年間",val:null}, ...MONTHS.map((m,i)=>({label:m,val:i}))].map(({label,val}) => {
                const active = activeMonth===val
                return (
                  <button key={label} onClick={()=>setActiveMonth(active?null:val)} style={{
                    padding:"6px 13px", borderRadius:20, fontSize:12, fontWeight:active?700:400,
                    background:active?C.primary:"none", color:active?"#fff":C.sub,
                    border:`1px solid ${active?C.primary:C.border}`,
                    cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                  }}>{label}</button>
                )
              })}
              <div style={{ marginLeft:"auto" }}>
                <Btn onClick={()=>openWizard("single")}><Plus size={13} strokeWidth={2} />単発を追加</Btn>
              </div>
            </div>

            {(() => {
              const rows = activeMonth!==null ? finMonthData.filter(d=>d.monthIdx===activeMonth) : finMonthData
              const sumRev    = rows.reduce((a,d)=>a+d.rev,0)
              const sumUncol  = rows.reduce((a,d)=>a+d.uncol,0)
              const sumExp    = activeMonth!==null ? totalExpMo : totalExpAnnual
              const sumProfit = sumRev - sumExp
              const rate      = sumRev>0 ? (sumProfit/sumRev*100).toFixed(1) : "0.0"
              return (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:14 }}>
                  {[
                    { label:"確定売上", val:sumRev,    color:C.primary, pfx:"" },
                    { label:"未収金",   val:sumUncol,  color:C.warn,    pfx:"" },
                    { label:"経費",     val:sumExp,    color:C.danger,  pfx:"-" },
                    { label:"利益",     val:sumProfit, color:sumProfit>=0?C.success:C.danger, pfx:sumProfit<0?"-":"" },
                    { label:"利益率",   disp:rate+"%", color:sumProfit>=0?C.success:C.danger },
                  ].map((k,i) => (
                    <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${k.color}` }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4, letterSpacing:1 }}>{k.label.toUpperCase()}</div>
                      <div style={{ fontSize:17, fontWeight:800, fontFamily:MONO, color:k.color }}>
                        {k.disp || (k.pfx+"¥"+fmtM(Math.abs(k.val)))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {(activeMonth!==null ? finMonthData.filter(d=>d.monthIdx===activeMonth) : finMonthData).map(d => {
              const isOpen = activeMonth===d.monthIdx
              return (
                <div key={d.month} style={{ marginBottom:7 }}>
                  <button onClick={()=>setActiveMonth(isOpen?null:d.monthIdx)} style={{
                    width:"100%", background:C.panel, border:`1px solid ${C.border}`,
                    borderRadius:isOpen?"10px 10px 0 0":10, padding:"13px 18px",
                    display:"grid", gridTemplateColumns:"60px 1fr 80px 1fr 80px 28px",
                    alignItems:"center", gap:10, cursor:"pointer", fontFamily:FONT,
                  }}>
                    <span style={{ fontSize:13, fontWeight:700, textAlign:"left" }}>{d.month}</span>
                    {[
                      { label:"確定売上", val:d.rev,  color:C.primary, neg:false },
                      { label:"未収金",   val:d.uncol, color:C.warn,   neg:false, hide:d.uncol===0 },
                      { label:"経費",     val:d.exp,  color:C.danger,  neg:true  },
                      { label:"利益",     val:d.profit,color:d.profit>=0?C.success:C.danger, neg:d.profit<0 },
                    ].map(({label,val,color,neg,hide}) => hide ? <div key={label}/> : (
                      <div key={label} style={{ textAlign:"left" }}>
                        <div style={{ fontSize:10, color:C.muted, marginBottom:1 }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:700, fontFamily:MONO, color }}>{neg?"-":""}¥{fmtM(Math.abs(val))}</div>
                      </div>
                    ))}
                    <ChevronRight size={14} strokeWidth={1.5} color={C.muted}
                      style={{ transform:isOpen?"rotate(90deg)":"none", transition:"transform 0.15s" }} />
                  </button>

                  {isOpen && (
                    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"14px 18px" }}>
                      {d.uncol > 0 && (
                        <div style={{ background:C.warn+"10", border:`1px solid ${C.warn}30`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <AlertCircle size={13} color={C.warn} strokeWidth={1.5} />
                            <span style={{ fontSize:12, color:C.warn, fontWeight:600 }}>未収金 ¥{d.uncol.toLocaleString()}</span>
                          </div>
                          <GhostBtn small onClick={()=>markAllMonthPaid(d.monthIdx)}>
                            <Check size={12} strokeWidth={2} />一括入金確認
                          </GhostBtn>
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>事業別</div>
                          {d.byBiz.filter(x=>x.v>0).map(({ biz, v }) => (
                            <div key={biz} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:7, height:7, borderRadius:"50%", background:BIZ_COLOR[biz] }} />
                                <span style={{ fontSize:12 }}>{biz}</span>
                              </div>
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO, color:BIZ_COLOR[biz] }}>¥{v.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>明細</div>
                          {d.entries.map(e => (
                            <div key={e.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>
                              {e.paid === false && <AlertCircle size={11} color={C.warn} strokeWidth={1.5} />}
                              <span style={{ fontSize:12, flex:1 }}>{e.name}</span>
                              {chip(e.type==="継続"?C.success:e.type==="分割"?C.warn:C.primary, e.type)}
                              <span style={{ fontSize:12, fontWeight:700, fontFamily:MONO, color:e.paid===false?C.warn:C.text }}>
                                ¥{e.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══ CONTRACTS ══ */}
        {tab==="contracts" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, color:C.sub }}>{contracts.filter(c=>c.status==="active").length}件 稼働中</div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn onClick={()=>openWizard("recurring")} color={C.success}><RefreshCw size={13} strokeWidth={2} />継続を追加</Btn>
                <Btn onClick={()=>openWizard("installment")} color={C.warn}><Calendar size={13} strokeWidth={1.5} />分割を追加</Btn>
              </div>
            </div>

            {uncollectedTotal > 0 && (
              <Card style={{ marginBottom:16, border:`1px solid ${C.warn}44`, background:C.warn+"05" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <SL Icon={AlertCircle}>未収金 — {uncollectedPayments.length}件</SL>
                  <span style={{ fontSize:20, fontWeight:800, fontFamily:MONO, color:C.warn }}>¥{uncollectedTotal.toLocaleString()}</span>
                </div>
                {uncollectedPayments.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
                    {chip(p.type==="継続"?C.success:C.warn, p.type)}
                    {chip(BIZ_COLOR[p.business]||C.muted, p.business)}
                    <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{p.name}</span>
                    {p.installment_no && <span style={{ fontSize:11, color:C.muted }}>{p.installment_no}/{p.total_installments}回目</span>}
                    <span style={{ fontSize:11, color:C.muted }}>{MONTHS[p.month_idx]}</span>
                    <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO, color:C.warn }}>¥{p.amount.toLocaleString()}</span>
                    <Btn small color={C.success} onClick={()=>togglePaid(p.id)}>
                      <Check size={12} strokeWidth={2.5} />入金確認
                    </Btn>
                  </div>
                ))}
              </Card>
            )}

            <Card style={{ marginBottom:14 }}>
              <SL Icon={RefreshCw}>継続契約</SL>
              {contracts.filter(c=>c.type==="recurring").length===0 && (
                <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>なし</div>
              )}
              {contracts.filter(c=>c.type==="recurring").map(c => {
                const cPays    = payments.filter(p=>p.contract_id===c.id)
                const paidCnt  = cPays.filter(p=>p.paid).length
                return (
                  <div key={c.id} style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {c.status==="active" ? badge(C.success,"継続中") : badge(C.muted,"停止中")}
                      {chip(BIZ_COLOR[c.business]||C.muted, c.business)}
                      <span style={{ fontSize:14, fontWeight:700, flex:1 }}>{c.name}</span>
                      <span style={{ fontSize:14, fontWeight:800, fontFamily:MONO, color:C.primary }}>
                        ¥{c.amount.toLocaleString()}<span style={{ fontSize:10, color:C.muted, fontWeight:400 }}>/月</span>
                      </span>
                      <span style={{ fontSize:11, color:C.muted }}>{MONTHS[c.start_month_idx]}〜</span>
                      {c.status==="active"
                        ? <GhostBtn small onClick={()=>stopContract(c.id)}><Pause size={12} strokeWidth={1.5} />停止</GhostBtn>
                        : <GhostBtn small onClick={()=>resumeContract(c.id)}><Play size={12} strokeWidth={1.5} />再開</GhostBtn>
                      }
                      <button onClick={()=>deleteContract(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted }}>
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div style={{ marginTop:8, paddingLeft:4 }}>
                      <Progress paid={paidCnt} total={cPays.length} color={C.success} />
                    </div>
                  </div>
                )
              })}
            </Card>

            <Card>
              <SL Icon={Calendar}>分割契約</SL>
              {contracts.filter(c=>c.type==="installment").length===0 && (
                <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>なし</div>
              )}
              {contracts.filter(c=>c.type==="installment").map(c => {
                const cPays     = payments.filter(p=>p.contract_id===c.id)
                const paidCnt   = cPays.filter(p=>p.paid).length
                const isComplete = paidCnt === c.total_count
                const isExp     = expandedContract===c.id
                return (
                  <div key={c.id} style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {isComplete ? badge(C.success,"完了") : badge(C.warn,"進行中")}
                      {chip(BIZ_COLOR[c.business]||C.muted, c.business)}
                      <span style={{ fontSize:14, fontWeight:700, flex:1 }}>{c.name}</span>
                      <span style={{ fontSize:14, fontWeight:800, fontFamily:MONO, color:C.warn }}>
                        ¥{c.amount.toLocaleString()}<span style={{ fontSize:10, color:C.muted, fontWeight:400 }}>×{c.total_count}回</span>
                      </span>
                      <span style={{ fontSize:11, color:C.muted }}>計 ¥{(c.amount*c.total_count).toLocaleString()}</span>
                      <button onClick={()=>setExpandedContract(isExp?null:c.id)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                        <ChevronRight size={14} strokeWidth={1.5} color={C.muted}
                          style={{ transform:isExp?"rotate(90deg)":"none", transition:"transform 0.15s" }} />
                      </button>
                      <button onClick={()=>deleteContract(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted }}>
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div style={{ marginTop:8, paddingLeft:4 }}>
                      <Progress paid={paidCnt} total={c.total_count} color={C.warn} />
                    </div>
                    {isExp && (
                      <div style={{ marginTop:10, paddingLeft:4 }}>
                        {cPays.map(p => (
                          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:12, color:C.muted, width:50 }}>{p.installment_no}回目</span>
                            <span style={{ fontSize:12, color:C.sub, width:36 }}>{MONTHS[p.month_idx]}</span>
                            <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO, flex:1 }}>¥{p.amount.toLocaleString()}</span>
                            {p.paid ? (
                              <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.success, fontWeight:700 }}>
                                <CheckSquare size={13} strokeWidth={1.5} />入金済
                              </span>
                            ) : p.month_idx <= CURRENT_M ? (
                              <Btn small color={C.success} onClick={()=>togglePaid(p.id)}>
                                <Check size={11} strokeWidth={2.5} />入金確認
                              </Btn>
                            ) : (
                              <span style={{ fontSize:11, color:C.muted }}>予定</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
          </div>
        )}

        {/* ══ EXPENSES ══ */}
        {tab==="expenses" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {EXP_CATS.map(cat => {
                  const total = expenses.filter(e=>e.category===cat).reduce((a,e)=>a+e.amount,0)
                  return total > 0 ? (
                    <div key={cat} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px" }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{cat.toUpperCase()}</div>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:MONO }}>¥{fmtM(total)}</div>
                    </div>
                  ) : null
                })}
              </div>
              <Btn onClick={()=>openWizard("expense")}><Plus size={14} strokeWidth={2} />経費を追加</Btn>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <div style={{ background:C.danger+"0e", border:`1px solid ${C.danger}33`, borderRadius:8, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                <Receipt size={13} color={C.danger} strokeWidth={1.5} />
                <span style={{ fontSize:12, color:C.sub }}>月額固定</span>
                <span style={{ fontSize:18, fontWeight:800, color:C.danger, fontFamily:MONO }}>¥{totalExpMo.toLocaleString()}</span>
                <span style={{ fontSize:11, color:C.muted }}>/月</span>
              </div>
              {oneTimeExpTotal > 0 && (
                <div style={{ background:C.warn+"0e", border:`1px solid ${C.warn}33`, borderRadius:8, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                  <Receipt size={13} color={C.warn} strokeWidth={1.5} />
                  <span style={{ fontSize:12, color:C.sub }}>単発合計</span>
                  <span style={{ fontSize:18, fontWeight:800, color:C.warn, fontFamily:MONO }}>¥{oneTimeExpTotal.toLocaleString()}</span>
                </div>
              )}
              <div style={{ background:C.danger+"18", border:`1px solid ${C.danger}33`, borderRadius:8, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:C.sub }}>年間合計</span>
                <span style={{ fontSize:18, fontWeight:800, color:C.danger, fontFamily:MONO }}>¥{fmtM(totalExpAnnual)}</span>
              </div>
            </div>
            {/* 月額固定経費 */}
            <Card style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
              <div style={{ padding:"10px 18px", background:C.panel2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.5 }}>月額固定</span>
                <span style={{ fontSize:13, fontWeight:800, fontFamily:MONO, color:C.danger }}>¥{totalExpMo.toLocaleString()} / 月</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 120px 1fr 36px", background:C.panel2, padding:"9px 18px", borderTop:`1px solid ${C.border}` }}>
                {["カテゴリ","名前","月額","メモ",""].map((h,i) => <TH key={i}>{h}</TH>)}
              </div>
              {recurringExps.length === 0 && <div style={{ padding:"18px", textAlign:"center", fontSize:12, color:C.muted }}>登録なし</div>}
              {recurringExps.map(e => (
                <div key={e.id}
                  style={{ display:"grid", gridTemplateColumns:"110px 1fr 120px 1fr 36px", padding:"11px 18px", borderTop:`1px solid ${C.border}`, alignItems:"center" }}
                  onMouseEnter={ev=>ev.currentTarget.style.background=C.hover}
                  onMouseLeave={ev=>ev.currentTarget.style.background=""}
                >
                  <div style={{ fontSize:11, color:C.sub }}>{e.category}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{e.name}</div>
                  <div style={{ fontSize:14, fontWeight:700, fontFamily:MONO, color:C.danger }}>¥{e.amount.toLocaleString()}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{e.note||"—"}</div>
                  <button onClick={()=>deleteExpense(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}>
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </Card>

            {/* 単発経費 */}
            <Card style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"10px 18px", background:C.panel2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.5 }}>単発</span>
                {oneTimeExpTotal > 0 && <span style={{ fontSize:13, fontWeight:800, fontFamily:MONO, color:C.danger }}>¥{oneTimeExpTotal.toLocaleString()} 合計</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"80px 110px 1fr 120px 1fr 36px", background:C.panel2, padding:"9px 18px", borderTop:`1px solid ${C.border}` }}>
                {["月","カテゴリ","名前","金額","メモ",""].map((h,i) => <TH key={i}>{h}</TH>)}
              </div>
              {oneTimeExps.length === 0 && <div style={{ padding:"18px", textAlign:"center", fontSize:12, color:C.muted }}>登録なし</div>}
              {oneTimeExps.sort((a,b)=>(a.month_idx??0)-(b.month_idx??0)).map(e => (
                <div key={e.id}
                  style={{ display:"grid", gridTemplateColumns:"80px 110px 1fr 120px 1fr 36px", padding:"11px 18px", borderTop:`1px solid ${C.border}`, alignItems:"center" }}
                  onMouseEnter={ev=>ev.currentTarget.style.background=C.hover}
                  onMouseLeave={ev=>ev.currentTarget.style.background=""}
                >
                  <div style={{ fontSize:12, fontWeight:700, color:C.primary }}>{e.month_idx!=null?MONTHS[e.month_idx]:"—"}</div>
                  <div style={{ fontSize:11, color:C.sub }}>{e.category}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{e.name}</div>
                  <div style={{ fontSize:14, fontWeight:700, fontFamily:MONO, color:C.danger }}>¥{e.amount.toLocaleString()}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{e.note||"—"}</div>
                  <button onClick={()=>deleteExpense(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}>
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ══ STRATEGY ══ */}
        {tab==="strategy" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <SL Icon={Target}>年間 KGI / KPI</SL>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { key:"kgi", label:"KGI（最終目標）", ph:"例：年間売上1,440万・利益率30%・黒字化" },
                  { key:"kpi", label:"KPI（行動指標）",  ph:"例：月間個別相談15名・継続成約4名" },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600 }}>{label}</div>
                    <textarea value={strategy[key]}
                      onChange={e => { setStrategy(s=>({...s,[key]:e.target.value})); saveStrategy(key, e.target.value) }}
                      placeholder={ph}
                      style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, color:C.text, resize:"vertical", minHeight:80, fontFamily:FONT, outline:"none", boxSizing:"border-box" }} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SL Icon={FileText}>年間戦略メモ</SL>
              <textarea value={strategy.annual}
                onChange={e => { setStrategy(s=>({...s,annual:e.target.value})); saveStrategy("annual", e.target.value) }}
                placeholder="年間の大きな方向性・重点施策..."
                style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", fontSize:13, color:C.text, resize:"vertical", minHeight:90, fontFamily:FONT, outline:"none", boxSizing:"border-box" }} />
            </Card>
            <Card>
              <SL Icon={Activity}>月別 売上計画 & 振り返り</SL>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {MONTHS.map((m, idx) => {
                  const actual = finMonthData[idx]?.rev || 0
                  return (
                    <div key={m} style={{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:700 }}>{m}</span>
                        <span style={{ fontSize:12, fontFamily:MONO, fontWeight:700, color:actual>=1200000?C.success:C.primary }}>¥{fmtM(actual)}</span>
                      </div>
                      <textarea value={strategy.months[m]}
                        onChange={e => { setStrategy(s=>({...s,months:{...s.months,[m]:e.target.value}})); saveStrategy(m, e.target.value) }}
                        placeholder="計画・メモ..."
                        style={{ width:"100%", background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 9px", fontSize:11, color:C.text, resize:"none", height:64, fontFamily:FONT, outline:"none", boxSizing:"border-box" }} />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ══ WIZARD ══ */}
      {wizard && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
          onClick={()=>setWizard(null)}>
          <div style={{ background:C.panel, borderRadius:14, padding:"28px 32px", width:430, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontWeight:700, marginBottom:6 }}>
                  {{ recurring:"継続契約を追加", installment:"分割契約を追加", single:"単発売上を追加", expense:"経費を追加" }[wizard.wizType]}
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  {[1,2,3].map(n=>(
                    <div key={n} style={{ height:5, borderRadius:3, background:n<=wizard.step?C.primary:C.border, width:n<=wizard.step?20:12, transition:"all 0.2s" }} />
                  ))}
                  <span style={{ fontSize:11, color:C.muted, marginLeft:4 }}>{wizard.step}/3</span>
                </div>
              </div>
              <button onClick={()=>setWizard(null)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                <X size={18} strokeWidth={1.5} color={C.muted} />
              </button>
            </div>

            {/* ── RECURRING ── */}
            {wizard.wizType==="recurring" && (
              <div>
                {wizard.step===1 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>契約情報</div>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>クライアント名</div>
                      <input value={wizard.form.name} onChange={e=>updateForm("name",e.target.value)} placeholder="例: まこさん"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>事業</div>
                      <select value={wizard.form.business} onChange={e=>updateForm("business",e.target.value)}
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                        {BUSINESSES.map(b=><option key={b}>{b}</option>)}
                      </select>
                    </label>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>月額</div>
                      <input type="number" value={wizard.form.amount} onChange={e=>updateForm("amount",e.target.value)} placeholder="例: 22000"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===2 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>開始設定</div>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>開始月</div>
                      <select value={wizard.form.startMonthIdx} onChange={e=>updateForm("startMonthIdx",e.target.value)}
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                        {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                      </select>
                    </label>
                    <div>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:1 }}>支払方法</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                        {PAY_METHODS.map(m=>(
                          <button key={m} onClick={()=>updateForm("method",m)} style={{
                            padding:"10px 8px", borderRadius:8,
                            border:`2px solid ${wizard.form.method===m?C.primary:C.border}`,
                            background:wizard.form.method===m?C.primary+"12":C.panel2,
                            color:wizard.form.method===m?C.primary:C.sub,
                            fontSize:13, fontWeight:wizard.form.method===m?700:400,
                            cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                          }}>{m}</button>
                        ))}
                      </div>
                    </div>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>メモ（任意）</div>
                      <input value={wizard.form.note} onChange={e=>updateForm("note",e.target.value)} placeholder="備考..."
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===3 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>確認</div>
                    <div style={{ background:C.panel2, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                      {[["名前",wizard.form.name||"—"],["事業",wizard.form.business],["月額","¥"+Number(wizard.form.amount||0).toLocaleString()],["開始月",MONTHS[wizard.form.startMonthIdx]],["支払",wizard.form.method]].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:12, color:C.muted }}>{k}</span>
                          <span style={{ fontSize:12, fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:C.success+"10", border:`1px solid ${C.success}33`, borderRadius:8, padding:"10px 14px" }}>
                      <div style={{ fontSize:11, color:C.success, fontWeight:700, marginBottom:2 }}>継続契約として登録されます</div>
                      <div style={{ fontSize:11, color:C.sub }}>停止するまで毎月の入金予定が自動追加されます。</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── INSTALLMENT ── */}
            {wizard.wizType==="installment" && (
              <div>
                {wizard.step===1 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>分割情報</div>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>名称</div>
                      <input value={wizard.form.name} onChange={e=>updateForm("name",e.target.value)} placeholder="例: のりりん分割"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>事業</div>
                      <select value={wizard.form.business} onChange={e=>updateForm("business",e.target.value)}
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                        {BUSINESSES.map(b=><option key={b}>{b}</option>)}
                      </select>
                    </label>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>1回あたりの金額</div>
                      <input type="number" value={wizard.form.amount} onChange={e=>updateForm("amount",e.target.value)} placeholder="例: 100000"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===2 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>期間設定</div>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>開始月</div>
                      <select value={wizard.form.startMonthIdx} onChange={e=>updateForm("startMonthIdx",e.target.value)}
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                        {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                      </select>
                    </label>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:1 }}>管理方法</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                        {[{v:"count",l:"回数で管理"},{v:"term",l:"期限で管理"}].map(({v,l})=>(
                          <button key={v} onClick={()=>updateForm("manageBy",v)} style={{
                            padding:"10px 8px", borderRadius:8,
                            border:`2px solid ${wizard.form.manageBy===v?C.primary:C.border}`,
                            background:wizard.form.manageBy===v?C.primary+"12":C.panel2,
                            color:wizard.form.manageBy===v?C.primary:C.sub,
                            fontSize:13, fontWeight:wizard.form.manageBy===v?700:400,
                            cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                          }}>{l}</button>
                        ))}
                      </div>
                      {wizard.form.manageBy==="count" ? (
                        <label style={{ display:"block" }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>回数</div>
                          <input type="number" value={wizard.form.totalCount} onChange={e=>updateForm("totalCount",e.target.value)} placeholder="例: 4"
                            style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                        </label>
                      ) : (
                        <label style={{ display:"block" }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>終了月</div>
                          <select value={wizard.form.endMonthIdx} onChange={e=>updateForm("endMonthIdx",e.target.value)}
                            style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                            {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:1 }}>支払方法</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                        {PAY_METHODS.map(m=>(
                          <button key={m} onClick={()=>updateForm("method",m)} style={{
                            padding:"10px 8px", borderRadius:8,
                            border:`2px solid ${wizard.form.method===m?C.primary:C.border}`,
                            background:wizard.form.method===m?C.primary+"12":C.panel2,
                            color:wizard.form.method===m?C.primary:C.sub,
                            fontSize:13, fontWeight:wizard.form.method===m?700:400,
                            cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                          }}>{m}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {wizard.step===3 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>確認</div>
                    <div style={{ background:C.panel2, borderRadius:10, padding:"14px 16px" }}>
                      {[
                        ["名称", wizard.form.name||"—"],
                        ["事業", wizard.form.business],
                        ["1回あたり", "¥"+Number(wizard.form.amount||0).toLocaleString()],
                        ["回数", wizard.form.manageBy==="count"
                          ? wizard.form.totalCount+"回"
                          : (Number(wizard.form.endMonthIdx)-Number(wizard.form.startMonthIdx)+1)+"回"],
                        ["合計", "¥"+(Number(wizard.form.amount||0) * (wizard.form.manageBy==="count"
                          ? Number(wizard.form.totalCount)
                          : Number(wizard.form.endMonthIdx)-Number(wizard.form.startMonthIdx)+1)).toLocaleString()],
                        ["開始月", MONTHS[wizard.form.startMonthIdx]],
                        ["支払", wizard.form.method],
                      ].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:12, color:C.muted }}>{k}</span>
                          <span style={{ fontSize:12, fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SINGLE / EXPENSE ── */}
            {(wizard.wizType==="single"||wizard.wizType==="expense") && (
              <div>
                {wizard.step===1 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>
                      {wizard.wizType==="single"?"売上情報":"経費情報"}
                    </div>
                    {wizard.wizType==="single" ? (
                      <>
                        <label style={{ display:"block", marginBottom:12 }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>月</div>
                          <select value={wizard.form.monthIdx} onChange={e=>updateForm("monthIdx",e.target.value)}
                            style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                            {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                          </select>
                        </label>
                        <label style={{ display:"block", marginBottom:12 }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>事業</div>
                          <select value={wizard.form.business} onChange={e=>updateForm("business",e.target.value)}
                            style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                            {BUSINESSES.map(b=><option key={b}>{b}</option>)}
                          </select>
                        </label>
                      </>
                    ) : (
                      <>
                        {/* 月額固定 / 単発 トグル */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>種別</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            {[{v:true,l:"月額固定"},{v:false,l:"単発（1回）"}].map(({v,l})=>(
                              <button key={String(v)} onClick={()=>updateForm("isRecurring",v)} style={{
                                padding:"10px 8px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                                border:`2px solid ${wizard.form.isRecurring===v||(!wizard.form.hasOwnProperty("isRecurring")&&v)?C.primary:C.border}`,
                                background:wizard.form.isRecurring===v||(!wizard.form.hasOwnProperty("isRecurring")&&v)?C.primary+"12":C.panel2,
                                color:wizard.form.isRecurring===v||(!wizard.form.hasOwnProperty("isRecurring")&&v)?C.primary:C.sub,
                              }}>{l}</button>
                            ))}
                          </div>
                        </div>
                        {/* 単発の場合は対象月を選択 */}
                        {wizard.form.isRecurring === false && (
                          <label style={{ display:"block", marginBottom:12 }}>
                            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>対象月</div>
                            <select value={wizard.form.monthIdx??CURRENT_M} onChange={e=>updateForm("monthIdx",e.target.value)}
                              style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                            </select>
                          </label>
                        )}
                        <label style={{ display:"block", marginBottom:12 }}>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>カテゴリ</div>
                          <select value={wizard.form.category||"ツール"} onChange={e=>updateForm("category",e.target.value)}
                            style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                            {EXP_CATS.map(c=><option key={c}>{c}</option>)}
                          </select>
                        </label>
                      </>
                    )}
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>名称</div>
                      <input value={wizard.form.name} onChange={e=>updateForm("name",e.target.value)} placeholder="例: かんな案件"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>{wizard.wizType==="expense"?(wizard.form.isRecurring===false?"金額（単発）":"月額"):"金額"}</div>
                      <input type="number" value={wizard.form.amount} onChange={e=>updateForm("amount",e.target.value)} placeholder="例: 100000"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===2 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>
                      {wizard.wizType==="single"?"支払方法":"メモ"}
                    </div>
                    {wizard.wizType==="single" ? (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                        {PAY_METHODS.map(m=>(
                          <button key={m} onClick={()=>updateForm("method",m)} style={{
                            padding:"12px 8px", borderRadius:8,
                            border:`2px solid ${wizard.form.method===m?C.primary:C.border}`,
                            background:wizard.form.method===m?C.primary+"12":C.panel2,
                            color:wizard.form.method===m?C.primary:C.sub,
                            fontSize:13, fontWeight:wizard.form.method===m?700:400,
                            cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                          }}>{m}</button>
                        ))}
                      </div>
                    ) : (
                      <textarea value={wizard.form.note||""} onChange={e=>updateForm("note",e.target.value)} placeholder="備考..."
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", fontSize:13, fontFamily:FONT, color:C.text, resize:"none", minHeight:100, outline:"none", boxSizing:"border-box" }} />
                    )}
                  </div>
                )}
                {wizard.step===3 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>確認</div>
                    <div style={{ background:C.panel2, borderRadius:10, padding:"14px 16px" }}>
                      {[
                        wizard.wizType==="single" && ["月", MONTHS[Number(wizard.form.monthIdx)]],
                        wizard.wizType==="single" && ["事業", wizard.form.business],
                        wizard.wizType==="expense" && ["種別", wizard.form.isRecurring===false?"単発":"月額固定"],
                        wizard.wizType==="expense" && wizard.form.isRecurring===false && ["対象月", MONTHS[Number(wizard.form.monthIdx??CURRENT_M)]],
                        wizard.wizType==="expense" && ["カテゴリ", wizard.form.category],
                        ["名称", wizard.form.name||"—"],
                        ["金額", "¥"+Number(wizard.form.amount||0).toLocaleString()],
                        wizard.wizType==="single" && ["支払", wizard.form.method],
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:12, color:C.muted }}>{k}</span>
                          <span style={{ fontSize:12, fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
              {wizard.step>1
                ? <GhostBtn onClick={()=>setWizard(w=>({...w,step:w.step-1}))}><ChevronLeft size={14} strokeWidth={1.5} />戻る</GhostBtn>
                : <div />}
              {wizard.step<3
                ? <Btn onClick={()=>setWizard(w=>({...w,step:w.step+1}))} disabled={!wizard.form.amount&&!wizard.form.name}>次へ<ChevronRight size={14} strokeWidth={1.5} /></Btn>
                : <Btn onClick={saveWizard} color={C.success} disabled={saving}><Check size={14} strokeWidth={2} />{saving?"保存中...":"保存する"}</Btn>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
