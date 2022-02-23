#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

#define MACH_SERVICE_NAME "com.ostn.lofi-cam.server"

typedef enum {
    //! Initial connect message sent from the client to the server to initiate a connection
    MachMsgIdConnect = 1,
    //! Message containing data for a frame
    MachMsgIdFrame = 2,
    //! Indicates the server is going to stop sending frames
    MachMsgIdStop = 3,
} MachMsgId;

@interface Server : NSObject

- (void)run;

- (void)sendFrameWithSize:(NSSize)size
        timestamp:(uint64_t)timestamp
        fpsNumerator:(uint32_t)fpsNumerator
        fpsDenominator:(uint32_t)fpsDenominator
        frameBytes:(uint8_t *)frameBytes;

- (void)stop;

@end

NS_ASSUME_NONNULL_END
