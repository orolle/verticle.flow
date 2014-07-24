package net.orolle.vertigo.ui.util;

import java.util.List;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonElement;

public class Tool {
  
  public static JsonArray listToJson(List<?> in){
    JsonArray out = new JsonArray();
    
    for (Object object : in) {
      if (object instanceof String) {
        String s = (String) object;
        out.addString(s);        
      } else if (object instanceof JsonElement) {
        JsonElement json = (JsonElement) object;
        out.addElement(json);
      } else if (object instanceof Number) {
        Number n = (Number) object;
        out.addNumber(n);
      } else if (object instanceof Boolean) {
        Boolean b = (Boolean) object;
        out.addBoolean(b);
      } else if (object instanceof byte[]) {
        byte[] b = (byte[]) object;
        out.addBinary(b);
      } else {
        throw new IllegalStateException("Type "+object.getClass().getCanonicalName()+" not supported!");
      }
    }
    
    return out;
  }
}
