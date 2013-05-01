<?php
    include_once dirname(__FILE__) . "/lib/ApkArchive.php";  
    include_once dirname(__FILE__) . "/lib/ApkXmlParser.php";
    include_once dirname(__FILE__) . "/lib/ApkManifest.php";

    /**
    * @author Tufan Baris YILDIRIM
    * @version v0.1
    * @since 27.03.2012
    * @link https://github.com/tufanbarisyildirim/php-apk-parser
    * 
    * Main Class.
    * - Set the apk path on construction,
    * - Get the Manifest object.
    * - Print the Manifest XML.
    * 
    * @todo  Add getPackageName();
    * @todo  Add getVersion();
    * @todo  Add getUsesSdk();
    * @todo  Add getMinSdk();
    */
    class ApkParser
    {
        /**
        * @var ApkArchive
        */
        private $apk;

        /**
        * AndrodiManifest.xml
        * 
        * @var ApkManifest
        */
        private $manifest;

        public function __construct($apkFile)
        {
            $this->apk      = new ApkArchive($apkFile);
            $this->manifest = new ApkManifest(new ApkXmlParser($this->apk->getManifestStream()));
        }

        /**
        * Get Manifest Object
        * @return ApkManifest 
        */
        public function getManifest()
        {
            return $this->manifest;
        }

        /**
        * Get the apk. Zip handler. 
        * - Extract all(or sp. entries) files,
        * - add file,
        * - recompress
        * - and other ZipArchive features.
        * 
        * @return ApkArchive
        */
        public function getApkArchive()
        {
            return $this->apk;
        }  

        /**
        * Extract apk content directly
        * 
        * @param mixed $destination
        * @param array $entries
        * @return bool
        */
        public function extractTo($destination,$entries = NULL)
        {
             return $this->apk->extractTo($destination,$entries);
        }
}