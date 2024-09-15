document.addEventListener('DOMContentLoaded', () => {

    

    document.getElementById('primaryType').addEventListener('change', updatePrimaryParams);
    document.getElementById('secondaryType').addEventListener('change', updateSecondaryParams);
    document.getElementById('generate-button').addEventListener('click', generateCompoundDistribution);
    document.getElementById('export-data').addEventListener('click', exportData);


    function updatePrimaryParams() {
        const primaryType = document.getElementById('primaryType').value;
        const primaryParams = document.getElementById('primaryParams');
        primaryParams.innerHTML = ''; // Clear previous inputs
    
        // Display the input fields and support for each primary distribution
        if (primaryType === 'gamma') {
            primaryParams.innerHTML = `
                <label for="gammaShape">Shape (k):</label>
                <input type="number" id="gammaShape" value="2">
                <label for="gammaRate">Rate (θ):</label>
                <input type="number" id="gammaRate" value="2">
                <p><strong>Support:</strong> (0, ∞) (All outputs will be positive)</p>
            `;
        } else if (primaryType === 'normal') {
            primaryParams.innerHTML = `
                <label for="normalMean">Mean (μ):</label>
                <input type="number" id="normalMean" value="0">
                <label for="normalVariance">Variance (σ²):</label>
                <input type="number" id="normalVariance" value="1">
                <p><strong>Support:</strong> (-∞, ∞) (Outputs can be both positive and negative)</p>
            `;
        } else if (primaryType === 'uniform') {
            primaryParams.innerHTML = `
                <label for="uniformMin">Min:</label>
                <input type="number" id="uniformMin" value="0">
                <label for="uniformMax">Max:</label>
                <input type="number" id="uniformMax" value="1">
                <p><strong>Support:</strong> [min, max] (User-specified range)</p>
            `;
        }
        else if (primaryType === 'beta') {
            primaryParams.innerHTML = `
                <label for="betaAlpha">Alpha (α):</label>
                <input type="number" id="betaAlpha" value="2">
                <label for="betaBeta">Beta (β):</label>
                <input type="number" id="betaBeta" value="2">
                <p><strong>Support:</strong> (0, 1) (All outputs will be between 0 and 1)</p>
            `;
        } else if (primaryType === 'chiSquared') {
            primaryParams.innerHTML = `
                <label for="chiDF">Degrees of Freedom (k):</label>
                <input type="number" id="chiDF" value="2">
                <p><strong>Support:</strong> (0, ∞) (All outputs will be positive)</p>
            `;
        }
    }
    
    function updateSecondaryParams() {
        const secondaryType = document.getElementById('secondaryType').value;
        const secondaryParams = document.getElementById('secondaryParams');
        secondaryParams.innerHTML = ''; // Clear previous inputs
    
        // Display parameter information based on the secondary distribution
        if (secondaryType === 'poisson') {
            secondaryParams.innerHTML = `<p>Using λ from the primary distribution. <br> <strong>Note:</strong> λ must be > 0.</p>`;
        } else if (secondaryType === 'exponential') {
            secondaryParams.innerHTML = `<p>Using rate (λ) from the primary distribution. <br> <strong>Note:</strong> Rate must be > 0.</p>`;
        } else if (secondaryType === 'normal') {

            secondaryParams.innerHTML = `
            <label for="normalMean">Mean (μ):</label>
            <input type="number" id="normalMean" value="0">
            <p>Using variance from the primary distribution. <br> <strong>Note:</strong> Variance must be > 0.</p>
        `;
        } else if (secondaryType === 'binomial') {
            secondaryParams.innerHTML = `
            <label for="binomialN">n (number of trials):</label>
            <input type="number" id="binomialN" value="10">
            <p>Using probability (p) from the primary distribution. <br> <strong>Note:</strong> p must be between 0 and 1.</p>
        `;
            
        } else if (secondaryType === 'geometric') {
            secondaryParams.innerHTML = `<p>Using probability (p) from the primary distribution. <br> <strong>Note:</strong> p must be between 0 and 1.</p>`;
        }
    }
    
    function generateCompoundDistribution() {
        const numSimulations = parseInt(document.getElementById('numSimulations').value); // Get user input for number of simulations
        const numBins = parseInt(document.getElementById('numBins').value); // Get the number of bins
        const xMin = parseFloat(document.getElementById('xMin').value);
        const xMax = parseFloat(document.getElementById('xMax').value);
        const yMin = parseFloat(document.getElementById('yMin').value);
        const yMax = parseFloat(document.getElementById('yMax').value);
        const primaryType = document.getElementById('primaryType').value;
        const secondaryType = document.getElementById('secondaryType').value;
    
        let primarySamples = [];
    
        // Generate samples from the primary distribution
        if (primaryType === 'gamma') {
            const shape = parseFloat(document.getElementById('gammaShape').value);
            const rate = parseFloat(document.getElementById('gammaRate').value);
            if (shape <= 0 || rate <= 0) {
                alert("Gamma distribution parameters must be positive.");
                return;
            }
            for (let i = 0; i < numSimulations; i++) {
                primarySamples.push(gammaSample(shape, rate));
            }
        } else if (primaryType === 'normal') {
            const mean = parseFloat(document.getElementById('normalMean').value);
            const variance = parseFloat(document.getElementById('normalVariance').value);
            if (variance <= 0) {
                alert("Variance must be positive for Normal distribution.");
                return;
            }
            for (let i = 0; i < numSimulations; i++) {
                primarySamples.push(normalSample(mean, Math.sqrt(variance)));
            }
        } else if (primaryType === 'uniform') {
            const min = parseFloat(document.getElementById('uniformMin').value);
            const max = parseFloat(document.getElementById('uniformMax').value);
            if (min >= max) {
                alert("Min must be less than Max for Uniform distribution.");
                return;
            }
            for (let i = 0; i < numSimulations; i++) {
                primarySamples.push(uniformSample(min, max));
            }
            
        }   else if (primaryType === 'beta') {
            const alpha = parseFloat(document.getElementById('betaAlpha').value);
            const beta = parseFloat(document.getElementById('betaBeta').value);
            for (let i = 0; i < numSimulations; i++) {
                primarySamples.push(betaSample(alpha, beta));
            }
        } else if (primaryType === 'chiSquared') {
            const df = parseFloat(document.getElementById('chiDF').value);
            for (let i = 0; i < numSimulations; i++) {
                primarySamples.push(chiSquaredSample(df));
            }
        }

    
        // Generate the compound distribution samples based on the secondary distribution
        let compoundSamples = [];
        primarySamples.forEach(param => {
            if (secondaryType === 'poisson') {
                if (param <= 0) {
                    alert("λ (rate) must be positive for Poisson distribution.");
                    return;
                }
                compoundSamples.push(poissonSample(param));
            } else if (secondaryType === 'exponential') {
                if (param <= 0) {
                    alert("λ (rate) must be positive for Exponential distribution.");
                    return;
                }
                compoundSamples.push(exponentialSample(param));
            } else if (secondaryType === 'normal') {
                if (param <= 0) {
                    alert("Variance must be positive for Normal distribution.");
                    return;
                }
                const mean = parseFloat(document.getElementById('normalMean').value); // Get user input for mean
                compoundSamples.push(normalSample(mean, Math.sqrt(param))); // Mean from user, variance from primary
            } else if (secondaryType === 'binomial') {
                const n = parseInt(document.getElementById('binomialN').value); // Get user input for n
                compoundSamples.push(binomialSample(n, param)); // n from user, p from primary
      
            } else if (secondaryType === 'geometric') {
                compoundSamples.push(geometricSample(param)); // p from primary
            }
        });
    
        // Plot the compound distribution
        plotCompoundDistribution(compoundSamples, numBins, xMin, xMax, yMin, yMax);

        window.generatedData = compoundSamples;
        updateDistributionFormulas();
            // Calculate and display summary statistics
        const stats = calculateStatistics(compoundSamples);
        document.getElementById('meanStat').textContent = stats.mean.toFixed(4);
        document.getElementById('varianceStat').textContent = stats.variance.toFixed(4);
        document.getElementById('stdDevStat').textContent = stats.stdDev.toFixed(4);
        document.getElementById('minStat').textContent = stats.min.toFixed(4);
        document.getElementById('maxStat').textContent = stats.max.toFixed(4);
        document.getElementById('skewnessStat').textContent = stats.skewness.toFixed(4);
        document.getElementById('kurtosisStat').textContent = stats.kurtosis.toFixed(4);

    }
    
    // Function to calculate summary statistics, including skewness and kurtosis
    function calculateStatistics(data) {
        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...data);
        const max = Math.max(...data);

        // Skewness calculation
        const skewness = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / n;

        // Kurtosis calculation (subtract 3 for excess kurtosis)
        const kurtosis = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 4), 0) / n;
        // console.log("Generated Data:", data);
        // console.log("NumBins:", numBins, "xMin:", xMin, "xMax:", xMax, "yMin:", yMin, "yMax:", yMax);
        
        return { mean, variance, stdDev, min, max, skewness, kurtosis };
    }


    // Sampling functions for distributions
    function gammaSample(shape, rate) {
        let sum = 0;
        for (let i = 0; i < shape; i++) {
            sum += -Math.log(Math.random()) / rate;
        }
        return sum;
    }
    
    function normalSample(mean, stdDev) {
        let u = Math.random();
        let v = Math.random();
        let z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return mean + stdDev * z;
    }
    
    function uniformSample(min, max) {
        return min + (max - min) * Math.random();
    }
    
    function poissonSample(lambda) {
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1.0;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    }
    
    function exponentialSample(lambda) {
        return -Math.log(1 - Math.random()) / lambda;
    }

    function betaSample(alpha, beta) {
        const x = gammaSample(alpha, 1);
        const y = gammaSample(beta, 1);
        return x / (x + y); // Beta sample is X / (X + Y) where X ~ Gamma(alpha, 1), Y ~ Gamma(beta, 1)
    }
    
    function chiSquaredSample(df) {
        return gammaSample(df / 2, 2); // Chi-squared is a special case of Gamma(df / 2, 2)
    }
    
    function binomialSample(n, p) {
        let successes = 0;
        for (let i = 0; i < n; i++) {
            if (Math.random() < p) successes++;
        }
        return successes;
    }
    
    function geometricSample(p) {
        return Math.ceil(Math.log(1 - Math.random()) / Math.log(1 - p));
    }
    
    // Plot function with better axis range handling
