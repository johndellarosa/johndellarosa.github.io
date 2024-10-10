// script.js

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const distributionSelect = document.getElementById('distribution');
    const parameterSetsDiv = document.getElementById('parameterSets');
    const addCurveButton = document.getElementById('addCurve');
    const ctx = document.getElementById('pdfChart').getContext('2d');
  
    let pdfChart;
  
    // Initialize the chart
    function initializeChart() {
      pdfChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
        options: {
            plugins:{
                legend: {
                    display:false,
                }

            },
            responsive: true, // Enable responsiveness
            // maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'x',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Probability Density',
              },
            },
          },
        },
      });
  
      // Trigger initial setup
      distributionSelect.dispatchEvent(new Event('change'));
    }
  
    // Function to create a new parameter set
    function createParameterSet() {
    const distribution = distributionSelect.value;
    const paramSetId = 'paramSet' + Date.now(); // Unique ID based on timestamp

    // Create the parameter set container
    const parameterSetDiv = document.createElement('div');
    parameterSetDiv.className = 'parameter-set';
    parameterSetDiv.id = paramSetId;

    // Parameter set header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'parameter-set-header';

    const headerTitle = document.createElement('h2');
    headerTitle.textContent = `Curve ${parameterSetsDiv.childElementCount + 1}`;

    // Remove Button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      parameterSetsDiv.removeChild(parameterSetDiv);
      updateChart();
    });

    headerDiv.appendChild(headerTitle);
    headerDiv.appendChild(removeButton);

    // Parameter set body
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'parameter-set-body';

    const params = getParametersForDistribution(distribution);

    params.forEach(param => {
      const inputGroup = document.createElement('div');
      inputGroup.className = 'input-group';

      const label = document.createElement('label');
      label.for = param.id + '_' + paramSetId;
      label.innerHTML = `${param.label}:`;

      const input = document.createElement('input');
      input.type = 'number';
      input.id = param.id + '_' + paramSetId;
      input.value = param.value;
      input.step = param.step || '0.1';
      input.inputmode = 'decimal';
      if (param.min !== undefined) input.min = param.min;
      if (param.max !== undefined) input.max = param.max;

      inputGroup.appendChild(label);
      inputGroup.appendChild(input);
      bodyDiv.appendChild(inputGroup);
    });

    // Color Picker
    const colorGroup = document.createElement('div');
    colorGroup.className = 'input-group';

    const colorLabel = document.createElement('label');
    colorLabel.for = 'color_' + paramSetId;
    colorLabel.innerHTML = 'Color:';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'color_' + paramSetId;
    colorInput.value = getColor(parameterSetsDiv.childElementCount);

    colorGroup.appendChild(colorLabel);
    colorGroup.appendChild(colorInput);
    bodyDiv.appendChild(colorGroup);

    // Assemble the parameter set
    parameterSetDiv.appendChild(headerDiv);
    parameterSetDiv.appendChild(bodyDiv);

    parameterSetsDiv.appendChild(parameterSetDiv);

    // Attach event listeners to new inputs
    const inputs = parameterSetDiv.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', updateChart);
    });

    updateChart();
  }
  
    // Function to get parameters for the selected distribution
    function getParametersForDistribution(distribution) {
      switch (distribution) {
        case 'normal':
          return [
            { id: 'mean', label: 'Mean (μ)', value: '0' },
            { id: 'stddev', label: 'Std Dev (σ)', value: '1', min: '0.1' },
          ];
        case 'exponential':
          return [
            { id: 'lambda', label: 'Rate (λ)', value: '1', min: '0.1' },
          ];
        case 'gamma':
          return [
            { id: 'alpha', label: 'Shape (α)', value: '2', min: '0.1' },
            { id: 'theta', label: 'Scale (θ)', value: '2', min: '0.1' },
          ];
        case 'weibull':
          return [
            { id: 'lambda', label: 'Scale (λ)', value: '1', min: '0.1' },
            { id: 'kappa', label: 'Shape (κ)', value: '1.5', min: '0.1' },
          ];
        case 'gumbel':
          return [
            { id: 'mu', label: 'Location (μ)', value: '0' },
            { id: 'beta', label: 'Scale (β)', value: '1', min: '0.1' },
          ];
        case 'frechet':
          return [
            { id: 'alpha', label: 'Shape (α)', value: '3', min: '0.1' },
            { id: 'sigma', label: 'Scale (σ)', value: '1', min: '0.1' },
          ];
        case 'cauchy':
          return [
            { id: 'x0', label: 'Location (x₀)', value: '0' },
            { id: 'gamma', label: 'Scale (γ)', value: '1', min: '0.1' },
          ];
        case 'beta':
          return [
            { id: 'alpha', label: 'Alpha (α)', value: '2', min: '0.1' },
            { id: 'betaParam', label: 'Beta (β)', value: '5', min: '0.1' },
          ];
        case 'pareto':
          return [
            { id: 'xm', label: 'Scale (xₘ)', value: '1', min: '0.1' },
            { id: 'alpha', label: 'Shape (α)', value: '2', min: '0.1' },
          ];
        case 'lognormal':
          return [
            { id: 'mu', label: 'Location (μ)', value: '0' },
            { id: 'sigma', label: 'Scale (σ)', value: '0.25', min: '0.1' },
          ];
        case 'studentt':
          return [
            { id: 'nu', label: 'Degrees of Freedom (ν)', value: '5', min: '1', step: '1' },
          ];
        case 'genpareto':
          return [
            { id: 'mu', label: 'Location (μ)', value: '0' },
            { id: 'sigma', label: 'Scale (σ)', value: '1', min: '0.1' },
            { id: 'xi', label: 'Shape (ξ)', value: '0.5' },
          ];
        case 'laplace':
          return [
            { id: 'mu', label: 'Location (μ)', value: '0' },
            { id: 'b', label: 'Scale (b)', value: '1', min: '0.1' },
          ];
        case 'rayleigh':
          return [
            { id: 'sigma', label: 'Scale (σ)', value: '1', min: '0.1' },
          ];
        case 'betaprime':
          return [
            { id: 'alpha', label: 'Alpha (α)', value: '2', min: '0.1' },
            { id: 'betaParam', label: 'Beta (β)', value: '2', min: '0.1' },
          ];
        case 'burr':
          return [
            { id: 'c', label: 'Scale (c)', value: '1', min: '0.1' },
            { id: 'k', label: 'Shape (k)', value: '1', min: '0.1' },
          ];
        case 'logistic':
          return [
            { id: 'mu', label: 'Location (μ)', value: '0' },
            { id: 's', label: 'Scale (s)', value: '1', min: '0.1' },
          ];
        default:
          return [];
      }
    }
  
    // Function to update the chart
    function updateChart() {
      const distribution = distributionSelect.value;
  
      // Clear existing datasets
      pdfChart.data.datasets = [];
      let allXValues = [];
  
      const parameterSets = parameterSetsDiv.getElementsByClassName('parameter-set');
      for (let i = 0; i < parameterSets.length; i++) {
        const paramSetDiv = parameterSets[i];
        const paramSetId = paramSetDiv.id;
  
        // Collect parameter values
        const params = {};
        const inputs = paramSetDiv.getElementsByTagName('input');
        for (let input of inputs) {
          const paramName = input.id.split('_')[0];
          params[paramName] = input.type === 'color' ? input.value : parseFloat(input.value);
        }
  
        // Generate data based on distribution and parameters
        let xValues = [];
        let yValues = [];
  
        switch (distribution) {
          case 'normal':
            ({ xValues, yValues } = generateNormalData(params.mean, params.stddev));
            break;
          case 'exponential':
            ({ xValues, yValues } = generateExponentialData(params.lambda));
            break;
          case 'gamma':
            ({ xValues, yValues } = generateGammaData(params.alpha, params.theta));
            break;
          case 'weibull':
            ({ xValues, yValues } = generateWeibullData(params.lambda, params.kappa));
            break;
          case 'gumbel':
            ({ xValues, yValues } = generateGumbelData(params.mu, params.beta));
            break;
          case 'frechet':
            ({ xValues, yValues } = generateFrechetData(params.alpha, params.sigma));
            break;
          case 'cauchy':
            ({ xValues, yValues } = generateCauchyData(params.x0, params.gamma));
            break;
          case 'beta':
            ({ xValues, yValues } = generateBetaData(params.alpha, params.betaParam));
            break;
          case 'pareto':
            ({ xValues, yValues } = generateParetoData(params.xm, params.alpha));
            break;
          case 'lognormal':
            ({ xValues, yValues } = generateLogNormalData(params.mu, params.sigma));
            break;
          case 'studentt':
            ({ xValues, yValues } = generateStudentTData(params.nu));
            break;
          case 'genpareto':
            ({ xValues, yValues } = generateGenParetoData(params.mu, params.sigma, params.xi));
            break;
          case 'laplace':
            ({ xValues, yValues } = generateLaplaceData(params.mu, params.b));
            break;
          case 'rayleigh':
            ({ xValues, yValues } = generateRayleighData(params.sigma));
            break;
          case 'betaprime':
            ({ xValues, yValues } = generateBetaPrimeData(params.alpha, params.betaParam));
            break;
          case 'burr':
            ({ xValues, yValues } = generateBurrData(params.c, params.k));
            break;
          case 'logistic':
            ({ xValues, yValues } = generateLogisticData(params.mu, params.s));
            break;
          default:
            break;
        }
  
        // Merge xValues for consistent labels
        allXValues = mergeXValues(allXValues, xValues);
        
        // Add dataset for this parameter set
        pdfChart.data.datasets.push({
          label: `Curve ${i + 1}`,
          data: yValues,
          borderColor: params.color || getColor(i),
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        });
      }
  
      // Update labels
      pdfChart.data.labels = allXValues;
  
      // Update datasets to align with labels
      pdfChart.data.datasets.forEach((dataset, index) => {
        const paramSetDiv = parameterSets[index];
        const paramSetId = paramSetDiv.id;
        const params = {};
        const inputs = paramSetDiv.getElementsByTagName('input');
        for (let input of inputs) {
          const paramName = input.id.split('_')[0];
          params[paramName] = input.type === 'color' ? input.value : parseFloat(input.value);
        }
  
        let yValues = [];
  
        switch (distribution) {
          case 'normal':
            yValues = allXValues.map(x => normalPDF(x, params.mean, params.stddev));
            break;
          case 'exponential':
            yValues = allXValues.map(x => exponentialPDF(x, params.lambda));
            break;
          case 'gamma':
            yValues = allXValues.map(x => gammaPDF(x, params.alpha, params.theta));
            break;
          case 'weibull':
            yValues = allXValues.map(x => weibullPDF(x, params.lambda, params.kappa));
            break;
          case 'gumbel':
            yValues = allXValues.map(x => gumbelPDF(x, params.mu, params.beta));
            break;
          case 'frechet':
            yValues = allXValues.map(x => frechetPDF(x, params.alpha, params.sigma));
            break;
          case 'cauchy':
            yValues = allXValues.map(x => cauchyPDF(x, params.x0, params.gamma));
            break;
          case 'beta':
            yValues = allXValues.map(x => betaPDF(x, params.alpha, params.betaParam));
            break;
          case 'pareto':
            yValues = allXValues.map(x => paretoPDF(x, params.xm, params.alpha));
            break;
          case 'lognormal':
            yValues = allXValues.map(x => logNormalPDF(x, params.mu, params.sigma));
            break;
          case 'studentt':
            yValues = allXValues.map(x => studentTPDF(x, params.nu));
            break;
          case 'genpareto':
            yValues = allXValues.map(x => genParetoPDF(x, params.mu, params.sigma, params.xi));
            break;
          case 'laplace':
            yValues = allXValues.map(x => laplacePDF(x, params.mu, params.b));
            break;
          case 'rayleigh':
            yValues = allXValues.map(x => rayleighPDF(x, params.sigma));
            break;
          case 'betaprime':
            yValues = allXValues.map(x => betaPrimePDF(x, params.alpha, params.betaParam));
            break;
          case 'burr':
            yValues = allXValues.map(x => burrPDF(x, params.c, params.k));
            break;
          case 'logistic':
            yValues = allXValues.map(x => logisticPDF(x, params.mu, params.s));
            break;
          default:
            break;
        }
  
        dataset.data = yValues;
        dataset.borderColor = params.color || getColor(index);
      });
  
      pdfChart.update();
    }
  
    // Function to merge x-values from different datasets
    function mergeXValues(arr1, arr2) {
      const set = new Set([...arr1, ...arr2]);
      return Array.from(set).sort((a, b) => a - b);
    }
  
