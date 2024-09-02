function rateEquations(concentrations, t, kf, kr, a, b, c, d) {
    const [A, B, C, D] = concentrations;
    
    const dA_dt = -kf * A ** a * B ** b + kr * C ** c * D ** d;
    const dB_dt = -kf * A ** a * B ** b + kr * C ** c * D ** d;
    const dC_dt = kf * A ** a * B ** b - kr * C ** c * D ** d;
    const dD_dt = kf * A ** a * B ** b - kr * C ** c * D ** d;
    
    return [dA_dt, dB_dt, dC_dt, dD_dt];
}


function rungeKutta4(concentrations, t, dt, kf, kr, a, b, c, d) {
    const [A, B, C, D] = concentrations;

    const k1 = rateEquations(concentrations, t, kf, kr, a, b, c, d);
    const k2 = rateEquations([
        A + 0.5 * dt * k1[0],
        B + 0.5 * dt * k1[1],
        C + 0.5 * dt * k1[2],
        D + 0.5 * dt * k1[3]
    ], t + 0.5 * dt, kf, kr, a, b, c, d);
    const k3 = rateEquations([
        A + 0.5 * dt * k2[0],
        B + 0.5 * dt * k2[1],
        C + 0.5 * dt * k2[2],
        D + 0.5 * dt * k2[3]
    ], t + 0.5 * dt, kf, kr, a, b, c, d);
    const k4 = rateEquations([
        A + dt * k3[0],
        B + dt * k3[1],
        C + dt * k3[2],
        D + dt * k3[3]
    ], t + dt, kf, kr, a, b, c, d);

    return [
        A + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        B + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        C + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
        D + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3])
    ];
}

function simulateReaction(initialConcentrations, kf, kr, a, b, c, d, dt, endTime) {
    const results = [];
    let time = 0;
    let concentrations = [...initialConcentrations];

    while (time <= endTime) {
        results.push([time, ...concentrations]);

        // Use a numerical solver to update concentrations
        const rates = rateEquations(concentrations, time, kf, kr, a, b, c, d);
        for (let i = 0; i < concentrations.length; i++) {
            concentrations[i] += rates[i] * dt;
        }

        time += dt;
    }

    return results;
}

