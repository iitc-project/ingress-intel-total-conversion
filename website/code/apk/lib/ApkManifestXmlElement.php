<?php
    class ApkManifestXmlElement extends SimpleXMLElement
    {
        public function getPermissions()
        {
            /**
            * @var ApkManifestXmlElement
            */
            $permsArray = $this->{'uses-permission'};
            
            $perms = array();
            foreach($permsArray as $perm)
            {
                $permAttr = get_object_vars($perm);  
                $objNotationArray = explode('.',$permAttr['@attributes']['name']);
                $permName = trim(end($objNotationArray));
                $perms[$permName] =  ApkManifest::$permissions[$permName];
            }
            
            return $perms;
        }
    }