function plotCompoundDistribution(data, numBins, xMin, xMax, yMin, yMax) {
    const ctx = document.getElementById('compoundChart').getContext('2d');

    if (window.compoundChart instanceof Chart) {
        window.compoundChart.destroy();
    }

    const histData = createHistogram(data, numBins); // Use the user-defined number of bins

    // Parse axis range inputs and fallback to automatic ranges if left blank or invalid
    const xMinValue = isNaN(xMin) || xMin === '' ? undefined : xMin;
    const xMaxValue = isNaN(xMax) || xMax === '' ? undefined : xMax;
    const yMinValue = isNaN(yMin) || yMin === '' ? undefined : yMin;
    const yMaxValue = isNaN(yMax) || yMax === '' ? undefined : yMax;

    window.compoundChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: histData.labels,
            datasets: [{
                label: 'Compound Distribution',
                data: histData.values,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    min: xMinValue,
                    max: xMaxValue,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                },
                y: {
                    min: yMinValue,
                    max: yMaxValue,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                }
            }
        }
    });
}
    
    function createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max === min) ? 1 : (max - min) / bins; // Prevent division by zero when min == max
        const histogram = Array(bins).fill(0);
    
        data.forEach(value => {
            const bin = Math.floor((value - min) / binWidth);
            if (bin >= 0 && bin < bins) {
                histogram[bin]++;
            }
        });
    
        const labels = Array(bins).fill().map((_, i) => (min + i * binWidth).toFixed(2));
        return { labels, values: histogram };
    }

    // Function to export the generated data as a CSV file
