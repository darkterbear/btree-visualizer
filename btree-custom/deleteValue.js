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
	await deleteFromTree(value, thisNode)

	acceptingUserInput = true
}

const deleteFromTree = async (value, thisNode) => {
	// start going through the cases (ohboi)

	// is thisNode a leaf?
	if (thisNode.children.length === 0) {
		// does thisNode have sufficient keys for us to just take one out?
		if (thisNode.values.length >= t) {
			await deleteFromNode(value, thisNode)
		} else {
			// ohboi this might get complicated
			// so thisNode is a leaf but we cant delete the value straight up because not enough keys inside thisNode

			// find the index of thisNode in the children of its parent
			var parent = thisNode.parent

			var indexOfThisNodeInParent = 0

			for (
				;
				indexOfThisNodeInParent < parent.children.length;
				indexOfThisNodeInParent++
			) {
				if (parent.children[indexOfThisNodeInParent].code == thisNode.code)
					break
			}

			// get thisNode's siblings
			var y =
				indexOfThisNodeInParent - 1 >= 0
					? parent.children[indexOfThisNodeInParent - 1]
					: null
			var z =
				indexOfThisNodeInParent + 1 < parent.children.length
					? parent.children[indexOfThisNodeInParent + 1]
					: null

			// check if either of its siblings has >= t keys
			if (y && y.values.length >= t) {
				await leftLeafRotateDeletion(
					value,
					thisNode,
					y,
					thisNode.parent,
					indexOfThisNodeInParent - 1
				)
			} else if (z && z.values.length >= t) {
				await rightLeafRotateDeletion(
					value,
					thisNode,
					z,
					thisNode.parent,
					indexOfThisNodeInParent
				)
			} else {
				// if not, m e r g e thisNode w/ one of the siblings
				if (y) {
					mergeLeaves(y, x, thisNode.parent, indexOfThisNodeInParent - 1)
					deleteFromNode(value, y)
				} else if (z) {
					mergeLeaves(x, z, thisNode.parent, indexOfThisNodeInParent)
					deleteFromNode(value, x)
				}
			}
		}
	}
	// this is an internal node...
	else {
		// find the index of value in thisNode
		var indexOfKey = 0

		for (; indexOfKey < thisNode.values.length; indexOfKey++) {
			if (thisNode.values[indexOfKey] == value) break
		}

		// find the 2 children next to this value

		const y = indexOfKey >= 0 ? thisNode.children[indexOfKey] : null
		const z =
			indexOfKey + 1 < thisNode.children.length
				? thisNode.children[indexOfKey + 1]
				: null

		// do either of them have sufficient (>= t) keys?
		if (y && y.values.length >= t) {
			// TODO: recursive delete (case 3a)
		} else if (z && z.values.length >= t) {
			// TODO: recursive delete (case 3bs)
		}
		// neither of them have sufficient keys, perform merge
		else {
			// TODO: merge (case 3c)
		}
	}
}

/** merges two leaf nodes together */
const mergeLeaves = async (left, right, parent, parentKey) => {
	/** expand both left and right for visualization */
}

const leftLeafRotateDeletion = async (
	k,
	x,
	y,
	parent,
	parentAdjacentKeyIndex
) => {
	/** expand y for visualization */
	y.expanded = true
	redraw(matrix)
	// y.group
	// 	.transition()
	// 	.style('opacity', 1)
	// 	.duration(speed)

	await sleep(speed)

	/** make changes to the matrix **/
	// find the index of the key in x

	var index = 0
	for (; index < x.values.length; index++) {
		if (x.values[index] == k) break
	}

	// shift the nodes up to make space for the incoming rotation
	var shifter = index
	for (; shifter > 0; shifter--) {
		x.values[shifter] = x.values[shifter - 1]
	}

	// set index 0 to the adjacent parent key
	x.values[0] = parent.values[parentAdjacentKeyIndex]

	// move the last key in y to the parent adjacent key
	parent.values[parentAdjacentKeyIndex] = y.values.splice(
		y.values.length - 1,
		1
	)[0]

	/** animate removal of the deleted key */
	const targetRect = d3.select('[id="' + x.code + '--rect:' + index + '"]')
	const targetText = d3.select('[id="' + x.code + '--text:' + index + '"]')

	targetRect
		.transition()
		.style('opacity', 0)
		.duration(speed)

	targetText
		.transition()
		.style('opacity', 0)
		.duration(speed)

	await sleep(speed)

	targetRect.remove()
	targetText.remove()

	/** make changes to the ids */
	// shift keys in x up
	shifter = index - 1
	for (; shifter >= 0; shifter--) {
		d3.select('[id="' + x.code + '--rect:' + shifter + '"]').attr(
			'id',
			x.code + '--rect:' + (shifter + 1)
		)
		d3.select('[id="' + x.code + '--text:' + shifter + '"]').attr(
			'id',
			x.code + '--text:' + (shifter + 1)
		)
	}

	// make parent adjacentkey the new index 0 in x
	var rotateDownRect = d3.select(
		'[id="' + parent.code + '--rect:' + parentAdjacentKeyIndex + '"]'
	)

	var rotateDownText = d3.select(
		'[id="' + parent.code + '--text:' + parentAdjacentKeyIndex + '"]'
	)

	rotateDownRect.attr('id', x.code + '--rect:0')
	rotateDownText.attr('id', x.code + '--text:0')

	// also move it to x's group
	var rotateDownRectNode = rotateDownRect.remove().node()
	var rotateDownRectText = rotateDownText.remove().node()

	x.group.append(() => {
		return rotateDownRectNode
	})
	x.group.append(() => {
		return rotateDownRectText
	})

	// make y's last key into parent adjacentkey
	var rotateUpRect = d3.select(
		'[id="' + y.code + '--rect:' + y.values.length + '"]'
	)

	var rotateUpText = d3.select(
		'[id="' + y.code + '--text:' + y.values.length + '"]'
	)

	rotateUpRect.attr('id', parent.code + '--rect:' + parentAdjacentKeyIndex)
	rotateUpText.attr('id', parent.code + '--text:' + parentAdjacentKeyIndex)

	// also move it to parent's group
	var rotateUpRectNode = rotateUpRect.remove().node()
	var rotateUpTextNode = rotateUpText.remove().node()

	parent.group.append(() => {
		return rotateUpRectNode
	})

	parent.group.append(() => {
		return rotateUpTextNode
	})

	/** redraw */
	redraw(matrix)
}

