const keyExists = (key, matrix) => {
	for (var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[i].length; j++) {
			for (var k = 0; k < matrix[i][j].values.length; k++) {
				if (matrix[i][j].values[k] == key) return true
			}
			// if (matrix[i][j].values.includes(key)) return true
		}
	}
	return false
}

const accumulator = (a, b) => parseInt(a) + parseInt(b)

const makeid = () => {
	var text = ''
	var possible = 'abcdef0123456789'

	for (var i = 0; i < 16; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length))

	return text
}

const injectParent = node => {
	// also add a code for every node for group identification
	node.children.forEach(child => {
		child.parent = node
		injectParent(child)
	})
	node.code = makeid()
}

/**
 * Converts a tree structure to a matrix for easier handling
 * Uses BFS to traverse
 */
const convertToMatrix = data => {
	var stack = []
	stack.push(data)
	stack.push(null)
	var depth = 0

	matrix = []
	matrix.push([])

	while (stack.length > 0) {
		var current = stack.splice(0, 1)[0]
		if (current == null) {
			depth++
			matrix.push([])
			if (stack[0] == null) break
			stack.push(null)
			continue
		}

		matrix[depth].push(current)
		current.children.forEach(child => {
			stack.push(child)
		})
	}

	return matrix
}

const getNodesIn = row => {
	return row.filter(n => n.expanded).length
}

const shouldBeRendered = node => {
	if (!node.expanded) return false
	if (node.parent == null) return true
	return shouldBeRendered(node.parent)
}

const getChildIndex = node => {
	var parent = node.parent

	for (var i = 0; i < parent.children.length; i++) {
		if (parent.children[i].code == node.code) return i
	}
}

const clone = selector => {
	var node = d3.select(selector).node()
	return d3.select(
		node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling)
	)
}

const collapseAll = node => {
	node.children.forEach((child, index) => {
		child.expanded = false
		var nodeCode = child.code
		d3.select('[id="' + nodeCode + '"]')
			.transition()
			.style('opacity', 0)
			.duration(speed)

		d3.select('[id="' + nodeCode + '--circle:' + index + ']')
			.transition()
			.style('fill', 'white')
			.duration(speed)

		collapseAll(child)
	})
}

const deleteFromMatrix = code => {
	for (var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[i].length; j++) {
			if (matrix[i][j].code === code) {
				matrix[i].splice(j, 1)
				return
			}
		}
	}
}

const sleep = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

const changeID = (nodeCode, type, index, newNodeCode, newIndex) => {
	if (index === null || index === undefined) {
		return d3
			.select('[id="' + nodeCode + '--' + type + '"]')
			.attr('id', (newNodeCode || nodeCode) + '--' + type)
	} else {
		return d3
			.select('[id="' + nodeCode + '--' + type + ':' + index + '"]')
			.attr(
				'id',
				(newNodeCode || nodeCode) +
					'--' +
					type +
					':' +
					((newIndex === null || newIndex) === undefined ? index : newIndex)
			)
	}
}
