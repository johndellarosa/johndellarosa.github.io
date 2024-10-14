document.addEventListener('DOMContentLoaded', () => {
  const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;
  let chartInstance;
  let dataPoints = [];

  function calculateSampleMoments(data) {
      const n = data.length;
      const mean = data.reduce((acc, val) => acc + val, 0) / n;
      const variance = data.reduce((acc, val) => acc + (val - mean) ** 2, 0) / n;

      return {
          mean: mean,
          variance: variance
      };
  }

  function estimateNormal(data) {
      const { mean, variance } = calculateSampleMoments(data);
      return {
          parameters: `μ = ${mean.toFixed(4)}, σ² = ${variance.toFixed(4)}`,
          mean: mean,
          variance: variance
      };
  }

  function estimateExponential(data) {
      const { mean } = calculateSampleMoments(data);
      const lambda = 1 / mean;
      return {
          parameters: `λ = ${lambda.toFixed(4)}`,
          lambda: lambda,
          mean: mean // Added mean for explanation
      };
  }

  function estimateGamma(data) {
      const { mean, variance } = calculateSampleMoments(data);
      const alpha = mean ** 2 / variance;
      const beta = variance / mean;
      return {
          parameters: `α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)}`,
          alpha: alpha,
          beta: beta,
          mean: mean,
          variance: variance
      };
  }

  function estimateBeta(data) {
      const { mean, variance } = calculateSampleMoments(data);
      // Ensure mean is between 0 and 1 for Beta distribution
      if (mean <= 0 || mean >= 1) {
          alert("For Beta distribution, the sample mean must be between 0 and 1.");
          return null;
      }
      const alpha = ((mean * (1 - mean)) / variance - 1) * mean;
      const betaParam = alpha * ((1 - mean) / mean);
      return {
          parameters: `α = ${alpha.toFixed(4)}, β = ${betaParam.toFixed(4)}`,
          alpha: alpha,
          beta: betaParam,
          mean: mean,
          variance: variance
      };
  }

  function estimateUniform(data) {
      const min = Math.min(...data);
      const max = Math.max(...data);
      return {
          parameters: `a = ${min.toFixed(4)}, b = ${max.toFixed(4)}`,
          a: min,
          b: max
      };
  }

  // New Estimation Function for Weibull Distribution
  function estimateWeibull(data) {
      const { mean, variance } = calculateSampleMoments(data);
      // Using method of moments to estimate shape (k) and scale (λ)
      // This requires numerical methods since moments are non-linear
      // For simplicity, use the following approximations:
      // k ≈ (mean^2) / variance
      // λ ≈ mean / Γ(1 + 1/k)
      // Note: For better accuracy, consider using optimization techniques.

      // Initial guess for k
      let k = 1.5;
      // Iterative approach to solve for k
      // Using the approximation mean = λ * Γ(1 + 1/k)
      // We'll use the Newton-Raphson method or similar
      // For simplicity, limit iterations
      const maxIterations = 100;
      const tolerance = 1e-6;
      let iteration = 0;
      let prevK = k;
      let lambda = mean / gammaFunc(1 + 1 / k);
      while (iteration < maxIterations) {
          lambda = mean / gammaFunc(1 + 1 / k);
          const estimatedMean = lambda * gammaFunc(1 + 1 / k);
          const estimatedVariance = lambda ** 2 * (gammaFunc(1 + 2 / k) - (gammaFunc(1 + 1 / k)) ** 2);
          const error = variance - estimatedVariance;
          // Estimate derivative dVariance/dk numerically
          const delta = 1e-5;
          const kPlus = k + delta;
          const lambdaPlus = mean / gammaFunc(1 + 1 / kPlus);
          const estimatedVariancePlus = lambdaPlus ** 2 * (gammaFunc(1 + 2 / kPlus) - (gammaFunc(1 + 1 / kPlus)) ** 2);
          const derivative = (estimatedVariancePlus - estimatedVariance) / delta;
          // Update k
          const newK = k - error / derivative;
          if (Math.abs(newK - k) < tolerance) {
              k = newK;
              break;
          }
          k = newK;
          iteration++;
      }

      if (iteration === maxIterations) {
          alert("Failed to converge while estimating Weibull parameters.");
          return null;
      }

      const finalLambda = mean / gammaFunc(1 + 1 / k);
      return {
          parameters: `k = ${k.toFixed(4)}, λ = ${finalLambda.toFixed(4)}`,
          k: k,
          lambda: finalLambda,
          mean: mean,
          variance: variance
      };
  }

  // New Estimation Function for Log-Normal Distribution
  function estimateLogNormal(data) {
      // Ensure all data points are positive
      if (data.some(x => x <= 0)) {
          alert("All data points must be positive for Log-Normal distribution.");
          return null;
      }
      const n = data.length;
      const logData = data.map(x => Math.log(x));
      const logMean = logData.reduce((acc, val) => acc + val, 0) / n;
      const logVariance = logData.reduce((acc, val) => acc + (val - logMean) ** 2, 0) / n;

      const mu = logMean;
      const sigma = Math.sqrt(logVariance);

      return {
          parameters: `μ = ${mu.toFixed(4)}, σ = ${sigma.toFixed(4)}`,
          mu: mu,
          sigma: sigma,
          mean: Math.exp(mu + sigma ** 2 / 2),
          variance: (Math.exp(sigma ** 2) - 1) * Math.exp(2 * mu + sigma ** 2)
      };
  }

  // Function to get moment explanations
  function getMomentExplanation(distribution, params) {
      let explanation = '';
      switch (distribution) {
          case "normal":
              explanation += `<strong>Normal Distribution:</strong><br>`;
              explanation += `The normal distribution has two parameters: mean (μ) and variance (σ²).<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Sample Variance (\\( \\, s^2 \\)) = ${params.variance.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( μ = \\bar{x} \\)<br>`;
              explanation += `\\( σ² = s^2 \\)<br>`;
              explanation += `Thus, \\( μ = ${params.mean.toFixed(4)} \\) and \\( σ² = ${params.variance.toFixed(4)} \\).<br>`;
              break;
          case "exponential":
              explanation += `<strong>Exponential Distribution:</strong><br>`;
              explanation += `The exponential distribution has one parameter: rate (λ).<br>`;
              explanation += `Sample Moment:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Method of Moments Equation:<br>`;
              explanation += `\\( \\frac{1}{λ} = \\bar{x} \\)<br>`;
              explanation += `Thus, \\( λ = \\frac{1}{${params.mean.toFixed(4)}} = ${(1 / params.mean).toFixed(4)} \\).<br>`;
              break;
          case "gamma":
              explanation += `<strong>Gamma Distribution:</strong><br>`;
              explanation += `The gamma distribution has two parameters: shape (α) and scale (β).<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} = αβ \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Sample Variance (\\( \\, s^2 = αβ^2 \\)) = ${params.variance.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( αβ = \\bar{x} \\)<br>`;
              explanation += `\\( αβ^2 = s^2 \\)<br>`;
              explanation += `Solving these gives:<br>`;
              explanation += `\\( α = \\frac{\\bar{x}^2}{s^2} = \\frac{${(params.mean).toFixed(4)}^2}{${params.variance.toFixed(4)}} = ${params.alpha.toFixed(4)} \\)<br>`;
              explanation += `\\( β = \\frac{s^2}{\\bar{x}} = \\frac{${params.variance.toFixed(4)}}{${params.mean.toFixed(4)}} = ${params.beta.toFixed(4)} \\)<br>`;
              break;
          case "beta":
              if (!params) {
                  explanation += `<strong>Beta Distribution:</strong><br>`;
                  explanation += `Cannot estimate parameters due to invalid sample mean for Beta distribution.<br>`;
                  break;
              }
              explanation += `<strong>Beta Distribution:</strong><br>`;
              explanation += `The beta distribution has two parameters: shape parameters α and β.<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Sample Variance (\\( \\, s^2 \\)) = ${params.variance.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( \\alpha = \\left( \\frac{\\bar{x}(1 - \\bar{x})}{s^2} - 1 \\right) \\bar{x} \\)<br>`;
              explanation += `\\( \\beta = \\alpha \\left( \\frac{1 - \\bar{x}}{\\bar{x}} \\right) \\)<br>`;
              explanation += `Thus, \\( \\alpha = ${params.alpha.toFixed(4)} \\) and \\( \\beta = ${params.beta.toFixed(4)} \\).<br>`;
              break;
          case "uniform":
              explanation += `<strong>Uniform Distribution:</strong><br>`;
              explanation += `The uniform distribution has two parameters: lower bound (a) and upper bound (b).<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Minimum (a) = ${params.a.toFixed(4)}<br>`;
              explanation += `Sample Maximum (b) = ${params.b.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( a = \\min(x_i) = ${params.a.toFixed(4)} \\)<br>`;
              explanation += `\\( b = \\max(x_i) = ${params.b.toFixed(4)} \\)<br>`;
              break;
          case "weibull":
              explanation += `<strong>Weibull Distribution:</strong><br>`;
              explanation += `The Weibull distribution has two parameters: shape (k) and scale (λ).<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Sample Variance (\\( \\, s^2 \\)) = ${params.variance.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( \\mu = \\lambda \\Gamma\\left(1 + \\frac{1}{k}\\right) \\)<br>`;
              explanation += `\\( \\sigma^2 = \\lambda^2 \\left[ \\Gamma\\left(1 + \\frac{2}{k}\\right) - \\left(\\Gamma\\left(1 + \\frac{1}{k}\\right)\\right)^2 \\right] \\)<br>`;
              explanation += `Solving these equations numerically gives:<br>`;
              explanation += `\\( k = ${params.k.toFixed(4)} \\) and \\( λ = ${params.lambda.toFixed(4)} \\).<br>`;
              break;
          case "lognormal":
              if (!params) {
                  explanation += `<strong>Log-Normal Distribution:</strong><br>`;
                  explanation += `Cannot estimate parameters due to invalid data for Log-Normal distribution.<br>`;
                  break;
              }
              explanation += `<strong>Log-Normal Distribution:</strong><br>`;
              explanation += `The log-normal distribution has two parameters: mean (μ) and standard deviation (σ) of the underlying normal distribution.<br>`;
              explanation += `Sample Moments:<br>`;
              explanation += `Sample Mean (\\( \\, \\bar{x} \\)) = ${params.mean.toFixed(4)}<br>`;
              explanation += `Sample Variance (\\( \\, s^2 \\)) = ${params.variance.toFixed(4)}<br>`;
              explanation += `Method of Moments Equations:<br>`;
              explanation += `\\( \\mu_X = e^{\\mu + \\frac{\\sigma^2}{2}} = ${params.mean.toFixed(4)} \\)<br>`;
              explanation += `\\( \\sigma_X^2 = \\left(e^{\\sigma^2} - 1\\right) e^{2\\mu + \\sigma^2} = ${params.variance.toFixed(4)} \\)<br>`;
              explanation += `Thus, \\( \\mu = ${params.mu.toFixed(4)} \\) and \\( \\sigma = ${params.sigma.toFixed(4)} \\).<br>`;
              break;
          default:
              explanation += `No explanation available for the selected distribution.`;
      }
      return explanation;
  }

  function plotDataAndDistribution(data, selectedDistributions, paramsList, minRange, maxRange, numBins) {
      const binWidth = (maxRange - minRange) / numBins;
      const bins = Array(numBins).fill(0);
  
      data.forEach(value => {
          if (value >= minRange && value <= maxRange) {
              const binIndex = Math.min(Math.floor((value - minRange) / binWidth), numBins - 1);
              bins[binIndex]++;
          }
      });
  
      const histogramX = Array.from({ length: numBins }, (_, i) => minRange + i * binWidth + binWidth / 2);
      const histogramY = bins.map(count => count / (data.length * binWidth)); // Normalize by bin width
  
      // Collect datasets for each selected distribution
      const datasets = [{
          label: 'Empirical Histogram',
          data: histogramY,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          type: 'bar',
      }];
  
      selectedDistributions.forEach((distribution, i) => {
          let estimatedY = [];
          const params = paramsList[i];
  
          if (distribution === "normal") {
              const { mean, variance } = params;
              estimatedY = histogramX.map(x => (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-((x - mean) ** 2) / (2 * variance)));
          } else if (distribution === "exponential") {
              const { lambda } = params;
              estimatedY = histogramX.map(x => x >= 0 ? lambda * Math.exp(-lambda * x) : 0);
          } else if (distribution === "gamma") {
              const { alpha, beta } = params;
              estimatedY = histogramX.map(x => x >= 0 ? (Math.pow(x, alpha - 1) * Math.exp(-x / beta)) / (Math.pow(beta, alpha) * gammaFunc(alpha)) : 0);
          } else if (distribution === "beta") {
              const { alpha, beta } = params;
              estimatedY = histogramX.map(x => (x >= 0 && x <= 1) ? Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / betaFunc(alpha, beta) : 0);
          } else if (distribution === "uniform") {
              const { a, b } = params;
              estimatedY = histogramX.map(x => (x >= a && x <= b) ? 1 / (b - a) : 0);
          }
          // New Distributions
          else if (distribution === "weibull") {
              const { k, lambda } = params;
              estimatedY = histogramX.map(x => x >= 0 ? (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k)) : 0);
          } else if (distribution === "lognormal") {
              const { mu, sigma } = params;
              estimatedY = histogramX.map(x => x > 0 ? (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma ** 2)) : 0);
          }
  
          datasets.push({
              label: `${distribution.charAt(0).toUpperCase() + distribution.slice(1)} PDF`,
              data: estimatedY,
              type: 'line',
              borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
              fill: false,
              tension: 0.4
          });
      });
  
      if (chartInstance) {
          chartInstance.destroy();
      }
  
      const ctx = document.getElementById('chart').getContext('2d');
      chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
              labels: histogramX,
              datasets: datasets
          },
          options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                  legend: {
                      display: true,
                      position: 'right'
                  }
              },
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
                          text: 'Density'
                      }
                  }
              }
          }
      });
  }

  function performMoM() {
      const selectedDistributions = Array.from(document.getElementById("distribution").selectedOptions).map(option => option.value);
      let minRange = parseFloat(document.getElementById("minRange").value);
      let maxRange = parseFloat(document.getElementById("maxRange").value);
      const numBins = parseInt(document.getElementById("numBins").value);
  
      if (dataPoints.length === 0 || isNaN(numBins)) {
          alert("Please enter some data points and a valid number of bins.");
          return;
      }
      // Default to sample min and max if fields are empty
      if (isNaN(minRange)) {
          minRange = Math.min(...dataPoints);
      }
      if (isNaN(maxRange)) {
          maxRange = Math.max(...dataPoints);
      }
  
      let paramsList = [];
      let resultText = '';
      let explanationText = '';
  
      selectedDistributions.forEach(distribution => {
          let result, params;
          switch (distribution) {
              case "normal":
                  result = estimateNormal(dataPoints);
                  params = { mean: result.mean, variance: result.variance };
                  break;
              case "exponential":
                  result = estimateExponential(dataPoints);
                  params = { lambda: result.lambda, mean: result.mean };
                  break;
              case "gamma":
                  result = estimateGamma(dataPoints);
                  params = { alpha: result.alpha, beta: result.beta, mean: result.mean, variance: result.variance };
                  break;
              case "beta":
                  result = estimateBeta(dataPoints);
                  if (!result) {
                      // Invalid parameters for Beta distribution
                      return; // Skip this distribution
                  }
                  params = { alpha: result.alpha, beta: result.beta, mean: result.mean, variance: result.variance };
                  break;
              case "uniform":
                  result = estimateUniform(dataPoints);
                  params = { a: result.a, b: result.b };
                  break;
              case "weibull":
                  result = estimateWeibull(dataPoints);
                  if (!result) {
                      // Estimation failed
                      return;
                  }
                  params = { k: result.k, lambda: result.lambda, mean: result.mean, variance: result.variance };
                  break;
              case "lognormal":
                  result = estimateLogNormal(dataPoints);
                  if (!result) {
                      // Estimation failed
                      return;
                  }
                  params = { mu: result.mu, sigma: result.sigma, mean: result.mean, variance: result.variance };
                  break;
              default:
                  alert("Unknown distribution.");
                  return;
          }
          paramsList.push(params);
          resultText += `${distribution.charAt(0).toUpperCase() + distribution.slice(1)}: ${result.parameters};\n`;
  
          // Get explanations
          explanationText += getMomentExplanation(distribution, params);
          explanationText += '<br>'; // Add space between explanations
      });
  
      // Update Output Section
      const outputSection = document.getElementById("outputSection");
      const outputLabel = document.getElementById("outputLabel");
      outputLabel.textContent = resultText;
      outputSection.style.display = "block";
  
      // Update Explanation Section
      const explanationSection = document.getElementById("explanationSection");
      const explanationContent = document.getElementById("explanationContent");
      explanationContent.innerHTML = explanationText;
      explanationSection.style.display = "block";
  
      // Trigger MathJax to render the equations
      MathJax.typesetPromise([explanationContent]).then(() => {
          console.log("MathJax typeset complete.");
      }).catch((err) => console.error("MathJax typeset failed: ", err));
  
      // Plot the data and distributions
      plotDataAndDistribution(dataPoints, selectedDistributions, paramsList, minRange, maxRange, numBins);
  }

  // Gamma function approximation for Gamma distribution PDF
  function gammaFunc(n) {
      return Math.exp(gammaLn(n));
  }

  function gammaLn(n) {
      const p = [
          1.000000000190015,
          76.18009172947146,
          -86.50532032941677,
          24.01409824083091,
          -1.231739572450155,
          0.001208650973866179,
          -0.000005395239384953
      ];
      let x = n;
      let y = n;
      let tmp = x + 5.5;
      tmp -= (x + 0.5) * Math.log(tmp);
      let ser = 1.000000000190015;
      for (let j = 1; j <= 6; j++) {
          ser += p[j] / ++y;
      }
      return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  // Beta function for Beta distribution PDF
  function betaFunc(alpha, beta) {
      return gammaFunc(alpha) * gammaFunc(beta) / gammaFunc(alpha + beta);
  }

  function addDataPoint() {
      const dataPointValue = document.getElementById('dataPoint').value.trim();
      const dataPoint = parseFloat(dataPointValue);
  
      console.log("Adding data point:", dataPointValue); // Debug output
  
      if (!isNaN(dataPoint)) {
          dataPoints.push(dataPoint);
          updateDataDisplay();
          updateChart();
          document.getElementById('dataPoint').value = ''; // Clear the input field after processing
      } else {
          console.error("Invalid data point entered:", dataPointValue); // Debug output
          alert("Please enter a valid number for the data point.");
      }
  }

  function updateDataDisplay() {
      const dataPointsList = document.getElementById('dataPointsList');
      dataPointsList.innerHTML = '';  // Clear existing content
  
      if (dataPoints.length > 0) {
          dataPoints.forEach((point, index) => {
              const pointButton = document.createElement('button');
              pointButton.textContent = point;
              pointButton.className = 'data-point-button'; // Class for styling
              pointButton.title = 'Click to remove this data point';
              pointButton.onclick = function() { removeDataPoint(index); }; // Attach event to remove data point
              dataPointsList.appendChild(pointButton);
          });
      } else {
          dataPointsList.textContent = 'None';
      }
  }

  function removeDataPoint(index) {
      dataPoints.splice(index, 1); // Remove the data point at the given index
      updateDataDisplay(); // Refresh the data display
      updateChart(); // Update the chart to reflect the new set of data points
  }

  function updateChart() {
      // Use dataPoints array instead of the whole data input from before
      if (dataPoints.length > 0) {
          performMoM(); // Perform MoM calculation and update the chart
      } else {
          if (chartInstance) chartInstance.destroy(); // Destroy the chart if no data points
  
          // Hide Explanations and Output Sections
          const outputSection = document.getElementById("outputSection");
          const outputLabel = document.getElementById("outputLabel");
          outputLabel.textContent = '';
          outputSection.style.display = "none";
  
          const explanationSection = document.getElementById("explanationSection");
          const explanationContent = document.getElementById("explanationContent");
          explanationContent.innerHTML = '';
          explanationSection.style.display = "none";
      }
  }

  function clearDataPoints() {
      dataPoints = []; // Clear the data array
      updateDataDisplay(); // Update the display to show no data points
      updateChart(); // Re-draw the chart with no data points
  }

  // Initialize Display
  updateDataDisplay(); // Initially show no data
  document.getElementById('addDataButton').onclick = addDataPoint; // Attach event handler for adding data
  document.getElementById('clearDataButton').onclick = clearDataPoints; // Attach event handler for clearing data
  document.getElementById('estimate-button').addEventListener('click', performMoM);
});
