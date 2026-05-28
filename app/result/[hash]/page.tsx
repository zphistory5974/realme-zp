'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcMbti, MBTI_DESC, QUESTIONS } from '@/lib/questions'
import { Users, RefreshCw } from 'lucide-react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://realme-zp.vercel.app'
const Y = '#FFE000'

function DimBar({ label, score, left, right }: { label: string; score: number; left: string; right: string }) {
  const pct    = Math.round(score * 100)
  const isLeft = score >= 0.5
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
        <span style={{ fontWeight:900, color: isLeft ? Y : '#444' }}>{left}</span>
        <span style={{ fontSize:10, color:'#444', fontWeight:700 }}>{label}</span>
        <span style={{ fontWeight:900, color: !isLeft ? Y : '#444' }}>{right}</span>
      </div>
      <div style={{ height:8, background:'#1a1a1a', borderRadius:999, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:999, background:Y,
          width:`${isLeft ? pct : 100 - pct}%`,
          marginLeft: isLeft ? 0 : 'auto',
          transition:'width 0.7s ease',
        }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#333', marginTop:3 }}>
        <span>{isLeft ? `${pct}%` : ''}</span>
        <span>{!isLeft ? `${pct}%` : ''}</span>
      </div>
    </div>
  )
}

type Stage = 'loading' | 'login_required' | 'not_owner' | 'ready'

