document.addEventListener('DOMContentLoaded', () => {

    

    document.getElementById('primaryType').addEventListener('change', updatePrimaryParams);
    document.getElementById('secondaryType').addEventListener('change', updateSecondaryParams);
    document.getElementById('generate-button').addEventListener('click', generateCompoundDistribution);


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
            secondaryParams.innerHTML = `<p>Using variance from the primary distribution. <br> <strong>Note:</strong> Variance must be > 0.</p>`;
        }
    }
    
    function generateCompoundDistribution() {
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
            for (let i = 0; i < 1000; i++) {
                primarySamples.push(gammaSample(shape, rate));
            }
        } else if (primaryType === 'normal') {
            const mean = parseFloat(document.getElementById('normalMean').value);
            const variance = parseFloat(document.getElementById('normalVariance').value);
            if (variance <= 0) {
                alert("Variance must be positive for Normal distribution.");
                return;
            }
            for (let i = 0; i < 1000; i++) {
                primarySamples.push(normalSample(mean, Math.sqrt(variance)));
            }
        } else if (primaryType === 'uniform') {
            const min = parseFloat(document.getElementById('uniformMin').value);
            const max = parseFloat(document.getElementById('uniformMax').value);
            if (min >= max) {
                alert("Min must be less than Max for Uniform distribution.");
                return;
            }
            for (let i = 0; i < 1000; i++) {
                primarySamples.push(uniformSample(min, max));
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
                compoundSamples.push(normalSample(0, Math.sqrt(param))); // Mean is 0, variance from primary
            }
        });
    
        // Plot the compound distribution
        plotCompoundDistribution(compoundSamples);
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
    
    // Function to plot the compound distribution using Chart.js
    function plotCompoundDistribution(data) {
        const ctx = document.getElementById('compoundChart').getContext('2d');
    
        if (window.compoundChart instanceof Chart) {
            window.compoundChart.destroy();
        }
    
        const histData = createHistogram(data, 50); // Adjust the number of bins
    
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
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    }
                }
            }
        });
    }
    
    // Function to create histogram data from samples
    function createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
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
updatePrimaryParams();
updateSecondaryParams();
});