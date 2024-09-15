document.addEventListener('DOMContentLoaded', () => {

    

    document.getElementById('numComponents').addEventListener('input', generateComponentInputs);
    document.getElementById('generate-mixture').addEventListener('click', generateMixture);


    // document.getElementById('numComponents').addEventListener('input', generateComponentInputs);

    // Function to generate the input fields for each component
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
                    </select>
                </div>
                <div class="input-field" id="parameters_${i}">
                    <!-- Default: Normal distribution inputs -->
                    <label>Weight:</label>
                    <input type="number" id="weight_${i}" min="0" max="1" step="0.01" value="0.5">
                    <label>Mean:</label>
                    <input type="number" id="mean_${i}" value="${i}">
                    <label>Variance:</label>
                    <input type="number" id="variance_${i}" value="1">
                </div>
            `;
            componentInputs.appendChild(div);
    
            // Add event listener to handle distribution changes
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
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5">
                <label>Mean:</label>
                <input type="number" id="mean_${index}" value="${index}">
                <label>Variance:</label>
                <input type="number" id="variance_${index}" value="1">
            `;
        } else if (distType === 'exponential') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5">
                <label>Rate (λ):</label>
                <input type="number" id="rate_${index}" value="1">
            `;
        } else if (distType === 'uniform') {
            parametersDiv.innerHTML = `
                <label>Weight:</label>
                <input type="number" id="weight_${index}" min="0" max="1" step="0.01" value="0.5">
                <label>Min:</label>
                <input type="number" id="min_${index}" value="0">
                <label>Max:</label>
                <input type="number" id="max_${index}" value="1">
            `;
        }
    }
    
    // Function to generate and plot the mixture distribution
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
    
            if (distType === 'normal') {
                const mean = parseFloat(document.getElementById(`mean_${i}`).value);
                const variance = parseFloat(document.getElementById(`variance_${i}`).value);
                components.push({ weight, distType, mean, variance });
            } else if (distType === 'exponential') {
                const rate = parseFloat(document.getElementById(`rate_${i}`).value);
                components.push({ weight, distType, rate });
            } else if (distType === 'uniform') {
                const min = parseFloat(document.getElementById(`min_${i}`).value);
                const max = parseFloat(document.getElementById(`max_${i}`).value);
                components.push({ weight, distType, min, max });
            }
    
            weightSum += weight;
        }
    
        // Normalize weights
        components.forEach(component => {
            component.weight /= weightSum;
        });
    
        // Generate the mixture distribution
        // const mixtureData = generateMixtureData(components);
            // Generate the mixture distribution and component distributions
         const { mixtureData, componentData } = generateMixtureData(components);
    
        // Plot the mixture distribution
        // plotMixture(mixtureData, xMin, xMax, yMin, yMax);
            // Plot the mixture distribution and components
    plotMixture(mixtureData, componentData, xMin, xMax, yMin, yMax);
    }
    
    // Generate mixture data from the component inputs
    function generateMixtureData(components) {
        const xValues = [];
        const yValues = [];
        const componentYValues = components.map(() => []); 
        const numPoints = 100;
    
        for (let i = 0; i <= numPoints; i++) {
            const x = i / 10;  // Scale x-values
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
    
    // Plot the mixture distribution using Chart.js
    function plotMixture(mixtureData, componentData, xMin, xMax, yMin, yMax) {
        const ctx = document.getElementById('mixtureChart').getContext('2d');
    
        // Check if mixtureChart already exists and is an instance of Chart, then destroy it
        if (window.mixtureChart instanceof Chart) {
            window.mixtureChart.destroy();
        }

            // Prepare datasets for each component
        const componentDatasets = componentData.componentYValues.map((componentY, index) => ({
            label: `Component ${index + 1}`,
            data: componentY,
            borderColor: `hsl(${index * 60}, 100%, 50%)`,  // Assign different colors
            backgroundColor: `hsla(${index * 60}, 100%, 50%, 0.2)`,  // Set a transparent fill color with alpha
       
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
    
        // // Create a new Chart with custom bounds
        // window.mixtureChart = new Chart(ctx, {
        //     type: 'line',
        //     data: {
        //         labels: data.xValues,
        //         datasets: [{
        //             label: 'Mixture Distribution',
        //             data: data.yValues,
        //             borderColor: 'blue',
        //             fill: false
        //         }]
        //     },
        //     options: {
        //         responsive: true,
        //         scales: {
        //             x: {
        //                 min: xMin,  // Use user-defined xMin
        //                 max: xMax,  // Use user-defined xMax
        //                 title: {
        //                     display: true,
        //                     text: 'x'
        //                 }
        //             },
        //             y: {
        //                 min: yMin,  // Use user-defined yMin
        //                 max: yMax,  // Use user-defined yMax
        //                 title: {
        //                     display: true,
        //                     text: 'PDF'
        //                 }
        //             }
        //         }
        //     }
        // });
    }
    
    // Initialize the component inputs
    generateComponentInputs();
    
    
});