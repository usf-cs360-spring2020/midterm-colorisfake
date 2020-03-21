/*
* LINKING SET UP
*/

let activeNeighborhood;
let formatter = d3.format(".2f");
let idformatter = d3.format(".0f");

var barData;
var lineData;
var heatData;


/*******************************************************************************/


/*
* BAR + LINE CHART
*/

const barLineMargin = {
  top: 85,
  bottom: 150,
  left: 50,
  right: 30
};


/* PLOT */
let barLineSvg = d3.select("body").select("svg#BarLineVis");
const barLinePlot = barLineSvg.append("g").attr("id", "barLinePlot");

barLinePlot.attr("transform", "translate(" + barLineMargin.left + "," + barLineMargin.top + ")");


/* SCALES */
let barLineBounds = barLineSvg.node().getBoundingClientRect();
let barLinePlotWidth = barLineBounds.width - barLineMargin.right - barLineMargin.left;
let barLinePlotHeight = barLineBounds.height - barLineMargin.top - barLineMargin.bottom;

const barLineScales = {
  x: d3.scaleBand(),
  y: d3.scaleLinear(),
};

barLineScales.x.range([550 - barLineMargin.left - barLineMargin.right, 0]);

let barLineCountMin = 0;
let barLineCountMax = 45;

barLineScales.y
    .domain([barLineCountMin, barLineCountMax])
    .range([barLinePlotHeight, 0])
    .nice();

let yGroup = barLinePlot.append("g").attr("id", "y-axis-barline").attr('class', 'axis');
let yAxis = d3.axisLeft(barLineScales.y);

yAxis.ticks(5, 's').tickSizeOuter(0);
yGroup.call(yAxis);

const barLineGridAxis = d3.axisLeft(barLineScales.y).tickSize(-barLinePlotWidth - 15).tickFormat('').ticks(0);
let barLineGridGroup = barLinePlot.append("g").attr("id", "grid-axis")
  .attr('class', 'axis')
  .call(barLineGridAxis);


/* PLOT SETUP */
drawBarLineTitles();
drawBarLineLegend();


/* LOAD THE DATA */
d3.csv("data/Hospital_Access_Bar_Data.csv", parseBarLineData).then(function(data) {
  barData = data.filter(d => d.numType === "Avg. On Scene to Hospital");
  lineData = data.filter(d => d.numType === "Avg. Recieving Call to On Scene");

  drawBarLineCharts(data);
});


/* AXIS TITLES */
function drawBarLineTitles() {

  let xMiddle = barLineMargin.left + midpoint(barLineScales.x.range());
  let yMiddle = barLineMargin.top + midpoint(barLineScales.y.range());

  let xTitle = barLineSvg.append('text')
    .attr('class', 'axis-title')
    .attr('id', 'axis-title')
    .text('Neighborhoods');

  xTitle.attr('x', barLineBounds.width - barLineMargin.right - 50);
  xTitle.attr('y', 85);
  xTitle.attr('dy', -8);
  xTitle.attr('text-anchor', 'middle');

  let yTitleGroup = barLineSvg.append('g');
  yTitleGroup.attr('transform', translate(4, yMiddle));

  let yTitle = yTitleGroup.append('text')
    .attr('class', 'axis-title')
    .attr('id', 'axis-title')
    .text('Minutes');

  yTitle.attr('x', 0);
  yTitle.attr('y', 0);

  yTitle.attr('dy', 15);
  yTitle.attr('text-anchor', 'middle');
  yTitle.attr('transform', 'rotate(-90)');
}


/* LEGEND */
function drawBarLineLegend(){

  let legendGroup = barLineSvg.append('g').attr('id', 'legend');
  legendGroup.attr('transform', translate(barLineMargin.left - 10, 5));

  let legendbox = legendGroup.append('rect')
    .attr('x', 0)
    .attr('y', 20)
    .attr('width', 140)
    .attr('height', 75)
    .style('fill', 'none');

  legendGroup.append('rect')
    .attr('x', 10)
    .attr('y', 28)
    .attr('width', 15)
    .attr('height', 15)
    .style('fill', '395d87');

  legendGroup.append('text')
      .attr('class', 'legend-title')
      .attr('id', 'legend-title')
      .attr('x', 30)
      .attr('y', 40)
      .attr('font-size', 11)
      .text('Avg. Minutes from Recieving Call to On Scene');

  legendGroup.append('rect')
    .attr('x', 10)
    .attr('y', 52)
    .attr('width', 15)
    .attr('height', 15)
    .style('fill', 'a3c7e1');

  legendGroup.append('text')
      .attr('class', 'legend-title')
      .attr('id', 'legend-title')
      .attr('x', 30)
      .attr('y', 62)
      .attr('font-size', 11)
      .text('Avg. Minutes from On Scene to Hospital');
}


