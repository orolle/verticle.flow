package net.orolle.vertigo.verticleflow;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class VertigoComponent extends JsonObject {
  private static final long serialVersionUID = -3019602879298434843L;
  private static final String MODULEID = "moduleId", MOD = "mod";

  public static VertigoComponent createComponent(String moduleId, JsonObject mod){
    return new VertigoComponent().mod(mod).moduleId(moduleId);
  }

  public static VertigoComponent createGroupingComponent(String moduleId) {
    JsonObject mod = new JsonObject().putObject("vertigo", new JsonObject()
    .putArray("inputs", new JsonArray().add(createPort("in", "*")))
    .putArray("outputs", new JsonArray().add(createPort("out", "*"))));

    return createComponent(moduleId, mod);
  }

  private static JsonObject createPort(String name, String type){
    return new JsonObject().putString("name", name).putString("type", type);
  }

  private VertigoComponent() {

  }

  public String moduleId(){
    return this.getString(MODULEID);
  }

  public VertigoComponent moduleId(String id){
    this.putString(MODULEID, id);
    return this;
  }

  public JsonObject mod(){
    return this.getObject(MOD);
  }

  public VertigoComponent mod(JsonObject mod){
    this.putObject(MOD, mod);
    return this;
  }

  public boolean isGrouping(){
    return isGrouping(moduleId());
  }
  
  public static boolean isGrouping(String type) {
    switch (type) {
    case "round-robin":
    case "random":
    case "hash":
    case "fair":
    case "all":
      return true;
    default:
      return false;
    }
  }
}
