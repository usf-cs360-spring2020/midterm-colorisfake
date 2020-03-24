// Global Variables
let c = {
    svg: {
        height: 700,
        width: 900,
        pad: {
            top: 200,
            right: 20,
            bottom: 40,
            left: 10
        }
    },

    plot: {},

    sub: {
        margins: {
            top: 4,
            right: 5,
            bottom: 4,
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
        },
        call_type_names: {
            'medical' : 'Medical Incident',
            'fire' : 'Structure Fire',
            'traffic' : 'Traffic Collision'
        }
    },

    overviewPlot : {
        margins: {
            top: 40,
            right : 0,
            bottom : 30,
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
let megaData = {};

// Main methods
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
    // plot.append('rect')
    //     .attr('width', c.plot.width)
    //     .attr('height', c.plot.height)
    //     .style('fill', 'yellow')
    //     .style('fill-opacity', .2);


    // Setup the axes area
    svgs.select('g#axes')
        .attr('transform', translate(c.svg.pad.left, c.svg.pad.top));

    // Calculate parameters for the subplot areas
    c.sub.width = c.plot.width - c.sub.margins.left - c.sub.margins.right;
    c.sub.height = (c.plot.height / c.vis.weekdays) - c.sub.margins.top - c.sub.margins.bottom;


    // Setup the overview area
    c.overviewPlot.height = c.svg.pad.top - c.overviewPlot.margins.top - c.overviewPlot.margins.bottom;
    c.overviewPlot.width = c.svg.width - c.overviewPlot.margins.left - c.overviewPlot.margins.right - c.svg.pad.right - c.sub.margins.right;
    let overviews = svgs.select('g#overview')
        .attr('transform', translate(c.overviewPlot.margins.left, c.overviewPlot.margins.top))
        .attr('width', c.overviewPlot.width)
        .attr('height', c.overviewPlot.height);

    // Test rectangles
    // overviews.append('rect')
    //     .attr('width', c.overviewPlot.width)
    //     .attr('height', c.overviewPlot.height)
    //     .attr('fill', 'green')
    //     .attr('fill-opacity', 0.3);

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
        .domain([0,1426]);
    scales.incidents['medical'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([0,13237]);
    scales.incidents['traffic'] = d3.scaleLinear()
        .range([c.sub.height,0])
        .domain([0,900]);

    scales.incidentsOverview = {};
    scales.incidentsOverview['fire'] = d3.scaleLinear()
        .range([c.overviewPlot.height,0])
        .domain([0,11267 + 200]);
    scales.incidentsOverview['medical'] = d3.scaleLinear()
        .range([c.overviewPlot.height,0])
        .domain([0,116657]);
    scales.incidentsOverview['traffic'] = d3.scaleLinear()
        .range([c.overviewPlot.height,0])
        .domain([0,4907+200]);

    scales.color = {};
    scales.color['fire'] = d3.scaleSequential(d3.interpolateOranges)
        .domain([0.5, 1.84355555554]);
    scales.color['medical'] = d3.scaleSequential(d3.interpolateBlues)
        .domain([0.5, 1.5448774151841203]);
    scales.color['traffic'] = d3.scaleSequential(d3.interpolateGreys)
        .domain([0.5, 1.8966183574492759]);

    // Make some axes
    axes.incidents = {};
    axes.incidents['fire'] = d3.axisLeft(scales.incidents['fire'])
        .ticks(4, 's');
    axes.incidents['medical'] = d3.axisLeft(scales.incidents['medical'])
        .ticks(4, 's');
    axes.incidents['traffic'] = d3.axisLeft(scales.incidents['traffic'])
        .ticks(4, 's');

    axes.incidentsOverview = {};
    axes.incidentsOverview['fire'] = d3.axisLeft(scales.incidentsOverview['fire'])
        .ticks(4, 's');
    axes.incidentsOverview['medical'] = d3.axisLeft(scales.incidentsOverview['medical'])
        .ticks(4, 's');
    axes.incidentsOverview['traffic'] = d3.axisLeft(scales.incidentsOverview['traffic'])
        .ticks(4, 's');

    axes.hours = d3.axisBottom(scales.hour)
        .ticks(24);

    axes.years = d3.axisBottom(scales.year)
        .tickFormat(d => "'" + d.substring(2,5));


    // Load the data, then call another function
    let theData = d3.csv('data/eve-data-no-neighborhood.csv', rowConverter)
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
        makeOverview(call_type, organized[call_type]);
    }

    // Enable Interactivity
    enableHover();
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
    megaData[call_type] = data;
    let agg = aggregateData(megaData);
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

        // Make a test rectangle for each weekday subplot
        // let test = sub.append('rect')
        //     .attr('width', c.sub.width)
        //     .attr('height', c.sub.height)
        //     .attr('fill', 'red')
        //     .attr('fill-opacity', 0.3);

        // Draw y axis
        drawYAxis(axisG, weekday_data, axis, i, differential);

        differential += c.sub.height + c.sub.margins.top + c.sub.margins.bottom;
        i += 1;

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

    // Draw some pesky text
    drawText(this_svg.select('g#text'), call_type);

    // Make a legend
    let legend = d3.legendColor()
        .cells(5)
        .labelFormat(d3.format(".2f"))
        .ascending(true)
        .titleWidth(200)
        .shapePadding(10)
        .shapeWidth(25)
        .title('Average Preparation Times :')
        .orient('horizontal')
        .scale(scales.color[call_type_name]);

    let legendTarget = this_svg.append("g")
        .attr("class", "legendQuant")
        .attr("transform", translate(c.svg.pad.left + 20 + 5, c.svg.pad.top - 60 - 30));

    legendTarget.call(legend)

}

// Extras for the main visualization
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

    axisGroup.transition().call(axis);

    let mid = midpoint(scales.incidents['medical']);


    let title = group.append('text')
        .text(weekday_names[i])
        .attr('class','sub_label_weekday')
        .attr('id', i)
        .style('font-size', '.8rem')
        .attr('x', 10)
        .attr('y', differential + 40);

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

    axisGroup.call(axes.hours);
}
/**
 * Draw pesky text on one visualization
 * @param group the d3 selection of a group where the text should be written
 * @param call_type the type of call
 */
function drawText(group, call_type) {
    let title = `Incident Volume and Average`;
    let title2 = `Prep. Time for ${call_type}s`;

    // Vis title
    group.append('text')
        .text(title)
        .attr('class','visTitle')
        .attr('x', 30)
        .attr('y', 50);
    group.append('text')
        .text(title2)
        .attr('class','visTitle')
        .attr('x', 30)
        .attr('y', 50+35);

    // 'Hour of day'
    group.append('text')
        .text('Hour of Day :')
        .attr('class','axisTitle')
        .attr('x', c.svg.pad.left + 77)
        .attr('y', c.svg.pad.top + c.plot.height + 22);

    // Weekday
    group.append('text')
        .text('Weekday')
        .attr('class','axisTitleBigger')
        .attr('x', c.svg.pad.left + 5 )
        .attr('y', c.svg.pad.top - 5);

    // 'Incident Count'
    let y_group = group.append('g')
        .attr('transform', translate(c.svg.pad.left + 100, c.plot.height + c.svg.pad.top ));
    y_group.append('text')
        .text('Incident Count :')
        .attr('class','axisTitle')
        .attr('transform', 'rotate(270)')
        .attr('x', 0)
        .attr('y', 0);
}
// Hover tooltip interactivity
function enableHover() {
    let bars = d3.selectAll('rect.visBar');

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
    });

    // Thank you Sophie Engle for this code
}

