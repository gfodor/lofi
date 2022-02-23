{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "src/addon/macos/main.mm", "src/addon/macos/Server.h", "src/addon/macos/Server.mm" ],
      "cflags!": [ "-ObjC++" ],
      "cflags_cc!": [ "-ObjC++" ]
    }
  ]
}
