import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
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

    // Glowing orbs
    const orbs = [
      { x: w * 0.2, y: h * 0.3, r: 300, color: [99, 102, 241], vx: 0.15, vy: 0.1, phase: 0 },
      { x: w * 0.8, y: h * 0.7, r: 350, color: [168, 85, 247], vx: -0.12, vy: 0.08, phase: 2 },
      { x: w * 0.5, y: h * 0.2, r: 250, color: [236, 72, 153], vx: 0.08, vy: -0.12, phase: 4 },
      { x: w * 0.3, y: h * 0.8, r: 280, color: [59, 130, 246], vx: -0.1, vy: -0.08, phase: 1 },
      { x: w * 0.7, y: h * 0.4, r: 200, color: [139, 92, 246], vx: 0.12, vy: 0.15, phase: 3 },
    ];

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.4,
        o: Math.random() * 0.6 + 0.1,
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.005;
      ctx.clearRect(0, 0, w, h);

      // Dark base
      ctx.fillStyle = '#080818';
      ctx.fillRect(0, 0, w, h);

      // Draw aurora orbs
      orbs.forEach(orb => {
        orb.x += Math.sin(time + orb.phase) * orb.vx * 2;
        orb.y += Math.cos(time + orb.phase) * orb.vy * 2;

        // Wrap around
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;

        const pulse = 1 + Math.sin(time * 2 + orb.phase) * 0.15;
        const [r, g, b] = orb.color;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * pulse);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.18)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.06)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const flicker = 0.5 + Math.sin(time * 3 + p.x * 0.01) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 190, 255, ${p.o * flicker})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(150, 160, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Top gradient overlay
      const topGrad = ctx.createLinearGradient(0, 0, 0, h);
      topGrad.addColorStop(0, 'rgba(8, 8, 24, 0.3)');
      topGrad.addColorStop(0.5, 'transparent');
      topGrad.addColorStop(1, 'rgba(8, 8, 24, 0.4)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, h);

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
      className="fixed inset-0"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleBackground;
