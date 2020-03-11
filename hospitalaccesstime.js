const width = 960;
const height = 800;


/*******************************************************************************/


/*
* HEATMAP
*/


const heatMargin = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10
};


/* PLOT */
let heatSvg = d3.select("body").select("svg#HeatVis");
const heatPlot = heatSvg.append("g").attr("id", "plot");

heatPlot.attr("transform", "translate(" + heatMargin.left + "," + heatMargin.top + ")");


/* SCALES */
let bounds = heatSvg.node().getBoundingClientRect();
let plotWidth = bounds.width - heatMargin.right - heatMargin.left;
let plotHeight = bounds.height - heatMargin.top - heatMargin.bottom;

const heatScales = {
  x: d3.scaleBand(),
  y: d3.scaleBand(),
  color: d3.scaleSequential(d3.interpolateBlues)
};

heatScales.x.range([width - heatMargin.left - heatMargin.right, 0]);
heatScales.y.range([height - heatMargin.top - heatMargin.bottom, 0]);

heatScales.color.domain([23.5, 106.0]);


/* PLOT SETUP */
drawHeatTitles();
drawHeatLegend();


/* LOAD THE DATA */
d3.csv("data/Hospital_Access_Heatmap_Data.csv", parseHeatmapData).then(drawHeatmap);


/* AXIS TITLES */
function drawHeatTitles() {

    const xMiddle = heatMargin.left + midpoint(heatScales.x.range());
    const yMiddle = heatMargin.top + midpoint(heatScales.y.range());

    // const xTitleGroup = heatSvg.append('g');
    // const xTitle = xTitleGroup.append('text')
    //   .attr('class', 'axis-title')
    //   .text('Call Type Groups');
    //
    // xTitle.attr('x', xMiddle);
    // xTitle.attr('y', height);
    // xTitle.attr('dy', -4);
    // xTitle.attr('text-anchor', 'middle');

    const yTitleGroup = heatSvg.append('g');
    yTitleGroup.attr('transform', translate(4, yMiddle));

    const yTitle = yTitleGroup.append('text')
      .attr('class', 'axis-title')
      .text('Neighborhoods');

    yTitle.attr('x', 0);
    yTitle.attr('y', 0);

    //yTitle.attr('dy', -368);
    //yTitle.attr('dx', 0);
}


/* LEGEND */
function drawHeatLegend(){

  const legendWidth = 250;
  const legendHeight = 20;

  const colorGroup = heatSvg.append('g').attr('id', 'color-legend');
  colorGroup.attr('transform', translate(width - heatMargin.right - legendWidth -20, heatMargin.top - 70));

  const title = colorGroup.append('text')
    .attr('class', 'axis-title')
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

  data = data.sort(function(a, b) {
    return a["Neighborhooods"] - b["Neighborhooods"];
  });

  /* DRAW AXIS */
  let neighborhoods = data.map(row => row.neighborhoods);
  heatScales.y.domain(neighborhoods);

  let callTypeGroups = data.map(row => row.callType);
  heatScales.x.domain(callTypeGroups);

  let xGroup = heatPlot.append("g").attr("id", "x-axis-heat").attr('class', 'axis');
  let yGroup = heatPlot.append("g").attr("id", "y-axis-heat").attr('class', 'axis');

  let xAxis = d3.axisTop(heatScales.x).tickPadding(0).tickSizeOuter(0);
  let yAxis = d3.axisRight(heatScales.y).tickPadding(0).tickSizeOuter(0);

  xGroup.attr('transform', translate(0, heatMargin.top - 75));
  xGroup.call(xAxis);

  //yGroup.attr('transform', translate(-181, 0));
  yGroup.call(yAxis);


  /* CREATE CELLS */
  let cols = heatPlot.selectAll("g.cell")
    .data(data)
    .enter()
    .append("g");

  cols.attr("class", "cell");
  cols.attr("id", d => d.callType);

  cols.attr("transform", function(d) {
    return translate(0, heatScales.y(d.neighborhood));
  });

  let cells = cols.selectAll("rect")
    .data(data)
    .enter()
    .append("rect");

  cells.attr("x", d => heatScales.x(d.callType));
  cells.attr("y", d => heatScales.y(d.neighborhood));
  cells.attr("width", heatScales.x.bandwidth());
  cells.attr("height", heatScales.y.bandwidth());

  /* COLOR */
  cells.style("fill", d => heatScales.color(d.recievingToHospital));
  cells.style("stroke", d => heatScales.color(d.recievingToHospital));

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
* BAR + LINE CHART
*/


const barLineMargin = {
  top: 40,
  bottom: 50,
  left: 70,
  right: 30
};


/* PLOT */
let barLineSvg = d3.select("body").select("svg#BarLineVis");
const barLinePlot = barLineSvg.append("g").attr("id", "barLinePlot");

barLinePlot.attr("transform", "translate(" + barLineMargin.left + "," + barLineMargin.top + ")");


/* LOAD THE DATA */
d3.csv("data/Hospital_Access_Bar_Data.csv", parseBarLineData).then(drawBarLineCharts);


/*
* Draw the heatmap
*/
function drawBarLineCharts(data) {

}


/*
 * Convert values as necessary and discard unused columns
 */
function parseBarLineData(row){

  let keep = {};

  keep.numType = row["Measure Names"];
  keep.neighborhoods = row["Neighborhooods"];
  keep.onSceneToHospital = parseFloat(row["Avg. On Scene to Hospital"]);
  keep.recievingToOnScene = parseFloat(row["Avg. Recieving Call to On Scene"]);

  return keep;
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
