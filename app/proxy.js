"use strict";
/*jslint devel: true, node: true, sloppy: false, vars: true, white: true, nomen: true, plusplus: true, maxerr: 1000, maxlen: 80, indent: 2 */
var minode = require("minode");
var minsock = minode.socket;
var dns = minode.dns;
var sock = new minsock.TCP();
var backendHost = process.env.BACKEND_HOST || "www.google.com";
var backendPort = parseInt(process.env.BACKEND_PORT || "80", 10);
var proxyPort = parseInt(process.env.PROXY_PORT || "80", 10);
var proxyHost = process.env.PROXY_HOST || "127.0.0.1";
function Proxy() {
  var _peer;
  function onBackendError(err) {
    console.error(err);
  }
  function onBackendClose() {
    if (!_peer.closed) _peer.kill();
    _peer.backend.closed = true;
  }
  function onBackendRead(buf, start, len) {
    var peer = _peer;
    if (!buf) return peer.backend.kill();
    if (peer && !peer.closed) {
      return peer.send(buf.slice(start, start + len), onSend, onSend);
    }
    peer.backend.kill();
  }
  function onBackendSend(st) {
    if (st !== 0) return _peer.backend.kill();
  }
  function onBackendConnect(st, backend) {
    var peer = _peer;
    peer.backend = backend;
    minsock.Create(backend);
    backend.setNoDelay(true);
    backend.onerror = onBackendError;
    backend.onclose = onBackendClose;
    backend.onread = onBackendRead;
    backend.readStart();
    if (peer.buffers && peer.buffers.length > 0) {
      if (backend.closed) return;
      backend.send(peer.buffers, onBackendSend);
      peer.buffers = null;
    }
    peer.readStart();
  }
  function onLookup(err, addresses) {
    if (err) return _peer.kill();
    var client = new minsock.TCP();
    var r = client.connect(addresses[0], backendPort);
    r.oncomplete = onBackendConnect;
  }
  function onSend(st) {
    if (st !== 0) return _peer.kill();
  }
  function onRead(buf, start, len) {
    var peer = _peer;
    var b;
    if (!buf) return peer.kill();
    if (peer.backend && !peer.backend.closed) {
      peer.backend.send(buf.slice(start, start + len), onBackendSend);
    } else {
      b = new Buffer(len);
      buf.copy(b, 0, start, start + len);
      if (!peer.buffers) {
        peer.buffers = [b];
      } else {
        peer.buffers.push(b);
      }
    }
  }
  function onClose() {
    if (_peer.backend && !_peer.backend.closed) _peer.backend.kill();
    _peer.closed = true;
  }
  function onError(err) {
    console.error(err);
  }
  function start(peer) {
    _peer = peer;
    minsock.Create(peer);
    peer.setNoDelay(true);
    dns.lookup(backendHost, onLookup);
    peer.onread = onRead;
    peer.onclose = onClose;
    peer.onerror = onError;
    peer.readStart();
  }
  this.start = start;
}
function onConnection(peer) {
  var proxy = new Proxy();
  proxy.start(peer);
}
sock.bind(proxyHost, proxyPort);
sock.onconnection = onConnection;
sock.listen(128);