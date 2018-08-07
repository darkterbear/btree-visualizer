const deleteValue = async value => {
	// check that the key exists
	if (!keyExists(value, matrix)) return

	// dont allow lookup when something else is happening
	if (!acceptingUserInput) return

	// disable user input while insert is in progress
	acceptingUserInput = false

	// collapse the entire tree
	var root = matrix[0][0]
	collapseAll(root)
	var rootNodeCode = root.code
	root.children.forEach((child, index) => {
		d3.select('[id="' + rootNodeCode + '--circle:' + index)
			.transition()
			.style('fill', 'white')
			.duration(speed)
	})

	// animate the new key down to the correct leaf
	var thisNode = root
	while (thisNode.children.length > 0) {
		// if this node contains the key, then stop, don't need to go to leaf
		if (thisNode.values.includes(parseInt(value))) break

		// while not at leaf, continue traversing + animating down
		var i // i represents which child to insert into
		for (i = 0; i < thisNode.values.length; i++) {
			// find the correct child by comparing against values
			var checkValue = thisNode.values[i]
			if (value < checkValue) break
		}

		var child = thisNode.children[i]

		// expand this child
		child.expanded = true
		var nodeCode = child.code
		d3.select('[id="' + nodeCode + '"]')
			.transition()
			.style('opacity', 1)
			.duration(speed)

		// redraw the matrix
		redraw(matrix)

		// set thisNode to child
		thisNode = child

		await sleep(speed * 2)
	}

	// thisNode is now the correct leaf node
	// start the recursive algorithm
	deleteFromTree(value, thisNode)

	acceptingUserInput = true
}

const deleteFromTree = async (value, thisNode) => {
	// start going through the cases (ohboi)

	// is thisNode a leaf?
	if (thisNode.children.length === 0) {
		// does thisNode have sufficient keys for us to just take one out?
		if (thisNode.values.length >= t) {
			deleteFromNode(value, thisNode)
		} else {
			// ohboi this might get complicated
			// TODO: call another function to do rotate/merge
		}
	}
}

deleteFromNode = async (value, thisNode) => {
	// check that thisNode is actually a leaf so we dont fuck anything up
	if (thisNode.children.length > 0) return

	// straight up remove the key from the node
	var indexOfKey = 0

	for (; indexOfKey < thisNode.values.length; indexOfKey++) {
		if (thisNode.values[indexOfKey] == value) break
	}

	console.log('removing index ' + indexOfKey)
	// splice the value
	thisNode.values.splice(indexOfKey, 1)

	// animate this removal
	// get rid of the rectangle and text
	const targetRect = d3.select(
		'[id="' + thisNode.code + '--rect:' + indexOfKey + '"]'
	)
	const targetText = d3.select(
		'[id="' + thisNode.code + '--text:' + indexOfKey + '"]'
	)

	targetRect
		.transition()
		.style('opacity', 0)
		.duration(speed)

	targetText
		.transition()
		.style('opacity', 0)
		.duration(speed)

	// let the animation run to completion...
	await sleep(speed)

	// before deleting the old keys
	targetRect.remove()
	targetText.remove()

	// shift everything that was to its right down an id value
	for (var i = indexOfKey + 1; i <= thisNode.values.length; i++) {
		d3.select('[id="' + thisNode.code + '--rect:' + i + '"]').attr(
			'id',
			thisNode.code + '--rect:' + (i - 1)
		)
		d3.select('[id="' + thisNode.code + '--text:' + i + '"]').attr(
			'id',
			thisNode.code + '--text:' + (i - 1)
		)
	}

	// redraw to animate the other elements filling in the gap
	redraw(matrix)

	// let the animations run to completion...
	await sleep(speed)
}
