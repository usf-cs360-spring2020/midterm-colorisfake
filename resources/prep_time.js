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

    plot: {},

    sub: {
        margins: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        }
    },

    vis: {
        weekdays: 7,
        call_type_ids: {
            'Medical Incident': 'medical',
            'Structure Fire': 'fire',
            'Traffic Collision': 'traffic'
        }
    }
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
        .then(drawVises);
}

/**
 * Draw the visualizations after the page has been prepped and the data loaded
 * @param theData the data loaded from csv
 */
function drawVises(theData) {
    // console.log('before organize', theData);
    let organized = organize(theData);
    console.log('organized', organized);

    for (let [call_type, data] of Object.entries(organized)) {
        drawVis(call_type, data);
    }
}

/**
 * Draw a single svg worth of visualization, for one call type
 * @param call_type the call type (as written in the data
 * @param data the organized data for that call type
 */
function drawVis(call_type, data) {
    let id = c.vis.call_type_ids[call_type];
    let svg = d3.select(`svg.visualization#${id}`);
    console.log(svg);
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
    let organized = {};

    for (let row of data) {
        let type = row['Call Type'];
        let weekday = row['Weekday of Entry Date and Time'];
        let hour = row['Hour of Entry Date and Time'];

        // Make sure the organized data has an object for each kind of incident
        if (! (type in organized))
            organized[type] = {};
        let call_type_obj = organized[type];

        // Make sure the call type object has an object for that weekday
        // console.log(call_type_obj);
        if (! (weekday in call_type_obj))
            call_type_obj[weekday] = {};
        let weekday_object = call_type_obj[weekday];

        // Make sure the weekday object has an object for that hour
        if (! (hour in weekday_object))
            weekday_object[hour] = [];
        let hour_array = weekday_object[hour];

        hour_array.push(data);
    }

    return organized;
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