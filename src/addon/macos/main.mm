#import <Foundation/Foundation.h>
#include <node.h>
#include <stdio.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Array;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Integer;

char const *emptyString = "";

void Method(const FunctionCallbackInfo<Value>& args) {
    [[NSAutoreleasePool alloc] init]; // Set this up so Cocoa works

    Isolate* isolate = args.GetIsolate(); // Setup for Javascript Connection
    Local<v8::Context> context = isolate->GetCurrentContext();
    Local<String> keyTitle = String::NewFromUtf8(isolate, "title").ToLocalChecked();

    Local<Array> jsSongsArr = Array::New(isolate, 1); // Create Array for Javascript v8 engine
    Local<Object> jsSong = Object::New(isolate); // Create Javascript Object
    jsSong->Set(context, keyTitle, String::NewFromUtf8(isolate, "foobar").ToLocalChecked()).FromJust(); // Copy data in Javascript Object
    jsSongsArr->Set(context, 0, jsSong).FromJust(); // Add the Object to Javascript Array

    args.GetReturnValue().Set(jsSongsArr); // Set the return value of the function
}

void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "testCall", Method); // Tells node which function to use
}

NODE_MODULE(addon, Initialize) // Inits a native node module

}
