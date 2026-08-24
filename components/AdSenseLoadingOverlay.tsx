import React, { useEffect, useState } from 'react';

interface AdSenseLoadingOverlayProps {
  message: string;
  subMessage: string;
}

// Legacy component name retained to avoid a broad refactor.
// Critical estimate/calculation screens are intentionally ad-free.
export const AdSenseLoadingOverlay: React.FC<AdSenseLoadingOverlayProps> = ({ message, subMessage }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 98) return 98;
        return Math.min(oldProgress + Math.random() * 3, 98);
      });
    }, 400);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          <p className="font-medium text-indigo-600">{subMessage}</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner relative" aria-label="견적 처리 진행률">
          <div
            className="h-4 rounded-full transition-all duration-500 ease-out bg-indigo-600 flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-indigo-500 opacity-30 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <p>견적 계산 중...</p>
          <p>{Math.round(progress)}% 완료</p>
        </div>

        <div className="border rounded-lg p-4 mt-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-6 h-6 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-bold text-lg text-blue-700">견적을 계산하고 있습니다</span>
          </div>
          <p className="text-sm mt-1 text-blue-600">광고 시청이나 화면 유지가 완료 조건이 아닙니다.</p>
        </div>
      </div>
    </div>
  );
};
