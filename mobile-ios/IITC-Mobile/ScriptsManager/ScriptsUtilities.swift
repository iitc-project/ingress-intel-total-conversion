//
// Created by Hubert Zhang on 15/9/25.
// Copyright (c) 2015 IITC. All rights reserved.
//

import Foundation
import RxSwift
import RxCocoa

@objc class ScriptsManagerNew : NSObject {
    static func getJSAttributes(fileContent:String) -> Dictionary<String, String> {
        var attributes = Dictionary<String, String>()
        
        do {
            let range1 = fileContent.rangeOfString("==UserScript==")
            let range2 = fileContent.rangeOfString("==/UserScript==")
            
            var e:NSRegularExpression
            e = try NSRegularExpression(pattern: "//.*?@([^\\s]*)\\s*(.*)", options: NSRegularExpressionOptions(rawValue: 0))
            let header = fileContent.substringWithRange(Range<String.Index>(start: (range1?.endIndex)!.successor(), end: (range2?.startIndex)!))
            for line in header.componentsSeparatedByString("\n") {
                print(line)
                let search = e.matchesInString(line, options: NSMatchingOptions(rawValue: 0), range:NSMakeRange(0, line.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)))
                if (search.count>0) {
                    print(search[0].rangeAtIndex(1))
                    print(search[0].rangeAtIndex(2))
                    var start = line.startIndex.advancedBy(search[0].rangeAtIndex(1).location )
                    var end = start.advancedBy(search[0].rangeAtIndex(1).length-1)
                    let rangeId = line[start ... end]
                    start = line.startIndex.advancedBy(search[0].rangeAtIndex(2).location)
                    end = start.advancedBy(search[0].rangeAtIndex(2).length-1)
                    let rangeDetail = line[start ... end]
                    attributes[rangeId]=rangeDetail
                }
            }
        } catch _ as NSError {
            
        }
        
        print(attributes)
        return attributes
    }
    
    static func updateFiles(paths:[String]) -> Observable<Bool> {
        return create{ observer in
            for path in paths {
                observer.on(.Next(path))
            }
        
        observer.on(.Completed)
        return NopDisposable.instance
    }.map
            { path in
                return ScriptsManager.updateScript(path)
        }
    }
    
    
    //    static func updateFile(path:String) -> Observable<Void> {
    //        var oldAttributes = Dictionary<String, String>()
    //        just(path)
    //            .map
    //            { filePath -> String in
    //                var fileContents: String? = nil
    //                do {
    //                    fileContents = try String(contentsOfFile: filePath, encoding: NSUTF8StringEncoding)
    //                    oldAttributes = getJSAttributes(fileContents!)
    //                    var updateURL = oldAttributes["updateURL"]
    //                    let downloadURL = oldAttributes["downloadURL"]
    //                    if (updateURL == nil) {
    //                        updateURL = downloadURL
    //                    }
    //                    return updateURL!
    //                } catch let e as NSError {
    //
    //                }
    //                return ""
    //            }.filter{ url -> Bool in
    //                return url != ""
    //            }.flatMap{ url -> Observable<(NSData!, NSURLResponse!)> in
    //                return NSURLSession.sharedSession().rx_response(NSURLRequest(URL: NSURL(string: url)!))
    //        }.map{ data, response -> String  in
    //            let newJS = String(withData:data, encoding:NSASCIIStringEncoding)
    //            let newAttributes = getJSAttributes(newJS)
    //            if (newAttributes["version"]?.compare(oldAttributes["version"]!) != nil) {
    //                return ""
    //            } else {
    //                return newAttributes["updateURL"]!
    //            }
    //            }.filter{ url -> Bool in
    //                return url != ""
    //    }
}
