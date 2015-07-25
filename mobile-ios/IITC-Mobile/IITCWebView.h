//
//  IITCWebView.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <WebKit/WebKit.h>
@class ViewController;
@interface IITCWebView : WKWebView
- (nonnull instancetype)initWithFrame:(CGRect)frame viewController:(ViewController *)viewController;
- (void)loadJS:(NSString *)js;
@end
