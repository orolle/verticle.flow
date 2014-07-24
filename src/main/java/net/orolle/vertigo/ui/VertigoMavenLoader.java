package net.orolle.vertigo.ui;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class VertigoMavenLoader {
  private final Vertx vertx;
  private final String mavenPath, template;
  private final List<VertigoComponent> components = new ArrayList<>();
  
  public VertigoMavenLoader(Vertx v, String mavenPath) {
    this.vertx = v;
    this.mavenPath = mavenPath;
    this.template = vertx.fileSystem().readFileSync("node-red-component-template").toString();
  }
  
  public List<String> getComponentNames() {
    List<String> names = new ArrayList<>();
    
    for (VertigoComponent c : this.components) {
      names.add(c.moduleId());
    }
    
    return names;
  }
  
  public String getComponentHtml(String name) {
    if(name == null){
      return null;
    }
    
   for (VertigoComponent c : components) {
     if(c.moduleId().equals(name)) {
       return createComponentCode(c);
     }
   }
   
   return null;
  }
  
  private String createComponentCode(VertigoComponent comp) {    
    return this.template.replace("\"component\"", "\""+ comp.moduleId() +"\"")
        .replace("\"<INPUTS>\"", createInputPorts(comp))
        .replace("\"<OUTPUTS>\"", createOutputPorts(comp));
  }

  private String createInputPorts(VertigoComponent comp) {
    return comp.mod().getObject("vertigo", new JsonObject()).getArray("inputs", new JsonArray()).encode();
  }
  
  private String createOutputPorts(VertigoComponent comp) {
    return comp.mod().getObject("vertigo", new JsonObject()).getArray("outputs", new JsonArray()).encode();
  }

  
  public VertigoMavenLoader reload() {
    components.clear();
    
    this.components.add(VertigoComponent.createGroupingComponent("round-robin"));
    this.components.add(VertigoComponent.createGroupingComponent("random"));
    this.components.add(VertigoComponent.createGroupingComponent("hash"));
    this.components.add(VertigoComponent.createGroupingComponent("fair"));
    this.components.add(VertigoComponent.createGroupingComponent("all"));
    
    loadLocalMavenComponents(mavenPath);
    
    return this;
  }
  
  private void loadLocalMavenComponents(String path) {
    if(new File(path).isDirectory()){
      // Directory
      vertx.fileSystem().readDir(path, new Handler<AsyncResult<String[]>>() {
        @Override
        public void handle(AsyncResult<String[]> event) {
          if(event.succeeded()) {
            for (String sub : event.result()) {
              loadLocalMavenComponents(sub);
            }
          }
        }
      });
    } else {
      // File
      if(new File(path).getName().endsWith("-mod.zip")) {
        String moduleId = moduleId(path);
        JsonObject mod = extractModJson(new File(path));
        
        if(mod.getObject("vertigo") != null){
          this.components.add(VertigoComponent.createComponent(moduleId, mod));
        }
      }
    }
  }

  private String moduleId(String path) {
    path = path.split(System.getProperty("user.home")+File.separator+".m2"+File.separator+"repository"+File.separator)[1];
    String[] segment = path.split(File.separator);

    String version = segment[segment.length-2];
    String name = segment[segment.length-3];

    String owner = ""; 
    for (int i = 0; i < segment.length-3; i++) {
      owner += (i==0? "" : ".") + segment[i];
    }

    return owner+"~"+name+"~"+version;
  }

  /**
   * DANGER! NO ASYNC FILE OPEN & CLOSE
   * 
   * @param file
   * @return
   */
  private JsonObject extractModJson(File file) {
    try {
      ZipInputStream zin = new ZipInputStream(new FileInputStream(file));

      ZipEntry ze = null;
      while ((ze = zin.getNextEntry()) != null) {
        if (ze.getName().equals("mod.json")) {
          StringBuffer raw = new StringBuffer();
          byte[] buffer = new byte[8192];
          int len;
          while ((len = zin.read(buffer)) != -1) {
            for (int i = 0; i < len; i++) {
              raw.append((char)buffer[i]);
            }
          }
          zin.close();
          return new JsonObject(raw.toString());
        }
      }
      zin.close();
    } catch (FileNotFoundException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } catch (IOException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } 

    return null;
  }
}
