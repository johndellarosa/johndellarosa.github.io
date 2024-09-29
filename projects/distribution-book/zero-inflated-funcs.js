document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('distType').addEventListener('change', updateDistributionInputs);
    document.getElementById('generate-mixture').addEventListener('click', generateMixture);

    // Function to update distribution inputs based on selection
    function updateDistributionInputs() {
        const distType = document.getElementById('distType').value;
        const parametersDiv = document.getElementById('parameters');
        parametersDiv.innerHTML = '';  // Clear previous parameters

        if (distType === 'binomial') {
            parametersDiv.innerHTML = `
                <label>Trials (n):</label>
                <input type="number" id="trials" value="10" inputmode="numeric">
                <label>Probability (p):</label>
                <input type="number" id="probability" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
            `;
        } else if (distType === 'negative_binomial') {
            parametersDiv.innerHTML = `
                <label>Successes (n):</label>
                <input type="number" id="successes" value="5" inputmode="numeric">
                <label>Probability (p):</label>
                <input type="number" id="probability" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
            `;
        } else if (distType === 'poisson') {
            parametersDiv.innerHTML = `
                <label>Rate (λ):</label>
                <input type="number" id="rate" value="3" inputmode="decimal">
            `;
        }
    }

    // Function to generate and plot the zero-inflated model
    function generateMixture() {
        const zeroInflationProb = parseFloat(document.getElementById('zeroInflationProbSlider').value);
        const distType = document.getElementById('distType').value;
        const xMin = parseInt(document.getElementById('xMin').value);
        const xMax = parseInt(document.getElementById('xMax').value);
        const yMin = 0;
        const yMax = 1;

        let component = {};
        if (distType === 'binomial') {
            const trials = parseInt(document.getElementById('trials').value);
            const probability = parseFloat(document.getElementById('probability').value);
            component = { distType, trials, probability };
        } else if (distType === 'negative_binomial') {
            const successes = parseInt(document.getElementById('successes').value); // number of successes
            const probability = parseFloat(document.getElementById('probability').value);
            component = { distType, successes, probability };
        } else if (distType === 'poisson') {
            const rate = parseFloat(document.getElementById('rate').value);
            component = { distType, rate };
        }

        // Generate the zero-inflated model data
        const mixtureData = generateMixtureData(component, zeroInflationProb, xMin, xMax);
        plotMixture(mixtureData, xMin, xMax, yMin, yMax);

        // console.log(mixtureData);
        // Display the PMF in LaTeX format
        displayPMFLaTeX(component, zeroInflationProb);

        // Calculate and display summary statistics
        // const stats = calculateSummaryStatistics(mixtureData);
        // document.getElementById('meanValue').innerText = stats.mean.toFixed(2);
        // document.getElementById('varianceValue').innerText = stats.variance.toFixed(2);
    }

    // Modified function to generate zero-inflated data with discrete distributions and custom x range
    function generateMixtureData(component, zeroInflationProb, xMin, xMax) {
        const xValues = [];
        const yValues = [];

        for (let x = xMin; x <= xMax; x++) {
            xValues.push(x);

            let mixtureY = 0;
            if (x === 0) {
                // Apply zero-inflation for P(0)
                if (component.distType === 'binomial') {
                    mixtureY = zeroInflationProb + (1 - zeroInflationProb) * binomialPMF(0, component.trials, component.probability);
                } else if (component.distType === 'negative_binomial') {
                    mixtureY = zeroInflationProb + (1 - zeroInflationProb) * negativeBinomialPMF(0, component.successes, component.probability);
                } else if (component.distType === 'poisson') {
                    mixtureY = zeroInflationProb + (1 - zeroInflationProb) * poissonPMF(0, component.rate);
                }
            } else {
                // Scale the probabilities for k >= 1 by (1 - pi)
                if (component.distType === 'binomial') {
                    mixtureY = (1 - zeroInflationProb) * binomialPMF(x, component.trials, component.probability);
                } else if (component.distType === 'negative_binomial') {
                    mixtureY = (1 - zeroInflationProb) * negativeBinomialPMF(x, component.successes, component.probability);
                } else if (component.distType === 'poisson') {
                    mixtureY = (1 - zeroInflationProb) * poissonPMF(x, component.rate);
                }
            }

            yValues.push(mixtureY);
        }

        return { xValues, yValues };
    }

