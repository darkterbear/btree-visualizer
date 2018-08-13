const t = 1

var object = {}
var x = 1
var inject = (node, level) => {
	if (level >= 3) return
	if (level == 0) node.expanded = true
	else node.expanded = false
	node.values = []
	node.children = []
	for (var i = 0; i < t * 2; i++) {
		var child = {}
		inject(child, level + 1)

		if (child.values != null) node.children.push(child)

		node.values.push(x)
		x++
	}

	node.values.splice(node.values.length - 1, 1)
	x--
}

inject(object, 0)

const final = {
	t: t,
	root: object
}

console.log(JSON.stringify(final))
