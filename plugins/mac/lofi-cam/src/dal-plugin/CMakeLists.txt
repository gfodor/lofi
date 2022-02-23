# Universal build for Apple Silicon
set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64")

project(mac-dal-plugin)

find_library(APPKIT AppKit)
find_library(COREFOUNDATION CoreFoundation)
find_library(COREVIDEO CoreVideo)
find_library(COREMEDIA CoreMedia)
find_library(COREMEDIAIO CoreMediaIO)
find_library(IOKIT IOKit)

include_directories(${APPKIT}
					${COREFOUNDATION}
					${COREVIDEO}
					${COREMEDIA}
					${COREMEDIAIO}
					${IOSURFACE}
					./
					../common)

set(mac-dal-plugin_HEADERS
	Defines.h
	Logging.h
	LOFIDALPlugInInterface.h
	LOFIDALObjectStore.h
	LOFIDALPlugIn.h
	LOFIDALDevice.h
	LOFIDALStream.h
	CMSampleBufferUtils.h
	LOFIDALMachClient.h
	../common/MachProtocol.h)

set(mac-dal-plugin_SOURCES
	LOFIDALPlugInMain.mm
	LOFIDALPlugInInterface.mm
	LOFIDALObjectStore.mm
	LOFIDALPlugIn.mm
	LOFIDALDevice.mm
	LOFIDALStream.mm
	CMSampleBufferUtils.mm
	LOFIDALMachClient.mm)

add_library(mac-dal-plugin MODULE
	${mac-dal-plugin_SOURCES}
	${mac-dal-plugin_HEADERS})

set_target_properties(mac-dal-plugin PROPERTIES
	FOLDER "plugins"
	BUNDLE TRUE
	OUTPUT_NAME "lofi-cam"
	COMPILE_FLAGS "-std=gnu++14 -stdlib=libc++ -fobjc-arc -fobjc-weak")

if (XCODE)
	set(TARGET_DIR "${CMAKE_CURRENT_BINARY_DIR}/Debug")
else (XCODE)
	set(TARGET_DIR "${CMAKE_CURRENT_BINARY_DIR}")
endif (XCODE)

target_link_libraries(mac-dal-plugin
	${APPKIT}
	${COREFOUNDATION}
	${COREVIDEO}
	${COREMEDIA}
	${COREMEDIAIO}
	${IOKIT})

add_custom_command(TARGET mac-dal-plugin
	POST_BUILD
	COMMAND rm -rf ${TARGET_DIR}/lofi-cam.plugin || true
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${TARGET_DIR}/lofi-cam.bundle ${TARGET_DIR}/lofi-cam.plugin
	COMMENT "Rename bundle to plugin"
)

# Note: Xcode seems to run a command `builtin-infoPlistUtility` to generate the Info.plist, but I'm
# not sure where to find that binary. If we had access to it, the command would look something like:
# builtin-infoPlistUtility ${PROJECT_SOURCE_DIR}/../common/CoreMediaIO/DeviceAbstractionLayer/Devices/Sample/PlugIn/SampleVCam-Info.plist -producttype com.apple.product-type.bundle -expandbuildsettings -platform macosx -o lofi-cam.bundle/Contents/Info.plist
# Instead, just copy in one that was already generated from Xcode.
add_custom_command(TARGET mac-dal-plugin
	POST_BUILD
	COMMAND cp ${PROJECT_SOURCE_DIR}/Info.plist ${TARGET_DIR}/lofi-cam.plugin/Contents/Info.plist
    COMMAND mkdir ${TARGET_DIR}/lofi-cam.plugin/Contents/Resources
    COMMAND cp ${PROJECT_SOURCE_DIR}/placeholder.png ${TARGET_DIR}/lofi-cam.plugin/Contents/Resources/placeholder.png
	COMMAND /usr/bin/plutil -insert CFBundleVersion -string "0.0.1" ${TARGET_DIR}/lofi-cam.plugin/Contents/Info.plist
	COMMAND /usr/bin/plutil -insert CFBundleShortVersionString -string "0.0.1" ${TARGET_DIR}/lofi-cam.plugin/Contents/Info.plist
	DEPENDS {PROJECT_SOURCE_DIR}/Info.plist
	COMMENT "Copy in Info.plist"
)

add_custom_command(TARGET mac-dal-plugin
	POST_BUILD
	COMMAND /usr/bin/codesign --force --deep --sign - --timestamp=none ${TARGET_DIR}/lofi-cam.plugin
	COMMENT "Codesign plugin"
)

add_custom_command(TARGET mac-dal-plugin
	POST_BUILD
	COMMAND mkdir -p ../../build/dal-plugin
	COMMAND rm -rf "../../build/dal-plugin/$<CONFIGURATION>/lofi-cam.plugin" || true
	COMMAND ${CMAKE_COMMAND} -E copy_directory ${TARGET_DIR}/lofi-cam.plugin "../../build/dal-plugin/$<CONFIGURATION>/lofi-cam.plugin"
	COMMENT "Copy plugin to destination"
)
