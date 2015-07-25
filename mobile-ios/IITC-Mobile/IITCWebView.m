//
//  IITCWebView.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "IITCWebView.h"
#import "JSHandler.h"

@implementation IITCWebView

- (nonnull instancetype)initWithFrame:(CGRect)frame viewController:(ViewController *)viewController{
    WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
    JSHandler *handler = [[JSHandler alloc] initWithCallback:viewController];
    [configuration.userContentController addScriptMessageHandler:handler name:@"ios"];
    NSError *error;
    NSString *path = [[NSBundle mainBundle] pathForResource:@"ios-hooks" ofType:@"js"];
    NSString *js = [NSString stringWithContentsOfFile:path encoding:NSASCIIStringEncoding error:&error];
    [configuration.userContentController addUserScript:[[WKUserScript alloc] initWithSource:js injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES]];
    path = [[NSBundle mainBundle] pathForResource:@"total-conversion-build.user" ofType:@"js"];
    js = [NSString stringWithContentsOfFile:path encoding:NSASCIIStringEncoding error:&error];
    [configuration.userContentController addUserScript:[[WKUserScript alloc] initWithSource:js injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES]];
    path = [[NSBundle mainBundle] pathForResource:@"user-location.user" ofType:@"js"];
    js = [NSString stringWithContentsOfFile:path encoding:NSASCIIStringEncoding error:&error];
    [configuration.userContentController addUserScript:[[WKUserScript alloc] initWithSource:js injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:YES]];
    self = [super initWithFrame:frame configuration:configuration];
    if (self) {

    }
    return self;
}
/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
}
*/

- (void)loadJS:(NSString *)js {
    [self evaluateJavaScript:js completionHandler:^(id result, NSError * error) {
        if (error) {
            NSLog([error description]);
        }
    }];
}

@end
