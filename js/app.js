// ============================================================
// app.js — Main Application Controller
// ============================================================

class App {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentMode = null;
        this.currentModeName = '';
        this.modes = {};

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize default mode
        this.switchMode('fourier');
    }

    resizeCanvas() {
        const container = document.getElementById('canvasContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Re-render current mode after resize
        if (this.currentMode && this.currentMode.render) {
            this.currentMode.render();
        }
    }

    switchMode(modeName) {
        // Cleanup previous mode
        if (this.currentMode && this.currentMode.destroy) {
            this.currentMode.destroy();
        }

        this.currentModeName = modeName;
        clearCanvas(this.ctx, this.canvas);

        // Remove old event listeners by replacing canvas
        const container = document.getElementById('canvasContainer');
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'mainCanvas';
        newCanvas.width = this.canvas.width;
        newCanvas.height = this.canvas.height;
        container.replaceChild(newCanvas, this.canvas);
        this.canvas = newCanvas;
        this.ctx = newCanvas.getContext('2d');

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === modeName);
        });

        // Update mode title
        const titles = {
            fourier: 'Fourier Drawing',
            parametric: 'Parametric Art',
            fractal: 'Fractal Explorer',
            noise: 'Noise Landscapes'
        };
        document.getElementById('modeTitle').textContent = titles[modeName] || modeName;

        // Show correct controls panel
        document.querySelectorAll('.controls-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${modeName}Controls`);
        });

        // Initialize mode
        switch (modeName) {
            case 'fourier':
                this.currentMode = new FourierMode(this.canvas, this.ctx);
                this.initFourierMode();
                break;
            case 'parametric':
                this.currentMode = new ParametricMode(this.canvas, this.ctx);
                this.initParametricMode();
                break;
            case 'fractal':
                this.currentMode = new FractalMode(this.canvas, this.ctx);
                this.initFractalMode();
                break;
            case 'noise':
                this.currentMode = new NoiseMode(this.canvas, this.ctx);
                this.initNoiseMode();
                break;
        }
    }

    // --- Fourier Mode Controls ---
    initFourierMode() {
        const mode = this.currentMode;

        // Shape selector
        const shapeSelect = document.getElementById('fourierPreset');
        shapeSelect.innerHTML = '';
        for (const [key, shape] of Object.entries(PresetShapes)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = shape.name;
            shapeSelect.appendChild(opt);
        }
        shapeSelect.value = 'heart';
        shapeSelect.addEventListener('change', (e) => {
            mode.loadPreset(e.target.value);
            this.updateFourierFreqSlider();
        });

        // Load initial preset
        mode.loadPreset('heart');

        // Frequency slider
        const freqSlider = document.getElementById('fourierFrequencies');
        const freqLabel = document.getElementById('fourierFreqLabel');
        this.updateFourierFreqSlider();

        freqSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setNumFrequencies(val);
            freqLabel.textContent = val;
        });

        // Speed slider
        const speedSlider = document.getElementById('fourierSpeed');
        speedSlider.addEventListener('input', (e) => {
            mode.setSpeed(parseFloat(e.target.value));
        });

        // Stroke width
        const widthSlider = document.getElementById('fourierStroke');
        widthSlider.addEventListener('input', (e) => {
            mode.setStrokeWidth(parseFloat(e.target.value));
        });

        // Color picker
        const colorPicker = document.getElementById('fourierColor');
        colorPicker.addEventListener('input', (e) => {
            mode.setStrokeColor(e.target.value);
        });

        // Show epicycles toggle
        const epicyclesToggle = document.getElementById('fourierEpicycles');
        epicyclesToggle.addEventListener('change', (e) => {
            mode.setShowEpicycles(e.target.checked);
        });

        // --- Drift controls ---
        const driftToggle = document.getElementById('fourierDriftEnabled');
        const driftControlsDiv = document.getElementById('driftControls');
        const driftAmountSlider = document.getElementById('fourierDriftAmount');
        const driftAmountLabel = document.getElementById('driftAmountLabel');
        const driftAngleSlider = document.getElementById('fourierDriftAngle');
        const driftAngleLabel = document.getElementById('driftAngleLabel');

        driftToggle.addEventListener('change', (e) => {
            mode.setDriftEnabled(e.target.checked);
            driftControlsDiv.style.opacity = e.target.checked ? '1' : '0.4';
            driftControlsDiv.style.pointerEvents = e.target.checked ? 'auto' : 'none';
        });

        driftAmountSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setDriftAmount(val);
            driftAmountLabel.textContent = val.toFixed(1);
        });

        driftAngleSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setDriftAngle(val);
            driftAngleLabel.textContent = val.toFixed(2);
        });

        // Freehand draw button
        const freehandBtn = document.getElementById('fourierFreehandBtn');
        let freehandActive = false;
        freehandBtn.addEventListener('click', () => {
            if (!freehandActive) {
                mode.enableFreehandDraw();
                freehandBtn.textContent = '❌ Cancel Drawing';
                freehandBtn.classList.add('btn-stop');
                freehandActive = true;
            } else {
                mode.disableFreehandDraw();
                freehandBtn.textContent = '✏️ Freehand Draw';
                freehandBtn.classList.remove('btn-stop');
                freehandActive = false;
                mode.loadPreset(mode.currentPreset);
            }
        });

        // Play button
        document.getElementById('fourierPlay').addEventListener('click', () => {
            if (freehandActive) {
                mode.disableFreehandDraw();
                freehandBtn.textContent = '✏️ Freehand Draw';
                freehandBtn.classList.remove('btn-stop');
                freehandActive = false;
            }
            mode.startAnimation();
        });

        // Pause button
        document.getElementById('fourierPause').addEventListener('click', () => {
            mode.stop();
        });

        // Reset button
        document.getElementById('fourierReset').addEventListener('click', () => {
            if (freehandActive) {
                mode.disableFreehandDraw();
                freehandBtn.textContent = '✏️ Freehand Draw';
                freehandBtn.classList.remove('btn-stop');
                freehandActive = false;
            }
            mode.reset();
        });

        // SVG upload
        document.getElementById('svgUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const points = mode.parseSVGPath(ev.target.result);
                if (points.length > 0) {
                    mode.loadCustomPoints(points);
                    this.updateFourierFreqSlider();
                    mode.startAnimation();
                }
            };
            reader.readAsText(file);
        });
    }

    updateFourierFreqSlider() {
        const mode = this.currentMode;
        const freqSlider = document.getElementById('fourierFrequencies');
        const freqLabel = document.getElementById('fourierFreqLabel');
        if (mode.coefficients) {
            freqSlider.max = mode.coefficients.length;
            freqSlider.value = mode.numFrequencies;
            freqLabel.textContent = mode.numFrequencies;
        }
    }

    // --- Parametric Mode Controls ---
    initParametricMode() {
        const mode = this.currentMode;

        // Build preset selector grouped by category
        const presetSelect = document.getElementById('parametricPreset');
        presetSelect.innerHTML = '';

        const categories = {};
        for (const [key, preset] of Object.entries(ParametricMode.PRESETS)) {
            const cat = preset.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({ key, preset });
        }

        for (const [cat, presets] of Object.entries(categories)) {
            const group = document.createElement('optgroup');
            group.label = cat;
            for (const { key, preset } of presets) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = preset.name;
                group.appendChild(opt);
            }
            presetSelect.appendChild(group);
        }

        presetSelect.value = 'heart';

        const customPanel = document.getElementById('customEquationPanel');

        presetSelect.addEventListener('change', (e) => {
            mode.loadPreset(e.target.value);
            this.buildParametricSliders();
            // Show/hide custom equation panel
            customPanel.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Load initial
        mode.loadPreset('heart');
        this.buildParametricSliders();

        // Custom equation inputs
        const customXInput = document.getElementById('customXInput');
        const customYInput = document.getElementById('customYInput');

        customXInput.addEventListener('change', (e) => {
            const ok = mode.setCustomX(e.target.value);
            e.target.classList.toggle('error', !ok);
        });

        customYInput.addEventListener('change', (e) => {
            const ok = mode.setCustomY(e.target.value);
            e.target.classList.toggle('error', !ok);
        });

        // t-range slider
        const tRangeSlider = document.getElementById('parametricTRange');
        const tRangeLabel = document.getElementById('tRangeLabel');
        tRangeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setTRange(0, val);
            tRangeLabel.textContent = val.toFixed(2);
        });

        // Resolution slider
        const resSlider = document.getElementById('parametricResolution');
        const resLabel = document.getElementById('resolutionLabel');
        resSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setResolution(val);
            resLabel.textContent = val;
        });

        // Animation controls
        document.getElementById('parametricPlay').addEventListener('click', () => {
            mode.startAnimation();
        });

        document.getElementById('parametricPause').addEventListener('click', () => {
            mode.stop();
        });

        document.getElementById('parametricReset').addEventListener('click', () => {
            mode.reset();
        });

        // Stroke width
        document.getElementById('parametricStroke').addEventListener('input', (e) => {
            mode.setStrokeWidth(parseFloat(e.target.value));
        });

        // Speed
        document.getElementById('parametricSpeed').addEventListener('input', (e) => {
            mode.setSpeed(parseFloat(e.target.value));
        });
    }

    buildParametricSliders() {
        const mode = this.currentMode;
        const preset = ParametricMode.PRESETS[mode.currentPreset];
        const container = document.getElementById('parametricSliders');
        container.innerHTML = '';

        if (!preset || !preset.sliders) return;

        for (const slider of preset.sliders) {
            const div = document.createElement('div');
            div.className = 'control-group';

            const label = document.createElement('label');
            label.textContent = slider.label;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'slider-value';
            valueSpan.textContent = mode.params[slider.key];

            const input = document.createElement('input');
            input.type = 'range';
            input.min = slider.min;
            input.max = slider.max;
            input.step = slider.step;
            input.value = mode.params[slider.key];
            input.className = 'slider';

            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                mode.updateParam(slider.key, val);
                valueSpan.textContent = val;
            });

            const labelRow = document.createElement('div');
            labelRow.className = 'label-row';
            labelRow.appendChild(label);
            labelRow.appendChild(valueSpan);

            div.appendChild(labelRow);
            div.appendChild(input);
            container.appendChild(div);
        }
    }

    // --- Fractal Mode Controls ---
    initFractalMode() {
        const mode = this.currentMode;

        // Fractal type
        document.getElementById('fractalType').addEventListener('change', (e) => {
            mode.setFractalType(e.target.value);
            const juliaControls = document.getElementById('juliaControls');
            juliaControls.style.display = e.target.value === 'julia' ? 'block' : 'none';
        });

        // Fractal formula dropdown
        const formulaSelect = document.getElementById('fractalFormula');
        const formulaDesc = document.getElementById('formulaDescription');
        formulaSelect.innerHTML = '';
        for (const [key, formula] of Object.entries(FractalMode.FORMULAS)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = formula.name;
            formulaSelect.appendChild(opt);
        }
        formulaSelect.value = mode.formula || 'standard';
        formulaSelect.addEventListener('change', (e) => {
            mode.setFormula(e.target.value);
            const f = FractalMode.FORMULAS[e.target.value];
            if (f) formulaDesc.textContent = f.description;
        });

        // Power slider
        const powerSlider = document.getElementById('fractalPower');
        const powerLabel = document.getElementById('fractalPowerLabel');
        powerSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setPower(val);
            powerLabel.textContent = val;
        });

        // Iterations
        const iterSlider = document.getElementById('fractalIterations');
        const iterLabel = document.getElementById('fractalIterLabel');
        iterSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setMaxIterations(val);
            iterLabel.textContent = val;
        });

        // Bailout
        const bailoutSlider = document.getElementById('fractalBailout');
        const bailoutLabel = document.getElementById('fractalBailoutLabel');
        bailoutSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setBailout(val);
            bailoutLabel.textContent = val;
        });

        // Perturbation (Re)
        const perturbReSlider = document.getElementById('fractalPerturbRe');
        const perturbReLabel = document.getElementById('perturbReLabel');
        perturbReSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            perturbReLabel.textContent = val.toFixed(3);
            mode.setPerturbation(val, parseFloat(document.getElementById('fractalPerturbIm').value));
        });

        // Perturbation (Im)
        const perturbImSlider = document.getElementById('fractalPerturbIm');
        const perturbImLabel = document.getElementById('perturbImLabel');
        perturbImSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            perturbImLabel.textContent = val.toFixed(3);
            mode.setPerturbation(parseFloat(document.getElementById('fractalPerturbRe').value), val);
        });

        // Color scheme
        document.getElementById('fractalColorScheme').addEventListener('change', (e) => {
            mode.setColorScheme(e.target.value);
        });

        // Julia C sliders
        const juliaRe = document.getElementById('juliaRe');
        const juliaIm = document.getElementById('juliaIm');
        const juliaReLabel = document.getElementById('juliaReLabel');
        const juliaImLabel = document.getElementById('juliaImLabel');

        juliaRe.addEventListener('input', (e) => {
            const re = parseFloat(e.target.value);
            juliaReLabel.textContent = re.toFixed(3);
            mode.setJuliaC(re, parseFloat(juliaIm.value));
        });

        juliaIm.addEventListener('input', (e) => {
            const im = parseFloat(e.target.value);
            juliaImLabel.textContent = im.toFixed(3);
            mode.setJuliaC(parseFloat(juliaRe.value), im);
        });

        // Reset view
        document.getElementById('fractalReset').addEventListener('click', () => {
            mode.resetView();
        });

        // Render initial
        mode.renderProgressive();
    }

    // --- Noise Mode Controls ---
    initNoiseMode() {
        const mode = this.currentMode;

        // Scene selector
        const sceneSelect = document.getElementById('noiseScene');
        sceneSelect.addEventListener('change', (e) => {
            mode.setScene(e.target.value);
        });

        // Octaves
        const octavesSlider = document.getElementById('noiseOctaves');
        const octavesLabel = document.getElementById('noiseOctavesLabel');
        octavesSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            mode.setOctaves(val);
            octavesLabel.textContent = val;
        });

        // Frequency
        const freqSlider = document.getElementById('noiseFrequency');
        const freqLabel = document.getElementById('noiseFreqLabel');
        freqSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setFrequency(val);
            freqLabel.textContent = val.toFixed(3);
        });

        // Persistence
        const persSlider = document.getElementById('noisePersistence');
        const persLabel = document.getElementById('noisePersLabel');
        persSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setPersistence(val);
            persLabel.textContent = val.toFixed(2);
        });

        // Lacunarity
        const lacSlider = document.getElementById('noiseLacunarity');
        const lacLabel = document.getElementById('noiseLacLabel');
        lacSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mode.setLacunarity(val);
            lacLabel.textContent = val.toFixed(1);
        });

        // Color theme
        const themeSelect = document.getElementById('noiseColorTheme');
        themeSelect.innerHTML = '';
        for (const [key, theme] of Object.entries(NoiseMode.THEMES)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = theme.name;
            themeSelect.appendChild(opt);
        }
        themeSelect.addEventListener('change', (e) => {
            mode.setColorTheme(e.target.value);
        });

        // Speed
        document.getElementById('noiseSpeed').addEventListener('input', (e) => {
            mode.setSpeed(parseFloat(e.target.value));
        });

        // Animation buttons
        document.getElementById('noisePlay').addEventListener('click', () => {
            mode.startAnimation();
        });

        document.getElementById('noisePause').addEventListener('click', () => {
            mode.stop();
        });

        document.getElementById('noiseReset').addEventListener('click', () => {
            mode.reset();
        });

        // Randomize seed
        document.getElementById('noiseSeed').addEventListener('click', () => {
            mode.randomizeSeed();
        });

        // Render initial scene
        mode.render();
    }

    // --- Global Actions ---
    exportCanvas() {
        downloadCanvas(this.canvas, `equation-art-${this.currentModeName}-${Date.now()}.png`);
    }

    toggleFullscreen() {
        const container = document.getElementById('canvasContainer');
        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => {
                setTimeout(() => this.resizeCanvas(), 100);
            });
        } else {
            document.exitFullscreen().then(() => {
                setTimeout(() => this.resizeCanvas(), 100);
            });
        }
    }
}

