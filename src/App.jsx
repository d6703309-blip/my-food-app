import React, { useState } from 'react';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dietMode, setDietMode] = useState('均衡饮食');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('请先上传图片');
      return;
    }

    // ✅ 关键：去掉 data:image/...;base64, 前缀
    const base64Data = image.split(',')[1];

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64Data, mode: dietMode })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      // ✅ 显示具体错误，不再只说“识别失败”
      setError('识别失败：' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>PurePlate - 健康饮食助手</h1>

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          饮食模式：
          <select value={dietMode} onChange={(e) => setDietMode(e.target.value)} style={{ marginLeft: '8px' }}>
            <option>均衡饮食</option>
            <option>减脂</option>
            <option>增肌</option>
            <option>控糖</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="fileInput"
        />
        <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'inline-block' }}>
          {image ? (
            <img src={image} alt="预览" style={{ width: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} />
          ) : (
            <div style={{ border: '2px dashed #ccc', padding: '40px', borderRadius: '8px' }}>
              <Upload size={32} style={{ margin: '0 auto', display: 'block', color: '#666' }} />
              <p>点击上传食物照片</p>
            </div>
          )}
        </label>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!image || loading}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '20px',
          backgroundColor: !image || loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: !image || loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</> : '开始识别'}
      </button>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '16px' }}>
          <h3>分析结果</h3>
          <p><strong>建议：</strong> {result.advice}</p>
          <p><strong>运动建议：</strong> 跑步 {result.exercises?.runningMin || 0} 分钟</p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
