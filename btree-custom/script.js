// get window dimensions
var wW = window.innerWidth
var wH = window.innerHeight
var acceptingUserInput = true
var maxKeys = 0
var t = 0

// length, in user units, of the key display dimensions
const keySize = 48

// animation speed; larger is slower
const speed = 300

window.onload = () => {
	/**
	 * Just Make sure to return false so that your request will not go the server script
	 */
	document.querySelector('#insertForm').addEventListener('submit', function(e) {
		document.getElementById('insert').value = ''
		e.preventDefault()
	})

	document.querySelector('#lookupForm').addEventListener('submit', function(e) {
		document.getElementById('lookup').value = ''
		e.preventDefault()
	})

	document.querySelector('#deleteForm').addEventListener('submit', function(e) {
		document.getElementById('delete').value = ''
		e.preventDefault()
	})
}

// root svg canvas
var svg = d3
	.select('body')
	.append('svg:svg')
	.attr('width', wW)
	.attr('height', wH - 120)

var matrix = []

/**
 * Reads the json data from file input
 */
d3.json('t2.json', data => {
	maxKeys = data.t * 2 - 1
	t = data.t
	// inject parent data
	injectParent(data.root)

	// convert json data to matrix
	matrix = convertToMatrix(data.root)

	// draw the matrix
	draw(matrix)
})
