// Global Variables
let c = {
    svg: {
        height: 600,
        width: 900,
        pad: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    },
    plot: {}
};

let axes = {};

let scales = {};

/**
 * Prepare the page for the visualization to be drawn
 */
function prepVis() {
    // Setup each svg and make the main groups
    let svgs = d3.selectAll('svg.visualization')
        .attr('width', c.svg.width)
        .attr('height', c.svg.height);
    console.log(svgs.size());
    svgs.append('g')
        .attr('id', 'axes');
    svgs.append('g')
        .attr('id', 'plot');
    svgs.append('g')
        .attr('id', 'text');

    c.plot.width = c.svg.width - c.svg.pad.right - c.svg.pad.left;
    c.plot.height = c.svg.height - c.svg.pad.top - c.svg.pad.bottom;
    let plot = svgs.select('g#plot')
        .attr('transform', translate(c.svg.pad.left, c.svg.pad.top))
        .attr('width', c.plot.width)
        .attr('height', c.plot.height);

    // Test rectangles
    // plot.append('rect')
    //     .attr('width', c.plot.width)
    //     .attr('height', c.plot.height)
    //     .style('fill', 'pink');

    let theData = d3.csv('resources/datasets/eve-all-data.csv', rowConverter)
        .then(drawVis);
}

/**
 * Draw the visualizations after the page has been prepped and the data loaded
 * @param theData the data loaded from csv
 */
function drawVis(theData) {
    console.log('before organize', theData);
    let organized = organize(theData);
    console.log('organized', organized)
}

/**
 * Convert a csv row to a row of data for the visualization
 * @param row the raw row of data from the csv file
 * @return the processed row
 */
function rowConverter(row) {
    return row;
}

/**
 * Take long data and make it into a more organized format
 * @param data the long data
 * @return the same data organized by incident type, then hour and weekday
 */
function organize(data) {
    let organized = {}

    for (let row of data) {

    }
}

prepVis();

/**
 * Sophie's helpful helper method to make translating easier. Thank you, Sophie!
 */
function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

/**
 * Calculates the midpoint of a range given as a 2 element array
 * @source Sophie! Thank you.
 */
function midpoint(range) {
    return range[0] + (range[1] - range[0]) / 2.0;
}