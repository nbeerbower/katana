'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('kat-whiteboard')[0];
  var context = canvas.getContext('2d');
  var colorButton = document.getElementsByClassName('kat-color')[0];
  var clearButton = document.getElementsByClassName('kat-clear')[0];

  var current = {
    color: '#000000'
  };
  var drawing = false;

  var drawings = [];

  var colorPicker = AColorPicker.from('.kat-color-picker');
  colorPicker.on('change', (picker, color) => {
    current.color = color;
  });

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  colorButton.addEventListener('click', onColorButtonPress, false);
  clearButton.addEventListener('click', onClearButtonPress, false);

  socket.on('init', onInit);
  socket.on('paint', onDrawingEvent);
  socket.on('clear', onClear);

  window.addEventListener('resize', onResize, false);
  onResize();

  function toggleVisibility(element) {
    element.classList.toggle('kat-is-visible');
  }

  function onColorButtonPress() {
    toggleVisibility(document.getElementsByClassName('kat-color-picker')[0]);
  }

  function onClearButtonPress() {
    socket.emit('clear');
    onClear();
  }

  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    var paintObject = {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    };
    socket.emit('paint', paintObject);
    drawings.push(paintObject);
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onInit(data) {
    drawings = [].concat(data);
    redraw();
  }

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  function onClear() {
    drawings = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function redraw() {
    var w = canvas.width;
    var h = canvas.height;
    for (var i = 0; i < drawings.length; i++) {
      drawLine(drawings[i].x0 * w, drawings[i].y0 * h, drawings[i].x1 * w, drawings[i].y1 * h, drawings[i].color);
    }
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
  }

})();
