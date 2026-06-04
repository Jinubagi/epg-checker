import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, apiKey } = req.body;
  const resolvedKey = process.env.ANTHROPIC_API_KEY || apiKey;

  if (!resolvedKey) return res.status(400).json({ error: 'API 키가 필요합니다' });
  if (!items || items.length === 0) return res.status(400).json({ error: '항목 없음' });

  const client = new Anthropic({ apiKey: resolvedKey });

  const rows = items.map((item, i) =>
    `${i + 1}. [${item.time}] 편성안:「${item.schedule}」/ EPG아이템명:「${item.epgItem}」/ EPG_PROGRAM:「${item.epgProgram}」`
  ).join('\n');

  const prompt = `홈쇼핑 방송 EPG 데이터를 검수해주세요. 각 항목에서 다음을 확인하세요:
1. EPG 아이템명과 EPG_PROGRAM이 같은 상품을 가리키는지 (다르면 오류)
2. 편성안 상품명과 EPG_PROGRAM이 같은 상품인지 (브랜드명 기준)
3. 상품명에 오타가 있는지

데이터:
${rows}

문제 있는 항목만 아래 형식으로 알려주세요. 문제 없으면 "이상 없음"이라고만 답하세요.
형식: [번호] 시간 / 문제유형 / 설명 / 수정제안`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ result: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
