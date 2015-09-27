//
//  SettingsViewControllerNew.swift
//  IITC-Mobile
//
//  Created by Hubert Zhang on 15/9/27.
//  Copyright © 2015年 IITC. All rights reserved.
//

import UIKit
import RxSwift
import RxCocoa
import RxBlocking
import InAppSettingsKit

@objc class SettingsViewControllerNew: IASKAppSettingsViewController,IASKSettingsDelegate {
    override func viewDidLoad() {
        self.delegate = self
    }
    
    func settingsViewController(sender: IASKAppSettingsViewController!, buttonTappedForSpecifier specifier: IASKSpecifier!) {
        if (specifier.key() == "pref_plugins") {
            let vc = self.navigationController!.storyboard!.instantiateViewControllerWithIdentifier("pluginsViewController")
            self.navigationController!.pushViewController(vc, animated:true)
        } else if (specifier.key() == "pref_update") {
            
            ScriptsManagerNew.updateFiles(ScriptsManager.sharedInstance().getAllScriptsPath()).subscribeOn(SerialDispatchQueueScheduler.init(internalSerialQueueName: "com.cradle.IITC-Mobile.network")).observeOn(MainScheduler.sharedInstance).subscribe(next: { (result) -> Void in
                    print("1")
                }, error: { (e) -> Void in
                    print(e)
                }, completed: { () -> Void in
                    print("complete")
                }, disposed: { () -> Void in
                    print("??")
            })
            
        }
    }
    
    func settingsViewControllerDidEnd(sender: IASKAppSettingsViewController!) {
        
    }
}
