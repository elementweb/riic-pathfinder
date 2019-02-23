module.exports = function(App) {
  App.chartSettings = {
    chart: {
      type: 'scatter',
      width: 600,
      height: 500,
      plotBorderWidth: 1,
      plotBorderColor: '#000000',
      animation: false,
      events: {
        redraw: function() {
          // App.pathFinder.addObservationRectangle(this);
        },
        load: function() {
          // App.pathFinder.addObservationRectangle(this);
        }
      }
    },
    exporting: { buttons: { contextButton: { enabled: false }}},
    tooltip: { enabled: false, animation: false },
    legend: { enabled: false },
    credits: { enabled: true, text: 'Data source: NASA Exoplanet Archive' },
    title: {
      text: 'RIIC Pathfinder v1.0.3',
      style: {"color": "#000000", "fontSize": "18px", "fontFamily": "Arial"}
    },
    subtitle: {
      text: 'date not yet set',
      style: {"color": "#000000", "fontSize": "14px", "fontFamily": "Monospace"}
    },
    xAxis: {
      title: {
        enabled: true,
        text: 'Ecliptical longitude (°)',
        style: {"color": "#000000", "fontSize": "14px", "fontFamily": "Arial", "fontWeight": "bold"},
      },
      labels: {
        style: {"color": "#000000", "fontSize": "13px", "fontFamily": "Arial", "fontWeight": "bold"},
        format: '{value}°'
      },
      lineColor: 'transparent',
      tickWidth: 1,
      tickColor: '#000000',
      tickInterval: 10,
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true,
      min: -30,
      max: 30
    },
    yAxis: {
      title: {
        enabled: true,
        text: 'Ecliptical latitude (°)',
        style: {"color": "#000000", "fontSize": "14px", "fontFamily": "Arial", "fontWeight": "bold"},
      },
      labels: {
        style: {"color": "#000000", "fontSize": "13px", "fontFamily": "Arial", "fontWeight": "bold"},
        format: '{value}°'
      },
      tickWidth: 1,
      tickColor: '#000000',
      tickInterval: 10,
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true,
      min: -30,
      max: 30,
      gridLineWidth: 0
    },
    plotOptions: {
      scatter: {
        enableMouseTracking: false,
        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        },
        tooltip: {
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x} cm, {point.y} kg'
        }
      }
    },
    series: []
  }
};
