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
	// perform preemptive merging
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

		// see if thisNode has enough keys; specifically, at least t keys
		if (thisNode.children.length > 0 && thisNode.values.length < t) {
			// perform preemptive merge/rotation

			// merge is actually easier than rotation, so might as well check to see if we can do merge first
			var childIndex = getChildIndex(thisNode)
			var y = childIndex > 0 ? thisNode.parent.children[childIndex - 1] : null
			var z =
				childIndex < thisNode.parent.children.length - 1
					? thisNode.parent.children[childIndex + 1]
					: null

			if (y && y.values.length < t) {
				// merge thisnode w/ y and key from parent (y, parentKey, thisNode)
				await mergeNodes(y, thisNode, thisNode.parent, childIndex - 1)
				await recheckRoot()
			} else if (z && z.values.length < t) {
				// merge thisnode w/ z and key from parent (thisNode, parentKey, z)
				await mergeNodes(thisNode, z, thisNode.parent, childIndex)
				await recheckRoot()
			} else if (y) {
				// rotate from y
			} else {
				// rotate from z
			}
		}

		await sleep(speed * 2)
	}

	// thisNode is now the correct leaf node
	// start the recursive algorithm
	var index = 0
	for (; index < thisNode.values.length; index++) {
		if (thisNode.values[index] == value) break
	}

	await deleteFromTree(thisNode, index)

	acceptingUserInput = true
}

const recheckRoot = async () => {
	var oldRoot = matrix[0][0]
	console.log('root rechecked: ' + oldRoot.values.length)

	if (oldRoot.values.length === 0) {
		matrix.splice(0, 1)
		matrix[0][0].parent = null

		// move new root group out of old root group
		var newRoot = matrix[0][0]
		svg.append(() => newRoot.group.remove().node())
		oldRoot.group
			.transition()
			.style('opacity', 0)
			.duration(speed)

		var path = d3.select('[id="' + newRoot.code + '--path"]')
		path
			.transition()
			.style('opacity', 0)
			.duration(speed)

		redraw(matrix)
		await sleep(speed)

		path.remove()
	}
}

const mergeNodes = async (left, right, parent, parentKeyIndex) => {
	// expand left and right for visualization
	left.expanded = true
	right.expanded = true
	redraw(matrix)

	await sleep(speed)

	/** make changes to the matrix */
	// splice parentKey into left
	left.values.splice(
		left.values.length,
		0,
		parent.values.splice(parentKeyIndex, 1)[0]
	)

	// shove keys from right to left
	right.values.forEach(value => {
		left.values.splice(left.values.length, 0, value)
	})

	// TODO: remember to change the groups of the children!
	right.children.forEach(child => {
		left.children.splice(left.children.length, 0, child)
	})

	// splice `right` from parent's children
	parent.children.splice(parentKeyIndex + 1, 1)

	// pull `right` out of the matrix
	deleteFromMatrix(right.code)

	/** modify id's in prep for redraw */
	var parentKeyRect = d3.select(
		'[id="' + parent.code + '--rect:' + parentKeyIndex + '"]'
	)

	var parentKeyText = d3.select(
		'[id="' + parent.code + '--text:' + parentKeyIndex + '"]'
	)

	parentKeyRect.attr('id', left.code + '--rect:' + (t - 1))
	parentKeyText.attr('id', left.code + '--text:' + (t - 1))

	var parentKeyRectNode = parentKeyRect.remove().node()
	var parentKeyTextNode = parentKeyText.remove().node()

	left.group.append(() => {
		return parentKeyRectNode
	})
	left.group.append(() => {
		return parentKeyTextNode
	})

	// tag the circle to remove
	var removeCircle = d3.select(
		'[id="' + parent.code + '--circle:' + (parentKeyIndex + 1)
	)
	removeCircle.attr('id', 'removeCircle') // prevent id confusion when shifting other circles down

	// shift the parent's keys and circles down to fill the void
	// we have to go all the way up to the values array's length since we spliced a value earlier
	for (
		var shifter = parentKeyIndex + 1;
		shifter <= parent.values.length;
		shifter++
	) {
		d3.select('[id="' + parent.code + '--rect:' + shifter + '"]').attr(
			'id',
			parent.code + '--rect:' + (shifter - 1)
		)
		d3.select('[id="' + parent.code + '--text:' + shifter + '"]').attr(
			'id',
			parent.code + '--text:' + (shifter - 1)
		)

		d3.select('[id="' + parent.code + '--circle:' + (shifter + 1) + '"]').attr(
			'id',
			parent.code + '--circle:' + shifter
		)
	}

	// change the right leaf's key ids
	for (var i = 0; i < t - 1; i++) {
		var rightRect = d3.select('[id="' + right.code + '--rect:' + i + '"]')
		var rightText = d3.select('[id="' + right.code + '--text:' + i + '"]')
		rightRect.attr('id', left.code + '--rect:' + (t + i))
		rightText.attr('id', left.code + '--text:' + (t + i))

		var rightRectNode = rightRect.remove().node()
		var rightTextNode = rightText.remove().node()

		left.group.append(() => {
			return rightRectNode
		})
		left.group.append(() => {
			return rightTextNode
		})

		// move the right children groups
		for (var i = 0; i < t; i++) {
			var rightCircle = d3.select('[id="' + right.code + '--circle:' + i + '"]')
			var rightChildGroup = right.children[i].group
			rightCircle.attr('id', left.code + '--circle:' + (t + i))

			var rightCircleNode = rightCircle.remove().node()
			var rightChildGroupNode = rightChildGroup.remove().node()

			left.group.append(() => rightCircleNode)
			left.group.append(() => rightChildGroupNode)
		}

		/** redraw */
		// make the parent circle disappear
		removeCircle
			.transition()
			.style('opacity', 0)
			.duration(speed)

		right.group
			.transition()
			.style('opacity', 0)
			.duration(speed)

		redraw(matrix)

		await sleep(speed)

		removeCircle.remove()
		right.group.remove()
	}
}

