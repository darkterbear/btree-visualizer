// get window dimensions
var wW = window.innerWidth;
var wH = window.innerHeight;

// length, in user units, of the key display dimensions
var keySize = 48;

// root svg canvas
var svg = d3.select('body').append('svg:svg')
  .attr('width', wW)
  .attr('height', wH);

var accumulator = (a, b) => a + b;

var injectParent = (node) => {
  // also add a code for every node for group identification
  var nodeCode = '-' + node.values.reduce(accumulator);
  node.children.forEach((child) => {
    nodeCode += '-' + child.values.reduce(accumulator);
    child.parent = node;
    injectParent(child);
  });
  node.code = nodeCode.substring(1);
}

/**
 * Converts a tree structure to a matrix for easier handling
 * Uses BFS to traverse
 */
var convertToMatrix = (data) => {
  var stack = [];
  stack.push(data);
  stack.push(null);
  var depth = 0;

  matrix = [];
  matrix.push([]);

  while(stack.length > 0) {
    var current = stack.splice(0, 1)[0];
    if (current == null) {
      depth++;
      matrix.push([]);
      if (stack[0] == null) break;
      stack.push(null);
      continue;
    }

    matrix[depth].push(current);
    current.children.forEach((child) => {
      stack.push(child);
    });
  }

  return matrix;
}

/**
 * Draws the matrix onto the svg canvas
 * @param {*} matrix 
 */
var draw = (matrix) => {
  matrix.forEach((row, depth, matrix) => {
    var y = (depth + 1) * 128;
    row.forEach((node, index, row) => {
      var xCenter = wW / (row.length + 1) * (index + 1);
      var nodeWidth = node.values.length * keySize;
      var x = xCenter - nodeWidth / 2;

      // draw the node itself
      node.values.forEach((key, keyIndex, keys) => {
        svg.append('svg:rect')
          .attr('height', keySize)
          .attr('width', keySize)
          .attr('x', keySize * keyIndex + x)
          .attr('y', y)
          .attr('fill', 'white')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 4);

        svg.append('svg:text')
          .attr('x', keySize * (keyIndex + 0.5) + x)
          .attr('y', y + keySize / 1.5)
          .attr('font-family', 'Lato')
          .attr('font-size', 24)
          .attr('fill', 'black')
          .attr('stroke', 'black')
          .style('text-anchor', 'middle')
          .text(function () {
            return key
          });
      });

      // draw the node's children
      node.children.forEach((child, childIndex, children) => {
        svg.append('svg:circle')
          .attr('cx', x + (keySize * childIndex))
          .attr('cy', y + keySize)
          .attr('r', keySize / 8)
          .attr('fill', child.expanded ? 'steelblue' : 'white')
          .attr('stroke', 'green')
          .on('click', () =>{

          });
      });
    });
  });
}

/**
 * Reads the json data from file input
 */
d3.json('data-btree.json', function(data) {
  // inject parent data
  injectParent(data.root);

  // convert json data to matrix
  var matrix = convertToMatrix(data.root);

  // draw the matrix
  draw(matrix);
});
