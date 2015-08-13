//
//  IITCWebView.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <WebKit/WebKit.h>

@interface IITCWebView : WKWebView
- (instancetype)initWithFrame:(CGRect)frame;
- (void)loadScripts;
- (void)loadJS:(NSString *)js;
@end
