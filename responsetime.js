
//-- draw bars--//
function drawBars(csv) {

    //--set up variables--//
    var keys = csv.columns.slice(2);
    var year   = [...new Set(csv.map(d => d.Year))].sort();
    var neighborhoods = [...new Set(csv.map(d => d.Neighborhood))].sort();
    //--variables--//


    //--set Dropdown options--//
    var options = d3.select("#year").selectAll("option")
        .data(year)
        .enter().append("option")
        .text(d => d)
    //--Dropdown Options--//


    //--set up margins, height, and width---//
    var svg = d3.select("#chart"),
        margin = {top: 55, left: 50, bottom: 57, right: 0},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
    //-- margins & h + w --//


    //--x and y axis --//
    var x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.2)

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "x-axis")

    var y = d3.scaleLinear()
        .rangeRound([height - margin.bottom, margin.top])
    //--x and y axis--//


    //--colors--//
    var z = d3.scaleOrdinal()
        .range(["#FADA5E", "orange", "orangered", "#BF0000"])
        .domain(keys);
    //--colors--//

    //--legend--//
    var nodeWidth = (d) => d.getBBox().width;

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(7, 0)")

    const lg = legend.selectAll('g')
      .data(keys)
      .enter()
    .append('g')
      .attr('transform', (d,i) => `translate(${i * 100},${height - 470})`);

    lg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr("fill", function(d,i) { return z(i)});

    lg.append('text')
      .style('font-family', 'Georgia')
      .style('font-size', '13px')
      .attr('x', 17.5)
      .attr('y', 10)
      .text(d => d);

    let offset = 0;
    
    lg.attr('transform', function(d, i) {
        let x = offset;
        offset += nodeWidth(this) + 10;
        return `translate(${x},${height - 565})`;
    });
    //--legend--//
   

    update(d3.select("#year").property("value"), 0)


    function update(input, speed) {

        var data = csv.filter(f => f.Year == input)

        x.domain(neighborhoods);

        svg.selectAll(".x-axis").transition().duration(0)
            .call(d3.axisBottom(x).tickSizeOuter(0))

        svg.selectAll(".x-axis text")
            .style("text-anchor", "end")
            .style('font-family', 'Georgia')
            .attr("dx", "-.8em")
            .attr("dy", "-.7em")
            .attr("transform", function(d) {
                return "rotate(-90)"
            });

        //--update x and y axis domain--//
        var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")

        y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();

        svg.selectAll(".y-axis").transition().duration(1)
            .call(d3.axisLeft(y).ticks(null, "s"))
        //--x and y axis--//


        //--making layers--//
        var group = svg.selectAll("g.layer")
            .data(d3.stack().keys(keys)(data), d => d.key)

        group.enter().append("g")
            .classed("layer", true)
            .attr("fill", d => z(d.key));
        //--groups--//


        //--draw bars--//
        var bars = svg.selectAll("g.layer").selectAll("rect")
            .data(d => d, e => e.data.Neighborhood);

        bars.enter().append("rect")
            .attr("width", x.bandwidth())
            .merge(bars)
        .transition().duration(0)
            .attr("x", d => x(d.data.Neighborhood))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
    

    var rect = group.selectAll("rect")
      .on("mouseover", function() { tooltip.style("display", null); })
      .on("mouseout", function() { tooltip.style("display", "none"); })
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 15;
        var yPosition = d3.mouse(this)[1] - 25;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text("Avg in Minutes: "+ f(d[1] - d[0]));
        //console.log(d);
      });
        //--bars!-//

    }

    var f = d3.format(".1f");
       
    // Prep the tooltip bits, initial display is hidden
    var tooltip = svg.append("g")
      .attr("class", "tooltip")
      .style("display", "none");
        
    tooltip.append("rect")
      .attr("width", 150)
      .attr("height", 30)
      .attr("fill", "grey")
      .style("opacity", 0.5);

    tooltip.append("text")
      .attr("x", 15)
      .attr("dy", "1.2em")
      .style("text-anchor", "left")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");
    
    var select = d3.select("#year")
      .on("change", function() {
        update(this.value, 750)
    })
}

//--load, filter, and input data--//
d3.csv("data/Response_Data.csv").then(function(csv){
    drawBars(csv)
});
//-- data --//
