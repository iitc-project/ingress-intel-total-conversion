<?php
    /**
    * @todo : Write comments!
    */
    class ApkAndroidPlatform
    {
        public $level = NULL;
        public $platform = NULL;

        private static $platforms = array(
            2 => array('name' => 'Android 1.1 Platfrom'),
            3 => array('name' => 'Android 1.5 Platfrom'),
            4 => array('name' => 'Android 1.6 Platfrom'),
            5 => array('name' => 'Android 2.0 Platfrom'),
            6 => array('name' => 'Android 2.0.1 Platfrom'),
            7 => array('name' => 'Android 2.1 Platfrom'),
            8 => array('name' => 'Android 2.2 Platfrom'),
            9 => array('name' => 'Android 2.3 Platfrom'),
            10 => array('name' => 'Android 2.3.3 Platfrom'),
            10 => array('name' => 'Android 2.3.3 / 2.3.4 Platfroms'),
            11 => array('name' => 'Android 3.0 Platfroms'),
            12 => array('name' => 'Android 3.1 Platfroms'),
            13 => array('name' => 'Android 3.2 Platfroms'),
            14 => array('name' => 'Android 4.0 Platfroms'),
            14 => array('name' => 'Android 4.0.3 Platfroms'),
        );

        public function __construct($apiLevel)
        {       
            $this->level    = $apiLevel;
            $this->platform = $this->getPlatform();
        }

        /**
        * @return array
        */
        public function getPlatform()
        {
            if(!isset(self::$platforms[$this->level]))
                throw new Exception("Unknown api level.");

            $platform = self::$platforms[$this->level];
            $platform['level'] = $this->level;
            return $platform;
        }

}