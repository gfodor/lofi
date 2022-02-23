//
//  MachProtocol.m
//  obs-mac-virtualcam
//
//  Created by John Boiles  on 5/5/20.
//  Modified by Greg Fodor  on 2/2/22.
//

#define MACH_SERVICE_NAME "com.ostn.lofi-cam.server"

typedef enum {
	//! Initial connect message sent from the client to the server to initate a connection
	MachMsgIdConnect = 1,
	//! Message containing data for a frame
	MachMsgIdFrame = 2,
	//! Indicates the server is going to stop sending frames
	MachMsgIdStop = 3,
} MachMsgId;
