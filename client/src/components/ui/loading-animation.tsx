import { useState, useEffect } from 'react';
import { Brain, Code, Sparkles, Zap, Cpu, Rocket } from 'lucide-react';

interface LoadingAnimationProps {
  stage: string;
  isVisible: boolean;
}

export default function LoadingAnimation({ stage, isVisible }: LoadingAnimationProps) {
  const [currentDot, setCurrentDot] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);

  const icons = [Brain, Code, Sparkles, Zap, Cpu, Rocket];
  const IconComponent = icons[currentIcon];

  useEffect(() => {
    if (!isVisible) return;

    const dotInterval = setInterval(() => {
      setCurrentDot(prev => (prev + 1) % 4);
    }, 500);

    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 1200);

    return () => {
      clearInterval(dotInterval);
      clearInterval(iconInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 my-3">
      <div className="flex items-center space-x-3">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <IconComponent className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        </div>

        {/* Loading Text */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            {stage}
            <span className="inline-flex ml-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1 h-1 bg-blue-500 rounded-full mx-0.5 transition-opacity duration-300 ${
                    i <= currentDot ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse transform transition-transform duration-1000">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Code Generation Visual */}
      <div className="mt-3 flex space-x-1 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-sm animate-bounce"
            style={{
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
}