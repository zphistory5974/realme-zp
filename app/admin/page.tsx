'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, MessageSquare, TrendingUp, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { getC } from '@/lib/colors'
import { ThemeToggle } from '@/components/ThemeToggle'

const ADMIN_EMAIL = 'why0322@naver.com'
const Y = '#FFE000'

// ── helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dayStr(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, highlight }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; highlight?: boolean
}) {
  const { theme } = useTheme(); const C = getC(theme)
  return (
    <div style={{ background:C.cardMain, border:`1px solid ${highlight ? '#2a2600' : C.border}`, borderRadius:14, padding:'20px 24px', transition:'background-color 0.3s, border-color 0.3s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ color: highlight ? Y : C.textFaint }}>{icon}</div>
        <span style={{ fontSize:11, color:C.textFaint, fontWeight:700, letterSpacing:1 }}>{label}</span>
      </div>
      <div style={{ fontSize:36, fontWeight:900, color: highlight ? Y : C.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.textFaint, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

// ── bar chart (7-day trend) ──────────────────────────────────────────────────
function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const { theme } = useTheme(); const C = getC(theme)
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 72, d.count > 0 ? 4 : 0)
        const isToday = d.date === todayStr()
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:10, color: d.count > 0 ? Y : C.textGhost, fontWeight:700 }}>{d.count || ''}</div>
            <div style={{ width:'100%', height:h, borderRadius:3, background: isToday ? Y : C.cardHover, minHeight:2, transition:'height 0.3s' }} />
            <div style={{ fontSize:9, color: isToday ? Y : C.textGhost, fontFamily:'monospace' }}>
              {d.date.slice(5)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const C = getC(theme)
  const tx: React.CSSProperties = { transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }

  const [loading,    setLoading]    = useState(true)
  const [profiles,   setProfiles]   = useState<any[]>([])
  const [answers,    setAnswers]    = useState<any[]>([])
  const [session,    setSession]    = useState<any>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [tab,        setTab]        = useState<'overview' | 'users' | 'answers'>('overview')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!sess?.user || sess.user.email !== ADMIN_EMAIL) {
        router.replace('/')
        return
      }
      setSession(sess)
      await refresh()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    setLoading(true)
    const [{ data: profs }, { data: ans }] = await Promise.all([
      supabase.from('realme_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('realme_answers').select('id, hash, created_at').order('created_at', { ascending: false }),
    ])
    setProfiles(profs || [])
    setAnswers(ans || [])
    setLoading(false)
  }

  const deleteProfile = async (id: number, hash: string, nickname: string) => {
    if (!confirm(`"${nickname}" 유저와 모든 관련 답변을 삭제할까요?`)) return
    setDeletingId(id)
    const token = session?.access_token
    const res = await fetch('/api/admin/delete', {
      method: 'DELETE',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
      body: JSON.stringify({ target:'profile', id, hash }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`삭제 실패: ${err.error}`)
    } else {
      await refresh()
    }
    setDeletingId(null)
  }

  const deleteAnswer = async (id: number) => {
    if (!confirm('이 답변을 삭제할까요?')) return
    setDeletingId(id)
    const token = session?.access_token
    const res = await fetch('/api/admin/delete', {
      method: 'DELETE',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
      body: JSON.stringify({ target:'answer', id }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`삭제 실패: ${err.error}\n\n서비스 롤 키(SUPABASE_SERVICE_ROLE_KEY)가 설정되어 있는지 확인해주세요.`)
    } else {
      await refresh()
    }
    setDeletingId(null)
  }

  // ── derived stats ──
  const today = todayStr()
  const todayUsers   = profiles.filter(p => p.created_at?.slice(0, 10) === today).length
  const todayAnswers = answers.filter(a => a.created_at?.slice(0, 10) === today).length

  // answer count per profile hash
  const answerCountByHash: Record<string, number> = {}
  answers.forEach(a => { answerCountByHash[a.hash] = (answerCountByHash[a.hash] || 0) + 1 })

  // 7-day trend
  const trend = Array.from({ length: 7 }, (_, i) => {
    const date = dayStr(6 - i)
    return { date, count: answers.filter(a => a.created_at?.slice(0, 10) === date).length }
  })

  // detect possibly fast answers — flag profiles with 5+ answers created within 1 minute
  const fastProfiles = new Set<string>()
  profiles.forEach(prof => {
    const profAnswers = answers.filter(a => a.hash === prof.hash)
    for (let i = 0; i + 4 < profAnswers.length; i++) {
      const times = profAnswers.slice(i, i + 5).map(a => new Date(a.created_at).getTime())
      const span = Math.max(...times) - Math.min(...times)
      if (span < 60_000) { fastProfiles.add(prof.hash); break }
    }
  })

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', ...tx }}>
      <p style={{ fontSize:13, color:C.textSub }}>로딩 중...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:"'Noto Sans KR',sans-serif", ...tx }}>

      {/* header */}
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:'14px 32px', position:'sticky', top:0, zIndex:10, ...tx }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:Y }}>
              REAL<span style={{ color:C.text }}>ME</span>
            </div>
            <div style={{ fontSize:10, color:C.textFaint, border:`1px solid ${C.borderSub}`, padding:'3px 10px', letterSpacing:2, fontFamily:'monospace' }}>ADMIN</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={refresh}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.textSub, background:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, border:`1px solid ${C.borderSub}` }}
              onMouseEnter={e => e.currentTarget.style.borderColor=C.textFaint}
              onMouseLeave={e => e.currentTarget.style.borderColor=C.borderSub}>
              <RefreshCw style={{ width:13, height:13 }} /> 새로고침
            </button>
            <a href="/" style={{ fontSize:12, color:C.textSub, textDecoration:'none' }}>← 메인</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 32px' }}>

        {/* tab nav */}
        <div style={{ display:'flex', gap:4, marginBottom:32, borderBottom:`1px solid ${C.border}`, paddingBottom:0, ...tx }}>
          {(['overview', 'users', 'answers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700,
                color: tab === t ? Y : C.textFaint,
                borderBottom: tab === t ? `2px solid ${Y}` : '2px solid transparent',
                marginBottom:-1,
              }}>
              {{ overview:'개요', users:'유저 관리', answers:'답변 관리' }[t]}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
              <StatCard icon={<Users style={{ width:16, height:16 }} />}    label="전체 가입자" value={profiles.length}  sub={`오늘 +${todayUsers}명`} />
              <StatCard icon={<MessageSquare style={{ width:16, height:16 }} />} label="전체 답변 수" value={answers.length} sub={`오늘 +${todayAnswers}개`} highlight />
              <StatCard icon={<TrendingUp style={{ width:16, height:16 }} />} label="오늘 가입"   value={todayUsers}    sub="신규 유저" />
              <StatCard icon={<TrendingUp style={{ width:16, height:16 }} />} label="오늘 답변"   value={todayAnswers}  sub="오늘 제출된 답변" highlight />
            </div>

            {/* 7-day chart */}
            <div style={{ background:C.cardMain, border:`1px solid ${C.border}`, borderRadius:14, padding:'24px 28px', ...tx }}>
              <div style={{ fontSize:12, color:C.textSub, fontWeight:700, marginBottom:20 }}>
                최근 7일 답변 추이
              </div>
              <TrendChart data={trend} />
            </div>

            {/* suspicious activity */}
            {fastProfiles.size > 0 && (
              <div style={{ background:'rgba(255,100,0,0.04)', border:'1px solid #2a1500', borderRadius:14, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <AlertTriangle style={{ width:16, height:16, color:'#ff6600' }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'#ff6600' }}>이상 감지</span>
                </div>
                <div style={{ fontSize:12, color:'#885533', lineHeight:1.8 }}>
                  {Array.from(fastProfiles).map(hash => {
                    const prof = profiles.find(p => p.hash === hash)
                    return prof ? (
                      <div key={hash}>• <span style={{ color:C.text, fontWeight:700 }}>{prof.nickname}</span> — 1분 이내 5개 이상 답변 수신</div>
                    ) : null
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <div style={{ fontSize:13, color:C.textSub, marginBottom:16 }}>총 {profiles.length}명</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {profiles.map(prof => {
                const count      = answerCountByHash[prof.hash] || 0
                const suspicious = fastProfiles.has(prof.hash)
                return (
                  <div key={prof.id} style={{
                    background:C.cardMain, border:`1px solid ${suspicious ? '#2a1500' : C.border}`,
                    borderRadius:12, padding:'16px 20px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, ...tx
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:900, color:C.text, fontSize:14 }}>{prof.nickname}</span>
                        {suspicious && (
                          <span style={{ fontSize:9, color:'#ff6600', border:'1px solid #ff6600', padding:'1px 6px', borderRadius:4 }}>이상</span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:C.textFaint, fontFamily:'monospace', marginBottom:2 }}>{prof.email}</div>
                      <div style={{ display:'flex', gap:16, fontSize:11, color:C.textFaint }}>
                        <span>가입: {formatDate(prof.created_at)}</span>
                        <span style={{ color: count > 0 ? Y : C.textGhost }}>답변 {count}개 수신</span>
                        <span style={{ fontFamily:'monospace', color:C.borderFaint }}>{prof.hash}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteProfile(prof.id, prof.hash, prof.nickname)}
                      disabled={deletingId === prof.id}
                      style={{
                        display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                        borderRadius:8, border:`1px solid ${C.borderSub}`, background:'none',
                        color:C.textSub, cursor:'pointer', fontSize:12, fontWeight:700,
                        opacity: deletingId === prof.id ? 0.4 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#cc3333'; e.currentTarget.style.color='#ff4444' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=C.borderSub; e.currentTarget.style.color=C.textSub }}>
                      <Trash2 style={{ width:13, height:13 }} />
                      {deletingId === prof.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ANSWERS ── */}
        {tab === 'answers' && (
          <div>
            <div style={{ fontSize:13, color:C.textSub, marginBottom:16 }}>최근 답변 (총 {answers.length}개)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {answers.slice(0, 50).map(ans => {
                const prof = profiles.find(p => p.hash === ans.hash)
                return (
                  <div key={ans.id} style={{
                    background:C.cardMain, border:`1px solid ${C.border}`, borderRadius:10,
                    padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, ...tx
                  }}>
                    <div>
                      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:C.text }}>
                          {prof ? prof.nickname : ans.hash}
                        </span>
                        <span style={{ fontSize:10, color:C.textGhost, fontFamily:'monospace' }}>
                          ID: {ans.id}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:C.textFaint }}>{formatDate(ans.created_at)}</div>
                    </div>
                    <button onClick={() => deleteAnswer(ans.id)}
                      disabled={deletingId === ans.id}
                      style={{
                        display:'flex', alignItems:'center', gap:4, padding:'6px 12px',
                        borderRadius:8, border:`1px solid ${C.borderSub}`, background:'none',
                        color:C.textSub, cursor:'pointer', fontSize:11, fontWeight:700,
                        opacity: deletingId === ans.id ? 0.4 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#cc3333'; e.currentTarget.style.color='#ff4444' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=C.borderSub; e.currentTarget.style.color=C.textSub }}>
                      <Trash2 style={{ width:12, height:12 }} />
                      {deletingId === ans.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
