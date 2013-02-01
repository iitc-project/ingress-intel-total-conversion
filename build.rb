#!/usr/bin/env ruby
# encoding: utf-8

c = Dir.glob('code/*').map { |f| File.read(f) }
n = Time.now.strftime('%Y-%m-%d-%H%M%S')
m = File.read('main.js').gsub('@@BUILDDATE@@', n)
m = m.split('@@INJECTHERE@@')
t = m.insert(1, c).flatten.join("\n\n")
File.open('total-conversion-build.user.js', 'w') {|f| f.write(t) }
