// Each question maps to one MBTI dimension.
// score: 1 = first letter (E/S/T/J), 0 = second letter (I/N/F/P)
// opts: [E/S/T/J-leaning options first, I/N/F/P-leaning last] with their scores

export const QUESTIONS = [
  // ─── E / I (8 questions) ───
  {
    id: 1, dim: 'EI',
    q: '이 사람은 단체 모임에서 어떤 포지션인가요?',
    opts: [
      { text: '분위기 메이커, 에너지를 끌어올림', score: 1 },
      { text: '자연스럽게 대화를 이끄는 리더', score: 1 },
      { text: '적당히 어울리는 편', score: 0 },
      { text: '구석에서 조용히 관찰', score: 0 },
    ],
  },
  {
    id: 2, dim: 'EI',
    q: '이 사람이 쉬는 날 주로 어떻게 보내나요?',
    opts: [
      { text: '친구들 만나서 에너지 충전', score: 1 },
      { text: '밖에 나가서 활동적으로', score: 1 },
      { text: '집에서 조용히 혼자', score: 0 },
      { text: '소수의 친한 사람하고만', score: 0 },
    ],
  },
  {
    id: 3, dim: 'EI',
    q: '처음 만난 사람에게 이 사람의 첫인상은?',
    opts: [
      { text: '밝고 친근하게 먼저 다가감', score: 1 },
      { text: '재미있고 유쾌함', score: 1 },
      { text: '조용하고 신중해 보임', score: 0 },
      { text: '낯을 가리며 쉽게 다가가지 않음', score: 0 },
    ],
  },
  {
    id: 4, dim: 'EI',
    q: '이 사람이 스트레스를 푸는 방식은?',
    opts: [
      { text: '친구에게 털어놓고 수다 떪', score: 1 },
      { text: '사람들과 어울리며 기분 전환', score: 1 },
      { text: '혼자 있으면서 재충전', score: 0 },
      { text: '혼자 산책·독서·유튜브', score: 0 },
    ],
  },
  {
    id: 5, dim: 'EI',
    q: '단체 대화에서 이 사람의 참여도는?',
    opts: [
      { text: '대화를 이끌고 많이 이야기함', score: 1 },
      { text: '주제를 자주 꺼내는 편', score: 1 },
      { text: '필요할 때만 끼어드는 편', score: 0 },
      { text: '듣는 편, 말수가 많지 않음', score: 0 },
    ],
  },
  {
    id: 6, dim: 'EI',
    q: '이 사람이 새로운 환경에 적응하는 속도는?',
    opts: [
      { text: '금방 친해지고 적응 빠름', score: 1 },
      { text: '스스럼없이 먼저 말 거는 편', score: 1 },
      { text: '시간이 걸리지만 결국 적응', score: 0 },
      { text: '낯선 곳에서 에너지 많이 소모', score: 0 },
    ],
  },
  {
    id: 7, dim: 'EI',
    q: '이 사람이 발표나 앞에 나서는 상황에서는?',
    opts: [
      { text: '즐기거나 활기참', score: 1 },
      { text: '긴장하지만 잘 해냄', score: 1 },
      { text: '꺼리는 편이지만 해냄', score: 0 },
      { text: '극도로 싫어하고 회피함', score: 0 },
    ],
  },
  {
    id: 8, dim: 'EI',
    q: '이 사람의 단톡방 활동량은?',
    opts: [
      { text: '대화를 이끄는 편', score: 1 },
      { text: '반응 잘 해주는 편', score: 1 },
      { text: '가끔 읽씹 있음', score: 0 },
      { text: '존재감이 거의 없음', score: 0 },
    ],
  },

  // ─── S / N (8 questions) ───
  {
    id: 9, dim: 'SN',
    q: '이 사람이 문제를 해결할 때 주로 어떻게 접근하나요?',
    opts: [
      { text: '경험과 사실에 근거해 단계별로', score: 1 },
      { text: '검증된 방법을 우선 시도', score: 1 },
      { text: '여러 가능성을 먼저 떠올림', score: 0 },
      { text: '직관적으로 큰 그림부터 그림', score: 0 },
    ],
  },
  {
    id: 10, dim: 'SN',
    q: '이 사람이 새로운 도전에 대한 태도는?',
    opts: [
      { text: '구체적인 계획과 데이터 확인 후 시작', score: 1 },
      { text: '경험자 조언을 먼저 구함', score: 1 },
      { text: '가능성이 보이면 일단 뛰어듦', score: 0 },
      { text: '아이디어 단계에서 흥분, 즉시 시작', score: 0 },
    ],
  },
  {
    id: 11, dim: 'SN',
    q: '이 사람이 설명할 때 어떤 방식을 사용하나요?',
    opts: [
      { text: '구체적인 예시와 사례 위주', score: 1 },
      { text: '순서대로 단계별 설명', score: 1 },
      { text: '비유와 개념으로 설명', score: 0 },
      { text: '큰 그림부터 말하고 세부는 나중에', score: 0 },
    ],
  },
  {
    id: 12, dim: 'SN',
    q: '이 사람의 관심사는 주로 어느 쪽인가요?',
    opts: [
      { text: '현실적이고 실용적인 것', score: 1 },
      { text: '지금 당장 써먹을 수 있는 정보', score: 1 },
      { text: '미래·가능성·아이디어', score: 0 },
      { text: '철학적·추상적 개념', score: 0 },
    ],
  },
  {
    id: 13, dim: 'SN',
    q: '이 사람이 뭔가에 빠지면 어떻게 되나요?',
    opts: [
      { text: '꾸준히 반복하며 전문가 수준까지', score: 1 },
      { text: '관련 정보를 꼼꼼하게 수집', score: 1 },
      { text: '금방 다른 데로 넘어감', score: 0 },
      { text: '여러 분야를 동시에 탐색', score: 0 },
    ],
  },
  {
    id: 14, dim: 'SN',
    q: '이 사람의 대화 주제는 주로?',
    opts: [
      { text: '일상·현실적인 이야기', score: 1 },
      { text: '구체적인 경험담', score: 1 },
      { text: '상상·미래·가설 이야기', score: 0 },
      { text: '"만약에~" 질문을 자주 던짐', score: 0 },
    ],
  },
  {
    id: 15, dim: 'SN',
    q: '이 사람이 계획을 세울 때는?',
    opts: [
      { text: '세부 일정까지 꼼꼼히 작성', score: 1 },
      { text: '현실 가능한 범위 안에서 계획', score: 1 },
      { text: '큰 방향만 잡고 즉흥적으로', score: 0 },
      { text: '여러 시나리오를 머릿속에 그림', score: 0 },
    ],
  },
  {
    id: 16, dim: 'SN',
    q: '이 사람의 기억 방식은?',
    opts: [
      { text: '세부 사실·날짜·이름을 잘 기억', score: 1 },
      { text: '경험한 것을 구체적으로 기억', score: 1 },
      { text: '인상·감정·분위기로 기억', score: 0 },
      { text: '전체 맥락은 기억, 세부는 흐림', score: 0 },
    ],
  },

  // ─── T / F (8 questions) ───
  {
    id: 17, dim: 'TF',
    q: '이 사람이 누군가를 위로할 때는?',
    opts: [
      { text: '현실적인 해결책을 제시', score: 1 },
      { text: '원인 분석을 해줌', score: 1 },
      { text: '말보다 곁에 있어줌', score: 0 },
      { text: '공감의 말을 먼저 건넴', score: 0 },
    ],
  },
  {
    id: 18, dim: 'TF',
    q: '이 사람이 의견 충돌 시 어떻게 행동하나요?',
    opts: [
      { text: '논리적 근거로 끝까지 주장', score: 1 },
      { text: '옳고 그름을 따지는 편', score: 1 },
      { text: '상대방 감정을 먼저 배려', score: 0 },
      { text: '분위기 해칠까봐 맞춰주는 편', score: 0 },
    ],
  },
  {
    id: 19, dim: 'TF',
    q: '이 사람이 결정을 내릴 때 어떤 기준으로 하나요?',
    opts: [
      { text: '객관적인 데이터와 논리', score: 1 },
      { text: '이득·손해를 따짐', score: 1 },
      { text: '관계에 미치는 영향 고려', score: 0 },
      { text: '내 마음이 편한 쪽으로', score: 0 },
    ],
  },
  {
    id: 20, dim: 'TF',
    q: '이 사람이 남의 이야기를 들을 때는?',
    opts: [
      { text: '해결책을 바로 제시', score: 1 },
      { text: '공감보다 분석 먼저', score: 1 },
      { text: '끝까지 잘 들어줌', score: 0 },
      { text: '공감·감정 반응이 풍부', score: 0 },
    ],
  },
  {
    id: 21, dim: 'TF',
    q: '이 사람이 비판·피드백을 받을 때는?',
    opts: [
      { text: '내용이 맞으면 바로 수용', score: 1 },
      { text: '감정보다 논리로 받아들임', score: 1 },
      { text: '상처받지만 겉으로 안 티냄', score: 0 },
      { text: '비판 자체에 감정이 많이 올라옴', score: 0 },
    ],
  },
  {
    id: 22, dim: 'TF',
    q: '이 사람이 그룹 내 불화가 생겼을 때는?',
    opts: [
      { text: '원인을 파악하고 해결책 제시', score: 1 },
      { text: '사실 관계부터 따짐', score: 1 },
      { text: '양쪽 감정을 다 들어줌', score: 0 },
      { text: '분위기 회복에 집중', score: 0 },
    ],
  },
  {
    id: 23, dim: 'TF',
    q: '이 사람이 칭찬을 받으면?',
    opts: [
      { text: '당연하거나 무덤덤하게 받아들임', score: 1 },
      { text: '칭찬보다 개선점을 물어봄', score: 1 },
      { text: '기쁘고 에너지가 올라감', score: 0 },
      { text: '쑥스러워하며 깊이 감사함', score: 0 },
    ],
  },
  {
    id: 24, dim: 'TF',
    q: '이 사람이 친구가 힘들다고 할 때 반응은?',
    opts: [
      { text: '상황 파악 후 실질적 조언', score: 1 },
      { text: '"그건 네가 이렇게 하면 되잖아"', score: 1 },
      { text: '"많이 힘들었겠다" 공감 먼저', score: 0 },
      { text: '조언 없이 그냥 들어줌', score: 0 },
    ],
  },

  // ─── J / P (8 questions) ───
  {
    id: 25, dim: 'JP',
    q: '이 사람의 계획 성향은?',
    opts: [
      { text: '철저히 미리 계획을 세움', score: 1 },
      { text: '일정표·체크리스트 즐겨 씀', score: 1 },
      { text: '즉흥적으로 결정하는 편', score: 0 },
      { text: '계획 자체를 답답해함', score: 0 },
    ],
  },
  {
    id: 26, dim: 'JP',
    q: '이 사람의 약속 시간 개념은?',
    opts: [
      { text: '항상 일찍 도착, 여유 확보', score: 1 },
      { text: '거의 제시간, 늦는 것 싫어함', score: 1 },
      { text: '5~10분 늦는 편', score: 0 },
      { text: '늘 늦고 핑계가 많음', score: 0 },
    ],
  },
  {
    id: 27, dim: 'JP',
    q: '이 사람이 뭔가를 선택해야 할 때는?',
    opts: [
      { text: '빠르게 결정하고 실행', score: 1 },
      { text: '고민 후 결정하면 번복 없음', score: 1 },
      { text: '오래 고민하고 자주 바꿈', score: 0 },
      { text: '결정을 다른 사람에게 미룸', score: 0 },
    ],
  },
  {
    id: 28, dim: 'JP',
    q: '이 사람의 방·책상·공간은?',
    opts: [
      { text: '항상 정리정돈 되어 있음', score: 1 },
      { text: '나름의 규칙이 있어 찾을 수 있음', score: 1 },
      { text: '창의적인 카오스 상태', score: 0 },
      { text: '어수선하지만 본인은 개의치 않음', score: 0 },
    ],
  },
  {
    id: 29, dim: 'JP',
    q: '이 사람이 마감·데드라인을 대하는 방식은?',
    opts: [
      { text: '미리 끝내고 여유를 두는 편', score: 1 },
      { text: '계획대로 진행해 제시간에 완료', score: 1 },
      { text: '마감 직전 몰아서 함', score: 0 },
      { text: '압박이 있어야 집중이 됨', score: 0 },
    ],
  },
  {
    id: 30, dim: 'JP',
    q: '이 사람의 여행 스타일은?',
    opts: [
      { text: '숙소·일정 미리 다 예약', score: 1 },
      { text: '가이드북 정독 후 계획 수립', score: 1 },
      { text: '대략적인 목적지만 정하고 즉흥', score: 0 },
      { text: '당일 계획, 기분 따라 이동', score: 0 },
    ],
  },
  {
    id: 31, dim: 'JP',
    q: '이 사람이 업무·과제를 처리하는 방식은?',
    opts: [
      { text: '우선순위 정해 체계적으로', score: 1 },
      { text: '한 번에 하나씩 완료 후 다음', score: 1 },
      { text: '여러 개를 동시에 왔다 갔다', score: 0 },
      { text: '흥미 있는 것부터 하다 보면 완료', score: 0 },
    ],
  },
  {
    id: 32, dim: 'JP',
    q: '이 사람이 갑작스러운 변경·취소에 대응하는 방식은?',
    opts: [
      { text: '당황하거나 불편해함', score: 1 },
      { text: '빠르게 대안 계획 수립', score: 1 },
      { text: '유연하게 적응', score: 0 },
      { text: '오히려 새로운 상황을 즐김', score: 0 },
    ],
  },
]

