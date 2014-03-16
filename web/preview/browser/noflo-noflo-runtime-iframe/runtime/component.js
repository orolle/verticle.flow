(function (context) {
  var noflo = context.require('noflo');

  // Get the component name
  var component = context.location.search.substring(1);

  // The target to communicate with
  var origin = context.parent.location.origin;

  // Create an empty graph
  var graph = new noflo.Graph('IFRAME runtime for ' + component);
  graph.baseDir = 'noflo-runtime-iframe';

  // Add the component
  graph.addNode(component, component);

  // Load into a NoFlo network
  noflo.createNetwork(graph, function (network) {
    var instance = network.getNode(component);
    bindProcess(instance.component);
  });

  function bindProcess (process) {
    bindInports(process.inPorts);
    for (port in process.outPorts) {
      bindOutport(port, process.outPorts[port]);
    }
  };

  function bindInports (inPorts) {
    var sockets = {};
    for (port in inPorts) {
      var socket = noflo.internalSocket.createSocket();
      sockets[port] = noflo.internalSocket.createSocket();
      inPorts[port].attach(sockets[port]);
    };
    context.addEventListener('message', function (message) {
      if (message.origin !== origin) {
        return;
      }
      if (!message.data.port || !inPorts[message.data.port]) {
        return;
      }
      if (!message.data.event) {
        return;
      }
      switch (message.data.event) {
        case 'connect':
          sockets[message.data.port].connect();
          break;
        case 'begingroup':
          sockets[message.data.port].beginGroup(message.data.payload);
          break;
        case 'data':
          sockets[message.data.port].send(message.data.payload);
          break;
        case 'endgroup':
          sockets[message.data.port].endGroup();
          break;
        case 'disconnect':
          sockets[message.data.port].disconnect();
          break;
      }
    }, false);
  };

  function bindOutport (name, port) {
    var socket = noflo.internalSocket.createSocket();
    port.attach(socket);
    socket.on('connect', function () {
      send(name, 'connect', null);
    });
    socket.on('begingroup', function (group) {
      send(name, 'data', group);
    });
    socket.on('data', function (data) {
      send(name, 'data', data);
    });
    socket.on('endgroup', function () {
      send(name, 'endgroup', null);
    });
    socket.on('disconnect', function () {
      send(name, 'disconnect', null);
    });
  };

  function send(port, event, payload) {
    context.parent.postMessage({
      node: component,
      port: port,
      event: event,
      payload: payload
    }, context.parent.location.href);
  };
})(window);
