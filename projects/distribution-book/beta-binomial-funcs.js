const ctx = document.getElementById('posteriorChart').getContext('2d');

    // Chart.js configuration
    const chartConfig = {
        type: 'line',
        data: {
            labels: [], // X-axis (theta values from 0 to 1)
            datasets: [
                {
                    label: 'Prior Distribution',
                    data: [],
                    borderColor: 'blue',
                    fill: false
                },
                {
                    label: 'Posterior Distribution',
                    data: [],
                    borderColor: 'red',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Theta (θ)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Density'
                    }
                }
            }
        }
    };

    const posteriorChart = new Chart(ctx, chartConfig);

    // Function to update the chart with new data
    function updateChart() {
        const successes = parseInt(document.getElementById('successes').value);
        const trials = parseInt(document.getElementById('trials').value);
        const alpha = parseFloat(document.getElementById('alpha').value);
        const beta = parseFloat(document.getElementById('beta').value);

        // X-axis: range of theta (0 to 1)
        const thetaValues = [];
        const step = 0.01;
        for (let theta = 0; theta <= 1; theta += step) {
            thetaValues.push(theta);
        }

        // Prior: Beta(alpha, beta)
        const priorData = thetaValues.map(theta => betaPDF(theta, alpha, beta));

        // Posterior: Beta(successes + alpha, trials - successes + beta)
        const alphaPost = successes + alpha;
        const betaPost = trials - successes + beta;
        const posteriorData = thetaValues.map(theta => betaPDF(theta, alphaPost, betaPost));

        // Update the chart
        posteriorChart.data.labels = thetaValues;
        posteriorChart.data.datasets[0].data = priorData;
        posteriorChart.data.datasets[1].data = posteriorData;
        posteriorChart.update();

        // Compute and display summary statistics
        displaySummaryStats(alphaPost, betaPost);
    }

    // Function to compute Beta distribution PDF
    function betaPDF(theta, alpha, beta) {
        if (theta < 0 || theta > 1) return 0;
        return (Math.pow(theta, alpha - 1) * Math.pow(1 - theta, beta - 1)) / betaFunc(alpha, beta);
    }

    // Custom Beta function using Gamma function
    function betaFunc(alpha, beta) {
        return (math.gamma(alpha) * math.gamma(beta)) / math.gamma(alpha + beta);
    }

    // Function to compute and display summary statistics for the posterior distribution
    function displaySummaryStats(alphaPost, betaPost) {
        const posteriorMean = alphaPost / (alphaPost + betaPost);
        const posteriorVariance = (alphaPost * betaPost) / (Math.pow(alphaPost + betaPost, 2) * (alphaPost + betaPost + 1));
        
        // Calculate the MAP estimate (Mode of Beta distribution)
        let posteriorMAP;
        if (alphaPost > 1 && betaPost > 1) {
            posteriorMAP = (alphaPost - 1) / (alphaPost + betaPost - 2);
        } else {
            posteriorMAP = "Undefined (Alpha or Beta <= 1)";
        }
        
        // Compute credible intervals
        const lowerCredible = jStat.beta.inv(0.025, alphaPost, betaPost);
        const upperCredible = jStat.beta.inv(0.975, alphaPost, betaPost);

        // Display the statistics
        document.getElementById('posterior-mean').innerHTML = posteriorMean.toFixed(4);
        document.getElementById('posterior-variance').innerHTML = posteriorVariance.toFixed(4);
        document.getElementById('posterior-map').innerHTML = typeof posteriorMAP === "string" ? posteriorMAP : posteriorMAP.toFixed(4);
        document.getElementById('credible-interval').innerHTML = `[${lowerCredible.toFixed(4)}, ${upperCredible.toFixed(4)}]`;
    }

document.addEventListener('DOMContentLoaded', () => {
    // Initial chart rendering
    updateChart();
  });

