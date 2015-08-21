//
//  IITCLocation.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "IITCLocation.h"
#import "MainViewController.h"
#import "IITCWebView.h"

@interface IITCLocation ()
@property (strong) CLLocationManager*locationManager;
@property (weak) MainViewController *viewController;
@property IITCLocationMode currentMode;
@end

@implementation IITCLocation
@synthesize locationManager;

- (instancetype)initWithCallback:(MainViewController *)viewController {
    self = [super init];
    if (self) {
        self.viewController = viewController;
        if (nil == locationManager)
            locationManager = [[CLLocationManager alloc] init];
        
        locationManager.delegate = self;
        locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters;
        
        // Set a movement threshold for new events.
        locationManager.distanceFilter = 1; // meters
        
        NSLog(@"Location:%@", [[locationManager location] description]);
    }
    return self;
}

- (void)setLocationMode:(IITCLocationMode)mode {
    if (self.currentMode == kIITCLocationModeNotShow) {
        [self startUpdate];
        //
    } else if (mode == kIITCLocationModeNotShow) {
        [self stopUpdate];
        //
    }
    self.currentMode = mode;
}

- (void)startUpdate {
    if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusNotDetermined) {
        [locationManager requestWhenInUseAuthorization];
    }
    [locationManager startUpdatingLocation];
}

- (void)stopUpdate {
    [locationManager stopUpdatingLocation];
}

- (void)locationManager:(CLLocationManager *)manager
     didUpdateLocations:(NSArray *)locations{
//    NSLog(@"Location:%@", [[manager location] description]);
    CLLocation* location = [manager location] ;
    if (self.currentMode != kIITCLocationModeNotShow) {
        [self.viewController.webView loadJS:[NSString stringWithFormat:@"if(window.plugin && window.plugin.userLocation)\nwindow.plugin.userLocation.onLocationChange(%f, %f);", location.coordinate.latitude, location.coordinate.longitude ]];

    }
    if (self.currentMode == kIITCLocationModeShowPositionAndOrientation) {
        [self.viewController.webView loadJS:[NSString stringWithFormat:@"if(window.plugin && window.plugin.userLocation)\nwindow.plugin.userLocation.onOrientationChange(%f);", location.course]];

    }
}

- (void)locationManager:(CLLocationManager *)manager
       didUpdateHeading:(CLHeading *)newHeading {
    NSLog(@"Heading:%@", [newHeading description]);
}

- (void)locationManager:(nonnull CLLocationManager *)manager didFailWithError:(nonnull NSError *)error {
    NSLog([error debugDescription]);
}
@end
