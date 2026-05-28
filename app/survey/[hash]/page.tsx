'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUESTIONS } from '@/lib/questions'
import { Check, ChevronLeft } from 'lucide-react'

const Y = '#FFE000'

type Stage = 'loading' | 'invalid' | 'already_submitted' | 'survey' | 'review' | 'submitted'

function SurveyInner() {
  const { hash } = useParams<{ hash: string }>()

  const [stage,     setStage]     = useState<Stage>('loading')
  const [profile,   setProfile]   = useState<any>(null)
  const [answers,   setAnswers]   = useState<Record<number, number>>({})
  const [currentQ,  setCurrentQ]  = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [visible,  setVisible]  = useState(true)
  const [animDir,  setAnimDir]  = useState<'forward' | 'back'>('forward')
  const inTransit  = useRef(false)

  useEffect(() => {
    if (!hash) { setStage('invalid'); return }

    // localStorage duplicate check
    if (localStorage.getItem(`realme_submitted_${hash}`)) {
      supabase.from('realme_profiles').select('nickname').eq('hash', hash).maybeSingle()
        .then(({ data }) => { if (data) setProfile(data); setStage('already_submitted') })
      return
    }

    supabase.from('realme_profiles').select('*').eq('hash', hash).maybeSingle()
      .then(({ data }) => {
        if (!data) { setStage('invalid'); return }
        setProfile(data)
        setStage('survey')
      })
  }, [hash])

  const goTo = (idx: number, dir: 'forward' | 'back') => {
    if (inTransit.current) return
    inTransit.current = true
    setAnimDir(dir)
    setVisible(false)
    setTimeout(() => { setCurrentQ(idx); setVisible(true); inTransit.current = false }, 180)
  }

  const handleSelect = (qId: number, optIdx: number) => {
    const newAnswers = { ...answers, [qId]: optIdx }
    setAnswers(newAnswers)
    const isLast     = currentQ === QUESTIONS.length - 1
    const nowAllDone = Object.keys(newAnswers).length === QUESTIONS.length
    if (isLast && nowAllDone) {
      setTimeout(() => setStage('review'), 650)
    } else if (!isLast) {
      setTimeout(() => goTo(currentQ + 1, 'forward'), 320)
    }
  }

  const submit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) return
    setSubmitting(true)

    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    const payload: Record<string, unknown> = { hash, answers }
    if (userId) payload.respondent_id = userId

    let { error } = await supabase.from('realme_answers').insert(payload)

    if (error?.code === 'PGRST204') {
      const retry = await supabase.from('realme_answers').insert({ hash, answers })
      error = retry.error ?? null
    }

    if (error) {
      if (error.code === '23505') {
        localStorage.setItem(`realme_submitted_${hash}`, '1')
        setStage('already_submitted')
        return
      }
      console.error('[survey submit]', { code: error.code, message: error.message })
      alert(`제출에 실패했습니다.\n${error.message}`)
      setSubmitting(false)
      return
    }

    localStorage.setItem(`realme_submitted_${hash}`, '1')
    setStage('submitted')
  }

  const answeredCount = Object.keys(answers).length
  const allDone       = answeredCount === QUESTIONS.length
  const progress      = (answeredCount / QUESTIONS.length) * 100

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (stage === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontSize:13, color:'#444' }}>로딩 중...</p>
    </div>
  )

  // ─── INVALID ───────────────────────────────────────────────────────────────
  if (stage === 'invalid') return (
    <div style={{ minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>🔗</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>유효하지 않은 링크예요</div>
        <div style={{ fontSize:13, color:'#555' }}>올바른 링크로 다시 접속해주세요</div>
      </div>
    </div>
  )

  // ─── ALREADY SUBMITTED ─────────────────────────────────────────────────────
  if (stage === 'already_submitted') return (
    <div style={{ minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>✋</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>이미 답변하셨어요</div>
        <p style={{ fontSize:13, color:'#555', lineHeight:1.9 }}>
          <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님에 대한<br />
          답변을 이미 제출하셨습니다.
        </p>
      </div>
    </div>
  )

  // ─── SUBMITTED ─────────────────────────────────────────────────────────────
  if (stage === 'submitted') return (
    <div style={{ minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:Y, letterSpacing:4, marginBottom:12 }}>DONE!</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>답변이 완료됐어요!</div>
        <p style={{ fontSize:13, color:'#888', lineHeight:1.9, marginBottom:24 }}>
          <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span>님의<br />
          MBTI 결과에 소중한 한 표가 더해졌어요.<br />
          솔직한 답변 고마워요 😊
        </p>
        <div style={{ fontSize:11, color:'#333' }}>이 창을 닫아도 됩니다</div>
      </div>
    </div>
  )

  // ─── REVIEW ────────────────────────────────────────────────────────────────
  if (stage === 'review') return (
    <div style={{ minHeight:'100vh', background:'#050505' }}>
      <header style={{ borderBottom:'1px solid #111', padding:'14px 24px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, color:'#444' }}>
            <span style={{ color:Y, fontWeight:900 }}>{profile?.nickname}</span>
            <span style={{ marginLeft:4 }}>측정 중</span>
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'#2a2a2a' }}>32 / 32</div>
        </div>
      </header>
      <div style={{ maxWidth:600, margin:'0 auto', padding:'36px 24px' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:900, color:'#f5f5f0', marginBottom:4 }}>답변 검토</div>
          <div style={{ fontSize:13, color:'#444' }}>제출 전 확인해 주세요.</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:28 }}>
          {QUESTIONS.map((q, i) => {
            const selOpt = q.opts[answers[q.id]]
            return (
              <div key={q.id} style={{ background:'#0a0a0a', border:'1px solid #111', borderRadius:12, padding:'13px 18px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:'#2a2a2a', fontWeight:700, marginBottom:3 }}>Q{i + 1}</div>
                  <div style={{ fontSize:12, color:'#777', lineHeight:1.5, marginBottom:5 }}>{q.q}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:Y }}>→ {selOpt?.text}</div>
                </div>
                <button onClick={() => { setCurrentQ(i); setVisible(true); setStage('survey') }}
                  style={{ fontSize:11, color:'#2a2a2a', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', flexShrink:0, paddingTop:2 }}
                  onMouseEnter={e => (e.currentTarget.style.color='#666')}
                  onMouseLeave={e => (e.currentTarget.style.color='#2a2a2a')}>
                  수정
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={() => setStage('survey')}
            style={{ padding:'12px 24px', borderRadius:12, fontWeight:900, fontSize:13, background:'transparent', border:'1px solid #222', color:'#555', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#444'; e.currentTarget.style.color='#f5f5f0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#222'; e.currentTarget.style.color='#555' }}>
            ← 전체 수정
          </button>
          <button onClick={submit} disabled={submitting}
            style={{ padding:'12px 32px', borderRadius:12, fontWeight:900, fontSize:14, background:Y, color:'#000', border:'none', cursor:'pointer', opacity: submitting ? 0.5 : 1 }}>
            {submitting ? '제출 중...' : '제출하기 ✓'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── SURVEY ────────────────────────────────────────────────────────────────
  const q      = QUESTIONS[currentQ]
  const isLast = currentQ === QUESTIONS.length - 1

  const slideX    = animDir === 'forward' ? '-24px' : '24px'
  const cardStyle: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateX(0)' : `translateX(${slideX})`,
    transition: 'opacity 0.18s ease, transform 0.18s ease',
    flex:1, display:'flex', flexDirection:'column',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#050505', display:'flex', flexDirection:'column' }}>

      {/* progress bar */}
      <div style={{ width:'100%', height:3, background:'#111', flexShrink:0 }}>
        <div style={{ height:'100%', background:Y, width:`${progress}%`, transition:'width 0.4s ease' }} />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', maxWidth:600, margin:'0 auto', width:'100%', padding:'28px 24px 32px' }}>

        {/* nav row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:36, flexShrink:0 }}>
          {currentQ > 0 ? (
            <button onClick={() => goTo(currentQ - 1, 'back')}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'#444', background:'none', border:'none', cursor:'pointer', padding:'6px 0' }}
              onMouseEnter={e => (e.currentTarget.style.color='#aaa')}
              onMouseLeave={e => (e.currentTarget.style.color='#444')}>
              <ChevronLeft style={{ width:15, height:15 }} />
              이전
            </button>
          ) : (
            <div style={{ fontSize:13, color:'#444' }}>
              <span style={{ color:'#f5f5f0', fontWeight:700 }}>{profile?.nickname}</span> 측정 중
            </div>
          )}
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700, color:'#f5f5f0' }}>
            {currentQ + 1}<span style={{ color:'#222' }}> / {QUESTIONS.length}</span>
          </div>
        </div>

        {/* animated question card */}
        <div style={cardStyle}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, color:'#2a2a2a', fontFamily:"'Space Mono',monospace", marginBottom:12, letterSpacing:1 }}>
              {profile?.nickname}님에 대해
            </div>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#f5f5f0', lineHeight:1.45, margin:0 }}>
              {q.q}
            </h2>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {q.opts.map((opt, i) => {
              const selected = answers[q.id] === i
              return (
                <button key={i} onClick={() => handleSelect(q.id, i)}
                  style={{
                    width:'100%', textAlign:'left', padding:'17px 20px', borderRadius:14,
                    border:`2px solid ${selected ? Y : '#161616'}`,
                    background: selected ? 'rgba(255,224,0,0.06)' : '#0a0a0a',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    cursor:'pointer', transition:'border-color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor='#252525'; e.currentTarget.style.background='#0e0e0e' } }}
                  onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor='#161616'; e.currentTarget.style.background='#0a0a0a' } }}>
                  <span style={{ fontSize:15, fontWeight:600, color: selected ? Y : '#777', lineHeight:1.4 }}>
                    {opt.text}
                  </span>
                  {selected && <Check style={{ width:17, height:17, flexShrink:0, marginLeft:16, color:Y }} />}
                </button>
              )
            })}
          </div>

          {allDone && (
            <div style={{ marginTop:16 }}>
              <button onClick={() => setStage('review')}
                style={{ width:'100%', padding:'16px 0', borderRadius:14, fontWeight:900, fontSize:15, background:Y, color:'#000', border:'none', cursor:'pointer' }}>
                답변 검토하기 →
              </button>
            </div>
          )}

          {isLast && !allDone && (
            <div style={{ marginTop:16, fontSize:12, color:'#333', textAlign:'center' }}>
              아직 {QUESTIONS.length - answeredCount}개 미답변 — 이전으로 돌아가 완성해주세요
            </div>
          )}
        </div>

        {/* progress dots */}
        <div style={{ marginTop:28, display:'flex', alignItems:'center', justifyContent:'center', gap:3, flexShrink:0 }}>
          {QUESTIONS.map((qItem, i) => (
            <div key={i} style={{
              height:4, borderRadius:2, flexShrink:0,
              width: i === currentQ ? 18 : 4,
              background: answers[qItem.id] !== undefined ? Y : i === currentQ ? '#f5f5f0' : '#1a1a1a',
              transition:'width 0.25s ease, background 0.25s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontSize:13, color:'#444' }}>로딩 중...</p>
      </div>
    }>
      <SurveyInner />
    </Suspense>
  )
}
