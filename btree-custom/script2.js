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

var getNodeCode = (node) => {
  var nodeCode = '-' + node.values.reduce(accumulator);
  node.children.forEach((child) => {
    nodeCode += '-' + child.values.reduce(accumulator);
  });

  return nodeCode.substring(1);
}

var injectParent = (node) => {
  // also add a code for every node for group identification
  node.children.forEach((child) => {
    child.parent = node;
    injectParent(child);
  });
  node.code = getNodeCode(node);
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

  while (stack.length > 0) {
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

var getNodesIn = (row) => {
  return row.filter(n => n.expanded).length;
}

var shouldBeRendered = (node) => {
  if (!node.expanded) return false;
  if (node.parent == null) return true;
  return shouldBeRendered(node.parent);
}

/**
 * Draws the matrix onto the svg canvas
 * @param {*} matrix 
 */
var draw = (matrix) => {
  matrix.forEach((row, depth, matrix) => {
    var y = (depth + 1) * 128;

    var numRendered = row.filter(n => shouldBeRendered(n)).length;
    var renderIndex = 0;
    row.forEach((node, index, row) => {
      // check if node should be rendered
      if (!shouldBeRendered(node)) return;

      var xCenter = wW / (numRendered + 1) * (renderIndex + 1);
      var nodeWidth = node.values.length * keySize;
      var x = xCenter - nodeWidth / 2;

      renderIndex++;

      var attachDOM = svg;
      if (node.parent != null) {
        attachDOM = node.parent.group.append('svg:g')
          .attr('id', node.code);
      }

      // draw the node itself
      node.values.forEach((key, keyIndex, keys) => {
        attachDOM.append('svg:rect')
          .attr('id', node.code + '--rect:' + keyIndex)
          .attr('height', keySize)
          .attr('width', keySize)
          .attr('x', keySize * keyIndex + x)
          .attr('y', y)
          .attr('fill', 'white')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 4);

        attachDOM.append('svg:text')
        .attr('id', node.code + '--text:' + keyIndex)
        .attr('x', keySize * (keyIndex + 0.5) + x)
        .attr('y', y + keySize / 1.5)
        .attr('font-family', 'Lato')
        .attr('font-size', 24)
        .attr('fill', 'black')
        .attr('stroke', 'black')
        .style('text-anchor', 'middle')
        .text(() => {
          return key
        });
      });

      // draw the node's children
      node.children.forEach((child, childIndex, children) => {
        var circle = attachDOM.append('svg:circle')
          .attr('id', node.code + '--circle:' + childIndex)
          .attr('cx', x + (keySize * childIndex))
          .attr('cy', y + keySize)
          .attr('r', keySize / 8)
          .attr('fill', child.expanded ? 'steelblue' : 'white')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 4)
          .on('click', () => {
            if (child.expanded) {
              child.expanded = false;
              d3.select('[id="' + getNodeCode(child) + '"]')
              .transition()
                .style('opacity', 0)
                .duration(300);

              circle.transition()
                .style('fill', 'white')
                .duration(300);
            } else {
              child.expanded = true;
              d3.select('[id="' + getNodeCode(child) + '"]')
              .transition()
                .style('opacity', 1)
                .duration(300);

              circle.transition()
                .style('fill', 'steelblue')
                .duration(300);
            }
            
            redraw(matrix, depth);
          });
      });

      node.group = attachDOM;
    });
  });
}

var redraw = (matrix, depth) => {
  matrix.forEach((row, depth, matrix) => {
    var y = (depth + 1) * 128;

    var numRendered = row.filter(n => shouldBeRendered(n)).length;
    var renderIndex = 0;
    row.forEach((node, index, row) => {
      // check if node should be rendered
      if (!shouldBeRendered(node)) return;

      var xCenter = wW / (numRendered + 1) * (renderIndex + 1);
      var nodeWidth = node.values.length * keySize;
      var x = xCenter - nodeWidth / 2;

      renderIndex++;

      var attachDOM = svg;
      if (node.parent != null) {
        attachDOM = node.parent.group.append('svg:g')
          .attr('id', node.code);
      }

      // redraw the node
      var nodeCode = getNodeCode(node);
      node.values.forEach((key, keyIndex, keys) => {
        d3.select('[id="' + nodeCode + '--rect:' + keyIndex + '"]')
          .transition()
            .attr('x', keySize * keyIndex + x)
            .duration(300);

        d3.select('[id="' + nodeCode + '--text:' + keyIndex + '"]')
          .transition()
            .attr('x', keySize * (keyIndex + 0.5) + x)
            .duration(300);

      });

      
      // redraw the node's children circles
      node.children.forEach((child, childIndex, children) => {
        d3.select('[id="' + nodeCode + '--circle:' + childIndex + '"]')
          .transition()
            .attr('cx', x + (keySize * childIndex))
            .style('fill', child.expanded ? 'steelblue' : 'white')
            .duration(300);
      });

    });
  });
}

/**
 * Reads the json data from file input
 */
d3.json('data-btree.json', (data) => {
  // inject parent data
  injectParent(data.root);

  // convert json data to matrix
  var matrix = convertToMatrix(data.root);

  // draw the matrix
  draw(matrix);
});
