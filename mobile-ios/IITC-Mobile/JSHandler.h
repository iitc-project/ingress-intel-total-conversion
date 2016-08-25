//
//  JSHandler.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

static NSString *const JSNotificationLayersGot = @"JSNotificationLayersGot";
static NSString *const JSNotificationPaneChanged = @"JSNotificationPaneChanged";
static NSString *const JSNotificationBootFinished = @"JSNotificationBootFinished";
static NSString *const JSNotificationReloadRequired = @"JSNotificationReloadRequired";
static NSString *const JSNotificationSharedAction = @"JSNotificationSharedAction";
static NSString *const JSNotificationProgressChanged = @"JSNotificationProgressChanged";
@interface JSHandler : NSObject<WKScriptMessageHandler>

@end
