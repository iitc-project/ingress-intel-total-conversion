//
//  JSHandler.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "JSHandler.h"

@interface JSHandler ()

@end
@implementation JSHandler

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    NSDictionary *call = message.body;
    NSString *function = call[@"functionName"];
    
    if ([call[@"args"] isKindOfClass:[NSString class]]) {
        if ([call[@"args"] isEqualToString:@""]) {
            SEL selfSelector = NSSelectorFromString(function);
            if ([self respondsToSelector:selfSelector]) {
                [self performSelector:selfSelector];
            } else {
                NSLog(@"%@ not implemented", function);
            }
        } else {
            SEL selfSelector = NSSelectorFromString([function stringByAppendingString:@":"]);
            if ([self respondsToSelector:selfSelector]) {
                [self performSelector:selfSelector withObject:call[@"args"]];
            } else {
                NSLog(@"%@ not implemented", function);
            }
        }
    } else if ([call[@"args"] isKindOfClass:[NSNumber class]] || [call[@"args"] isKindOfClass:[NSArray class]]) {
        SEL selfSelector = NSSelectorFromString([function stringByAppendingString:@":"]);
        if ([self respondsToSelector:selfSelector]) {
            [self performSelector:selfSelector withObject:call[@"args"]];
        } else {
            NSLog(@"%@ not implemented", function);
        }
    } else {
        NSLog([message.body description]);
    }
}

// open dialog to send geo intent for navigation apps like gmaps or waze etc...

- (void)intentPosLink:(NSArray *)args {
    NSNumber *isPortal = args[4];
    NSString *lat = args[0];
    NSString *lng = args[1];
    
    NSNumber *zoom = args[2];
    
    NSURL *url;
    if ([isPortal boolValue]) {
        url = [NSURL URLWithString:[NSString stringWithFormat:@"https://www.ingress.com/intel?pll=%@,%@&z=%@", lat,lng,zoom]];
    } else {
        url = [NSURL URLWithString:[NSString stringWithFormat:@"https://www.ingress.com/intel?ll=%@,%@&z=%@", lat,lng,zoom]];
    }
    NSURL *locationURL =url = [NSURL URLWithString:[NSString stringWithFormat:@"maps://?ll=%@,%@", lat,lng]];
    
//    NSString *title = args[3];
//
    
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationSharedAction object:self userInfo:@{@"data":@[args[3],  url]}];
//    mIitc.startActivity(ShareActivity.forPosition(mIitc, lat, lng, zoom, title, isPortal));
}

// share a string to the IITC share activity. only uses the share tab.

- (void)shareString:(NSString *) str {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationSharedAction object:self userInfo:@{@"data":@[str]}];
}

// disable javascript injection while spinner is enabled
// prevent the spinner from closing automatically

//- (void) spinnerEnabled:(BOOL) en {
////    mIitc.getWebView().disableJS(en);
//}

// copy link to specific portal to android clipboard

- (void) copy:(NSString *) s {
    UIPasteboard *pb = [UIPasteboard generalPasteboard];
    [pb setString:s];
}

- (void) switchToPane: (NSString *) paneID {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationPaneChanged object:self userInfo:@{@"paneID":paneID}];
}


//- (void) dialogFocused:(NSString *) dialogID {
////    mIitc.setFocusedDialog(id);
//}


//- (void) dialogOpened:(NSString *) dialogID withResult:(BOOL) open {
////    mIitc.dialogOpened(id, open);
//}


- (void) bootFinished {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationBootFinished object:self];
}

// get layers and list them in a dialog

- (void) setLayers: (NSArray *)layers {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationLayersGot object:self userInfo:@{@"layers":layers}];
}

//
//- (void) addPortalHighlighter:( NSString * )name {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            mIitc.getMapSettings().addPortalHighlighter(name);
////        }
////    });
//}
//
//
//- (void) setActiveHighlighter: (NSString *) name {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            mIitc.getMapSettings().setActiveHighlighter(name);
////        }
////    });
//}


//- (void) updateIitc: (NSString *) fileUrl {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.updateIitc(fileUrl);
//        }
//    });
//}


//- (void) addPane( NSString * name,  NSString * label,  NSString * icon) {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.getNavigationHelper().addPane(name, label, icon);
//        }
//    });
//}

// some plugins may have no specific icons...add a default icon

//- (void) addPane( NSString * name,  NSString * label) {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.getNavigationHelper().addPane(name, label, "ic_action_new_event");
//        }
//    });
//}


//- (BOOL) showZoom {
////     PackageManager pm = mIitc.getPackageManager();
////     boolean hasMultitouch = pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN_MULTITOUCH);
////     boolean forcedZoom = mIitc.getPrefs().getBoolean("pref_user_zoom", false);
////    return forcedZoom || !hasMultitouch;
//    return YES;
//}


//- (void) setFollowMode:(BOOL) follow {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            mIitc.getUserLocation().setFollowMode(follow);
////        }
////    });
//}


- (void) setProgress:(NSNumber *) progress {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationProgressChanged object:self userInfo:@{@"data":progress}];
}


//- (NSString *) getFileRequestUrlPrefix {
////    return mIitc.getFileManager().getFileRequestPrefix();
//    return nil;
//}


//- (void) setPermalink:( NSString *) href {
////    mIitc.setPermalink(href);
//}


//- (void) saveFile( NSString * filename,  NSString * type,  NSString * content) {
//    try {
//         File outFile = new File(Environment.getExternalStorageDirectory().getPath() +
//                                      "/IITC_Mobile/export/" + filename);
//        outFile.getParentFile().mkdirs();
//        
//         FileOutputStream outStream = new FileOutputStream(outFile);
//        outStream.write(content.getBytes("UTF-8"));
//        outStream.close();
//        Toast.makeText(mIitc, "File exported to " + outFile.getPath(), Toast.LENGTH_SHORT).show();
//    } catch ( IOException e) {
//        e.printStackTrace();
//    }
//}


- (void) reloadIITC {
    [[NSNotificationCenter defaultCenter] postNotificationName:JSNotificationReloadRequired object:self userInfo:nil];
}


//- (void) reloadIITC:(BOOL) clearCache {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            if (clearCache) mIitc.getWebView().clearCache(true);
////            mIitc.reloadIITC();
////        }
////    });
//}

@end
