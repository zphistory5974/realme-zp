'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUESTIONS } from '@/lib/questions'
import { Check, ChevronLeft } from 'lucide-react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://realme-zp.vercel.app'
const Y = '#FFE000'

type Stage = 'loading' | 'invalid' | 'login_required' | 'owner' | 'already_submitted' | 'survey' | 'review' | 'submitted'

// ── shared header ────────────────────────────────────────────────────────────
function Header({ nickname }: { nickname?: string }) {
  return (
    <header style={{ position:'sticky', top:0, background:'#0a0a0a', borderBottom:'1px solid #1a1a1a', zIndex:10 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:Y }}>
          REAL<span style={{ color:'#f5f5f0' }}>ME</span>
        </div>
        {nickname && (
          <div style={{ fontSize:12, color:'#555' }}>
            <span style={{ color:'#f5f5f0', fontWeight:700 }}>{nickname}</span>님 관찰 질문지
          </div>
        )}
      </div>
    </header>
  )
}

// ── centered card ────────────────────────────────────────────────────────────
function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:4, color:Y, marginBottom:32 }}>
          REAL<span style={{ color:'#f5f5f0' }}>ME</span>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── main component ───────────────────────────────────────────────────────────
function Questionnaire() {
  const { nickname } = useParams<{ nickname: string }>()
  const searchParams  = useSearchParams()
  const hash          = searchParams.get('id')

  const [stage,     setStage]     = useState<Stage>('loading')
  const [profile,   setProfile]   = useState<any>(null)
  const [session,   setSession]   = useState<any>(null)
  const [answers,   setAnswers]   = useState<Record<number, number>>({})
  const [currentQ,  setCurrentQ]  = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [isDesktop,  setIsDesktop]  = useState(false)

  // animation
  const [visible,   setVisible]   = useState(true)
  const [animDir,   setAnimDir]   = useState<'forward' | 'back'>('forward')
  const inTransit   = useRef(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!nickname || !hash) { setStage('invalid'); return }
    Promise.all([
      supabase.from('realme_profiles')
        .select('*')
        .eq('nickname', decodeURIComponent(String(nickname)))
        .maybeSingle(),
      supabase.auth.getSession(),
    ]).then(async ([{ data: prof }, { data: { session: sess } }]) => {
      if (!prof || prof.hash !== hash) { setStage('invalid'); return }
      setProfile(prof)
      if (!sess?.user) { setStage('login_required'); return }
      setSession(sess)
      const { data: myProf } = await supabase.from('realme_profiles')
        .select('hash').eq('email', sess.user.email).maybeSingle()
      if (myProf?.hash === hash) { setStage('owner'); return }
      const { data: existing } = await supabase.from('realme_answers')
        .select('id').eq('hash', hash).eq('respondent_id', sess.user.id).maybeSingle()
      if (existing) { setStage('already_submitted'); return }
      setStage('survey')
    })
  }, [nickname, hash])

  const handleLogin = async () => {
    sessionStorage.setItem('zp_login_next', `/${encodeURIComponent(String(nickname))}?id=${hash}`)
    await supabase.auth.signInWithOAuth({ provider:'kakao', options:{ redirectTo:`${SITE}/auth/callback` } })
  }

  // animated transition between questions
  const goTo = (idx: number, dir: 'forward' | 'back') => {
    if (inTransit.current) return
    inTransit.current = true
    setAnimDir(dir)
    setVisible(false)
    setTimeout(() => {
      setCurrentQ(idx)
      setVisible(true)
      inTransit.current = false
    }, 180)
  }

  const handleSelect = (qId: number, optIdx: number) => {
    const newAnswers = { ...answers, [qId]: optIdx }
    setAnswers(newAnswers)

    const isLast     = currentQ === QUESTIONS.length - 1
    const nowAllDone = Object.keys(newAnswers).length === QUESTIONS.length

    if (isLast && nowAllDone) {
      // last question answered → auto go to review
      setTimeout(() => setStage('review'), 650)
    } else if (!isLast) {
      // auto-advance to next question
      setTimeout(() => goTo(currentQ + 1, 'forward'), 320)
    }
  }

  const submit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) return
    setSubmitting(true)
    const { error } = await supabase.from('realme_answers').insert({
      hash: profile.hash,
      answers,
      respondent_id: session?.user?.id,
    })
    if (error) {
      if (error.code === '23505') { setStage('already_submitted'); return }
      console.error('[realme submit]', error)
      alert('제출에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
      return
    }
    setStage('submitted')
  }

  const answeredCount = Object.keys(answers).length
  const allDone       = answeredCount === QUESTIONS.length
  const progress      = (answeredCount / QUESTIONS.length) * 100

  // ─── LOADING ────────────────────────────────────────────────────────────
  if (stage === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontSize:13, color:'#555' }}>로딩 중...</p>
    </div>
  )

  // ─── INVALID ────────────────────────────────────────────────────────────
  if (stage === 'invalid') return (
    <CenteredCard>
      <div style={{ fontSize:48, marginBottom:20 }}>🔗</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>유효하지 않은 링크예요</div>
      <div style={{ fontSize:13, color:'#666' }}>올바른 링크로 다시 접속해주세요</div>
    </CenteredCard>
  )

  // ─── LOGIN REQUIRED ─────────────────────────────────────────────────────
  if (stage === 'login_required') return (
    <CenteredCard>
      <div style={{ fontSize:48, marginBottom:20 }}>🔐</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>답변하려면 로그인이 필요해요</div>
      <p style={{ fontSize:13, color:'#666', lineHeight:1.9, marginBottom:32 }}>
        <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님에 대한<br />
        MBTI 관찰 질문지에 답변하려면<br />
        카카오 로그인이 필요합니다
      </p>
      <button onClick={handleLogin}
        style={{ width:'100%', background:'#FEE500', color:'#0a0a0a', border:'none', padding:'16px 0', borderRadius:14, fontWeight:900, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.918 2 8.5c0 2.27 1.418 4.267 3.556 5.427L4.78 17.2a.25.25 0 00.37.28l4.042-2.72c.266.02.534.03.808.03 4.418 0 8-2.918 8-6.5S14.418 2 10 2z" fill="#000"/>
        </svg>
        카카오로 로그인하기
      </button>
    </CenteredCard>
  )

  // ─── OWNER ──────────────────────────────────────────────────────────────
  if (stage === 'owner') return (
    <CenteredCard>
      <div style={{ fontSize:48, marginBottom:20 }}>🙅</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>본인은 답변할 수 없어요</div>
      <p style={{ fontSize:13, color:'#666', lineHeight:1.9, marginBottom:32 }}>
        내 링크를 친구들에게 공유하고<br />
        친구들의 답변으로 내 MBTI를 확인해요
      </p>
      <a href="/" style={{ display:'block', width:'100%', background:Y, color:'#0a0a0a', border:'none', padding:'14px 0', borderRadius:14, fontWeight:900, fontSize:14, textDecoration:'none' }}>
        내 결과 보기 →
      </a>
    </CenteredCard>
  )

  // ─── ALREADY SUBMITTED ──────────────────────────────────────────────────
  if (stage === 'already_submitted') return (
    <CenteredCard>
      <div style={{ fontSize:48, marginBottom:20 }}>✋</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>이미 답변하셨어요</div>
      <p style={{ fontSize:13, color:'#666', lineHeight:1.9 }}>
        <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님에 대한<br />
        답변을 이미 제출하셨습니다.<br />
        중복 제출은 허용되지 않아요.
      </p>
    </CenteredCard>
  )

  // ─── SUBMITTED ──────────────────────────────────────────────────────────
  if (stage === 'submitted') return (
    <CenteredCard>
      <div style={{ fontSize:56, marginBottom:20 }}>✅</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:Y, letterSpacing:4, marginBottom:12 }}>DONE!</div>
      <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>답변이 완료됐어요!</div>
      <p style={{ fontSize:13, color:'#888', lineHeight:1.9, marginBottom:24 }}>
        <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님의<br />
        MBTI 결과에 소중한 한 표가 더해졌어요.<br />
        솔직한 답변 고마워요 😊
      </p>
      <div style={{ fontSize:11, color:'#444' }}>이 창을 닫아도 됩니다</div>
    </CenteredCard>
  )

  // ─── REVIEW ─────────────────────────────────────────────────────────────
  if (stage === 'review') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a' }}>
      <Header nickname={profile?.nickname} />
      <div style={{ maxWidth:900, margin:'0 auto', padding: isDesktop ? '48px 40px' : '32px 20px' }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight:900, color:'#f5f5f0', marginBottom:6 }}>답변 검토</div>
          <div style={{ fontSize:13, color:'#666' }}>32개 질문 모두 답변하셨어요. 제출 전 확인해 주세요.</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:10, marginBottom:40 }}>
          {QUESTIONS.map((q, i) => {
            const selIdx = answers[q.id]
            const selOpt = q.opts[selIdx]
            return (
              <div key={q.id} style={{ background:'#111', border:'1px solid #1f1f1f', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:'#444', fontWeight:700, marginBottom:4 }}>Q{i + 1}</div>
                  <div style={{ fontSize:13, color:'#aaa', lineHeight:1.5, marginBottom:8 }}>{q.q}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:Y }}>→ {selOpt?.text}</div>
                </div>
                <button
                  onClick={() => { setCurrentQ(i); setVisible(true); setStage('survey') }}
                  style={{ fontSize:11, color:'#444', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', flexShrink:0, paddingTop:2, whiteSpace:'nowrap' }}
                  onMouseEnter={e => (e.currentTarget.style.color='#888')}
                  onMouseLeave={e => (e.currentTarget.style.color='#444')}>
                  수정
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button onClick={() => setStage('survey')}
            style={{ padding: isDesktop ? '14px 28px' : '12px 20px', borderRadius:12, fontWeight:900, fontSize:14, background:'transparent', border:'1px solid #333', color:'#888', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#666'; e.currentTarget.style.color='#f5f5f0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#888' }}>
            ← 전체 수정
          </button>
          <button onClick={submit} disabled={submitting}
            style={{ padding: isDesktop ? '14px 40px' : '12px 28px', borderRadius:12, fontWeight:900, fontSize: isDesktop ? 16 : 14, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '제출 중...' : '제출하기 ✓'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── SURVEY — one question at a time ────────────────────────────────────
  const q      = QUESTIONS[currentQ]
  const isLast = currentQ === QUESTIONS.length - 1

  const slideX = animDir === 'forward' ? '-24px' : '24px'
  const cardStyle: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateX(0)' : `translateX(${slideX})`,
    transition: 'opacity 0.18s ease, transform 0.18s ease',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column' }}>

      {/* ── top progress bar ── */}
      <div style={{ width:'100%', height:3, background:'#1a1a1a', flexShrink:0 }}>
        <div style={{ height:'100%', background:Y, width:`${progress}%`, transition:'width 0.4s ease' }} />
      </div>

      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        maxWidth:600, margin:'0 auto', width:'100%',
        padding: isDesktop ? '40px 48px 40px' : '28px 24px 32px',
      }}>

        {/* ── nav row: back button + counter ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: isDesktop ? 52 : 36, flexShrink:0 }}>
          {currentQ > 0 ? (
            <button onClick={() => goTo(currentQ - 1, 'back')}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'#555', background:'none', border:'none', cursor:'pointer', padding:'6px 0' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
              <ChevronLeft style={{ width:16, height:16 }} />
              이전
            </button>
          ) : (
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:4, color:Y }}>
              REAL<span style={{ color:'#f5f5f0' }}>ME</span>
            </div>
          )}

          <div style={{ fontFamily:"'Space Mono',monospace", fontSize: isDesktop ? 14 : 12, fontWeight:700, color:'#f5f5f0' }}>
            {currentQ + 1}<span style={{ color:'#333' }}> / {QUESTIONS.length}</span>
          </div>
        </div>

        {/* ── animated question card ── */}
        <div style={{ ...cardStyle, flex:1, display:'flex', flexDirection:'column' }}>

          {/* question */}
          <div style={{ marginBottom: isDesktop ? 36 : 28 }}>
            <div style={{ fontSize:11, color:'#444', fontFamily:"'Space Mono',monospace", marginBottom:14, letterSpacing:1 }}>
              {profile?.nickname}님에 대해
            </div>
            <h2 style={{ fontSize: isDesktop ? 28 : 22, fontWeight:900, color:'#f5f5f0', lineHeight:1.45, margin:0 }}>
              {q.q}
            </h2>
          </div>

          {/* options */}
          <div style={{ display:'flex', flexDirection:'column', gap: isDesktop ? 12 : 10 }}>
            {q.opts.map((opt, i) => {
              const selected = answers[q.id] === i
              return (
                <button key={i} onClick={() => handleSelect(q.id, i)}
                  style={{
                    width:'100%', textAlign:'left',
                    padding: isDesktop ? '20px 24px' : '17px 20px',
                    borderRadius: 14,
                    border:`2px solid ${selected ? Y : '#222'}`,
                    background: selected ? 'rgba(255,224,0,0.06)' : '#0d0d0d',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    cursor:'pointer', transition:'border-color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.background='#111' } }}
                  onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor='#222'; e.currentTarget.style.background='#0d0d0d' } }}>
                  <span style={{ fontSize: isDesktop ? 16 : 15, fontWeight:600, color: selected ? Y : '#aaa', lineHeight:1.4 }}>
                    {opt.text}
                  </span>
                  {selected && <Check style={{ width:18, height:18, flexShrink:0, marginLeft:16, color:Y }} />}
                </button>
              )
            })}
          </div>

          {/* "검토하기" button — shown if all answered and user navigated back */}
          {allDone && (
            <div style={{ marginTop: isDesktop ? 20 : 16 }}>
              <button onClick={() => setStage('review')}
                style={{ width:'100%', padding: isDesktop ? '18px 0' : '16px 0', borderRadius:14, fontWeight:900, fontSize: isDesktop ? 16 : 15, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer' }}>
                답변 검토하기 →
              </button>
            </div>
          )}

          {/* hint when on last Q but not all answered */}
          {isLast && !allDone && (
            <div style={{ marginTop:16, fontSize:12, color:'#555', textAlign:'center' }}>
              아직 {QUESTIONS.length - answeredCount}개 미답변 — 이전 버튼으로 돌아가 완성해주세요
            </div>
          )}
        </div>

        {/* ── progress dots ── */}
        <div style={{ marginTop:32, display:'flex', alignItems:'center', justifyContent:'center', gap:3, flexShrink:0 }}>
          {QUESTIONS.map((qItem, i) => {
            const isCurrent  = i === currentQ
            const isAnswered = answers[qItem.id] !== undefined
            return (
              <div key={i} style={{
                height:4, borderRadius:2,
                width: isCurrent ? 18 : 4,
                background: isAnswered ? Y : isCurrent ? '#f5f5f0' : '#222',
                transition:'width 0.25s ease, background 0.25s ease',
                flexShrink:0,
              }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function NicknamePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontSize:13, color:'#555' }}>로딩 중...</p>
      </div>
    }>
      <Questionnaire />
    </Suspense>
  )
}
