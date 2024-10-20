// hodgkin_huxley.js

let simulationData = null; // Global variable to store simulation data

function alpha_n(V) {
    return (0.01 * (V + 55)) / (1 - Math.exp(-0.1 * (V + 55)));
}

function beta_n(V) {
    return 0.125 * Math.exp(-0.0125 * (V + 65));
}

function alpha_m(V) {
    return (0.1 * (V + 40)) / (1 - Math.exp(-0.1 * (V + 40)));
}

function beta_m(V) {
    return 4 * Math.exp(-0.0556 * (V + 65));
}

function alpha_h(V) {
    return 0.07 * Math.exp(-0.05 * (V + 65));
}

function beta_h(V) {
    return 1 / (1 + Math.exp(-0.1 * (V + 35)));
}

// Runge-Kutta 4th Order Method for HH Equations
function simulate() {
    // Retrieve constants from input fields
    const Cm = parseFloat(document.getElementById('Cm').value);
    const gNa = parseFloat(document.getElementById('gNa').value);
    const ENa = parseFloat(document.getElementById('ENa').value);
    const gK = parseFloat(document.getElementById('gK').value);
    const EK = parseFloat(document.getElementById('EK').value);
    const gL = parseFloat(document.getElementById('gL').value);
    const EL = parseFloat(document.getElementById('EL').value);
    const Iext = parseFloat(document.getElementById('Iext').value);
    const tMax = parseFloat(document.getElementById('tMax').value);
    const dt = parseFloat(document.getElementById('dt').value);

    const steps = Math.ceil(tMax / dt);

    // Initialize variables
    let V = -65; // Initial membrane potential (mV)
    let m = alpha_m(V) / (alpha_m(V) + beta_m(V));
    let h = alpha_h(V) / (alpha_h(V) + beta_h(V));
    let n = alpha_n(V) / (alpha_n(V) + beta_n(V));

    // Arrays to store results
    let time = [];
    let V_trace = [];
    let m_trace = [];
    let h_trace = [];
    let n_trace = [];
    let INa_trace = [];
    let IK_trace = [];
    let IL_trace = [];

    // Simulation loop using RK4
    for (let i = 0; i < steps; i++) {
        const t = i * dt;
        time.push(t);

        // Store current state
        V_trace.push(V);
        m_trace.push(m);
        h_trace.push(h);
        n_trace.push(n);

        // Compute currents
        const INa = gNa * Math.pow(m, 3) * h * (V - ENa);
        const IK = gK * Math.pow(n, 4) * (V - EK);
        const IL = gL * (V - EL);
        INa_trace.push(INa);
        IK_trace.push(IK);
        IL_trace.push(IL);

        // Define the system of ODEs
        const dVdt = (Iext - INa - IK - IL) / Cm;
        const dmdt = alpha_m(V) * (1 - m) - beta_m(V) * m;
        const dhdt = alpha_h(V) * (1 - h) - beta_h(V) * h;
        const dndt = alpha_n(V) * (1 - n) - beta_n(V) * n;

        // RK4 integration
        const k1_V = dVdt;
        const k1_m = dmdt;
        const k1_h = dhdt;
        const k1_n = dndt;

        const V_temp = V + 0.5 * dt * k1_V;
        const m_temp = m + 0.5 * dt * k1_m;
        const h_temp = h + 0.5 * dt * k1_h;
        const n_temp = n + 0.5 * dt * k1_n;

        const INa_temp = gNa * Math.pow(m_temp, 3) * h_temp * (V_temp - ENa);
        const IK_temp = gK * Math.pow(n_temp, 4) * (V_temp - EK);
        const IL_temp = gL * (V_temp - EL);
        const dVdt2 = (Iext - INa_temp - IK_temp - IL_temp) / Cm;
        const dmdt2 = alpha_m(V_temp) * (1 - m_temp) - beta_m(V_temp) * m_temp;
        const dhdt2 = alpha_h(V_temp) * (1 - h_temp) - beta_h(V_temp) * h_temp;
        const dndt2 = alpha_n(V_temp) * (1 - n_temp) - beta_n(V_temp) * n_temp;

        const k2_V = dVdt2;
        const k2_m = dmdt2;
        const k2_h = dhdt2;
        const k2_n = dndt2;

        const V_temp2 = V + 0.5 * dt * k2_V;
        const m_temp2 = m + 0.5 * dt * k2_m;
        const h_temp2 = h + 0.5 * dt * k2_h;
        const n_temp2 = n + 0.5 * dt * k2_n;

        const INa_temp2 = gNa * Math.pow(m_temp2, 3) * h_temp2 * (V_temp2 - ENa);
        const IK_temp2 = gK * Math.pow(n_temp2, 4) * (V_temp2 - EK);
        const IL_temp2 = gL * (V_temp2 - EL);
        const dVdt3 = (Iext - INa_temp2 - IK_temp2 - IL_temp2) / Cm;
        const dmdt3 = alpha_m(V_temp2) * (1 - m_temp2) - beta_m(V_temp2) * m_temp2;
        const dhdt3 = alpha_h(V_temp2) * (1 - h_temp2) - beta_h(V_temp2) * h_temp2;
        const dndt3 = alpha_n(V_temp2) * (1 - n_temp2) - beta_n(V_temp2) * n_temp2;

        const k3_V = dVdt3;
        const k3_m = dmdt3;
        const k3_h = dhdt3;
        const k3_n = dndt3;

        const V_temp3 = V + dt * k3_V;
        const m_temp3 = m + dt * k3_m;
        const h_temp3 = h + dt * k3_h;
        const n_temp3 = n + dt * k3_n;

        const INa_temp3 = gNa * Math.pow(m_temp3, 3) * h_temp3 * (V_temp3 - ENa);
        const IK_temp3 = gK * Math.pow(n_temp3, 4) * (V_temp3 - EK);
        const IL_temp3 = gL * (V_temp3 - EL);
        const dVdt4 = (Iext - INa_temp3 - IK_temp3 - IL_temp3) / Cm;
        const dmdt4 = alpha_m(V_temp3) * (1 - m_temp3) - beta_m(V_temp3) * m_temp3;
        const dhdt4 = alpha_h(V_temp3) * (1 - h_temp3) - beta_h(V_temp3) * h_temp3;
        const dndt4 = alpha_n(V_temp3) * (1 - n_temp3) - beta_n(V_temp3) * n_temp3;

        const k4_V = dVdt4;
        const k4_m = dmdt4;
        const k4_h = dhdt4;
        const k4_n = dndt4;

        // Update variables
        V += (dt / 6) * (k1_V + 2 * k2_V + 2 * k3_V + k4_V);
        m += (dt / 6) * (k1_m + 2 * k2_m + 2 * k3_m + k4_m);
        h += (dt / 6) * (k1_h + 2 * k2_h + 2 * k3_h + k4_h);
        n += (dt / 6) * (k1_n + 2 * k2_n + 2 * k3_n + k4_n);
    }

    // Store simulation data
    simulationData = {
        time: time,
        V: V_trace,
        INa: INa_trace,
        IK: IK_trace,
        IL: IL_trace,
        m: m_trace,
        h: h_trace,
        n: n_trace
    };

    // Plot results
    plotResults(time, V_trace, INa_trace, IK_trace, IL_trace, m_trace, h_trace, n_trace);
}

