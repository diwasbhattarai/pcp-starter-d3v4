function buildParallelCoordinates(data, popt, toggleArray){
	var margin = {top: 50, right: 50, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
	
	var x = d3.scalePoint().range([0, width]),
		y = {},
		dragging = {};

	var line = d3.line(),
	    axis = d3.axisLeft(),
	    background,
			foreground;
			
			var svg = d3.select("body").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");		

	// Extract the list of dimensions and create a scale for each.
	x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
		return d != "name" && (y[d] = d3.scaleLinear()
			.domain(d3.extent(cars, function(p) { return +p[d]; }))
			.range([height, 0]));
	  }));
	
	  // Add grey background lines for context.
	  background = svg.append("g")
		  .attr("class", "background")
		.selectAll("path")
		  .data(cars)
		.enter().append("path")
		  .attr("d", path);
	
	  // Add blue foreground lines for focus.
	  foreground = svg.append("g")
		  .attr("class", "foreground")
		.selectAll("path")
		  .data(cars)
		.enter().append("path")
		  .attr("d", path);
	
	  // Add a group element for each dimension.
	  var g = svg.selectAll(".dimension")
		  .data(dimensions)
		.enter().append("g")
		  .attr("class", "dimension")
		  .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
		  .call(d3.drag()
			.subject(function(d) { return {x: x(d)}; })
			.on("start", function(d) {
			  dragging[d] = x(d);
			  background.attr("visibility", "hidden");
			})
			.on("drag", function(d) {
			  dragging[d] = Math.min(width, Math.max(0, d3.event.x));
			  foreground.attr("d", path);
			  dimensions.sort(function(a, b) { return position(a) - position(b); });
			  x.domain(dimensions);
			  g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
			})
			.on("end", function(d) {
			  delete dragging[d];
			  transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
			  transition(foreground).attr("d", path);
			  background
				  .attr("d", path)
				.transition()
				  .delay(500)
				  .duration(0)
				  .attr("visibility", null);
			}));
	
	  // Add an axis and title.
	  g.append("g")
		  .attr("class", "axis")
		  .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
		.append("text")
			.style("text-anchor", "middle")
			.attr("y", -5)
			.attr("stroke", "#000")
		  .text(function(d) { return d; });
	
			g.append("g")
			.attr("class", "brush")
			.filter(function(d){
					return d != "composition";
			})
			.each(function (d) {
					d3.select(this).call(d.brush = d3.brushY()
							.extent([[-10, 0], [10, height]])
							.on("start", brushstart)
							.on("brush", brush)
							.on("end", brush));
			})
			.selectAll("rect")
			.attr("x", -8) /* cross hair render start -8 in the x-direction */
			.attr("width", 16);/* renders to the cross-hair area */



	function position(d) {
	  var v = dragging[d];
	  return v == null ? x(d) : v;
	}
	
	function transition(g) {
	  return g.transition().duration(500);
	}
	
	// Returns the path for a given data point.
	function path(d) {
	  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
	}
	
	function brushstart() {
	  d3.event.sourceEvent.stopPropagation();
	}
	
	

	function brush(){
		var actives = [];

		svg.selectAll(".dimension .brush")
				.filter(function(d){
						return d3.brushSelection(this);
				})
				.each(function(d){
						actives.push({
								dimension: d,
								extent: d3.brushSelection(this)
						});
				});

		foreground.style("display", function(d){

				return actives.every(function (active) {
						var dim = active.dimension;
						var ex  = active.extent;

						// NOTE: extent stays in opposite direction
						return d[dim] <= y[dim].invert(ex[0]) && d[dim] >= y[dim].invert(ex[1]);
				}) ? null : "none";
		});
}


}