//
//  Script+CoreDataProperties.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/28.
//  Copyright © 2015年 IITC. All rights reserved.
//
//  Delete this file and regenerate it using "Create NSManagedObject Subclass…"
//  to keep your implementation up to date with your model.
//

#import "Script.h"

NS_ASSUME_NONNULL_BEGIN

@interface Script (CoreDataProperties)

@property (nullable, nonatomic, retain) NSString *id;
@property (nullable, nonatomic, retain) NSString *version;
@property (nullable, nonatomic, retain) NSString *name;
@property (nullable, nonatomic, retain) NSString *category;
@property (nullable, nonatomic, retain) NSString *scriptDescription;
@property (nullable, nonatomic, retain) NSString *filePath;
@property (nullable, nonatomic, retain) NSString *downloadURL;
@property (nullable, nonatomic, retain) NSString *updateURL;
@property (nullable, nonatomic, retain) NSNumber *loaded;

@end

NS_ASSUME_NONNULL_END
