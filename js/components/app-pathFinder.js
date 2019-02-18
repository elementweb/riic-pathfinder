let highcharts = require('highcharts');

module.exports = function(App) {
  App.pathFinder = {
    chart: {},

    data: {
      timestamp: null,
      exoplanets: [],
      series: [
        {
          name: 'Exoplanets',
          color: 'rgba(223, 83, 83, .5)',
          data: [
            [0, 0], [10, 10]
          ]
        },
        {
          name: 'NEOs',
          color: 'rgba(119, 152, 191, .5)',
          data: [
            [20, 10]
          ]
        }
      ],
      targetDashlineSettings: {
        'stroke-width': 2,
        stroke: 'silver',
        dashstyle: 'dash'
      },
      settings: {
        horizontal_obs_angle: 50,
        vertical_obs_angle: 50
      }
    },

    settings: {
      chart: {
        type: 'scatter',
        width: 500,
        height: 500,
        plotBorderWidth: 1,
        plotBorderColor: '#000000',
        events: {
          redraw: function() {
            App.pathFinder.addObservationRectangle(this);
          },
          load: function() {
            App.pathFinder.addObservationRectangle(this);
          }
        }
      },
      exporting: { buttons: { contextButton: { enabled: false }}},
      tooltip: { enabled: false },
      legend: { enabled: false },
      credits: { enabled: false },
      title: {
        text: 'RIIC Pathfinder',
        style: {"color": "#000000", "fontSize": "18px", "fontFamily": "Arial"}
      },
      subtitle: {
        text: 'Data source: NASA Exoplanet Archive',
        style: {"color": "#000000", "fontSize": "14px", "fontFamily": "Arial"}
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
    },

    initialize() {
      $.getJSON("https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?format=json&table=exoplanets&select=ra,dec,st_optmag&where=st_optmag>0%20and%20pl_tranflag>0", function( data ) {
        App.pathFinder.data.exoplanets = data;
        App.pathFinder.initializePlot();
      });
    },

    addObservationRectangle(chart) {
      var xAxis = chart.xAxis[0],
          yAxis = chart.yAxis[0];

      var x = xAxis.toPixels(-25),
          y = yAxis.toPixels(25),
          size_x = xAxis.toPixels(25) - xAxis.toPixels(-25),
          size_y = yAxis.toPixels(-25) - yAxis.toPixels(25);
      
      // FOV Box
      chart.renderer.rect(x, y, size_x, size_y).attr({
        'stroke-width': 1,
        stroke: '#868686',
        fill: 'transparent',
        zIndex: 0
      }).addClass('rect').add();

      // Vertical target path line
      chart.renderer.path(['M', xAxis.toPixels(0), yAxis.toPixels(-25), 'L', xAxis.toPixels(0), yAxis.toPixels(25)]).attr(App.pathFinder.data.targetDashlineSettings).add();

      // Horizontal target path line
      chart.renderer.path(['M', xAxis.toPixels(-25), yAxis.toPixels(0), 'L', xAxis.toPixels(25), yAxis.toPixels(0)]).attr(App.pathFinder.data.targetDashlineSettings).add();

      // chart.renderer.rect(0, 0, chart.plotLeft, chart.chartHeight + chart.plotTop, 50).attr({
      //   fill: 'white',
      //   zIndex: 0
      // }).addClass('rect').add();
      
      // chart.renderer.createElement('ellipse').attr({
      //   cx: 20,
      //   cy: 20,
      //   rx: 50,
      //   ry: 25,
      //   'stroke-width': 2,
      //   stroke: 'red',
      //   fill: 'yellow',
      //   zIndex: 3
      // }).add();
    },

    refresh() {
      // Logic for updating data goes here
      App.pathFinder.chart.series.find(el => el.name === 'NEOs').setData([[15, 15], [-15, 15]]);

      // App.pathFinder.chart.redraw();
    },

    initializePlot() {
      App.pathFinder.settings.series = App.pathFinder.data.series;

      App.pathFinder.chart = highcharts.chart('container', App.pathFinder.settings);
    }
  }
};