// --- Initialize on DOM ready ---
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();

    // Mode navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // Close mobile controls panel on mode switch
            const sidebar = document.querySelector('.controls-sidebar');
            const toggleBtn = document.getElementById('mobileControlsToggle');
            sidebar.classList.remove('open');
            toggleBtn.classList.remove('active');
            toggleBtn.textContent = '⚙️';

            app.switchMode(item.dataset.mode);
        });
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        app.exportCanvas();
    });

    // Fullscreen
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        app.toggleFullscreen();
    });

    // --- Mobile Controls Toggle ---
    const mobileToggle = document.getElementById('mobileControlsToggle');
    const controlsSidebar = document.querySelector('.controls-sidebar');

    mobileToggle.addEventListener('click', () => {
        const isOpen = controlsSidebar.classList.toggle('open');
        mobileToggle.classList.toggle('active', isOpen);
        mobileToggle.textContent = isOpen ? '✕' : '⚙️';
    });

    // Swipe-down to dismiss controls panel on mobile
    let touchStartY = 0;
    controlsSidebar.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    controlsSidebar.addEventListener('touchmove', (e) => {
        const deltaY = e.touches[0].clientY - touchStartY;
        if (deltaY > 60) {
            controlsSidebar.classList.remove('open');
            mobileToggle.classList.remove('active');
            mobileToggle.textContent = '⚙️';
        }
    }, { passive: true });
});

