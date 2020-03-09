// Global Variables
let c = {
    svg: {
        height: 600,
        width: 900,
        pad: {
            top: 50,
            right: 20,
            bottom: 40,
            left: 10
        }
    },

    plot: {},

    sub: {
        margins: {
            top: 2,
            right: 5,
            bottom: 2,
            left: 100
        },
        padding_between_hours : 0.05
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

    // Setup each SVG and make the main groups
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

    c.sub.width = c.plot.width - c.sub.margins.left - c.sub.margins.right;
    c.sub.height = (c.plot.height / c.vis.weekdays) - c.sub.margins.top - c.sub.margins.bottom;


    // Make some test rectangles
    plot.append('rect')
        .attr('width', c.plot.width)
        .attr('height', c.plot.height)
        .style('fill', 'lemonChiffon');


    // Make the scales
    scales.hour = d3.scaleBand()
        .rangeRound([0,c.sub.width])
        .paddingInner(c.sub.padding_between_hours);

    scales.incidents = {};
    scales.incidents['fire'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-20,1426]);
    scales.incidents['medical'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-200,13237]);
    scales.incidents['traffic'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-15,900]);

    scales.color = {};
    scales.color['fire'] = d3.scaleSequential(d3.interpolateOranges)
        .domain([0.8862924282193209, 1.84355555554]);
    scales.color['medical'] = d3.scaleSequential(d3.interpolateBlues)
        .domain([0.8608115115257102, 1.5448774151841203]);
    scales.color['traffic'] = d3.scaleSequential(d3.interpolateGreys)
        .domain([0.8386801541069366, 1.8966183574492759]);


    // Load the data, then call another function
    let theData = d3.csv('resources/datasets/eve-all-data.csv', rowConverter)
        .then(drawVises);
}

/**
 * Draw the visualizations after the page has been prepped and the data loaded
 * @param theData the data loaded from csv
 */
function drawVises(theData) {
    // Put the data into nice groups
   let organized = organize(theData);
    console.log('organized', organized);

    // Finish scales
    let hours = [];
    let a_incident_type = organized[Object.keys(organized)[0]];
    let a_weekday = a_incident_type[Object.keys(a_incident_type)[0]];
    for (let hour in Object.keys(a_weekday)) {
        hours.push(hour.toString())
    }
    scales.hour.domain(hours);

    // Draw a vis for each type of call
    for (const call_type in organized) {
        drawVis(call_type, organized[call_type]);
    }
}

/**
 * Draw a single svg worth of visualization, for one call type
 * @param call_type the call type (as written in the data)
 * @param data the organized data for that call type
 */
function drawVis(call_type, data) {
    // Find the right SVG and plot element
    let id = c.vis.call_type_ids[call_type];
    let this_svg = d3.select(`svg.visualization#${id}`);
    let plot = this_svg.select('g#plot');

    // Draw a subplot for each weekday
    let i = 0;
    let differential = 0;

    for (let weekday in data) {
        let weekday_data = data[weekday];

        // Setup the SVG for this weekday
        let sub = plot.append('g')
            .attr('class','sub')
            .attr('id', i)
            .attr('width', c.sub.width)
            .attr('height', c.sub.height)
            // .attr('y', differential)
            .attr('transform', translate(c.sub.margins.left, c.sub.margins.top + differential));

        differential += c.sub.height + c.sub.margins.top + c.sub.margins.bottom;
        i += 1;

        // Make a test rectangle for each weekday subplot
        let test = sub.append('rect')
            .attr('width', c.sub.width)
            .attr('height', c.sub.height)
            .attr('fill', 'lightPink');


        // Loop though each hour, draw a bar for each
        for (let hour in weekday_data) {
            let hour_data = weekday_data[hour];

            // Calculate incident count and average preparation time
            let incident_count = 0;
            let total_time = 0.0;
            hour_data.forEach(function(row) {
                let incidents = parseInt(row['Number of Records']);
                incident_count += incidents;
                total_time += parseFloat(row['Avg. Processing Minutes']) * incidents;
            });
            let avg_prep_time = total_time / incident_count;

            // Make the bar
            let y_scaled = scales.incidents[c.vis.call_type_ids[call_type]](incident_count);
            let zero_value = scales.incidents[c.vis.call_type_ids[call_type]](0);
            let color = scales.color[c.vis.call_type_ids[call_type]](avg_prep_time);
            sub.append('rect')
                .attr('width', scales.hour.bandwidth())
                .attr('height', zero_value - y_scaled) // TODO
                .attr('fill', color) // TODO
                .attr('x', scales.hour(hour))
                .attr('y', y_scaled);
        }
    }
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

        hour_array.push(row);
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