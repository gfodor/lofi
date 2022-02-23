{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "src/addon/macos/main.mm" ],
      "cflags!": [ "-ObjC++" ],
      "cflags_cc!": [ "-ObjC++" ]
    }
  ]
}