// Overview main method
/**
 * Draw the overviews
 * @param call_type the call type to draw
 * @param data the data to use to draw them
 */
function makeOverview(call_type, data) {
    let coded_call_type = c.vis.call_type_ids[call_type];

    let overview = d3.select(`svg.visualization#${coded_call_type}`).selectAll('g#overview');
    let overviewPlot = overview.append('g')
        .attr('class', 'plotArea');

    let processed_data = process_data_overview(data, call_type);

    let selection = overviewPlot.selectAll('rect.visBar#overview')
        .data(processed_data)
        .enter();

    selection.append('rect')
        .attr('class', 'visBar overview')
        .attr('id', d=>  d['Year'])
        .attr('x', d => scales.year(d['Year']))
        .attr('y', d => d.y_scaled)
        .attr('width', d => scales.year.bandwidth())
        .attr('height', d => d.zero_value - d.y_scaled)
        .attr('fill', d => d.color);

    // Clean up data elements for tooltip's use later
    for (let thing of processed_data) {
        delete thing.y_scaled;
        delete thing.zero_value;
        delete thing.color;
    }

    let axisGOverview = overview.append('g')
        .attr('class', 'overviewAxis');
    drawXAxisOverview(axisGOverview);
    drawYAxisOverview(axisGOverview, {}, axes.incidentsOverview[coded_call_type], 0, 0);

    drawOverviewText(axisGOverview);

    // Define brushing behavior
    makeBrushing(coded_call_type);
}

