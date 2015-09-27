//
//  ViewController.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "MainViewController.h"
#import "LayersTableViewController.h"
#import "IITCWebView.h"
#import "IITCLocation.h"
#import "JSHandler.h"
#import "SettingsViewController.h"
#import "IITC_Mobile-Swift.h"

static MainViewController *_viewController;

@interface MainViewController ()
@property IITCLocation *location;
@property(strong, nonatomic) UIProgressView *webProgressView;
@property(strong) UIBarButtonItem *backButton;
@property(strong) NSMutableArray *backPane;
@property BOOL backButtonPressed;
@property NSString *currentPaneID;
@property BOOL loadIITCNeeded;
@end

@implementation MainViewController
@synthesize webView;
@synthesize webProgressView;

- (void)viewDidLoad {
    [super viewDidLoad];
    _viewController = self;
    // Do any additional setup after loading the view, typically from a nib.
    self.backPane = [[NSMutableArray alloc] init];
    self.currentPaneID = @"map";
    self.loadIITCNeeded = YES;

    self.location = [[IITCLocation alloc] initWithCallback:self];
    self.webView = [[IITCWebView alloc] initWithFrame:CGRectZero];
    self.webView.UIDelegate = self;
    self.webView.navigationDelegate = self;
    self.webProgressView = [[UIProgressView alloc] initWithFrame:CGRectZero];
    self.webView.translatesAutoresizingMaskIntoConstraints = NO;
    self.webProgressView.translatesAutoresizingMaskIntoConstraints = NO;

    NSMutableArray *constraits = [[NSMutableArray alloc] init];

    [self.view addSubview:self.webView];
    [self.view addSubview:self.webProgressView];

    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[webView]-0-|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(webView)]];
    id topGuide = self.topLayoutGuide;
    id bottomGuide = self.bottomLayoutGuide;
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|[topGuide]-0-[webView]-0-[bottomGuide]|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(topGuide, webView, bottomGuide)]];
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[webProgressView]-0-|" options:0 metrics:nil views:NSDictionaryOfVariableBindings(webProgressView)]];
    [constraits addObjectsFromArray:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|[topGuide]-0-[webProgressView]" options:0 metrics:nil views:NSDictionaryOfVariableBindings(topGuide, webProgressView)]];
    [self.view addConstraints:constraits];
    [self.webProgressView setProgress:0.0];

    [self.webView addObserver:self forKeyPath:@"estimatedProgress" options:NSKeyValueObservingOptionNew context:NULL];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(bootFinished) name:JSNotificationBootFinished object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(setCurrentPane:) name:JSNotificationPaneChanged object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(setIITCProgress:) name:JSNotificationProgressChanged object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(reloadIITC) name:JSNotificationReloadRequired object:nil];

    self.backButton = [[UIBarButtonItem alloc] initWithTitle:@"back" style:UIBarButtonItemStyleDone target:self action:@selector(backButtonPressed:)];
    UIBarButtonItem *menuButton = [[UIBarButtonItem alloc] initWithTitle:@"Menu" style:UIBarButtonItemStylePlain target:self action:@selector(menuButtonPressed:)];

    UIBarButtonItem *settingButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"ic_settings_applications"] style:UIBarButtonItemStylePlain target:self action:@selector(settingButtonPressed:)];
    UIBarButtonItem *locationButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"ic_my_location"] style:UIBarButtonItemStylePlain target:self action:@selector(locationButtonPressed:)];
    UIBarButtonItem *reloadButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemRefresh target:self action:@selector(reloadButtonPressed:)];
    self.navigationItem.leftBarButtonItems = @[self.backButton, menuButton];
    [self.backButton setEnabled:NO];
    self.navigationItem.rightBarButtonItems = @[settingButton, locationButton, reloadButton];

    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"https://www.ingress.com/intel"]]];

}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
};

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
    return YES;
}

