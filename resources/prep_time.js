// Global Variables
let c = {
    svg: {
        height: 700,
        width: 900,
        pad: {
            top: 150,
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
            left: 140
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
    },

    overviewPlot : {
        margins: {
            top: 15,
            right : 0,
            bottom : 15,
            left : 500
        }
    }
};

let axes = {};

let scales = {};

let weekday_names = {
    0 : 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday'
};

/**
 * Draw the overviews
 * @param data the data to use to draw them
 */
function makeOverview(data) {
    let overviews = d3.selectAll('svg.visualization').selectAll('g#overview');

    // Make some test rectangles
    overviews.append('rect')
        .attr('width', c.plot.width)
        .attr('height', c.plot.height)
        .style('fill', 'green')
        .style('fill-opacity', .2);

    console.log('data in makeOverview: ', data);

}

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
    svgs.append('g')
        .attr('id', 'overview');

    // Setup the plot area
    c.plot.width = c.svg.width - c.svg.pad.right - c.svg.pad.left;
    c.plot.height = c.svg.height - c.svg.pad.top - c.svg.pad.bottom;
    let plot = svgs.select('g#plot')
        .attr('transform', translate(c.svg.pad.left, c.svg.pad.top))
        .attr('width', c.plot.width)
        .attr('height', c.plot.height);
    // Make some test rectangles
    plot.append('rect')
        .attr('width', c.plot.width)
        .attr('height', c.plot.height)
        .style('fill', 'yellow')
        .style('fill-opacity', .2);


    // Setup the axes area
    svgs.select('g#axes')
        .attr('transform', translate(c.svg.pad.left, c.svg.pad.top));


    // Calculate parameters for the subplot areas
    c.sub.width = c.plot.width - c.sub.margins.left - c.sub.margins.right;
    c.sub.height = (c.plot.height / c.vis.weekdays) - c.sub.margins.top - c.sub.margins.bottom;


    // Setup the overview area
    c.overviewPlot.height = c.svg.pad.top - c.overviewPlot.margins.top - c.overviewPlot.margins.bottom;
    c.overviewPlot.width = c.svg.width - c.overviewPlot.margins.left - c.overviewPlot.margins.right - c.svg.pad.right;
    let overviews = svgs.select('g#overview')
        .attr('transform', translate(c.overviewPlot.margins.left, c.overviewPlot.margins.top))
        .attr('width', c.overviewPlot.width)
        .attr('height', c.overviewPlot.height);
    // Test rectangles
    overviews.append('rect')
        .attr('width', c.overviewPlot.width)
        .attr('height', c.overviewPlot.height)
        .attr('fill', 'green')
        .attr('fill-opacity', 0.3);

    // Make the scales
    scales.hour = d3.scaleBand()
        .rangeRound([0,c.sub.width])
        .paddingInner(c.sub.padding_between_hours);

    scales.year = d3.scaleBand()
        .domain(['2001', '2019'])
        .rangeRound([0, c.overviewPlot.width])
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

    // Make some axes
    axes.incidents = {};
    axes.incidents['fire'] = d3.axisLeft(scales.incidents['fire'])
        .ticks(4);
    axes.incidents['medical'] = d3.axisLeft(scales.incidents['medical'])
        .ticks(4);
    axes.incidents['traffic'] = d3.axisLeft(scales.incidents['traffic'])
        .ticks(4);

    axes.hours = d3.axisBottom(scales.hour)
        .ticks(24);


    // Load the data, then call another function
    let theData = d3.csv('resources/datasets/eve-data-no-neighborhood.csv', rowConverter)
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

    // makeOverview(organized);

    // Enable Interactivity
    enableHover();
}

/**
 * Redraw the visualization with new data
 * @param data the set of data to include
 */
function refresh(data) {
    let agg = aggregateData(data);
    console.log('agg', agg);

    // TODO figure out how this will work
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

    // Figure out other useful info
    let plot = this_svg.select('g#plot');
    let call_type_name = c.vis.call_type_ids[call_type];
    let axisG = this_svg.select('g#axes');
    let axis = axes.incidents[call_type_name];

    // Aggregate the data newly
    let datathingthisisdumb = {};
    datathingthisisdumb[call_type] = data;
    let agg = aggregateData(datathingthisisdumb);
    console.log('agg', agg);
    let aggregated = agg.data;

        // Draw a subplot for each weekday
    let i = 0;
    let differential = 0;

    // Do work for each weekday
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
            .attr('fill', 'red')
            .attr('fill-opacity', 0.3);

        // Draw y axis
        drawYAxis(axisG, weekday_data, axis, i, differential);

        // Append rectangles!
        let aggregate = aggregated[call_type][weekday];
        let selection = sub.selectAll('rect.visBar')
            .data(aggregate)
            .enter()
            .append('rect')
            .attr('class', 'visBar')
            .attr('height', d => d.zero_value - d.y_scaled)
            .attr('width', scales.hour.bandwidth())
            .attr('fill', d => d.color)
            .attr('x', d => scales.hour(d['Hour']))
            .attr('y', d => d.y_scaled);

        // Clean up data elements for tooltip's use later
        for (let thing of aggregate) {
            delete thing.y_scaled;
            delete thing.zero_value;
            delete thing.color;
        }
    }

    // Draw x axis
    drawXAxis(axisG);
}

