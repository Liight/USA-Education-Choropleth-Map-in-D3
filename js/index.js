// Define body
var body = d3.select("body");

// Set Scalable Vector Graphic and 2D Dimensions
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Define the div for the tooltip
var tooltip = body.append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);


var unemployment = d3.map();

var path = d3.geoPath();

// Set domain and ranges for the scale
var x = d3.scaleLinear()
    .domain([2.6, 75.1])
    .rangeRound([600, 860]);


var color = d3.scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1-2.6)/8))
    .range(d3.schemeGreens[9]);

// Display Map Legend
var g = svg.append("g")
    .attr("class", "key")
    .attr("id", "legend")
    .attr("transform", "translate(0,40)");

// Returns the extent of values in the domain [x0, x1] for the corresponding value in the range, representing the inverse mapping from range to domain,
// then appends the rectangles to the svg using the color range to fill them.
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

// Set text attributes
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")

// Append ticks as int%
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(function(x) { return Math.round(x) + '%' })
    .tickValues(color.domain()))
    .select(".domain")
    .remove();

const EDUCATION_FILE = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_FILE = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

// Load if no error is thrown
d3.queue()
    .defer(d3.json, COUNTY_FILE)
    .defer(d3.json, EDUCATION_FILE)
    .await(ready);

// define ready for the queue check
function ready(error, us, education) {
  if (error) throw error;

  // TopoJSON is an extension of GeoJSON that encodes topology.
  // Give County Ids from the API
  // Get education data and pass into each county element
  // Display info tooltip on mouseover
  // Apply tooltip styles
  svg.append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter().append("path")
      .attr("class", "county")
      .attr("data-fips", function(d) {
        return d.id
       })
      .attr("data-education", function(d) {
        var result = education.filter(function( obj ) {
          return obj.fips == d.id;
        });
        if(result[0]){
          return result[0].bachelorsOrHigher
        }
        //could not find a matching fips id in the data
        console.log('could find data for: ', d.id);
        return 0
       })
      .attr("fill", function(d) { 
        var result = education.filter(function( obj ) {
          return obj.fips == d.id;
        });
        if(result[0]){
          return color(result[0].bachelorsOrHigher)
        }
        //could not find a matching fips id in the data
        return color(0)
       })
      .attr("d", path)
      .on("mouseover", function(d) {      
        tooltip.style("opacity", .9); 
        tooltip.html(function() {
          var result = education.filter(function( obj ) {
            return obj.fips == d.id;
          });
          if(result[0]){
            return result[0]['area_name'] + ', ' + result[0]['state'] + ': ' + result[0].bachelorsOrHigher + '%'
          }
          //could not find a matching fips id in the data
          return 0
        })
      .attr("data-education", function() {
        var result = education.filter(function( obj ) {
          return obj.fips == d.id;
        });
        if(result[0]){
          return result[0].bachelorsOrHigher
        }
        //could not find a matching fips id in the data
        return 0
       })
          .style("left", (d3.event.pageX + 10) + "px") 
          .style("top", (d3.event.pageY - 28) + "px"); }) 
          .on("mouseout", function(d) { 
            tooltip.style("opacity", 0); 
          });

  // Append states to the SVG element.
  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
}