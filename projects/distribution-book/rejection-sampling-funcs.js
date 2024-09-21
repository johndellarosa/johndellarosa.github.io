let alpha = 2;
    let beta = 5;
    const maxRange = 1;
    let totalSamples = 0;
    let acceptedSamples = 0;
    let numberOfBins = 10;  // Default number of bins
    let samples = [];
    let sampleMarkerSize = window.innerWidth < 600 ? 2 : 5;  // Smaller size for mobile screens



    const targetDistribution = (x, alpha, beta) => (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) / betaFunction(alpha, beta);  // Beta distribution
    const proposalDistribution = (x) => 1;  // Uniform distribution

    // Beta function for normalization constant
    const betaFunction = (alpha, beta) => (gamma(alpha) * gamma(beta)) / gamma(alpha + beta);

    // Gamma function for approximation
    function gamma(z) {
        const g = 7;
        const coefficients = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];

        if (z < 0.5) {
            return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
        } else {
            z -= 1;
            let x = coefficients[0];
            for (let i = 1; i < g + 2; i++) {
                x += coefficients[i] / (z + i);
            }
            const t = z + g + 0.5;
            return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
        }
    }

    // Function to calculate the mode of the Beta distribution
    const betaMode = (alpha, beta) => {
        if (alpha > 1 && beta > 1) {
            return (alpha - 1) / (alpha + beta - 2);
        } else if (alpha <= 1) {
            return 0;  // Mode at x = 0 if alpha <= 1
        } else {
            return 1;  // Mode at x = 1 if beta <= 1
        }
    };

    let modeValue = 0;
    let betaAtMode = 0;

    // Data for both charts
    const data = {
        labels: [],
        datasets: [
            { 
                label: 'Target Distribution (Beta)', 
                data: [], 
                borderColor: 'blue', 
                fill: true, 
                tension: 0.1, 
                type: 'line',  // Change to line type
                pointRadius:0.5,
                backgroundColor: '#0000FF10'
            },
            { 
                label: 'Proposal Distribution (Uniform)', 
                data: [], 
                borderColor: 'orange', 
                fill: false, 
                tension: 0.1, 
                type: 'line', // Change to line type
                pointRadius:0.5,
            },
            { 
                label: 'Accepted Samples', 
                data: [], 
                pointBackgroundColor: 'green', 
                showLine: false,
                pointRadius: sampleMarkerSize,
            },
            { 
                label: 'Rejected Samples', 
                data: [], 
                pointBackgroundColor: 'red', 
                showLine: false,
                pointRadius: sampleMarkerSize,
            }
        ]
    };

    // Histogram data
    const histogramData = {
        labels: Array.from({length: numberOfBins}, (_, i) => (i / numberOfBins).toFixed(2)),
        datasets: [
            {
                label: 'Sample Histogram',
                data: Array(numberOfBins).fill(0),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderWidth: 1
            }
        ]
    };

    const ctx = document.getElementById('rejectionSamplingChart').getContext('2d');
    const rejectionSamplingChart = new Chart(ctx, {
        type: 'scatter',
        data: data,
        options: {
            scales: {
                x: { type: 'linear', position: 'bottom', min: 0, max: maxRange },
                y: { min: 0, max: 3 }  // Adjust for the scaled proposal distribution
            }
        }
    });

    const histogramCtx = document.getElementById('histogramChart').getContext('2d');
    const histogramChart = new Chart(histogramCtx, {
        type: 'bar',
        data: histogramData,
        options: {
            scales: {
                x: { title: { display: true, text: 'X values' } },
                y: { beginAtZero: true, title: { display: true, text: 'Frequency' } }
            }
        }
    });

    // Function to update the target and proposal distributions based on new alpha and beta values
    function updateDistributions() {
        alpha = parseFloat(document.getElementById('alpha').value);
        beta = parseFloat(document.getElementById('beta').value);

        // Find mode of Beta distribution
        modeValue = betaMode(alpha, beta);
        betaAtMode = targetDistribution(modeValue, alpha, beta);

        data.datasets[0].data = [];
        data.datasets[1].data = [];

        // Regenerate data for Beta and scaled uniform distribution
        for (let x = 0; x <= maxRange; x += 0.01) {
            const betaVal = targetDistribution(x, alpha, beta);
            data.datasets[0].data.push({ x: x, y: betaVal });
            data.datasets[1].data.push({ x: x, y: betaAtMode });  // Flat uniform scaled by the Beta PDF at mode
        }

        // Reset acceptance rate and update chart
        totalSamples = 0;
        acceptedSamples = 0;
        samples = [];
        data.datasets[2].data = [];
        data.datasets[3].data = [];
        document.getElementById('acceptanceRate').innerText = '0';

        // Reset histogram
        histogramData.datasets[0].data.fill(0);
        updateHistogramBins();

        rejectionSamplingChart.options.scales.y.max = betaAtMode + 1;
        rejectionSamplingChart.update();
    }

    // Function to update histogram bins
    function updateHistogramBins() {
        numberOfBins = parseInt(document.getElementById('bins').value);
        histogramData.labels = Array.from({ length: numberOfBins }, (_, i) => (i / numberOfBins).toFixed(2));
        histogramData.datasets[0].data = Array(numberOfBins).fill(0);
    
        // Reassign the existing samples to the new bins
        samples.forEach(sample => {
            const bin = Math.floor(sample * numberOfBins);
            histogramData.datasets[0].data[bin] += 1;
        });
    
        histogramChart.update();
    }

    // Function to generate a single sample and update histogram
    function generateSample() {
        totalSamples++;
        const xSample = Math.random();  // Sample from uniform distribution [0,1]
        const ySample = Math.random() * betaAtMode;  // Sample y from scaled uniform [0, Beta(PDF at mode)]

        if (ySample <= targetDistribution(xSample, alpha, beta)) {
            // Accepted
            acceptedSamples++;
            data.datasets[2].data.push({ x: xSample, y: ySample });
            samples.push(xSample);

            // Update histogram
            const bin = Math.floor(xSample * numberOfBins);
            histogramData.datasets[0].data[bin] += 1;
            histogramChart.update();
        } else {
            // Rejected
            data.datasets[3].data.push({ x: xSample, y: ySample });
        }

        // Update the acceptance rate
        const acceptanceRate = (acceptedSamples / totalSamples) * 100;
        document.getElementById('acceptanceRate').innerText = acceptanceRate.toFixed(2);

        rejectionSamplingChart.update();
    }

    function generateMultipleSamples() {
        for (let i = 0; i < 25; i++) {
            generateSample();
        }
    }

document.addEventListener('DOMContentLoaded', () => {

    updateDistributions();

    });