let path = [];
let dataPoints = [];
let costValues = [];
let isHeatmap = true;
let currentDistribution = 'normal';

        const distributions = {
            normal: {
                parameters: ['mu', 'sigma'],
                initialGuess: [0, 1],
                boundaries: {
                    muMin: -5,
                    muMax: 10,
                    sigmaMin: 0.1,
                    sigmaMax: 10
                },
                sample: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    return sampleNormal(mu, sigma);
                },
                nll: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    let sum = 0;
                    for (let x of dataPoints) {
                        sum += Math.log(sigma) + ((x - mu) ** 2) / (2 * sigma ** 2);
                    }
                    return sum;
                },
                gradients: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    let dMu = 0;
                    let dSigma = 0;
                    for (let x of dataPoints) {
                        dMu += (mu - x) / (sigma ** 2);
                        dSigma += (1 / sigma) - ((x - mu) ** 2) / (sigma ** 3);
                    }
                    return [dMu, dSigma];
                },
                parameterConstraints: function(params) {
                    // Ensure sigma remains positive
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            },
            
            gamma: {
                parameters: ['alpha', 'beta'],
                initialGuess: [1, 1],
                boundaries: {
                    alphaMin: 0.1,
                    alphaMax: 10,
                    betaMin: 0.1,
                    betaMax: 10
                },
                sample: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    return sampleGamma(alpha, 1 / beta); // θ = 1 / β
                },
                nll: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    const n = dataPoints.length;
                    let sumLogX = 0;
                    let sumX = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) return Infinity;
                        sumLogX += Math.log(x);
                        sumX += x;
                    }
                    return n * lnGamma(alpha) - n * alpha * Math.log(beta) - (alpha - 1) * sumLogX + beta * sumX;
                },
                gradients: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    const n = dataPoints.length;
                    let sumLogX = 0;
                    let sumX = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) continue;
                        sumLogX += Math.log(x);
                        sumX += x;
                    }
                    const dAlpha = n * digamma(alpha) - n * Math.log(beta) - sumLogX;
                    const dBeta = beta > 0 ? (sumX - n * alpha / beta) : 0;
                    return [dAlpha, dBeta];
                },
                parameterConstraints: function(params) {
                    // alpha and beta must be positive
                    params[0] = Math.max(params[0], 1e-6);
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            },
            
            beta: {
                parameters: ['alpha', 'beta'],
                initialGuess: [2, 2], // Adjusted for better starting points
                boundaries: {
                    alphaMin: 0.1,
                    alphaMax: 10,
                    betaMin: 0.1,
                    betaMax: 10
                },
                sample: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    return sampleBeta(alpha, beta);
                },
                nll: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    const n = dataPoints.length;
                    let sumLogX = 0;
                    let sumLog1MinusX = 0;
                    for (let x of dataPoints) {
                        if (x <= 0 || x >= 1) return Infinity;
                        sumLogX += Math.log(x);
                        sumLog1MinusX += Math.log(1 - x);
                    }
                    return n * (lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta)) - (alpha - 1) * sumLogX - (beta - 1) * sumLog1MinusX;
                },
                gradients: function(params) {
                    const alpha = params[0];
                    const beta = params[1];
                    const n = dataPoints.length;
                    let sumLogX = 0;
                    let sumLog1MinusX = 0;
                    for (let x of dataPoints) {
                        if (x <= 0 || x >= 1) continue;
                        sumLogX += Math.log(x);
                        sumLog1MinusX += Math.log(1 - x);
                    }
                    const dAlpha = n * (digamma(alpha) - digamma(alpha + beta)) - sumLogX;
                    const dBeta = n * (digamma(beta) - digamma(alpha + beta)) - sumLog1MinusX;
                    return [dAlpha, dBeta];
                },
                parameterConstraints: function(params) {
                    // alpha and beta must be positive
                    params[0] = Math.max(params[0], 1e-6);
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            }
            ,
            lognormal: {
                parameters: ['mu', 'sigma'],
                initialGuess: [0, 1],
                boundaries: {
                    muMin: -5,
                    muMax: 10,
                    sigmaMin: 0.1,
                    sigmaMax: 10
                },
                sample: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    return sampleLogNormal(mu, sigma);
                },
                nll: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    let sum = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) return Infinity;
                        sum += Math.log(x * sigma * Math.sqrt(2 * Math.PI)) + ((Math.log(x) - mu) ** 2) / (2 * sigma ** 2);
                    }
                    return sum;
                },
                gradients: function(params) {
                    const mu = params[0];
                    const sigma = params[1];
                    let dMu = 0;
                    let dSigma = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) continue;
                        const logX = Math.log(x);
                        dMu += (mu - logX) / (sigma ** 2);
                        dSigma += ((mu - logX) ** 2 - sigma ** 2) / (sigma ** 3) + 1 / sigma;
                    }
                    return [dMu, dSigma];
                },
                parameterConstraints: function(params) {
                    // sigma must be positive
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            },
            exponential: {
                parameters: ['mu', 'beta'],
                initialGuess: [0, 1],
                boundaries: {
                    muMin: Math.min(...dataPoints) - 5,
                    muMax: Math.max(...dataPoints) + 5,
                    betaMin: 0.1,
                    betaMax: 10
                },
                sample: function(params) {
                    const mu = params[0];
                    const beta = params[1];
                    return mu + sampleExponential(beta);
                },
                nll: function(params) {
                    const mu = params[0];
                    const beta = params[1];
                    let sumXMinusMu = 0;
                    for (let x of dataPoints) {
                        if (x < mu) return Infinity;
                        sumXMinusMu += (x - mu);
                    }
                    const n = dataPoints.length;
                    return n * Math.log(beta) + beta * sumXMinusMu;
                },
                gradients: function(params) {
                    const mu = params[0];
                    const beta = params[1];
                    let sumXMinusMu = 0;
                    for (let x of dataPoints) {
                        if (x < mu) continue;
                        sumXMinusMu += (x - mu);
                    }
                    const n = dataPoints.length;
                    const dMu = -beta * n;
                    const dBeta = n / beta + sumXMinusMu;
                    return [dMu, dBeta];
                },
                parameterConstraints: function(params) {
                    // beta must be positive
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            },
            weibull: {
                parameters: ['k', 'lambda'],
                initialGuess: [1, 1],
                boundaries: {
                    kMin: 0.1,
                    kMax: 10,
                    lambdaMin: 0.1,
                    lambdaMax: 10
                },
                sample: function(params) {
                    const k = params[0];
                    const lambda = params[1];
                    return sampleWeibull(k, lambda);
                },
                nll: function(params) {
                    const k = params[0];
                    const lambda = params[1];
                    let sumLnX = 0;
                    let sumXOverLambdaK = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) return Infinity;
                        sumLnX += Math.log(x);
                        sumXOverLambdaK += Math.pow(x / lambda, k);
                    }
                    const n = dataPoints.length;
                    return n * Math.log(lambda) - n * Math.log(k) + (k - 1) * sumLnX + sumXOverLambdaK;
                },
                gradients: function(params) {
                    const k = params[0];
                    const lambda = params[1];
                    let sumLnX = 0;
                    let sumXOverLambdaK = 0;
                    let sumXOverLambdaKLnXOverLambda = 0;
                    for (let x of dataPoints) {
                        if (x <= 0) continue;
                        const lnX = Math.log(x);
                        const xOverLambda = x / lambda;
                        const xOverLambdaK = Math.pow(xOverLambda, k);
                        sumLnX += lnX;
                        sumXOverLambdaK += xOverLambdaK;
                        sumXOverLambdaKLnXOverLambda += xOverLambdaK * Math.log(xOverLambda);
                    }
                    const n = dataPoints.length;
                    const dK = -n / k + sumLnX + sumXOverLambdaKLnXOverLambda;
                    const dLambda = n / lambda - (k / (lambda * lambda)) * sumXOverLambdaK * dataPoints.reduce((acc, x) => acc + Math.pow(x, k), 0);
                    return [dK, dLambda];
                },
                parameterConstraints: function(params) {
                    // k and lambda must be positive
                    params[0] = Math.max(params[0], 1e-6);
                    params[1] = Math.max(params[1], 1e-6);
                    return params;
                }
            }
            
            

        };

        function runGradientDescent() {
            const dataInput = document.getElementById('data').value;
            dataPoints = dataInput.split(',').map(Number).filter(x => !isNaN(x));
            const distribution = document.getElementById('distribution').value;
            currentDistribution = distribution;

            gradientDescent();

            plotCostFunction();
            displayFinalParameters();
        }

        function gradientDescent() {
            const learningRate = parseFloat(document.getElementById('learningRate').value);
            const maxIter = parseInt(document.getElementById('maxIterations').value);
            const tolerance = parseFloat(document.getElementById('tolerance').value);
   
            const dist = distributions[currentDistribution];
            let params = dist.parameters.map(param => parseFloat(document.getElementById('init' + capitalize(param)).value));
        
            // Apply parameter constraints to initial parameters
            params = dist.parameterConstraints(params);
        
            path = [];
            costValues = [];
        
            // Add initial parameters to path before starting the loop
            let cost = dist.nll(params);
            path.push([...params]); // Clone params
            costValues.push(cost);
        
            for (let i = 0; i < maxIter; i++) {
                const grads = dist.gradients(params);
                params = params.map((p, idx) => p - learningRate * grads[idx]);
        
                // Apply parameter constraints
                params = dist.parameterConstraints(params);
        
                const newCost = dist.nll(params);
                path.push([...params]); // Clone params
                costValues.push(newCost);

                        // Check for convergence if tolerance is set
                if (tolerance > 0 && Math.abs(newCost - cost) < tolerance) {
                    console.log(`Converged at iteration ${i}`);
                    break;
                }

                cost = newCost; // Update cost for next iteration
            }
        }

        function togglePlotView() {
            const view = document.getElementById('toggleView').value;
            document.getElementById('contourOptions').style.display = (view === 'contour') ? 'block' : 'none';
            plotCostFunction();
        }
        

        function plotCostFunction() {
            const dist = distributions[currentDistribution];
            const param1 = dist.parameters[0];
            const param2 = dist.parameters[1];

            const param1Min = parseFloat(document.getElementById(param1 + 'Min').value);
            const param1Max = parseFloat(document.getElementById(param1 + 'Max').value);
            const param2Min = parseFloat(document.getElementById(param2 + 'Min').value);
            const param2Max = parseFloat(document.getElementById(param2 + 'Max').value);
            const numPoints = parseInt(document.getElementById('numPoints').value);
            const selectedColormap = document.getElementById('colormap').value;
            const param1Range = linspace(param1Min, param1Max, numPoints);
            const param2Range = linspace(param2Min, param2Max, numPoints);
            const z = [];

            const costView = document.querySelector('input[name="costView"]:checked').value;
            const applyLog = (costView === 'logCost');

            for (let i = 0; i < param1Range.length; i++) {
                z[i] = [];
                for (let j = 0; j < param2Range.length; j++) {
                    const params = [param1Range[i], param2Range[j]];
                    const cost = distributions[currentDistribution].nll(params);
                    z[i][j] = applyLog ? Math.log(cost + 1e-8) : cost;
                }
            }

            let data = [];

            const view = document.getElementById('toggleView').value;

            if (view === 'heatmap') {
                data.push({
                    x: param2Range,
                    y: param1Range,
                    z: z,
                    type: 'heatmap',
                    colorscale: selectedColormap,
                    colorbar: {
                        title: applyLog ? 'log(Cost)' : 'Cost'
                    }
                });

                
            } else if (view === 'contour') {
                const numContours = parseInt(document.getElementById('numContours').value);
       
                data.push({
                    x: param2Range,
                    y: param1Range,
                    z: z,
                    type: 'contour',
                    colorscale: selectedColormap,
                    ncontours: numContours,
                    contours: {
                        coloring: 'heatmap', // Options: 'none', 'heatmap', 'lines', 'fill', 'tonext'
                        showlabels: true,
                        labelfont: {
                            size: 12,
                            color: 'white'
                        }
                    },
                    colorbar: {
                        title: applyLog ? 'log(Cost)' : 'Cost'
                    }
                });
            } 
            
            
            else if (view === 'surface') {
                // 3D Surface
                data.push({
                    x: param2Range,
                    y: param1Range,
                    z: z,
                    type: 'surface',
                    colorscale: selectedColormap,
                    colorbar: {
                        title: applyLog ? 'log(Cost)' : 'Cost'
                    }
                });


            }
            if (view === "heatmap" || view === "contour"){
                // Add gradient descent path as 2D line with labels
                const pathTrace = {
                    x: path.map(p => p[1]),
                    y: path.map(p => p[0]),
                    mode: 'lines+markers+text',
                    marker: {
                        color: document.getElementById('pathColor').value, // Use user-selected color
                        size: parseFloat(document.getElementById('pathThickness').value)
                    },
                    line: {
                        color: document.getElementById('pathColor').value, // Use user-selected color
                        width: parseFloat(document.getElementById('pathThickness').value), // Use user-selected thickness
                    },
                    text: path.map((p, idx) => (idx % 100 === 0 ? `Iter ${idx}` : '')),
                    textfont: {
                        family: 'Arial',
                        size: 12,
                        color: 'white' // Contrast color for visibility
                    },
                    textposition: 'top center',
                    name: 'Gradient Descent Path',
                    showlegend:false,
                };

                // Add starting guess marker
                const startTrace = {
                    x: [path[0][1]],
                    y: [path[0][0]],
                    mode: 'markers+text',
                    marker: {
                        color: 'blue',
                        size: 10,
                        symbol: 'circle'
                    },
                    text: ['Start'],
                    textfont: {
                        family: 'Arial',
                        size: 12,
                        color: 'blue'
                    },
                    textposition: 'bottom center',
                    name: 'Starting Guess',
                    showlegend:false,
                };

                data.push(pathTrace);
                data.push(startTrace);

                const layout = {
                    title: (applyLog ? 'Log ' : '') + 'Cost Function Heatmap',
                    xaxis: { title: capitalize(param2) },
                    yaxis: { title: capitalize(param1) },
                    width: 800,
                    height: 600,
                    hovermode: 'closest'
                };

                Plotly.newPlot('plot', data, layout);
            } else if (view === "surface"){
                                // Add gradient descent path as 3D scatter with labels every 10 iterations
                                const pathTrace3D = {
                                    x: path.map(p => p[1]),
                                    y: path.map(p => p[0]),
                                    z: path.map(p => {
                                        const cost = distributions[currentDistribution].nll(p);
                                        return applyLog ? Math.log(cost + 1e-8) : cost;
                                    }),
                                    mode: 'lines+markers+text',
                                    marker: {
                                        color: document.getElementById('pathColor').value, // Use user-selected color
                                        size: parseFloat(document.getElementById('pathThickness').value)
                                    },
                                    line: {
                                        color: document.getElementById('pathColor').value, // Use user-selected color
                                        width: parseFloat(document.getElementById('pathThickness').value) // Use user-selected thickness
                                    },
                                    text: path.map((p, idx) => (idx % 100 === 0 ? `Iter ${idx}` : '')),
                                    textfont: {
                                        family: 'Arial',
                                        size: 10,
                                        color: 'white' // Contrast color for visibility
                                    },
                                    textposition: 'top center',
                                    name: 'Gradient Descent Path',
                                    type: 'scatter3d',
                                    showlegend:false,
                                };
                                // Add starting guess marker
                                const startTrace3D = {
                                    x: [path[0][1]],
                                    y: [path[0][0]],
                                    z: [applyLog ? Math.log(distributions[currentDistribution].nll(path[0]) + 1e-8) : distributions[currentDistribution].nll(path[0])],
                                    mode: 'markers+text',
                                    marker: {
                                        color: 'blue',
                                        size: 6,
                                        symbol: 'circle'
                                    },
                                    text: ['Start'],
                                    textfont: {
                                        family: 'Arial',
                                        size: 10,
                                        color: 'blue'
                                    },
                                    textposition: 'bottom center',
                                    name: 'Starting Guess',
                                    type: 'scatter3d',
                                    showlegend:false,
                                };
                                data.push(pathTrace3D);
                                data.push(startTrace3D);
                
                                const layout = {
                                    title: (applyLog ? 'Log ' : '') + 'Cost Function Surface',
                                    scene: {
                                        xaxis: { title: capitalize(param2) },
                                        yaxis: { title: capitalize(param1) },
                                        zaxis: { title: applyLog ? 'log(Cost)' : 'Cost' }
                                    },
                                    width: 800,
                                    height: 600
                                };
                
                                Plotly.newPlot('plot', data, layout);
            }


        }

        function togglePlotView() {
            const view = document.getElementById('toggleView').value;
            // Show contour options only when 'contour' view is selected
            document.getElementById('contourOptions').style.display = (view === 'contour') ? 'block' : 'none';
        
            plotCostFunction();
        }

        function linspace(start, end, num) {
            const arr = [];
            const step = (end - start) / (num - 1);
            for (let i = 0; i < num; i++) {
                arr.push(start + (step * i));
            }
            return arr;
        }

        function autoGenerateData() {
            const distribution = document.getElementById('distribution').value;
            const dist = distributions[distribution];
            const sampleSize = 100;

            // Randomly select parameters within boundaries
            const params = dist.parameters.map(param => {
                const min = parseFloat(document.getElementById(param + 'Min').value);
                const max = parseFloat(document.getElementById(param + 'Max').value);
                const q1 = min + 0.25 * (max - min);
                const q3 = min + 0.75 * (max - min);
                return randBetween(q1, q3);
            });

            dataPoints = [];
            for (let i = 0; i < sampleSize; i++) {
                dataPoints.push(dist.sample(params));
            }

            // Update the data textarea
            document.getElementById('data').value = dataPoints.join(', ');
            alert(`Data auto-generated using ${capitalize(distribution)} Distribution with parameters: ${dist.parameters.map((p, i) => `${p}=${params[i].toFixed(2)}`).join(', ')}`);
        }

        function randBetween(min, max) {
            return Math.random() * (max - min) + min;
        }

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Update initial guesses when distribution changes
        document.getElementById('distribution').addEventListener('change', function() {
            currentDistribution = this.value;
            updateInitialGuessInputs();
            updateParameterBoundaries();
        });

        function updateInitialGuessInputs() {
            const dist = distributions[currentDistribution];
            const container = document.getElementById('initialGuessInputs');
            container.innerHTML = '';
            dist.parameters.forEach((param, index) => {
                const label = document.createElement('label');
                label.textContent = 'Initial ' + capitalize(param) + ':';
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'init' + capitalize(param);
                input.value = dist.initialGuess[index];
                input.step = '0.1';
                input.style.marginRight = '10px';
                container.appendChild(label);
                container.appendChild(input);
            });
        }

        function updateParameterBoundaries() {
            const dist = distributions[currentDistribution];
            const container = document.getElementById('parameterBoundaries');
            container.innerHTML = '';
            dist.parameters.forEach(param => {
                const minLabel = document.createElement('label');
                minLabel.textContent = capitalize(param) + ' Min:';
                const minInput = document.createElement('input');
                minInput.type = 'number';
                minInput.id = param + 'Min';
                minInput.value = dist.boundaries[param + 'Min'];
                minInput.step = '0.1';
                minInput.style.marginRight = '10px';

                const maxLabel = document.createElement('label');
                maxLabel.textContent = capitalize(param) + ' Max:';
                const maxInput = document.createElement('input');
                maxInput.type = 'number';
                maxInput.id = param + 'Max';
                maxInput.value = dist.boundaries[param + 'Max'];
                maxInput.step = '0.1';
                maxInput.style.marginRight = '10px';

                container.appendChild(minLabel);
                container.appendChild(minInput);
                container.appendChild(maxLabel);
                container.appendChild(maxInput);
                container.appendChild(document.createElement('br'));
            });
        }

        // Mathematical functions
        function lnGamma(z) {
            // Lanczos approximation for the natural logarithm of the gamma function
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
                1.5056327351493116e-7
            ];
            if (z < 0.5) {
                return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lnGamma(1 - z);
            } else {
                z -= 1;
                let x = p[0];
                for (let i = 1; i < g + 2; i++) {
                    x += p[i] / (z + i);
                }
                const t = z + g + 0.5;
                return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
            }
        }

        function digamma(x) {
            // Use an approximation suitable for positive x
            let result = 0;
            while (x < 7) {
                result -= 1 / x;
                x += 1;
            }
            const xSqInv = 1 / (x * x);
            result += Math.log(x) - 0.5 / x - xSqInv / 12 + xSqInv * xSqInv / 120 - xSqInv * xSqInv * xSqInv / 252;
            return result;
        }
        

        // Sampling functions
        function sampleNormal(mu, sigma) {
            let u1 = 0, u2 = 0;
            while (u1 === 0) u1 = Math.random();
            while (u2 === 0) u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            return z0 * sigma + mu;
        }

        function sampleGamma(k, theta) {
            // Using Marsaglia and Tsang's method
            if (k < 1) {
                // Weibull algorithm
                let c = (1 / k);
                let d = ((1 - k) * Math.pow(k, k / (1 - k)));
                let u, v, z, e, x;
                do {
                    u = Math.random();
                    v = Math.random();
                    z = -Math.log(u);
                    e = -Math.log(v);
                    x = Math.pow(z, c);
                } while (z + e < d);
                return x * theta;
            } else {
                const d = k - 1 / 3;
                const c = 1 / Math.sqrt(9 * d);
                let u, v, x;
                do {
                    do {
                        x = sampleNormal(0, 1);
                        v = 1 + c * x;
                    } while (v <= 0);
                    v = v * v * v;
                    u = Math.random();
                } while (u > 1 - 0.331 * Math.pow(x, 4) && Math.log(u) > 0.5 * x * x + d * (1 - v + Math.log(v)));
                return d * v * theta;
            }
        }

        function sampleBeta(alpha, beta) {
            const x = sampleGamma(alpha, 1);
            const y = sampleGamma(beta, 1);
            return x / (x + y);
        }

        function sampleLogNormal(mu, sigma) {
            const z = sampleNormal(mu, sigma);
            return Math.exp(z);
        }

        function sampleExponential(beta) {
            let u = Math.random();
            return -Math.log(1 - u) / beta;
        }

        function sampleWeibull(k, lambda) {
            let u = Math.random();
            return lambda * Math.pow(-Math.log(1 - u), 1 / k);
        }
        
        
        // Display final estimated parameters
        function displayFinalParameters() {
            const dist = distributions[currentDistribution];
            const finalParams = path[path.length - 1];
            let displayText = 'Final Estimated Parameters: ';
            dist.parameters.forEach((param, idx) => {
                displayText += `${capitalize(param)} = ${finalParams[idx].toFixed(4)} `;
            });
            document.getElementById('finalParams').innerText = displayText;
        }

        // Initial setup
        window.onload = () => {
            updateInitialGuessInputs();
            updateParameterBoundaries();
            runGradientDescent();
        };


        document.getElementById('dataFile').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const contents = e.target.result;
                    const parsedData = parseCSV(contents);
                    if (parsedData.length === 0) {
                        alert('No valid data found in the CSV file.');
                        return;
                    }
                    dataPoints = parsedData;
                    document.getElementById('data').value = dataPoints.join(', ');
                    alert('Data successfully loaded from CSV file.');
                };
                reader.readAsText(file);
            }
        });
        
        function parseCSV(contents) {
            const lines = contents.split(/\r\n|\n/);
            let result = [];
            for (let line of lines) {
                if (line.trim() === '') continue;
                const values = line.split(',').map(Number).filter(x => !isNaN(x));
                result = result.concat(values);
            }
            return result;
        }
        