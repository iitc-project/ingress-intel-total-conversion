<?php
    include_once dirname(__FILE__) . "/ApkStream.php";

    /**
    * Customized ZipArchive for .apk files.
    * @author Tufan Baris YILDIRIM 
    * @TODO  Add ->getResource('file_name'), or getIcon() directly.
    * @todo Override the // extractTo() method. Rewrite all of XML files converted from Binary Xml to text based XML!
    */
    class ApkArchive extends ZipArchive
    {
        /**
        * @var string
        */
        private $filePath;

        /**
        * @var string
        */
        private $fileName;


        public function __construct($file = false)
        {
            if($file && is_file($file))
            {
                $this->open($file);
                $this->fileName = basename($this->filePath = $file);
            }
            else
                throw new Exception($file . " not a regular file");

        } 

        /**
        * Get a file from apk Archive by name.
        * 
        * @param string $name
        * @param int $length
        * @param int $flags
        * @return mixed
        */
        public function getFromName($name,$length = NULL,$flags = NULL)
        {
            if(strtolower(substr($name,-4)) == '.xml')
            {
                $xmlParser = new ApkXmlParser(new ApkStream($this->getStream($name)));
                return $xmlParser->getXmlString();
            }
            else 
                return parent::getFromName($name,$length,$flags);
        }                

        /**
        * Returns an ApkStream whick contains AndroidManifest.xml
        * @return ApkStream
        */
        public function getManifestStream()
        {
            return new ApkStream($this->getStream('AndroidManifest.xml'));
        }

        /**
        * Apk file path.
        * @return string  
        */
        public function getApkPath()
        {
            return $this->filePath; 
        }

        /**
        * Apk file name
        * @return string
        */
        public function getApkName()
        {
            return $this->fileName;
        }


        public function extractTo($destination,$entries = NULL)
        {
            if($extResult = parent::extractTo($destination,$entries))
            {
                //TODO: ApkXmlParser can not parse the main.xml and others! only AndroidManifest.xml
                //return $extResult;

                $xmlFiles = $this->glob_recursive($destination . '/*.xml');


                foreach($xmlFiles as $xmlFile)
                {
                    // TODO : Remove this ifcheck , if ApkXml can parse! amk!
                   if($xmlFile == "AndroidManifest.xml")
                        ApkXmlParser::decompressFile($xmlFile);
                }
            }

            return $extResult;

        }

        // Can Move to the Utils(???) class.
        private function glob_recursive($pattern, $flags = 0)
        {
            $files = glob($pattern, $flags);

            foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR|GLOB_NOSORT) as $dir)
            {
                $files = array_merge($files, $this->glob_recursive($dir.'/'.basename($pattern), $flags));
            }

            return $files;
        }

    }
