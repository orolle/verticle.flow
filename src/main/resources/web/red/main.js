/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var RED = function() {

  $('#btn-keyboard-shortcuts').click(function(){showHelp();});

  function hideDropTarget() {
      $("#dropTarget").hide();
      RED.keyboard.remove(/* ESCAPE */ 27);
  }

  $('#chart').on("dragenter",function(event) {
      if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
          $("#dropTarget").css({display:'table'});
          RED.keyboard.add(/* ESCAPE */ 27,hideDropTarget);
      }
  });

  $('#dropTarget').on("dragover",function(event) {
      if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
          event.preventDefault();
      }
  })
  .on("dragleave",function(event) {
      hideDropTarget();
  })
  .on("drop",function(event) {
      var data = event.originalEvent.dataTransfer.getData("text/plain");
      hideDropTarget();
      RED.view.importNodes(data);
      event.preventDefault();
  });


  function save(force) {
    if (RED.view.dirty()) {

      if (!force) {
        var invalid = false;
        var unknownNodes = [];
        RED.nodes.eachNode(function(node) {
                invalid = invalid || !node.valid;
                if (node.type === "unknown") {
                    if (unknownNodes.indexOf(node.name) == -1) {
                        unknownNodes.push(node.name);
                    }
                    invalid = true;
                }
        });
        if (invalid) {
            if (unknownNodes.length > 0) {
                $( "#node-dialog-confirm-deploy-config" ).hide();
                $( "#node-dialog-confirm-deploy-unknown" ).show();
                var list = "<li>"+unknownNodes.join("</li><li>")+"</li>";
                $( "#node-dialog-confirm-deploy-unknown-list" ).html(list);
            } else {
                $( "#node-dialog-confirm-deploy-config" ).show();
                $( "#node-dialog-confirm-deploy-unknown" ).hide();
            }
            $( "#node-dialog-confirm-deploy" ).dialog( "open" );
            return;
        }
      }
      var nns = RED.nodes.createCompleteNodeSet();
      
      $("#btn-icn-deploy").removeClass('icon-upload');
      $("#btn-icn-deploy").addClass('spinner');
      RED.view.dirty(false);
      
      try{
        RED.bus.send('web.in.flows.deploy', nns, function(payload){
          RED.notify("Successfully deployed","success");

          RED.nodes.eachNode(function(node) {
            if (node.changed) {
              node.dirty = true;
              node.changed = false;
            }
          });
          // Once deployed, cannot undo back to a clean state
          RED.history.markAllDirty();
          RED.view.redraw();
          
          $("#btn-icn-deploy").removeClass('spinner');
          $("#btn-icn-deploy").addClass('icon-upload');
        });
      }catch(e){
        RED.notify("Might have lost connection to service. Close this and login again.","error");
      }
    }
  }

  $('#btn-deploy').click(function() { save(); });

  $( "#node-dialog-confirm-deploy" ).dialog({
    title: "confirm deploy",
    modal: true,
    autoopen: false,
    width: 530,
    height: 230,
    buttons: [
      {
          text: "confirm deploy",
          click: function() {
              save(true);
              $( this ).dialog( "close" );
          }
      },
      {
          text: "cancel",
          click: function() {
              $( this ).dialog( "close" );
          }
      }
    ]
  });
  $( "#node-dialog-confirm-deploy" ).dialog( "close" );

  function loadSettings() {
    $.get('settings', function(data) {
            RED.settings = data;
            loadNodes();
    });
  }
  
  function loadNodes() {  
    RED.bus.send("web.in.component.names", {}, function(payload) {
      var requests = payload.length;
      
      for (var i in payload) {
        var name = payload[i];
        
        RED.bus.send("web.in.component.html", {"moduleId": name}, function(payload) {
          $("body").append(payload);
          $(".palette-spinner").hide();
          $(".palette-scroll").show();
          $("#palette-search").show();
          requests--;
          
          if(requests == 0) {
            loadFlows();
          }
        })
      }
    });
  }

  function loadFlows() {
    RED.bus.send("web.in.flows.load", {}, function(payload) {
      RED.nodes.import(payload);
      RED.view.dirty(true);
      RED.view.redraw();
    })
    
    /*
    $.getJSON("flows",function(nodes) {
      RED.nodes.import(nodes);
      RED.view.dirty(false);
      RED.view.redraw();
    });
    */
  }

  function showHelp() {

    var dialog = $('#node-help');

    //$("#node-help").draggable({
    //        handle: ".modal-header"
    //});

    dialog.on('show',function() {
            RED.keyboard.disable();
    });
    dialog.on('hidden',function() {
            RED.keyboard.enable();
    });

    dialog.modal();
  }

  $(function() {
    RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
    
    RED.bus = new vertx.EventBus("http://"+window.location.hostname+":"+window.location.port+"/vertxbus");
    RED.bus.onopen = function(){
      loadSettings();
    };
  });

  return {
  };
}();
