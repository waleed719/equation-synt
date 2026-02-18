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

    // --- Freehand Drawing Mode ---
    enableFreehandDraw() {
        this.freehandPoints = [];
        this.isDrawing = false;
        this.stop();
        clearCanvas(this.ctx, this.canvas);

        // Draw instruction text
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✏️ Draw a shape on the canvas', this.canvas.width / 2, this.canvas.height / 2 - 15);
        ctx.font = '13px "Inter", sans-serif';
        ctx.fillText('Release mouse to apply Fourier Transform', this.canvas.width / 2, this.canvas.height / 2 + 15);
        ctx.textAlign = 'left';

        // Mouse event handlers
        this._onMouseDown = (e) => {
            this.isDrawing = true;
            this.freehandPoints = [];
            clearCanvas(this.ctx, this.canvas);
        };

        this._onMouseMove = (e) => {
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.canvas.width / 2;
            const y = e.clientY - rect.top - this.canvas.height / 2;
            this.freehandPoints.push({ x, y });

            // Draw live preview
            if (this.freehandPoints.length > 1) {
                const ctx = this.ctx;
                const pts = this.freehandPoints;
                ctx.beginPath();
                ctx.moveTo(pts[pts.length - 2].x + this.canvas.width / 2,
                    pts[pts.length - 2].y + this.canvas.height / 2);
                ctx.lineTo(pts[pts.length - 1].x + this.canvas.width / 2,
                    pts[pts.length - 1].y + this.canvas.height / 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };

        this._onMouseUp = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            if (this.freehandPoints.length > 10) {
                // Resample to uniform spacing
                const resampled = this._resamplePoints(this.freehandPoints, 200);
                this.loadCustomPoints(resampled);
                this.numFrequencies = Math.min(50, this.coefficients.length);
                this.startAnimation();
            }
        };

        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mouseup', this._onMouseUp);

        this._freehandActive = true;
    }

    disableFreehandDraw() {
        if (this._freehandActive) {
            this.canvas.removeEventListener('mousedown', this._onMouseDown);
            this.canvas.removeEventListener('mousemove', this._onMouseMove);
            this.canvas.removeEventListener('mouseup', this._onMouseUp);
            this._freehandActive = false;
        }
    }

    _resamplePoints(points, numSamples) {
        // Calculate total path length
        let totalLen = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            totalLen += Math.sqrt(dx * dx + dy * dy);
        }

        const step = totalLen / numSamples;
        const resampled = [{ ...points[0] }];
        let dist = 0;
        let target = step;

        for (let i = 1; i < points.length && resampled.length < numSamples; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            while (dist + segLen >= target && resampled.length < numSamples) {
                const frac = (target - dist) / segLen;
                resampled.push({
                    x: points[i - 1].x + dx * frac,
                    y: points[i - 1].y + dy * frac
                });
                target += step;
            }
            dist += segLen;
        }

        return resampled;
    }

    // Set scale multiplier for epicycles
    setScale(scale) {
        if (this.coefficients.length === 0) return;
        // Recompute by scaling existing coefficients
        for (const c of this.coefficients) {
            c.amplitude *= scale / (this._lastScale || 1);
        }
        this._lastScale = scale;
        this.render();
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
        this.disableFreehandDraw();
        this.stop();
        this.coefficients = [];
        this.path = [];
    }
}

