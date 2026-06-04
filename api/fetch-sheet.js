module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL이 필요합니다' });

  // 구글시트 URL → TSV export URL 변환
  const idMatch  = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  if (!idMatch) return res.status(400).json({ error: '구글시트 URL 형식이 아닙니다' });

  const sheetId = idMatch[1];
  const gid     = gidMatch ? gidMatch[1] : '0';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=tsv&gid=${gid}`;

  try {
    const resp = await fetch(exportUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    if (!resp.ok) throw new Error(`구글시트 응답 오류: ${resp.status} — 시트가 "링크 공유" 설정인지 확인하세요`);
    const text = await resp.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
