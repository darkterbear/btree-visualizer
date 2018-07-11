// get window dimensions
var wW = window.innerWidth;
var wH = window.innerHeight;
var acceptingUserInput = true;
var maxKeys = 0;

// length, in user units, of the key display dimensions
var keySize = 48;

window.onload = () => {
  /**
   * Just Make sure to return false so that your request will not go the server script
   */
  document.querySelector("#modifyForm").addEventListener("submit",
    function (e) {

      //some code
      document.getElementById('insert').value = ''
      e.preventDefault();
    })
}

// root svg canvas
var svg = d3.select('body').append('svg:svg')
  .attr('width', wW)
  .attr('height', wH);

var accumulator = (a, b) => parseInt(a) + parseInt(b);

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

var getChildIndex = (node) => {
  var parent = node.parent;

  for (var i = 0; i < parent.children.length; i++) {
    if (parent.children[i].code == node.code) return i;
  }
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
      var isNodeRendered = shouldBeRendered(node);

      // calculate node position
      var xCenter = wW / (numRendered + 1) * (renderIndex + 1);
      var nodeWidth = node.values.length * keySize;
      var x = xCenter - nodeWidth / 2;

      if (isNodeRendered) renderIndex++;

      var attachDOM = svg;
      if (node.parent != null) {
        attachDOM = node.parent.group.append('svg:g')
          .attr('id', node.code);
      }

      if (!isNodeRendered) attachDOM.style('opacity', 0);

      // draw the line to the parent
      if (node.parent) {
        var x1 = xCenter;
        var y1 = y;

        var x2 = d3.select('[id="' + node.parent.code + '--circle:' + getChildIndex(node) + '"]').attr('cx');
        var y2 = keySize + parseInt(d3.select('[id="' + node.parent.code + '--rect:' + 0 + '"]').attr('y'));

        var pathString = 'M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 - keySize * 1.5) + ', ' + x2 + ' ' + (y2 + keySize * 1.5) + ', ' + x2 + ' ' + y2;
        var path = attachDOM.append('svg:path')
          .attr('id', node.code + '--path')
          .attr('fill', 'transparent')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 2)
          .attr('d', pathString);

        /*
        attachDOM.append('svg:line')
          .attr('id', node.code + '--line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .style('stroke', 'steelblue')
          .style('stroke-width', 2);*/
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
          .attr('font-family', 'Sofia Pro')
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
            if (!acceptingUserInput) return;
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
      if (getNodeCode(node) == 90) console.log('90 trying to be redrawn ' + Date.now())
      if (!shouldBeRendered(node)) return;
      if (getNodeCode(node) == 90) console.log('90 should be redrawn' + Date.now());

      var xCenter = wW / (numRendered + 1) * (renderIndex + 1);
      var nodeWidth = node.values.length * keySize;
      var x = xCenter - nodeWidth / 2;

      renderIndex++;

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

        child.circleX = x + (keySize * childIndex);
      });

      // draw the line to the parent
      if (node.parent) {
        var x1 = xCenter;
        var y1 = y;

        var x2 = node.circleX; // d3.select('[id="' + node.parent.code + '--circle:' + getChildIndex(node) + '"]').attr('cx');
        var y2 = keySize + parseInt(d3.select('[id="' + node.parent.code + '--rect:' + 0 + '"]').attr('y'));

        var pathString = 'M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 - keySize * 1.5) + ', ' + x2 + ' ' + (y2 + keySize * 1.5) + ', ' + x2 + ' ' + y2;
        d3.select('[id="' + node.code + '--path"]')
          .transition()
          .attr('d', pathString)
          .duration(300);

        /*
        d3.select('[id="' + node.code + '--line"]')
          .transition()
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .duration(300);*/
      }
    });
  });
}

var matrix = [];

/**
 * Reads the json data from file input
 */
d3.json('data-btree-3.json', (data) => {
  maxKeys = data.maxKeys;
  // inject parent data
  injectParent(data.root);

  // convert json data to matrix
  matrix = convertToMatrix(data.root);

  // draw the matrix
  draw(matrix);
});

var collapseAll = (node) => {
  node.children.forEach((child, index) => {
    child.expanded = false;
    var nodeCode = getNodeCode(child);
    d3.select('[id="' + nodeCode + '"]')
      .transition()
      .style('opacity', 0)
      .duration(300);



    d3.select('[id="' + nodeCode + '--circle:' + index + ']')
      .transition()
      .style('fill', 'white')
      .duration(300);

    collapseAll(child);
  });
}

sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var insertValue = async (value) => {
  // dont allow insert when another insert is happening
  if (!acceptingUserInput) return;

  // disable user input while insert is in progress
  acceptingUserInput = false;

  // collapse the entire tree
  var root = matrix[0][0];
  collapseAll(root);
  var rootNodeCode = getNodeCode(root);
  root.children.forEach((child, index) => {
    d3.select('[id="' + rootNodeCode + '--circle:' + index)
      .transition()
      .style('fill', 'white')
      .duration(300);
  });

  // show the new key being created

  var x = parseInt(d3.select('[id="' + rootNodeCode + '--rect:0').attr('x')) + (1 + root.values.length) * keySize;
  var y = 128;

  var insertKey = svg.append('svg:g')
    .attr('id', 'insert')
    .style('opacity', 0);

  var rect = insertKey.append('svg:rect')
    .attr('id', 'insert--rect')
    .attr('height', keySize)
    .attr('width', keySize)
    .attr('x', x)
    .attr('y', y)
    .attr('fill', 'white')
    .attr('stroke', 'steelblue')
    //.attr('stroke', 'limegreen')
    .attr('stroke-width', 4);

  var text = insertKey.append('svg:text')
    .attr('id', 'inserting--text')
    .attr('x', keySize * 0.5 + x)
    .attr('y', y + keySize / 1.5)
    .attr('font-family', 'Sofia Pro')
    .attr('font-size', 24)
    .attr('fill', 'black')
    .attr('stroke', 'black')
    .style('text-anchor', 'middle')
    .text(() => {
      return value
    });

  insertKey.transition()
    .style('opacity', 1)
    .duration(300);

  await sleep(500);

  // animate the new key down to the correct leaf
  var thisNode = root;
  while (thisNode.children.length > 0) { // while not at leaf, continue traversing + animating down
    var i; // i represents which child to insert into
    for (i = 0; i < thisNode.values.length; i++) { // find the correct child by comparing against values
      var checkValue = thisNode.values[i];
      if (value < checkValue) break;
    }

    var child = thisNode.children[i];
    
    // expand this child
    child.expanded = true;
    var nodeCode = getNodeCode(child);
    d3.select('[id="' + nodeCode + '"]')
      .transition()
      .style('opacity', 1)
      .duration(300);

    // move the newkey down to the same level as the newly expanded child
    y += 128;
    text.transition()
      .attr('y', y + keySize / 1.5)
      .duration(300);

    rect.transition()
      .attr('y', y)
      .duration(300);

    // redraw the matrix
    redraw(matrix, 0);

    // set thisNode to child
    thisNode = child;

    await sleep(500);
  }

  // thisNode is now the correct leaf node
  // insert the new value into this leaf node
  var thisNodeCode = getNodeCode(thisNode);
  var thisNodeGroup = d3.select('[id="' + thisNodeCode + '"]');

  // find the index of insertion
  var index = 0;
  var oldMaxIndex = thisNode.values.length - 1;
  for (; index < thisNode.values.length; index++) {
    var checkValue = thisNode.values[index];
    if (value < checkValue) break;
  }

  // insert the new value into the leaf node
  thisNode.values.splice(index, 0, value);

  // calculate the new nodecode
  var newNodeCode = getNodeCode(thisNode);

  // update the nodecode of the node's group element
  d3.select('[id="' + thisNodeCode + '"]')
    .attr('id', newNodeCode);

  // update the id's of the rects and texts of the node w/ the new nodecode
  // update keys from 0 to point of insertion
  for (var i = 0; i < index; i++) { 
    d3.select('[id="' + thisNodeCode + '--rect:' + i + '"]')
      .attr('id', newNodeCode + '--rect:' + i);

    d3.select('[id="' + thisNodeCode + '--text:' + i + '"]')
      .attr('id', newNodeCode + '--text:' + i);
  }

  // shift the keyIndex's of these rect's and text's up by one to make space for new key
  // also update the id nodecodes in the process
  for (var keyIndex = oldMaxIndex; keyIndex >= index; keyIndex--) {
    d3.select('[id="' + thisNodeCode + '--rect:' + keyIndex + '"]')
      .attr('id', newNodeCode + '--rect:' + (keyIndex + 1));

    d3.select('[id="' + thisNodeCode + '--text:' + keyIndex + '"]')
      .attr('id', newNodeCode + '--text:' + (keyIndex + 1));
  }

  // update nodecode and id of path
  thisNode.code = newNodeCode;
  d3.select('[id="' + thisNodeCode + '--path"]')
    .attr('id', newNodeCode + '--path');

  // update nodecode and id of parent group, path, keys, and circles
  var newParentCode = getNodeCode(thisNode.parent);
  d3.select('[id="' + thisNode.parent.code + '--path"]')
    .attr('id', newParentCode + '--path');

  thisNode.parent.values.forEach((value, index) => {
    d3.select('[id="' + thisNode.parent.code + '--rect:' + index + '"]')
      .attr('id', newParentCode + '--rect:' + index);

    d3.select('[id="' + thisNode.parent.code + '--text:' + index + '"]')
      .attr('id', newParentCode + '--text:' + index);

    d3.select('[id="' + thisNode.parent.code + '--circle:' + index + '"]')
      .attr('id', newParentCode + '--circle:' + index);
  });

  d3.select('[id="' + thisNode.parent.code + '--circle:' + thisNode.parent.values.length + '"]')
    .attr('id', newParentCode + '--circle:' + thisNode.parent.values.length);

  thisNode.parent.code = newParentCode
  thisNode.parent.group.attr('id', thisNode.parent.code);

  // insert the new rect element
  thisNodeGroup.append('svg:rect')
    .attr('height', keySize)
    .attr('width', keySize)
    .attr('x', parseInt(rect.attr('x')))
    .attr('y', parseInt(rect.attr('y')))
    .attr('fill', 'white')
    .attr('stroke', 'steelblue')
    //.attr('stroke', 'limegreen')
    .attr('stroke-width', 4)
    .attr('id', newNodeCode + '--rect:' + index);

  // insert the new text element
  thisNodeGroup.append('svg:text')
    .attr('id', newNodeCode + '--text:' + index)
    .attr('x', parseInt(text.attr('x')))
    .attr('y', parseInt(text.attr('y')))
    .attr('font-family', 'Sofia Pro')
    .attr('font-size', 24)
    .attr('fill', 'black')
    .attr('stroke', 'black')
    .style('text-anchor', 'middle')
    .text(() => {
      return value
    });

  // remove the temporary insert elements
  insertKey.remove();
  rect.remove();
  text.remove();

  // redraw to animate the insertion
  redraw(matrix, 0);

  // TODO: if this new node is overfilled...split + promote and recurse
  while (thisNode.values.length > maxKeys) {
    // find promote value
    var promoteIndex = Math.floor(maxKeys / 2);

    // split the rest of the keys into 2 nodes
    // dont forget to recalculate node codes!
    // when changing a node's code, keep track of: its group, rect, text, circles, path, and those of its parent
    
    var leftKeys = thisNode.values.slice(0, promoteIndex);
    var rightKeys = thisNode.values.slice(promoteIndex + 1, thisNode.values.length);

    var leftChildren = thisNode.children.slice(0, promoteIndex + 1);
    var rightChildren = thisNode.children.slice(promoteIndex + 1, thisNode.children.length);

    var parentGroup = thisNode.parent ? thisNode.parent.group : svg; // attach the split node groups to the parent group element; if this is root (parent is null), attach to svg

    var leftNode = {
      expanded: true,
      values: leftKeys,
      children: leftChildren,
      parent: thisNode.parent
    }
    leftNodeCode.code = getNodeCode(leftNode);

    var rightNode = {
      expanded: true,
      values: rightKeys,
      children: rightChildren,
      parent: thisNode.parent
    }
    rightNode.code = getNodeCode(rightNode);

    /** ********* create the left group ******** **/
    leftNode.group = parentGroup.append('svg:g');

    /** ********* create the right group ******** **/
    rightNode.group = parentGroup.append('svg:g');

    /** ********* move elements over to the left group ******** **/
    leftChildren.forEach((leftChild) => {
      leftChild.parent = leftNode;
      leftNode.group.append(leftChild.group.remove());
    });

    /** ********* move elements over to the right group ******** **/
    rightChildren.forEach((rightChild) => {
      rightChild.parent = rightNode;
      rightNode.group.append(righthild.group.remove());
    });

    /** ********* destroy the old group ******** **/
    thisNode.group.remove();
    
    /** ********* recalculate the  ******** **/

    // draw the new paths

    // set thisNode pointer to the parent
  }

  acceptingUserInput = true;
}