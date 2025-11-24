import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, ChevronRight, Activity, Flame, Droplets, Dumbbell, ArrowLeft, RefreshCw, Info, List } from 'lucide-react';

// 模拟组件（简化版）
const Button = ({ children, onClick, disabled, variant, fullWidth, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
      variant === 'outline'
        ? 'border border-gray-300 text-gray-700 bg-white'
        : variant === 'secondary'
        ? 'bg-gray-100 text-gray-800'
        : 'bg-sky-500 text-white hover:bg-sky-600'
    } ${fullWidth ? 'flex-1' : ''} ${className || ''}`}
  >
    {children}
  </button>
);

const HistoryBar = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;
  return (
    <div className="px-4 pt-4">
      <h3 className="text-xs font-bold text-gray-500 mb-2">历史记录</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {history.slice(0, 5).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-16 flex-shrink-0"
          >
            <img
              src={item.imageUri}
              alt="历史"
              className="w-full h-16 object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CardStack = ({ step, imageUri }) => {
  if (!imageUri || step === 0) return null;
  return (
    <div className="px-6 pb-4">
      <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <img src={imageUri} alt="预览" className="w-full h-full object-contain p-2" />
      </div>
    </div>
  );
};

// 饮食模式
const DietMode = {
  NORMAL: '均衡饮食',
  LOW_CARB: '低碳饮食',
  HIGH_PROTEIN: '高蛋白',
  VEGETARIAN: '素食'
};

// 调用后端分析
const analyzeFoodImage = async (base64, mode) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mode })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '分析失败');
  return data;
};

function App() {
  const [step, setStep] = useState(0);
  const [imageUri, setImageUri] = useState(null);
  const [dietMode, setDietMode] = useState(DietMode.NORMAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  // 加载历史
  useEffect(() => {
    const saved = localStorage.getItem('foodHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("历史加载失败", e);
      }
    }
  }, []);

  const saveToHistory = (res, uri, mode) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUri: uri,
      result: res,
      mode: mode,
    };
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('foodHistory', JSON.stringify(newHistory));
  };

  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('foodHistory', JSON.stringify(newHistory));
  };

  const handleHistorySelect = (item) => {
    setImageUri(item.imageUri);
    setResult(item.result);
    setDietMode(item.mode);
    setStep(2);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result);
        setStep(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const base64 = imageUri.split(',')[1];
      const data = await analyzeFoodImage(base64, dietMode);
      setResult(data);
      saveToHistory(data, imageUri, dietMode);
      setStep(2);
    } catch (error) {
      alert("识别失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setImageUri(null);
    setResult(null);
  };

  // 渲染步骤...
  // （此处省略 renderStep0/1/2，实际代码已在下方完整包含）
  
  const renderStep0 = () => (
    <div className="space-y-6 animate-fade-in px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">今天吃什么？</h2>
        <p className="text-gray-500 text-sm">拍摄或上传您的餐品，AI 帮您计算热量</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 hover:border-sky-400 flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          <Upload size={32} className="text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">上传相册</span>
        </div>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-sky-50 rounded-2xl shadow-sm border-2 border-sky-100 hover:border-sky-400 flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          <Camera size={32} className="text-sky-500 mb-2" />
          <span className="text-sm font-medium text-sky-700">拍摄照片</span>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in px-4 pb-20">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-800">选择您的饮食模式</h2>
        <p className="text-xs text-gray-500 mt-1">AI 将根据模式提供建议</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(DietMode).map((mode) => (
          <button
            key={mode}
            onClick={() => setDietMode(mode)}
            className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
              dietMode === mode 
                ? 'bg-sky-50 border-sky-400 text-sky-700 ring-1 ring-sky-400' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-sky-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            点击“开始识别”后，AI 将自动分析食材重量与营养成分。识别结果可能受光线影响，建议拍摄清晰的正上方视角。
          </p>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <Button variant="outline" onClick={resetFlow} disabled={loading}>重选</Button>
          <Button fullWidth onClick={startAnalysis} disabled={loading} className="relative">
            {loading ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={18} />
                分析中...
              </>
            ) : (
              <>
                开始识别 <ChevronRight size={18} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (!result) return null;
    return (
      <div className="space-y-6 animate-fade-in px-4 pb-24">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '蛋白质', val: result.macros.protein, unit: 'g', color: 'bg-blue-50 text-blue-700' },
            { label: '碳水', val: result.macros.carbs, unit: 'g', color: 'bg-green-50 text-green-700' },
            { label: '脂肪', val: result.macros.fat, unit: 'g', color: 'bg-yellow-50 text-yellow-700' },
            { label: '膳食纤维', val: result.macros.fiber, unit: 'g', color: 'bg-purple-50 text-purple-700' },
          ].map((item, i) => (
            <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-lg ${item.color}`}>
              <span className="text-lg font-bold">{item.val}</span>
              <span className="text-[10px] opacity-80">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <List size={16} className="text-sky-500"/> 食材成分识别
          </h3>
          <div className="divide-y divide-gray-100">
            {result.ingredients.map((ing, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{ing.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{ing.weightG}g</span>
                </div>
                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                    {ing.calories || 0} kcal
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">蛋 {ing.protein || 0}g</span>
                  <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">碳 {ing.carbs || 0}g</span>
                  <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">脂 {ing.fat || 0}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Activity size={16} className="text-red-500"/> 微量元素满足度
          </h3>
          <div className="space-y-3">
            {[
              { name: '维生素 A', val: result.macros.vitaminA_pct },
              { name: '维生素 C', val: result.macros.vitaminC_pct },
              { name: '钙', val: result.macros.calcium_pct },
              { name: '铁', val: result.macros.iron_pct },
            ].map((m, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16">{m.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(m.val, 100)}%` }} />
                </div>
                <span className="text-xs font-mono text-gray-700 w-8 text-right">{m.val}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-500"/> 运动消耗参考
          </h3>
          <div className="flex justify-between items-center text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Activity size={18} /></div>
              <span className="text-xs font-bold text-gray-700">{result.exercises.runningMin} 分钟</span>
              <span className="text-[10px] text-gray-400">跑步</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Droplets size={18} /></div>
              <span className="text-xs font-bold text-gray-700">{result.exercises.swimmingMin} 分钟</span>
              <span className="text-[10px] text-gray-400">游泳</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><Dumbbell size={18} /></div>
              <span className="text-xs font-bold text-gray-700">{result.exercises.ropeSkippingMin} 分钟</span>
              <span className="text-[10px] text-gray-400">跳绳</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-white p-5 rounded-2xl border border-sky-100">
          <h3 className="text-sm font-bold text-sky-800 mb-2">健康建议 ({dietMode})</h3>
          <p className="text-xs text-sky-900/70 leading-relaxed">{result.advice}</p>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
          <div className="max-w-md mx-auto flex gap-3">
            <Button variant="secondary" onClick={resetFlow} fullWidth>
              <ArrowLeft size={18} /> 完成并返回
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#f8f8f8] flex flex-col relative overflow-hidden">
      <header className="px-6 py-6 flex justify-between items-center z-10">
        <div><h1 className="text-xl font-bold tracking-tight text-gray-900">PurePlate<span className="text-red-600">.</span></h1></div>
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
          <img src="https://picsum.photos/100/100" alt="Avatar" />
        </div>
      </header>
      <div className="mb-4">
        <CardStack step={step} imageUri={imageUri} result={result} />
      </div>
      <main className="flex-1 overflow-y-auto hide-scrollbar z-10">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </main>
      {step === 0 && <HistoryBar history={history} onSelect={handleHistorySelect} onDelete={handleDeleteHistory} />}
    </div>
  );
}

export default App;
