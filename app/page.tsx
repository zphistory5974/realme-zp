'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { calcMbti, MBTI_DESC, QUESTIONS } from '@/lib/questions'
import { Copy, Check, Users, RefreshCw } from 'lucide-react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://realme-zp.vercel.app'

function generateHash() {
  return Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('')
}

function DimBar({ label, score, left, right }: { label: string; score: number; left: string; right: string }) {
  const pct = Math.round(score * 100)
  const isLeft = score >= 0.5
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className={`font-black ${isLeft ? 'text-white' : ''}`} style={isLeft ? { color: '#FFE600' } : {}}>{left}</span>
        <span className="text-gray-600 text-[10px] font-bold">{label}</span>
        <span className={`font-black ${!isLeft ? 'text-white' : ''}`} style={!isLeft ? { color: '#FFE600' } : {}}>{right}</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${isLeft ? pct : 100 - pct}%`, backgroundColor: '#FFE600', marginLeft: isLeft ? 0 : 'auto' }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-700 mt-0.5 tabular-nums">
        <span>{isLeft ? `${pct}%` : ''}</span>
        <span>{!isLeft ? `${pct}%` : ''}</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [answerRows, setAnswerRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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
      const { data: newProf, error } = await supabase.from('realme_profiles')
        .insert({ email, nickname: nick, hash })
        .select().single()
      if (error) { console.error('profile create:', error); setLoading(false); return }
      prof = newProf
    }
    setProfile(prof)

    const { data: ans } = await supabase.from('realme_answers')
      .select('answers, created_at').eq('hash', prof.hash).order('created_at', { ascending: false })
    setAnswerRows(ans || [])
    setLoading(false)

    // Realtime subscription
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`realme_answers:${prof.hash}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'realme_answers',
        filter: `hash=eq.${prof.hash}`,
      }, payload => {
        setAnswerRows(prev => [payload.new, ...prev])
      })
      .subscribe()
    channelRef.current = ch
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${SITE}/auth/callback` },
    })
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

  if (!authUser) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="font-bebas text-7xl mb-1 tracking-widest" style={{ color: '#FFE600' }}>REAL<span className="text-white">ME</span></div>
        <div className="text-gray-500 text-sm mb-2">by ZP</div>
        <div className="text-white font-black text-xl mb-3">친구들이 보는 진짜 내 MBTI</div>
        <p className="text-gray-400 text-sm leading-relaxed mb-10">
          내 링크를 친구들에게 공유하면<br />
          32개 행동 관찰 질문으로<br />
          친구들이 분석한 내 MBTI를 확인할 수 있어요
        </p>
        <button onClick={handleLogin}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          style={{ backgroundColor: '#FEE500', color: '#000' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.918 2 8.5c0 2.27 1.418 4.267 3.556 5.427L4.78 17.2a.25.25 0 00.37.28l4.042-2.72c.266.02.534.03.808.03 4.418 0 8-2.918 8-6.5S14.418 2 10 2z" fill="#000" />
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  )

  const hasResult = answerRows.length >= 1
  const mbtiResult = hasResult ? (() => {
    // Aggregate all answer rows
    const merged: Record<number, number[]> = {}
    QUESTIONS.forEach(q => { merged[q.id] = [] })
    answerRows.forEach(row => {
      Object.entries(row.answers || {}).forEach(([qid, idx]) => {
        if (merged[Number(qid)]) merged[Number(qid)].push(Number(idx))
      })
    })
    // Most common option per question
    const consensus: Record<number, number> = {}
    QUESTIONS.forEach(q => {
      const arr = merged[q.id]
      if (!arr.length) return
      const counts = [0, 0, 0, 0]
      arr.forEach(i => counts[i]++)
      consensus[q.id] = counts.indexOf(Math.max(...counts))
    })
    return calcMbti(consensus)
  })() : null

  const desc = mbtiResult ? MBTI_DESC[mbtiResult.type as keyof typeof MBTI_DESC] : null

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 bg-black border-b border-[#222] z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bebas text-2xl tracking-widest" style={{ color: '#FFE600' }}>
            REAL<span className="text-white">ME</span>
            <span className="text-gray-600 text-xs font-sans font-normal ml-2">by ZP</span>
          </div>
          <div className="text-xs text-gray-400 font-bold">{authUser.nickname}</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* 내 링크 카드 */}
        <div className="rounded-2xl p-6" style={{ border: '2px solid #FFE600', background: 'rgba(255,230,0,0.04)' }}>
          <div className="text-[10px] font-black tracking-[0.2em] mb-3" style={{ color: '#FFE600' }}>📎 내 링크</div>
          <div className="text-gray-400 text-xs break-all mb-4 font-mono leading-relaxed">{link}</div>
          <button onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: '#FFE600', color: '#000' }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사 완료!' : '링크 복사'}
          </button>
        </div>

        {/* 응답 현황 */}
        <div className="rounded-2xl p-6 bg-[#0a0a0a] border border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#FFE600' }} />
              <span className="font-black text-white text-sm">응답 현황</span>
            </div>
            {hasResult && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFE600', color: '#000' }}>
                결과 공개 중
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-black tabular-nums" style={{ color: hasResult ? '#FFE600' : '#fff' }}>
              {answerRows.length}
            </span>
            <span className="text-gray-500 text-sm">명 응답</span>
          </div>
          {!hasResult && (
            <p className="text-gray-600 text-xs mt-2">
              1명만 답변해도 결과가 공개돼요 · 링크를 친구에게 공유하세요
            </p>
          )}
          {hasResult && (
            <p className="text-gray-600 text-xs mt-1">더 공유할수록 정확해져요 🎯</p>
          )}
        </div>

        {/* MBTI 결과 */}
        {hasResult && mbtiResult && desc ? (
          <div className="rounded-2xl p-6 bg-[#0a0a0a] border border-[#222]">
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm font-black text-white">🧠 친구들이 분석한 내 MBTI</div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <RefreshCw className="w-3 h-3" />
                실시간 업데이트
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="font-bebas text-8xl tracking-widest mb-2" style={{ color: '#FFE600' }}>
                {mbtiResult.type}
              </div>
              <div className="text-3xl mb-2">{desc.emoji}</div>
              <div className="text-white font-black text-lg mb-1">{desc.name}</div>
              <div className="text-gray-400 text-sm leading-relaxed">{desc.desc}</div>
            </div>

            <div className="border-t border-[#222] pt-5">
              <div className="text-xs text-gray-600 font-black mb-4">차원별 분석 ({answerRows.length}명 기준)</div>
              <DimBar label="에너지" score={mbtiResult.dims.EI.score} left="E 외향" right="I 내향" />
              <DimBar label="인식" score={mbtiResult.dims.SN.score} left="S 감각" right="N 직관" />
              <DimBar label="판단" score={mbtiResult.dims.TF.score} left="T 사고" right="F 감정" />
              <DimBar label="생활양식" score={mbtiResult.dims.JP.score} left="J 판단" right="P 인식" />
            </div>

            <p className="text-gray-700 text-xs text-center mt-4">
              더 많은 친구가 답변할수록 결과가 정확해져요
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-10 border border-[#222] text-center">
            <div className="font-bebas text-5xl text-gray-800 mb-3">MBTI</div>
            <div className="text-gray-500 font-bold">1명이 답변하면 결과가 공개돼요</div>
            <div className="text-gray-700 text-xs mt-2">친구들에게 링크를 공유해보세요</div>
          </div>
        )}
      </div>
    </div>
  )
}
