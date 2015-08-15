//
//  PluginsTableViewController.h
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/28.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>

@interface PluginsTableViewCell : UITableViewCell
@property(weak, nonatomic) IBOutlet UILabel *titleLabel;
@property(weak, nonatomic) IBOutlet UILabel *subtitleLabel;
@end

@interface PluginsTableViewController : UITableViewController <NSFetchedResultsControllerDelegate>
@property(strong, nonatomic) NSFetchedResultsController *fetchedResultsController;
@property(strong, nonatomic) NSManagedObjectContext *managedObjectContext;

@end
