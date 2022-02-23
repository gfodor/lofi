#import <Foundation/Foundation.h>
#include <node.h>
#include <stdio.h>
#include "Server.h"

using namespace v8;

char const *emptyString = "";
static Server *server = nil;

void SendFrame(const FunctionCallbackInfo<Value>& args) {
    if (server == nil) return;

    Isolate* isolate = args.GetIsolate();
    Local<v8::Context> context = isolate->GetCurrentContext();

    if (!args[0]->IsNumber()) { // width
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 0, expected number width")));
        return;
    }

    if (!args[1]->IsNumber()) { // height
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 1, expected number height")));
        return;
    }

    if (!args[2]->IsBigInt()) { // timestamp
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 2, expected bigint timestamp")));
        return;
    }

    if (!args[3]->IsNumber()) { // fps numerator
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 3, expected number fps numerator")));
        return;
    }

    if (!args[4]->IsNumber()) { // fps numerator
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 4, expected number fps denominator")));
        return;
    }

    if (!args[5]->IsArrayBuffer()) { // buffer
        isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8Literal(isolate, "Wrong arguments 5, expected frame buffer")));
        return;
    }

    bool *lossless = nullptr;

    NSSize size = CGSizeMake(args[0]->NumberValue(context).FromJust(), args[1]->NumberValue(context).FromJust());
    uint64_t timestamp = args[2]->ToBigInt(context).ToLocalChecked()->Uint64Value(lossless);
    uint32_t numerator = args[3]->Uint32Value(context).FromJust();
    uint32_t denominator = args[4]->Uint32Value(context).FromJust();

    if (server != nil) {
        NSLog(@"Got values size=%f %f timestamp=%lld num=%d denom=%d", size.width, size.height, timestamp, numerator, denominator);
    }

    //- (void)sendFrameWithSize:(NSSize)size
    //timestamp:(uint64_t)timestamp
    //fpsNumerator:(uint32_t)fpsNumerator
    //fpsDenominator:(uint32_t)fpsDenominator
    //frameBytes:(uint8_t *)frameBytes;
}

void StartServer(const FunctionCallbackInfo<Value>& args) {
    //[[NSAutoreleasePool alloc] init]; // Set this up so Cocoa works

    //Isolate* isolate = args.GetIsolate(); // Setup for Javascript Connection
    //Local<v8::Context> context = isolate->GetCurrentContext();
    //Local<String> keyTitle = String::NewFromUtf8(isolate, "title").ToLocalChecked();

    //Local<Array> jsSongsArr = Array::New(isolate, 1); // Create Array for Javascript v8 engine
    //Local<Object> jsSong = Object::New(isolate); // Create Javascript Object
    //jsSong->Set(context, keyTitle, String::NewFromUtf8(isolate, "2foobar").ToLocalChecked()).FromJust(); // Copy data in Javascript Object
    //jsSongsArr->Set(context, 0, jsSong).FromJust(); // Add the Object to Javascript Array

    server = [[Server alloc] init];
    [server run];

    args.GetReturnValue().Set(true); // Set the return value of the function
}

void StopServer(const FunctionCallbackInfo<Value>& args) {
    //[[NSAutoreleasePool alloc] init]; // Set this up so Cocoa works

    //Isolate* isolate = args.GetIsolate(); // Setup for Javascript Connection
    //Local<v8::Context> context = isolate->GetCurrentContext();
    //Local<String> keyTitle = String::NewFromUtf8(isolate, "title").ToLocalChecked();

    //Local<Array> jsSongsArr = Array::New(isolate, 1); // Create Array for Javascript v8 engine
    //Local<Object> jsSong = Object::New(isolate); // Create Javascript Object
    //jsSong->Set(context, keyTitle, String::NewFromUtf8(isolate, "2foobar").ToLocalChecked()).FromJust(); // Copy data in Javascript Object
    //jsSongsArr->Set(context, 0, jsSong).FromJust(); // Add the Object to Javascript Array

    if (server != nil) {
        [server stop];
    }

    args.GetReturnValue().Set(true); // Set the return value of the function
}

void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "startServer", StartServer);
    NODE_SET_METHOD(exports, "stopServer", StopServer);
    NODE_SET_METHOD(exports, "sendFrame", SendFrame);
}

NODE_MODULE(addon, Initialize) // Inits a native node module