/**
 * Draw one Y axis for one weekday on one visualization, and the weekday
 * @param group the d3 selection where the axis should be drawn
 * @param data the data to use
 * @param axis the axis to use
 * @param i the weekday index
 * @param differential how much to shift the y havue by
 */
function drawYAxis(group, data, axis, i, differential) {
    let axisGroup = group.append('g')
        .attr('class', 'yAxis')
        .attr('id', i)
        .attr('transform', translate(c.sub.margins.left, c.sub.margins.top + differential));

    axisGroup.call(axis);

    let mid = midpoint(scales.incidents['medical']);


    let title = group.append('text')
        .text(weekday_names[i])
        .attr('class','sub_label_weekday')
        .attr('id', i)
        .style('font-size', '.8rem')
        .attr('x', 10)// .attr('x', c.sub.margins.left - 100)
        .attr('y', differential + 40); //.attr('y', c.sub.margins.top + differential + mid);

    // console.log('hello', group.size());
}

/**
 * Draw the x axis for hours on one visualization
 * @param group the d3 selection where the axis should be drawn
 */
function drawXAxis(group) {
    let axisGroup = group.append('g')
        .attr('class', 'xAxis')
        .attr('transform', translate(c.sub.margins.left, c.sub.margins.top + c.plot.height));
        // .attr('transform', translate(   /))

    axisGroup.call(axes.hours);
}

/**
 * Draw pesky text on one visualization
 * @param group the d3 selection of a group where the text should be written
 */
function drawText(group) {

}

// Hover tooltip interactivity
function enableHover() {
    let bars = d3.selectAll('rect.visBar');
    // console.log('found', bars.size(), 'bars');

    bars.on("mouseover.hover", function(d) {
        let me = d3.select(this);
        let div = d3.select("body").append("div");

        div.attr("id", "details");
        div.attr("class", "tooltip");

        let rows = div.append("table")
            .selectAll("tr")
            .data(Object.keys(d))
            .enter()
            .append("tr");

        rows.append("th").text(key => key).style('padding-right', '10px');
        rows.append("td").text(key => d[key]);
    });

    bars.on("mousemove.hover2", function(d) {
        let div = d3.select("div#details");

        // get height of tooltip
        let bbox = div.node().getBoundingClientRect();

        div.style("left", d3.event.pageX + "px")
        div.style("top",  (d3.event.pageY - bbox.height) + "px");
    });

    bars.on("mouseout.hover2", function(d) {
        d3.selectAll("div#details").remove();
        // d3.select(status).text("hover: none");
    });
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

/**
 * Aggregate a given subset of data, and calculate max and min values for incident count and avg. prep. time
 * @param data the data to average
 * @return Object aggregated data, as well as max and mins
 */
function aggregateData(data) {
    let answer = {
        data : {},
        minmax : {}
    };

    for (let incident in data) {
        answer.data[incident] = {};
        let incident_obj = data[incident];
        answer.minmax[incident] =  {};

        // console.log('incident', incident);
        let call_type_name = c.vis.call_type_ids[incident];

        answer.minmax[incident].max_incident_count = 0;
        answer.minmax[incident].min_incident_count = 1000000000000000;

        answer.minmax[incident].max_avg_resp = 0.0;
        answer.minmax[incident].min_avg_resp = 1000000000.0;

        // Do work for each weekday
        for (let weekday in incident_obj) {
            let weekday_data = incident_obj[weekday];

            // Loop though each hour, create a data element for each
            answer.data[incident][weekday] = [];
            let aggregate_bars = answer.data[incident][weekday];
            for (let hour in weekday_data) {
                let hour_data = weekday_data[hour];

                // Calculate incident count and average preparation time
                let incident_count = 0;
                let total_time = 0.0;
                hour_data.forEach(function (row) {
                    let incidents = parseInt(row['Number of Records']);
                    incident_count += incidents;
                    total_time += parseFloat(row['Avg. Processing Minutes']) * incidents;
                });
                let avg_prep_time = total_time / incident_count;

                // Calculate info for the bar
                let y_scaled = scales.incidents[call_type_name](incident_count);
                let zero_value = scales.incidents[call_type_name](0);
                let color = scales.color[call_type_name](avg_prep_time);

                // Make a data element for the bar
                let aggregated_hour_data = {
                    'Incident Count': incident_count,
                    'Avg. Prep. Time  ': `${avg_prep_time.toFixed(2)} mins`,
                    'Hour': hour,
                    'Weekday': weekday,
                    'Incident Type': incident,
                    y_scaled: y_scaled,
                    zero_value: zero_value,
                    color: color
                };
                aggregate_bars.push(aggregated_hour_data);

                // Update the min/max records
                if (incident_count < answer.minmax[incident].min_incident_count) {
                    answer.minmax[incident].min_incident_count = incident_count;
                } else if (incident_count > answer.minmax[incident].max_incident_count) {
                    answer.minmax[incident].max_incident_count = incident_count;
                }

                if (avg_prep_time < answer.minmax[incident].min_avg_resp) {
                    answer.minmax[incident].min_avg_resp = avg_prep_time;
                } else if (avg_prep_time > answer.minmax[incident].max_avg_resp) {
                    answer.minmax[incident].max_avg_resp = avg_prep_time;
                }
            }
        }
    }

    return answer;
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