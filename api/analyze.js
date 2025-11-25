export default async function (req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { base64, mode } = await req.json();
    if (!base64) {
      return new Response(JSON.stringify({ error: '缺少图片数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 🔑 第三步再回来替换这行！现在先保留
    const API_KEY = 'YOUR_GOOGLE_API_KEY';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
      return new Response(JSON.stringify({ error: 'AI 分析失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try {
      const jsonMatch = text.match(/```json\s*({[\s\S]*?})\s*```/);
      result = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch (e) {
      return new Response(JSON.stringify({ error: '格式错误' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
