//
//  JSHandler.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "JSHandler.h"
#import "ViewController.h"

@interface JSHandler ()
@property (weak) ViewController *viewController;
@end
@implementation JSHandler

- (instancetype)initWithCallback:(ViewController *)viewController {
    self = [super init];
    if (self) {
        self.viewController = viewController;
    }
    return self;
}

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

//- (void)intentPosLink(
//                           double lat,  double lng,  int zoom,  NSString * title,  boolean isPortal) {
//    mIitc.startActivity(ShareActivity.forPosition(mIitc, lat, lng, zoom, title, isPortal));
//}

// share a string to the IITC share activity. only uses the share tab.

- (void)shareString:(NSString *) str {
//    mIitc.startActivity(ShareActivity.forString(mIitc, str));
}

// disable javascript injection while spinner is enabled
// prevent the spinner from closing automatically

- (void) spinnerEnabled:(BOOL) en {
//    mIitc.getWebView().disableJS(en);
}

// copy link to specific portal to android clipboard

- (void) copy:(NSString *) s {
//     ClipboardManager clipboard = (ClipboardManager) mIitc.getSystemService(Context.CLIPBOARD_SERVICE);
//     ClipData clip = ClipData.newPlainText("Copied Text ", s);
//    clipboard.setPrimaryClip(clip);
//    Toast.makeText(mIitc, "copied to clipboard", Toast.LENGTH_SHORT).show();
}


//- (int) getVersionCode {
//    int versionCode = 0;
////    try {
////         PackageInfo pInfo = mIitc.getPackageManager().getPackageInfo(mIitc.getPackageName(), 0);
////        versionCode = pInfo.versionCode;
////    } catch ( PackageManager.NameNotFoundException e) {
////        Log.w(e);
////    }
//    return versionCode;
//}


//- (NSString *) getVersionName {
//    NSString * buildVersion = @"unknown";
////     PackageManager pm = mIitc.getPackageManager();
////    try {
////         PackageInfo info = pm.getPackageInfo(mIitc.getPackageName(), 0);
////        buildVersion = info.versionName;
////    } catch ( PackageManager.NameNotFoundException e) {
////        Log.w(e);
////    }
//    return buildVersion;
//}


- (void) switchToPane: (NSString *) paneID {
    NSLog(@"paneID:%@", paneID);
    [self.viewController setCurrentPane:paneID];
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            Pane pane;
//            try {
//                pane = mIitc.getNavigationHelper().getPane(paneID);
//            } catch ( IllegalArgumentException e) {
//                pane = Pane.MAP;
//            }
//            
//            mIitc.setCurrentPane(pane);
//        }
//    });
}


- (void) dialogFocused:(NSString *) dialogID {
//    mIitc.setFocusedDialog(id);
}


- (void) dialogOpened:(NSString *) dialogID withResult:(BOOL) open {
//    mIitc.dialogOpened(id, open);
}


- (void) bootFinished {
    [self.viewController bootFinished];
//    Log.d("...boot finished");
//    
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.setLoadingState(false);
//            
//            mIitc.getMapSettings().onBootFinished();
//        }
//    });
}

// get layers and list them in a dialog

- (void) setLayers: (NSArray *)layers {
    NSLog([layers description]);
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.getMapSettings().setLayers(base_layer, overlay_layer);
//        }
//    });
}


- (void) addPortalHighlighter:( NSString * )name {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.getMapSettings().addPortalHighlighter(name);
//        }
//    });
}


- (void) setActiveHighlighter: (NSString *) name {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.getMapSettings().setActiveHighlighter(name);
//        }
//    });
}


- (void) updateIitc: (NSString *) fileUrl {
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            mIitc.updateIitc(fileUrl);
//        }
//    });
}


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


- (BOOL) showZoom {
//     PackageManager pm = mIitc.getPackageManager();
//     boolean hasMultitouch = pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN_MULTITOUCH);
//     boolean forcedZoom = mIitc.getPrefs().getBoolean("pref_user_zoom", false);
//    return forcedZoom || !hasMultitouch;
    return YES;
}


//- (void) setFollowMode:(BOOL) follow {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            mIitc.getUserLocation().setFollowMode(follow);
////        }
////    });
//}


- (void) setProgress:(NSNumber *) progress {
    NSLog(@"progress:%f", [progress doubleValue]);
//    mIitc.runOnUiThread(new Runnable() {
//        @Override
//        - (void) run() {
//            try {
//                if (progress != -1) {
//                    // maximum for setProgress is 10,000
//                    mIitc.setProgressBarIndeterminate(false);
//                    mIitc.setProgress((int) Math.round(progress * 10000));
//                }
//                else {
//                    mIitc.setProgressBarIndeterminate(true);
//                    mIitc.setProgress(1);
//                }
//            } catch(NullPointerException e) {
//                // for some reason, setProgressBarIndeterminate throws a NullPointerException on some devices
//                e.printStackTrace();
//                mIitc.setProgress(10000); // hide the progress bar
//            }
//        }
//    });
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


//- (void) reloadIITC {
////    mIitc.runOnUiThread(new Runnable() {
////        @Override
////        - (void) run() {
////            mIitc.reloadIITC();
////        }
////    });
//}


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
