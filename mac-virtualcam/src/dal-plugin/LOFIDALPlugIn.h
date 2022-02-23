//
//  PlugIn.h
//  obs-mac-virtualcam
//  lofi-cam
//
//  Created by John Boiles  on 4/9/20.
//  Modified by Greg Fodor  on 2/2/22.
//
//  obs-mac-virtualcam is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 2 of the License, or
//  (at your option) any later version.
//
//  obs-mac-virtualcam is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with obs-mac-virtualcam. If not, see <http://www.gnu.org/licenses/>.

#import "LOFIDALObjectStore.h"
#import "LOFIDALMachClient.h"
#import "LOFIDALStream.h"

#define kTestCardWidthKey @"lofi-cam-test-card-width"
#define kTestCardHeightKey @"lofi-cam-test-card-height"
#define kTestCardFPSKey @"lofi-cam-test-card-fps"

NS_ASSUME_NONNULL_BEGIN

@interface LOFIDALPlugin : NSObject <CMIOObject>

@property CMIOObjectID objectId;
@property (readonly) LOFIDALMachClient *machClient;
@property LOFIDALStream *stream;

+ (LOFIDALPlugin *)SharedPlugIn;

- (void)initialize;

- (void)teardown;

- (void)startStream;

- (void)stopStream;

@end

NS_ASSUME_NONNULL_END
