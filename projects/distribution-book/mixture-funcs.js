document.addEventListener('DOMContentLoaded', () => {

    

    document.getElementById('numComponents').addEventListener('input', generateComponentInputs);
    document.getElementById('generate-mixture').addEventListener('click', generateMixture);


    // document.getElementById('numComponents').addEventListener('input', generateComponentInputs);

    function generateComponentInputs() {
        const numComponents = parseInt(document.getElementById('numComponents').value);
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
                    <label>Weight:</label>
                    <input type="number" id="weight_${i}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                    <label>Mean:</label>
                    <input type="number" id="mean_${i}" value="${i}" >
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
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Mean:</label>
                <input type="number" id="mean_${index}" value="${index}" >
                <label>Variance:</label>
                <input type="number" id="variance_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'exponential') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Rate (λ):</label>
                <input type="number" id="rate_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'uniform') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Min:</label>
                <input type="number" id="min_${index}" value="0" >
                <label>Max:</label>
                <input type="number" id="max_${index}" value="1" >
            `;
        } else if (distType === 'beta') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Alpha (α):</label>
                <input type="number" id="alpha_${index}" value="2" inputmode="decimal">
                <label>Beta (β):</label>
                <input type="number" id="beta_${index}" value="2" inputmode="decimal">
            `;
        } else if (distType === 'gamma') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Shape (k):</label>
                <input type="number" id="shape_${index}" value="2" inputmode="decimal">
                <label>Rate (θ):</label>
                <input type="number" id="rate_${index}" value="1" inputmode="decimal">
            `;
        } else if (distType === 'laplace') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5" inputmode="decimal">
                <label>Location (μ):</label>
                <input type="number" id="location_${index}" value="0" >
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
            } else if (distType == 'beta'){
                const alpha = parseFloat(document.getElementById(`alpha_${i}`).value);
                const beta = parseFloat(document.getElementById(`beta_${i}`).value);
                components.push({ weight, distType, alpha, beta, color });
            } else if (distType == 'gamma'){
                const shape = parseFloat(document.getElementById(`shape_${i}`).value);
                const rate = parseFloat(document.getElementById(`rate_${i}`).value);
                components.push({ weight, distType, shape, rate, color });
            } else if (distType == 'laplace'){
                const location = parseFloat(document.getElementById(`location_${i}`).value);
                const scale = parseFloat(document.getElementById(`scale_${i}`).value);
                components.push({ weight, distType, location, scale, color });
            }
    
            weightSum += weight;
        }
    
        components.forEach(component => {
            component.weight /= weightSum;
        });
    
        const { mixtureData, componentData } = generateMixtureData(components);
        plotMixture(mixtureData, componentData, components, xMin, xMax, yMin, yMax);
    }
    
    // Generate mixture data from the component inputs
    function generateMixtureData(components) {
        const xValues = [];
        const yValues = [];
        let weightSum = 0;
        const componentYValues = components.map(() => []); 
        const xMin = parseFloat(document.getElementById('xMin').value);  // User-defined xMin
        const xMax = parseFloat(document.getElementById('xMax').value);  // User-defined xMax
        const interval = parseFloat(document.getElementById('interval').value);  // User-defined interval
    
        const numPoints = Math.ceil((xMax - xMin) / interval);  // Calculate number of points based on x-range and interval
        
    
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + i * interval;  // Generate x-values starting from xMin
            xValues.push(x);
    
            // Mixture distribution calculation
            let mixtureY = 0;
            components.forEach((component, index) => {
                let componentY = 0;
                if (component.distType === 'normal') {
                    componentY = component.weight * gaussianPDF(x, component.mean, Math.sqrt(component.variance));
                } else if (component.distType === 'exponential') {
                    componentY = component.weight * exponentialPDF(x, component.rate);
                } else if (component.distType === 'uniform') {
                    componentY = component.weight * uniformPDF(x, component.min, component.max);
                } else if (component.distType === 'beta') {
                    componentY = component.weight * betaPDF(x, component.alpha, component.beta);
                } else if (component.distType === 'gamma') {
                    componentY = component.weight * gammaPDF(x, component.shape, component.rate);
                } else if (component.distType === 'laplace') {
                    componentY = component.weight * laplacePDF(x, component.location, component.scale);
                }
                mixtureY += componentY;
                componentYValues[index].push(componentY);  // Store the individual component Y-values
            });
            
            yValues.push(mixtureY);
        }
    
        // return { xValues, yValues };
        return { mixtureData: { xValues, yValues }, componentData: { xValues, componentYValues } };
    }
    
    // Gaussian PDF
    function gaussianPDF(x, mean, stdDev) {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    }
    
    // Exponential PDF
    function exponentialPDF(x, rate) {
        return (x >= 0) ? rate * Math.exp(-rate * x) : 0;
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



    function plotMixture(mixtureData, componentData, components, xMin, xMax, yMin, yMax) {
        const ctx = document.getElementById('mixtureChart').getContext('2d');
    
        // Check if mixtureChart already exists and is an instance of Chart, then destroy it
        if (window.mixtureChart instanceof Chart) {
            window.mixtureChart.destroy();
        }
    
        // Prepare datasets for each component
        const componentDatasets = componentData.componentYValues.map((componentY, index) => ({
            label: `Component ${index + 1}`,
            data: componentY,
            borderColor: components[index].color,  // Use the selected color
            backgroundColor: components[index].color + '33',  // Transparent fill
            borderDash: [5, 5],  // Dashed line for component distributions
            fill: true,
            pointRadius: 1
        }));
    
        // Add the mixture distribution dataset
        const mixtureDataset = {
            label: 'Mixture Distribution',
            data: mixtureData.yValues,
            borderColor: 'blue',
            fill: false,
            pointRadius: 1
        };
    
        // Create a new Chart with custom bounds
        window.mixtureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: mixtureData.xValues,
                datasets: [mixtureDataset, ...componentDatasets]  // Include all component datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        min: xMin,  // Use user-defined xMin
                        max: xMax,  // Use user-defined xMax
                        title: {
                            display: true,
                            text: 'x'
                        }
                    },
                    y: {
                        min: yMin,  // Use user-defined yMin
                        max: yMax,  // Use user-defined yMax
                        title: {
                            display: true,
                            text: 'PDF'
                        }
                    }
                }
            }
        });
    }
    
    
    // Initialize the component inputs
    generateComponentInputs();
    
    
});