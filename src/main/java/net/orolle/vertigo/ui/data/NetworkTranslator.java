package net.orolle.vertigo.ui.data;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;

import net.kuujo.vertigo.network.Component;
import net.kuujo.vertigo.network.Input;
import net.kuujo.vertigo.network.Network;
import net.orolle.vertigo.ui.data.jgrapht.JgComponent;
import net.orolle.vertigo.ui.data.jgrapht.JgConnection;
import net.orolle.vertigo.ui.data.jgrapht.JgGraph;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.sockjs.impl.JsonCodec;

public class NetworkTranslator {
  private final JgGraph graph;
  private final HashMap<String, Component<?>> blacklist;
  private final Network network;

  public NetworkTranslator(JgGraph graph) {
    super();
    this.graph = graph;
    this.blacklist = new HashMap<>(graph.vertexSet().size());
    this.network = new Network(graph.name());
  }

  public Network translate(){

    LinkedList<JgComponent> visit = graph.feeders();

    for (JgComponent feeder : visit) {
      LinkedList<JgComponent> queue = new LinkedList<>();
      queue.push(feeder);
      traverse(queue);
    }


    return network;
  }

  private void traverse(LinkedList<JgComponent> queue) {
    if(queue.isEmpty())
      return;

    JgComponent first = queue.get(0);
    JgComponent mid   = queue.size() >= 2? queue.get(1) : null;
    JgComponent last  = queue.size() >= 3? queue.get(2) : null;

    Component<?> first_ = vertigoComponent(first);
    Component<?> mid_   = vertigoComponent(mid);
    Component<?> last_  = vertigoComponent(last);

    if(first_ != null && mid_ != null){
      JgConnection con = graph.getEdge(mid, first);
      first_.addInput(mid.id());
      //.setStream(con.getV1Port()+" -> "+con.getV2Port());
    }else if(first_ != null && mid_ == null && last_ != null){
      JgConnection con = graph.getEdge(last, first);
      //.setStream(con.getV1Port()+" -> "+con.getV2Port())
      grouping(first_.addInput(last.id()), mid);
    }else if(mid_ == null && last_ == null){

    }else{
      //throw new IllegalStateException("UNKNOWN STATE!");
    }

    for (JgConnection con : graph.outConnections(first)) {
      queue.push(con.getV2());
      traverse(queue);
      queue.pop();
    }
  }

  private void grouping(Input input, JgComponent conf) {
    if(!conf.isGrouping())
      throw new IllegalStateException("JgComponent is not a grouping");

    if(conf.component().equals("randomGrouping")){
      input.randomGrouping();
    }else if(conf.component().equals("roundGrouping")){
      input.roundGrouping();
    }else if(conf.component().equals("allGrouping")){
      input.allGrouping();
    }else if(conf.component().equals("fieldsGrouping")){
      Object[] fields = conf.config().asArray().toArray();
      input.fieldsGrouping(Arrays.copyOf(fields, fields.length, String[].class));
    }else{
      throw new IllegalStateException("Grouping "+conf.component()+" as type not known");
    }
  }

  private Component<?> vertigoComponent(JgComponent comp){
    if(comp == null)
      return null;

    if(blacklist.get(comp.id()) == null){
      Component<?> c = null;
      JsonObject config = comp.config().isObject()? comp.config().asObject() : new JsonObject();
      int instances = comp.instances();

      if(comp.isFeeder()){
        c = (Component<?>) network.addFeeder(comp.id(), comp.component(), config, instances);
      }else if(comp.isWorker()){
        c = (Component<?>) network.addWorker(comp.id(), comp.component(), config, instances);
      }else if(comp.isGrouping()) {
        // Grouping is not a Component, but handled here
      }else{
        throw new IllegalStateException(comp.toString()+" is not a worker, feeder, grouping, data");
      }



      if(c != null){
        blacklist.put(comp.id(), c); 
      }
    }
    return blacklist.get(comp.id());
  } 
}
