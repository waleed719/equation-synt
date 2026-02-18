// ============================================================
// fourier.js — Discrete Fourier Transform Engine + Epicycle Renderer
// ============================================================

class FourierMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animation = new AnimationManager();
        this.coefficients = [];
        this.path = [];
        this.time = 0;
        this.numFrequencies = 50;
        this.showEpicycles = true;
        this.strokeColor = '#00f5ff';
        this.strokeWidth = 2;
        this.currentPreset = 'heart';
        this.maxTrailLength = 2000;

        // Drift: offset each revolution so the path never perfectly closes
        this.driftEnabled = false;
        this.driftAmount = 2;       // pixels of drift per revolution
        this.driftAngle = 0.05;     // angular offset per revolution (radians)
        this.revolutionCount = 0;
    }

    // --- Discrete Fourier Transform (Manual Implementation) ---
    // c_n = (1/N) * Σ f(t_k) * e^{-2πi·n·k/N}
    computeDFT(points) {
        const N = points.length;
        const coefficients = [];

        for (let n = -Math.floor(N / 2); n <= Math.floor(N / 2); n++) {
            let sum = { re: 0, im: 0 };

            for (let k = 0; k < N; k++) {
                const angle = (-2 * Math.PI * n * k) / N;
                const expTerm = Complex.exp(angle);

                // f(t_k) is a complex number: x + iy
                const fk = { re: points[k].x, im: points[k].y };
                const product = Complex.multiply(fk, expTerm);

                sum.re += product.re;
                sum.im += product.im;
            }

            sum.re /= N;
            sum.im /= N;

            coefficients.push({
                frequency: n,
                amplitude: Complex.magnitude(sum),
                phase: Complex.phase(sum),
                re: sum.re,
                im: sum.im
            });
        }

        // Sort by amplitude (largest first) for progressive reconstruction
        coefficients.sort((a, b) => b.amplitude - a.amplitude);
        return coefficients;
    }

    loadPreset(presetName) {
        this.currentPreset = presetName;
        const shape = PresetShapes[presetName];
        if (!shape) return;

        this.coefficients = this.computeDFT(shape.points);
        this.path = [];
        this.time = 0;
        this.numFrequencies = Math.min(50, this.coefficients.length);
        this.render();
    }

    loadCustomPoints(points) {
        this.coefficients = this.computeDFT(points);
        this.path = [];
        this.time = 0;
        this.numFrequencies = Math.min(50, this.coefficients.length);
    }

    // --- Epicycle computation at time t ---
    computeEpicyclePosition(t, numFreqs) {
        let x = 0, y = 0;
        const epicycles = [];
        const N = Math.min(numFreqs, this.coefficients.length);

        for (let i = 0; i < N; i++) {
            const c = this.coefficients[i];
            const prevX = x, prevY = y;
            const angle = c.frequency * t + c.phase;

            x += c.amplitude * Math.cos(angle);
            y += c.amplitude * Math.sin(angle);

            epicycles.push({
                cx: prevX,
                cy: prevY,
                radius: c.amplitude,
                ex: x,
                ey: y
            });
        }

        // Apply drift offset — shifts position slightly each revolution
        if (this.driftEnabled && this.revolutionCount > 0) {
            const driftX = this.driftAmount * this.revolutionCount * Math.cos(this.driftAngle * this.revolutionCount);
            const driftY = this.driftAmount * this.revolutionCount * Math.sin(this.driftAngle * this.revolutionCount);
            x += driftX;
            y += driftY;
        }

        return { x, y, epicycles };
    }

    // --- Render a single frame ---
    renderFrame(t) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Clear with semi-transparent overlay for fade trail effect
        ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
        ctx.fillRect(0, 0, W, H);

        const centerX = W / 2;
        const centerY = H / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        const result = this.computeEpicyclePosition(t, this.numFrequencies);

        // Draw epicycles
        if (this.showEpicycles) {
            for (const epi of result.epicycles) {
                if (epi.radius < 0.5) continue;

                // Circle
                ctx.beginPath();
                ctx.arc(epi.cx, epi.cy, epi.radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Radius line
                ctx.beginPath();
                ctx.moveTo(epi.cx, epi.cy);
                ctx.lineTo(epi.ex, epi.ey);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Draw dot at tip
            ctx.beginPath();
            ctx.arc(result.x, result.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }

        // Add point to path
        this.path.push({ x: result.x, y: result.y });
        if (this.path.length > this.maxTrailLength) {
            this.path.shift();
        }

        // Draw traced path
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);

            for (let i = 1; i < this.path.length; i++) {
                const alpha = i / this.path.length;
                ctx.strokeStyle = this.strokeColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = this.strokeWidth * alpha;
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;
            ctx.stroke();
        }

        ctx.restore();
    }

    render() {
        clearCanvas(this.ctx, this.canvas);
        if (this.coefficients.length > 0) {
            this.renderFrame(this.time);
        }
    }

    startAnimation() {
        this.path = [];
        this.time = 0;
        this.revolutionCount = 0;
        this._lastRevolution = 0;

        // Full clear before starting
        clearCanvas(this.ctx, this.canvas);

        // When drift is on, keep a much longer trail to see the layered pattern
        const effectiveMaxTrail = this.driftEnabled ? this.maxTrailLength * 5 : this.maxTrailLength;

        this.animation.reset();
        this.animation.start((t) => {
            // Track full revolutions for drift
            const rawAngle = t * 2 * Math.PI;
            const currentRevolution = Math.floor(rawAngle / (Math.PI * 2));
            if (currentRevolution > this._lastRevolution) {
                this._lastRevolution = currentRevolution;
                this.revolutionCount = currentRevolution;
            }

            // One full revolution = 2π
            this.time = rawAngle % (Math.PI * 2);
            this.renderFrame(this.time);

            // Manage trail length
            if (this.path.length > effectiveMaxTrail * 0.9) {
                this.path = this.path.slice(-Math.floor(effectiveMaxTrail * 0.6));
            }
        });
    }

    stop() {
        this.animation.stop();
    }

    reset() {
        this.animation.reset();
        this.path = [];
        this.time = 0;
        clearCanvas(this.ctx, this.canvas);
        this.render();
    }

    setNumFrequencies(n) {
        this.numFrequencies = n;
    }

    setSpeed(speed) {
        this.animation.setSpeed(speed);
    }

    setStrokeColor(color) {
        this.strokeColor = color;
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
    }

    setShowEpicycles(show) {
        this.showEpicycles = show;
    }

    setDriftEnabled(enabled) {
        this.driftEnabled = enabled;
    }

    setDriftAmount(amount) {
        this.driftAmount = amount;
    }

    setDriftAngle(angle) {
        this.driftAngle = angle;
    }

    // --- SVG Import ---
    parseSVGPath(svgContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const paths = doc.querySelectorAll('path');
        const allPoints = [];

        for (const path of paths) {
            const totalLength = path.getTotalLength ? path.getTotalLength() : 1000;
            const numSamples = 200;
            for (let i = 0; i < numSamples; i++) {
                const t = (i / numSamples) * totalLength;
                try {
                    const pt = path.getPointAtLength(t);
                    allPoints.push({ x: pt.x, y: pt.y });
                } catch (e) {
                    // Skip if getPointAtLength not available
                }
            }
        }

        if (allPoints.length > 0) {
            // Center the points
            const cx = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
            const cy = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;

            // Scale to fit
            let maxR = 0;
            for (const p of allPoints) {
                p.x -= cx;
                p.y -= cy;
                maxR = Math.max(maxR, Math.sqrt(p.x * p.x + p.y * p.y));
            }
            const scale = 120 / maxR;
            for (const p of allPoints) {
                p.x *= scale;
                p.y *= scale;
            }
        }

        return allPoints;
    }

    destroy() {
        this.stop();
        this.coefficients = [];
        this.path = [];
    }
}