const rightLeafRotateDeletion = async (
	k,
	x,
	z,
	parent,
	parentAdjacentKeyIndex
) => {
	/** expand z for visualization */
	z.expanded = true
	redraw(matrix)

	await sleep(speed)

	/** make changes to the matrix **/
	// find the index of the key in x

	var index = 0
	for (; index < x.values.length; index++) {
		if (x.values[index] == k) break
	}

	// shift the nodes up to make space for the incoming rotation
	var shifter = index
	for (; shifter < x.values.length - 1; shifter++) {
		x.values[shifter] = x.values[shifter + 1]
	}

	// set last index to the adjacent parent key
	x.values[x.values.length - 1] = parent.values[parentAdjacentKeyIndex]

	// move the first key in z to the parent adjacent key
	parent.values[parentAdjacentKeyIndex] = z.values.splice(0, 1)[0]

	/** animate removal of the deleted key */
	const targetRect = d3.select('[id="' + x.code + '--rect:' + index + '"]')
	const targetText = d3.select('[id="' + x.code + '--text:' + index + '"]')

	targetRect
		.transition()
		.style('opacity', 0)
		.duration(speed)

	targetText
		.transition()
		.style('opacity', 0)
		.duration(speed)

	await sleep(speed)

	targetRect.remove()
	targetText.remove()

	/** make changes to the ids */
	// shift keys in x down
	shifter = index + 1
	for (; shifter < x.values.length; shifter++) {
		d3.select('[id="' + x.code + '--rect:' + shifter + '"]').attr(
			'id',
			x.code + '--rect:' + (shifter - 1)
		)
		d3.select('[id="' + x.code + '--text:' + shifter + '"]').attr(
			'id',
			x.code + '--text:' + (shifter - 1)
		)
	}

	// make parent adjacentkey the new last index in x
	var rotateDownRect = d3.select(
		'[id="' + parent.code + '--rect:' + parentAdjacentKeyIndex + '"]'
	)

	var rotateDownText = d3.select(
		'[id="' + parent.code + '--text:' + parentAdjacentKeyIndex + '"]'
	)

	rotateDownRect.attr('id', x.code + '--rect:' + (x.values.length - 1))
	rotateDownText.attr('id', x.code + '--text:' + (x.values.length - 1))

	// also move it to x's group
	var rotateDownRectNode = rotateDownRect.remove().node()
	var rotateDownRectText = rotateDownText.remove().node()

	x.group.append(() => {
		return rotateDownRectNode
	})
	x.group.append(() => {
		return rotateDownRectText
	})

	// make z's first key into parent adjacentkey
	var rotateUpRect = d3.select('[id="' + z.code + '--rect:0"]')

	var rotateUpText = d3.select('[id="' + z.code + '--text:0"]')

	rotateUpRect.attr('id', parent.code + '--rect:' + parentAdjacentKeyIndex)
	rotateUpText.attr('id', parent.code + '--text:' + parentAdjacentKeyIndex)

	// also move it to parent's group
	var rotateUpRectNode = rotateUpRect.remove().node()
	var rotateUpTextNode = rotateUpText.remove().node()

	parent.group.append(() => {
		return rotateUpRectNode
	})

	parent.group.append(() => {
		return rotateUpTextNode
	})

	// shift z's remaining key ids down
	shifter = 1
	for (; shifter <= z.values.length; shifter++) {
		d3.select('[id="' + z.code + '--rect:' + shifter + '"]').attr(
			'id',
			z.code + '--rect:' + (shifter - 1)
		)
		d3.select('[id="' + z.code + '--text:' + shifter + '"]').attr(
			'id',
			z.code + '--text:' + (shifter - 1)
		)
	}

	/** redraw */
	redraw(matrix)
}

deleteFromNode = async (value, thisNode) => {
	// check that thisNode is actually a leaf so we dont fuck anything up
	if (thisNode.children.length > 0) return

	// straight up remove the key from the node
	var indexOfKey = 0

	for (; indexOfKey < thisNode.values.length; indexOfKey++) {
		if (thisNode.values[indexOfKey] == value) break
	}

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
