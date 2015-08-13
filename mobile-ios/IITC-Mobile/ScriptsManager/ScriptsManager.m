//
//  ScriptsManager.m
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/7/28.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import "ScriptsManager.h"
#import <CoreData/CoreData.h>
#import "Script.h"

static ScriptsManager * _sharedInstance;

@implementation ScriptsManager
+ (instancetype)sharedInstance {
    if (!_sharedInstance) {
        _sharedInstance = [[ScriptsManager alloc] init];
    }
    return _sharedInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSURL *documentsDirectory = [[fileManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
        NSURL *url = [documentsDirectory URLByAppendingPathComponent:@"IITC-Plugins"];
        self.document = [[UIManagedDocument alloc] initWithFileURL:url];
        if ([fileManager fileExistsAtPath:[url path]]) {
            [self.document openWithCompletionHandler:^(BOOL success) {
                
            }];
        } else {
            [self.document saveToURL:url forSaveOperation:UIDocumentSaveForCreating completionHandler:^(BOOL success) {
                
            }];
        }
    }
    return self;
}

- (void)loadLocalFiles {
    NSString * resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString * documentsPath = [resourcePath stringByAppendingPathComponent:@"scripts/plugins"];
    NSError * error;
    NSArray * directoryContents = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:documentsPath error:&error];
    for (NSString *file in directoryContents) {
        NSString *js = [NSString stringWithContentsOfFile:[documentsPath stringByAppendingPathComponent:file] encoding:NSASCIIStringEncoding error:&error];
        NSString *header = @"";
        
        if (js != nil && [js containsString:@"==UserScript=="] && [js containsString:@"==/UserScript=="]) {
            NSMutableDictionary *attributes = [[NSMutableDictionary alloc] init];
            NSRange range = [js rangeOfString:@"==UserScript=="];
            NSRange range1 = [js rangeOfString:@"==/UserScript=="];
            header = [js substringWithRange:NSMakeRange(range.location+range.length, range1.location-range.location-range.length)];
            NSMutableArray * fileLines = [[NSMutableArray alloc] initWithArray:[header componentsSeparatedByString:@"\n"] copyItems: YES];
            for (NSString *line in fileLines) {
                NSRegularExpression *regex = [[NSRegularExpression alloc] initWithPattern:@"//.*?@([^\\s]*)\\s*(.*)" options:0 error:&error];
                NSArray<NSTextCheckingResult *> * matches = [regex matchesInString:line options:0 range:NSMakeRange(0, [line length])];
                if (![matches count]) {
                    continue;
                }
                NSRange range= matches[0].range;
                if(range.location == 0 && range.length == [line length]) {
                    NSString * key = [line substringWithRange:[matches[0] rangeAtIndex:1]];
                    NSString * value= [line substringWithRange:[matches[0] rangeAtIndex:2]];
                    attributes[key] = value;
                }
            }
            
            NSEntityDescription *entityDescription = [NSEntityDescription
                                                      entityForName:@"Script" inManagedObjectContext:self.document.managedObjectContext];
            NSFetchRequest *request = [[NSFetchRequest alloc] init];
            [request setEntity:entityDescription];
            
            // Set example predicate and sort orderings...
            NSPredicate *predicate = [NSPredicate predicateWithFormat:
                                      @"id == %@", attributes[@"id"]];
            [request setPredicate:predicate];
            
            NSError *error;
            NSArray *array = [self.document.managedObjectContext executeFetchRequest:request error:&error];
            Script *script;
            if (![array count])
            {
                script = [NSEntityDescription
                 insertNewObjectForEntityForName:@"Script"
                 inManagedObjectContext:self.document.managedObjectContext];
                script.id =attributes[@"id"];
            } else {
                script = array[0];
            }
            
            if (script.loaded == nil) {
                script.loaded = @(NO);
            }
            
            if (![script.version isEqualToString:attributes[@"version"]]) {
                script.version = attributes[@"version"];
                script.updateURL = attributes[@"updateURL"];
                script.downloadURL = attributes[@"downloadURL"];
                script.name = attributes[@"name"];
                script.category = attributes[@"category"];
                if (!script.category) {
                    script.category = @"Undefined";
                }
                script.scriptDescription = attributes[@"description"];
                script.filePath = file;
            }
            
        }
        
    }
}

- (NSSet<NSString *> *)loadedScripts {
    NSError *error;
    NSFetchRequest *fetchRequest = [[NSFetchRequest alloc] init];
    // Edit the entity name as appropriate.
    NSEntityDescription *entity = [NSEntityDescription entityForName:@"Script" inManagedObjectContext:self.document.managedObjectContext];
    [fetchRequest setEntity:entity];
    [fetchRequest setPredicate:[NSPredicate predicateWithFormat:@"loaded == YES"]];
    NSArray * result = [self.document.managedObjectContext executeFetchRequest:fetchRequest error:&error];
    return [NSSet setWithArray:[result valueForKeyPath:@"filePath"]];
}
@end
