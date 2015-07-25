//
//  ViewController.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "ViewController.h"
#import <WebKit/WebKit.h>
#import "IITCWebView.h"
#import "IITCLocation.h"

@interface ViewController ()
@property IITCLocation *location;
@property (strong, nonatomic) UIProgressView *progressView;
@property (strong) NSMutableArray *backPane;
@property BOOL backButtonPressed;
@property NSString *currentPane;
@end

@implementation ViewController
@synthesize webView;
@synthesize progressView;
- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    self.backPane = [[NSMutableArray alloc] init];
    self.currentPane = @"map";
    
    self.location = [[IITCLocation alloc] initWithCallback:self];
    self.webView = [[IITCWebView alloc] initWithFrame:CGRectZero viewController:self];
    self.webView.UIDelegate = self;
    self.progressView = [[UIProgressView alloc] initWithFrame:CGRectZero];
    self.webView.translatesAutoresizingMaskIntoConstraints = NO;
    self.progressView.translatesAutoresizingMaskIntoConstraints = NO;
    NSMutableArray *constraits = [[NSMutableArray alloc] init];
    
    [self.view addSubview:self.webView];
    [self.view addSubview:self.progressView];

    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[webView]-0-|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(webView)]];
    id topGuide = self.topLayoutGuide;
    id bottomGuide = self.bottomLayoutGuide;
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|[topGuide]-0-[webView]-0-[bottomGuide]|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(topGuide, webView, bottomGuide)]];
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[progressView]-0-|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(progressView)]];
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|[topGuide]-0-[progressView]" options:0 metrics:nil views:NSDictionaryOfVariableBindings(topGuide, progressView)]];
    [self.view addConstraints:constraits];
    [self.progressView setProgress:0.8];
    self.webView.backgroundColor = [UIColor blackColor];
    
    [self.webView addObserver:self forKeyPath:@"loading" options:NSKeyValueObservingOptionNew context:nil];
    [self.webView addObserver:self forKeyPath:@"estimatedProgress" options:NSKeyValueObservingOptionNew context:NULL];
    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"https://www.ingress.com/intel?vp=m"]]];

}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}



- (void)observeValueForKeyPath:(nullable NSString *)keyPath ofObject:(nullable id)object change:(nullable NSDictionary *)change context:(nullable void *)context {
    if ([keyPath isEqualToString: @"loading"]) {
    }
    else {
        [self.progressView setProgress:self.webView.estimatedProgress animated:YES];
    }
}

//- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
//{
//    //WebView.frame=[[UIScreen mainScreen] bounds];
//}


- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler
{
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:message
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    [alertController addAction:[UIAlertAction actionWithTitle:@"OK"
                                                        style:UIAlertActionStyleCancel
                                                      handler:^(UIAlertAction *action) {
                                                          completionHandler();
                                                      }]];
    [self presentViewController:alertController animated:YES completion:^{}];
}

- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString *))completionHandler {
    
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:prompt message:webView.URL.host preferredStyle:UIAlertControllerStyleAlert];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.text = defaultText;
    }];
    
    [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil) style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
        NSString *input = ((UITextField *)alertController.textFields.firstObject).text;
        completionHandler(input);
    }]];
    
    [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"Cancel", nil) style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
        completionHandler(nil);
    }]];
    [self presentViewController:alertController animated:YES completion:nil];
}

- (void)bootFinished {
    [self.location startUpdate];
}

- (void)switchToPane:(NSString *)pane {
    [self.webView loadJS:[NSString stringWithFormat:@"window.show('%@')", pane]];
}

- (void)backButtonPressed:(id)aa {
    if ([self.backPane count]) {
        NSString * pane = [self.backPane lastObject];
        [self.backPane removeLastObject];
        [self switchToPane:pane];
        self.backButtonPressed = true;
    }
    if (![self.backPane count]) {
        self.navigationItem.rightBarButtonItem=nil;
    }
}

-(void)setCurrentPane:(NSString *)pane {
    if ([pane isEqualToString:self.currentPane]) return;
    
    // map pane is top-lvl. clear stack.
    if ([pane isEqualToString:@"map"]) {
        self.backPane.removeAllObjects;
    }
    // don't push current pane to backstack if this method was called via back button
    else if (!self.backButtonPressed) {
        [self.backPane addObject:self.currentPane];
        self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"back" style:UIBarButtonItemStyleDone target:self action:@selector(backButtonPressed:)];;
    }
    
    self.backButtonPressed = NO;
    _currentPane = pane;
}

@end
