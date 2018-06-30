// get window dimensions
var wW = window.innerWidth;
var wH = window.innerHeight;

// set display size of a single key
const keyDimension = 48; 

var drawNode = function(node, depth, siblingIndex, numSiblings, container) {
  var numKeys = node.values.length;

  // calculate the position of this node RELATIVE TO THE CONTAINER
  // (xPos, yPos) represents the upper left corner of the node
  var yPos = 128;
  var xPosCenter = parseInt(container.style('width')) / 2;
  var nodeWidth = keyDimension * numKeys;
  var xPos = xPosCenter - nodeWidth / 2;

  // iterate through each key
  node.values.forEach(function (value, index, values) {

    // each key gets its own square...
    var rect = container.append('svg:rect')
        .attr('height', keyDimension)
        .attr('width', keyDimension)
        .attr('x', keyDimension * index + xPos)
        .attr('y', yPos)
        .attr('fill', 'white')
        .attr('stroke','steelblue')
        .attr('stroke-width', 4);

    // and its own text!
    var text = container.append('svg:text')
        .attr('x', keyDimension * index + 24 + xPos)
        .attr('y', 32 + yPos)
        .attr('font-family', 'Lato')
        .attr('font-size', 24)
        .attr('fill', 'black')
        .attr('stroke', 'black')
        .style('text-anchor', 'middle')
        .text(function() {return value});
  });

  // iterate through each child
  node.children.forEach(function(child, index) {

    // create the subgroup for this child
    var subgroup = container.append('svg:svg')
      .attr('x', index * parseInt(container.style('width')) / node.children.length)
      .attr('y', 128)
      .attr('width', parseInt(container.style('width')) / node.children.length)
      .attr('height', parseInt(container.style('height')) - 128)
      .attr('opacity', 1);

    console.log(subgroup.style('width'));

    // draw the child indicator and define click behavior
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
          // TODO: transition+translate the other children to "make room" for this entering child
        } else {
          subgroup.transition()
            .duration(500)
            .attr('opacity', 0);

          childCircle.transition()
            .duration(500)
            .attr('fill', 'white');

          // TODO: transition+translate the other children to "spread out" since this child is "gone"
          child.expanded = false;
        }
        updateChildrenPosition(node);
      });

    
    // recursively draw the child
    drawNode(child, depth + 1, index, node.children.length, subgroup);

    // parameters for the parent-child path
    var startString = xPos + (48 * index) + ' ' + (yPos + keyDimension);
    var sControlString = xPos + (48 * index) + ' ' + (yPos + 96);

    var childCenterX = parseInt(container.style('width')) / (node.children.length + 1) * (index + 1);
    var endString = childCenterX + ' ' + (yPos + 128);
    var eControlString = childCenterX + ' ' + (yPos + 128 - keyDimension);
    var pathString = 'M' + startString + ' C ' + sControlString + ', ' + eControlString + ', ' + endString;

    // draw the parent-child path
    subgroup.append('svg:path')
      .attr('d', pathString)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('fill', 'transparent');

    if (!child.expanded) subgroup.attr('opacity', 0);
  });

}

var updateChildrenPosition = function(node) {
  var numberOfShown = node.children.filter(c => c.expanded).length;

  var indexCounter = 0;
  node.children.forEach(function (child, index) {
    if (child.expanded) {
      var xPos = (wW / (numberOfShown + 1)) * (indexCounter + 1);
      
      // TODO: must use d3 transition to move the literal RECTs, TEXTs, and PATHs, and possible CHILDREN
      
      indexCounter++;
    }
  });
};

//Make an SVG Container
var svgContainer = d3.select("body").append("svg:svg")
  .attr("width", wW)
  .attr("height", wH);

d3.json('data-btree.json', function(data) {
  drawNode(data.root, 0, 0, 1, svgContainer);
});
