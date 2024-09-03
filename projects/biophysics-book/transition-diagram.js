// transition-diagram.js

const canvas = document.getElementById('markovCanvas');
const ctx = canvas.getContext('2d');

let numStates = parseInt(document.getElementById('matrixSize').value, 10); // Number of states
const numCircles = 100; // Number of circles
const circleRadius = 3; // Radius of each small circle
let colors = []; // Colors for states
let stateLabels = []; // Labels for states

let states = []; // State positions
let transitionMatrix = []; // Transition probabilities
let circles = []; // Circles data
let tickLength = parseInt(document.getElementById('tickLength').value, 10); // Time (in ms) for each tick
let colorChangeInterval = 1000; // Time (in ms) for color change
let animationFrameId = null; // Store animation frame ID for stopping

function initializeStates() {
    states = [];
    colors = [];
    stateLabels = [];
    const radius = Math.min(canvas.width, canvas.height) / 3; // Radius of the circle for placing states
    const angleStep = (2 * Math.PI) / numStates; // Angle between states
    
    for (let i = 0; i < numStates; i++) {
        const angle = i * angleStep;
        states.push({
            x: canvas.width / 2 + radius * Math.cos(angle),
            y: canvas.height / 2 + radius * Math.sin(angle)
        });
        colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`); // Random color for each state
        stateLabels.push(0); // Initialize with 0 balls in each state
    }
}

function initializeCircles() {
    circles = [];
    const radius = Math.min(canvas.width, canvas.height) / 3; // Radius for positioning circles
    const angleStep = (2 * Math.PI) / numCircles; // Angle between each circle position
    
    for (let i = 0; i < numCircles; i++) {
        const stateIndex = Math.floor(Math.random() * numStates);
        const angle = i * angleStep;
        circles.push({
            x: canvas.width / 2 + radius * Math.cos(angle),
            y: canvas.height / 2 + radius * Math.sin(angle),
            stateIndex,
            targetX: states[stateIndex].x,
            targetY: states[stateIndex].y
        });
        stateLabels[stateIndex]++; // Increment the count of balls in the state
    }
}

function initializeMatrix(size) {
    numStates = size;
    transitionMatrix = Array.from({ length: size }, () => Array(size).fill(0));
    initializeStates(); // Reinitialize states based on new size
    renderMatrixEditor();
}

function renderMatrixEditor() {
    const matrixInputs = document.getElementById('matrixInputs');
    matrixInputs.innerHTML = '';

    // Create top row labels
    const labelRow = document.createElement('div');
    empty = labelRow.appendChild(document.createElement('span')); // Empty cell at top left
    
   
    for (let i = 0; i < numStates; i++) {
        const label = document.createElement('span');
        label.textContent = `Next ${i}\n`;
        label.classList.add('state-label');
        labelRow.appendChild(label);
    }
    matrixInputs.appendChild(labelRow);

    // Create matrix inputs with side row labels
    for (let i = 0; i < numStates; i++) {
        const row = document.createElement('div');
        const rowLabel = document.createElement('span');
        rowLabel.textContent = `Current ${i}`;
        rowLabel.classList.add('state-label');
        rowLabel.style.textAlign = 'right';
        rowLabel.style.paddingRight = '10px';
        row.appendChild(rowLabel);

        for (let j = 0; j < numStates; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min='0.00'
            input.value = transitionMatrix[i][j] || 0;
            input.oninput = () => {
                transitionMatrix[i][j] = parseFloat(input.value) || 0;
            };
            row.appendChild(input);
        }
        
        matrixInputs.appendChild(row);
    }
}

function normalizeMatrix() {
    for (let i = 0; i < numStates; i++) {
        const rowSum = transitionMatrix[i].reduce((a, b) => a + b, 0);
        if (rowSum > 0) {
            transitionMatrix[i] = transitionMatrix[i].map(v => v / rowSum);
        }
    }
    renderMatrixEditor();
}

function runSimulation() {
    initializeCircles(); // Ensure circles are initialized based on current states and matrix

    let lastColorChangeTime = Date.now();

    function update() {
        // Update circles' positions
        for (let circle of circles) {
            // Smoothly move towards target state position
            const moveSpeed = 0.05; // Speed of movement towards target
            circle.x += (circle.targetX - circle.x) * moveSpeed;
            circle.y += (circle.targetY - circle.y) * moveSpeed;

            // Check for state transition
            if (Math.random() < 0.01) { // Small chance to transition state
                const oldStateIndex = circle.stateIndex;
                const newStateIndex = weightedRandomIndex(transitionMatrix[oldStateIndex]);
                if (newStateIndex !== oldStateIndex) {

                    circle.stateIndex = newStateIndex;
                    circle.targetX = states[newStateIndex].x+50*(0.5-Math.random());
                    circle.targetY = states[newStateIndex].y+50*(0.5-Math.random());
                }
            }
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw circles
        let stateCounts = Array(numStates).fill(0); // To keep track of ball counts in each state

        for (let circle of circles) {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circleRadius, 0, 2 * Math.PI);
            ctx.fillStyle = colors[circle.stateIndex];
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
            // Count balls in each state
            stateCounts[circle.stateIndex]++;
        }

        // Draw state labels
        for (let i = 0; i < numStates; i++) {
            const state = states[i];
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`State ${i}: ${stateCounts[i]}`, state.x-40, state.y - 40);
        }

        // Update every frame
        requestAnimationFrame(update);

        // Change colors periodically
        const now = Date.now();
        if (now - lastColorChangeTime >= colorChangeInterval) {
            lastColorChangeTime = now;
        }
    }

    update();
}

function weightedRandomIndex(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    const rand = Math.random() * total;
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (rand <= sum) return i;
    }
    return weights.length - 1;
}

function reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Initialize matrix size and tick length inputs
function initializeInputListeners() {
    document.getElementById('matrixSize').addEventListener('change', (event) => {
        initializeMatrix(parseInt(event.target.value, 10));
    });

    document.getElementById('tickLength').addEventListener('change', (event) => {
        tickLength = parseInt(event.target.value, 10);
    });
}

// Initialize with default values
initializeMatrix(numStates);
initializeStates();
initializeCircles();
initializeInputListeners();
