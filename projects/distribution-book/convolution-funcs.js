document.addEventListener('DOMContentLoaded', () => {

    

// Update the event listener for convolution
document.getElementById('generate-mixture').addEventListener('click', () => {
    const numComponents = 2//parseInt(document.getElementById('numComponents').value);
    const components = [];
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);

    for (let i = 1; i <= numComponents; i++) {
        const distType = document.getElementById(`distType_${i}`).value;
        const color = document.getElementById(`color_${i}`).value;  // Get the user-selected color

        if (distType === 'normal') {
            const mean = parseFloat(document.getElementById(`mean_${i}`).value);
            const variance = parseFloat(document.getElementById(`variance_${i}`).value);
            components.push({ distType, mean, variance, color });
        } else if (distType === 'exponential') {
            const rate = parseFloat(document.getElementById(`rate_${i}`).value);
            components.push({ distType, rate, color });
        } else if (distType === 'uniform') {
            const min = parseFloat(document.getElementById(`min_${i}`).value);
            const max = parseFloat(document.getElementById(`max_${i}`).value);
            components.push({ distType, min, max, color });
        } else if (distType === 'beta') {
            const alpha = parseFloat(document.getElementById(`alpha_${i}`).value);
            const beta = parseFloat(document.getElementById(`beta_${i}`).value);
            components.push({ distType, alpha, beta, color });
        } else if (distType === 'gamma') {
            const shape = parseFloat(document.getElementById(`shape_${i}`).value);
            const rate = parseFloat(document.getElementById(`rate_${i}`).value);
            components.push({ distType, shape, rate, color });
        } else if (distType === 'laplace') {
            const location = parseFloat(document.getElementById(`location_${i}`).value);
            const scale = parseFloat(document.getElementById(`scale_${i}`).value);
            components.push({ distType, location, scale, color });
        }
    }


    const convolutionData = generateConvolutionData(components);
    plotConvolutionAndComponents(convolutionData, components, xMin, xMax, yMin, yMax);
});

    // document.getElementById('numComponents').addEventListener('input', generateComponentInputs);

    function generateComponentInputs() {
        const numComponents = 2//parseInt(document.getElementById('numComponents').value);
        const componentInputs = document.getElementById('componentInputs');
        componentInputs.innerHTML = '';  // Clear previous inputs
    
        for (let i = 1; i <= numComponents; i++) {
            const div = document.createElement('div');
            div.classList.add('input-group');
            div.innerHTML = `
                <h3>Component ${i}</h3>
                <div class="input-field">
                    <label>Distribution:</label>
                    <select id="distType_${i}">
                        <option value="normal">Normal</option>
                        <option value="exponential">Exponential</option>
                        <option value="uniform">Uniform</option>
                        <option value="beta">Beta</option>
                        <option value="gamma">Gamma</option>
                        <option value="laplace">Laplace</option>
                    </select>
                </div>
                <div class="input-field" id="parameters_${i}">
                    <!-- Default: Normal distribution inputs -->
                    <label>Mean:</label>
                    <input type="number" id="mean_${i}" value="${i}" inputmode="decimal">
                    <label>Variance:</label>
                    <input type="number" id="variance_${i}" value="1" inputmode="decimal">
                </div>
                <div class="input-field">
                    <label>Color:</label>
                    <input type="color" id="color_${i}" value="#${Math.floor(Math.random() * 16777215).toString(16)}">
                </div>
            `;
            componentInputs.appendChild(div);
    
            document.getElementById(`distType_${i}`).addEventListener('change', function () {
                updateDistributionInputs(i);
            });
        }
    }
    
    // Function to update distribution inputs based on selection
    function updateDistributionInputs(index) {
        const distType = document.getElementById(`distType_${index}`).value;
        const parametersDiv = document.getElementById(`parameters_${index}`);
        parametersDiv.innerHTML = '';  // Clear previous parameters
    
        if (distType === 'normal') {
            parametersDiv.innerHTML = `
                <label>Mean:</label>
                <input type="number" id="mean_${index}" value="${index}" inputmode="decimal">
                <label>Variance:</label>
                <input type="number" id="variance_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'exponential') {
            parametersDiv.innerHTML = `
                <label>Rate (λ):</label>
                <input type="number" id="rate_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'uniform') {
            parametersDiv.innerHTML = `
                <label>Min:</label>
                <input type="number" id="min_${index}" value="0" inputmode="decimal">
                <label>Max:</label>
                <input type="number" id="max_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'beta') {
            parametersDiv.innerHTML = `
               <label>Alpha (α):</label>
                <input type="number" id="alpha_${index}" value="2" inputmode="decimal">
                <label>Beta (β):</label>
                <input type="number" id="beta_${index}" value="5" inputmode="decimal">
            `;
        } else if (distType === 'gamma') {
            parametersDiv.innerHTML = `
                <label>Shape (k):</label>
                <input type="number" id="shape_${index}" value="2" inputmode="decimal">
                <label>Rate (θ):</label>
                <input type="number" id="rate_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'laplace') {
            parametersDiv.innerHTML = `
                <label>Location (μ):</label>
                <input type="number" id="location_${index}" value="0" inputmode="decimal">
                <label>Scale (b):</label>
                <input type="number" id="scale_${index}" value="1" inputmode="decimal">
            `;
        }
    }
    
    function generateMixture() {
        const numComponents = parseInt(document.getElementById('numComponents').value);
        const components = [];
        let weightSum = 0;
        const xMin = parseFloat(document.getElementById('xMin').value);
        const xMax = parseFloat(document.getElementById('xMax').value);
        const yMin = parseFloat(document.getElementById('yMin').value);
        const yMax = parseFloat(document.getElementById('yMax').value);
    
        for (let i = 1; i <= numComponents; i++) {
            const distType = document.getElementById(`distType_${i}`).value;
            const weight = parseFloat(document.getElementById(`weight_${i}`).value);
            const color = document.getElementById(`color_${i}`).value;  // Get the user-selected color
    
            if (distType === 'normal') {
                const mean = parseFloat(document.getElementById(`mean_${i}`).value);
                const variance = parseFloat(document.getElementById(`variance_${i}`).value);
                components.push({ weight, distType, mean, variance, color });
            } else if (distType === 'exponential') {
                const rate = parseFloat(document.getElementById(`rate_${i}`).value);
                components.push({ weight, distType, rate, color });
            } else if (distType === 'uniform') {
                const min = parseFloat(document.getElementById(`min_${i}`).value);
                const max = parseFloat(document.getElementById(`max_${i}`).value);
                components.push({ weight, distType, min, max, color });
            }
    
            weightSum += weight;
        }
    
        components.forEach(component => {
            component.weight /= weightSum;
        });
    
        const { mixtureData, componentData } = generateMixtureData(components);
        plotMixture(mixtureData, componentData, components, xMin, xMax, yMin, yMax);
    }
    
    function generateConvolutionData(components) {
        const xValues = [];
        const componentYValues = [];
    
        const xMin = parseFloat(document.getElementById('xMin').value);  // User-defined xMin
        const xMax = parseFloat(document.getElementById('xMax').value);  // User-defined xMax
        const interval = parseFloat(document.getElementById('interval').value);  // User-defined interval
    
        // Calculate the number of points based on the x-range and interval
        const numPoints = Math.ceil((xMax - xMin) / interval);  
        
        // Generate x-values starting from xMin
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * interval;
            xValues.push(x);
        }
    
        // Calculate individual component PDFs
        components.forEach(component => {
            console.log(component);
            let componentY = [];
            if (component.distType === 'normal') {
                componentY = gaussianPDF(xValues, component.mean, Math.sqrt(component.variance));
            } else if (component.distType === 'exponential') {
                componentY = exponentialPDF(xValues, component.rate);
            } else if (component.distType === 'uniform') {
                componentY = xValues.map(x => uniformPDF(x, component.min, component.max));
            } else if (component.distType === 'beta') {
                
                componentY = xValues.map(x => betaPDF(x, component.alpha, component.beta));
            } else if (component.distType === 'gamma') {
                
                componentY = xValues.map(x => gammaPDF(x, component.shape, component.rate));
            } else if (component.distType === 'laplace') {
                componentY = xValues.map(x => laplacePDF(x, component.location, component.scale));
            }
            componentYValues.push(componentY);
        });
    
        // Convolve the components to get the final distribution
        let convolvedY = componentYValues[0];  // Start with the first component
        for (let i = 1; i < componentYValues.length; i++) {
            convolvedY = convolve(convolvedY, componentYValues[i], xValues);  // Convolve with the next component
        }
    
        return { xValues, convolvedY, componentYValues };
    }