function exportData() {
    const data = window.generatedData;
    if (!data || data.length === 0) {
        alert('No data to export. Please generate the distribution first.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Sample\n";
    data.forEach(sample => {
        csvContent += sample + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'compound_distribution_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to update and render the PMF/PDF formulas using LaTeX
function updateDistributionFormulas() {
    const primaryType = document.getElementById('primaryType').value;
    const secondaryType = document.getElementById('secondaryType').value;

    let primaryLatex = '';
    let secondaryLatex = '';

    // Generate LaTeX for the primary distribution
    if (primaryType === 'gamma') {
        const shape = parseFloat(document.getElementById('gammaShape').value);
        const rate = parseFloat(document.getElementById('gammaRate').value);
        primaryLatex = `f(x; k, \\theta) = \\frac{x^{k-1} e^{-x / \\theta}}{\\theta^k \\Gamma(k)}, \\; k=${shape}, \\; \\theta=${rate}`;
    } else if (primaryType === 'normal') {
        const mean = parseFloat(document.getElementById('normalMean').value);
        const variance = parseFloat(document.getElementById('normalVariance').value);
        primaryLatex = `f(x; \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2 \\pi \\sigma^2}} e^{-\\frac{(x - \\mu)^2}{2 \\sigma^2}}, \\; \\mu=${mean}, \\; \\sigma^2=${variance}`;
    } else if (primaryType === 'uniform') {
        const min = parseFloat(document.getElementById('uniformMin').value);
        const max = parseFloat(document.getElementById('uniformMax').value);
        primaryLatex = `f(x; a, b) = \\frac{1}{b - a}, \\; a=${min}, \\; b=${max}`;
    }     else if (primaryType === 'beta') {
        const alpha = parseFloat(document.getElementById('betaAlpha').value);
        const beta = parseFloat(document.getElementById('betaBeta').value);
        primaryLatex = `f(x; \\alpha, \\beta) = \\frac{\\Gamma(\\alpha + \\beta)}{\\Gamma(\\alpha) \\Gamma(\\beta)} x^{\\alpha - 1} (1 - x)^{\\beta - 1}, \\; \\alpha=${alpha}, \\; \\beta=${beta}, \\; x \\in (0, 1)`;
    } else if (primaryType === 'chiSquared') {
        const df = parseFloat(document.getElementById('chiDF').value);
        primaryLatex = `f(x; k) = \\frac{1}{2^{k/2} \\Gamma(k/2)} x^{k/2 - 1} e^{-x/2}, \\; k=${df}, \\; x \\geq 0`;
    }


    // Generate LaTeX for the secondary distribution
    if (secondaryType === 'poisson') {
        secondaryLatex = `P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}, \\; \\lambda = \\text{from primary distribution}`;
    } else if (secondaryType === 'exponential') {
        secondaryLatex = `f(x; \\lambda) = \\lambda e^{-\\lambda x}, \\; \\lambda = \\text{from primary distribution}`;
    } else if (secondaryType === 'normal') {
        const mean = parseFloat(document.getElementById('normalMean').value);
        secondaryLatex = `f(x; \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2 \\pi \\sigma^2}} e^{-\\frac{(x - \\mu)^2}{2 \\sigma^2}}, \\; \\mu = \\text{user-specified}, \\sigma^2 = \\text{from primary distribution}`;
    }else if (secondaryType === 'binomial') {
        const n = parseFloat(document.getElementById('binomialN').value);
        secondaryLatex = `P(X=k) = \\binom{n}{k} p^k (1 - p)^{n - k}, \\; n=${n}, \\; p = \\text{from primary distribution}`;
    } else if (secondaryType === 'geometric') {
        secondaryLatex = `P(X=k) = (1 - p)^{k-1} p, \\; p = \\text{from primary distribution}`;
    }



    // Set the LaTeX in the HTML elements and render using MathJax
    document.getElementById('primaryPdfLatex').innerHTML = `\\[${primaryLatex}\\]`;
    document.getElementById('secondaryPdfLatex').innerHTML = `\\[${secondaryLatex}\\]`;

    // Re-render MathJax to update the displayed LaTeX
    MathJax.typeset();
}

updatePrimaryParams();
updateSecondaryParams();


// if (typeof MathJax === 'undefined') {
//     // Wait for MathJax to be available
//     setTimeout(updateDistributionFormulas, 1000);
//     return;
// }
if (typeof MathJax !== 'undefined') {
    updateDistributionFormulas();
} else {
    document.addEventListener('mathjax-ready', updateDistributionFormulas);
}
document.getElementById('primaryType').addEventListener('change', updateDistributionFormulas);
document.getElementById('secondaryType').addEventListener('change', updateDistributionFormulas);

// document.getElementById('gammaShape').addEventListener('input', updateDistributionFormulas);
// document.getElementById('gammaRate').addEventListener('input', updateDistributionFormulas);
// document.getElementById('normalMean').addEventListener('input', updateDistributionFormulas);
// document.getElementById('normalVariance').addEventListener('input', updateDistributionFormulas);
// document.getElementById('uniformMin').addEventListener('input', updateDistributionFormulas);
// document.getElementById('uniformMax').addEventListener('input', updateDistributionFormulas);



});