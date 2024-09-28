const ctx = document.getElementById('posteriorChart').getContext('2d');
let isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  
    // Chart.js configuration
    chartConfig = {
        type: 'line',
        data: {
            labels: [], // X-axis (theta values from 0 to 1)
            datasets: [
                {
                    label: 'Prior Distribution',
                    data: [],
                    borderColor: 'blue',
                    fill: false,
                    pointRadius: isMobile ? 0.25:1.5,
                    borderWidth: isMobile ? 1:2,
                },
                {
                    label: 'Posterior Distribution',
                    data: [],
                    borderColor: 'red',
                    fill: false,
                    pointRadius: isMobile ? 0.25:1.5,
                    borderWidth: isMobile ? 1:2,
                },
                {
                    label: 'Credible Interval',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Shaded region color
                    fill: true,
                    borderColor: 'rgba(255, 99, 132, 0)',
                    pointRadius: 0,
                }
            ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
              legend: {
                  display: true,
                  // position: isMobile?'right':'top'
              }},
            scales: {
                x: {
                    type: 'linear',
                    min: 0, // Set dynamically in updateChart()
                    max: 10, // Set dynamically in updateChart()
                    title: {
                        display: true,
                        text: 'Lambda (λ)'
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
        const sumEvents = parseInt(document.getElementById('sum-events').value);
        const nObservations = parseInt(document.getElementById('n-observations').value);
        const alpha = parseFloat(document.getElementById('alpha').value);
        const beta = parseFloat(document.getElementById('beta').value);

        // Prior and posterior parameters
        const alphaPost = alpha + sumEvents;
        const betaPost = beta + nObservations;

        // Calculate mean and variance of posterior
        const posteriorMean = alphaPost / betaPost;
        const posteriorVariance = alphaPost / Math.pow(betaPost, 2);

        // Dynamically set x-axis max based on posterior mean and variance
        const lambdaMax = posteriorMean + 4 * Math.sqrt(posteriorVariance); // Show 4 standard deviations around the mean

        // X-axis: range of lambda (0 to max value)
        const lambdaValues = [];
        const step = 0.1;
        for (let lambda = 0; lambda <= lambdaMax; lambda += step) {
            lambdaValues.push(lambda);
        }

        // Prior: Gamma(alpha, beta)
        const priorData = lambdaValues.map(lambda => jStat.gamma.pdf(lambda, alpha, 1 / beta));

        // Posterior: Gamma(alpha + sumEvents, beta + nObservations)
        const posteriorData = lambdaValues.map(lambda => jStat.gamma.pdf(lambda, alphaPost, 1 / betaPost));

        // Compute credible intervals
        const lowerCredible = jStat.gamma.inv(0.025, alphaPost, 1 / betaPost);
        const upperCredible = jStat.gamma.inv(0.975, alphaPost, 1 / betaPost);
        const credibleIntervalData = lambdaValues.map(lambda => {
            if (lambda >= lowerCredible && lambda <= upperCredible) {
                return jStat.gamma.pdf(lambda, alphaPost, 1 / betaPost); // Return PDF in the credible interval
            } else {
                return null; // Outside the credible interval
            }
        });

        // Update chart axis
        posteriorChart.options.scales.x.max = lambdaMax;

        // Update the chart
        posteriorChart.data.labels = lambdaValues;
        posteriorChart.data.datasets[0].data = priorData;
        posteriorChart.data.datasets[1].data = posteriorData;
        posteriorChart.data.datasets[2].data = credibleIntervalData; // Shaded credible interval
        posteriorChart.update();

        // Compute and display summary statistics
        displaySummaryStats(alphaPost, betaPost, lowerCredible, upperCredible);
    }

        // Function to compute Gamma distribution PDF
        function gammaPDF(lambda, alpha, beta) {
            if (lambda < 0) return 0;
            return (Math.pow(lambda, alpha - 1) * Math.exp(-lambda * beta)) / math.gamma(alpha) / Math.pow(beta, alpha);
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
    function displaySummaryStats(alphaPost, betaPost, lowerCredible, upperCredible) {
        const posteriorMean = alphaPost / betaPost;
        const posteriorVariance = alphaPost / Math.pow(betaPost, 2);
        
        // Calculate the MAP estimate (Mode of Gamma distribution)
        let posteriorMAP;
        if (alphaPost > 1) {
            posteriorMAP = (alphaPost - 1) / betaPost;
        } else {
            posteriorMAP = "Undefined (α <= 1)";
        }

        // Display the statistics
            // Display posterior alpha and beta
    document.getElementById('posterior-alpha').innerHTML = alphaPost.toFixed(4);
    document.getElementById('posterior-beta').innerHTML = betaPost.toFixed(4);
        document.getElementById('posterior-mean').innerHTML = posteriorMean.toFixed(4);
        document.getElementById('posterior-variance').innerHTML = posteriorVariance.toFixed(4);
        document.getElementById('posterior-map').innerHTML = typeof posteriorMAP === "string" ? posteriorMAP : posteriorMAP.toFixed(4);
        document.getElementById('credible-interval').innerHTML = `[${lowerCredible.toFixed(4)}, ${upperCredible.toFixed(4)}]`;
    }

document.addEventListener('DOMContentLoaded', () => {
    // Initial chart rendering
    updateChart();
  });