const deleteFromTree = async (node, keyIndex) => {
	// start going through the cases (ohboi)

	// is thisNode a leaf?
	if (node.children.length === 0) {
		// does thisNode have sufficient keys for us to just take one out?
		if (node.values.length >= t) {
			await deleteFromNode(node, keyIndex)
		} else {
			// ohboi this might get complicated
			// so thisNode is a leaf but we cant delete the value straight up because not enough keys inside thisNode

			// find the index of thisNode in the children of its parent
			var parent = node.parent
			if (!parent) {
				// this leaf is actually root, just delete lol
				await deleteFromNode(node, keyIndex)

				if (node.values.length === 0) {
					// welp no more values
					matrix = []
					svg.remove()
					svg = d3
						.select('body')
						.append('svg:svg')
						.attr('width', wW)
						.attr('height', wH - 120)
				}
				return
			}

			var indexOfThisNodeInParent = 0

			for (
				;
				indexOfThisNodeInParent < parent.children.length;
				indexOfThisNodeInParent++
			) {
				if (parent.children[indexOfThisNodeInParent].code == node.code) break
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
					keyIndex,
					node,
					y,
					node.parent,
					indexOfThisNodeInParent - 1
				)
			} else if (z && z.values.length >= t) {
				await rightLeafRotateDeletion(
					keyIndex,
					node,
					z,
					node.parent,
					indexOfThisNodeInParent
				)
			} else {
				// if not, m e r g e thisNode w/ one of the siblings
				if (y) {
					await mergeLeavesAndDelete(
						y,
						node,
						node.parent,
						indexOfThisNodeInParent - 1,
						keyIndex
					)
				} else if (z) {
					await mergeLeavesAndDelete(
						node,
						z,
						node.parent,
						indexOfThisNodeInParent,
						keyIndex
					)
				}
				await recheckRoot()
			}
		}
	}
	// this is an internal node...
	else {
		// find the 2 children next to this value

		const y = keyIndex >= 0 ? node.children[keyIndex] : null
		const z =
			keyIndex + 1 < node.children.length ? node.children[keyIndex + 1] : null

		// do either of them have sufficient (>= t) keys?
		if (y && y.values.length >= t) {
			if (z) z.expanded = true
			await recursiveDelete(node, y, keyIndex, false)
		} else if (z && z.values.length >= t) {
			if (y) y.expanded = true
			await recursiveDelete(node, z, keyIndex, true)
		}
		// neither of them have sufficient keys, perform merge
		else {
			// TODO: merge (case 3c)
		}
	}
}

const recursiveDelete = async (node, child, index, isOnRight) => {
	/** expand the left child */
	child.expanded = true
	redraw(matrix)

	await sleep(speed)

	var childPromoteIndex = isOnRight ? 0 : child.values.length - 1

	/** modify the matrix */
	// set leftmost key in node to rightmost key in child
	node.values[index] = child.values[childPromoteIndex]

	/** change ids, move groups, etc. */
	var deleteKeyRect = d3.select('[id="' + node.code + '--rect:' + index + '"]')
	var deleteKeyText = d3.select('[id="' + node.code + '--text:' + index + '"]')

	deleteKeyRect
		.transition()
		.style('opacity', 0)
		.duration(speed)

	deleteKeyText
		.transition()
		.style('opacity', 0)
		.duration(speed)

	var childKeyRect = d3.select(
		'[id="' + child.code + '--rect:' + childPromoteIndex + '"]'
	)
	var childKeyText = d3.select(
		'[id="' + child.code + '--text:' + childPromoteIndex + '"]'
	)

	childKeyRect.attr('id', node.code + '--rect:' + index)
	childKeyText.attr('id', node.code + '--text:' + index)

	node.group.append(() => {
		return childKeyRect.remove().node()
	})

	node.group.append(() => {
		return childKeyText.remove().node()
	})

	await sleep(speed)

	deleteKeyRect.remove()
	deleteKeyText.remove()

	redraw(matrix)

	await sleep(speed)

	await deleteFromTree(child, childPromoteIndex)
}

