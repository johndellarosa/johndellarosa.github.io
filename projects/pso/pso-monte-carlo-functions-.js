function simulateTrial(LILY_THRESHOLD = 7, ORIGINAL_LILIES = 9, LILIES_AFTER_RESET = 9, DESIRED_DROPS = 4,
    p_nar_lily = 1/500, p_god_hp = 7/8,
    time_per_pipe = 0.35, time_for_to_get_to_spot = 15, time_per_reset = 1, time_to_kill_lily = 1) {
let num_god_hp = 0;
let waves = 0;
let lilies_seen = 0;
let lilies_in_wave = ORIGINAL_LILIES;
let nar_lilies_killed = 0;
let mission_resets = 0;
let timer = time_for_to_get_to_spot;

while (num_god_hp < DESIRED_DROPS) {
waves++; // increase # of waves
lilies_seen += lilies_in_wave; // increase # of lilies seen
let nar_lilies = binomial(lilies_in_wave, p_nar_lily); // calculate # of nar lilies in wave
nar_lilies_killed += nar_lilies;
timer += time_to_kill_lily * nar_lilies; // killing nar lily takes time

let num_god_hp_drops_this_wave = nar_lilies ? binomial(nar_lilies, p_god_hp) : 0;
num_god_hp += num_god_hp_drops_this_wave;

lilies_in_wave -= nar_lilies; // killing nar lily reduces number in subsequent waves

if (num_god_hp < DESIRED_DROPS) {
if (lilies_in_wave <= LILY_THRESHOLD) {
// reset quest
timer += time_for_to_get_to_spot; // technically should be a bit longer since it takes time to quit
lilies_in_wave = LILIES_AFTER_RESET;
mission_resets++;
timer += time_per_reset;
} else {
// continue piping
timer += time_per_pipe;
}
}
}

return [waves, timer, lilies_seen, nar_lilies_killed, mission_resets];
}

// Binomial distribution function
function binomial(n, p) {
let count = 0;
for (let i = 0; i < n; i++) {
if (Math.random() < p) count++;
}
return count;
}

function runMultipleTrials(NUM_TRIALS = 1000,LILY_THRESHOLD = 7, ORIGINAL_LILIES = 9, LILIES_AFTER_RESET = 9, DESIRED_DROPS = 4,
    p_nar_lily = 1/500, p_god_hp = 7/8,
    time_per_pipe = 0.35, time_for_to_get_to_spot = 15, time_to_kill_lily = 0.25) {

    if (p_god_hp == 0){
        alert("Please set probability to non-zero value!");
        return;
    }
    let results = [];

    for (let i = 0; i < NUM_TRIALS; i++) {
        let trialResult = simulateTrial(LILY_THRESHOLD, ORIGINAL_LILIES, LILIES_AFTER_RESET, DESIRED_DROPS,
            p_nar_lily, p_god_hp,
            time_per_pipe, time_for_to_get_to_spot, time_to_kill_lily);
        // derive additional stats: quests, time per quest, time per wave
        let waves = trialResult[0];
        let timer = trialResult[1];
        let mission_resets = trialResult[4];
        let quests = mission_resets + 1;
        let time_per_quest = quests > 0 ? timer / quests : timer;
        let time_per_wave = waves > 0 ? timer / waves : timer;
        // time per desired drop (use DESIRED_DROPS passed into runMultipleTrials)
        let time_per_drop = DESIRED_DROPS > 0 ? timer / DESIRED_DROPS : timer;

        results.push({
            'Num Waves': waves,
            'Timer': timer,
            'Lilies Seen': trialResult[2],
            'Nar Lilies': trialResult[3],
            'Mission Resets': mission_resets,
            'Quests': quests,
            'Time Per Quest': time_per_quest,
            'Time Per Wave': time_per_wave
            , 'Time Per Drop': time_per_drop
        });
    }

    return results;
}


