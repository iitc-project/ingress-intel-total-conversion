//
//  ScriptsManager.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/28.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>

@interface ScriptsManager : NSObject
@property (strong) UIManagedDocument* document;
+ (instancetype)sharedInstance;
- (void)loadLocalFiles;
- (void)update;
- (NSSet*) loadedScripts;
- (NSArray<NSString *> *)getAllScriptsPath;
+ (BOOL)updateScript:(NSString *)filePath;
@end
