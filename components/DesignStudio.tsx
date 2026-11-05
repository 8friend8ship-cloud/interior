
import React, { useState } from 'react';
import { ProjectDetails } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface DesignStudioProps {
  projectDetails: ProjectDetails;
  isometricView: { data: string; mimeType: string; };
  perspectiveView: { data: string; mimeType: string; };
  onModifyStyle: (viewToModify: 'iso' | 'pers', prompt: string) => void;
  onFinalize: () => void;
  isModifying: boolean;
  onBack: () => void;
  error: string | null;
}

type ActiveView = 'iso' | 'pers';

export const DesignStudio: React.FC<DesignStudioProps> = ({
  projectDetails,
  isometricView,
  perspectiveView,
  onModifyStyle,
  onFinalize,
  isModifying,
  onBack,
  error
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('iso');
  const [stylePrompt, setStylePrompt] = useState('');
  const [styleNoteSaved, setStyleNoteSaved] = useState(false);

  const currentView = activeView === 'iso' ? isometricView : perspectiveView;
  const viewName = activeView === 'iso' ? '아이소 뷰' : '투시도';

  const handleModifyClick = () => {
    if (!stylePrompt.trim()) {
      alert("스타일 수정 요청사항을 입력해주세요.");
      return;
    }
    onModifyStyle(activeView, stylePrompt);
    setStyleNoteSaved(true);
    setStylePrompt('');
  };

  const ViewTabButton: React.FC<{ viewType: ActiveView; label: string; }> = ({ viewType, label }) => (
      <button
          onClick={() => setActiveView(viewType)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none ${
              activeView === viewType
                  ? 'bg-white border-b-0 border-gray-200 text-indigo-600'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-b border-gray-200'
          }`}
      >
          {label}
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">AI 디자인 스튜디오</h2>
      <p className="text-center text-gray-500 mb-8">현재 시안을 확인하고 변경 희망사항을 견적 요청에 남기거나 디자인을 확정하세요.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
          <div className="flex border-b">
              <ViewTabButton viewType="iso" label="아이소메트릭 뷰" />
              <ViewTabButton viewType="pers" label="실내 투시도" />
          </div>
          <div className="relative bg-gray-50 p-4 rounded-b-lg border border-t-0">
            {isModifying && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col justify-center items-center rounded-lg z-10">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-700 font-semibold">{viewName} 스타일을 변경하고 있습니다...</p>
                </div>
            )}
            <img 
              src={`data:${currentView.mimeType};base64,${currentView.data}`} 
              alt={`AI가 생성한 ${viewName}`} 
              className="rounded-lg w-full select-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col h-full space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. 디자인 변경 희망사항 기록</h3>
                <p className="text-sm text-gray-500 mb-3">현재 <span className="font-bold text-indigo-600">{viewName}</span>의 마감재·색상·조명 변경 희망사항을 견적 메모에 저장합니다. 이 단계에서 이미지는 자동으로 바뀌지 않습니다.</p>
                <textarea
                    value={stylePrompt}
                    onChange={(e) => { setStylePrompt(e.target.value); setStyleNoteSaved(false); }}
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`예: 바닥을 밝은 원목으로, 벽을 흰색으로 바꿔줘`}
                />
                <button
                    onClick={handleModifyClick}
                    disabled={isModifying}
                    className="mt-3 w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out disabled:bg-gray-400"
                >
                  {isModifying ? '요청사항 저장 중...' : '견적 요청사항에 메모 추가'}
                </button>
                {styleNoteSaved && <p role="status" className="text-xs text-green-700 mt-2">변경 희망사항을 견적 요청에 추가했습니다. 시안 이미지는 그대로 유지됩니다.</p>}
            </div>
             {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
             <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. 구조 수정 (도면 변경)</h3>
                <p className="text-sm text-gray-500">벽 이동, 문/창 변경, 가구 배치 등 구조 변경은 '처음으로 돌아가기' 후 새로운 도면으로 시작해야 합니다.</p>
            </div>
            <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. 최종 견적 생성</h3>
                <p className="text-sm text-gray-500 mb-4">현재 디자인이 만족스러우시면 아래 버튼을 눌러 최종 견적서와 공정표를 생성하세요.</p>
                <button 
                    type="button" 
                    onClick={onFinalize}
                    disabled={isModifying}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out disabled:bg-indigo-400"
                >
                    이 디자인으로 견적 생성하기
                </button>
                 <button 
                    type="button" 
                    onClick={onBack}
                    disabled={isModifying}
                    className="mt-3 w-full text-sm text-gray-600 hover:text-gray-800"
                >
                    처음으로 돌아가기
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
