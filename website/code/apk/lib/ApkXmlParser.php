<?php
    include_once dirname(__FILE__) . "/ApkStream.php";

    class ApkXmlParser 
    {    
        const END_DOC_TAG    = 0x00100101;
        const START_TAG      = 0x00100102;
        const END_TAG        = 0x00100103;

        private $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n";
        private $bytes = array();
        private $ready = false;

        public static $indent_spaces  = "                                             ";

        /**
        * Store the SimpleXmlElement object
        * @var SimpleXmlElement
        */
        private $xmlObject = NULL;


        public function __construct(ApkStream $apkStream)
        {
            $this->bytes = $apkStream->getByteArray();
        }

        public static function decompressFile($file,$destination = NULL)
        {
            if(!is_file($file))
                throw new Exception("{$file} is not a regular file");

            $parser = new self(new ApkStream(fopen($file,'rd')));
            //TODO : write a method in this class, ->saveToFile();
            file_put_contents($destination === NULL ?  $file : $destination,$parser->getXmlString());
        }

        public function decompress() 
        {
            $numbStrings    = $this->littleEndianWord($this->bytes, 4*4);
            $sitOff         = 0x24; 
            $stOff          = $sitOff + $numbStrings * 4;
            $this->bytesTagOff      = $this->littleEndianWord($this->bytes, 3*4);

            for ($ii = $this->bytesTagOff; $ii < count($this->bytes) - 4; $ii += 4):
                if ($this->littleEndianWord($this->bytes, $ii) == self::START_TAG) :
                    $this->bytesTagOff = $ii;  
                    break;
                    endif;
                endfor;



            $off            = $this->bytesTagOff;
            $indentCount   = 0;
            $startTagLineNo = -2;

            while ($off < count($this->bytes)) 
            {
                $currentTag     = $this->littleEndianWord($this->bytes, $off);
                $lineNo         = $this->littleEndianWord($this->bytes, $off + 2*4);
                $nameNsSi       = $this->littleEndianWord($this->bytes, $off + 4*4);
                $nameSi         = $this->littleEndianWord($this->bytes, $off + 5*4); 


                switch($currentTag)
                {
                    case self::START_TAG:
                    {
                        $tagSix         = $this->littleEndianWord($this->bytes, $off + 6*4);
                        $numbAttrs      = $this->littleEndianWord($this->bytes, $off + 7*4); 
                        $off           += 9*4;
                        $tagName       = $this->compXmlString($this->bytes, $sitOff, $stOff, $nameSi);
                        $startTagLineNo = $lineNo;
                        $attr_string    = ""; 

                        for ($ii=0; $ii < $numbAttrs; $ii++) 
                        {
                            $attrNameNsSi   = $this->littleEndianWord($this->bytes, $off);  
                            $attrNameSi     = $this->littleEndianWord($this->bytes, $off + 1*4);
                            $attrValueSi    = $this->littleEndianWord($this->bytes, $off + 2*4);
                            $attrFlags      = $this->littleEndianWord($this->bytes, $off + 3*4);  
                            $attrResId      = $this->littleEndianWord($this->bytes, $off + 4*4);
                            $off += 5*4;

                            $attrName = $this->compXmlString($this->bytes, $sitOff, $stOff, $attrNameSi);
                            if($attrValueSi != 0xffffffff)
                                $attrValue =  $this->compXmlString($this->bytes, $sitOff, $stOff, $attrValueSi);
                            else
                                $attrValue  = "0x" . dechex($attrResId);

                            $attr_string .= " " . $attrName . "=\"" . $attrValue . "\"";

                        }

                        $this->appendXmlIndent($indentCount, "<". $tagName . $attr_string . ">");
                        $indentCount++;
                    }
                    break;

                    case self::END_TAG:
                    {
                        $indentCount--;
                        $off += 6*4;
                        $tagName = $this->compXmlString($this->bytes, $sitOff, $stOff, $nameSi);
                        $this->appendXmlIndent($indentCount, "</" . $tagName . ">");
                    }
                    break;

                    case self::END_DOC_TAG:
                    {
                        $this->ready = true; 
                        break 2;
                    }
                    break; 

                    default:
                        throw new Exception("Unrecognized tag code '"  . dechex($currentTag) . "' at offset " . $off);
                        break;
                }


            }  

        }

        public function compXmlString($xml, $sitOff, $stOff, $str_index) 
        {
            if ($str_index < 0) 
                return null;

            $strOff = $stOff + $this->littleEndianWord($xml, $sitOff + $str_index * 4);
            return $this->compXmlStringAt($xml, $strOff);
        }

        public function appendXmlIndent($indent, $str) 
        {
            $this->appendXml(substr(self::$indent_spaces,0, min($indent * 2, strlen(self::$indent_spaces)))  .  $str);
        }

        public function appendXml($str)
        {
            $this->xml .= $str ."\r\n";
        }

        public function compXmlStringAt($arr, $string_offset) 
        {
            $strlen = $arr[$string_offset + 1] << 8 & 0xff00 | $arr[$string_offset] & 0xff;
            $string = "";

            for ($i=0; $i<$strlen; $i++) 
                $string .= chr($arr[$string_offset + 2 + $i * 2]);

            return $string;
        } 

        public function littleEndianWord($arr, $off) 
        {
            return $arr[$off+3] << 24&0xff000000 | $arr[$off+2] << 16&0xff0000 | $arr[$off+1]<<8&0xff00 | $arr[$off]&0xFF;
        }

        public function output()
        {                              
            echo $this->getXmlString();
        } 

        public function getXmlString()
        {
            if(!$this->ready)
                $this->decompress();
            return $this->xml;
        }

        public function getXmlObject($className = 'SimpleXmlElement')
        {  
            if($this->xmlObject === NULL || !$this->xmlObject instanceof $className)
                $this->xmlObject = simplexml_load_string($this->getXmlString(),$className);

            return $this->xmlObject;                       
        }
    }
