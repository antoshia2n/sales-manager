// @ts-nocheck
"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from "recharts"
import {
  TrendingUp, Receipt, CreditCard, Plus, X,
  ChevronRight, ChevronLeft, Check, BarChart2, Activity,
  FileText, Target, Users, Briefcase, BookOpen
} from "lucide-react"
import type { Sale, Expense, StrategyEntry } from "@/lib/types"

/* ─── Design Tokens ──────────────────────────────────── */
const C = {
  bg:      "#F7F5F0",
  panel:   "#FFFFFF",
  panel2:  "#EEEBE6",
  border:  "#E2DDD6",
  hover:   "#E8E4DD",
  text:    "#1C1917",
  sub:     "#6B6560",
  muted:   "#A8A39C",
  primary: "#6C8EF5",
  success: "#4ECBA0",
  warn:    "#F5A623",
  danger:  "#E05C5C",
}
const MONO = "'DM Mono','JetBrains Mono',monospace"
const FONT = "'Noto Sans JP','Hiragino Sans',sans-serif"

/* ─── Constants ──────────────────────────────────────── */
const BUSINESSES  = ["しあらぼ","CW案件","教材販売","その他"]
const BIZ_COLOR   = { "しあらぼ":C.primary, "CW案件":"#4ECBA0", "教材販売":"#F5A623", "その他":"#A8A39C" }
const BIZ_ICON    = { "しあらぼ":Users, "CW案件":Briefcase, "教材販売":BookOpen, "その他":BarChart2 }
const BIZ_TARGET  = { "しあらぼ":75, "CW案件":65, "教材販売":80, "その他":60 }
const PAY_TYPES   = ["継続","単発","分割","その他"]
const PAY_METHODS = ["振込","クレカ","その他"]
const MONTHS      = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
const EXP_CATS    = ["ツール","固定費","ライフライン","外注費","その他"]

/* ─── Helpers ────────────────────────────────────────── */
const fmtY = (n) => "¥" + Math.abs(Math.round(n)).toLocaleString()
const fmtM = (n) => {
  const a = Math.abs(n)
  if (a >= 1000000) return (a/10000).toFixed(0)+"万"
  if (a >= 10000)   return (a/10000).toFixed(1)+"万"
  return a.toLocaleString()
}
const chip = (color, label) => (
  <span style={{
    display:"inline-block", background:color+"18", color,
    border:`1px solid ${color}33`, borderRadius:4,
    padding:"2px 7px", fontSize:10, fontWeight:700, whiteSpace:"nowrap",
  }}>{label}</span>
)

/* ─── Tooltip Components ─────────────────────────────── */
const SalesTooltip = ({ active, payload, label, expMo }) => {
  if (!active || !payload?.length) return null
  const 売上 = payload.find(p=>p.dataKey==="売上")?.value || 0
  const 目標 = payload.find(p=>p.dataKey==="目標")?.value || 1200000
  const 利益 = 売上 - expMo
  const gap  = 売上 - 目標
  const rate = 売上 > 0 ? (利益 / 売上 * 100).toFixed(1) : "0.0"
  const isRed  = 利益 < 0
  const isMiss = 売上 < 目標
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", fontSize:12, boxShadow:"0 6px 24px rgba(0,0,0,0.12)", minWidth:200 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:C.text }}>{label}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
        {[
          { label:"売上",    val:"¥"+売上.toLocaleString(),          color:C.primary },
          { label:"経費（月）", val:"-¥"+expMo.toLocaleString(),     color:C.danger  },
        ].map(({label:l,val,color})=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", gap:24 }}>
            <span style={{ color:C.muted }}>{l}</span>
            <span style={{ fontFamily:MONO, fontWeight:700, color }}>{val}</span>
          </div>
        ))}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:5, display:"flex", justifyContent:"space-between", gap:24 }}>
          <span style={{ color:C.muted }}>利益</span>
          <span style={{ fontFamily:MONO, fontWeight:800, color:isRed?C.danger:C.success }}>
            {isRed?"-":""}¥{Math.abs(利益).toLocaleString()}
          </span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:24 }}>
          <span style={{ color:C.muted }}>利益率</span>
          <span style={{ fontFamily:MONO, fontWeight:700, color:isRed?C.danger:C.success }}>{rate}%</span>
        </div>
      </div>
      {isRed && (
        <div style={{ background:C.danger+"12", border:`1px solid ${C.danger}33`, borderRadius:6, padding:"7px 10px", marginBottom:6 }}>
          <span style={{ fontSize:11, color:C.danger, lineHeight:1.5 }}>
            赤字 ¥{Math.abs(利益).toLocaleString()} 超過。黒字化には売上 <strong>+¥{Math.abs(利益).toLocaleString()}</strong> 必要
          </span>
        </div>
      )}
      {!isRed && isMiss && (
        <div style={{ background:C.warn+"12", border:`1px solid ${C.warn}33`, borderRadius:6, padding:"7px 10px" }}>
          <span style={{ fontSize:11, color:C.warn, lineHeight:1.5 }}>
            目標まであと <strong>¥{Math.abs(gap).toLocaleString()}</strong>（達成率 {(売上/目標*100).toFixed(0)}%）
          </span>
        </div>
      )}
      {!isRed && !isMiss && (
        <div style={{ background:C.success+"12", border:`1px solid ${C.success}33`, borderRadius:6, padding:"7px 10px" }}>
          <span style={{ fontSize:11, color:C.success, fontWeight:700 }}>目標達成・黒字</span>
        </div>
      )}
    </div>
  )
}

