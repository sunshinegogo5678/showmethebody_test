import React, { useEffect, useRef } from 'react';

// 외부 라이브러리 없이 Canvas로 직접 구현한 배경 (글자 없음, 워터마크 없음)
export const UnicornBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // 화면 크기 변경 시 캔버스 크기 재설정
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // 파티클(금빛 먼지) 설정
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = 100; // 파티클 개수

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, // 움직임 속도
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5, // 크기
        alpha: Math.random() * 0.5 + 0.1, // 투명도
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. 배경색 (진한 녹색 ~ 검정 그라데이션)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#020f0a');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. 파티클 그리기
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // 화면 밖으로 나가면 반대편에서 등장
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // 금색(#d4af37)
        ctx.fill();
      });

      // 3. 안개 효과 (살짝 어둡게)
      ctx.fillStyle = 'rgba(2, 15, 10, 0.2)'; 
      ctx.fillRect(0, 0, width, height);
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};