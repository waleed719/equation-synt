// ============================================================
// shapes.js — Preset shape data for Fourier mode
// ============================================================

const PresetShapes = {
    boat: {
        name: 'Boat',
        points: (() => {
            const pts = [];
            const N = 200;
            // Hull bottom
            for (let i = 0; i <= 60; i++) {
                const t = i / 60;
                pts.push({ x: -120 + t * 240, y: 40 + 30 * Math.sin(t * Math.PI) });
            }
            // Stern (right side up)
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                pts.push({ x: 120, y: 40 - t * 80 });
            }
            // Cabin top
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                pts.push({ x: 120 - t * 60, y: -40 });
            }
            // Cabin front
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                pts.push({ x: 60, y: -40 + t * 20 });
            }
            // Deck level
            for (let i = 0; i <= 30; i++) {
                const t = i / 30;
                pts.push({ x: 60 - t * 120, y: -20 });
            }
            // Mast
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                pts.push({ x: -10, y: -20 - t * 100 });
            }
            // Flag
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                pts.push({ x: -10 + t * 30, y: -120 + t * 15 });
            }
            for (let i = 0; i <= 10; i++) {
                const t = i / 10;
                pts.push({ x: 20 - t * 30, y: -105 + t * 15 });
            }
            // Mast down
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                pts.push({ x: -10, y: -90 + t * 70 });
            }
            // Bow
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                pts.push({ x: -60 - t * 60, y: -20 + t * 20 });
            }
            // Bow curve to hull
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                const angle = Math.PI * 0.5 + t * Math.PI * 0.5;
                pts.push({ x: -120 + 10 * Math.cos(angle), y: 10 + 30 * Math.sin(angle) });
            }
            return pts;
        })()
    },

    star: {
        name: 'Star',
        points: (() => {
            const pts = [];
            const outerR = 100, innerR = 45;
            const spikes = 5;
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (i * Math.PI / spikes) - Math.PI / 2;
                pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
            }
            // Close it by adding first point
            pts.push({ ...pts[0] });
            // Interpolate for smoother DFT
            const smooth = [];
            for (let i = 0; i < pts.length - 1; i++) {
                for (let j = 0; j < 20; j++) {
                    const t = j / 20;
                    smooth.push({
                        x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
                        y: pts[i].y + (pts[i + 1].y - pts[i].y) * t
                    });
                }
            }
            return smooth;
        })()
    },

    heart: {
        name: 'Heart',
        points: (() => {
            const pts = [];
            for (let i = 0; i < 200; i++) {
                const t = (i / 200) * Math.PI * 2;
                pts.push({
                    x: 16 * Math.pow(Math.sin(t), 3) * 7,
                    y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 7
                });
            }
            return pts;
        })()
    },

    trebleClef: {
        name: 'Treble Clef',
        points: (() => {
            const pts = [];
            // Approximation using smooth curves
            for (let i = 0; i < 300; i++) {
                const t = (i / 300) * Math.PI * 4;
                const r = 50 + 30 * Math.sin(t * 0.7);
                const x = r * Math.cos(t) * (1 + 0.3 * Math.sin(t * 1.5));
                const y = r * Math.sin(t) + t * 8 - 120;
                pts.push({ x: x * 0.8, y: y * 0.5 });
            }
            return pts;
        })()
    },

    infinity: {
        name: 'Infinity (∞)',
        points: (() => {
            const pts = [];
            for (let i = 0; i < 200; i++) {
                const t = (i / 200) * Math.PI * 2;
                const scale = 90;
                pts.push({
                    x: scale * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t)),
                    y: scale * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t))
                });
            }
            return pts;
        })()
    },

    butterfly: {
        name: 'Butterfly',
        points: (() => {
            const pts = [];
            for (let i = 0; i < 300; i++) {
                const t = (i / 300) * Math.PI * 12;
                const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
                pts.push({
                    x: r * Math.sin(t) * 40,
                    y: -r * Math.cos(t) * 40
                });
            }
            return pts;
        })()
    },

    abstract_spiral: {
        name: 'Abstract Spiral',
        points: (() => {
            const pts = [];
            for (let i = 0; i < 500; i++) {
                const t = (i / 500) * Math.PI * 8;
                const r = 10 + t * 5 + 15 * Math.sin(t * 3);
                pts.push({
                    x: r * Math.cos(t),
                    y: r * Math.sin(t)
                });
            }
            return pts;
        })()
    },

    geometric_flower: {
        name: 'Geometric Flower',
        points: (() => {
            const pts = [];
            for (let i = 0; i < 400; i++) {
                const t = (i / 400) * Math.PI * 2;
                const r = 80 * (1 + 0.5 * Math.cos(6 * t)) * (1 + 0.2 * Math.cos(12 * t));
                pts.push({
                    x: r * Math.cos(t),
                    y: r * Math.sin(t)
                });
            }
            return pts;
        })()
    }
};