// Function to display the PMF in LaTeX using MathJax with parameter substitution
function displayPMFLaTeX(component, zeroInflationProb) {
    let pmfLatex = '';
    const pi = zeroInflationProb.toFixed(3);  // Zero-inflation probability rounded to 2 decimals

    if (component.distType === 'binomial') {
        const n = component.trials;
        const p = component.probability.toFixed(3);  // Binomial probability rounded to 2 decimals

        pmfLatex = `
            P(X = x) = 
            \\begin{cases}
                ${pi} + (${1-pi}) \\binom{${n}}{0} ${p}^0 (${1-p})^{${n}} & \\text{if } x = 0 \\\\
                (${1-pi}) \\binom{${n}}{x} ${p}^x (${1-p})^{${n} - x} & \\text{if } x \\geq 1
            \\end{cases}
        `;
    } else if (component.distType === 'negative_binomial') {
        const n = component.successes;
        const p = component.probability.toFixed(3);  // Negative binomial probability rounded to 2 decimals

        pmfLatex = `
            P(X = x) = 
            \\begin{cases}
                ${pi} + (${1-pi}) \\binom{${n-1}}{0} ${p}^{${n}} & \\text{if } x = 0 \\\\
                (${1-pi}) \\binom{x + ${n-1}}{x} ${p}^{${n}} (${1-p})^x & \\text{if } x \\geq 1
            \\end{cases}
        `;
    } else if (component.distType === 'poisson') {
        const lambda = component.rate.toFixed(3);  // Poisson rate parameter rounded to 2 decimals

        pmfLatex = `
            P(X = x) = 
            \\begin{cases}
                ${pi} + (${1-pi}) \\frac{e^{-${lambda}} \\lambda^0}{0!} & \\text{if } x = 0 \\\\
                (${1-pi}) \\frac{e^{-${lambda}} \\lambda^x}{x!} & \\text{if } x \\geq 1
            \\end{cases}
        `;
    }

    document.getElementById('pmfFormula').innerHTML = `$$${pmfLatex}$$`;

    // Render the LaTeX using MathJax
    MathJax.typesetPromise();
}


    // Binomial PMF
    function binomialPMF(k, n, p) {
        if (k > n) return 0;  // k cannot be greater than n
        const binomCoeff = factorial(n) / (factorial(k) * factorial(n - k));
        return binomCoeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    // Negative Binomial PMF (Failures until n successes)
    function negativeBinomialPMF(k, n, p) {
        // k is the number of failures, n is the number of successes
        if (k < 0) return 0;
        const binomCoeff = factorial(k + n - 1) / (factorial(k) * factorial(n - 1));
        return binomCoeff * Math.pow(p, n) * Math.pow(1 - p, k);
    }

    // Poisson PMF
    function poissonPMF(k, lambda) {
        return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
    }

    // Factorial function (iterative)
    function factorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // Function to plot the zero-inflated model using Chart.js
function plotMixture(data, xMin, xMax, yMin, yMax) {
    const ctx = document.getElementById('mixtureChart').getContext('2d');

    // Check if mixtureChart already exists and is an instance of Chart, then destroy it
    if (window.mixtureChart instanceof Chart) {
        window.mixtureChart.destroy();
    }

    // Create a new Chart instance
    window.mixtureChart = new Chart(ctx, {
        type: 'bar',  // Using a bar chart for the discrete PMF
        data: {
            labels: data.xValues,  // x-values for the x-axis (integer values)
            datasets: [{
                label: 'Zero-Inflated Distribution',
                data: data.yValues,  // y-values for the probabilities
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'blue',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins:{
                legend:{
                    display:false,
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: xMin,  // Use user-defined xMin
                    max: xMax,  // Use user-defined xMax
                    title: {
                        display: true,
                        text: 'x'
                    },
                    ticks: {
                        stepSize: 1  // Ensure integer steps on the x-axis
                    }
                },
                y: {
                    min: yMin,  // Set yMin
                    max: yMax,  // Set yMax
                    title: {
                        display: true,
                        text: 'PMF'
                    }
                }
            }
        }
    });
}


    // Initialize with default values
    updateDistributionInputs();
});
