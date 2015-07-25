//
//  JSHandler.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
@class ViewController;
@interface JSHandler : NSObject<WKScriptMessageHandler>
- (instancetype)initWithCallback:(ViewController *)viewController;

@end