/** merges two leaf nodes together */
const mergeLeavesAndDelete = async (
	left,
	right,
	parent,
	parentKeyIndex,
	index
) => {
	/** expand both left and right for visualization */
	left.expanded = true
	right.expanded = true
	redraw(matrix)

	await sleep(speed)

	/** make changes to the matrix */

	// to smush them two together, first splice parentkey into left
	left.values.splice(
		left.values.length,
		0,
		parent.values.splice(parentKeyIndex, 1)[0]
	)

	// then shove everything from right into left
	right.values.forEach(value => {
		left.values.splice(left.values.length, 0, value)
	})

	// splice `right` from parent's children
	parent.children.splice(parentKeyIndex + 1, 1)

	// pull `right` out of the matrix
	deleteFromMatrix(right.code)

	var parentKeyRect = d3.select(
		'[id="' + parent.code + '--rect:' + parentKeyIndex + '"]'
	)

	var parentKeyText = d3.select(
		'[id="' + parent.code + '--text:' + parentKeyIndex + '"]'
	)

	parentKeyRect.attr('id', left.code + '--rect:' + (t - 1))
	parentKeyText.attr('id', left.code + '--text:' + (t - 1))

	var parentKeyRectNode = parentKeyRect.remove().node()
	var parentKeyTextNode = parentKeyText.remove().node()

	left.group.append(() => {
		return parentKeyRectNode
	})
	left.group.append(() => {
		return parentKeyTextNode
	})

	// tag the circle to remove
	var removeCircle = d3.select(
		'[id="' + parent.code + '--circle:' + (parentKeyIndex + 1)
	)
	removeCircle.attr('id', 'removeCircle') // prevent id confusion when shifting other circles down

	// shift the parent's keys and circles down to fill the void
	// we have to go all the way up to the values array's length since we spliced a value earlier
	for (
		var shifter = parentKeyIndex + 1;
		shifter <= parent.values.length;
		shifter++
	) {
		d3.select('[id="' + parent.code + '--rect:' + shifter + '"]').attr(
			'id',
			parent.code + '--rect:' + (shifter - 1)
		)
		d3.select('[id="' + parent.code + '--text:' + shifter + '"]').attr(
			'id',
			parent.code + '--text:' + (shifter - 1)
		)

		d3.select('[id="' + parent.code + '--circle:' + (shifter + 1) + '"]').attr(
			'id',
			parent.code + '--circle:' + shifter
		)
	}

	// change the right leaf's key ids
	for (var i = 0; i < t - 1; i++) {
		var rightRect = d3.select('[id="' + right.code + '--rect:' + i + '"]')
		var rightText = d3.select('[id="' + right.code + '--text:' + i + '"]')
		rightRect.attr('id', left.code + '--rect:' + (t + i))
		rightText.attr('id', left.code + '--text:' + (t + i))

		var rightRectNode = rightRect.remove().node()
		var rightTextNode = rightText.remove().node()

		left.group.append(() => {
			return rightRectNode
		})
		left.group.append(() => {
			return rightTextNode
		})
	}

	/** redraw */
	// make the parent circle disappear
	removeCircle
		.transition()
		.style('opacity', 0)
		.duration(speed)

	right.group
		.transition()
		.style('opacity', 0)
		.duration(speed)

	redraw(matrix)

	await sleep(speed)

	removeCircle.remove()
	right.group.remove()

	deleteFromNode(left, index)
}

const leftLeafRotateDeletion = async (
	index,
	x,
	y,
	parent,
	parentAdjacentKeyIndex
) => {
	/** expand y for visualization */
	y.expanded = true
	redraw(matrix)

	await sleep(speed)

	/** make changes to the matrix **/

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
	index,
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

deleteFromNode = async (node, keyIndex) => {
	// check that thisNode is actually a leaf so we dont fuck anything up
	if (node.children.length > 0) return

	// splice the value
	node.values.splice(keyIndex, 1)

	// animate this removal
	// get rid of the rectangle and text
	const targetRect = d3.select(
		'[id="' + node.code + '--rect:' + keyIndex + '"]'
	)
	const targetText = d3.select(
		'[id="' + node.code + '--text:' + keyIndex + '"]'
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
	for (var i = keyIndex + 1; i <= node.values.length; i++) {
		d3.select('[id="' + node.code + '--rect:' + i + '"]').attr(
			'id',
			node.code + '--rect:' + (i - 1)
		)
		d3.select('[id="' + node.code + '--text:' + i + '"]').attr(
			'id',
			node.code + '--text:' + (i - 1)
		)
	}

	// redraw to animate the other elements filling in the gap
	redraw(matrix)

	// let the animations run to completion...
	await sleep(speed)
}
