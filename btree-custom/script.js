var wW = window.innerWidth;
var wH = window.innerHeight;

// sample json data
/*
var sampleBtree = {
  root: {
    values: [
      7,
      16
    ],
    children: [{
      values: [
        1, 2, 5, 6
      ],
      children: []
    }, {
      values: [9, 12, 16],
      children: []
    }, {
      values: [18, 21, 100],
      children: []
    }]
  }
}
*/


//Make an SVG Container
var svgContainer = d3.select("body").append("svg:svg")
  .attr("width", wW)
  .attr("height", wH);

var group = svgContainer.append('svg:g');

var drawNode = function(node, depth, siblingIndex, numSiblings, container) {
  // every key has a 32 by 32 square
  var numKeys = node.values.length;

  var yPos = 128 * (depth + 1);
  var xPosCenter = (wW / (numSiblings + 1)) * (siblingIndex + 1);
  var nodeWidth = 48 * numKeys;
  var xPos = xPosCenter - nodeWidth / 2;

  // group.attr('transform', 'translate(' + xPos + ', ' + yPos + ')');

  node.values.forEach(function (value, index, values) {
    container.append('svg:rect')
        .attr('height', 48)
        .attr('width', 48)
        .attr('x', 48 * index + xPos)
        .attr('y', yPos)
        .attr('fill', 'white')
        .attr('stroke','steelblue')
        .attr('stroke-width', 4);

    container.append('svg:text')
        .attr('x', 48 * index + 24 + xPos)
        .attr('y', 32 + yPos)
        .attr('font-family', 'Lato')
        .attr('font-size', 24)
        .attr('fill', 'black')
        .attr('stroke', 'black')
        .style('text-anchor', 'middle')
        .text(function() {return value});
  });

  node.children.forEach(function(child, index) {

    var subgroup = container.append('svg:g')
      .attr('x', xPos + (48 * index))
      .attr('y', yPos + 48)
      .attr('opacity', 1);

    var childCircle = container.append('svg:circle')
      .attr('cx', xPos + (48 * index))
      .attr('cy', yPos + 48)
      .attr('r', 4)
      .attr('fill', child.expanded ? 'green' : 'white')
      .attr('stroke-width', 2)
      .attr('stroke','green')
      .on('click', function() {
        if (!child.expanded) {
          subgroup.transition()
            .duration(500)
            .attr('opacity', 1);

          childCircle.transition()
            .duration(500)
            .attr('fill', 'green');
          
          child.expanded = true;
        } else {
          subgroup.transition()
            .duration(500)
            .attr('opacity', 0);

          childCircle.transition()
            .duration(500)
            .attr('fill', 'white');

          child.expanded = false;
        }
      });

    

    drawNode(child, depth + 1, index, node.children.length, subgroup);
    // TODO: figure out paths: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    var startString = xPos + (48 * index) + ' ' + (yPos + 48);
    var sControlString = xPos + (48 * index) + ' ' + (yPos + 96);

    var childCenterX = wW / (node.children.length + 1) * (index + 1);
    var endString = childCenterX + ' ' + (yPos + 128);
    var eControlString = childCenterX + ' ' + (yPos + 128 - 48);
    var pathString = 'M' + startString + ' C ' + sControlString + ', ' + eControlString + ', ' + endString;

    subgroup.append('svg:path')
      .attr('d', pathString)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('fill', 'transparent');

    if (!child.expanded) subgroup.attr('opacity', 0);
  });

}

d3.json('data-btree.json', function(data) {
  drawNode(data.root, 0, 0, 1, group);
});
