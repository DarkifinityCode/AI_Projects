let chart;

// SIR Model function
function runSIR(population, infected, beta, gamma, days) {
  let S = population - infected; // Susceptible
  let I = infected;              // Infected
  let R = 0;                     // Recovered

  const Sdata = [S];
  const Idata = [I];
  const Rdata = [R];
  const t = [0];

  for (let day = 1; day <= days; day++) {
    const newInfected = (beta * S * I) / population;
    const newRecovered = gamma * I;

    S -= newInfected;
    I += newInfected - newRecovered;
    R += newRecovered;

    t.push(day);
    Sdata.push(S);
    Idata.push(I);
    Rdata.push(R);
  }

  return { t, Sdata, Idata, Rdata };
}

// Draw chart
function drawChart(t, S, I, R) {
  if (chart) chart.destroy();
  const ctx = document.getElementById('chart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: t,
      datasets: [
        { label: 'Susceptible', data: S, borderColor: 'blue', fill: false },
        { label: 'Infected', data: I, borderColor: 'red', fill: false },
        { label: 'Recovered', data: R, borderColor: 'green', fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { x: { title: { display: true, text: 'Days' } },
                y: { title: { display: true, text: 'People' } } }
    }
  });
}

// Handle form submit
document.getElementById("diseaseForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const population = parseInt(document.getElementById("population").value);
  const infected = parseInt(document.getElementById("infected").value);
  const beta = parseFloat(document.getElementById("beta").value);
  const gamma = parseFloat(document.getElementById("gamma").value);
  const days = parseInt(document.getElementById("days").value);

  const { t, Sdata, Idata, Rdata } = runSIR(population, infected, beta, gamma, days);

  drawChart(t, Sdata, Idata, Rdata);
});
