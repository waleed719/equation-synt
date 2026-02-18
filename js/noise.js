// ============================================================
// noise.js — Perlin Noise Implementation + Landscape Generator
// ============================================================

class NoiseMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animation = new AnimationManager();
        this.currentScene = 'mountains';
        this.octaves = 6;
        this.frequency = 0.01;
        this.amplitude = 1.0;
        this.lacunarity = 2.0;
        this.persistence = 0.5;
        this.seed = Math.random() * 10000;
        this.animOffset = 0;
        this.colorTheme = 'daylight';

        // Initialize permutation table
        this.initPermutation();
    }

    // --- Perlin Noise Implementation ---
    // Based on Ken Perlin's improved noise function

    initPermutation() {
        const perm = [];
        for (let i = 0; i < 256; i++) perm[i] = i;

        // Shuffle using seed
        let s = this.seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 0) % 2147483647;
            const j = s % (i + 1);
            [perm[i], perm[j]] = [perm[j], perm[i]];
        }

        // Duplicate
        this.p = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = perm[i & 255];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    noise2D(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const aa = this.p[this.p[xi] + yi];
        const ab = this.p[this.p[xi] + yi + 1];
        const ba = this.p[this.p[xi + 1] + yi];
        const bb = this.p[this.p[xi + 1] + yi + 1];

        const x1 = lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
        const x2 = lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

        return lerp(x1, x2, v);
    }

    // Octave (fractal) noise
    fbm(x, y) {
        let value = 0;
        let amplitude = this.amplitude;
        let frequency = this.frequency;

        for (let i = 0; i < this.octaves; i++) {
            value += amplitude * this.noise2D(x * frequency, y * frequency);
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return value;
    }

    // 1D noise for terrain
    noise1D(x) {
        return this.noise2D(x, 0.5);
    }

    fbm1D(x) {
        let value = 0;
        let amplitude = this.amplitude;
        let frequency = this.frequency;

        for (let i = 0; i < this.octaves; i++) {
            value += amplitude * this.noise1D(x * frequency);
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return value;
    }

    // --- Color Themes ---
    static THEMES = {
        daylight: {
            name: '☀️ Daylight',
            sky: ['#87CEEB', '#4A90D9', '#1C4E80'],
            ground: ['#2d5016', '#4a7c20', '#6b8e23', '#8b7355'],
            water: '#4A90D9',
            sun: '#FFD700'
        },
        sunset: {
            name: '🌅 Sunset',
            sky: ['#ff6b35', '#f7418c', '#5c2d91'],
            ground: ['#1a0a00', '#3d1f00', '#5c3a00', '#785028'],
            water: '#2a1040',
            sun: '#ff4500'
        },
        night: {
            name: '🌙 Night',
            sky: ['#0a0a2e', '#0d1b3e', '#14294e'],
            ground: ['#050510', '#0a0a20', '#0f0f30', '#141430'],
            water: '#0a0a2e',
            sun: null
        },
        alien: {
            name: '👽 Alien Planet',
            sky: ['#1a002e', '#4a0066', '#7a00aa'],
            ground: ['#003322', '#00664d', '#009977', '#33bbaa'],
            water: '#330066',
            sun: '#00ff88'
        },
        arctic: {
            name: '❄️ Arctic',
            sky: ['#c8e6f0', '#87b8d4', '#5a8ab0'],
            ground: ['#e8e8f0', '#d0d0e0', '#b8b8d0', '#a0a0c0'],
            water: '#5a8ab0',
            sun: '#ffe8c0'
        }
    };

    // --- Scene Renderers ---

    renderMountains(offset = 0) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;
        const theme = NoiseMode.THEMES[this.colorTheme] || NoiseMode.THEMES.daylight;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        theme.sky.forEach((c, i) => skyGrad.addColorStop(i / (theme.sky.length - 1), c));
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Sun/moon
        if (theme.sun) {
            ctx.beginPath();
            ctx.arc(W * 0.8, H * 0.15, 40, 0, Math.PI * 2);
            ctx.fillStyle = theme.sun;
            ctx.shadowColor = theme.sun;
            ctx.shadowBlur = 40;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Stars for night theme
        if (this.colorTheme === 'night') {
            for (let i = 0; i < 150; i++) {
                const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * W;
                const sy = (Math.sin(i * 269.5 + 183.3) * 0.3 + 0.2) * H;
                const brightness = Math.random() * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.random() * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                ctx.fill();
            }
        }

        // Multiple mountain layers
        const layers = [
            { yBase: 0.55, scale: 0.003, amp: 150, color: theme.ground[0], freq: 1 },
            { yBase: 0.6, scale: 0.005, amp: 130, color: theme.ground[1], freq: 1.5 },
            { yBase: 0.68, scale: 0.008, amp: 100, color: theme.ground[2], freq: 2 },
            { yBase: 0.78, scale: 0.012, amp: 70, color: theme.ground[3] || theme.ground[2], freq: 3 }
        ];

        for (const layer of layers) {
            ctx.beginPath();
            ctx.moveTo(0, H);

            for (let x = 0; x <= W; x += 2) {
                let y = H * layer.yBase;
                let amp = layer.amp;
                let freq = layer.scale;

                for (let o = 0; o < this.octaves; o++) {
                    y -= amp * this.noise1D((x + offset * layer.freq) * freq);
                    amp *= this.persistence;
                    freq *= this.lacunarity;
                }

                ctx.lineTo(x, y);
            }

            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fillStyle = layer.color;
            ctx.fill();
        }
    }

    renderOcean(offset = 0) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;
        const theme = NoiseMode.THEMES[this.colorTheme] || NoiseMode.THEMES.daylight;

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
        theme.sky.forEach((c, i) => skyGrad.addColorStop(i / (theme.sky.length - 1), c));
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Sun
        if (theme.sun) {
            ctx.beginPath();
            ctx.arc(W * 0.7, H * 0.12, 35, 0, Math.PI * 2);
            ctx.fillStyle = theme.sun;
            ctx.shadowColor = theme.sun;
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Water layers
        const waterLayers = 15;
        for (let l = 0; l < waterLayers; l++) {
            const yBase = H * 0.45 + l * (H * 0.55 / waterLayers);
            const alpha = 0.4 + (l / waterLayers) * 0.5;

            ctx.beginPath();
            ctx.moveTo(0, H);

            for (let x = 0; x <= W; x += 3) {
                let y = yBase;
                let amp = 15 - l * 0.5;
                let freq = 0.01 + l * 0.002;

                for (let o = 0; o < Math.min(this.octaves, 4); o++) {
                    y += amp * this.noise1D((x + offset * (1 + l * 0.3)) * freq + l * 100);
                    amp *= 0.5;
                    freq *= 2;
                }

                ctx.lineTo(x, y);
            }

            ctx.lineTo(W, H);
            ctx.closePath();

            const hue = this.colorTheme === 'sunset' ? 260 : this.colorTheme === 'alien' ? 160 : 210;
            const lightness = 15 + l * 3;
            ctx.fillStyle = `hsla(${hue}, 60%, ${lightness}%, ${alpha})`;
            ctx.fill();

            // Foam/highlights
            if (l < 3) {
                ctx.strokeStyle = `rgba(255,255,255,${0.1 - l * 0.03})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    renderClouds(offset = 0) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;
        const imageData = ctx.createImageData(W, H);
        const data = imageData.data;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const nx = (x + offset) * this.frequency;
                const ny = y * this.frequency;

                let value = this.fbm(nx, ny);
                value = (value + 1) / 2; // Normalize to [0, 1]
                value = clamp(value, 0, 1);

                const idx = (y * W + x) * 4;

                if (this.colorTheme === 'night') {
                    data[idx] = Math.floor(value * 20 + 10);
                    data[idx + 1] = Math.floor(value * 30 + 15);
                    data[idx + 2] = Math.floor(value * 80 + 40);
                } else if (this.colorTheme === 'sunset') {
                    data[idx] = Math.floor(value * 200 + 55);
                    data[idx + 1] = Math.floor(value * 100 + 30);
                    data[idx + 2] = Math.floor(value * 150 + 50);
                } else if (this.colorTheme === 'alien') {
                    data[idx] = Math.floor(value * 50);
                    data[idx + 1] = Math.floor(value * 200 + 30);
                    data[idx + 2] = Math.floor(value * 150 + 50);
                } else {
                    // Daylight clouds
                    const sky = [135, 206, 235];
                    const cloud = [255, 255, 255];
                    data[idx] = Math.floor(lerp(sky[0], cloud[0], value));
                    data[idx + 1] = Math.floor(lerp(sky[1], cloud[1], value));
                    data[idx + 2] = Math.floor(lerp(sky[2], cloud[2], value));
                }
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    renderAlienPlanet(offset = 0) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;

        // Alien sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#0a001a');
        skyGrad.addColorStop(0.3, '#1a0033');
        skyGrad.addColorStop(0.5, '#330055');
        skyGrad.addColorStop(1, '#000a0a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Nebula effect
        for (let i = 0; i < 3; i++) {
            for (let x = 0; x < W; x += 3) {
                for (let y = 0; y < H * 0.5; y += 3) {
                    const n = this.fbm((x + i * 200) * 0.005 + offset * 0.0001, y * 0.005);
                    if (n > 0.1) {
                        const alpha = (n - 0.1) * 0.3;
                        const hue = 280 + i * 40;
                        ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${alpha})`;
                        ctx.fillRect(x, y, 3, 3);
                    }
                }
            }
        }

        // Alien moons
        ctx.beginPath();
        ctx.arc(W * 0.3, H * 0.15, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#cc88ff';
        ctx.shadowColor = '#cc88ff';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(W * 0.75, H * 0.25, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#88ffcc';
        ctx.shadowColor = '#88ffcc';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Terrain
        const terrainLayers = [
            { yBase: 0.65, color: '#001a0d', amp: 120 },
            { yBase: 0.73, color: '#003322', amp: 80 },
            { yBase: 0.82, color: '#005544', amp: 50 }
        ];

        for (const layer of terrainLayers) {
            ctx.beginPath();
            ctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 2) {
                let y = H * layer.yBase;
                let amp = layer.amp;
                let freq = 0.005;
                for (let o = 0; o < this.octaves; o++) {
                    y -= amp * this.noise1D((x + offset) * freq);
                    amp *= this.persistence;
                    freq *= this.lacunarity;
                }
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fillStyle = layer.color;
            ctx.fill();
        }

        // Glowing ground particles
        for (let i = 0; i < 50; i++) {
            const px = (this.noise1D(i * 73.1 + offset * 0.001) * 0.5 + 0.5) * W;
            const py = H * 0.8 + Math.random() * H * 0.18;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${160 + Math.random() * 60}, 100%, 70%, ${0.3 + Math.random() * 0.5})`;
            ctx.fill();
        }
    }

    // --- Public API ---

    renderScene(animate = false) {
        const offset = animate ? this.animOffset : 0;

        switch (this.currentScene) {
            case 'mountains':
                this.renderMountains(offset);
                break;
            case 'ocean':
                this.renderOcean(offset);
                break;
            case 'clouds':
                this.renderClouds(offset);
                break;
            case 'alien':
                this.renderAlienPlanet(offset);
                break;
        }
    }

    render() {
        this.renderScene(false);
    }

    startAnimation() {
        this.animOffset = 0;
        this.animation.reset();
        this.animation.start((t) => {
            this.animOffset = t * 100;
            this.renderScene(true);
        });
    }

    stop() {
        this.animation.stop();
    }

    reset() {
        this.animation.reset();
        this.animOffset = 0;
        this.renderScene(false);
    }

    setScene(scene) {
        this.currentScene = scene;
        this.renderScene(false);
    }

    setOctaves(n) {
        this.octaves = n;
        this.renderScene(false);
    }

    setFrequency(f) {
        this.frequency = f;
        this.renderScene(false);
    }

    setAmplitude(a) {
        this.amplitude = a;
        this.renderScene(false);
    }

    setLacunarity(l) {
        this.lacunarity = l;
        this.renderScene(false);
    }

    setPersistence(p) {
        this.persistence = p;
        this.renderScene(false);
    }

    setColorTheme(theme) {
        this.colorTheme = theme;
        this.renderScene(false);
    }

    randomizeSeed() {
        this.seed = Math.random() * 10000;
        this.initPermutation();
        this.renderScene(false);
    }

    setSpeed(speed) {
        this.animation.setSpeed(speed);
    }

    destroy() {
        this.stop();
    }
}