const ProfitTooltip = ({ active, payload, label, target = 300000 }) => {
  if (!active || !payload?.length) return null
  const 利益 = payload[0]?.value || 0
  const isRed = 利益 < 0
  const toTarget = target - 利益
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", fontSize:12, boxShadow:"0 6px 24px rgba(0,0,0,0.12)", minWidth:190 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:C.text }}>{label}</div>
      <div style={{ display:"flex", justifyContent:"space-between", gap:24, marginBottom:10 }}>
        <span style={{ color:C.muted }}>利益</span>
        <span style={{ fontFamily:MONO, fontWeight:800, fontSize:15, color:isRed?C.danger:C.success }}>
          {isRed?"-":""}¥{Math.abs(利益).toLocaleString()}
        </span>
      </div>
      {isRed ? (
        <div style={{ background:C.danger+"12", border:`1px solid ${C.danger}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.danger, fontWeight:700, marginBottom:3 }}>赤字アラート</div>
          <div style={{ fontSize:11, color:C.danger, lineHeight:1.6 }}>
            目標利益（¥{target.toLocaleString()}）まで<br/>
            <strong>¥{toTarget.toLocaleString()}</strong> 不足
          </div>
        </div>
      ) : toTarget > 0 ? (
        <div style={{ background:C.warn+"12", border:`1px solid ${C.warn}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.warn, lineHeight:1.6 }}>
            黒字だが目標まであと<br/><strong>¥{toTarget.toLocaleString()}</strong>
          </div>
        </div>
      ) : (
        <div style={{ background:C.success+"12", border:`1px solid ${C.success}33`, borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:11, color:C.success, fontWeight:700 }}>目標利益 達成</div>
        </div>
      )}
    </div>
  )
}

/* ─── UI Primitives ──────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>
    {children}
  </div>
)
const SectionLabel = ({ Icon, children }) => (
  <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.5, marginBottom:14 }}>
    <Icon size={13} strokeWidth={1.5} color={C.muted} />
    {String(children).toUpperCase()}
  </div>
)
const Btn = ({ onClick, children, color, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:"flex", alignItems:"center", gap:6,
    background:color||C.primary, color:"#fff",
    border:"none", borderRadius:8, padding:"8px 18px",
    fontSize:13, fontWeight:700, cursor:disabled?"default":"pointer",
    fontFamily:FONT, transition:"all 0.15s", opacity:disabled?0.4:1, ...style,
  }}>{children}</button>
)
const GhostBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{
    display:"flex", alignItems:"center", gap:6,
    background:"none", border:`1px solid ${C.border}`,
    borderRadius:8, padding:"8px 16px", fontSize:13,
    color:C.sub, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
  }}>{children}</button>
)
const TH = ({ children }) => (
  <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1 }}>{String(children).toUpperCase()}</div>
)

/* ─── Strategy helpers ───────────────────────────────── */
const strategyToState = (entries: StrategyEntry[]) => {
  const base = { kgi:"", kpi:"", annual:"", months: Object.fromEntries(MONTHS.map(m=>[m,""])) }
  entries.forEach(({ key, value }) => {
    if (key === "kgi" || key === "kpi" || key === "annual") base[key] = value
    else if (MONTHS.includes(key)) base.months[key] = value
  })
  return base
}

