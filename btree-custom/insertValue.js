const insertValue = async value => {
	// check that the key doesn't already exist
	if (keyExists(value, matrix)) return

	// dont allow insert when another insert is happening
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
			.duration(300)
	})

	// show the new key being created

	var x =
		parseInt(d3.select('[id="' + rootNodeCode + '--rect:0').attr('x')) +
		(1 + root.values.length) * keySize
	var y = 128

	var insertKey = svg
		.append('svg:g')
		.attr('id', 'insert')
		.style('opacity', 0)

	var rect = insertKey
		.append('svg:rect')
		.attr('id', 'insert--rect')
		.attr('height', keySize)
		.attr('width', keySize)
		.attr('x', x)
		.attr('y', y)
		.attr('fill', 'white')
		.attr('stroke', 'steelblue')
		//.attr('stroke', 'limegreen')
		.attr('stroke-width', 4)

	var text = insertKey
		.append('svg:text')
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
		})

	insertKey
		.transition()
		.style('opacity', 1)
		.duration(300)

	await sleep(500)

	// animate the new key down to the correct leaf
	var thisNode = root
	while (thisNode.children.length > 0) {
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
			.duration(300)

		// move the newkey down to the same level as the newly expanded child
		y += 128
		text
			.transition()
			.attr('y', y + keySize / 1.5)
			.duration(300)

		rect
			.transition()
			.attr('y', y)
			.duration(300)

		// redraw the matrix
		redraw(matrix)

		// set thisNode to child
		thisNode = child

		await sleep(500)
	}

	// thisNode is now the correct leaf node
	// insert the new value into this leaf node
	var thisNodeCode = thisNode.code
	var thisNodeGroup = d3.select('[id="' + thisNodeCode + '"]')

	// find the index of insertion
	var index = 0
	var oldMaxIndex = thisNode.values.length - 1
	for (; index < thisNode.values.length; index++) {
		var checkValue = thisNode.values[index]
		if (value < checkValue) break
	}

	// insert the new value into the leaf node
	thisNode.values.splice(index, 0, parseInt(value))

	// shift the keyIndex's of these rect's and text's up by one to make space for new key
	for (var keyIndex = oldMaxIndex; keyIndex >= index; keyIndex--) {
		d3.select('[id="' + thisNodeCode + '--rect:' + keyIndex + '"]').attr(
			'id',
			thisNodeCode + '--rect:' + (keyIndex + 1)
		)

		d3.select('[id="' + thisNodeCode + '--text:' + keyIndex + '"]').attr(
			'id',
			thisNodeCode + '--text:' + (keyIndex + 1)
		)
	}

	// insert the new rect element
	thisNodeGroup
		.append('svg:rect')
		.attr('height', keySize)
		.attr('width', keySize)
		.attr('x', parseInt(rect.attr('x')))
		.attr('y', parseInt(rect.attr('y')))
		.attr('fill', 'white')
		.attr('stroke', 'steelblue')
		//.attr('stroke', 'limegreen')
		.attr('stroke-width', 4)
		.attr('id', thisNodeCode + '--rect:' + index)

	// insert the new text element
	thisNodeGroup
		.append('svg:text')
		.attr('id', thisNodeCode + '--text:' + index)
		.attr('x', parseInt(text.attr('x')))
		.attr('y', parseInt(text.attr('y')))
		.attr('font-family', 'Sofia Pro')
		.attr('font-size', 24)
		.attr('fill', 'black')
		.attr('stroke', 'black')
		.style('text-anchor', 'middle')
		.text(() => {
			return value
		})

	// remove the temporary insert elements
	insertKey.remove()
	rect.remove()
	text.remove()

	// redraw to animate the insertion
	redraw(matrix)

	await sleep(300)

	// find leaf depth (should be deepest - 1)
	var matrixDepth = matrix.length - 2

	while (thisNode.values.length > maxKeys) {
		// a split will modify matrix structure, find the index of thisNode in the layer w/ depth of matrixdepth
		var thisNodeMatrixIndex = 0
		for (
			;
			thisNodeMatrixIndex < matrix[matrixDepth].length;
			thisNodeMatrixIndex++
		) {
			if (matrix[matrixDepth][thisNodeMatrixIndex].code == thisNode.code) break
		}

		// find promote value
		var promoteIndex = Math.floor(maxKeys / 2)
		var promoteValue = thisNode.values[promoteIndex]

		var promoteKeyRect = d3.select(
			'[id="' + thisNode.code + '--rect:' + promoteIndex + '"]'
		)
		var promoteKeyText = d3.select(
			'[id="' + thisNode.code + '--text:' + promoteIndex + '"]'
		)

		var leftNodeX = parseInt(
			d3.select('[id="' + thisNode.code + '--rect:' + 0 + '"]').attr('x')
		)
		var rightNodeX = parseInt(
			d3
				.select('[id="' + thisNode.code + '--rect:' + (promoteIndex + 1) + '"]')
				.attr('x')
		)

		// split the rest of the keys into 2 nodes
		// dont forget to recalculate node codes!
		// when changing a node's code, keep track of: its group, rect, text, circles, path, and those of its parent

		var leftKeys = thisNode.values.slice(0, promoteIndex)
		var rightKeys = thisNode.values.slice(
			promoteIndex + 1,
			thisNode.values.length
		)

		var leftChildren = thisNode.children.slice(0, promoteIndex + 1)
		var rightChildren = thisNode.children.slice(
			promoteIndex + 1,
			thisNode.children.length
		)

		// TODO: handle root split and promotes
		/**
		 * 1. matrix needs to be modified, push empty node to matrix[0]
		 */

		/** ********* put the promoted key into the parent node ******** **/
		var parentNode = thisNode.parent
		var oldMatrixDepth = matrixDepth

		if (!parentNode) {
			// handling a root split
			parentNode = {
				expanded: true,
				children: [thisNode],
				values: [],
				code: makeid(),
				parent: null
			}

			matrix.splice(0, 0, [parentNode])
			matrixDepth++

			thisNode.parent = parentNode

			// give this new root a group
			parentNode.group = svg.append('svg:g').attr('id', parentNode.code)

			// remove the old root group
			// var oldRootClone = clone('[id="' + thisNode.code + '"]');

			var removed = thisNode.group.remove()

			// move everything into the new group
			parentNode.group.append(() => {
				return removed.node()
			})

			// give the new root a circle
			var circle = parentNode.group
				.append('svg:circle')
				.attr('id', parentNode.code + '--circle:0')
				.attr(
					'cx',
					parseInt(
						d3.select('[id="' + thisNode.code + '--circle:0').attr('cx')
					) -
						keySize / 2 +
						(thisNode.values.length * keySize) / 2
				)
				.attr('cy', keySize)
				.attr('r', keySize / 8)
				.attr('fill', thisNode.expanded ? 'steelblue' : white)
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 4)
				.on('click', () => {
					if (!acceptingUserInput) return
					if (thisNode.expanded) {
						thisNode.expanded = false
						d3.select('[id="' + thisNode.code + '"]')
							.transition()
							.style('opacity', 0)
							.duration(300)

						circle
							.transition()
							.style('fill', 'white')
							.duration(300)
					} else {
						thisNode.expanded = true
						d3.select('[id="' + thisNode.code + '"]')
							.transition()
							.style('opacity', 1)
							.duration(300)

						circle
							.transition()
							.style('fill', 'steelblue')
							.duration(300)
					}

					redraw(matrix)
				})
		}

		var parentGroup = thisNode.parent.group // attach the split node groups to the parent group element

		var leftNode = {
			expanded: true,
			values: leftKeys,
			children: leftChildren,
			parent: thisNode.parent
		}
		leftNode.code = makeid()

		var rightNode = {
			expanded: true,
			values: rightKeys,
			children: rightChildren,
			parent: thisNode.parent
		}
		rightNode.code = makeid()

		/** ********* create the left group ******** **/
		leftNode.group = parentGroup.append('svg:g').attr('id', leftNode.code)

		/** ********* create the right group ******** **/
		rightNode.group = parentGroup.append('svg:g').attr('id', rightNode.code)

		/** ********* render the new rects and texts for left node ******** **/
		leftNode.values.forEach((value, index) => {
			leftNode.group
				.append('svg:rect')
				.attr('id', leftNode.code + '--rect:' + index)
				.attr('x', leftNodeX + keySize * index)
				.attr('y', 128 * (oldMatrixDepth + 1))
				.attr('height', keySize)
				.attr('width', keySize)
				.attr('fill', 'white')
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 4)

			leftNode.group
				.append('svg:text')
				.attr('id', leftNode.code + '--text:' + index)
				.attr('x', leftNodeX + keySize * (index + 0.5))
				.attr('y', 128 * (oldMatrixDepth + 1) + keySize / 1.5)
				.attr('font-family', 'Sofia Pro')
				.attr('font-size', 24)
				.attr('fill', 'black')
				.attr('stroke', 'black')
				.style('text-anchor', 'middle')
				.text(() => {
					return value
				})
		})

		/** ********* render the new rects and texts for right node ******** **/
		rightNode.values.forEach((value, index) => {
			rightNode.group
				.append('svg:rect')
				.attr('id', rightNode.code + '--rect:' + index)
				.attr('x', rightNodeX + keySize * index)
				.attr('y', 128 * (oldMatrixDepth + 1))
				.attr('height', keySize)
				.attr('width', keySize)
				.attr('fill', 'white')
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 4)

			rightNode.group
				.append('svg:text')
				.attr('id', rightNode.code + '--text:' + index)
				.attr('x', rightNodeX + keySize * (index + 0.5))
				.attr('y', 128 * (oldMatrixDepth + 1) + keySize / 1.5)
				.attr('font-family', 'Sofia Pro')
				.attr('font-size', 24)
				.attr('fill', 'black')
				.attr('stroke', 'black')
				.style('text-anchor', 'middle')
				.text(() => {
					return value
				})
		})

		/** ********* move elements over to the left group and draw circles ******** **/
		leftChildren.forEach((child, childIndex) => {
			child.parent = leftNode
			var removed = child.group.remove()
			leftNode.group.append(() => {
				return removed.node()
			})
			leftNode.group
				.append('svg:circle')
				.attr('id', leftNode.code + '--circle:' + childIndex)
				.attr('r', keySize / 8)
				.attr('cx', leftNodeX + keySize * childIndex)
				.attr('cy', 128 * (oldMatrixDepth + 1) + keySize)
				.attr('fill', child.expanded ? 'steelblue' : 'white')
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 4)
				.on('click', () => {
					if (!acceptingUserInput) return
					if (child.expanded) {
						child.expanded = false
						d3.select('[id="' + child.code + '"]')
							.transition()
							.style('opacity', 0)
							.duration(300)

						circle
							.transition()
							.style('fill', 'white')
							.duration(300)
					} else {
						child.expanded = true
						d3.select('[id="' + child.code + '"]')
							.transition()
							.style('opacity', 1)
							.duration(300)

						circle
							.transition()
							.style('fill', 'steelblue')
							.duration(300)
					}

					redraw(matrix)
				})
		})

		/** ********* move elements over to the right group and draw circles ******** **/
		rightChildren.forEach((child, childIndex) => {
			child.parent = rightNode
			var removed = child.group.remove()
			rightNode.group.append(() => {
				return removed.node()
			})
			rightNode.group
				.append('svg:circle')
				.attr('id', rightNode.code + '--circle:' + childIndex)
				.attr('r', keySize / 8)
				.attr('cx', rightNodeX + keySize * childIndex)
				.attr('cy', 128 * (oldMatrixDepth + 1) + keySize)
				.attr('fill', child.expanded ? 'steelblue' : 'white')
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 4)
				.on('click', () => {
					if (!acceptingUserInput) return
					if (child.expanded) {
						child.expanded = false
						d3.select('[id="' + child.code + '"]')
							.transition()
							.style('opacity', 0)
							.duration(300)

						circle
							.transition()
							.style('fill', 'white')
							.duration(300)
					} else {
						child.expanded = true
						d3.select('[id="' + child.code + '"]')
							.transition()
							.style('opacity', 1)
							.duration(300)

						circle
							.transition()
							.style('fill', 'steelblue')
							.duration(300)
					}

					redraw(matrix)
				})
		})

		// find the index of insertion
		var insertIndex = 0
		for (; insertIndex < parentNode.values.length; insertIndex++) {
			if (promoteValue < parentNode.values[insertIndex]) break
		}

		// insert the value into data
		parentNode.values.splice(insertIndex, 0, parseInt(promoteValue))

		var leftNodeChildIndex = -1
		/** ********* reinject the parent's children ******** **/
		for (var i = 0; i < parentNode.children.length; i++) {
			if (parentNode.children[i].code == thisNode.code) {
				parentNode.children.splice(i, 1)
				parentNode.children.splice(i, 0, rightNode)
				parentNode.children.splice(i, 0, leftNode)

				leftNodeChildIndex = i
				break
			}
		}

		for (var i = parentNode.children.length - 1; i > insertIndex; i--) {
			d3.select('[id="' + parentNode.code + '--circle:' + i + '"]').attr(
				'id',
				parentNode.code + '--circle:' + (i + 1)
			)
		}

		// insert one new circle because split introduces a new child
		var circle = parentGroup
			.append('svg:circle')
			.attr('id', parentNode.code + '--circle:' + (insertIndex + 1))
			.attr('r', keySize / 8)
			// TODO:
			.attr('cy', oldMatrixDepth * 128 + keySize)
			.attr('cx', parseInt(promoteKeyRect.attr('x')) + keySize)
			.attr('fill', 'steelblue')
			.attr('stroke', 'steelblue')
			.attr('stroke-width', 4)
			.on('click', () => {
				if (!acceptingUserInput) return
				var child = parentNode.children[insertIndex + 1]
				if (child.expanded) {
					child.expanded = false
					d3.select('[id="' + child.code + '"]')
						.transition()
						.style('opacity', 0)
						.duration(300)

					circle
						.transition()
						.style('fill', 'white')
						.duration(300)
				} else {
					child.expanded = true
					d3.select('[id="' + child.code + '"]')
						.transition()
						.style('opacity', 1)
						.duration(300)

					circle
						.transition()
						.style('fill', 'steelblue')
						.duration(300)
				}
			})

		// shift the keyIndex's of these rect's and text's up by one to make space for new key
		// also update the id nodecodes in the process
		for (
			var keyIndex = parentNode.values.length - 1;
			keyIndex >= insertIndex;
			keyIndex--
		) {
			d3.select('[id="' + parentNode.code + '--rect:' + keyIndex + '"]').attr(
				'id',
				parentNode.code + '--rect:' + (keyIndex + 1)
			)

			d3.select('[id="' + parentNode.code + '--text:' + keyIndex + '"]').attr(
				'id',
				parentNode.code + '--text:' + (keyIndex + 1)
			)
		}

		var promotedRect = parentGroup
			.append('svg:rect')
			.attr('height', keySize)
			.attr('width', keySize)
			.attr('x', parseInt(promoteKeyRect.attr('x')))
			.attr('y', parseInt(promoteKeyRect.attr('y')))
			.attr('fill', 'white')
			.attr('stroke', 'steelblue')
			.attr('stroke-width', 4)
			.attr('id', parentNode.code + '--rect:' + insertIndex)

		var promotedText = parentGroup
			.append('svg:text')
			.attr('x', parseInt(promoteKeyText.attr('x')))
			.attr('y', parseInt(promoteKeyText.attr('y')))
			.attr('font-family', 'Sofia Pro')
			.attr('font-size', 24)
			.attr('fill', 'black')
			.attr('stroke', 'black')
			.style('text-anchor', 'middle')
			.attr('id', parentNode.code + '--text:' + insertIndex)
			.text(() => {
				return promoteValue
			})

		/** ********* draw the new paths ******** **/
		var y2ReferenceIndex = insertIndex == 0 ? 1 : 0
		// draw the path from leftNode to parentNode
		var leftNodeX1 = leftNodeX + (keySize * leftNode.values.length) / 2
		var leftNodeY1 = 128 * (oldMatrixDepth + 1)

		var parentLeftNodeCircle = d3.select(
			'[id="' + parentNode.code + '--circle:' + leftNodeChildIndex + '"]'
		)
		var leftNodeX2 = parseInt(parentLeftNodeCircle.attr('cx'))

		var parentRect = d3.select(
			'[id="' + parentNode.code + '--rect:' + y2ReferenceIndex + '"]'
		)
		var y2 = parentRect.empty()
			? oldMatrixDepth * 128 + keySize
			: keySize + parseInt(parentRect.attr('y'))
		var leftNodePathString =
			'M' +
			leftNodeX1 +
			' ' +
			leftNodeY1 +
			' C ' +
			leftNodeX1 +
			' ' +
			(leftNodeY1 - keySize * 1.5) +
			', ' +
			leftNodeX2 +
			' ' +
			(y2 + keySize * 1.5) +
			', ' +
			leftNodeX2 +
			' ' +
			y2
		leftNode.group
			.append('svg:path')
			.attr('id', leftNode.code + '--path')
			.attr('fill', 'transparent')
			.attr('stroke', 'steelblue')
			.attr('stroke-width', 2)
			.attr('d', leftNodePathString)

		// draw the path from rightNode to parentNode
		var rightNodeX1 = rightNodeX + (keySize * rightNode.values.length) / 2
		var rightNodeY1 = 128 * (oldMatrixDepth + 1)

		var parentRightNodeCircle = d3.select(
			'[id="' + parentNode.code + '--circle:' + (leftNodeChildIndex + 1) + '"]'
		)
		var rightNodeX2 = parseInt(parentRightNodeCircle.attr('cx'))

		var rightNodePathString =
			'M' +
			rightNodeX1 +
			' ' +
			rightNodeY1 +
			' C ' +
			rightNodeX1 +
			' ' +
			(rightNodeY1 - keySize * 1.5) +
			', ' +
			rightNodeX2 +
			' ' +
			(y2 + keySize * 1.5) +
			', ' +
			rightNodeX2 +
			' ' +
			y2
		rightNode.group
			.append('svg:path')
			.attr('id', rightNode.code + '--path')
			.attr('fill', 'transparent')
			.attr('stroke', 'steelblue')
			.attr('stroke-width', 2)
			.attr('d', rightNodePathString)

		/** ********* destroy the old group ******** **/
		thisNode.group.remove()
		matrix[matrixDepth].splice(thisNodeMatrixIndex, 1)
		matrix[matrixDepth].splice(thisNodeMatrixIndex, 0, rightNode)
		matrix[matrixDepth].splice(thisNodeMatrixIndex, 0, leftNode)

		// animate new key y attr up by 128
		promotedText
			.transition()
			.attr('y', parseInt(promotedText.attr('y')) - 128)
			.duration(300)

		promotedRect
			.transition()
			.attr('y', parseInt(promotedRect.attr('y')) - 128)
			.duration(300)

		await sleep(300)

		/** ********* redraw the entire thing ******** **/
		redraw(matrix)

		// set thisNode pointer to the parent
		thisNode = thisNode.parent
		matrixDepth--

		await sleep(300)
		//break;
	}

	acceptingUserInput = true
}
