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

+ (NSDictionary *)getScriptInfosFromJS:(NSString *)js {
    NSMutableDictionary *attributes = [[NSMutableDictionary alloc] init];
    NSError *error;
    NSRange range = [js rangeOfString:@"==UserScript=="];
    NSRange range1 = [js rangeOfString:@"==/UserScript=="];
    
    NSString *header = [js substringWithRange:NSMakeRange(range.location+range.length, range1.location-range.location-range.length)];
    NSMutableArray * fileLines = [[NSMutableArray alloc] initWithArray:[header componentsSeparatedByString:@"\n"] copyItems: YES];
    for (NSString *line in fileLines) {
        NSRegularExpression *regex = [[NSRegularExpression alloc] initWithPattern:@"//.*?@([^\\s]*)\\s*(.*)" options:0 error:&error];
        NSArray* matches = [regex matchesInString:line options:0 range:NSMakeRange(0, [line length])];
        if (![matches count]) {
            continue;
        }
        NSRange range= ((NSTextCheckingResult *)matches[0]).range;
        if(range.location == 0 && range.length == [line length]) {
            NSString * key = [line substringWithRange:[matches[0] rangeAtIndex:1]];
            NSString * value= [line substringWithRange:[matches[0] rangeAtIndex:2]];
            attributes[key] = value;
        }
    }
    return attributes;
}

+ (BOOL)copyFileToDocument {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *testFilePath = [(NSString *)paths[0] stringByAppendingPathComponent:@"original/.copied"];
    if ([[NSFileManager defaultManager] fileExistsAtPath:testFilePath]) {
        return YES;
    }
    NSError *error;
    [[NSFileManager defaultManager] createDirectoryAtPath:testFilePath withIntermediateDirectories:YES attributes:nil error:NULL];
    NSString *scriptsPath = [(NSString *)paths[0] stringByAppendingPathComponent:@"original/scripts"];
    NSString *resScriptsPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"scripts"];
    [[NSFileManager defaultManager] copyItemAtPath:resScriptsPath toPath:scriptsPath error:&error];
    if (!error) {
        return YES;
    }
    return NO;
}

- (void)loadLocalFiles {
    if (![ScriptsManager copyFileToDocument]) {
        return;
    }
    
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString * documentsPath = [paths[0] stringByAppendingPathComponent:@"original/scripts/plugins"];
    NSError * error;
    NSArray * directoryContents = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:documentsPath error:&error];
    for (NSString *file in directoryContents) {
        if ([file hasSuffix:@"meta.js"]) {
            continue;
        }
        NSString *js = [NSString stringWithContentsOfFile:[documentsPath stringByAppendingPathComponent:file] encoding:NSASCIIStringEncoding error:&error];
        NSString *header = @"";
        
        if (js != nil && [js containsString:@"==UserScript=="] && [js containsString:@"==/UserScript=="]) {
            NSDictionary *attributes = [ScriptsManager getScriptInfosFromJS:js];
            
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

- (void)update {
    [self updateAllPlugins];
    [self updateMainScript];
    [self loadedScripts];
}

- (void)updateAllPlugins {
    NSEntityDescription *entityDescription = [NSEntityDescription
                                              entityForName:@"Script" inManagedObjectContext:self.document.managedObjectContext];
    NSFetchRequest *request = [[NSFetchRequest alloc] init];
    [request setEntity:entityDescription];
    
    NSError *error;
    NSArray *array = [self.document.managedObjectContext executeFetchRequest:request error:&error];
    for (Script *script in array) {
        [ScriptsManager updateScript:script.filePath];
    }
    
    return;
}

- (void)updateMainScript {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *testFilePath = [(NSString *)paths[0] stringByAppendingPathComponent:@"original/total-conversion-build.user.js"];
    if(![[NSFileManager defaultManager] fileExistsAtPath:testFilePath]) {
        return;
    }
    [ScriptsManager updateScript:testFilePath];
}

- (NSArray<NSString *> *)getAllScriptsPath {
    NSEntityDescription *entityDescription = [NSEntityDescription
                                              entityForName:@"Script" inManagedObjectContext:self.document.managedObjectContext];
    NSFetchRequest *request = [[NSFetchRequest alloc] init];
    [request setEntity:entityDescription];
    
    NSError *error;
    NSArray *array = [self.document.managedObjectContext executeFetchRequest:request error:&error];
    NSMutableArray *temp = [[NSMutableArray alloc] init];
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *scriptsPath = [(NSString *)paths[0] stringByAppendingPathComponent:@"original/scripts/plugins"];
    [temp addObject:[(NSString *)paths[0] stringByAppendingPathComponent:@"original/scripts/total-conversion-build.user.js"]];
    for (Script *script in array) {
        [temp addObject:[scriptsPath stringByAppendingPathComponent: script.filePath]];
    }
    return temp;
}

- (NSSet *)loadedScripts {
    NSError *error;
    NSFetchRequest *fetchRequest = [[NSFetchRequest alloc] init];
    // Edit the entity name as appropriate.
    NSEntityDescription *entity = [NSEntityDescription entityForName:@"Script" inManagedObjectContext:self.document.managedObjectContext];
    [fetchRequest setEntity:entity];
    [fetchRequest setPredicate:[NSPredicate predicateWithFormat:@"loaded == YES"]];
    NSArray * result = [self.document.managedObjectContext executeFetchRequest:fetchRequest error:&error];
    return [NSSet setWithArray:[result valueForKeyPath:@"filePath"]];
}

+ (BOOL)updateScript:(NSString *)filePath {
    NSError *error = nil;
    NSString * file = [NSString stringWithContentsOfFile:filePath encoding:NSASCIIStringEncoding error:&error];
    if (error) {
        return NO;
    }
    NSDictionary *attributes = [self getScriptInfosFromJS:file];
    NSString* updateURL = attributes[@"updateURL"];
    NSString* downloadURL = attributes[@"downloadURL"];
    if (updateURL == nil) updateURL = downloadURL;

    if (updateURL == nil) {
        return NO;
    }
    
    NSURL *url = [NSURL URLWithString:updateURL];
    NSURLResponse *response;
    NSData *temp = [NSURLConnection sendSynchronousRequest:[NSURLRequest requestWithURL:url] returningResponse:&response error:&error];
    NSString *updatedJSMeta = [[NSString alloc] initWithData:temp encoding:NSASCIIStringEncoding];
    NSDictionary *updatedAttributes = [self getScriptInfosFromJS:updatedJSMeta];
    NSLog(@"Old version:%@\nNew Version:%@", attributes[@"version"], updatedAttributes[@"version"]);
    if (![attributes[@"version"] compare:updatedAttributes[@"version"] options:NSLiteralSearch]) {
        return NO;
    }
    NSString *updatedJS;
    if ([updateURL isEqualToString: downloadURL]) {
        updatedJS = updatedJSMeta;
    } else {
        if (updatedAttributes[@"downloadURL"] != nil) {
            downloadURL = updatedAttributes[@"downloadURL"];
        }
        
//        if (!isUpdateAllowed(downloadURL)) return false;
        
        NSURL *downloadUrl = [NSURL URLWithString:downloadURL];
        NSURLResponse *tempResponse;
        NSData *temp = [NSURLConnection sendSynchronousRequest:[NSURLRequest requestWithURL:downloadUrl] returningResponse:&tempResponse error:&error];
        updatedJS = [[NSString alloc] initWithData:temp encoding:NSASCIIStringEncoding];
    }
    [updatedJS writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
    if (error) {
        return NO;
    }
    return YES;
    
}
@end