// Convolution of two continuous PDFs using numerical integration approximation
function convolve(f, g, xValues) {
    const result = [];
    const dx = xValues[1] - xValues[0];  // Step size based on x-values
    const xMin = xValues[0];             // Starting x-value
    const N = xValues.length;

    for (let n = 0; n < N; n++) {
        let sum = 0;

        const x_n = xValues[n];

        for (let k = 0; k < N; k++) {
            const x_k = xValues[k];
            const x_m = x_n - x_k;  // x_m = x_n - x_k

            // Find index m such that xValues[m] == x_m
            const m = Math.round((x_m - xMin) / dx);

            // Check if m is within bounds
            if (m >= 0 && m < N) {
                sum += f[k] * g[m] * dx;
            }
        }

        result.push(sum);
    }

    return result;
}

    
   // Gaussian PDF function
function gaussianPDF(xValues, mean, stdDev) {
    return xValues.map(x => {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    });
}

// Exponential PDF function
function exponentialPDF(xValues, rate) {
    return xValues.map(x => (x >= 0) ? rate * Math.exp(-rate * x) : 0);
}

// Uniform PDF
function uniformPDF(x, min, max) {
    return (x >= min && x <= max) ? 1 / (max - min) : 0;
}


// Beta PDF
function betaPDF(x, alpha, beta) {
    if (x < 0 || x > 1) return 0;
    const B = (a, b) => (gammaFunction(a) * gammaFunction(b)) / gammaFunction(a + b);  // Beta function using Gamma function
    return (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) / B(alpha, beta);
}