// Overview extras
/**
 * Draw the x axis for hours on one visualization's overview
 * @param group the d3 selection where the axis should be drawn
 */
function drawXAxisOverview(group) {
    let axisGroup = group.append('g')
        .attr('class', 'xAxisOverview')
        .attr('transform', translate(0, c.sub.margins.top + c.overviewPlot.height));

    axisGroup.call(axes.years);
}
/**
 * Draw one Y axis for the overview on one visualization
 * @param group the d3 selection where the axis should be drawn
 * @param data the data to use
 * @param axis the axis to use
 * @param i the weekday index
 * @param differential how much to shift the y havue by
 */
function drawYAxisOverview(group, data, axis, i, differential) {
    let axisGroup = group.append('g')
        .attr('class', 'yAxis')
        .attr('id', i)
        .attr('transform', translate(0, c.sub.margins.top));

    axisGroup.call(axis);

}
/**
 * Draw some pesky text
 * @param group the group to draw it in
 */
function drawOverviewText(group) {

    // Overview title
    group.append('text')
        .text('Changes by Year')
        .attr('class','visTitleMidi')
        .attr('x', 40)
        .attr('y', -10);


    // 'Incident Count'
    let y_group = group.append('g')
        .attr('transform', translate(-40, c.overviewPlot.height + 5))
    y_group.append('text')
        .text('Incident Count :')
        .attr('class','axisTitle')
        .attr('transform', 'rotate(270)')
        .attr('x', 0)
        .attr('y', 0);

    // 'Hour of day'
    group.append('text')
        .text('Year :')
        .attr('class','axisTitle')
        .attr('x', -35)
        .attr('y', c.overviewPlot.height + 20);
}

// Interactivity
/**
 * Enable brushing  interactivity
 * @param call_type the call type to use
 */
function makeBrushing(call_type) {
    let this_svg = d3.select(`svg.visualization#${call_type}`);
    let this_overview = this_svg.select('g#overview');

    let overviewBars = this_overview.selectAll('rect.visBar');

    // Define the brush
    const brush = d3.brushX()
        .extent([[0,0], [c.overviewPlot.width, c.overviewPlot.height]])
        .on("brush", brushed)
        .on("end", brushended);

    const defaultSelection = [scales.year.range()[0], scales.year.range()[1]];

    // Make the brush
    const gb = this_overview.append("g")
        .attr('class', 'brushThing')
        .call(brush)
        .call(brush.move, defaultSelection);

    // Some functions
    function brushed() {
        if (d3.event.selection) {
            const [x0, x1] = d3.event.selection;

            overviewBars.classed('dim', function(d) {
                let this_bar = d3.select(this);
                let cx = (+(this_bar.attr('x')) + ((+this_bar.attr('width')) / 2));
                return !(cx < x1 && cx > x0);
            });
        }
    }

    function brushended() {
        if (!d3.event.selection) {
            gb.call(brush.move, defaultSelection);
        }

        const [x0, x1] = d3.event.selection;

        // Calculate which years to include
        let allowed_years = [];
        overviewBars.each(function(d) {
            let this_bar = d3.select(this);
            let cx = (+(this_bar.attr('x')) + ((+this_bar.attr('width')) / 2));

            if (cx < x1 && cx > x0) {
                allowed_years.push(this_bar.attr('id'));
            }
        });

        refreshVis(call_type, allowed_years);
    }
}
/**
 * Redraw a visualization with new data
 * @param call_type the call type to redraw
 * @param allowed_years the set of data to include
 */
