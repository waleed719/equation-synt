// ============================================================
// parametric.js — Parametric Curve Renderer with Abstract Art Presets
// ============================================================

class ParametricMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animation = new AnimationManager();
        this.currentPreset = 'heart';
        this.params = {};
        this.drawProgress = 0;
        this.isAnimating = false;
        this.strokeColor = '#ff6bff';
        this.strokeWidth = 2;
        this.tRange = [0, 2 * Math.PI];
        this.resolution = 2000;
        this.trailPoints = [];
    }

    // All preset equations
    static PRESETS = {
        // --- Classic Mathematical Curves ---
        heart: {
            name: '❤️ Heart',
            category: 'Classic',
            x: (t, p) => p.scale * 16 * Math.pow(Math.sin(t), 3),
            y: (t, p) => -p.scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
            defaultParams: { scale: 7 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'scale', label: 'Scale', min: 1, max: 15, step: 0.5 }
            ]
        },

        butterfly: {
            name: '🦋 Butterfly Curve',
            category: 'Classic',
            x: (t, p) => p.scale * Math.sin(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)),
            y: (t, p) => -p.scale * Math.cos(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)),
            defaultParams: { scale: 40 },
            tRange: [0, 12 * Math.PI],
            sliders: [
                { key: 'scale', label: 'Scale', min: 10, max: 80, step: 1 }
            ]
        },

        rose: {
            name: '🌹 Rose Curve',
            category: 'Classic',
            x: (t, p) => p.scale * Math.cos(p.k * t) * Math.cos(t),
            y: (t, p) => p.scale * Math.cos(p.k * t) * Math.sin(t),
            defaultParams: { scale: 100, k: 5 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'k', label: 'Petals (k)', min: 1, max: 12, step: 0.5 },
                { key: 'scale', label: 'Scale', min: 20, max: 150, step: 5 }
            ]
        },

        lissajous: {
            name: '〰️ Lissajous Figure',
            category: 'Classic',
            x: (t, p) => p.A * Math.sin(p.a * t + p.delta),
            y: (t, p) => p.B * Math.sin(p.b * t),
            defaultParams: { A: 120, B: 120, a: 3, b: 4, delta: Math.PI / 4 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'a', label: 'Freq X (a)', min: 1, max: 10, step: 1 },
                { key: 'b', label: 'Freq Y (b)', min: 1, max: 10, step: 1 },
                { key: 'delta', label: 'Phase (δ)', min: 0, max: 6.28, step: 0.1 },
                { key: 'A', label: 'Amp X', min: 20, max: 200, step: 5 },
                { key: 'B', label: 'Amp Y', min: 20, max: 200, step: 5 }
            ]
        },

        spirograph: {
            name: '🎡 Spirograph',
            category: 'Classic',
            x: (t, p) => (p.R - p.r) * Math.cos(t) + p.d * Math.cos((p.R - p.r) * t / p.r),
            y: (t, p) => (p.R - p.r) * Math.sin(t) - p.d * Math.sin((p.R - p.r) * t / p.r),
            defaultParams: { R: 100, r: 40, d: 60 },
            tRange: [0, 20 * Math.PI],
            sliders: [
                { key: 'R', label: 'Outer Radius (R)', min: 20, max: 150, step: 5 },
                { key: 'r', label: 'Inner Radius (r)', min: 5, max: 80, step: 1 },
                { key: 'd', label: 'Pen Distance (d)', min: 5, max: 120, step: 5 }
            ]
        },

        // --- Abstract Art Presets ---
        harmonicWeave: {
            name: '🌀 Harmonic Weave',
            category: 'Abstract',
            x: (t, p) => p.scale * (Math.sin(p.a * t) + 0.5 * Math.sin(p.c * t)),
            y: (t, p) => p.scale * (Math.cos(p.b * t) + 0.5 * Math.cos(p.d * t)),
            defaultParams: { scale: 100, a: 3, b: 2, c: 7, d: 5 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'a', label: 'Freq A', min: 1, max: 15, step: 1 },
                { key: 'b', label: 'Freq B', min: 1, max: 15, step: 1 },
                { key: 'c', label: 'Freq C', min: 1, max: 20, step: 1 },
                { key: 'd', label: 'Freq D', min: 1, max: 20, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 150, step: 5 }
            ]
        },

        chaosFlower: {
            name: '🌸 Chaos Flower',
            category: 'Abstract',
            x: (t, p) => p.scale * Math.cos(t) * (1 + p.amp * Math.cos(p.petals * t) * Math.sin(p.twist * t)),
            y: (t, p) => p.scale * Math.sin(t) * (1 + p.amp * Math.cos(p.petals * t) * Math.sin(p.twist * t)),
            defaultParams: { scale: 90, petals: 7, amp: 0.8, twist: 3 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'petals', label: 'Petals', min: 2, max: 20, step: 1 },
                { key: 'amp', label: 'Amplitude', min: 0.1, max: 2, step: 0.1 },
                { key: 'twist', label: 'Twist', min: 1, max: 10, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 150, step: 5 }
            ]
        },

        sacredGeometry: {
            name: '✡️ Sacred Geometry',
            category: 'Abstract',
            x: (t, p) => p.scale * (Math.sin(p.n * t) * Math.cos(t) + Math.sin(p.m * t) * 0.5),
            y: (t, p) => p.scale * (Math.sin(p.n * t) * Math.sin(t) + Math.cos(p.m * t) * 0.5),
            defaultParams: { scale: 100, n: 6, m: 4 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'n', label: 'Symmetry N', min: 2, max: 16, step: 1 },
                { key: 'm', label: 'Pattern M', min: 1, max: 12, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 150, step: 5 }
            ]
        },

        quantumRing: {
            name: '⚛️ Quantum Ring',
            category: 'Abstract',
            x: (t, p) => p.scale * (Math.cos(t) + p.e * Math.cos(p.f1 * t) + (p.e / 2) * Math.cos(p.f2 * t)),
            y: (t, p) => p.scale * (Math.sin(t) + p.e * Math.sin(p.f1 * t) + (p.e / 2) * Math.sin(p.f2 * t)),
            defaultParams: { scale: 60, e: 0.5, f1: 7, f2: 17 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'e', label: 'Eccentricity', min: 0.1, max: 1.5, step: 0.05 },
                { key: 'f1', label: 'Frequency 1', min: 2, max: 20, step: 1 },
                { key: 'f2', label: 'Frequency 2', min: 5, max: 30, step: 1 },
                { key: 'scale', label: 'Scale', min: 20, max: 120, step: 5 }
            ]
        },

        galaxySpiral: {
            name: '🌌 Galaxy Spiral',
            category: 'Abstract',
            x: (t, p) => (p.a + p.b * t) * Math.cos(t) * Math.cos(p.warp * Math.sin(t * 0.3)),
            y: (t, p) => (p.a + p.b * t) * Math.sin(t) * Math.cos(p.warp * Math.sin(t * 0.3)),
            defaultParams: { a: 5, b: 4, warp: 0.3 },
            tRange: [0, 10 * Math.PI],
            sliders: [
                { key: 'a', label: 'Core Size', min: 1, max: 20, step: 1 },
                { key: 'b', label: 'Arm Spread', min: 1, max: 10, step: 0.5 },
                { key: 'warp', label: 'Warp', min: 0, max: 2, step: 0.1 }
            ]
        },

        waveInterference: {
            name: '🌊 Wave Interference',
            category: 'Abstract',
            x: (t, p) => p.scale * (Math.sin(p.a * t) * Math.cos(p.b * t)),
            y: (t, p) => p.scale * (Math.sin(p.c * t) * Math.cos(p.d * t)),
            defaultParams: { scale: 120, a: 1, b: 2, c: 3, d: 1 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'a', label: 'Wave A', min: 1, max: 10, step: 1 },
                { key: 'b', label: 'Wave B', min: 1, max: 10, step: 1 },
                { key: 'c', label: 'Wave C', min: 1, max: 10, step: 1 },
                { key: 'd', label: 'Wave D', min: 1, max: 10, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 200, step: 5 }
            ]
        },

        mandala: {
            name: '🕉️ Mandala',
            category: 'Abstract',
            x: (t, p) => p.scale * Math.cos(t) * (1 + 0.5 * Math.cos(p.layers * t) + 0.25 * Math.cos(p.layers * 2 * t) + 0.125 * Math.cos(p.layers * 3 * t)),
            y: (t, p) => p.scale * Math.sin(t) * (1 + 0.5 * Math.cos(p.layers * t) + 0.25 * Math.cos(p.layers * 2 * t) + 0.125 * Math.cos(p.layers * 3 * t)),
            defaultParams: { scale: 80, layers: 8 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'layers', label: 'Layer Count', min: 3, max: 20, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 150, step: 5 }
            ]
        },

        stringArt: {
            name: '🧵 String Art',
            category: 'Abstract',
            x: (t, p) => p.scale * Math.cos(t) * Math.sin(p.n * t),
            y: (t, p) => p.scale * Math.sin(t) * Math.sin(p.n * t),
            defaultParams: { scale: 120, n: 5 },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'n', label: 'String Count', min: 2, max: 20, step: 1 },
                { key: 'scale', label: 'Scale', min: 30, max: 180, step: 5 }
            ]
        },

        // --- Custom User Equation ---
        custom: {
            name: '✏️ Custom Equation',
            category: 'Custom',
            x: (t, p) => {
                try { return p._xFn(t, p); } catch { return 0; }
            },
            y: (t, p) => {
                try { return p._yFn(t, p); } catch { return 0; }
            },
            defaultParams: {
                scale: 100, a: 1, b: 1, c: 1, d: 1,
                _xExpr: 'scale * Math.sin(a * t)',
                _yExpr: 'scale * Math.cos(b * t)',
                _xFn: (t, p) => p.scale * Math.sin(p.a * t),
                _yFn: (t, p) => p.scale * Math.cos(p.b * t)
            },
            tRange: [0, 2 * Math.PI],
            sliders: [
                { key: 'scale', label: 'Scale', min: 10, max: 200, step: 5 },
                { key: 'a', label: 'Param a', min: 0.1, max: 20, step: 0.1 },
                { key: 'b', label: 'Param b', min: 0.1, max: 20, step: 0.1 },
                { key: 'c', label: 'Param c', min: 0.1, max: 20, step: 0.1 },
                { key: 'd', label: 'Param d', min: 0.1, max: 20, step: 0.1 }
            ]
        }
    };

    loadPreset(presetName) {
        this.currentPreset = presetName;
        const preset = ParametricMode.PRESETS[presetName];
        if (!preset) return;

        this.params = { ...preset.defaultParams };
        this.tRange = [...preset.tRange];
        this.drawProgress = 0;
        this.trailPoints = [];
        this.drawInstant();
    }

    // Set custom x(t) equation string
    setCustomX(exprStr) {
        try {
            // Build function: t, scale, a, b, c, d are available
            const fn = new Function('t', 'p',
                `with(Math) { const {scale,a,b,c,d} = p; return ${exprStr}; }`
            );
            // Test it
            fn(0, this.params);
            this.params._xExpr = exprStr;
            this.params._xFn = fn;
            this.drawInstant();
            return true;
        } catch (e) {
            return false;
        }
    }

    // Set custom y(t) equation string
    setCustomY(exprStr) {
        try {
            const fn = new Function('t', 'p',
                `with(Math) { const {scale,a,b,c,d} = p; return ${exprStr}; }`
            );
            fn(0, this.params);
            this.params._yExpr = exprStr;
            this.params._yFn = fn;
            this.drawInstant();
            return true;
        } catch (e) {
            return false;
        }
    }

    // Set t-range
    setTRange(min, max) {
        this.tRange = [min, max];
        this.drawInstant();
    }

    // Set resolution
    setResolution(n) {
        this.resolution = n;
        this.drawInstant();
    }

    updateParam(key, value) {
        this.params[key] = parseFloat(value);
        this.drawInstant();
    }

    // Draw all at once
    drawInstant() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        clearCanvas(ctx, this.canvas);

        const preset = ParametricMode.PRESETS[this.currentPreset];
        if (!preset) return;

        const centerX = W / 2;
        const centerY = H / 2;
        const [tMin, tMax] = this.tRange;
        const steps = this.resolution;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw with gradient color
        for (let i = 0; i < steps - 1; i++) {
            const t1 = tMin + (i / steps) * (tMax - tMin);
            const t2 = tMin + ((i + 1) / steps) * (tMax - tMin);

            const x1 = preset.x(t1, this.params);
            const y1 = preset.y(t1, this.params);
            const x2 = preset.x(t2, this.params);
            const y2 = preset.y(t2, this.params);

            const hue = (i / steps) * 360;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsl(${hue}, 85%, 60%)`;
            ctx.lineWidth = this.strokeWidth;
            ctx.stroke();
        }

        ctx.restore();

        // Draw equation text
        this.drawEquationLabel(preset);
    }

    drawEquationLabel(preset) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText(`Preset: ${preset.name}`, 20, this.canvas.height - 20);
    }

    // Animated progressive drawing
    startAnimation() {
        this.trailPoints = [];
        this.drawProgress = 0;

        const preset = ParametricMode.PRESETS[this.currentPreset];
        if (!preset) return;

        clearCanvas(this.ctx, this.canvas);

        this.animation.reset();
        this.animation.start((t) => {
            this.drawProgress = (t * 0.5) % 1; // Complete in ~2 seconds at speed 1

            const ctx = this.ctx;
            const W = this.canvas.width;
            const H = this.canvas.height;

            ctx.fillStyle = 'rgba(10, 10, 26, 0.05)';
            ctx.fillRect(0, 0, W, H);

            const centerX = W / 2;
            const centerY = H / 2;
            const [tMin, tMax] = this.tRange;
            const currentT = tMin + this.drawProgress * (tMax - tMin);

            const x = preset.x(currentT, this.params);
            const y = preset.y(currentT, this.params);

            this.trailPoints.push({ x: centerX + x, y: centerY + y, t: currentT });
            if (this.trailPoints.length > 5000) this.trailPoints.shift();

            // Draw trail
            if (this.trailPoints.length > 1) {
                for (let i = 1; i < this.trailPoints.length; i++) {
                    const alpha = i / this.trailPoints.length;
                    const hue = ((this.trailPoints[i].t - tMin) / (tMax - tMin)) * 360;
                    ctx.beginPath();
                    ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                    ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                    ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
                    ctx.lineWidth = this.strokeWidth;
                    ctx.stroke();
                }
            }

            // Current point glow
            ctx.beginPath();
            ctx.arc(centerX + x, centerY + y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = this.strokeColor;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    stop() {
        this.animation.stop();
    }

    reset() {
        this.animation.reset();
        this.trailPoints = [];
        this.drawProgress = 0;
        clearCanvas(this.ctx, this.canvas);
        this.drawInstant();
    }

    setSpeed(speed) {
        this.animation.setSpeed(speed);
    }

    setStrokeColor(color) {
        this.strokeColor = color;
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
        if (!this.animation.isPlaying) {
            this.drawInstant();
        }
    }

    destroy() {
        this.stop();
        this.trailPoints = [];
    }
}