export default function ResultPage() {
  const { hash } = useParams<{ hash: string }>()

  const [stage,      setStage]      = useState<Stage>('loading')
  const [profile,    setProfile]    = useState<any>(null)
  const [answerRows, setAnswerRows] = useState<any[]>([])
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!hash) return

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setStage('login_required'); return }

      const { data: myProf } = await supabase.from('realme_profiles')
        .select('*').eq('email', session.user.email).maybeSingle()

      if (!myProf || myProf.hash !== hash) { setStage('not_owner'); return }

      setProfile(myProf)

      const { data: ans } = await supabase.from('realme_answers')
        .select('answers, created_at').eq('hash', hash).order('created_at', { ascending: false })
      setAnswerRows(ans || [])
      setStage('ready')

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const ch = supabase.channel(`result_${hash}`)
        .on('postgres_changes', { event:'INSERT', schema:'public', table:'realme_answers', filter:`hash=eq.${hash}` },
          payload => setAnswerRows(prev => [payload.new, ...prev]))
        .subscribe()
      channelRef.current = ch
    })

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [hash])

  const handleLogin = async () => {
    sessionStorage.setItem('zp_login_next', `/result/${hash}`)
    await supabase.auth.signInWithOAuth({ provider:'kakao', options:{ redirectTo:`${SITE}/auth/callback` } })
  }

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (stage === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontSize:13, color:'#555' }}>로딩 중...</p>
    </div>
  )

  // ─── LOGIN REQUIRED ────────────────────────────────────────────────────────
  if (stage === 'login_required') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:4, color:Y, marginBottom:32 }}>
          REAL<span style={{ color:'#f5f5f0' }}>ME</span>
        </div>
        <div style={{ fontSize:48, marginBottom:20 }}>🔐</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>로그인이 필요해요</div>
        <p style={{ fontSize:13, color:'#666', lineHeight:1.9, marginBottom:32 }}>
          결과 페이지는 링크 소유자만<br />확인할 수 있어요.
        </p>
        <button onClick={handleLogin}
          style={{ width:'100%', background:'#FEE500', color:'#0a0a0a', border:'none', padding:'16px 0', borderRadius:14, fontWeight:900, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.918 2 8.5c0 2.27 1.418 4.267 3.556 5.427L4.78 17.2a.25.25 0 00.37.28l4.042-2.72c.266.02.534.03.808.03 4.418 0 8-2.918 8-6.5S14.418 2 10 2z" fill="#000"/>
          </svg>
          카카오로 로그인하기
        </button>
      </div>
    </div>
  )

  // ─── NOT OWNER ─────────────────────────────────────────────────────────────
  if (stage === 'not_owner') return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:4, color:Y, marginBottom:32 }}>
          REAL<span style={{ color:'#f5f5f0' }}>ME</span>
        </div>
        <div style={{ fontSize:48, marginBottom:20 }}>🚫</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#f5f5f0', marginBottom:8 }}>접근 권한이 없어요</div>
        <p style={{ fontSize:13, color:'#666', lineHeight:1.9, marginBottom:32 }}>
          이 링크의 결과는 소유자만<br />확인할 수 있어요.
        </p>
        <a href="/" style={{ display:'block', width:'100%', background:Y, color:'#0a0a0a', padding:'14px 0', borderRadius:14, fontWeight:900, fontSize:14, textDecoration:'none' }}>
          내 결과 보기 →
        </a>
      </div>
    </div>
  )

  // ─── READY ─────────────────────────────────────────────────────────────────
  const hasResult  = answerRows.length >= 1
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
      const counts = [0, 0, 0, 0]; arr.forEach(i => counts[i]++)
      consensus[q.id] = counts.indexOf(Math.max(...counts))
    })
    return calcMbti(consensus)
  })() : null

  const desc        = mbtiResult ? MBTI_DESC[mbtiResult.type as keyof typeof MBTI_DESC] : null
  const surveyLink  = `${SITE}/survey/${hash}`

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a' }}>
      <header style={{ position:'sticky', top:0, background:'#0a0a0a', borderBottom:'1px solid #1a1a1a', zIndex:10 }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:Y }}>
            REAL<span style={{ color:'#f5f5f0' }}>ME</span>
          </div>
          <a href="/" style={{ fontSize:12, color:'#555', textDecoration:'none' }}
            onMouseEnter={e => (e.currentTarget.style.color='#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color='#555')}>
            ← 내 대시보드
          </a>
        </div>
      </header>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ① 설문 링크 + 응답 현황 */}
        <div style={{ borderRadius:16, padding:24, background:'#0d0d0d', border:'1px solid #1a1a1a' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Users style={{ width:15, height:15, color:Y }} />
              <span style={{ fontWeight:900, color:'#f5f5f0', fontSize:13 }}>응답 현황</span>
            </div>
            {hasResult && (
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#555' }}>
                <RefreshCw style={{ width:11, height:11 }} /> 실시간
              </div>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:52, fontWeight:900, color: hasResult ? Y : '#f5f5f0' }}>{answerRows.length}</span>
            <span style={{ fontSize:14, color:'#555' }}>명 응답</span>
          </div>
          <p style={{ fontSize:12, color:'#444', marginBottom:16 }}>
            {!hasResult ? '1명만 답변해도 결과가 공개돼요' : '더 공유할수록 정확해져요 🎯'}
          </p>
          <div style={{ padding:'12px 16px', background:'#111', borderRadius:10, border:'1px solid #161616' }}>
            <div style={{ fontSize:10, color:'#333', marginBottom:5 }}>설문 링크 (친구에게 공유)</div>
            <div style={{ fontSize:11, color:'#555', fontFamily:'monospace', wordBreak:'break-all' }}>{surveyLink}</div>
          </div>
        </div>

        {/* ② MBTI 결과 */}
        {hasResult && mbtiResult && desc ? (
          <div style={{ borderRadius:16, padding:24, background:'#0d0d0d', border:'1px solid #1a1a1a' }}>
            <div style={{ fontSize:13, fontWeight:900, color:'#f5f5f0', marginBottom:20 }}>🧠 친구들이 분석한 내 MBTI</div>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:88, lineHeight:1, letterSpacing:8, color:Y, marginBottom:8 }}>
                {mbtiResult.type}
              </div>
              <div style={{ fontSize:32, marginBottom:6 }}>{desc.emoji}</div>
              <div style={{ fontSize:17, fontWeight:900, color:'#f5f5f0', marginBottom:6 }}>{desc.name}</div>
              <div style={{ fontSize:13, color:'#888', lineHeight:1.7 }}>{desc.desc}</div>
            </div>
          </div>
        ) : (
          <div style={{ borderRadius:16, padding:40, border:'1px solid #1a1a1a', textAlign:'center' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:'#1a1a1a', marginBottom:12 }}>MBTI</div>
            <div style={{ fontWeight:700, color:'#444', fontSize:14 }}>1명이 답변하면 결과가 공개돼요</div>
            <div style={{ fontSize:12, color:'#333', marginTop:6 }}>친구들에게 링크를 공유해보세요</div>
          </div>
        )}

        {/* ③ 차원별 분석 */}
        {hasResult && mbtiResult && (
          <div style={{ borderRadius:16, padding:24, background:'#0d0d0d', border:'1px solid #1a1a1a' }}>
            <div style={{ fontSize:12, color:'#555', fontWeight:900, marginBottom:20 }}>
              차원별 분석 ({answerRows.length}명 기준)
            </div>
            <DimBar label="에너지"   score={mbtiResult.dims.EI.score} left="E 외향" right="I 내향" />
            <DimBar label="인식"     score={mbtiResult.dims.SN.score} left="S 감각" right="N 직관" />
            <DimBar label="판단"     score={mbtiResult.dims.TF.score} left="T 사고" right="F 감정" />
            <DimBar label="생활양식" score={mbtiResult.dims.JP.score} left="J 판단" right="P 인식" />
            <p style={{ fontSize:11, color:'#333', textAlign:'center', marginTop:16 }}>
              더 많은 친구가 답변할수록 결과가 정확해져요
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
