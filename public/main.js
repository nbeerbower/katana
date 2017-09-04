
(function() {
  var socket = io();
  var katanaCanvas = $('.kat-canvas');

  socket.on('object_new', onObjectNewEvent);
  socket.on('object_update', onObjectUpdateEvent);

  function onObjectNewEvent(data) {
    drawNewObject(data);
  }

  function onObjectUpdateEvent(data) {
    updateObject(data);
  }

  function getObjectStyle(object) {
    return 'transform: translate(' + object.x + 'px,' + object.y + 'px);'
                + 'width: ' + object.width + 'px; height: ' + object.height + 'px;';
  }

  function drawNewObject(object) {
    console.log(object);
    katanaCanvas.append("<div id='" + object._id + "'"
                        + " class='kat-object kat-sticky'"
                        + " data-x='" + object.x + "' data-y='" + object.y + "'"
                        + " style='" + getObjectStyle(object) + "'"
                        + ">"
                        + object.text +"</div>");
  }

  function updateObject(object) {
    var element = $('#'+object._id);
    if (!element.length) {
      drawNewObject(object);
      return;
    }
    var style = getObjectStyle(object);
    element.attr('data-x', object.x);
    element.attr('data-y', object.y);
    element.attr('style', style);
    element.text(object.text);
  }

  $('#new-button').click(function() {
    var katanaId = Math.floor(Date.now() / 1000);
    var defaultObject = {
      "_id": katanaId,
    	"x": 10,
    	"y": 10,
    	"width": 100,
    	"height": 100,
    	"text": 'hello world!'
    };
    drawNewObject(defaultObject);
    socket.emit('object_new', defaultObject);
  });

  interact('.kat-object')
  .draggable({
    // Make objects draggable
    inertia: true,
    restrict: {
      restriction: "parent",
      endOnly: true,
      elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    },
    autoScroll: true,
    onmove: dragMoveListener,
    onend: function (event) {
      console.log(event.target);
      console.log(event.target.id);
      // Update object coordinates serverside
      // event.dx and event.dy
      newObjectPosition = {
        "_id": event.target.id,
        "x": event.dx,
        "y": event.dy
      };
      socket.emit('object_update', newObjectPosition);
    }})
    .resizable({
      // Make objects resizable
      preserveAspectRatio: false,
      edges: { left: true, right: true, bottom: true, top: true }
    })
    .on('resizemove', function (event) {
      var target = event.target,
          x = (parseFloat(target.getAttribute('data-x')) || 0),
          y = (parseFloat(target.getAttribute('data-y')) || 0);

      target.style.width  = event.rect.width + 'px';
      target.style.height = event.rect.height + 'px';

      x += event.deltaRect.left;
      y += event.deltaRect.top;

      target.style.webkitTransform = target.style.transform =
          'translate(' + x + 'px,' + y + 'px)';

      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
    })
    .on('resizeend', function (event) {
      // Update object size serverside
      // event.rect.width and event.rect.height
      newObjectSize = {
        "_id": event.target.id,
        "width": event.dx,
        "height": event.dy
      };
      socket.emit('object_update', newObjectSize);
    });

  function dragMoveListener (event) {
    var target = event.target,
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  }
})();
