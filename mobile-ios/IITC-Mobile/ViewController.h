//
//  ViewController.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
@protocol WKUIDelegate;
@class IITCWebView;

@interface ViewController : UIViewController<WKUIDelegate>
- (void)bootFinished;
@property (strong, nonatomic) IITCWebView *webView;
- (void)switchToPane:(NSString *)pane;
- (void)setCurrentPane:(NSString *)pane;
@end

