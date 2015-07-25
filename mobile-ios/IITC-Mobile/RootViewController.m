//
//  RootViewController.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/26.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "RootViewController.h"
#import "ViewController.h"
#import "LayersTableViewController.h"

@interface RootViewController ()

@end

@implementation RootViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)awakeFromNib {
    self.contentViewController = [self.storyboard instantiateViewControllerWithIdentifier:@"contentViewController"];
    ((ViewController *)((UINavigationController *)self.contentViewController).viewControllers[0]).rootController = self;
    self.leftMenuViewController = [self.storyboard instantiateViewControllerWithIdentifier:@"leftMenuViewController"];
    self.rightMenuViewController = [self.storyboard instantiateViewControllerWithIdentifier:@"rightMenuViewController"];
    self.scaleContentView = NO;
    self.scaleMenuView = NO;
    self.contentViewShadowEnabled = YES;
    self.contentViewShadowColor = [UIColor blackColor];
    self.parallaxEnabled = NO;

}

- (void)setLayers:(NSArray *)layers {
    [((LayersTableViewController *)(((UINavigationController *) self.rightMenuViewController).viewControllers)[0]) setLayers:layers];
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