/*
* Draw the bar & line chart
*/
function drawBarLineCharts(data) {

  /* DRAW AXIS */
  let neighborhoods = data.map(row => row.neighborhoods);
  barLineScales.x.domain(neighborhoods);

  let xGroup = barLinePlot.append("g").attr("id", "x-axis-barline").attr('class', 'axis');
  let xAxis = d3.axisBottom(barLineScales.x).tickPadding(0).tickSizeOuter(0);

  xGroup.attr('transform', translate(0, barLinePlotHeight));
  xGroup.call(xAxis)
    .selectAll("text")
      .attr("y", 4)
      .attr("x", -5)
      .attr("dy", ".35em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "end");

  const barLineGroup = barLinePlot.append('g').attr('id', 'barline');

  /* Bar Chart */
  const bars = barLineGroup
    .selectAll("rect")
    .attr("id", "bars")
    .data(barData, function(d) { return d[0]; })
    .enter()
    .append("rect")
      .attr("class", d => d.neighborhoods)
      .attr("x", d => (barLineScales.x(d.neighborhoods) + (barLineScales.x.bandwidth() / 2)))
      .attr("y", d => barLineScales.y(d.time))
      .attr("width", barLineScales.x.bandwidth() - 3)
      .attr("height", d => barLinePlotHeight - barLineScales.y(d.time))
      .style("fill", "#a3c7e1")
      .on("mouseover", function(d) {
        let lineMatch = lineData.filter(e => e.neighborhoods === d.neighborhoods);
        barMouseover(d, lineMatch);
      })
      .on("mouseout", function(d) {
        barMouseout(d);
      });


  /* Line Chart */
  const line = barLineGroup
    .datum(lineData)
    .append("path")
    .attr("id", "line")
    .attr("d", d3.line()
      .x(function(d) { return (barLineScales.x(d.neighborhoods) + (barLineScales.x.bandwidth())) })
      .y(function(d) { return barLineScales.y(d.time) })
    )
    .style("fill", "none")
    .style("stroke", "#395d87")
    .style("stroke-width", 5);
}


/*
 * Convert values as necessary and discard unused columns
 */
function parseBarLineData(row){

  let keep = {};

  keep.numType = row["Measure Names"];
  keep.neighborhoods = row["Neighborhooods"];
  keep.time = parseFloat(row["Avg. On Scene to Hospital Avg. Recieving Call to On Scene"]);

  return keep;
}


/*******************************************************************************/


/*
* HEATMAP
*/

const heatMargin = {
  top: 120,
  bottom: 10,
  left: 160,
  right: 10
};


/* PLOT */
let heatSvg = d3.select("body").select("svg#HeatVis");
const heatPlot = heatSvg.append("g").attr("id", "plot");

heatPlot.attr("transform", "translate(" + heatMargin.left + "," + heatMargin.top + ")");


/* SCALES */
let heatBounds = heatSvg.node().getBoundingClientRect();
let heatPlotWidth = heatBounds.width - heatMargin.right - heatMargin.left;
let heatPlotHeight = heatBounds.height - heatMargin.top - heatMargin.bottom;

const heatScales = {
  x: d3.scaleBand(),
  y: d3.scaleBand(),
  color: d3.scaleSequential(d3.interpolateBlues)
};

heatScales.x.range([750 - heatMargin.left - heatMargin.right, 0]);
heatScales.y.range([800 - heatMargin.top - heatMargin.bottom, 0]);

heatScales.color.domain([20, 110]);


/* PLOT SETUP */
drawHeatTitles();
drawHeatLegend();


/* LOAD THE DATA */
d3.csv("data/Hospital_Access_Heatmap_Data.csv", parseHeatmapData).then(drawHeatmap);


/* AXIS TITLES */
function drawHeatTitles() {

    const xMiddle = heatMargin.left + midpoint(heatScales.x.range());
    const yMiddle = heatMargin.top + midpoint(heatScales.y.range());

    const xTitleGroup = heatSvg.append('g');
    const xTitle = xTitleGroup.append('text')
      .attr('class', 'axis-title')
      .attr("id", "axis-title")
      .text('Call Type Groups');

    xTitle.attr('x', xMiddle);
    xTitle.attr('y', 0 + heatMargin.top - 18);
    xTitle.attr('dy', -4);
    xTitle.attr('text-anchor', 'middle');

    const yTitleGroup = heatSvg.append('g');
    yTitleGroup.attr('transform', translate(4, yMiddle));

    const yTitle = yTitleGroup.append('text')
      .attr('class', 'axis-title')
      .attr("id", "axis-title")
      .text('Neighborhoods');

    yTitle.attr('x', 0);
    yTitle.attr('y', 0);

    yTitle.attr('dy', -353);
    yTitle.attr('dx', 0);
}


/* LEGEND */
function drawHeatLegend(){

  const legendWidth = 300;
  const legendHeight = 25;

  const colorGroup = heatSvg.append('g').attr('id', 'color-legend');
  colorGroup.attr('transform', translate(18, heatMargin.top - 110));

  const title = colorGroup.append('text')
    .attr('class', 'legend-title')
    .attr('id', 'legend-title')
    .text('Time between Recieving Call and Arrival at Hospital (Minutes)');

  title.attr('dy', 12);

  const colorbox = colorGroup.append('rect')
    .attr('x', 0)
    .attr('y', 12 + 6)
    .attr('width', legendWidth)
    .attr('height', legendHeight);

  const colorDomain = [d3.min(heatScales.color.domain()), d3.max(heatScales.color.domain())];
  heatScales.percent = d3.scaleLinear()
    .range([0, 100])
    .domain(colorDomain);

  const defs = heatSvg.append('defs');

  defs.append('linearGradient')
    .attr('id', 'gradient')
    .selectAll('stop')
    .data(heatScales.color.ticks())
    .enter()
    .append('stop')
    .attr('offset', d => heatScales.percent(d) + '%')
    .attr('stop-color', d => heatScales.color(d));

  colorbox.attr('fill', 'url(#gradient)');

  heatScales.legend = d3.scaleLinear()
    .domain(colorDomain)
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(heatScales.legend)
    .tickValues(heatScales.color.domain())
    .tickSize(legendHeight)
    .tickSizeOuter(0);

  const axisGroup = colorGroup.append('g')
    .attr('id', 'color-axis')
    .attr('transform', translate(0, 12 + 6))
    .call(legendAxis);
}


/*
* Draw the heatmap
*/
function drawHeatmap(data) {

  /* DRAW AXIS */
  let neighborhoods = data.map(row => row.neighborhoods);
  heatScales.y.domain(neighborhoods);

  let callTypeGroups = data.map(row => row.callType);
  heatScales.x.domain(callTypeGroups);

  let xGroup = heatPlot.append("g").attr("id", "x-axis-heat").attr('class', 'axis');
  let yGroup = heatPlot.append("g").attr("id", "y-axis-heat").attr('class', 'axis');

  let xAxis = d3.axisTop(heatScales.x).tickPadding(0).tickSizeOuter(0);
  let yAxis = d3.axisRight(heatScales.y).tickPadding(0).tickSizeOuter(0);

  xGroup.attr('transform', translate(0, heatMargin.top - 120));
  xGroup.call(xAxis);

  yGroup.attr('transform', translate(-160, 0));
  yGroup.call(yAxis);

  /* CREATE CELLS */
  let rows = heatPlot.selectAll("g.cell")
    .data(data)
    .enter()
    .append("g");

  rows.attr("class", "cell");
  rows.attr("id", d => d.neighborhoods);

  rows.attr("transform", function(d) {
    return translate(0, heatScales.y(d.neighborhoods));
  });

  let cells = rows.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("class", d => d.neighborhoods)
      .attr("id", d => d.callType[0] + d.callType[1] + d.callType[2])
      .attr("x", d => heatScales.x(d.callType))
      .attr("y", d => heatScales.y(d.neighborhoods))
      .attr("width", heatScales.x.bandwidth())
      .attr("height", heatScales.y.bandwidth())

      /* remove null values */
      .style("fill", "grey")
      .filter(d => d.recievingToHospital >= 0)

      /* color in rest of the cells */
      .style("fill", d => heatScales.color(d.recievingToHospital))
      .style("stroke", d => heatScales.color(d.recievingToHospital))
      .on("mouseover", function(d) {

        let lineMatch = lineData.filter(e => e.neighborhoods === d.neighborhoods);

        console.log(lineData[20]);
        console.log(d.neighborhoods);
        console.log("Linematch: " + lineMatch.neighborhoods);


        barMouseover(d, lineMatch);
        heatMouseover(d);
      })
      .on("mouseout", function(d) {
        heatMouseout(d);
        barMouseout(d);
      });
}


/*
 * Convert values as necessary and discard unused columns
 */
function parseHeatmapData(row){

  let keep = {};


  keep.callType = row["Call Type Group"];
  keep.neighborhoods = row["Neighborhooods"];
  keep.recievingToHospital = parseFloat(row["Avg. Recieving Call to Hospital"]);

  return keep;
}


/*******************************************************************************/


/*
* MOUSE OVER EVENTS
*/


/*
* Handle mouse over events for the heatmap
*/
function heatMouseover(d){

  let rows = heatPlot.selectAll("g.cell");

  let tooltip = formatter(d.recievingToHospital) + " minutes";
  console.log(tooltip);
  console.log(d.neighborhoods);

  rows.append("rect")
    .attr("id", "heatBack")
    .attr('pointer-events', 'none')
    .attr("x", heatScales.x(d.callType))
    .attr("y", heatScales.y(d.neighborhoods))
    .style("fill", "pink")
    .attr("width", heatScales.x.bandwidth())
    .attr("height", heatScales.y.bandwidth())
    // .on("mouseout", function(d) {
    //   barMouseout(d);
    //   heatMouseout(d);
    // });

  // let cellID = "#" + d.callType[0] + d.callType[1] + d.callType[2];
  // d3.select(cellID)
  //   .transition()
  //   .style("fill", "pink")
  //   .style("stroke", "pink");;
  //
  //   console.log("cell id found: " + d3.select(cellID).size());


  rows.append("text")
    .attr("id", "heatNumber")
    .attr('pointer-events', 'none')
    .attr("x", heatScales.x(d.callType) + 4)
    .attr("y", heatScales.y(d.neighborhoods) + 12)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .style("fill", "black")
    .style("font-weight", "bold")
    .text(tooltip);

    console.log("found heat number:", d3.selectAll("#heatNumber").size());
}

/*
* Handle mouse out events for the heatmap
*/
function heatMouseout(d){
  let rows = heatPlot.selectAll("g.cell");

  rows.selectAll("#heatNumber").remove();

  // let cellID = "#" + d.callType[0] + d.callType[1] + d.callType[2];
  // d3.select(cellID)
  //   .transition()
  //   .style("fill", heatScales.color(d.recievingToHospital))
  //   .style("stroke", heatScales.color(d.recievingToHospital));


  rows.selectAll("#heatBack").remove();
  console.log("found now:", d3.selectAll("#heatNumber").size());
}


/*
* Handle mouse over events for the bar chart
*/
function barMouseover(d, lineMatch){

  let barLineGroup = d3.select("g#barline");
  let bars = barLineGroup.selectAll("rect");

  bars.filter(e => (d.neighborhoods !== e.neighborhoods))
    .transition()
    .style("fill", "#bbbbbb");

  let tooltip1 = "On Scene to Hospital: " + formatter(d.time) + " minutes";
  let tooltip2 = "Recieving Call to On Scene: " + formatter(lineMatch[0].time) + " minutes";

  barLineGroup.append("text")
    .attr("id", "barTooltipN")
    .attr("x", barLineBounds.width - barLineMargin.right - 50)
    .attr("y", -75)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .style("fill", "#395d87")
    .style("font-weight", "bold")
    .text(d.neighborhoods);

  barLineGroup.append("text")
    .attr("id", "barTooltip1")
    .attr("x", barLineBounds.width - barLineMargin.right - 50)
    .attr("y", -35)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .style("fill", "#395d87")
    .text(tooltip1);

  barLineGroup.append("text")
    .attr("id", "barTooltip2")
    .attr("x", barLineBounds.width - barLineMargin.right - 50)
    .attr("y", -55)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .style("fill", "#395d87")
    .text(tooltip2);
}

/*
* Handle mouse out events for the bar chart
*/
function barMouseout(d){

  let barLineGroup = d3.select("g#barline");
  let bars = barLineGroup.selectAll("rect");

  bars.transition().style("fill", "#a3c7e1");

  d3.select("g#barline").select("#barTooltipN").remove();
  d3.select("g#barline").select("#barTooltip1").remove();
  d3.select("g#barline").select("#barTooltip2").remove();
}


/*******************************************************************************/


/*
* SHARED FUNCTIONS
*/

/*
 * From bubble.js example:
 * calculates the midpoint of a range given as a 2 element array
 */
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

/*
 * From bubble.js example:
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}
