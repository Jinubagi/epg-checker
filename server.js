const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');

// .env 파일 로드 (있으면)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) process.env[k.trim()] = v.trim();
  });
}

const ENV_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 프론트엔드에서 API 키 설정 여부 확인
app.get('/api/config', (req, res) => {
  res.json({ hasApiKey: !!ENV_API_KEY });
});

app.post('/api/check-ai', async (req, res) => {
  const { items, apiKey } = req.body;

  const resolvedKey = ENV_API_KEY || apiKey;
  if (!resolvedKey) return res.status(400).json({ error: 'API 키가 필요합니다' });
  if (!items || items.length === 0) return res.status(400).json({ error: '검수할 항목이 없습니다' });

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
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n====================================');
  console.log('  EPG 검수 앱이 실행되었습니다!');
  console.log(`  내 PC: http://localhost:${PORT}`);
  // 팀원 접속용 IP 출력
  const nets = require('os').networkInterfaces();
  for (const n of Object.values(nets).flat()) {
    if (n.family === 'IPv4' && !n.internal)
      console.log(`  팀원 접속: http://${n.address}:${PORT}`);
  }
  console.log('====================================\n');
});
