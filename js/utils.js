// ============================================================
// utils.js — Shared math & canvas helpers
// ============================================================

// --- Complex Number Operations ---
const Complex = {
    create: (re, im) => ({ re, im }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    multiply: (a, b) => ({
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    }),
    exp: (theta) => ({
        re: Math.cos(theta),
        im: Math.sin(theta)
    }),
    magnitude: (c) => Math.sqrt(c.re * c.re + c.im * c.im),
    phase: (c) => Math.atan2(c.im, c.re)
};

// --- Color Utilities ---
function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// --- Canvas Drawing Helpers ---
function drawCircle(ctx, x, y, radius, strokeColor = 'rgba(255,255,255,0.2)', lineWidth = 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function drawLine(ctx, x1, y1, x2, y2, color = 'rgba(255,255,255,0.4)', lineWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function clearCanvas(ctx, canvas) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Animation Frame Manager ---
class AnimationManager {
    constructor() {
        this.animationId = null;
        this.isPlaying = false;
        this.speed = 1;
        this.time = 0;
    }

    start(callback) {
        this.isPlaying = true;
        const loop = () => {
            if (!this.isPlaying) return;
            this.time += 0.01 * this.speed;
            callback(this.time);
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.stop();
        this.time = 0;
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}

// --- Download Canvas ---
function downloadCanvas(canvas, filename = 'equation-art.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// --- Map value from one range to another ---
function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// --- Lerp ---
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// --- Clamp ---
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
