package net.orolle.vertigo.ui.data.jgrapht;

import net.orolle.vertigo.ui.data.FbpVertigo;

import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;

public class JgComponent {

  private final JsonObject obj;

  public JgComponent(JsonObject obj) {
    super();
    this.obj = obj;
    
    if(!obj.containsField("config"))
      obj.putElement("config", new JsonObject());
    
    if(!obj.containsField("config"))
      obj.putNumber("instances", 1);
  }

  public String id(){
    return obj.getString("id");
  }

  public String component(){
    return obj.getString("component");
  }

  public JsonElement config(){
    return obj.getElement("config", new JsonObject());
  }

  public JgComponent config(JsonElement config){
    obj.putElement("config", config);
    return this;
  }
  
  public JsonObject metadata(){
    return obj.getObject("metadata");
  }

  public JgComponent metadata(JsonObject metadata){
    obj.putObject("metadata", metadata);
    return this;
  }
  
  public int instances(){
    return obj.getInteger("instances", 1);
  }

  public JgComponent instances(int instances){
    obj.putNumber("instances", instances);
    return this;
  }
  
  public JsonObject toJson(){
    return this.obj.copy();
  }


  @Override
  public int hashCode() {
    return id().hashCode();
  }

  public boolean isFeeder(){
    return obj.getString("component","").toLowerCase().contains("feeder");
  }

  public boolean isWorker(){
    return obj.getString("component","").toLowerCase().contains("worker");
  }
  
  public boolean isComponent(){
    return !isGrouping();
  }

  public boolean isGrouping(){
    return FbpVertigo.isGrouping(obj.getString("component",""));
  }

  @Override
  public String toString() {
    return "[JgComponent: "+this.obj.encode()+"]";
  }
}