// Function to get color for the dataset
function getColor(index) {
    const colors = [
      '#007bff', // Blue
      '#dc3545', // Red
      '#28a745', // Green
      '#fd7e14', // Orange
      '#6f42c1', // Purple
      '#17a2b8', // Teal
      '#e83e8c', // Pink
      '#ffc107', // Yellow
      '#343a40', // Dark gray
      '#6610f2', // Indigo
      '#20c997', // Cyan
      '#ff851b', // Bright orange
      '#85144b', // Maroon
      '#3d9970', // Olive
      '#39cccc', // Light blue
    ];
    return colors[index % colors.length];
  }
  
    // Event listener for distribution selection
    distributionSelect.addEventListener('change', () => {
      // Clear existing parameter sets
      parameterSetsDiv.innerHTML = '';
      // Add a new parameter set
      createParameterSet();
    });
  
    // Event listener for adding a new curve
    addCurveButton.addEventListener('click', () => {
      createParameterSet();
    });
  
    // PDF Functions and Data Generators for Distributions
  
    // Normal Distribution
    function normalPDF(x, mean, stddev) {
      return (
        (1 / (stddev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2))
      );
    }
  
    function generateNormalData(mean, stddev) {
      const xValues = [];
      const yValues = [];
      const range = 4 * stddev;
      const step = (2 * range) / 100;
  
      for (let x = mean - range; x <= mean + range; x += step) {
        xValues.push(x);
        yValues.push(normalPDF(x, mean, stddev));
      }
  
      return { xValues, yValues };
    }
  
    // Exponential Distribution
    function exponentialPDF(x, lambda) {
      return x < 0 ? 0 : lambda * Math.exp(-lambda * x);
    }
  
    function generateExponentialData(lambda) {
      const xValues = [];
      const yValues = [];
      const maxX = 5 / lambda;
      const step = maxX / 100;
  
      for (let x = 0; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(exponentialPDF(x, lambda));
      }
  
      return { xValues, yValues };
    }
  
    // Gamma Distribution
    function gammaPDF(x, alpha, theta) {
      if (x < 0) return 0;
      return (
        (Math.pow(x, alpha - 1) * Math.exp(-x / theta)) /
        (Math.pow(theta, alpha) * gammaFunction(alpha))
      );
    }
  
    function generateGammaData(alpha, theta) {
      const xValues = [];
      const yValues = [];
      const maxX = alpha * theta * 3;
      const step = maxX / 100;
  
      for (let x = 0; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(gammaPDF(x, alpha, theta));
      }
  
      return { xValues, yValues };
    }
  
    // Weibull Distribution
    function weibullPDF(x, lambda, kappa) {
      if (x < 0) return 0;
      return (
        (kappa / lambda) *
        Math.pow(x / lambda, kappa - 1) *
        Math.exp(-Math.pow(x / lambda, kappa))
      );
    }
  
    function generateWeibullData(lambda, kappa) {
      const xValues = [];
      const yValues = [];
      const maxX = lambda * 5;
      const step = maxX / 100;
  
      for (let x = 0; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(weibullPDF(x, lambda, kappa));
      }
  
      return { xValues, yValues };
    }
  
    // Gumbel Distribution
    function gumbelPDF(x, mu, beta) {
      const z = (x - mu) / beta;
      return (1 / beta) * Math.exp(-(z + Math.exp(-z)));
    }
  
    function generateGumbelData(mu, beta) {
      const xValues = [];
      const yValues = [];
      const minX = mu - 6 * beta;
      const maxX = mu + 6 * beta;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(gumbelPDF(x, mu, beta));
      }
  
      return { xValues, yValues };
    }
  
    // Fréchet Distribution
    function frechetPDF(x, alpha, sigma) {
      if (x < 0) return 0;
      return (
        (alpha / sigma) *
        Math.pow(x / sigma, -1 - alpha) *
        Math.exp(-Math.pow(sigma / x, alpha))
      );
    }
  
    function generateFrechetData(alpha, sigma) {
      const xValues = [];
      const yValues = [];
      const minX = sigma;
      const maxX = sigma * 10;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(frechetPDF(x, alpha, sigma));
      }
  
      return { xValues, yValues };
    }
  
    // Cauchy Distribution
    function cauchyPDF(x, x0, gamma) {
      return (1 / (Math.PI * gamma)) * (gamma ** 2 / ((x - x0) ** 2 + gamma ** 2));
    }
  
    function generateCauchyData(x0, gamma) {
      const xValues = [];
      const yValues = [];
      const minX = x0 - 10 * gamma;
      const maxX = x0 + 10 * gamma;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(cauchyPDF(x, x0, gamma));
      }
  
      return { xValues, yValues };
    }
  
    // Beta Distribution
    function betaPDF(x, alpha, betaParam) {
      if (x < 0 || x > 1) return 0;
      return (
        (Math.pow(x, alpha - 1) * Math.pow(1 - x, betaParam - 1)) /
        betaFunction(alpha, betaParam)
      );
    }
  
    function generateBetaData(alpha, betaParam) {
      const xValues = [];
      const yValues = [];
      const step = 1 / 100;
  
      for (let x = 0; x <= 1; x += step) {
        xValues.push(x);
        yValues.push(betaPDF(x, alpha, betaParam));
      }
  
      return { xValues, yValues };
    }
  
    // Pareto Distribution
    function paretoPDF(x, xm, alpha) {
      if (x < xm) return 0;
      return (alpha * Math.pow(xm, alpha)) / Math.pow(x, alpha + 1);
    }
  
    function generateParetoData(xm, alpha) {
      const xValues = [];
      const yValues = [];
      const maxX = xm * 5;
      const step = (maxX - xm) / 100;
  
      for (let x = xm; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(paretoPDF(x, xm, alpha));
      }
  
      return { xValues, yValues };
    }
  
    // Log-normal Distribution
    function logNormalPDF(x, mu, sigma) {
      if (x <= 0) return 0;
      return (
        (1 / (x * sigma * Math.sqrt(2 * Math.PI))) *
        Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma ** 2))
      );
    }
  
    function generateLogNormalData(mu, sigma) {
      const xValues = [];
      const yValues = [];
      const minX = 0;
      const maxX = Math.exp(mu + 4 * sigma);
      const step = (maxX - minX) / 100;
  
      for (let x = minX + step; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(logNormalPDF(x, mu, sigma));
      }
  
      return { xValues, yValues };
    }
  
    // Student's t-Distribution
    function studentTPDF(x, nu) {
      const numerator = gammaFunction((nu + 1) / 2);
      const denominator =
        Math.sqrt(nu * Math.PI) * gammaFunction(nu / 2) * Math.pow(1 + (x ** 2) / nu, (nu + 1) / 2);
      return numerator / denominator;
    }
  
    function generateStudentTData(nu) {
      const xValues = [];
      const yValues = [];
      const maxX = 5;
      const step = (2 * maxX) / 100;
  
      for (let x = -maxX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(studentTPDF(x, nu));
      }
  
      return { xValues, yValues };
    }
  
    // Generalized Pareto Distribution
    function genParetoPDF(x, mu, sigma, xi) {
      if (sigma <= 0) return 0;
      if (xi === 0) {
        // Exponential distribution
        return x < mu ? 0 : (1 / sigma) * Math.exp(-(x - mu) / sigma);
      } else {
        if (x < mu || (xi < 0 && x > mu - sigma / xi)) return 0;
        return (1 / sigma) * Math.pow(1 + xi * (x - mu) / sigma, -1 / xi - 1);
      }
    }
  
    function generateGenParetoData(mu, sigma, xi) {
      const xValues = [];
      const yValues = [];
      const minX = mu;
      const maxX = xi >= 0 ? mu + sigma * 5 : mu - sigma / xi;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x < maxX; x += step) {
        xValues.push(x);
        yValues.push(genParetoPDF(x, mu, sigma, xi));
      }
  
      return { xValues, yValues };
    }
  
    // Laplace Distribution
    function laplacePDF(x, mu, b) {
      return (1 / (2 * b)) * Math.exp(-Math.abs(x - mu) / b);
    }
  
    function generateLaplaceData(mu, b) {
      const xValues = [];
      const yValues = [];
      const minX = mu - 10 * b;
      const maxX = mu + 10 * b;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(laplacePDF(x, mu, b));
      }
  
      return { xValues, yValues };
    }
  
    // Rayleigh Distribution
    function rayleighPDF(x, sigma) {
      if (x < 0) return 0;
      return (x / (sigma ** 2)) * Math.exp(-(x ** 2) / (2 * sigma ** 2));
    }
  
    function generateRayleighData(sigma) {
      const xValues = [];
      const yValues = [];
      const maxX = sigma * 5;
      const step = maxX / 100;
  
      for (let x = 0; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(rayleighPDF(x, sigma));
      }
  
      return { xValues, yValues };
    }
  
    // Beta Prime Distribution
    function betaPrimePDF(x, alpha, betaParam) {
      if (x <= 0) return 0;
      return (
        (Math.pow(x, alpha - 1) * Math.pow(1 + x, -alpha - betaParam)) /
        betaFunction(alpha, betaParam)
      );
    }
  
    function generateBetaPrimeData(alpha, betaParam) {
      const xValues = [];
      const yValues = [];
      const maxX = 10;
      const step = maxX / 100;
  
      for (let x = step; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(betaPrimePDF(x, alpha, betaParam));
      }
  
      return { xValues, yValues };
    }
  
    // Burr Distribution
    function burrPDF(x, c, k) {
      if (x <= 0) return 0;
      const numerator = c * k * Math.pow(x, c - 1);
      const denominator = Math.pow(1 + Math.pow(x, c), k + 1);
      return numerator / denominator;
    }
  
    function generateBurrData(c, k) {
      const xValues = [];
      const yValues = [];
      const maxX = 5;
      const step = maxX / 100;
  
      for (let x = step; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(burrPDF(x, c, k));
      }
  
      return { xValues, yValues };
    }
  
    // Logistic Distribution
    function logisticPDF(x, mu, s) {
      const expTerm = Math.exp(-(x - mu) / s);
      return expTerm / (s * Math.pow(1 + expTerm, 2));
    }
  
    function generateLogisticData(mu, s) {
      const xValues = [];
      const yValues = [];
      const minX = mu - 10 * s;
      const maxX = mu + 10 * s;
      const step = (maxX - minX) / 100;
  
      for (let x = minX; x <= maxX; x += step) {
        xValues.push(x);
        yValues.push(logisticPDF(x, mu, s));
      }
  
      return { xValues, yValues };
    }
  
    // Helper Functions
  
    // Gamma function approximation using Lanczos approximation
    function gammaFunction(z) {
      const g = 7;
      const p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
      ];
  
      if (z < 0.5) {
        // Reflection formula
        return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
      } else {
        z -= 1;
        let x = p[0];
        for (let i = 1; i < g + 2; i++) {
          x += p[i] / (z + i);
        }
        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
      }
    }
  
    // Beta function using gamma functions
    function betaFunction(a, b) {
      return gammaFunction(a) * gammaFunction(b) / gammaFunction(a + b);
    }
  
    // Initialize the chart on page load
    initializeChart();
  });
  