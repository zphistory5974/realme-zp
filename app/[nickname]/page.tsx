'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUESTIONS } from '@/lib/questions'
import { ChevronRight, Check } from 'lucide-react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://realme-zp.vercel.app'
const Y = '#FFE000'

type Stage = 'loading' | 'invalid' | 'login_required' | 'owner' | 'already_submitted' | 'survey' | 'review' | 'submitted'

// ── shared header ────────────────────────────────────────────────────────────
function Header({ nickname }: { nickname?: string }) {
  return (
    <header style={{ position:'sticky', top:0, background:'#0a0a0a', borderBottom:'1px solid #1f1f1f', zIndex:10 }}>
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
  const searchParams   = useSearchParams()
  const hash           = searchParams.get('id')

  const [stage,    setStage]    = useState<Stage>('loading')
  const [profile,  setProfile]  = useState<any>(null)
  const [session,  setSession]  = useState<any>(null)
  const [answers,  setAnswers]  = useState<Record<number, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [isDesktop,  setIsDesktop]  = useState(false)

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

      // owner check
      const { data: myProf } = await supabase.from('realme_profiles')
        .select('hash').eq('email', sess.user.email).maybeSingle()
      if (myProf?.hash === hash) { setStage('owner'); return }

      // duplicate check
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

  const handleSelect = (qId: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
    if (!isDesktop && currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 220)
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
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:isDesktop ? 28 : 22, fontWeight:900, color:'#f5f5f0', marginBottom:6 }}>답변 검토</div>
          <div style={{ fontSize:13, color:'#666' }}>32개 질문 모두 답변하셨어요. 제출 전 확인해 주세요.</div>
        </div>

        {/* 질문-답변 목록 */}
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
                <button onClick={() => { setCurrentQ(i); setStage('survey') }}
                  style={{ fontSize:11, color:'#444', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', flexShrink:0, paddingTop:2, whiteSpace:'nowrap' }}
                  onMouseEnter={e => (e.currentTarget.style.color='#888')}
                  onMouseLeave={e => (e.currentTarget.style.color='#444')}>
                  수정
                </button>
              </div>
            )
          })}
        </div>

        {/* 버튼 */}
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button onClick={() => setStage('survey')}
            style={{ padding: isDesktop ? '14px 28px' : '12px 20px', borderRadius:12, fontWeight:900, fontSize:14, background:'transparent', border:'1px solid #333', color:'#888', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#666'; e.currentTarget.style.color='#f5f5f0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#888' }}>
            ← 전체 수정
          </button>
          <button onClick={submit} disabled={submitting}
            style={{ padding: isDesktop ? '14px 40px' : '12px 28px', borderRadius:12, fontWeight:900, fontSize:isDesktop ? 16 : 14, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '제출 중...' : '제출하기 ✓'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── SURVEY — DESKTOP ────────────────────────────────────────────────────
  if (isDesktop) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a' }}>
      <Header nickname={profile?.nickname} />
      {/* 진행 상태 바 */}
      <div style={{ width:'100%', height:3, background:'#111' }}>
        <div style={{ height:'100%', background:Y, width:`${progress}%`, transition:'width 0.3s' }} />
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>
        {/* 인트로 */}
        <div style={{ marginBottom:40, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:'#f5f5f0', marginBottom:4 }}>
              <span style={{ color:Y }}>{profile?.nickname}</span>님에 대해 답변해 주세요
            </div>
            <div style={{ fontSize:13, color:'#555' }}>32개 질문에 모두 답변하면 제출할 수 있어요 · 완전 익명</div>
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:14, color: allDone ? Y : '#f5f5f0', fontWeight:700 }}>
            {answeredCount}<span style={{ color:'#333' }}>/32</span>
          </div>
        </div>

        {/* 2열 질문 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:40 }}>
          {QUESTIONS.map((q, i) => {
            const answered = answers[q.id] !== undefined
            return (
              <div key={q.id} style={{ background: answered ? 'rgba(255,224,0,0.03)' : '#0f0f0f', border:`1px solid ${answered ? '#2a2a2a' : '#171717'}`, borderRadius:16, padding:'22px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#3a3a3a' }}>Q{i + 1}</div>
                  {answered && (
                    <div style={{ width:16, height:16, borderRadius:'50%', background:Y, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Check style={{ width:10, height:10, color:'#000' }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#e5e5e5', lineHeight:1.55, marginBottom:14 }}>{q.q}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {q.opts.map((opt, j) => {
                    const selected = answers[q.id] === j
                    return (
                      <button key={j} onClick={() => handleSelect(q.id, j)}
                        style={{
                          width:'100%', textAlign:'left', padding:'11px 16px', borderRadius:10, fontSize:13, fontWeight:500,
                          border:`1.5px solid ${selected ? Y : '#1e1e1e'}`,
                          background: selected ? 'rgba(255,224,0,0.07)' : '#111',
                          color: selected ? Y : '#888',
                          cursor:'pointer', transition:'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#bbb' } }}
                        onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor='#1e1e1e'; e.currentTarget.style.color='#888' } }}>
                        {opt.text}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 검토 버튼 */}
        {allDone ? (
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => setStage('review')}
              style={{ padding:'16px 48px', borderRadius:14, fontWeight:900, fontSize:17, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`2px 2px 0 #ccb400` }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
              답변 검토하기 →
            </button>
          </div>
        ) : (
          <div style={{ textAlign:'right', fontFamily:"'Space Mono',monospace", fontSize:12, color:'#333' }}>
            {32 - answeredCount}개 더 답변하면 제출할 수 있어요
          </div>
        )}
      </div>
    </div>
  )

  // ─── SURVEY — MOBILE ────────────────────────────────────────────────────
  const q      = QUESTIONS[currentQ]
  const isLast = currentQ === QUESTIONS.length - 1

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column' }}>
      {/* 진행 바 */}
      <div style={{ width:'100%', height:3, background:'#111' }}>
        <div style={{ height:'100%', background:Y, width:`${progress}%`, transition:'width 0.3s' }} />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'24px 24px 32px', maxWidth:520, margin:'0 auto', width:'100%' }}>
        {/* 헤더 */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:4, color:Y, marginBottom:4 }}>
            REAL<span style={{ color:'#f5f5f0' }}>ME</span>
          </div>
          <div style={{ fontSize:11, color:'#555' }}>
            <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님에 대한 MBTI 관찰 질문지
          </div>
        </div>

        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'#3a3a3a', marginBottom:12 }}>
          {currentQ + 1} <span style={{ color:'#222' }}>/ {QUESTIONS.length}</span>
        </div>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#f5f5f0', lineHeight:1.35, marginBottom:28 }}>{q.q}</h2>

        {/* 선택지 */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
          {q.opts.map((opt, i) => {
            const selected = answers[q.id] === i
            return (
              <button key={i} onClick={() => handleSelect(q.id, i)}
                style={{
                  width:'100%', textAlign:'left', padding:'16px 20px', borderRadius:16,
                  border:`2px solid ${selected ? Y : '#1e1e1e'}`,
                  background: selected ? 'rgba(255,224,0,0.07)' : '#0d0d0d',
                  display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.15s',
                }}>
                <span style={{ fontSize:14, fontWeight:600, color: selected ? Y : '#aaa', lineHeight:1.4 }}>
                  {opt.text}
                </span>
                {selected && <Check style={{ width:16, height:16, flexShrink:0, marginLeft:12, color:Y }} />}
              </button>
            )
          })}
        </div>

        {/* 이전 / 다음·검토 */}
        <div style={{ marginTop:28, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {currentQ > 0
            ? <button onClick={() => setCurrentQ(c => c - 1)} style={{ fontSize:13, color:'#555', background:'none', border:'none', cursor:'pointer' }}>← 이전</button>
            : <div />}

          {isLast && allDone
            ? <button onClick={() => setStage('review')} style={{ padding:'12px 24px', borderRadius:12, fontWeight:900, fontSize:14, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer' }}>
                검토하기 →
              </button>
            : answers[q.id] !== undefined && !isLast
            ? <button onClick={() => setCurrentQ(c => c + 1)} style={{ padding:'10px 20px', borderRadius:12, fontWeight:900, fontSize:14, background:Y, color:'#0a0a0a', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                다음 <ChevronRight style={{ width:16, height:16 }} />
              </button>
            : isLast
            ? <div style={{ fontSize:11, color:'#444' }}>{32 - answeredCount}개 더 답변 필요</div>
            : <div style={{ fontSize:11, color:'#333' }}>답변을 선택해주세요</div>}
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
