// Taken from:
// https://github.com/chartjs/Chart.js/blob/master/samples/charts/doughnut.html
window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

let config = {
  type: 'doughnut',
  data: {
    datasets: [
      {
        data: ['22', '12', '67', '18', '33'],
        backgroundColor: [
          window.chartColors.red,
          window.chartColors.orange,
          window.chartColors.yellow,
          window.chartColors.green,
          window.chartColors.blue
        ],
        label: 'Dataset 1'
      }
    ],
    labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue']
  },
  options: {
    responsive: true,
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Chart.js Doughnut Chart'
    },
    // Helps make tests more determistic
    animation: {
      animateScale: false,
      animateRotate: false
    }
  }
};

window.onload = function() {
  let ctx = document.querySelector('#graphs').getContext('2d');

  window.myDoughnut = new Chart(ctx, config);
};
