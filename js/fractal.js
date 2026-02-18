// ============================================================
// fractal.js — Mandelbrot & Julia Set Renderers
// ============================================================

class FractalMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animation = new AnimationManager();
        this.fractalType = 'mandelbrot'; // 'mandelbrot' | 'julia'
        this.maxIterations = 200;
        this.juliaC = { re: -0.7, im: 0.27015 };
        this.colorScheme = 'fire';

        // View bounds
        this.viewX = -2.5;
        this.viewY = -1.5;
        this.viewW = 3.5;
        this.viewH = 3;

        // Interaction
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastView = null;

        this.setupInteraction();
    }

    // --- Color Palette Functions ---
    static COLOR_SCHEMES = {
        fire: (t) => {
            const r = Math.min(255, Math.floor(t * 3 * 255));
            const g = Math.min(255, Math.floor(Math.max(0, t * 3 - 1) * 255));
            const b = Math.min(255, Math.floor(Math.max(0, t * 3 - 2) * 255));
            return [r, g, b];
        },
        ocean: (t) => {
            const r = Math.floor(9 * (1 - t) * t * t * t * 255);
            const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
            const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255 + t * 200);
            return [r, g, b];
        },
        neon: (t) => {
            const h = t * 360;
            return hslToRgb(h, 100, 50);
        },
        electric: (t) => {
            const h = 200 + t * 160;
            const s = 100;
            const l = 10 + t * 60;
            return hslToRgb(h % 360, s, l);
        },
        sunset: (t) => {
            const h = 0 + t * 60;
            const s = 90;
            const l = 20 + t * 50;
            return hslToRgb(h, s, l);
        },
        cosmic: (t) => {
            const h = 240 + t * 120;
            const s = 80 + t * 20;
            const l = 5 + t * 55;
            return hslToRgb(h % 360, s, l);
        },
        monochrome: (t) => {
            const v = Math.floor(t * 255);
            return [v, v, v];
        },
        matrix: (t) => {
            const g = Math.floor(t * 255);
            return [0, g, Math.floor(g * 0.3)];
        }
    };

    // --- Mandelbrot iteration ---
    // z_{n+1} = z_n² + c
    // For Mandelbrot: z₀ = 0, c = pixel coordinate
    // For Julia: z₀ = pixel coordinate, c = constant
    iterate(zr, zi, cr, ci) {
        let iter = 0;
        let zr2 = zr * zr;
        let zi2 = zi * zi;

        while (zr2 + zi2 <= 4 && iter < this.maxIterations) {
            zi = 2 * zr * zi + ci;
            zr = zr2 - zi2 + cr;
            zr2 = zr * zr;
            zi2 = zi * zi;
            iter++;
        }

        // Smooth coloring
        if (iter < this.maxIterations) {
            const log_zn = Math.log(zr2 + zi2) / 2;
            const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
            iter = iter + 1 - nu;
        }

        return iter;
    }

    render() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;
        const imageData = ctx.createImageData(W, H);
        const data = imageData.data;

        const colorFunc = FractalMode.COLOR_SCHEMES[this.colorScheme] || FractalMode.COLOR_SCHEMES.fire;

        for (let py = 0; py < H; py++) {
            for (let px = 0; px < W; px++) {
                // Map pixel to complex plane
                const x0 = this.viewX + (px / W) * this.viewW;
                const y0 = this.viewY + (py / H) * this.viewH;

                let iter;
                if (this.fractalType === 'mandelbrot') {
                    iter = this.iterate(0, 0, x0, y0);
                } else {
                    iter = this.iterate(x0, y0, this.juliaC.re, this.juliaC.im);
                }

                const idx = (py * W + px) * 4;

                if (iter >= this.maxIterations) {
                    // Inside the set = black
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                } else {
                    const t = iter / this.maxIterations;
                    const smoothT = Math.sqrt(t); // Smoother falloff
                    const [r, g, b] = colorFunc(smoothT);
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                }
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.drawInfo();
    }

    // Progressive rendering: low-res first, then refine
    renderProgressive() {
        const steps = [8, 4, 2, 1];
        let stepIndex = 0;

        const renderStep = () => {
            if (stepIndex >= steps.length) return;

            const scale = steps[stepIndex];
            const W = this.canvas.width;
            const H = this.canvas.height;
            const ctx = this.ctx;
            const colorFunc = FractalMode.COLOR_SCHEMES[this.colorScheme] || FractalMode.COLOR_SCHEMES.fire;

            for (let py = 0; py < H; py += scale) {
                for (let px = 0; px < W; px += scale) {
                    const x0 = this.viewX + (px / W) * this.viewW;
                    const y0 = this.viewY + (py / H) * this.viewH;

                    let iter;
                    if (this.fractalType === 'mandelbrot') {
                        iter = this.iterate(0, 0, x0, y0);
                    } else {
                        iter = this.iterate(x0, y0, this.juliaC.re, this.juliaC.im);
                    }

                    if (iter >= this.maxIterations) {
                        ctx.fillStyle = '#000';
                    } else {
                        const t = Math.sqrt(iter / this.maxIterations);
                        const [r, g, b] = colorFunc(t);
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                    }
                    ctx.fillRect(px, py, scale, scale);
                }
            }

            stepIndex++;
            if (stepIndex < steps.length) {
                requestAnimationFrame(renderStep);
            } else {
                this.drawInfo();
            }
        };

        renderStep();
    }

    drawInfo() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, this.canvas.height - 50, 350, 40);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px "JetBrains Mono", monospace';

        const type = this.fractalType === 'mandelbrot' ? 'Mandelbrot' : 'Julia';
        let info = `${type} | Iterations: ${this.maxIterations} | Zoom: ${(3.5 / this.viewW).toFixed(1)}x`;
        if (this.fractalType === 'julia') {
            info += ` | c = ${this.juliaC.re.toFixed(3)} + ${this.juliaC.im.toFixed(3)}i`;
        }
        ctx.fillText(info, 20, this.canvas.height - 25);
    }

    // --- Interaction ---
    setupInteraction() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;

            const mx = e.offsetX / this.canvas.clientWidth;
            const my = e.offsetY / this.canvas.clientHeight;

            const cx = this.viewX + mx * this.viewW;
            const cy = this.viewY + my * this.viewH;

            this.viewW *= zoomFactor;
            this.viewH *= zoomFactor;
            this.viewX = cx - mx * this.viewW;
            this.viewY = cy - my * this.viewH;

            this.renderProgressive();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStart = { x: e.offsetX, y: e.offsetY };
            this.lastView = { x: this.viewX, y: this.viewY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = (e.offsetX - this.dragStart.x) / this.canvas.clientWidth * this.viewW;
            const dy = (e.offsetY - this.dragStart.y) / this.canvas.clientHeight * this.viewH;
            this.viewX = this.lastView.x - dx;
            this.viewY = this.lastView.y - dy;
            this.renderProgressive();
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    }

    // --- Public API ---
    setFractalType(type) {
        this.fractalType = type;
        if (type === 'mandelbrot') {
            this.viewX = -2.5; this.viewY = -1.5;
            this.viewW = 3.5; this.viewH = 3;
        } else {
            this.viewX = -2; this.viewY = -1.5;
            this.viewW = 4; this.viewH = 3;
        }
        this.renderProgressive();
    }

    setMaxIterations(n) {
        this.maxIterations = n;
        this.renderProgressive();
    }

    setJuliaC(re, im) {
        this.juliaC = { re, im };
        if (this.fractalType === 'julia') {
            this.renderProgressive();
        }
    }

    setColorScheme(scheme) {
        this.colorScheme = scheme;
        this.renderProgressive();
    }

    resetView() {
        if (this.fractalType === 'mandelbrot') {
            this.viewX = -2.5; this.viewY = -1.5;
            this.viewW = 3.5; this.viewH = 3;
        } else {
            this.viewX = -2; this.viewY = -1.5;
            this.viewW = 4; this.viewH = 3;
        }
        this.renderProgressive();
    }

    destroy() {
        // Remove event listeners would require storing references...
        // For now, canvas replacement handles cleanup
    }
}
