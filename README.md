# This README is out dated!!!
updated version is coming

# Vertigo UI

This project allows to model and monitor vertigo networks 
(https://github.com/kuujo/vertigo) in a browser and is
based on noflo-ui and the flow based network protocol 
(both in early development).

In the web folder is the noflo-ui (project: https://github.com/noflo/noflo-ui).
The noflo-ui project readme is important if you have not installed node.js and npm.
It was modified to be able to work with vert.x and some bugs where solved.

## Build and execute
If you habe modified the noflo-ui in web folder (esp. the coffee script files!)
use the command "grunt build" to rebuild the noflo-ui.

The Vertigo UI backend provides a webserver for static files 
and a websocket service for the fbp network protocol. The protocol is for
communication between the noflo-ui and Vertigo UI backend. The Vertigo UI than 
communicates with vertigo.

To rebuild the Vertigo UI backend use the command "mvn integration-test".
For executing the backend use "mvn vertx:runMod".

## Tutorial - Build a vertigo network
After executing the Vertigo UI backend open your chrome browser. 
I have problems with using the firefox browser. 
Type in "http://localhost:3111/index.html" for opening the noflo-ui.

Click on create in the "New project" box. As project name enter 
"my-first-vertigo-ui-project" and use "My First Vertigo Project" 
as project label. Select as Primary Type "noflo-vertigo" (critical step!). 
Than click create.

A black empty view with small white dots should have opened. 
In the right top corner click on "Select runtime" and 
than click on the box containing "ws://localhost:3111/fbpnp". 
This address is the websocket noflo-ui uses to communicate with the Vertigo UI 
backend (critical step!).

In the top left corner is a search box containing "First Vertigo Pr...". 
Click on it.
Enter "feeder". A result list should pop up containing a element "FEEDER". 
Click on this element. A component should added to the black background named
"Feeder".

Repeat that but enter "worker" and add the WORKER. 
Than connect FEEDER and WORKER through dragging the out port of the FEEDER 
to the in port of the WORKER.

You have created your first vertigo network with Vertigo UI. 

## Tutorial - Create Components
You can create components. Click on the bar on the left side.
Than click on the create button in the "new component" box.
Enter a name and script for that component.
If you created a component be sure that you added
source code (1 whitespace is enough) to that component. 
After that the component is available in the search. Over the search you add
the component to your graph. 

## Misc and delete projects 
Right click on the components and edges for more options.

If you clean up your browser cache, you delete all the projects stored in the ui.
Projects are stored locally, not in the backend (atm).


