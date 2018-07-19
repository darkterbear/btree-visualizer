// get window dimensions
var wW = window.innerWidth;
var wH = window.innerHeight;
var acceptingUserInput = true;
var maxKeys = 0;

// length, in user units, of the key display dimensions
const keySize = 48;

window.onload = () => {
  /**
   * Just Make sure to return false so that your request will not go the server script
   */
  document.querySelector("#modifyForm").addEventListener("submit",
    function (e) {

      //some code
      document.getElementById('insert').value = ''
      e.preventDefault();
    })
}

// root svg canvas
var svg = d3.select('body').append('svg:svg')
  .attr('width', wW)
  .attr('height', wH);

var matrix = [];

/**
 * Reads the json data from file input
 */
d3.json('data-btree-2.2.json', (data) => {
  maxKeys = data.maxKeys;
  // inject parent data
  injectParent(data.root);

  // convert json data to matrix
  matrix = convertToMatrix(data.root);

  // draw the matrix
  draw(matrix);
});
