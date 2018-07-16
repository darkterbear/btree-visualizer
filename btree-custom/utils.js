const accumulator = (a, b) => parseInt(a) + parseInt(b);

// TODO: need a way to derive a way to get a unique code for every node based on data in itself and its children
const getNodeCode = (node) => {
  var nodeCode = '-' + node.values.reduce(accumulator);
  node.children.forEach((child) => {
    nodeCode += '-' + child.values.reduce(accumulator);
  });

  return nodeCode.substring(1);
}

const injectParent = (node) => {
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
const convertToMatrix = (data) => {
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

const getNodesIn = (row) => {
  return row.filter(n => n.expanded).length;
}

const shouldBeRendered = (node) => {
  if (!node.expanded) return false;
  if (node.parent == null) return true;
  return shouldBeRendered(node.parent);
}

const getChildIndex = (node) => {
  var parent = node.parent;

  for (var i = 0; i < parent.children.length; i++) {
    if (parent.children[i].code == node.code) return i;
  }
}

const collapseAll = (node) => {
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

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
