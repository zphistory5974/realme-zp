'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { calcMbti, MBTI_DESC, QUESTIONS } from '@/lib/questions'
import { Copy, Check, Users, RefreshCw } from 'lucide-react'

const SITE   = process.env.NEXT_PUBLIC_SITE_URL || 'https://realme-zp.vercel.app'
const ZP_URL = 'https://zp-misery.vercel.app'

const Y  = '#FFE000'
const W  = '#f5f5f0'
const BK = '#0a0a0a'
const G  = '#1a1a1a'
const GM = '#2a2a2a'
const GL = '#888'

function generateHash() {
  return Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('')
}

// ─── LANDING ────────────────────────────────────────────────────────────────
function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [name, setName] = useState('')
  const [barsOn, setBarsOn] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const howRef    = useRef<HTMLElement>(null)
  const demoRef   = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!resultRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBarsOn(true) }, { threshold: 0.3 })
    obs.observe(resultRef.current)
    return () => obs.disconnect()
  }, [])

  const n = name.trim() || '이름'

  const STEPS = [
    { num: '01', icon: '🔗', title: '링크 생성',     desc: '카카오로 로그인하면 내 닉네임으로 고유 링크가 자동 생성됩니다.',              badge: '30초 소요' },
    { num: '02', icon: '📤', title: '친구에게 공유', desc: '나를 잘 아는 사람들에게 링크를 보냅니다. 가족, 친구, 동료 — 관계별로 비교해 보세요.', badge: '카카오·인스타 공유' },
    { num: '03', icon: '👁',  title: '행동으로 측정', desc: '친구들이 32개 행동 관찰 질문에 답합니다. 완전 익명으로 처리됩니다.',           badge: '5~7분 소요' },
    { num: '04', icon: '🪞', title: 'Real Me 공개',  desc: '1명부터 결과가 공개됩니다. 내가 생각한 나 vs 세상이 보는 나.',               badge: 'SNS 공유 가능' },
  ]

  const PREVIEW_QS = [
    { dim: 'E / I — 외향·내향',   q: `${n}은 처음 보는 사람에게 먼저 말을 거는 편인가요?` },
    { dim: 'E / I — 외향·내향',   q: `${n}은 모임 후 더 활기차 보이나요, 아니면 피곤해 보이나요?` },
    { dim: 'S / N — 감각·직관',   q: `${n}은 대화할 때 구체적인 사실보다 미래 가능성 이야기를 더 좋아하나요?` },
    { dim: 'T / F — 사고·감정',   q: `${n}은 누군가 고민을 털어놓을 때 해결책을 먼저 제시하는 편인가요?` },
    { dim: 'T / F — 사고·감정',   q: `${n}은 토론이나 논쟁을 즐기는 편인가요?` },
    { dim: 'J / P — 판단·인식',   q: `${n}은 마감 직전에 몰아서 일하는 편인가요?` },
  ]

  const BARS = [
    { d: 'E', pct: 78 }, { d: 'N', pct: 65 },
    { d: 'F', pct: 72 }, { d: 'P', pct: 58 },
  ]

  const hov = (on: boolean) => (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    if (on) { el.style.background = GM; el.style.transform = 'translateY(-4px)' }
    else    { el.style.background = G;  el.style.transform = '' }
  }

  const btnHov = (on: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget
    if (on) { el.style.background = W; el.style.transform = 'translate(-3px,-3px)'; el.style.boxShadow = `3px 3px 0 ${Y}` }
    else    { el.style.background = Y; el.style.transform = ''; el.style.boxShadow = '' }
  }

  const kakaoHov = (on: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget
    if (on) { el.style.background = W; el.style.transform = 'translate(-2px,-2px)'; el.style.boxShadow = `2px 2px 0 ${Y}` }
    else    { el.style.background = '#FEE500'; el.style.transform = ''; el.style.boxShadow = '' }
  }

  const secTag  = { fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 4, color: Y, textTransform: 'uppercase' as const, marginBottom: 20 }
  const secHead = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(48px,7vw,80px)' as string, lineHeight: 1, marginBottom: 80, letterSpacing: 1 }

  return (
    <div style={{ background: BK, color: W, fontFamily: "'Noto Sans KR',sans-serif", overflowX: 'hidden', position: 'relative' }}>
      {/* noise overlay */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none', opacity:0.4,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      {/* ── HEADER ── */}
      <header className="lp-header" style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1f1f1f', background:'rgba(10,10,10,0.92)', backdropFilter:'blur(12px)' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:4, color:Y }}>REAL<span style={{ color:W }}>ME</span></div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, color:GL, border:'1px solid #333', padding:'5px 12px', textTransform:'uppercase' }}>A ZP PROJECT</div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        <div aria-hidden className="hero-bg-pulse" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(120px,20vw,280px)', color:'#111', whiteSpace:'nowrap', pointerEvents:'none', letterSpacing:10, userSelect:'none' }}>REAL</div>
        <div className="anim-1 font-mono" style={{ fontSize:11, letterSpacing:4, color:Y, textTransform:'uppercase', marginBottom:24 }}>// Zero Productive — 두 번째 프로젝트</div>
        <h1 className="anim-2" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(72px,12vw,160px)', lineHeight:0.92, letterSpacing:2, marginBottom:32 }}>
          진짜 나는<br />
          <span style={{ color:Y, display:'block' }}>타인이 안다</span>
        </h1>
        <p className="anim-3" style={{ fontSize:18, fontWeight:300, color:GL, maxWidth:480, lineHeight:1.8, marginBottom:56 }}>
          당신이 생각하는 당신의 MBTI와<br />
          <strong style={{ color:W, fontWeight:700 }}>나를 아는 5명이 보는 당신</strong>은 다를 수 있다.<br /><br />
          행동은 거짓말을 하지 않는다.
        </p>
        <div className="anim-4" style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <button onClick={() => demoRef.current?.scrollIntoView({ behavior:'smooth' })}
            onMouseEnter={btnHov(true)} onMouseLeave={btnHov(false)}
            style={{ background:Y, color:BK, border:'none', padding:'18px 40px', fontFamily:"'Noto Sans KR',sans-serif", fontSize:15, fontWeight:900, letterSpacing:1, cursor:'pointer', transition:'all 0.2s' }}>
            링크 만들기 →
          </button>
          <button onClick={() => howRef.current?.scrollIntoView({ behavior:'smooth' })}
            style={{ background:'transparent', color:W, border:'1px solid #333', padding:'18px 40px', fontFamily:"'Noto Sans KR',sans-serif", fontSize:15, fontWeight:400, cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=Y; e.currentTarget.style.color=Y }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color=W }}>
            어떻게 작동하나요?
          </button>
        </div>
      </section>

      {/* ── STAT BAR ── */}
      <div className="lp-stat-bar" style={{ background:Y, display:'flex', overflowX:'auto' }}>
        {[['68%','자기 인식과\n타인 인식이 다름'],['32개','행동 관찰형\n질문'],['5명','나를 아는\n사람의 시선'],['익명','답변자 신원\n완전 비공개']].map(([num, label], i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, whiteSpace:'nowrap' }}>
            {i > 0 && <div style={{ width:1, height:40, background:'rgba(0,0,0,0.2)', flexShrink:0 }} />}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:BK, letterSpacing:2 }}>{num}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'#333', letterSpacing:1, textTransform:'uppercase', lineHeight:1.3, whiteSpace:'pre-line' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section ref={howRef} className="lp-section" id="how">
        <div style={secTag}>// 어떻게 작동하나요</div>
        <h2 style={secHead}>4단계로<br />진짜 나를 만난다</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:2 }}>
          {STEPS.map(s => (
            <div key={s.num} onMouseEnter={hov(true)} onMouseLeave={hov(false)}
              style={{ background:G, padding:'48px 36px', position:'relative', overflow:'hidden', transition:'all 0.3s', cursor:'default' }}>
              <div aria-hidden style={{ position:'absolute', top:-10, right:16, fontFamily:"'Bebas Neue',sans-serif", fontSize:100, color:'rgba(255,255,255,0.04)', letterSpacing:-2, lineHeight:1, pointerEvents:'none' }}>{s.num}</div>
              <div style={{ fontSize:32, marginBottom:20 }}>{s.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>{s.title}</div>
              <div style={{ fontSize:14, fontWeight:300, color:GL, lineHeight:1.8 }}>{s.desc}</div>
              <div style={{ display:'inline-block', marginTop:20, fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, color:Y, border:'1px solid #ccb400', padding:'4px 10px' }}>{s.badge}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO: 카카오 로그인 ── */}
      <section ref={demoRef} className="lp-section" id="demo" style={{ background:G }}>
        <div style={{ maxWidth:640, background:BK, border:'1px solid #222', padding:'56px' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, marginBottom:8, letterSpacing:2 }}>링크 만들기</div>
          <div style={{ fontSize:14, color:GL, marginBottom:40, fontWeight:300 }}>카카오로 로그인하면 내 닉네임으로 고유 링크가 자동 생성됩니다 — 완전 무료</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:40 }}>
            {['✓  카카오 닉네임으로 고유 링크 자동 생성','✓  친구들이 로그인 없이 바로 답변 가능','✓  1명부터 실시간으로 결과 공개'].map((t,i) => (
              <div key={i} style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:GL, letterSpacing:1 }}>{t}</div>
            ))}
          </div>
          <button onClick={onLogin}
            onMouseEnter={kakaoHov(true)} onMouseLeave={kakaoHov(false)}
            style={{ width:'100%', background:'#FEE500', color:BK, border:'none', padding:20, fontFamily:"'Noto Sans KR',sans-serif", fontSize:16, fontWeight:900, cursor:'pointer', letterSpacing:1, display:'flex', alignItems:'center', justifyContent:'center', gap:12, transition:'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.918 2 8.5c0 2.27 1.418 4.267 3.556 5.427L4.78 17.2a.25.25 0 00.37.28l4.042-2.72c.266.02.534.03.808.03 4.418 0 8-2.918 8-6.5S14.418 2 10 2z" fill="#000"/>
            </svg>
            카카오로 시작하기 →
          </button>
        </div>
      </section>

      {/* ── QUESTION PREVIEW ── */}
      <section className="lp-section" id="questions">
        <div style={secTag}>// 질문 미리보기</div>
        <h2 style={{ ...secHead, marginBottom:32 }}>이런 질문들로<br />측정합니다</h2>
        <div style={{ marginBottom:40 }}>
          <label style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, color:GL, textTransform:'uppercase' as const, display:'block', marginBottom:10 }}>이름을 입력해서 미리보기</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 김지수" maxLength={20}
            onFocus={e => (e.target.style.borderColor=Y)} onBlur={e => (e.target.style.borderColor='#333')}
            style={{ background:G, border:'1px solid #333', color:W, padding:'12px 16px', fontSize:15, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', width:280 }} />
        </div>
        <div className="lp-q-grid" style={{ display:'grid', gap:2, maxWidth:960 }}>
          {PREVIEW_QS.map((q, i) => (
            <div key={i} style={{ background:G, padding:'32px', borderLeft:'3px solid transparent', transition:'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderLeftColor=Y; e.currentTarget.style.background=GM }}
              onMouseLeave={e => { e.currentTarget.style.borderLeftColor='transparent'; e.currentTarget.style.background=G }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, color:Y, textTransform:'uppercase', marginBottom:10 }}>{q.dim}</div>
              <div style={{ fontSize:15, fontWeight:300, lineHeight:1.7 }}>
                <span style={{ color:Y, fontWeight:700 }}>{n}</span>
                {q.q.slice(n.length)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESULT MOCKUP ── */}
      <section className="lp-section" style={{ background:G }}>
        <div style={secTag}>// 결과 미리보기</div>
        <h2 style={{ ...secHead, marginBottom:48 }}>이런 결과가<br />나옵니다</h2>
        <div ref={resultRef} style={{ maxWidth:480, background:BK, border:'1px solid #1f1f1f', padding:'56px', position:'relative', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', bottom:-60, right:-60, width:200, height:200, borderRadius:'50%', background:Y, opacity:0.04 }} />
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, color:GL, textTransform:'uppercase', marginBottom:32 }}>// REAL ME RESULT · 5명 집계 완료</div>
          <div style={{ fontSize:18, fontWeight:300, color:GL, marginBottom:8 }}>세상이 보는 <strong style={{ color:W, fontWeight:700 }}>김지수</strong>의 Real Me</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:96, lineHeight:1, color:Y, letterSpacing:8, marginBottom:8 }}>ENFP</div>
          <div style={{ fontSize:20, fontWeight:300, color:GL, marginBottom:40 }}>활동가형 — 열정적인 자유영혼</div>
          <div style={{ background:G, padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, marginBottom:32 }}>
            {[['내가 생각한 나','INTJ',GL],['타인이 본 나','ENFP',Y]].map(([label,val,col],i) => (
              <div key={i} style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color:GL, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:4, color:col as string }}>{val}</div>
              </div>
            )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <div key="div" style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:'#333' }}>≠</div>, el], [] as React.ReactNode[])}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:32 }}>
            {BARS.map(b => (
              <div key={b.d} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:GL, width:20, textAlign:'center' }}>{b.d}</div>
                <div style={{ flex:1, height:6, background:G }}>
                  <div style={{ height:'100%', background:Y, width:barsOn ? `${b.pct}%` : '0%', transition:'width 1.5s ease' }} />
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:Y, width:40, textAlign:'right' }}>{b.pct}%</div>
              </div>
            ))}
          </div>
          <div style={{ background:Y, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:BK }}>나는 INTJ인 줄 알았는데, 세상은 ENFP라고 했다.</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:BK, opacity:0.6 }}>#RealMe #ZP</div>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="lp-section" style={{ textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div aria-hidden style={{ position:'absolute', top:-40, left:'50%', transform:'translateX(-50%)', fontFamily:"'Bebas Neue',sans-serif", fontSize:400, color:'#111', pointerEvents:'none', lineHeight:1 }}>"</div>
        <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(32px,5vw,60px)' as string, lineHeight:1.2, maxWidth:800, margin:'0 auto 32px', position:'relative', zIndex:1, letterSpacing:1 }}>
          AI는 <span style={{ color:Y }}>자기 자신을</span><br />
          객관적으로 볼 수 없다.<br />
          그것은 오직 <span style={{ color:Y }}>인간만이</span><br />
          할 수 있는 일이다.
        </p>
        <p style={{ fontSize:16, fontWeight:300, color:GL, position:'relative', zIndex:1 }}>타인의 눈으로 자신을 발견하는 것 — 가장 인간적인 행위</p>
        <a href={ZP_URL} style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:48, fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:3, color:GL, textDecoration:'none', borderBottom:'1px solid #333', paddingBottom:4, position:'relative', zIndex:1, transition:'color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color=Y; e.currentTarget.style.borderBottomColor=Y }}
          onMouseLeave={e => { e.currentTarget.style.color=GL; e.currentTarget.style.borderBottomColor='#333' }}>
          ← 불행의 역사로 돌아가기
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer" style={{ borderTop:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:Y }}>REAL ME</div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:GL, letterSpacing:2 }}>A ZP (ZERO PRODUCTIVE) PROJECT · 100% HUMAN</div>
      </footer>
    </div>
  )
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function DimBar({ label, score, left, right }: { label: string; score: number; left: string; right: string }) {
  const pct = Math.round(score * 100)
  const isLeft = score >= 0.5
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-black" style={isLeft ? { color:'#FFE600' } : {}}>{left}</span>
        <span className="text-gray-600 text-[10px] font-bold">{label}</span>
        <span className="font-black" style={!isLeft ? { color:'#FFE600' } : {}}>{right}</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${isLeft ? pct : 100-pct}%`, backgroundColor:'#FFE600', marginLeft: isLeft ? 0 : 'auto' }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-700 mt-0.5 tabular-nums">
        <span>{isLeft ? `${pct}%` : ''}</span>
        <span>{!isLeft ? `${pct}%` : ''}</span>
      </div>
    </div>
  )
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [profile,  setProfile]  = useState<any>(null)
  const [answerRows, setAnswerRows] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return }
      await initProfile(session.user)
    })
  }, [])

  async function initProfile(su: any) {
    const email = su.email
    const kakaoNick = (su.user_metadata?.full_name || su.user_metadata?.name || email.split('@')[0]).replace(/\s+/g, '')
    setAuthUser({ email, nickname: kakaoNick })

    let { data: prof } = await supabase.from('realme_profiles').select('*').eq('email', email).maybeSingle()
    if (!prof) {
      const hash = generateHash()
      let nick = kakaoNick
      const { data: existing } = await supabase.from('realme_profiles').select('id').eq('nickname', nick).maybeSingle()
      if (existing) nick = nick + Math.floor(Math.random() * 9000 + 1000)
      const { data: newProf, error } = await supabase.from('realme_profiles').insert({ email, nickname: nick, hash }).select().single()
      if (error) { console.error('profile create:', error); setLoading(false); return }
      prof = newProf
    }
    setProfile(prof)

    const { data: ans } = await supabase.from('realme_answers')
      .select('answers, created_at').eq('hash', prof.hash).order('created_at', { ascending: false })
    setAnswerRows(ans || [])
    setLoading(false)

    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`realme_answers:${prof.hash}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'realme_answers', filter:`hash=eq.${prof.hash}` },
        payload => setAnswerRows(prev => [payload.new, ...prev]))
      .subscribe()
    channelRef.current = ch
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider:'kakao', options:{ redirectTo:`${SITE}/auth/callback` } })
  }

  const link = profile ? `${SITE}/${encodeURIComponent(profile.nickname)}?id=${profile.hash}` : ''

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch (_) {}
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-sm text-gray-500">로딩 중...</p>
    </div>
  )

  if (!authUser) return <LandingPage onLogin={handleLogin} />

  // ── 로그인 후 대시보드 ──
  const hasResult = answerRows.length >= 1
  const mbtiResult = hasResult ? (() => {
    const merged: Record<number, number[]> = {}
    QUESTIONS.forEach(q => { merged[q.id] = [] })
    answerRows.forEach(row => {
      Object.entries(row.answers || {}).forEach(([qid, idx]) => {
        if (merged[Number(qid)]) merged[Number(qid)].push(Number(idx))
      })
    })
    const consensus: Record<number, number> = {}
    QUESTIONS.forEach(q => {
      const arr = merged[q.id]; if (!arr.length) return
      const counts = [0,0,0,0]; arr.forEach(i => counts[i]++)
      consensus[q.id] = counts.indexOf(Math.max(...counts))
    })
    return calcMbti(consensus)
  })() : null

  const desc = mbtiResult ? MBTI_DESC[mbtiResult.type as keyof typeof MBTI_DESC] : null

  return (
    <div style={{ minHeight:'100vh', background:'#000' }}>
      <header style={{ position:'sticky', top:0, background:'#000', borderBottom:'1px solid #222', zIndex:10 }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:'#FFE000' }}>
            REAL<span style={{ color:'#f5f5f0' }}>ME</span>
            <span style={{ fontSize:11, fontFamily:'sans-serif', fontWeight:400, color:'#555', marginLeft:8 }}>by ZP</span>
          </div>
          <div style={{ fontSize:12, color:'#666', fontWeight:700 }}>{authUser.nickname}</div>
        </div>
      </header>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* ① 내 링크 */}
        <div style={{ borderRadius:16, padding:24, border:'2px solid #FFE600', background:'rgba(255,230,0,0.03)', width:'100%', boxSizing:'border-box' }}>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:3, color:'#FFE600', marginBottom:12 }}>📎 내 링크</div>
          <div style={{ fontSize:12, color:'#666', wordBreak:'break-all', fontFamily:'monospace', lineHeight:1.7, marginBottom:16 }}>{link}</div>
          <button onClick={copyLink}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, fontWeight:900, fontSize:13, background:'#FFE600', color:'#000', border:'none', cursor:'pointer' }}>
            {copied ? <Check style={{ width:15, height:15 }} /> : <Copy style={{ width:15, height:15 }} />}
            {copied ? '복사 완료!' : '링크 복사'}
          </button>
        </div>

        {/* ② 응답 현황 */}
        <div style={{ borderRadius:16, padding:24, background:'#0a0a0a', border:'1px solid #222', width:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Users style={{ width:15, height:15, color:'#FFE600' }} />
              <span style={{ fontWeight:900, color:'#fff', fontSize:13 }}>응답 현황</span>
            </div>
            {hasResult && (
              <span style={{ fontSize:10, fontWeight:900, padding:'4px 10px', borderRadius:999, background:'#FFE600', color:'#000' }}>결과 공개 중</span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:52, fontWeight:900, fontVariantNumeric:'tabular-nums', color: hasResult ? '#FFE600' : '#fff' }}>{answerRows.length}</span>
            <span style={{ fontSize:14, color:'#555' }}>명 응답</span>
          </div>
          <p style={{ fontSize:12, color:'#555', marginTop:4 }}>
            {!hasResult ? '1명만 답변해도 결과가 공개돼요 · 링크를 친구에게 공유하세요' : '더 공유할수록 정확해져요 🎯'}
          </p>
        </div>

        {/* ③ MBTI 결과 */}
        {hasResult && mbtiResult && desc ? (
          <div style={{ borderRadius:16, padding:24, background:'#0a0a0a', border:'1px solid #222', width:'100%', boxSizing:'border-box' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:13, fontWeight:900, color:'#fff' }}>🧠 친구들이 분석한 내 MBTI</span>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#555' }}>
                <RefreshCw style={{ width:11, height:11 }} /> 실시간 업데이트
              </div>
            </div>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:88, lineHeight:1, letterSpacing:8, color:'#FFE600', marginBottom:8 }}>{mbtiResult.type}</div>
              <div style={{ fontSize:32, marginBottom:6 }}>{desc.emoji}</div>
              <div style={{ fontSize:17, fontWeight:900, color:'#fff', marginBottom:6 }}>{desc.name}</div>
              <div style={{ fontSize:13, color:'#888', lineHeight:1.7 }}>{desc.desc}</div>
            </div>
          </div>
        ) : (
          <div style={{ borderRadius:16, padding:40, border:'1px solid #222', textAlign:'center', width:'100%', boxSizing:'border-box' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:'#1a1a1a', marginBottom:12 }}>MBTI</div>
            <div style={{ fontWeight:700, color:'#555', fontSize:14 }}>1명이 답변하면 결과가 공개돼요</div>
            <div style={{ fontSize:12, color:'#444', marginTop:6 }}>친구들에게 링크를 공유해보세요</div>
          </div>
        )}

        {/* ④ 차원별 분석 */}
        {hasResult && mbtiResult && (
          <div style={{ borderRadius:16, padding:24, background:'#0a0a0a', border:'1px solid #222', width:'100%', boxSizing:'border-box' }}>
            <div style={{ fontSize:12, color:'#555', fontWeight:900, marginBottom:20 }}>차원별 분석 ({answerRows.length}명 기준)</div>
            <DimBar label="에너지"   score={mbtiResult.dims.EI.score} left="E 외향" right="I 내향" />
            <DimBar label="인식"     score={mbtiResult.dims.SN.score} left="S 감각" right="N 직관" />
            <DimBar label="판단"     score={mbtiResult.dims.TF.score} left="T 사고" right="F 감정" />
            <DimBar label="생활양식" score={mbtiResult.dims.JP.score} left="J 판단" right="P 인식" />
            <p style={{ fontSize:11, color:'#444', textAlign:'center', marginTop:16 }}>더 많은 친구가 답변할수록 결과가 정확해져요</p>
          </div>
        )}

      </div>
    </div>
  )
}
