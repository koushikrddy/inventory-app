import React, { useEffect, useRef } from 'react';

const InventoryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    // Floating boxes (inventory theme)
    const boxes: { x: number; y: number; size: number; rotation: number; speed: number; opacity: number; color: string }[] = [];
    for (let i = 0; i < 12; i++) {
      boxes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 15 + Math.random() * 35,
        rotation: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0.08 + Math.random() * 0.1,
        color: ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4'][Math.floor(Math.random() * 4)],
      });
    }

    // Bar chart columns (inventory analytics theme)
    const bars: { x: number; width: number; targetHeight: number; currentHeight: number; color: string }[] = [];
    const barCount = 8;
    const barSpacing = w / (barCount + 1);
    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: barSpacing * (i + 1),
        width: 12 + Math.random() * 10,
        targetHeight: 30 + Math.random() * 80,
        currentHeight: 0,
        color: ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i],
      });
    }

    // Gradient orbs
    const orbs = [
      { x: w * 0.15, y: h * 0.25, r: 250, color: [99, 102, 241], phase: 0 },
      { x: w * 0.85, y: h * 0.75, r: 300, color: [168, 85, 247], phase: 2 },
      { x: w * 0.5, y: h * 0.15, r: 200, color: [6, 182, 212], phase: 4 },
      { x: w * 0.3, y: h * 0.85, r: 220, color: [139, 92, 246], phase: 1 },
    ];

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.4 + 0.05,
      });
    }

    const animate = () => {
      time += 0.004;
      ctx.clearRect(0, 0, w, h);

      // Base gradient - dark theme
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#0c0c1d');
      bg.addColorStop(0.3, '#111128');
      bg.addColorStop(0.6, '#0d0d22');
      bg.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw gradient orbs
      orbs.forEach(orb => {
        const ox = orb.x + Math.sin(time + orb.phase) * 30;
        const oy = orb.y + Math.cos(time + orb.phase) * 20;
        const pulse = 1 + Math.sin(time * 1.5 + orb.phase) * 0.1;
        const [r, g, b] = orb.color;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * pulse);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
        grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.06)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw floating boxes (inventory packages)
      boxes.forEach(box => {
        box.y -= box.speed;
        box.rotation += 0.003;
        if (box.y < -box.size * 2) {
          box.y = h + box.size * 2;
          box.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(box.x, box.y);
        ctx.rotate(box.rotation);
        ctx.globalAlpha = box.opacity;
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 1.5;

        // Draw 3D box outline
        const s = box.size;
        // Front face
        ctx.beginPath();
        ctx.rect(-s / 2, -s / 2, s, s);
        ctx.stroke();
        // Top face (3D perspective)
        ctx.beginPath();
        ctx.moveTo(-s / 2, -s / 2);
        ctx.lineTo(-s / 2 + s * 0.3, -s / 2 - s * 0.3);
        ctx.lineTo(s / 2 + s * 0.3, -s / 2 - s * 0.3);
        ctx.lineTo(s / 2, -s / 2);
        ctx.stroke();
        // Side face
        ctx.beginPath();
        ctx.moveTo(s / 2, -s / 2);
        ctx.lineTo(s / 2 + s * 0.3, -s / 2 - s * 0.3);
        ctx.stroke();

        ctx.restore();
      });

      // Draw animated bar chart at bottom
      ctx.globalAlpha = 0.08;
      bars.forEach((bar, i) => {
        bar.currentHeight += (bar.targetHeight + Math.sin(time * 2 + i * 0.8) * 15 - bar.currentHeight) * 0.03;
        const barH = bar.currentHeight;
        const x = bar.x - bar.width / 2;
        const y = h - 20;

        ctx.fillStyle = bar.color;
        ctx.beginPath();
        ctx.roundRect(x, y - barH, bar.width, barH, 3);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const flicker = 0.6 + Math.sin(time * 2.5 + p.x * 0.005) * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 160, 255, ${(p.o + 0.2) * flicker})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(150, 160, 255, ${(1 - dist / 100) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default InventoryBackground;
