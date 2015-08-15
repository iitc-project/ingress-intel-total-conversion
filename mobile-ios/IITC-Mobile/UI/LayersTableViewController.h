//
//  LayersTableViewController.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/26.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface Layer : NSObject
@property(strong) NSString *layerID;
@property(strong) NSString *layerName;
@property BOOL active;
@end

@interface LayersTableViewController : UITableViewController
+ (instancetype)sharedInstance;

- (void)setLayers:(NSArray *)layers;
@end
