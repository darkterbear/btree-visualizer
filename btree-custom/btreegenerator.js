var object = {};
var x = 1;
var inject = (node, level) => {
  if (level >= 4) return;
  if (level == 0) node.expanded = true;
  else node.expanded = false;
  node.values = [];
  node.children = [];
  for (var i = 0; i < 4; i++) {
    var child = {};
    inject(child, level + 1);
    
    if (child.values != null) node.children.push(child);

    node.values.push(x);
    x++;
  }
  
  node.values.splice(node.values.length - 1, 1);
  x--;
}

inject(object, 0);
console.log(JSON.stringify(object));
