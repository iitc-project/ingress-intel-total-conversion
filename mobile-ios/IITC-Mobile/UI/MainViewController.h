//
//  ViewController.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@class IITCWebView;

@interface MainViewController : UIViewController <WKUIDelegate, UIPopoverControllerDelegate>
+ (instancetype)sharedInstance;

@property(strong, nonatomic) IITCWebView *webView;

- (void)switchToPane:(NSString *)pane;
@end

