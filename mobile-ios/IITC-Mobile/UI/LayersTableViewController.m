//
//  LayersTableViewController.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/26.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "LayersTableViewController.h"
#import "MainViewController.h"
#import "IITCWebView.h"
#import "JSHandler.h"

static LayersTableViewController *_instance;

@interface LayersTableViewController ()
@property NSUInteger currentBase;
@property(strong) NSMutableArray *baseLayers;
@property(strong) NSMutableArray *overlayLayers;
@end

@implementation LayersTableViewController

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    self = [super initWithCoder:aDecoder];
    _instance = self;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(setLayers:) name:JSNotificationLayersGot object:nil];
    self.currentBase = 0;
    self.baseLayers = [[NSMutableArray alloc] init];
    self.overlayLayers = [[NSMutableArray alloc] init];
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;

    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
};

+ (instancetype)sharedInstance {
    return _instance;
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)setLayers:(NSNotification *)notification {
    NSArray * layers = notification.userInfo[@"layers"];
    NSError * error;
    self.baseLayers = [[NSMutableArray alloc] init];
    self.overlayLayers = [[NSMutableArray alloc] init];
    NSArray * temp = [[NSMutableArray alloc] initWithArray:[NSJSONSerialization JSONObjectWithData:[((NSString *) layers[0]) dataUsingEncoding:NSASCIIStringEncoding] options:kNilOptions error:&error]];
    for (NSDictionary *layer in temp) {
        [self.baseLayers addObject:[NSMutableDictionary dictionaryWithDictionary:layer]];
        if ([(NSNumber *) layer[@"active"] boolValue]) {
            self.currentBase = self.baseLayers.count - 1;
        }
    }

    temp = [[NSMutableArray alloc] initWithArray:[NSJSONSerialization JSONObjectWithData:[((NSString *) layers[1]) dataUsingEncoding:NSASCIIStringEncoding] options:kNilOptions error:&error]];
    for (NSDictionary *layer in temp) {
        [self.overlayLayers addObject:[NSMutableDictionary dictionaryWithDictionary:layer]];
    }
    [self.tableView reloadData];
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return 3;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    switch (section) {
        case 0:
            return 4;
        case 1:
            return self.baseLayers.count;
        case 2:
            return self.overlayLayers.count;
        default:
            break;
    }
    return 0;
}

- (nullable NSString *)tableView:(nonnull UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    switch (section) {
        case 0:
            return @"Panels";
        case 1:
            return @"BASE LAYERS";
        case 2:
            return @"OVERLAY LAYERS";
        default:
            break;
    }
    return nil;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    switch (indexPath.section) {
        case 0: {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"panelCell" forIndexPath:indexPath];
            switch (indexPath.row) {
                case 0:
                    cell.textLabel.text = @"Info";
                    break;
                case 1:
                    cell.textLabel.text = @"All";
                    break;
                case 2:
                    cell.textLabel.text = @"Faction";
                    break;
                case 3:
                    cell.textLabel.text = @"Alert";
                    break;
                default:
                    break;
            }
            return cell;
        }
        case 1: {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"baseLayerCell" forIndexPath:indexPath];

            // Configure the cell...
            cell.textLabel.text = self.baseLayers[indexPath.row][@"name"];
            if ([(NSNumber *) self.baseLayers[indexPath.row][@"active"] boolValue]) {
                cell.accessoryType = UITableViewCellAccessoryCheckmark;
            }
            return cell;

        }
        case 2: {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"overlayLayerCell" forIndexPath:indexPath];

            // Configure the cell...
            cell.textLabel.text = self.overlayLayers[indexPath.row][@"name"];
            if ([(NSNumber *) self.overlayLayers[indexPath.row][@"active"] boolValue]) {
                cell.accessoryType = UITableViewCellAccessoryCheckmark;
            }
            return cell;

        }
        default:
            break;
    }
    return nil;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    BOOL changed = NO;
    BOOL reloadNeeded = NO;
    switch (indexPath.section) {
        case 0:
            switch (indexPath.row) {
                case 0:
                    [[MainViewController sharedInstance] switchToPane:@"info"];
                    break;
                case 1:
                    [[MainViewController sharedInstance] switchToPane:@"all"];
                    break;

                case 2:
                    [[MainViewController sharedInstance] switchToPane:@"faction"];
                    break;

                case 3:
                    [[MainViewController sharedInstance] switchToPane:@"alerts"];
                    break;

                default:
                    break;
            }
            [self.tableView deselectRowAtIndexPath:indexPath animated:YES];
            [self doneClicked:nil];
            break;

        case 1:
            if (indexPath.row != self.currentBase) {
                self.baseLayers[indexPath.row][@"active"] = @(YES);
                [tableView cellForRowAtIndexPath:indexPath].accessoryType = UITableViewCellAccessoryCheckmark;
                self.baseLayers[self.currentBase][@"active"] = @(NO);
                [tableView cellForRowAtIndexPath:[NSIndexPath indexPathForItem:self.currentBase
                                                                     inSection:1]].accessoryType = UITableViewCellAccessoryNone;
                self.currentBase = indexPath.row;

                [[MainViewController sharedInstance].webView loadJS:[NSString stringWithFormat:@"window.layerChooser.showLayer(%@, true)", self.baseLayers[indexPath.row][@"layerId"]]];
                break;
            }
            break;
        case 2: {
            BOOL temp = ![(NSNumber *) self.overlayLayers[indexPath.row][@"active"] boolValue];
            self.overlayLayers[indexPath.row][@"active"] = @(temp);
            [tableView cellForRowAtIndexPath:indexPath].accessoryType = temp ? UITableViewCellAccessoryCheckmark : UITableViewCellAccessoryNone;
            [[MainViewController sharedInstance].webView loadJS:[NSString stringWithFormat:@"window.layerChooser.showLayer(%@, %@)", self.overlayLayers[indexPath.row][@"layerId"], temp ? @"true" : @"false"]];
            changed = YES;
            break;
        }
        default:
            break;
    }
    [self.tableView deselectRowAtIndexPath:indexPath animated:YES];
}

- (IBAction)doneClicked:(id)sender {
    [self dismissViewControllerAnimated:YES completion:nil];
}


/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath {
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationFade];
    } else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath {
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath {
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
