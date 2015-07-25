import re


js = open('total-conversion-build.user.js', "r")
string = js.read()
# print(string)
prog = re.compile('android\.([^\(\) ]*\([^\(\)]*\))', flags=re.MULTILINE)
result = prog.findall(string)
print(result)
s = set()
for a in result:
    s.add(a)
for b in s:
    name = b.split('(')[0]
    arguments = b.split('(')[1].split(')')[0]
    args=[]
    for arg in arguments.split(','):
        arg = arg.replace(' ','')
        if arg in {'true', 'false'}:
            args.append("boolValue")
        elif arg != "":
            args.append(arg)
    argstring = arguments
    argsstring = '\"\"'
    if len(args)>1:
        argsstring="["+','.join(args)+"]"
    elif len(args)==1:
        argsstring=args[0]
    temp = """
    this.{name}={name};
    function {name}({argstring}){{
        window.webkit.messageHandlers.ios.postMessage({{function: "{name}", args:{args}}});
    }};"""
    print(temp.format(name=name,argstring=argstring, args=argsstring))