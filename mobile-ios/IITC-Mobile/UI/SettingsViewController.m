//
//  SettingsViewController.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/28.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "SettingsViewController.h"
#import "PluginsTableViewController.h"
#import "ScriptsManager.h"

@interface SettingsViewController ()

@end

@implementation SettingsViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.delegate = self;
    // Do any additional setup after loading the view.
}

- (void)dealloc {
//    [self synchronizeSettings];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)settingsViewController:(IASKAppSettingsViewController *)sender buttonTappedForSpecifier:(IASKSpecifier *)specifier {
    NSLog(specifier.key);
    if ([specifier.key isEqualToString:@"pref_plugins"]) {
        if (self.storyboard) {
            NSLog(@".....");
        }
        PluginsTableViewController *vc = [self.navigationController.storyboard instantiateViewControllerWithIdentifier:@"pluginsViewController"];
        [self.navigationController pushViewController:vc animated:YES];
    } else if ([specifier.key isEqualToString:@"pref_update"]) {
        [[ScriptsManager sharedInstance] update];
    }
}

- (void)settingsViewControllerDidEnd:(IASKAppSettingsViewController *)sender {
//    [self synchronizeSettings];
}


/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
