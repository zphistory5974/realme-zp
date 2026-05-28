'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QUESTIONS } from '@/lib/questions'
import { ChevronRight, Check } from 'lucide-react'

function Questionnaire() {
  const { nickname } = useParams<{ nickname: string }>()
  const searchParams = useSearchParams()
  const hash = searchParams.get('id')

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!nickname || !hash) { setInvalid(true); setLoading(false); return }
    supabase.from('realme_profiles')
      .select('*')
      .eq('nickname', decodeURIComponent(String(nickname)))
      .maybeSingle()
      .then(({ data: prof }) => {
        if (!prof || prof.hash !== hash) { setInvalid(true); setLoading(false); return }
        setProfile(prof)
        setLoading(false)
      })
  }, [nickname, hash])

  const handleSelect = (qId: number, optIdx: number) => {
    const next = { ...answers, [qId]: optIdx }
    setAnswers(next)
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 220)
    }
  }

  const submit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) return
    setSubmitting(true)
    const { error } = await supabase.from('realme_answers').insert({ hash: profile.hash, answers })
    if (error) {
      console.error('[realme submit]', error)
      alert('제출에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
      return
    }
    setSubmitted(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-sm text-gray-500">로딩 중...</p>
    </div>
  )

  if (invalid) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-5xl mb-5">🔗</div>
        <div className="text-white font-black text-xl mb-2">유효하지 않은 링크예요</div>
        <div className="text-gray-500 text-sm">올바른 링크로 다시 접속해주세요</div>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <div className="font-bebas text-5xl tracking-widest mb-4" style={{ color: '#FFE600' }}>DONE!</div>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          <span className="font-black text-white">{profile.nickname}</span>님의<br />
          MBTI 분석 답변이 전달됐어요.<br />
          솔직한 답변 감사해요 🙏
        </p>
        <div className="text-gray-700 text-xs">이 창을 닫아도 됩니다</div>
      </div>
    </div>
  )

  const q = QUESTIONS[currentQ]
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100
  const isLast = currentQ === QUESTIONS.length - 1
  const allDone = Object.keys(answers).length === QUESTIONS.length

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 진행 바 */}
      <div className="w-full h-1 bg-[#111]">
        <div className="h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%`, backgroundColor: '#FFE600' }} />
      </div>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-8 max-w-lg mx-auto w-full">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="font-bebas text-2xl tracking-widest mb-1" style={{ color: '#FFE600' }}>
            REAL<span className="text-white">ME</span>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-black text-white">{profile.nickname}</span>님에 대한 MBTI 관찰 질문지
          </div>
        </div>

        {/* 질문 번호 */}
        <div className="text-xs font-black text-gray-600 mb-3 tabular-nums">
          {currentQ + 1} <span className="text-gray-700">/ {QUESTIONS.length}</span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight mb-8">{q.q}</h2>

        {/* 선택지 */}
        <div className="space-y-3 flex-1">
          {q.opts.map((opt, i) => {
            const selected = answers[q.id] === i
            return (
              <button key={i} onClick={() => handleSelect(q.id, i)}
                className="w-full text-left px-5 py-4 rounded-2xl border-2 transition-all hover:scale-[1.01] flex items-center justify-between"
                style={{
                  borderColor: selected ? '#FFE600' : '#1e1e1e',
                  backgroundColor: selected ? 'rgba(255,230,0,0.07)' : '#0a0a0a',
                }}>
                <span className={`font-bold text-sm leading-snug ${selected ? '' : 'text-gray-300'}`}
                  style={selected ? { color: '#FFE600' } : {}}>
                  {opt.text}
                </span>
                {selected && <Check className="w-4 h-4 flex-shrink-0 ml-3" style={{ color: '#FFE600' }} />}
              </button>
            )
          })}
        </div>

        {/* 이전 / 다음·제출 */}
        <div className="mt-8 flex items-center justify-between">
          {currentQ > 0 ? (
            <button onClick={() => setCurrentQ(c => c - 1)}
              className="text-sm text-gray-600 hover:text-white transition-colors">
              ← 이전
            </button>
          ) : <div />}

          {isLast ? (
            <button onClick={submit} disabled={!allDone || submitting}
              className="px-6 py-3 rounded-xl font-black text-sm disabled:opacity-40 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: '#FFE600', color: '#000' }}>
              {submitting ? '제출 중...' : '제출하기 ✓'}
            </button>
          ) : answers[q.id] !== undefined ? (
            <button onClick={() => setCurrentQ(c => c + 1)}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: '#FFE600', color: '#000' }}>
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-gray-700 text-xs">답변을 선택해주세요</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NicknamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    }>
      <Questionnaire />
    </Suspense>
  )
}
