var wW = window.innerWidth;
var wH = window.innerHeight;

// sample json data
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
      values: [9, 12],
      children: []
    }, {
      values: [18, 21],
      children: []
    }]
  }
}

//Make an SVG Container
var svgContainer = d3.select("body").append("svg:svg")
  .attr("width", wW)
  .attr("height", wH);

var drawNode = function(node, depth, siblingIndex, numSiblings) {
  // every key has a 32 by 32 square
  var numKeys = node.values.length;

  var yPos = 128 * (depth + 1);
  var xPosCenter = (wW / (numSiblings + 1)) * (siblingIndex + 1);
  var nodeWidth = 32 * numKeys;
  var xPos = xPosCenter - nodeWidth / 2;

  var group = svgContainer.append('svg:g')
    .attr('height', 32)
    .attr('width', 32 * nodeWidth)
    .attr('transform', 'translate(' + xPos + ', ' + yPos + ')');

  node.values.forEach(function (value, index, values) {
    group.append('svg:rect')
      .attr('height', 32)
      .attr('width', 32)
      .attr('x', 32 * index)
      .attr('fill', 'steelblue');

    group.append('svg:text')
      .attr('x', 32 * index)
      .attr('font-family', 'Verdana')
      .attr('font-size', 24)
      .attr('fill', 'blue');
  });
}

drawNode(sampleBtree.root, 0, 0, 1);