+ (instancetype)sharedInstance {
    return _viewController;
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
    if ([keyPath isEqualToString:@"estimatedProgress"]) {
        double progress = self.webView.estimatedProgress;
        if (progress >= 0.8) {
            if ([self.webView.URL.host containsString:@"ingress"] && self.loadIITCNeeded) {
                [self.webView loadScripts];
                self.loadIITCNeeded = NO;
            }

        }

        [self.webProgressView setProgress:progress animated:YES];
        if (progress == 1.0) {
            [UIView animateWithDuration:1 animations:^{
                self.webProgressView.alpha = 0;
            }];
        } else {
            self.webProgressView.alpha = 1;
        }
    }
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration {
    self.webView.frame = [[UIScreen mainScreen] bounds];
}

- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler {
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:message
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    [alertController addAction:[UIAlertAction actionWithTitle:@"OK"
                                                        style:UIAlertActionStyleCancel
                                                      handler:^(UIAlertAction *action) {
                                                          completionHandler();
                                                      }]];
    [self presentViewController:alertController animated:YES completion:^{
    }];
}

- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString

*))completionHandler {

    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:prompt message:webView.URL.host preferredStyle:UIAlertControllerStyleAlert];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.text = defaultText;
    }];

    [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil) style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
        NSString * input = ((UITextField *) alertController.textFields.firstObject).text;
        completionHandler(input);
    }]];

    [alertController addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"Cancel", nil) style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
        completionHandler(nil);
    }]];
    [self presentViewController:alertController animated:YES completion:nil];
}

- (void)bootFinished {
    IITCLocationMode mode = [[NSUserDefaults standardUserDefaults] integerForKey:@"pref_user_location_mode"];
    [self.location setLocationMode:mode];
    [self getLayers];
}

- (void)switchToPane:(NSString *)pane {
    [self.webView loadJS:[NSString stringWithFormat:@"window.show('%@')", pane]];
}

- (void)menuButtonPressed:(id)sender {
    UINavigationController *temp = [[UINavigationController alloc] init];
    [temp pushViewController:[LayersTableViewController sharedInstance] animated:NO];
    temp.modalPresentationStyle = UIModalPresentationPopover;
    temp.popoverPresentationController.barButtonItem = sender;
    [self presentViewController:temp animated:YES completion:nil];
}

- (void)backButtonPressed:(id)aa {
    if ([self.backPane count]) {
        NSString * pane = [self.backPane lastObject];
        [self.backPane removeLastObject];
        [self switchToPane:pane];
        self.backButtonPressed = true;
    }
    if (![self.backPane count]) {
        [self.backButton setEnabled:NO];
    }
}

- (void)settingButtonPressed:(id)aa {
    SettingsViewControllerNew *vc = [SettingsViewControllerNew new];
    vc.neverShowPrivacySettings = YES;
    vc.showDoneButton = NO;
    [self.navigationController pushViewController:vc animated:YES];
}

- (void)locationButtonPressed:(id)aa {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    BOOL prefPersistentZoom = [defaults boolForKey:@"pref_persistent_zoom"];
    [self.webView loadJS:[NSString stringWithFormat:@"window.map.locate({setView : true%@});", prefPersistentZoom ? @", maxZoom : map.getZoom()" : @""]];
}

- (void)reloadButtonPressed:(id)aa {
    [self reloadIITC];
}

- (void)reloadIITC {
    self.loadIITCNeeded = YES;
    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"https://www.ingress.com/intel"]]];
}

- (void)setCurrentPane:(NSNotification *)notification {
    NSString * pane = notification.userInfo[@"paneID"];

    if ([pane isEqualToString:self.currentPaneID]) return;

    // map pane is top-lvl. clear stack.
    if ([pane isEqualToString:@"map"]) {
        self.backPane.removeAllObjects;
    }
        // don't push current pane to backstack if this method was called via back button
    else if (!self.backButtonPressed) {
        [self.backPane addObject:self.currentPaneID];
        [self.backButton setEnabled:YES];
    }

    self.backButtonPressed = NO;
    _currentPaneID = pane;
}

- (void)getLayers {
    [self.webView loadJS:@"window.layerChooser.getLayers()"];
}

- (void)setIITCProgress:(NSNotification *)notification {
    NSNumber * progress = notification.userInfo[@"data"];
    if ([progress doubleValue] != -1) {
        [UIApplication sharedApplication].networkActivityIndicatorVisible = NO;
    } else {
        [UIApplication sharedApplication].networkActivityIndicatorVisible = YES;
    }
}

@end
