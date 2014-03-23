package net.orolle.vertigo.ui.util;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;

public class Parse {

  public static JsonElement toJson(String str, JsonElement res){
    try {
      return new JsonObject(str);
    } catch (Exception e) {}
    

    try {
      return new JsonArray(str);
    } catch (Exception e) {}
    
    return res;
  }

  public static int toInteger(String data, int i) {
    try {
      return Integer.parseInt(data);
    } catch (Exception e) {
    }
    return i;
  }
  
  
}