function plotResults(time, V, INa, IK, IL, m, h, n) {
    const plotsDiv = document.getElementById('plots');
    plotsDiv.innerHTML = ''; // Clear previous plots

    // Define plot containers
    const plotVDiv = document.createElement('div');
    plotVDiv.id = 'plotV';
    plotVDiv.style.width = '100%';
    plotVDiv.style.height = '300px';
    plotsDiv.appendChild(plotVDiv);

    const plotIDiv = document.createElement('div');
    plotIDiv.id = 'plotI';
    plotIDiv.style.width = '100%';
    plotIDiv.style.height = '300px';
    plotsDiv.appendChild(plotIDiv);

    const plotGDiv = document.createElement('div');
    plotGDiv.id = 'plotG';
    plotGDiv.style.width = '100%';
    plotGDiv.style.height = '300px';
    plotsDiv.appendChild(plotGDiv);

    // Membrane Potential Plot
    const traceV = {
        x: time,
        y: V,
        mode: 'lines',
        name: 'Membrane Potential (V)',
        line: { color: 'blue' }
    };
    const layoutV = {
        title: 'Membrane Potential (V)',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Membrane Potential (mV)' }
    };
    Plotly.newPlot('plotV', [traceV], layoutV);

    // Ionic Currents Plot
    const traceINa = {
        x: time,
        y: INa,
        mode: 'lines',
        name: 'I_Na',
        line: { color: 'red' }
    };
    const traceIK = {
        x: time,
        y: IK,
        mode: 'lines',
        name: 'I_K',
        line: { color: 'green' }
    };
    const traceIL = {
        x: time,
        y: IL,
        mode: 'lines',
        name: 'I_L',
        line: { color: 'orange' }
    };
    const layoutI = {
        title: 'Ionic Currents (μA/cm²)',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Current (μA/cm²)' }
    };
    Plotly.newPlot('plotI', [traceINa, traceIK, traceIL], layoutI);

    // Gating Variables Plot
    const traceM = {
        x: time,
        y: m,
        mode: 'lines',
        name: 'm',
        line: { dash: 'dot', color: 'purple' }
    };
    const traceH = {
        x: time,
        y: h,
        mode: 'lines',
        name: 'h',
        line: { dash: 'dot', color: 'brown' }
    };
    const traceN = {
        x: time,
        y: n,
        mode: 'lines',
        name: 'n',
        line: { dash: 'dot', color: 'cyan' }
    };
    const layoutG = {
        title: 'Gating Variables',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Gating Variables' }
    };
    Plotly.newPlot('plotG', [traceM, traceH, traceN], layoutG);
}

function exportData() {
    if (!simulationData) {
        alert('No simulation data available to export. Please run a simulation first.');
        return;
    }

    const { time, V, INa, IK, IL, m, h, n } = simulationData;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Time (ms),Membrane Potential (mV),I_Na (μA/cm²),I_K (μA/cm²),I_L (μA/cm²),m,h,n\n';

    for (let i = 0; i < time.length; i++) {
        const row = [
            time[i].toFixed(4),
            V[i].toFixed(4),
            INa[i].toFixed(4),
            IK[i].toFixed(4),
            IL[i].toFixed(4),
            m[i].toFixed(4),
            h[i].toFixed(4),
            n[i].toFixed(4)
        ].join(',');
        csvContent += row + '\n';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `HH_Simulation_${timestamp}.csv`);
    document.body.appendChild(link); // Required for FF

    link.click();
    document.body.removeChild(link);
}