function createHistogram(data,binSize,x_title="Waves Required",y_title="Percentage (%)") {
    // Define the bin size
    // const binSize = 10;

    // Find the maximum wave number and calculate the number of bins needed
    let maxWave = Math.max(...data);
    let numBins = Math.ceil((maxWave + 1) / binSize);

    // Initialize an array to store counts for each bin
    let binCounts = new Array(numBins).fill(0);

    // Assign each wave number to a bin and count
    data.forEach(value => {
        let binIndex = Math.floor(value / binSize);
        binCounts[binIndex]++;
    });

    // Convert bin counts to percentages
    let totalTrials = data.length;
    let percentages = binCounts.map(count => (count / totalTrials) * 100);

    // Create the histogram
    const canvas = document.getElementById('wavesHistogram');
    const ctx = canvas.getContext('2d');

    // Destroy any existing chart instance associated with the context
    for (let key in Chart.instances) {
        if (Chart.instances[key].ctx === ctx) {
            Chart.instances[key].destroy();
            break;
        }
    }


    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: percentages.map((_, index) => `${index * binSize} - ${index * binSize + binSize - 1}`),
            datasets: [{
                label: 'Percentage',
                data: percentages,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // This will allow the chart to fill the container height
        
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: y_title
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: x_title
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function prepareCdfData(data) {
    // Sort the data
    let sortedData = [...data].sort((a, b) => a - b);

    // Calculate the CDF
    let cdfData = [];
    let uniqueValues = [...new Set(sortedData)]; // Get unique values

    uniqueValues.forEach(value => {
        let count = sortedData.filter(v => v <= value).length;
        let probability = count / sortedData.length;
        cdfData.push({ x: value, y: probability });
    });

    return cdfData;
}

function createCdfChart(data, x_title='Waves Required',y_title='Probability') {
    const ctx = document.getElementById('cdfChart').getContext('2d');

    // Destroy previous chart if it exists
    if (window.cdfChartInstance) {
        window.cdfChartInstance.destroy();
    }

    // Create new chart
    window.cdfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'CDF',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: x_title
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: y_title
                    }
                }
            }
        }
    });
}

// Pink time histogram (uses same binning logic as createHistogram)
function createTimeHistogram(data,binSize,x_title="Time (min)",y_title="Percentage (%)") {
    if (!data || data.length === 0) return;
    let maxVal = Math.max(...data);
    let minVal = Math.min(...data);
    // create bins over range [minVal, maxVal]
    let range = maxVal - minVal;
    let numBins = Math.ceil((range + 1) / binSize) || 1;
    let binCounts = new Array(numBins).fill(0);
    data.forEach(value => {
        let binIndex = Math.floor((value - minVal) / binSize);
        if (binIndex < 0) binIndex = 0;
        if (binIndex >= numBins) binIndex = numBins - 1;
        binCounts[binIndex]++;
    });
    let totalTrials = data.length;
    let percentages = binCounts.map(count => (count / totalTrials) * 100);

    const canvas = document.getElementById('timeHistogram');
    const ctx = canvas.getContext('2d');
    for (let key in Chart.instances) {
        if (Chart.instances[key].ctx === ctx) {
            Chart.instances[key].destroy();
            break;
        }
    }

    const labels = percentages.map((_, index) => {
        let start = (minVal + index * binSize).toFixed(2);
        let end = (minVal + index * binSize + binSize).toFixed(2);
        return `${start} - ${end}`;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Percentage',
                data: percentages,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: y_title } },
                x: { title: { display: true, text: x_title } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createTimeCdfChart(data, x_title='Time (min)', y_title='Probability') {
    if (!data || data.length === 0) return;
    const ctx = document.getElementById('timeCdfChart').getContext('2d');
    if (window.timeCdfChartInstance) window.timeCdfChartInstance.destroy();
    window.timeCdfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'CDF',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: { type: 'linear', position: 'bottom', title: { display: true, text: x_title } },
                y: { title: { display: true, text: y_title } }
            }
        }
    });
}


// function simulateTrialRareDrop(DESIRED_DROPS = 1, p_drop = .01) {
// let num_drops = 0;
// let enemies_seen = 0;




// while (num_drops < DESIRED_DROPS) {
// waves++; // increase # of waves
// enemies_seen += lilies_in_wave; // increase # of lilies seen
// let nar_lilies = binomial(lilies_in_wave, p_nar_lily); // calculate # of nar lilies in wave
// nar_lilies_killed += nar_lilies;
// timer += time_to_kill_lily * nar_lilies; // killing nar lily takes time

// let num_god_hp_drops_this_wave = nar_lilies ? binomial(nar_lilies, p_god_hp) : 0;
// num_drops += num_god_hp_drops_this_wave;

// lilies_in_wave -= nar_lilies; // killing nar lily reduces number in subsequent waves

// if (num_drops < DESIRED_DROPS) {
// if (lilies_in_wave <= LILY_THRESHOLD) {
// // reset quest
// timer += time_for_to_get_to_spot; // technically should be a bit longer since it takes time to quit
// lilies_in_wave = LILIES_AFTER_RESET;
// mission_resets++;
// } else {
// // continue piping
// timer += time_per_pipe;
// }
// }
// }

// return [waves, timer, enemies_seen, nar_lilies_killed, mission_resets];
// }


