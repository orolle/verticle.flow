package net.orolle.vertigo.ui.data.jgrapht;

import net.orolle.vertigo.ui.data.FbpVertigo;

import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;

public class JgComponent {

  private final JsonObject obj;
  
  private JsonElement config = new JsonObject();
  private int      instances = 1;

  public JgComponent(JsonObject obj) {
    super();
    this.obj = obj;
  }

  public String id(){
    return obj.getString("id");
  }

  public String component(){
    return obj.getString("component");
  }

  public JsonElement config(){
    return config;
  }

  public JgComponent config(JsonElement config){
    this.config = config;
    return this;
  }
  
  public int instances(){
    return instances;
  }

  public JgComponent instances(int instances){
    this.instances = instances;
    return this;
  }

  @Override
  public int hashCode() {
    return obj.getString("id").hashCode();
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
