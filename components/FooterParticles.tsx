'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export default function FooterParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get parent footer element
    const footerElement = canvas.parentElement;
    if (!footerElement) return;

    // Create particles with brand colors
    const particles: Particle[] = [];
    const particleCount = 50;
    const colors = [
      { r: 74, g: 144, b: 226 },   // primary
      { r: 80, g: 227, b: 194 },   // secondary
      { r: 245, g: 166, b: 35 },   // accent
    ];

    // Set canvas size and initialize particles
    const resizeCanvas = () => {
      const rect = footerElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        
        // Reinitialize particles if empty
        if (particles.length === 0) {
          for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: Math.random() * 3 + 1,
              opacity: Math.random() * 0.5 + 0.3,
              color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`,
            });
          }
        }
      }
    };
    
    let animationFrameId: number;

    const animate = () => {
      if (particles.length === 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        const colorMatch = particle.color.match(/\d+/g);
        if (colorMatch && colorMatch.length >= 3) {
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size * 3
          );
          gradient.addColorStop(0, `rgba(${colorMatch[0]}, ${colorMatch[1]}, ${colorMatch[2]}, ${particle.opacity})`);
          gradient.addColorStop(1, `rgba(${colorMatch[0]}, ${colorMatch[1]}, ${colorMatch[2]}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();

          // Draw connections between nearby particles
          particles.forEach((otherParticle) => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${colorMatch[0]}, ${colorMatch[1]}, ${colorMatch[2]}, ${0.1 * (1 - distance / 120)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          });

          // Draw core particle
          ctx.beginPath();
          ctx.fillStyle = `rgba(${colorMatch[0]}, ${colorMatch[1]}, ${colorMatch[2]}, ${particle.opacity})`;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Use ResizeObserver to detect when footer is rendered
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(footerElement);
    window.addEventListener('resize', resizeCanvas);
    
    // Initial resize
    resizeCanvas();
    animate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
