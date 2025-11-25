// api/analyze.js
export default async (req, res) => {
  // 自动解析 JSON body（Vercel 会帮你处理）
  const { base64, mode } = req.body || {};

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  if (!base64) {
    return res.status(400).json({ error: '缺少图片数据' });
  }

  // 🔑 替换为你的真实 Google API Key！
  const API_KEY = 'AIzaSyANPBRzRSBquJgA23U5DSIk_4rCPuch--Y';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `你是一个专业营养师。请分析这张食物照片，严格按以下JSON格式返回结果，不要任何额外文字：

{
  "ingredients": [{"name":"米饭","weightG":200,"calories":260,"protein":5,"carbs":58,"fat":0.6}],
  "macros": {"protein":10,"carbs":60,"fat":5,"fiber":2,"vitaminA_pct":5,"vitaminC_pct":0,"calcium_pct":2,"iron_pct":8},
  "advice": "建议搭配蔬菜和优质蛋白。",
  "exercises": {"runningMin":25,"swimmingMin":20,"ropeSkippingMin":15}
}

饮食模式：${mode || '均衡饮食'}`
              },
              { inlineData: { mimeType: 'image/jpeg', data: base64 } }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google API Error:', errText);
      return res.status(500).json({ error: 'AI 分析失败，请稍后重试' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let result;
    try {
      // 尝试提取 JSON（兼容带 ```json 的情况）
      const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      result = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch (e) {
      console.error('JSON Parse Failed:', text);
      return res.status(500).json({ error: 'AI 返回格式错误，请重试' });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
