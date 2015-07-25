//
//  IITCLocation.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/25.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
@class ViewController;
@interface IITCLocation : NSObject<CLLocationManagerDelegate>
- (instancetype)initWithCallback:(ViewController *)viewController;
-(void) startUpdate;
-(void) stopUpdate;
@end
