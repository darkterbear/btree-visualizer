const lookupValue = async value => {
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
	// flash the correct key in the leaf
	var keyIndex = thisNode.values.indexOf(parseInt(value))
	console.log('index of the key to flash:' + keyIndex)
	var rect = d3.select('[id="' + thisNode.code + '--rect:' + keyIndex + '"]')
	for (var i = 0; i < 2; i++) {
		rect
			.transition()
			.attr('stroke', ' #d6eaf8 ')
			.duration(200)

		await sleep(200)

		rect
			.transition()
			.attr('stroke', 'steelblue')
			.duration(200)

		await sleep(200)
	}

	acceptingUserInput = true
}
