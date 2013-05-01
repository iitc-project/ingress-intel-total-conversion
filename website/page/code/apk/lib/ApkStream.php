<?php
    /**
    * @author Tufan Baris YILDIRIM
    * -- descrtiption is coming.
    */
    class ApkStream
    {
        /**
        * file strem, like "fopen"
        * 
        * @var resource
        */
        private $stream;

        /**                                   
        * @param resource $stream File stream.
        * @return ApkStream
        */
        public function __construct($stream)
        {
            if(!is_resource($stream))
                // TODO : the resource type must be a regular file stream resource.
                throw new Exception( "Invalid stream" );

            $this->stream = $stream;
        }

        /**
        * Read the next character from stream.
        * 
        * @param mixed $length
        */
        public function read($length = 1)
        {
            return fread($this->stream,$length);
        }

        /**
        * check if end of filestream
        */
        public function feof()
        {
            return feof($this->stream);
        }

        /**
        * Jump to the index!
        * @param int $offset
        */
        public function seek($offset)
        {
            fseek($this->stream,$offset);
        }

        /**
        * Close the stream
        */
        public function close()
        {
            fclose($this->stream);
        }

        /**
        * Read the next byte
        * @return byte
        */
        public function readByte()
        {
            return ord($this->read());
        }

        /**
        * fetch the remaining byte into an array
        * 
        * @param mixed $count Byte length.
        * @return array
        */
        public function getByteArray($count = null)
        {
            $bytes = array();

            while(!$this->feof() && ($count === null || count($bytes) < $count))
                $bytes[] = $this->readByte();

            return $bytes;
        }
    }
    