function refreshVis(call_type, allowed_years) {
    let decoded_call_type = c.vis.call_type_names[call_type];

    // Filter data
    let temp_megaData = {};
    temp_megaData[decoded_call_type] = {};
    for (let day in megaData[decoded_call_type]) {

        for (let hour in megaData[decoded_call_type][day]) {

            for (let row of megaData[decoded_call_type][day][hour]) {

                // putIfAbsent...
                // Make sure the organized data has an object for each kind of incident
                if (! (day in temp_megaData[decoded_call_type])) {
                    temp_megaData[decoded_call_type][day] = {};
                }
                // Make sure the call type object has an object for that weekday
                if (! (hour in temp_megaData[decoded_call_type][day])) {
                    temp_megaData[decoded_call_type][day][hour] = [];
                }

                if (allowed_years.includes(row['Year of Entry Date and Time'])) {
                    temp_megaData[decoded_call_type][day][hour].push(row);
                }
            }
        }
    }


    let aggregated_refresh = aggregateData(temp_megaData);
    console.log('aggregated minmax in refresh', aggregated_refresh.minmax[decoded_call_type]);
    // Data is changed now!

    scales.incidents[call_type].domain([0, aggregated_refresh.minmax[decoded_call_type].max_incident_count*1.2]);

    // Recalculate all TODO change this, it's inefficient
    aggregated_refresh = aggregateData(temp_megaData);

    // Refresh views
    let this_svg = d3.select(`svg.visualization#${call_type}`);
    let this_plot = this_svg.select('g#plot');
    let axisG = this_svg.select('g#axes');
    axisG.selectAll('.yAxis').remove();


    // Do work for each weekday
    let i=0;
    let differential = 0;
    for (let weekday in megaData[decoded_call_type]) {
        let weekday_data = megaData[decoded_call_type][weekday];

        let sub = this_plot.select(`[id="${i}"]`);


        // Draw y axis
        drawYAxis(axisG, weekday_data, axes.incidents[call_type], i, differential);

        differential += c.sub.height + c.sub.margins.top + c.sub.margins.bottom;
        i += 1;

        // Append rectangles!
        let aggregated_new = aggregated_refresh.data[decoded_call_type][weekday];
        let selection = sub.selectAll('rect.visBar')
            .data(aggregated_new);
        selection.transition()
            .attr('height', d => d.zero_value - d.y_scaled)
            .attr('fill', d => d.color)
            .attr('y', d => d.y_scaled);

        // Clean up data elements for tooltip's use later
        for (let thing of aggregated_new) {
            delete thing.y_scaled;
            delete thing.zero_value;
            delete thing.color;
        }
    }
}

// Data organizers, converters
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
 * Process the data for an overview into the data for its bars
 * @param data all data to use
 * @param incident the incident type
 */
function process_data_overview(data, incident) {
    let coded_incident = c.vis.call_type_ids[incident];
    let year_org = {};
    let year_data = [];

    for (let weekday in data) {

        for (let hour in data[weekday]) {

            for (let thing of data[weekday][hour]) {
                let year = thing['Year of Entry Date and Time'];

                // Make sure the organized data has an object for this year
                if (! (year in year_org))
                    year_org[year] = [];

                year_org[year].push(thing);
            }
        }
    }

    for (let year in year_org) {
        let incident_count = 0;
        let total_time = 0.0;
        for (let thing of year_org[year]) {
            let incidents = parseInt(thing['Number of Records']);
            incident_count += incidents;
            total_time += parseFloat(thing['Avg. Processing Minutes']) * incidents;
        }
        let avg_prep_time = total_time / incident_count;

        let y_scaled = scales.incidentsOverview[coded_incident](incident_count);
        let zero_value = scales.incidentsOverview[coded_incident](0);
        let color = scales.color[coded_incident](avg_prep_time);
        year_data.push({
            'Incident Count': incident_count,
            'Avg. Prep. Time': `${avg_prep_time.toFixed(2)} mins`,
            'Year': year,
            'Incident Type': incident,
            y_scaled: y_scaled,     // TODO fix
            zero_value: zero_value, // TODO fix
            color: color
        });
    }

    // Finish scales
    scales.year.domain(Object.keys(year_org));

    return year_data;
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
                let zero_value = scales.incidents[call_type_name](scales.incidents[call_type_name].domain()[0]);
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

// Run the show!
prepVis();

// Sophie's helper methods
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


/**
 * Calculate the min and max overview values
 * @param processed_data the data to calculate from
 */
function calculateMinMax(processed_data) {
    let minInc = 1000000000;
    let maxInc = 0;
    let minTime = 10000000000.0;
    let maxTime = 0.0;
    for (let thingy of processed_data) {
        // Update the min/max records
        if (thingy['Incident Count'] < minInc) {
            minInc = thingy['Incident Count'];
        } else if (thingy['Incident Count'] > maxInc) {
            maxInc = thingy['Incident Count'];
        }

        if (thingy['Avg. Prep. Time'] < minTime) {
            minTime = thingy['Avg. Prep. Time'];
        } else if (thingy['Avg. Prep. Time'] > maxTime) {
            maxTime = thingy['Avg. Prep. Time'];
        }
    }

    console.log('max and min are', minTime, maxTime, minInc, maxInc);
}