/* ─── Main Component ─────────────────────────────────── */
export default function SalesManager({
  initialSales,
  initialExpenses,
  initialStrategy,
}: {
  initialSales: Sale[]
  initialExpenses: Expense[]
  initialStrategy: StrategyEntry[]
}) {
  const [tab, setTab]           = useState("dashboard")
  const [sales, setSales]       = useState<Sale[]>(initialSales)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [strategy, setStrategy] = useState(() => strategyToState(initialStrategy))
  const [wizard, setWizard]     = useState(null)
  const [drillMonth, setDrillMonth] = useState(null)
  const [activeMonth, setActiveMonth] = useState(null)
  const [saving, setSaving]     = useState(false)

  /* ─ Derived ─ */
  const totalSales     = useMemo(()=>sales.reduce((s,e)=>s+e.amount,0),[sales])
  const totalExpMo     = useMemo(()=>expenses.reduce((s,e)=>s+e.amount,0),[expenses])
  const totalExpAnnual = totalExpMo * 12
  const totalProfit    = totalSales - totalExpAnnual
  const profitRate     = totalSales>0 ? totalProfit/totalSales*100 : 0

  const monthlyData = useMemo(()=>MONTHS.map(m=>({
    month:m,
    売上: sales.filter(s=>s.month===m).reduce((a,e)=>a+e.amount,0),
    目標: 1200000,
  })),[sales])

  const profitTrend = useMemo(()=>MONTHS.map(m=>({
    month:m,
    利益: sales.filter(s=>s.month===m).reduce((a,e)=>a+e.amount,0) - totalExpMo,
  })),[sales,totalExpMo])

  const bizData = useMemo(()=>BUSINESSES.map(biz=>{
    const rev    = sales.filter(s=>s.business===biz).reduce((a,e)=>a+e.amount,0)
    const share  = totalSales>0 ? rev/totalSales : 0
    const alloc  = totalExpAnnual * share
    const margin = rev>0 ? Math.round((rev-alloc)/rev*100) : 0
    const target = BIZ_TARGET[biz]
    return { biz, rev, share:Math.round(share*100), margin, target, gap:margin-target }
  }),[sales,totalSales,totalExpAnnual])

  const finMonthData = useMemo(()=>MONTHS.map(m=>{
    const rev     = sales.filter(s=>s.month===m).reduce((a,e)=>a+e.amount,0)
    const profit  = rev - totalExpMo
    const byBiz   = BUSINESSES.map(biz=>({ biz, v:sales.filter(s=>s.month===m&&s.business===biz).reduce((a,e)=>a+e.amount,0) }))
    const byType  = PAY_TYPES.map(t=>({ t, v:sales.filter(s=>s.month===m&&s.type===t).reduce((a,e)=>a+e.amount,0) }))
    const entries = sales.filter(s=>s.month===m)
    return { month:m, rev, exp:totalExpMo, profit, byBiz, byType, entries }
  }),[sales,totalExpMo])

  const drillData = useMemo(()=>{
    if (!drillMonth) return null
    const entries = sales.filter(s=>s.month===drillMonth)
    const total   = entries.reduce((a,e)=>a+e.amount,0)
    return {
      month:drillMonth, total, entries,
      byBiz:    BUSINESSES.map(b=>({ b, v:entries.filter(e=>e.business===b).reduce((a,e)=>a+e.amount,0) })).filter(x=>x.v>0),
      byType:   PAY_TYPES.map(t=>({ t, v:entries.filter(e=>e.type===t).reduce((a,e)=>a+e.amount,0) })).filter(x=>x.v>0),
      byMethod: PAY_METHODS.map(m=>({ m, v:entries.filter(e=>e.method===m).reduce((a,e)=>a+e.amount,0) })).filter(x=>x.v>0),
    }
  },[drillMonth,sales])

  /* ─ API actions ─ */
  const openWizard = (type) => setWizard({
    type, step:1,
    form: type==="sales"
      ? { month:"1月", name:"", business:"しあらぼ", amount:"", type:"継続", method:"振込", note:"" }
      : { category:"ツール", name:"", amount:"", note:"" },
  })
  const updateForm = (k,v) => setWizard(w=>({...w, form:{...w.form,[k]:v}}))

  const saveWizard = async () => {
    setSaving(true)
    if (wizard.type==="sales") {
      const res = await fetch("/api/sm-sales", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...wizard.form, amount:Number(wizard.form.amount) }),
      })
      const row = await res.json()
      setSales(prev=>[...prev, row])
    } else {
      const res = await fetch("/api/sm-expenses", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...wizard.form, amount:Number(wizard.form.amount) }),
      })
      const row = await res.json()
      setExpenses(prev=>[...prev, row])
    }
    setSaving(false)
    setWizard(null)
  }

  const deleteSale = async (id) => {
    setSales(prev=>prev.filter(x=>x.id!==id))
    await fetch(`/api/sm-sales/${id}`, { method:"DELETE" })
  }

  const deleteExpense = async (id) => {
    setExpenses(prev=>prev.filter(x=>x.id!==id))
    await fetch(`/api/sm-expenses/${id}`, { method:"DELETE" })
  }

  const saveStrategy = async (key, value) => {
    await fetch("/api/sm-strategy", {
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ key, value }),
    })
  }

  const updateStrategy = (key, value) => {
    setStrategy(s=>({ ...s, [key]:value }))
    saveStrategy(key, value)
  }

  const updateStrategyMonth = (month, value) => {
    setStrategy(s=>({ ...s, months:{ ...s.months, [month]:value } }))
    saveStrategy(month, value)
  }

  const TABS = [
    { id:"dashboard", label:"ダッシュボード",    Icon:BarChart2  },
    { id:"fin",       label:"売上 / 経費 / 利益", Icon:TrendingUp },
    { id:"expenses",  label:"経費管理",           Icon:Receipt    },
    { id:"strategy",  label:"戦略",               Icon:Target     },
  ]

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:FONT }}>

      {/* Header */}
      <header style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:3, color:C.muted, fontWeight:700, marginBottom:3 }}>COMPANY SALES MANAGER 2026</div>
          <div style={{ fontSize:21, fontWeight:800, letterSpacing:-0.5 }}>経営ダッシュボード</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px" }}>
          <TrendingUp size={14} color={profitRate>=0?C.success:C.danger} strokeWidth={1.5} />
          <span style={{ fontSize:13, fontWeight:700, color:profitRate>=0?C.success:C.danger, fontFamily:MONO }}>
            年間利益率 {profitRate.toFixed(1)}%
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ display:"flex", padding:"0 32px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {TABS.map(({ id, label, Icon })=>{
          const active = tab===id
          return (
            <button key={id} onClick={()=>setTab(id)} style={{
              display:"flex", alignItems:"center", gap:7,
              background:"none", border:"none",
              color:active?C.primary:C.sub,
              padding:"13px 20px", fontSize:13,
              fontWeight:active?700:400, fontFamily:FONT,
              borderBottom:active?`2px solid ${C.primary}`:"2px solid transparent",
              cursor:"pointer", transition:"all 0.15s",
            }}>
              <Icon size={14} strokeWidth={1.5} />{label}
            </button>
          )
        })}
      </nav>

      <main style={{ padding:"24px 32px", maxWidth:900, margin:"0 auto" }}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* KPI */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              {[
                { label:"年間売上合計",    value:"¥"+fmtM(totalSales),   sub:"目標 ¥1,440万",   color:C.primary, Icon:TrendingUp },
                { label:"月間経費（固定）", value:fmtY(totalExpMo),       sub:"年換算 ¥"+fmtM(totalExpAnnual), color:C.danger, Icon:CreditCard },
                { label:"年間純利益",      value:(totalProfit<0?"-":"")+"¥"+fmtM(totalProfit), sub:totalProfit>=0?"黒字":"赤字", color:totalProfit>=0?C.success:C.danger, Icon:Activity },
                { label:"継続収入（月）",  value:fmtY(sales.filter(s=>s.type==="継続").reduce((a,e)=>a+e.amount,0)/12), sub:"月次安定収入", color:C.warn, Icon:Users },
              ].map((k,i)=>(
                <Card key={i} style={{ borderTop:`2px solid ${k.color}`, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                    <k.Icon size={12} color={C.muted} strokeWidth={1.5} />
                    <span style={{ fontSize:10, color:C.muted, letterSpacing:1.5, fontWeight:600 }}>{k.label.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, fontFamily:MONO, letterSpacing:-0.5 }}>{k.value}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{k.sub}</div>
                </Card>
              ))}
            </div>

            {/* Bar chart */}
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <SectionLabel Icon={BarChart2}>月別売上 VS 目標</SectionLabel>
                <span style={{ fontSize:11, color:C.muted }}>タップで詳細</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={3} barSize={18}
                  onClick={d=>d?.activeLabel&&setDrillMonth(d.activeLabel)} style={{ cursor:"pointer" }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>"¥"+fmtM(v)} />
                  <Tooltip content={<SalesTooltip expMo={totalExpMo} />} />
                  <Bar dataKey="目標" fill={C.border} radius={[3,3,0,0]} name="目標" />
                  <Bar dataKey="売上" radius={[4,4,0,0]} name="売上">
                    {monthlyData.map((d,i)=><Cell key={i} fill={d.売上>=d.目標?C.success:C.primary} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Line chart */}
            <Card>
              <SectionLabel Icon={Activity}>月別利益推移</SectionLabel>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>(v>=0?"¥":"-¥")+fmtM(Math.abs(v))} />
                  <Tooltip content={<ProfitTooltip target={300000} />} />
                  <Line type="monotone" dataKey="利益" stroke={C.warn} strokeWidth={2.5} dot={{ fill:C.warn, r:3, strokeWidth:0 }} activeDot={{ r:5 }} name="利益" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>ゼロライン以下は赤字</div>
            </Card>

            {/* Biz share */}
            <Card>
              <SectionLabel Icon={BarChart2}>事業別売上シェア</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {bizData.map(({ biz, rev, share })=>{
                  const Icon = BIZ_ICON[biz]
                  return (
                    <div key={biz} style={{ background:C.panel2, borderRadius:8, padding:"14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                        <Icon size={13} color={BIZ_COLOR[biz]} strokeWidth={1.5} />
                        <span style={{ fontSize:12, fontWeight:700 }}>{biz}</span>
                      </div>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:MONO, color:BIZ_COLOR[biz], marginBottom:8 }}>¥{fmtM(rev)}</div>
                      <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${share}%`, background:BIZ_COLOR[biz], borderRadius:3 }} />
                      </div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{share}%</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Gap */}
            <Card>
              <SectionLabel Icon={Target}>事業別 利益率ギャップ</SectionLabel>
              {bizData.map(({ biz, margin, target, gap })=>(
                <div key={biz} style={{ marginBottom:16, display:"grid", gridTemplateColumns:"100px 1fr 120px", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>{biz}</span>
                  <div style={{ position:"relative", height:10, background:C.panel2, borderRadius:5 }}>
                    <div style={{ position:"absolute", height:"100%", width:`${Math.min(100,Math.max(0,margin))}%`, background:BIZ_COLOR[biz]+"99", borderRadius:5 }} />
                    <div style={{ position:"absolute", top:-3, height:16, width:2.5, background:C.sub, left:`${Math.min(98,target)}%`, borderRadius:2 }} />
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:15, fontWeight:800, fontFamily:MONO, color:gap>=0?C.success:C.danger }}>{margin}%</span>
                    <span style={{ fontSize:11, color:gap>=0?C.success:C.danger, marginLeft:5, fontWeight:700 }}>({gap>=0?"+":""}{gap}%)</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:11, color:C.muted }}>縦線＝目標利益率</div>
            </Card>
          </div>
        )}

        {/* ══ FIN ══ */}
        {tab==="fin" && (
          <div>
            <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
              {[{label:"年間",val:null}, ...MONTHS.map(m=>({label:m,val:m}))].map(({label,val})=>{
                const active = activeMonth===val
                return (
                  <button key={label} onClick={()=>setActiveMonth(active?null:val)} style={{
                    padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:active?700:400,
                    background:active?C.primary:"none", color:active?"#fff":C.sub,
                    border:`1px solid ${active?C.primary:C.border}`,
                    cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                  }}>{label}</button>
                )
              })}
              <div style={{ marginLeft:"auto" }}>
                <Btn onClick={()=>openWizard("sales")}><Plus size={13} strokeWidth={2} />売上を追加</Btn>
              </div>
            </div>

            {/* Summary */}
            {(()=>{
              const rows = activeMonth ? finMonthData.filter(d=>d.month===activeMonth) : finMonthData
              const sumRev    = rows.reduce((a,d)=>a+d.rev,0)
              const sumExp    = activeMonth ? totalExpMo : totalExpAnnual
              const sumProfit = sumRev - sumExp
              const rate      = sumRev>0 ? (sumProfit/sumRev*100).toFixed(1) : "0.0"
              return (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
                  {[
                    { label:"売上",   val:sumRev,    color:C.primary, pfx:"" },
                    { label:"経費",   val:sumExp,    color:C.danger,  pfx:"-" },
                    { label:"利益",   val:sumProfit, color:sumProfit>=0?C.success:C.danger, pfx:sumProfit<0?"-":"" },
                    { label:"利益率", disp:rate+"%", color:sumProfit>=0?C.success:C.danger },
                  ].map((k,i)=>(
                    <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", borderLeft:`3px solid ${k.color}` }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:5, letterSpacing:1 }}>{k.label.toUpperCase()}</div>
                      <div style={{ fontSize:20, fontWeight:800, fontFamily:MONO, color:k.color }}>
                        {k.disp || (k.pfx+"¥"+fmtM(Math.abs(k.val)))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Accordion */}
            {(activeMonth ? finMonthData.filter(d=>d.month===activeMonth) : finMonthData).map(d=>{
              const profit = d.profit
              return (
                <div key={d.month} style={{ marginBottom:8 }}>
                  <button onClick={()=>setActiveMonth(activeMonth===d.month?null:d.month)} style={{
                    width:"100%", background:C.panel, border:`1px solid ${C.border}`,
                    borderRadius:activeMonth===d.month?"10px 10px 0 0":10,
                    padding:"14px 18px", display:"grid",
                    gridTemplateColumns:"60px 1fr 1fr 1fr 90px 28px",
                    alignItems:"center", gap:12, cursor:"pointer", fontFamily:FONT,
                  }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text, textAlign:"left" }}>{d.month}</span>
                    {[
                      { label:"売上", val:d.rev,  color:C.primary, neg:false },
                      { label:"経費", val:d.exp,  color:C.danger,  neg:true  },
                      { label:"利益", val:profit, color:profit>=0?C.success:C.danger, neg:profit<0 },
                    ].map(({label,val,color,neg})=>(
                      <div key={label} style={{ textAlign:"left" }}>
                        <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:700, fontFamily:MONO, color }}>{neg?"-":""}¥{fmtM(Math.abs(val))}</div>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:2, alignItems:"center", height:10 }}>
                      {d.byBiz.filter(x=>x.v>0).map(({ biz, v })=>(
                        <div key={biz} title={biz} style={{ height:"100%", flex:v, background:BIZ_COLOR[biz], borderRadius:2, minWidth:4 }} />
                      ))}
                    </div>
                    <ChevronRight size={14} strokeWidth={1.5} color={C.muted} style={{ transform:activeMonth===d.month?"rotate(90deg)":"none", transition:"transform 0.15s" }} />
                  </button>

                  {activeMonth===d.month && (
                    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"16px 18px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>事業別</div>
                          {d.byBiz.filter(x=>x.v>0).map(({ biz, v })=>(
                            <div key={biz} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:BIZ_COLOR[biz] }} />
                                <span style={{ fontSize:12 }}>{biz}</span>
                              </div>
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO, color:BIZ_COLOR[biz] }}>¥{v.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>入金種別</div>
                          {d.byType.filter(x=>x.v>0).map(({ t, v })=>(
                            <div key={t} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <span style={{ fontSize:12 }}>{t}</span>
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO }}>¥{v.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>明細</div>
                        {d.entries.map(e=>(
                          <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                            {chip(BIZ_COLOR[e.business]||C.muted, e.business)}
                            <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{e.name}</span>
                            {chip(e.type==="継続"?C.success:e.type==="単発"?C.primary:C.warn, e.type)}
                            <span style={{ fontSize:11, color:C.muted }}>{e.method}</span>
                            {e.note && <span style={{ fontSize:11, color:C.muted }}>({e.note})</span>}
                            <span style={{ fontSize:13, fontWeight:700, fontFamily:MONO, marginLeft:"auto" }}>¥{e.amount.toLocaleString()}</span>
                            <button onClick={()=>deleteSale(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, padding:0 }}>
                              <X size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══ EXPENSES ══ */}
        {tab==="expenses" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {EXP_CATS.map(cat=>{
                  const total = expenses.filter(e=>e.category===cat).reduce((a,e)=>a+e.amount,0)
                  return total>0 ? (
                    <div key={cat} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px" }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{cat.toUpperCase()}</div>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:MONO }}>¥{fmtM(total)}</div>
                    </div>
                  ) : null
                })}
              </div>
              <Btn onClick={()=>openWizard("expense")}><Plus size={14} strokeWidth={2} />経費を追加</Btn>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
              <div style={{ background:C.danger+"0e", border:`1px solid ${C.danger}33`, borderRadius:8, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                <Receipt size={13} color={C.danger} strokeWidth={1.5} />
                <span style={{ fontSize:12, color:C.sub }}>月間合計</span>
                <span style={{ fontSize:20, fontWeight:800, color:C.danger, fontFamily:MONO }}>¥{totalExpMo.toLocaleString()}</span>
              </div>
            </div>
            <Card style={{ padding:0, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 120px 1fr 36px", background:C.panel2, padding:"9px 18px" }}>
                {["カテゴリ","名前","月額","メモ",""].map((h,i)=><TH key={i}>{h}</TH>)}
              </div>
              {expenses.map(e=>(
                <div key={e.id}
                  style={{ display:"grid", gridTemplateColumns:"110px 1fr 120px 1fr 36px", padding:"11px 18px", borderTop:`1px solid ${C.border}`, alignItems:"center", transition:"background 0.1s" }}
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
          </div>
        )}

        {/* ══ STRATEGY ══ */}
        {tab==="strategy" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <SectionLabel Icon={Target}>年間 KGI / KPI</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { key:"kgi", label:"KGI（最終目標）", placeholder:"例：年間売上1,440万・利益率30%・黒字化" },
                  { key:"kpi", label:"KPI（行動指標）",  placeholder:"例：月間個別相談15名・継続成約4名・教材月5部" },
                ].map(({ key, label, placeholder })=>(
                  <div key={key}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:6, fontWeight:600 }}>{label}</div>
                    <textarea value={strategy[key]} onChange={e=>updateStrategy(key, e.target.value)} placeholder={placeholder}
                      style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, color:C.text, resize:"vertical", minHeight:80, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
                    />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionLabel Icon={FileText}>年間戦略メモ</SectionLabel>
              <textarea value={strategy.annual} onChange={e=>updateStrategy("annual", e.target.value)} placeholder="年間の大きな方向性・重点施策・スケジュールなど..."
                style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", fontSize:13, color:C.text, resize:"vertical", minHeight:90, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
              />
            </Card>
            <Card>
              <SectionLabel Icon={Activity}>月別 売上計画 & 振り返り</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {MONTHS.map(m=>{
                  const actual = sales.filter(s=>s.month===m).reduce((a,e)=>a+e.amount,0)
                  return (
                    <div key={m} style={{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:700 }}>{m}</span>
                        <span style={{ fontSize:12, fontFamily:MONO, fontWeight:700, color:actual>=1200000?C.success:C.primary }}>¥{fmtM(actual)}</span>
                      </div>
                      <textarea value={strategy.months[m]} onChange={e=>updateStrategyMonth(m, e.target.value)} placeholder="計画・メモ..."
                        style={{ width:"100%", background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 9px", fontSize:11, color:C.text, resize:"none", height:64, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
                      />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ══ DRILL MODAL ══ */}
      {drillData && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
          onClick={()=>setDrillMonth(null)}>
          <div style={{ background:C.panel, borderRadius:14, padding:"26px 30px", width:480, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontWeight:700, marginBottom:3 }}>{drillData.month} 詳細内訳</div>
                <div style={{ fontSize:26, fontWeight:800, fontFamily:MONO }}>¥{drillData.total.toLocaleString()}</div>
              </div>
              <button onClick={()=>setDrillMonth(null)} style={{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>
                <X size={16} strokeWidth={1.5} color={C.sub} />
              </button>
            </div>
            {[
              { title:"事業別",       items:drillData.byBiz.map(x=>({ label:x.b, val:x.v, color:BIZ_COLOR[x.b]||C.muted })) },
              { title:"入金種別",     items:drillData.byType.map(x=>({ label:x.t, val:x.v, color:x.t==="継続"?C.success:x.t==="単発"?C.primary:C.warn })) },
              { title:"入金スタイル", items:drillData.byMethod.map(x=>({ label:x.m, val:x.v, color:C.primary })) },
            ].map(({ title, items })=>(
              <div key={title} style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.5, marginBottom:8 }}>{title.toUpperCase()}</div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(items.length,3)},1fr)`, gap:8 }}>
                  {items.map(({ label, val, color })=>(
                    <div key={label} style={{ background:C.panel2, borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${color}` }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:MONO, color }}>{fmtY(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1.5, marginBottom:8 }}>ENTRIES</div>
              {drillData.entries.map(e=>(
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  {chip(BIZ_COLOR[e.business]||C.muted, e.business)}
                  <span style={{ fontSize:12 }}>{e.name}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{e.type} · {e.method}</span>
                  <span style={{ marginLeft:"auto", fontSize:13, fontWeight:700, fontFamily:MONO }}>¥{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ WIZARD ══ */}
      {wizard && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
          onClick={()=>setWizard(null)}>
          <div style={{ background:C.panel, borderRadius:14, padding:"28px 32px", width:420, boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontWeight:700, marginBottom:6 }}>
                  {wizard.type==="sales"?"売上を追加":"経費を追加"}
                </div>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  {[1,2,3].map(n=>(
                    <div key={n} style={{ height:5, borderRadius:3, background:n<=wizard.step?C.primary:C.border, width:n<=wizard.step?22:14, transition:"all 0.2s" }} />
                  ))}
                  <span style={{ fontSize:11, color:C.muted, marginLeft:4 }}>{wizard.step} / 3</span>
                </div>
              </div>
              <button onClick={()=>setWizard(null)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                <X size={18} strokeWidth={1.5} color={C.muted} />
              </button>
            </div>

            {wizard.type==="sales" && (
              <div>
                {wizard.step===1 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>基本情報</div>
                    {[
                      { key:"month",    label:"月",   opts:MONTHS     },
                      { key:"business", label:"事業", opts:BUSINESSES },
                    ].map(({ key, label, opts })=>(
                      <label key={key} style={{ display:"block", marginBottom:12 }}>
                        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>{label.toUpperCase()}</div>
                        <select value={wizard.form[key]} onChange={e=>updateForm(key,e.target.value)}
                          style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                          {opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </label>
                    ))}
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>名称</div>
                      <input value={wizard.form.name} onChange={e=>updateForm("name",e.target.value)} placeholder="例: まこさん継続 / かんな案件"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>金額</div>
                      <input type="number" value={wizard.form.amount} onChange={e=>updateForm("amount",e.target.value)} placeholder="例: 100000"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===2 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>入金分類</div>
                    {[
                      { key:"type",   label:"入金種別",    opts:PAY_TYPES,   cols:2 },
                      { key:"method", label:"入金スタイル", opts:PAY_METHODS, cols:3 },
                    ].map(({ key, label, opts, cols })=>(
                      <div key={key} style={{ marginBottom:16 }}>
                        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:1 }}>{label.toUpperCase()}</div>
                        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8 }}>
                          {opts.map(o=>(
                            <button key={o} onClick={()=>updateForm(key,o)} style={{
                              padding:"10px 8px", borderRadius:8,
                              border:`2px solid ${wizard.form[key]===o?C.primary:C.border}`,
                              background:wizard.form[key]===o?C.primary+"12":C.panel2,
                              color:wizard.form[key]===o?C.primary:C.sub,
                              fontSize:13, fontWeight:wizard.form[key]===o?700:400,
                              cursor:"pointer", fontFamily:FONT, transition:"all 0.15s",
                            }}>{o}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {wizard.step===3 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>確認</div>
                    <div style={{ background:C.panel2, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                      {[["月",wizard.form.month],["事業",wizard.form.business],["名称",wizard.form.name||"—"],["金額","¥"+Number(wizard.form.amount||0).toLocaleString()],["種別",wizard.form.type],["支払",wizard.form.method]].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:12, color:C.muted }}>{k}</span>
                          <span style={{ fontSize:12, fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>メモ（任意）</div>
                      <input value={wizard.form.note} onChange={e=>updateForm("note",e.target.value)} placeholder="備考..."
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
              </div>
            )}

            {wizard.type==="expense" && (
              <div>
                {wizard.step===1 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>経費情報</div>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>カテゴリ</div>
                      <select value={wizard.form.category} onChange={e=>updateForm("category",e.target.value)}
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text }}>
                        {EXP_CATS.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label style={{ display:"block", marginBottom:12 }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>名前</div>
                      <input value={wizard.form.name} onChange={e=>updateForm("name",e.target.value)} placeholder="例: Notion"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:FONT, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                    <label style={{ display:"block" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, letterSpacing:1 }}>月額</div>
                      <input type="number" value={wizard.form.amount} onChange={e=>updateForm("amount",e.target.value)} placeholder="例: 5000"
                        style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:MONO, color:C.text, outline:"none", boxSizing:"border-box" }} />
                    </label>
                  </div>
                )}
                {wizard.step===2 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>メモ</div>
                    <textarea value={wizard.form.note} onChange={e=>updateForm("note",e.target.value)} placeholder="備考・必要性など..."
                      style={{ width:"100%", background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", fontSize:13, fontFamily:FONT, color:C.text, resize:"none", minHeight:120, outline:"none", boxSizing:"border-box" }} />
                  </div>
                )}
                {wizard.step===3 && (
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>確認</div>
                    <div style={{ background:C.panel2, borderRadius:10, padding:"14px 16px" }}>
                      {[["カテゴリ",wizard.form.category],["名前",wizard.form.name||"—"],["月額","¥"+Number(wizard.form.amount||0).toLocaleString()],["メモ",wizard.form.note||"—"]].map(([k,v])=>(
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
                ? <Btn onClick={()=>setWizard(w=>({...w,step:w.step+1}))} disabled={wizard.type==="sales"&&wizard.step===1&&!wizard.form.amount}>次へ<ChevronRight size={14} strokeWidth={1.5} /></Btn>
                : <Btn onClick={saveWizard} color={C.success} disabled={saving}><Check size={14} strokeWidth={2} />{saving?"保存中...":"保存する"}</Btn>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
