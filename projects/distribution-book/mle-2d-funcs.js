// script.js

document.addEventListener('DOMContentLoaded', () => {
    const plotButton = document.getElementById('plotButton');
    const distributionSelect = document.getElementById('distribution');
    const parameterRangesDiv = document.getElementById('parameterRanges');
    const logScaleCheckbox = document.getElementById('logScale');
    const colorSchemeSelect = document.getElementById('colorScheme');

    // Update parameter range inputs when distribution changes
    distributionSelect.addEventListener('change', updateParameterInputs);

    plotButton.addEventListener('click', plotLikelihood);

    // Initialize parameter inputs
    updateParameterInputs();

    function updateParameterInputs() {
        const distribution = distributionSelect.value;
        parameterRangesDiv.innerHTML = ''; // Clear previous inputs

        if (distribution === 'normal') {
            parameterRangesDiv.innerHTML = `
                <label>μ (mean) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="muMin" placeholder="Min μ">
                    <input type="number" id="muMax" placeholder="Max μ">
                </div>
                <label>σ (standard deviation) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="sigmaMin" placeholder="Min σ">
                    <input type="number" id="sigmaMax" placeholder="Max σ">
                </div>
            `;
        } else if (distribution === 'gamma' || distribution === 'invGamma') {
            parameterRangesDiv.innerHTML = `
                <label>α (shape parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="alphaMin" placeholder="Min α">
                    <input type="number" id="alphaMax" placeholder="Max α">
                </div>
                <label>β (rate parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="betaMin" placeholder="Min β">
                    <input type="number" id="betaMax" placeholder="Max β">
                </div>
            `;
        } else if (distribution === 'beta') {
            parameterRangesDiv.innerHTML = `
                <label>α (alpha parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="alphaMin" placeholder="Min α">
                    <input type="number" id="alphaMax" placeholder="Max α">
                </div>
                <label>β (beta parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="betaMin" placeholder="Min β">
                    <input type="number" id="betaMax" placeholder="Max β">
                </div>
            `;
        } else if (distribution === 'laplace') {
            parameterRangesDiv.innerHTML = `
                <label>μ (location parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="muMin" placeholder="Min μ">
                    <input type="number" id="muMax" placeholder="Max μ">
                </div>
                <label>b (scale parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="bMin" placeholder="Min b">
                    <input type="number" id="bMax" placeholder="Max b">
                </div>
            `;
        } else if (distribution === 'cauchy') {
            parameterRangesDiv.innerHTML = `
                <label>x₀ (location parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="x0Min" placeholder="Min x₀">
                    <input type="number" id="x0Max" placeholder="Max x₀">
                </div>
                <label>γ (scale parameter) Range:</label>
                <div class="parameter-range">
                    <input type="number" id="gammaMin" placeholder="Min γ">
                    <input type="number" id="gammaMax" placeholder="Max γ">
                </div>
            `;
        }
    }

    function plotLikelihood() {
        const distribution = distributionSelect.value;
        const dataInput = document.getElementById('data').value;
        const data = parseData(dataInput);

        if (data.length === 0) {
            alert('Please enter valid data points.');
            return;
        }
            // Show loading indicator
        Plotly.purge('plot'); // Clear any existing plot
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.paddingTop = '200px';
        loadingDiv.innerHTML = '<p>Loading...</p>';
        document.getElementById('plot').appendChild(loadingDiv);
        loadingDiv.innerHTML = '<div class="spinner"></div><p>Loading...</p>';

        const useLogScale = logScaleCheckbox.checked;
        const colorScheme = colorSchemeSelect.value;
        const granularityInput = parseInt(document.getElementById('granularity').value);
        const granularity = isNaN(granularityInput) || granularityInput < 50 ? 100 : granularityInput;
    
        if (distribution === 'normal') {
            plotNormalLikelihood(data, useLogScale, colorScheme, granularity);
        } else if (distribution === 'gamma') {
            plotGammaLikelihood(data, useLogScale, colorScheme, granularity);
        } else if (distribution === 'beta') {
            plotBetaLikelihood(data, useLogScale, colorScheme, granularity);
        } else if (distribution === 'laplace') {
            plotLaplaceLikelihood(data, useLogScale, colorScheme, granularity);
        } else if (distribution === 'cauchy') {
            plotCauchyLikelihood(data, useLogScale, colorScheme, granularity);
        } else if (distribution === 'invGamma') {
            plotInvGammaLikelihood(data, useLogScale, colorScheme, granularity);
        } else {
            alert('Selected distribution is not supported.');
        }
        document.getElementById('loading').remove();
    }

    function parseData(input) {
        return input.split(',')
                    .map(s => parseFloat(s.trim()))
                    .filter(x => !isNaN(x));
    }

    // Plotting functions for each distribution
    function plotNormalLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const muMin = parseFloat(document.getElementById('muMin').value) || (Math.min(...data) - 2);
        const muMax = parseFloat(document.getElementById('muMax').value) || (Math.max(...data) + 2);
        const sigmaMin = parseFloat(document.getElementById('sigmaMin').value) || 0.1;
        const sigmaMax = parseFloat(document.getElementById('sigmaMax').value) || 5;

        const muRange = linspace(muMin, muMax, granularity);
        const sigmaRange = linspace(sigmaMin, sigmaMax, granularity);

        const z = [];
        for (let i = 0; i < sigmaRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < muRange.length; j++) {
                const mu = muRange[j];
                const sigma = sigmaRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(normalPDF(x, mu, sigma)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(muRange, sigmaRange, z, 'μ (mean)', 'σ (standard deviation)', 'Log-Likelihood Heatmap for Normal Distribution', useLogScale, colorScheme);
    }

    function plotGammaLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const alphaMin = parseFloat(document.getElementById('alphaMin').value) || 0.1;
        const alphaMax = parseFloat(document.getElementById('alphaMax').value) || 10;
        const betaMin = parseFloat(document.getElementById('betaMin').value) || 0.1;
        const betaMax = parseFloat(document.getElementById('betaMax').value) || 10;

        const alphaRange = linspace(alphaMin, alphaMax, granularity);
        const betaRange = linspace(betaMin, betaMax, granularity);

        const z = [];
        for (let i = 0; i < betaRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < alphaRange.length; j++) {
                const alpha = alphaRange[j];
                const beta = betaRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(gammaPDF(x, alpha, beta)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(alphaRange, betaRange, z, 'α (shape parameter)', 'β (rate parameter)', 'Log-Likelihood Heatmap for Gamma Distribution', useLogScale, colorScheme);
    }

    function plotBetaLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const alphaMin = parseFloat(document.getElementById('alphaMin').value) || 0.1;
        const alphaMax = parseFloat(document.getElementById('alphaMax').value) || 10;
        const betaMin = parseFloat(document.getElementById('betaMin').value) || 0.1;
        const betaMax = parseFloat(document.getElementById('betaMax').value) || 10;

        const alphaRange = linspace(alphaMin, alphaMax, granularity);
        const betaRange = linspace(betaMin, betaMax, granularity);

        const z = [];
        for (let i = 0; i < betaRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < alphaRange.length; j++) {
                const alpha = alphaRange[j];
                const beta = betaRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(betaPDF(x, alpha, beta)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(alphaRange, betaRange, z, 'α (alpha parameter)', 'β (beta parameter)', 'Log-Likelihood Heatmap for Beta Distribution', useLogScale, colorScheme);
    }

    function plotLaplaceLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const muMin = parseFloat(document.getElementById('muMin').value) || (Math.min(...data) - 2);
        const muMax = parseFloat(document.getElementById('muMax').value) || (Math.max(...data) + 2);
        const bMin = parseFloat(document.getElementById('bMin').value) || 0.1;
        const bMax = parseFloat(document.getElementById('bMax').value) || 5;

        const muRange = linspace(muMin, muMax, granularity);
        const bRange = linspace(bMin, bMax, granularity);

        const z = [];
        for (let i = 0; i < bRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < muRange.length; j++) {
                const mu = muRange[j];
                const b = bRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(laplacePDF(x, mu, b)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(muRange, bRange, z, 'μ (location parameter)', 'b (scale parameter)', 'Log-Likelihood Heatmap for Laplace Distribution', useLogScale, colorScheme);
    }

    function plotCauchyLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const x0Min = parseFloat(document.getElementById('x0Min').value) || (Math.min(...data) - 2);
        const x0Max = parseFloat(document.getElementById('x0Max').value) || (Math.max(...data) + 2);
        const gammaMin = parseFloat(document.getElementById('gammaMin').value) || 0.1;
        const gammaMax = parseFloat(document.getElementById('gammaMax').value) || 5;

        const x0Range = linspace(x0Min, x0Max, granularity);
        const gammaRange = linspace(gammaMin, gammaMax, granularity);

        const z = [];
        for (let i = 0; i < gammaRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < x0Range.length; j++) {
                const x0 = x0Range[j];
                const gamma = gammaRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(cauchyPDF(x, x0, gamma)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(x0Range, gammaRange, z, 'x₀ (location parameter)', 'γ (scale parameter)', 'Log-Likelihood Heatmap for Cauchy Distribution', useLogScale, colorScheme);
    }

    function plotInvGammaLikelihood(data, useLogScale, colorScheme, granularity) {
        // Get parameter ranges from user inputs
        const alphaMin = parseFloat(document.getElementById('alphaMin').value) || 0.1;
        const alphaMax = parseFloat(document.getElementById('alphaMax').value) || 10;
        const betaMin = parseFloat(document.getElementById('betaMin').value) || 0.1;
        const betaMax = parseFloat(document.getElementById('betaMax').value) || 10;

        const alphaRange = linspace(alphaMin, alphaMax, granularity);
        const betaRange = linspace(betaMin, betaMax, granularity);

        const z = [];
        for (let i = 0; i < betaRange.length; i++) {
            z[i] = [];
            for (let j = 0; j < alphaRange.length; j++) {
                const alpha = alphaRange[j];
                const beta = betaRange[i];
                const logLikelihood = data.reduce((sum, x) => sum + Math.log(invGammaPDF(x, alpha, beta)), 0);
                z[i][j] = logLikelihood;
            }
        }

        plotHeatmap(alphaRange, betaRange, z, 'α (shape parameter)', 'β (scale parameter)', 'Log-Likelihood Heatmap for Inverse Gamma Distribution', useLogScale, colorScheme);
    }

    // Helper function to plot heatmaps
    function plotHeatmap(xRange, yRange, zData, xLabel, yLabel, title, useLogScale, colorScheme) {
        // Normalize z-values
        const maxZ = Math.max(...zData.flat());
        const minZ = Math.min(...zData.flat());
        const normalizedZ = zData.map(row => row.map(z => z - maxZ));

        let zToPlot = normalizedZ;

        if (useLogScale) {
            // Apply logarithmic scaling to the negative z-values
            zToPlot = normalizedZ.map(row => row.map(z => z < 0 ? Math.log(-z) : null));
        }

        const dataPlot = [{
            x: xRange,
            y: yRange,
            z: zToPlot,
            type: 'heatmap',
            colorscale: colorScheme,
            zsmooth: false,
            colorbar: { title: useLogScale ? 'Log(-ΔLL)' : 'ΔLL' },
            reversescale: false
        }];

        const layout = {
            title: title,
            xaxis: { title: xLabel },
            yaxis: { title: yLabel }
        };

        Plotly.newPlot('plot', dataPlot, layout);
    }

    // Probability density functions
    function normalPDF(x, mu, sigma) {
        const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
        const exponent = -((x - mu) ** 2) / (2 * sigma ** 2);
        return coeff * Math.exp(exponent);
    }

    function gammaPDF(x, alpha, beta) {
        if (x <= 0) return 1e-100; // Avoid log(0)
        const coeff = (beta ** alpha) / gammaFunc(alpha);
        return coeff * x ** (alpha - 1) * Math.exp(-beta * x);
    }

    function betaPDF(x, alpha, beta) {
        if (x <= 0 || x >= 1) return 1e-100; // Beta distribution is defined on (0,1)
        const coeff = gammaFunc(alpha + beta) / (gammaFunc(alpha) * gammaFunc(beta));
        return coeff * x ** (alpha - 1) * (1 - x) ** (beta - 1);
    }

    function laplacePDF(x, mu, b) {
        if (b <= 0) return 1e-100; // Scale parameter must be positive
        return (1 / (2 * b)) * Math.exp(-Math.abs(x - mu) / b);
    }

    function cauchyPDF(x, x0, gamma) {
        if (gamma <= 0) return 1e-100; // Scale parameter must be positive
        return (1 / (Math.PI * gamma)) * (gamma ** 2 / ((x - x0) ** 2 + gamma ** 2));
    }

    function invGammaPDF(x, alpha, beta) {
        if (x <= 0) return 1e-100; // Inverse Gamma is defined for x > 0
        const coeff = (beta ** alpha) / gammaFunc(alpha);
        return coeff * x ** (-alpha - 1) * Math.exp(-beta / x);
    }

    // Gamma function approximation (Lanczos approximation)
    function gammaFunc(z) {
        const g = 7;
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6,
            1.5056327351493116e-7
        ];
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFunc(1 - z));
        z -= 1;
        let x = p[0];
        for (let i = 1; i < g + 2; i++) {
            x += p[i] / (z + i);
        }
        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
    }

    function linspace(start, end, num) {
        const arr = [];
        const step = (end - start) / (num - 1);
        for (let i = 0; i < num; i++) {
            arr.push(start + step * i);
        }
        return arr;
    }
});
