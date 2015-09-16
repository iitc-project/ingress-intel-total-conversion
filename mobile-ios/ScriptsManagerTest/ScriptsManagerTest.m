//
//  ScriptsManagerTest.m
//  ScriptsManagerTest
//
//  Created by Hubert Zhang on 15/9/13.
//  Copyright © 2015年 IITC. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "ScriptsManager.h"

@interface ScriptsManagerTest : XCTestCase

@end

@implementation ScriptsManagerTest

- (void)setUp {
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testExample {
    // This is an example of a functional test case.
    // Use XCTAssert and related functions to verify your tests produce the correct results.
    NSString * resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString * documentsPath = [resourcePath stringByAppendingPathComponent:@"scripts/plugins"];
    
    [ScriptsManager updateScript:[documentsPath stringByAppendingString:@"/add-kml.meta.js"]];
}

- (void)testPerformanceExample {
    // This is an example of a performance test case.
    [self measureBlock:^{
        // Put the code you want to measure the time of here.
    }];
}

@end