export function calcMbti(answers) {
  // answers: { [qId]: optionIndex (0-3) }
  const scores = { EI: [], SN: [], TF: [], JP: [] }
  QUESTIONS.forEach(q => {
    const idx = answers[q.id]
    if (idx === undefined || idx === null) return
    scores[q.dim].push(q.opts[idx].score)
  })

  function avg(arr) {
    if (!arr.length) return 0.5
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  const e = avg(scores.EI) >= 0.5 ? 'E' : 'I'
  const s = avg(scores.SN) >= 0.5 ? 'S' : 'N'
  const t = avg(scores.TF) >= 0.5 ? 'T' : 'F'
  const j = avg(scores.JP) >= 0.5 ? 'J' : 'P'

  return {
    type: `${e}${s}${t}${j}`,
    dims: {
      EI: { score: avg(scores.EI), letter: e },
      SN: { score: avg(scores.SN), letter: s },
      TF: { score: avg(scores.TF), letter: t },
      JP: { score: avg(scores.JP), letter: j },
    },
  }
}

export const MBTI_DESC = {
  ISTJ: { name: '청렴결백한 논리주의자', emoji: '📋', desc: '사실에 근거해 성실하게 살아가는 신뢰의 아이콘' },
  ISFJ: { name: '용감한 수호자', emoji: '🛡️', desc: '헌신적이고 따뜻하게 사람들을 돌보는 보호자' },
  INFJ: { name: '선의의 옹호자', emoji: '🌿', desc: '깊은 통찰력으로 세상을 더 좋게 만들려는 이상가' },
  INTJ: { name: '용의주도한 전략가', emoji: '♟️', desc: '치밀한 계획과 독립적인 사고를 가진 마스터마인드' },
  ISTP: { name: '만능 재주꾼', emoji: '🔧', desc: '논리적으로 문제를 해결하는 조용한 행동가' },
  ISFP: { name: '호기심 많은 예술가', emoji: '🎨', desc: '감각적이고 개방적인 자유로운 영혼' },
  INFP: { name: '열정적인 중재자', emoji: '🦋', desc: '이상을 추구하는 공감 능력 넘치는 몽상가' },
  INTP: { name: '논리적인 사색가', emoji: '🧩', desc: '끊임없이 지식을 탐구하는 분석의 달인' },
  ESTP: { name: '모험을 즐기는 사업가', emoji: '⚡', desc: '현실적이고 실용적인 에너지 넘치는 행동파' },
  ESFP: { name: '자유로운 연예인', emoji: '🎭', desc: '주변을 밝게 만드는 즉흥적이고 열정적인 엔터테이너' },
  ENFP: { name: '재기발랄한 활동가', emoji: '🌈', desc: '창의적이고 사람에 대한 사랑이 넘치는 영감의 원천' },
  ENTP: { name: '뜨거운 논쟁을 즐기는 변론가', emoji: '🔥', desc: '도전적인 아이디어로 경계를 밀어붙이는 혁신가' },
  ESTJ: { name: '엄격한 관리자', emoji: '📌', desc: '질서와 규칙으로 공동체를 이끄는 조직의 기둥' },
  ESFJ: { name: '사교적인 외교관', emoji: '🤝', desc: '타인의 필요를 세심하게 챙기는 따뜻한 돌봄 인싸' },
  ENFJ: { name: '정의로운 사회운동가', emoji: '🌟', desc: '카리스마로 사람들에게 영감을 주는 천생 리더' },
  ENTJ: { name: '대담한 통솔자', emoji: '👑', desc: '강한 의지로 목표를 향해 달려가는 타고난 리더' },
}
