function simulateTrial(LILY_THRESHOLD = 7, ORIGINAL_LILIES = 9, LILIES_AFTER_RESET = 9, DESIRED_DROPS = 4,
    p_nar_lily = 1/500, p_god_hp = 7/8,
    time_per_pipe = 0.35, time_for_to_get_to_spot = 15, time_to_kill_lily = 0.25) {
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
    let results = [];

    for (let i = 0; i < NUM_TRIALS; i++) {
        let trialResult = simulateTrial(LILY_THRESHOLD, ORIGINAL_LILIES, LILIES_AFTER_RESET, DESIRED_DROPS,
            p_nar_lily, p_god_hp,
            time_per_pipe, time_for_to_get_to_spot, time_to_kill_lily);
        results.push({
            'Num Waves': trialResult[0],
            'Timer': trialResult[1],
            'Lilies Seen': trialResult[2],
            'Nar Lilies': trialResult[3],
            'Mission Resets': trialResult[4]
        });
    }

    return results;
}


function createHistogram(data,binSize) {
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
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Waves Required'
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