// Gamma PDF
function gammaPDF(x, shape, rate) {
    if (x < 0) return 0;
    return (Math.pow(rate, shape) * Math.pow(x, shape - 1) * Math.exp(-rate * x)) / gammaFunction(shape);
}

// Laplace PDF
function laplacePDF(x, location, scale) {
    return (1 / (2 * scale)) * Math.exp(-Math.abs(x - location) / scale);
}

// Helper: Approximation of Gamma function for Beta and Gamma PDFs
function gammaFunction(z) {
    const g = 7;
    const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 
        771.32342877765313, -176.61502916214059, 12.507343278686905, 
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
    
    z -= 1;
    let x = C[0];
    for (let i = 1; i < g + 2; i++) {
        x += C[i] / (z + i);
    }
    
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}




function plotConvolutionAndComponents(convolutionData, components, xMin, xMax, yMin, yMax) {
    const ctx = document.getElementById('mixtureChart').getContext('2d');

    // Check if the chart already exists and destroy it
    if (window.mixtureChart instanceof Chart) {
        window.mixtureChart.destroy();
    }

    // Prepare datasets for individual components
    const componentDatasets = convolutionData.componentYValues.map((componentY, index) => ({
        label: `Component ${index + 1}`,
        data: componentY,
        borderColor: components[index].color,  // Use the selected color
        backgroundColor: components[index].color + '33',  // Transparent fill
        borderDash: [5, 5],  // Dashed line for component PDFs
        fill: true,
        pointRadius: 1,
        tension: 0.4  // Optional: smooth line
    }));

    // Dataset for the final convolved result
    const convolutionDataset = {
        label: 'Convolution',
        data: convolutionData.convolvedY,
        borderColor: 'blue',
        fill: false,
        pointRadius: 1,
        tension: 0.4  // Optional: smooth line
    };

    // Create a new Chart with custom bounds
    window.mixtureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: convolutionData.xValues,  // Use xValues for labels to reflect the correct x-axis range
            datasets: [convolutionDataset, ...componentDatasets]  // Include convolution and individual component datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    min: xMin,  // User-defined xMin
                    max: xMax,  // User-defined xMax
                    title: {
                        display: true,
                        text: 'x'
                    }
                },
                y: {
                    min: yMin,  // User-defined yMin
                    max: yMax,  // User-defined yMax
                    title: {
                        display: true,
                        text: 'PDF'
                    }
                }
            }
        }
    });
}

    
generateComponentInputs();

    
});