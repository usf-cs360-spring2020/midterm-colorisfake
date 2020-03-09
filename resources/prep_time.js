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

    c.sub.width = c.plot.width - c.sub.margins.left - c.sub.margins.right;
    c.sub.height = (c.plot.height / c.vis.weekdays) - c.sub.margins.top - c.sub.margins.bottom;


    // Test rectangles
    plot.append('rect')
        .attr('width', c.plot.width)
        .attr('height', c.plot.height)
        .style('fill', 'lemonChiffon');


    // Scales
    scales.hour = d3.scaleBand()
        .rangeRound([0,c.sub.width])
        .paddingInner(c.sub.padding_between_hours);

    scales.incidents = {};
    scales.incidents['medical'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-200,13237]);
    scales.incidents['fire'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-50,1426]);
    scales.incidents['traffic'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([-50,900]);

    // Load the data, then call another function
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

    // Finish scales
    let hours = [];
    let a_incident_type = organized[Object.keys(organized)[0]];
    let a_weekday = a_incident_type[Object.keys(a_incident_type)[0]];
    for (let hour in Object.keys(a_weekday)) {
        hours.push(hour.toString())
    }
    scales.hour.domain(hours);
    // console.log('hours', hours);

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
    // console.log('call_type', call_type);
    let id = c.vis.call_type_ids[call_type];
    // console.log(id);
    let this_svg = d3.select(`svg.visualization#${id}`);
    // console.log(this_svg);

    let plot = this_svg.select('g#plot');
    // console.log('plot', plot);



    console.log('data', data);
    let i = 0;
    let differential = 0;

    let med_incidents = [];
    // Loop through each weekday
    for (let weekday in data) {
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

        let test = sub.append('rect')
            .attr('width', c.sub.width)
            .attr('height', c.sub.height)
            .attr('fill', 'lightPink');


        let weekday_data = data[weekday];
        // console.log(weekday_data);
        // console.log('sub', sub);
        // console.log('test', test);


        // Loop though each hour
        for (let hour in weekday_data) {
            let hour_data = weekday_data[hour];
            // console.log('hour_data', hour_data);


            // Count incidents
            let incident_count = 0;
            hour_data.forEach(function(row) {
                incident_count += parseInt(row['Number of Records']);
            });
            // console.log('incident_count', incident_count);

            med_incidents.push(incident_count);

            let y_scaled = scales.incidents[c.vis.call_type_ids[call_type]](incident_count);
            let zero_value = scales.incidents[c.vis.call_type_ids[call_type]](0);
            sub.append('rect')
                .attr('width', scales.hour.bandwidth())
                .attr('height', c.sub.height - y_scaled) // TODO
                .attr('fill', 'blue') // TODO
                .attr('x', scales.hour(hour))
                .attr('y', y_scaled);
        }
    }
    console.log(Math.max(...med_incidents));
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